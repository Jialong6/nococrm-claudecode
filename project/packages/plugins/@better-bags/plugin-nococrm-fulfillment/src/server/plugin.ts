/**
 * Better Bags NocoCRM Fulfillment - Server Plugin
 *
 * 职责（M11 + M12）：
 *   1. 加载 3 个 collection（production_progress / qc_reports / shipments）
 *   2. 扩展 orders 增加 customer_inspection_required 字段（T11.05）
 *   3. 核心 db hooks：
 *      - T11.01 production_progress.beforeSave: order 同步 + cumulative_qty 累加
 *      - T11.04 production_progress.afterCreate: issues 非空 → 写 order.notes 标 [PROD_ISSUE]
 *      - T11.06 qc_reports.afterSave: pass=true AND is_final_internal=true → order.status='completed'
 *      - T12.02 shipments.beforeCreate: balance_paid 校验（VIP 例外）
 *      - shipments.afterCreate: order.status='shipping_pending'
 *      - T12.05 shipments.beforeSave: status='shipped' 时三个文件齐套校验
 *      - T12.03/T12.04 shipments.afterUpdate: bl_no 自动填 atd + status 同步推进 order.status
 *
 *   T11.05 验厂任务 / T11.06 邮件 / T12.03 提单号通知 / T12.04 状态推送 由 README 定时工作流配置。
 */

import { Plugin } from '@nocobase/server';
import path from 'path';

const VIP_MIN_ORDERS = 3;
const REQUIRED_SHIPPED_FILES = [
  { field: 'invoice_file', label: '商业发票 Invoice' },
  { field: 'packing_list_file', label: '装箱单 Packing List' },
  { field: 'origin_cert_file', label: '原产地证 Certificate of Origin' },
];

function hasAttachment(value: unknown): boolean {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
  return Boolean(value);
}

export class PluginNocoCRMFulfillmentServer extends Plugin {
  async afterAdd() {}

  beforeLoad() {
    // T11.05：扩展 orders 增加客户验厂字段
    this.db.extendCollection({
      name: 'orders',
      origin: this.options?.packageName ?? '@better-bags/plugin-nococrm-fulfillment',
      fields: [
        {
          type: 'boolean',
          name: 'customer_inspection_required',
          defaultValue: false,
          interface: 'checkbox',
          uiSchema: {
            type: 'boolean',
            title: '客户/第三方验厂',
            'x-component': 'Checkbox',
            description: '勾选后排产开工前会自动给 QC 团队创建验厂任务（README 定时工作流）',
          },
        },
      ],
    });
  }

