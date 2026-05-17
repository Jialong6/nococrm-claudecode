/**
 * Better Bags NocoCRM Retention - Server Plugin
 *
 * 职责（M13 + M14）：
 *   1. 加载 3 个 collection（delivery_feedback / internal_retros / long_term_followups）
 *   2. extendCollection：customers 加 last_order_at（T14.03 定时降级看此字段）
 *   3. 4 个 hooks：
 *      - T13.01 delivery_feedback.beforeCreate：从 shipment 同步 order / customer
 *      - T13.04 delivery_feedback.afterSave：score≤2 → risk_flag=true + 写 order.notes；score≥4 → risk_flag=false
 *      - T13.05 orders.afterUpdate：status='delivered' AND balance_paid=true → 推进 customer.status（首单 closed / 多单 maintaining）+ last_order_at
 *      - T14.04 inquiries.afterCreate：customer.status='maintaining' → 切回 'following' + 写 notes
 *
 *   T13.03 14 天感谢信 / T14.01 季度回访 / T14.03 180 天降级 由 README 定时工作流配置。
 */

import { Plugin } from '@nocobase/server';
import path from 'path';

const LOW_SAT_THRESHOLD = 2;
const HIGH_SAT_THRESHOLD = 4;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export class PluginNocoCRMRetentionServer extends Plugin {
  async afterAdd() {}

  beforeLoad() {
    // T14.03 需要的字段
    this.db.extendCollection({
      name: 'customers',
      origin: this.options?.packageName ?? '@better-bags/plugin-nococrm-retention',
      fields: [
        {
          type: 'date',
          name: 'last_order_at',
          interface: 'datetime',
          uiSchema: {
            type: 'string',
            title: '最近下单日',
            'x-component': 'DatePicker',
            'x-component-props': { showTime: true },
            'x-read-pretty': true,
            description: 'hook 维护：order.status=delivered + balance_paid 时自动更新；定时降级看此字段（180 天）',
          },
        },
      ],
    });
  }

  async load() {
    await this.importCollections(path.resolve(__dirname, 'collections'));

    this.registerDeliveryFeedbackHooks();
    this.registerOrderHooks();
    this.registerInquiryHooks();

    // ACL
    this.app.acl.allow('delivery_feedback', ['list', 'get'], 'loggedIn');
    this.app.acl.allow('delivery_feedback', 'create', 'public'); // 允许公共表单提交
    this.app.acl.allow('internal_retros', ['list', 'get'], 'loggedIn');
    this.app.acl.allow('long_term_followups', ['list', 'get'], 'loggedIn');

    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: [
        'delivery_feedback:*',
        'internal_retros:*',
        'long_term_followups:*',
      ],
    });
  }

  // ====================================================================
  // delivery_feedback hooks (T13.04)
  // ====================================================================
  private registerDeliveryFeedbackHooks() {
    // beforeCreate：从 shipment 同步 order / customer
    this.db.on('delivery_feedback.beforeCreate', async (model: any, options: any) => {
      try {
        const shipmentId = model.get('shipment_id');
        if (!shipmentId) return;

        const shipment = await this.db
          .getRepository('shipments')
          .findOne({ filterByTk: shipmentId, transaction: options?.transaction });
        if (!shipment) return;

        if (!model.get('order_id') && shipment.order_id) {
          model.set('order_id', shipment.order_id);
        }

        if (!model.get('customer_id') && shipment.order_id) {
          const order = await this.db
            .getRepository('orders')
            .findOne({ filterByTk: shipment.order_id, transaction: options?.transaction });
          if (order?.customer_id) {
            model.set('customer_id', order.customer_id);
          }
        }
      } catch (err) {
        console.error('[nococrm-retention] delivery_feedback.beforeCreate failed:', err);
      }
    });

    // T13.04 afterSave：低分/高分自动调整 customer.risk_flag
    this.db.on('delivery_feedback.afterSave', async (model: any, options: any) => {
      try {
        const score = Number(model.get('satisfaction_score')) || 0;
        const customerId = model.get('customer_id');
        if (!customerId || score <= 0) return;

        if (score <= LOW_SAT_THRESHOLD) {
          // 低分：标红 + 写 order.notes
          await this.db.getRepository('customers').update({
            filterByTk: customerId,
            values: { risk_flag: true },
            transaction: options?.transaction,
            hooks: false,
          });

          const orderId = model.get('order_id');
          if (orderId) {
            const order = await this.db
              .getRepository('orders')
              .findOne({ filterByTk: orderId, transaction: options?.transaction });
            if (order) {
              const tag = `[${today()} LOW_SATISFACTION] 客户评分 ${score}/5，需补救（业务+QC 经理紧急介入）`;
              await this.db.getRepository('orders').update({
                filterByTk: orderId,
                values: { notes: order.notes ? `${order.notes}\n${tag}` : tag },
                transaction: options?.transaction,
                hooks: false,
              });
            }
          }
        } else if (score >= HIGH_SAT_THRESHOLD) {
          // 高分：清除 risk_flag
          await this.db.getRepository('customers').update({
            filterByTk: customerId,
            values: { risk_flag: false },
            transaction: options?.transaction,
            hooks: false,
          });
        }
      } catch (err) {
        console.error('[nococrm-retention] delivery_feedback.afterSave T13.04 failed:', err);
      }
    });
  }

  // ====================================================================
  // orders.afterUpdate (T13.05)
  // ====================================================================
  private registerOrderHooks() {
    this.db.on('orders.afterUpdate', async (model: any, options: any) => {
      try {
        const prevStatus = model.previous?.('status');
        const nextStatus = model.get('status');
        const prevBalancePaid = model.previous?.('balance_paid');
        const nextBalancePaid = model.get('balance_paid');

        const justDelivered = prevStatus !== 'delivered' && nextStatus === 'delivered';
        const justBalancePaid =
          prevBalancePaid === false && nextBalancePaid === true && nextStatus === 'delivered';

        if (!justDelivered && !justBalancePaid) return;

        // 必须 delivered + balance_paid 才推进
        if (nextStatus !== 'delivered' || !nextBalancePaid) return;

        const customerId = model.get('customer_id');
        if (!customerId) return;

        // 判断首单 vs 多单
        const deliveredCnt = await this.db.getRepository('orders').count({
          filter: { customer_id: customerId, status: 'delivered' },
          transaction: options?.transaction,
        });

        const updates: Record<string, unknown> = {
          last_order_at: new Date(),
        };
        if ((deliveredCnt ?? 0) <= 1) {
          updates.status = 'closed'; // 首单完成
        } else {
          updates.status = 'maintaining'; // 多单 → 长期维护
        }

        await this.db.getRepository('customers').update({
          filterByTk: customerId,
          values: updates,
          transaction: options?.transaction,
          hooks: false,
        });
      } catch (err) {
        console.error('[nococrm-retention] orders.afterUpdate T13.05 failed:', err);
      }
    });
  }

  // ====================================================================
  // inquiries.afterCreate (T14.04)
  // ====================================================================
  private registerInquiryHooks() {
    this.db.on('inquiries.afterCreate', async (model: any, options: any) => {
      try {
        const customerId = model.get('customer_id');
        if (!customerId) return;

        const customer = await this.db
          .getRepository('customers')
          .findOne({ filterByTk: customerId, transaction: options?.transaction });
        if (!customer || customer.status !== 'maintaining') return;

        const inquiryNo = model.get('inquiry_no') || `#${model.get('id')}`;
        const tag = `[${today()} LONG_TERM_REQUEST] 长期维护客户产生新询盘 ${inquiryNo}，已切回跟进中，请优先处理`;

        await this.db.getRepository('customers').update({
          filterByTk: customerId,
          values: {
            status: 'following',
            last_contact_at: new Date(),
            notes: customer.notes ? `${customer.notes}\n${tag}` : tag,
          },
          transaction: options?.transaction,
          hooks: false,
        });
      } catch (err) {
        console.error('[nococrm-retention] inquiries.afterCreate T14.04 failed:', err);
      }
    });
  }

  async install() {}
  async afterEnable() {}
  async afterDisable() {}
  async remove() {}
}

export default PluginNocoCRMRetentionServer;