  async load() {
    await this.importCollections(path.resolve(__dirname, 'collections'));

    this.registerProductionProgressHooks();
    this.registerQcReportHooks();
    this.registerShipmentHooks();

    // ACL
    this.app.acl.allow('production_progress', ['list', 'get'], 'loggedIn');
    this.app.acl.allow('qc_reports', ['list', 'get'], 'loggedIn');
    this.app.acl.allow('shipments', ['list', 'get'], 'loggedIn');

    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: [
        'production_progress:*',
        'qc_reports:*',
        'shipments:*',
      ],
    });
  }

  // ====================================================================
  // production_progress hooks (T11.01 + T11.04)
  // ====================================================================
  private registerProductionProgressHooks() {
    this.db.on('production_progress.beforeSave', async (model: any, options: any) => {
      try {
        // 从 production_plan 同步 order_id
        if (!model.get('order_id') && model.get('production_plan_id')) {
          const plan = await this.db
            .getRepository('production_plans')
            .findOne({ filterByTk: model.get('production_plan_id'), transaction: options?.transaction });
          if (plan?.order_id) model.set('order_id', plan.order_id);
        }

        // cumulative_qty 累计计算
        const planId = model.get('production_plan_id');
        const completed = Number(model.get('completed_qty')) || 0;
        if (planId) {
          const recordDate = model.get('date');
          const previous = await this.db.getRepository('production_progress').find({
            filter: recordDate
              ? { production_plan_id: planId, date: { $lt: recordDate } }
              : { production_plan_id: planId },
            transaction: options?.transaction,
          });
          // 编辑时排除自身记录
          const selfId = model.get('id');
          const prevSum = previous
            .filter((p: any) => p.id !== selfId)
            .reduce((s: number, p: any) => s + (Number(p.completed_qty) || 0), 0);
          model.set('cumulative_qty', prevSum + completed);
        }
      } catch (err) {
        console.error('[nococrm-fulfillment] production_progress.beforeSave failed:', err);
      }
    });

    // T11.04 异常通知（写 order.notes 标记）
    this.db.on('production_progress.afterCreate', async (model: any, options: any) => {
      try {
        const issues = String(model.get('issues') || '').trim();
        if (!issues) return;
        const orderId = model.get('order_id');
        if (!orderId) return;

        const order = await this.db
          .getRepository('orders')
          .findOne({ filterByTk: orderId, transaction: options?.transaction });
        if (!order) return;

        const today = new Date().toISOString().slice(0, 10);
        const tag = `[${today} PROD_ISSUE] ${issues}`;
        await this.db.getRepository('orders').update({
          filterByTk: orderId,
          values: { notes: order.notes ? `${order.notes}\n${tag}` : tag },
          transaction: options?.transaction,
          hooks: false,
        });
      } catch (err) {
        console.error('[nococrm-fulfillment] production_progress.afterCreate T11.04 failed:', err);
      }
    });
  }

  // ====================================================================
  // qc_reports hooks (T11.06)
  // ====================================================================
  private registerQcReportHooks() {
    this.db.on('qc_reports.afterSave', async (model: any, options: any) => {
      try {
        if (!model.get('pass')) return;
        if (!model.get('is_final_internal')) return;

        const orderId = model.get('order_id');
        if (!orderId) return;

        const order = await this.db
          .getRepository('orders')
          .findOne({ filterByTk: orderId, transaction: options?.transaction });
        if (!order) return;

        // 已经是 completed 或更靠后状态，不回滚
        const orderStatusFlow = [
          'deposit_pending',
          'production_pending',
          'in_production',
          'qc_pending',
          'completed',
          'shipping_pending',
          'shipped',
          'delivered',
        ];
        const currentIdx = orderStatusFlow.indexOf(String(order.status));
        const completedIdx = orderStatusFlow.indexOf('completed');
        if (currentIdx >= completedIdx) return;

        await this.db.getRepository('orders').update({
          filterByTk: orderId,
          values: { status: 'completed' },
          transaction: options?.transaction,
          hooks: false,
        });
        // 邮件由 README 定时工作流根据 order.status='completed' 触发，模板 balance-invitation-*
      } catch (err) {
        console.error('[nococrm-fulfillment] qc_reports.afterSave T11.06 failed:', err);
      }
    });
  }

  // ====================================================================
  // shipments hooks (T12.02 + T12.05 + T12.03 + T12.04)
  // ====================================================================
  private registerShipmentHooks() {
    // T12.02 尾款校验（VIP 例外）
    this.db.on('shipments.beforeCreate', async (model: any, options: any) => {
      const orderId = model.get('order_id');
      if (!orderId) {
        throw new Error('shipments 创建必须关联订单（order_id 不能为空）');
      }
      const order = await this.db
        .getRepository('orders')
        .findOne({ filterByTk: orderId, transaction: options?.transaction });
      if (!order) {
        throw new Error(`订单 #${orderId} 不存在`);
      }
      if (order.balance_paid) return; // 已收尾款，放行

      // VIP 判定：customer.status=closed 且历史订单 ≥ 3
      let isVip = false;
      if (order.customer_id) {
        const customer = await this.db
          .getRepository('customers')
          .findOne({ filterByTk: order.customer_id, transaction: options?.transaction });
        if (customer?.status === 'closed') {
          const cnt = await this.db
            .getRepository('orders')
            .count({ filter: { customer_id: order.customer_id }, transaction: options?.transaction });
          isVip = (cnt ?? 0) >= VIP_MIN_ORDERS;
        }
      }
      if (!isVip) {
        throw new Error(
          '未收到尾款，不能创建 shipment（来自 06 知识库：发货前付清）。请财务确认收款后再发货。VIP 客户（已成交 + 历史订单 ≥ 3）例外。',
        );
      }
    });

    // afterCreate：推进 order.status
    this.db.on('shipments.afterCreate', async (model: any, options: any) => {
      try {
        const orderId = model.get('order_id');
        if (!orderId) return;
        await this.db.getRepository('orders').update({
          filterByTk: orderId,
          values: { status: 'shipping_pending' },
          transaction: options?.transaction,
          hooks: false,
        });
      } catch (err) {
        console.error('[nococrm-fulfillment] shipments.afterCreate failed:', err);
      }
    });

    // T12.05 文件齐套校验
    this.db.on('shipments.beforeSave', async (model: any) => {
      const prev = model.previous?.('status');
      const next = model.get('status');
      if (next !== 'shipped' || prev === 'shipped') return;

      const missing = REQUIRED_SHIPPED_FILES.filter(
        ({ field }) => !hasAttachment(model.get(field)),
      ).map((f) => f.label);

      if (missing.length > 0) {
        throw new Error(
          `发货文件不齐：${missing.join(' / ')} 必须上传后才能切换到"已开船"`,
        );
      }
    });

    // T12.03 / T12.04：bl_no 自动填 atd + status 同步 order
    this.db.on('shipments.afterUpdate', async (model: any, options: any) => {
      try {
        // bl_no 从空 → 非空 时自动填 atd
        const prevBl = model.previous?.('bl_no');
        const nextBl = model.get('bl_no');
        if ((!prevBl || String(prevBl).trim() === '') && nextBl && !model.get('atd')) {
          await this.db.getRepository('shipments').update({
            filterByTk: model.get('id'),
            values: { atd: new Date() },
            transaction: options?.transaction,
            hooks: false,
          });
        }

        // status 同步推进 order.status
        const prevStatus = model.previous?.('status');
        const nextStatus = model.get('status');
        if (prevStatus === nextStatus) return;

        const orderId = model.get('order_id');
        if (!orderId) return;

        const shipmentToOrderStatus: Record<string, string> = {
          shipped: 'shipped',
          delivered: 'delivered',
        };
        const orderStatus = shipmentToOrderStatus[String(nextStatus)];
        if (!orderStatus) return;

        await this.db.getRepository('orders').update({
          filterByTk: orderId,
          values: { status: orderStatus },
          transaction: options?.transaction,
          hooks: false,
        });

        // delivered_at 自动填
        if (orderStatus === 'delivered' && !model.get('delivered_at')) {
          await this.db.getRepository('shipments').update({
            filterByTk: model.get('id'),
            values: { delivered_at: new Date() },
            transaction: options?.transaction,
            hooks: false,
          });
        }
      } catch (err) {
        console.error('[nococrm-fulfillment] shipments.afterUpdate failed:', err);
      }
    });
  }

  async install() {}
  async afterEnable() {}
  async afterDisable() {}
  async remove() {}
}

export default PluginNocoCRMFulfillmentServer;
