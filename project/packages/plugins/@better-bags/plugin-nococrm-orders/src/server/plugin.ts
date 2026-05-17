/**
 * Better Bags NocoCRM Orders & Production - Server Plugin
 *
 * 职责（M9 + M10）：
 *   1. 加载 5 个 collection（contracts / orders / payments / materials / production_plans）
 *   2. 关键 db hooks（启用即生效，无需 UI 工作流）：
 *      - contracts.beforeCreate：从 quotation 自动同步 customer / total_amount / 币种 / incoterms / payment_terms
 *      - T9.04 contracts.afterUpdate：status → signed 时自动创建 order + 30% 定金（幂等）+ customer.status='ordered'
 *      - orders.beforeCreate：从 contract.quotation 兜底同步业务字段
 *      - orders.beforeSave：缅甸路由 + quantity < 1500 → throw；committed_delivery 校验
 *      - payments.beforeCreate：order_id 校验
 *      - T9.05 payments.afterUpdate：
 *          * 定金 status=paid → order.status=production_pending + 自动建尾款（70%）+ 自动建排产记录
 *          * 尾款 status=paid → order.balance_paid=true
 *      - materials.beforeCreate：order_id 校验
 *
 * T10.04 物料逾期 / T10.05 排产 -3d 通知质检 由 plugin-workflow-schedule 在 README 中配置。
 */

import { Plugin } from '@nocobase/server';
import path from 'path';

const DEPOSIT_PERCENTAGE = 30;
const BALANCE_PERCENTAGE = 70;
const DEPOSIT_DUE_DAYS_AFTER_SIGN = 7;
const BALANCE_DUE_DAYS_BEFORE_DELIVERY = 7;
const MM_MIN_LEAD_TIME_DAYS = 90;
const MM_BULK_MOQ = 1500;

function addDays(base: Date | string | undefined, days: number): Date | null {
  if (!base) return null;
  const d = new Date(base);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + days);
  return d;
}

export class PluginNocoCRMOrdersServer extends Plugin {
  async afterAdd() {}

  beforeLoad() {}

  async load() {
    await this.importCollections(path.resolve(__dirname, 'collections'));

    this.registerContractHooks();
    this.registerOrderHooks();
    this.registerPaymentHooks();
    this.registerMaterialHooks();

    // ACL：登录用户均可读；写权限留 M15 角色细化
    this.app.acl.allow('contracts', ['list', 'get'], 'loggedIn');
    this.app.acl.allow('orders', ['list', 'get'], 'loggedIn');
    this.app.acl.allow('materials', ['list', 'get'], 'loggedIn');
    this.app.acl.allow('production_plans', ['list', 'get'], 'loggedIn');
    // payments 不开放给登录用户（财务敏感数据，留 M15）

    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: [
        'contracts:*',
        'orders:*',
        'payments:*',
        'materials:*',
        'production_plans:*',
      ],
    });
  }

  // ====================================================================
  // contracts hooks
  // ====================================================================
  private registerContractHooks() {
    // Hook 1: beforeCreate 同步报价信息
    this.db.on('contracts.beforeCreate', async (model: any, options: any) => {
      try {
        const quotationId = model.get('quotation_id');
        if (!quotationId) return;

        const q = await this.db
          .getRepository('quotations')
          .findOne({ filterByTk: quotationId, transaction: options?.transaction });
        if (!q) return;

        if (!model.get('customer_id') && q.customer_id) {
          model.set('customer_id', q.customer_id);
        }
        if (!model.get('total_amount')) {
          const total = Number(q.total ?? Number(q.unit_price) * Number(q.quantity));
          if (total > 0) model.set('total_amount', total);
        }
        if (!model.get('currency_code') && q.currency_code) {
          model.set('currency_code', q.currency_code);
        }
        if (!model.get('incoterms') && q.incoterms) {
          model.set('incoterms', q.incoterms);
        }
        if (!model.get('payment_terms') && q.payment_terms) {
          model.set('payment_terms', q.payment_terms);
        }
      } catch (err) {
        console.error('[nococrm-orders] contracts.beforeCreate failed:', err);
      }
    });

    // Hook 2 (T9.04): afterUpdate 签合同自动生成订单 + 定金
    this.db.on('contracts.afterUpdate', async (model: any, options: any) => {
      try {
        const prev = model.previous?.('status');
        const next = model.get('status');
        if (prev === 'signed' || next !== 'signed') return;

        // 幂等：若 contract 已有关联 order 则跳过
        const existing = await this.db.getRepository('orders').findOne({
          filter: { contract_id: model.get('id') },
          transaction: options?.transaction,
        });
        if (existing) return;

        const quotationId = model.get('quotation_id');
        const quotation = quotationId
          ? await this.db
              .getRepository('quotations')
              .findOne({ filterByTk: quotationId, transaction: options?.transaction })
          : null;

        const customerId = model.get('customer_id') ?? quotation?.customer_id;
        const totalAmount = Number(model.get('total_amount')) || 0;
        const signedAt = model.get('signed_at') ?? new Date();

        // 加载 inquiry 以获取 product_category / requested_delivery
        let inquiry: any = null;
        if (quotation?.inquiry_id) {
          inquiry = await this.db
            .getRepository('inquiries')
            .findOne({ filterByTk: quotation.inquiry_id, transaction: options?.transaction });
        }

        // 创建 order
        const order = await this.db.getRepository('orders').create({
          values: {
            contract_id: model.get('id'),
            customer_id: customerId,
            product_category_id: inquiry?.product_category_id ?? null,
            product_name: inquiry?.product_name ?? null,
            quantity: quotation?.quantity ?? null,
            unit_price: quotation?.unit_price ?? null,
            production_factory_id: quotation?.production_factory_id ?? null,
            requested_delivery: inquiry?.delivery_request ?? null,
            status: 'deposit_pending',
            deposit_paid: false,
            balance_paid: false,
          },
          transaction: options?.transaction,
        });

        // 创建定金 payment（30%）
        await this.db.getRepository('payments').create({
          values: {
            order_id: order.id,
            type: 'deposit',
            amount: totalAmount * (DEPOSIT_PERCENTAGE / 100),
            currency_code: model.get('currency_code'),
            percentage: DEPOSIT_PERCENTAGE,
            due_date: addDays(signedAt, DEPOSIT_DUE_DAYS_AFTER_SIGN),
            status: 'unpaid',
          },
          transaction: options?.transaction,
        });

        // 客户状态推进到"已下单"
        if (customerId) {
          await this.db.getRepository('customers').update({
            filterByTk: customerId,
            values: { status: 'ordered', last_contact_at: new Date() },
            transaction: options?.transaction,
            hooks: false,
          });
        }
      } catch (err) {
        console.error('[nococrm-orders] contracts.afterUpdate T9.04 failed:', err);
      }
    });
  }

  // ====================================================================
  // orders hooks
  // ====================================================================
  private registerOrderHooks() {
    // beforeCreate 兜底同步
    this.db.on('orders.beforeCreate', async (model: any, options: any) => {
      try {
        const contractId = model.get('contract_id');
        if (!contractId) return;
        const contract = await this.db
          .getRepository('contracts')
          .findOne({ filterByTk: contractId, transaction: options?.transaction });
        if (!contract) return;
        if (!model.get('customer_id') && contract.customer_id) {
          model.set('customer_id', contract.customer_id);
        }
      } catch (err) {
        console.error('[nococrm-orders] orders.beforeCreate failed:', err);
      }
    });

    // beforeSave 业务红线校验
    this.db.on('orders.beforeSave', async (model: any, options: any) => {
      const factoryId = model.get('production_factory_id');
      if (!factoryId) return;

      const factory = await this.db
        .getRepository('factories')
        .findOne({ filterByTk: factoryId, transaction: options?.transaction });
      if (!factory) return;

      const qty = Number(model.get('quantity')) || 0;

      // 缅甸 MOQ ≥ 1500
      if (factory.country === 'MM' && qty > 0 && qty < MM_BULK_MOQ) {
        throw new Error(
          `缅甸大货 MOQ 不得低于 ${MM_BULK_MOQ} 件（来自 03 知识库）。当前数量 ${qty}，请改路由到山东日照（CN_RZ）`,
        );
      }

      // 缅甸交期 ≥ pp + 90 天
      if (factory.country === 'MM') {
        const pp = model.get('pp_sample_approved_at');
        const committed = model.get('committed_delivery');
        if (pp && committed) {
          const minDelivery = addDays(pp, MM_MIN_LEAD_TIME_DAYS);
          if (minDelivery && new Date(committed) < minDelivery) {
            throw new Error(
              `缅甸大货承诺交期不得早于 PP 样确认日 + ${MM_MIN_LEAD_TIME_DAYS} 天（来自 04 知识库）`,
            );
          }
        }
      }
    });
  }

  // ====================================================================
  // payments hooks (T9.05)
  // ====================================================================
  private registerPaymentHooks() {
    this.db.on('payments.beforeCreate', async (model: any) => {
      if (!model.get('order_id')) {
        throw new Error('payments 创建必须关联订单（order_id 不能为空）');
      }
    });

    // T9.05 核心 hook
    this.db.on('payments.afterUpdate', async (model: any, options: any) => {
      try {
        const prev = model.previous?.('status');
        const next = model.get('status');
        if (prev === 'paid' || next !== 'paid') return;

        const orderId = model.get('order_id');
        if (!orderId) return;

        const order = await this.db
          .getRepository('orders')
          .findOne({ filterByTk: orderId, transaction: options?.transaction });
        if (!order) return;

        const paymentType = model.get('type');

        if (paymentType === 'deposit') {
          // 解锁订单
          await this.db.getRepository('orders').update({
            filterByTk: order.id,
            values: { status: 'production_pending', deposit_paid: true },
            transaction: options?.transaction,
            hooks: false,
          });

          // 自动建尾款（幂等）
          const existingBalance = await this.db.getRepository('payments').findOne({
            filter: { order_id: order.id, type: 'balance' },
            transaction: options?.transaction,
          });
          if (!existingBalance) {
            const total = Number(order.quantity ?? 0) * Number(order.unit_price ?? 0);
            await this.db.getRepository('payments').create({
              values: {
                order_id: order.id,
                type: 'balance',
                amount: total * (BALANCE_PERCENTAGE / 100),
                currency_code: model.get('currency_code'),
                percentage: BALANCE_PERCENTAGE,
                due_date: order.committed_delivery
                  ? addDays(order.committed_delivery, -BALANCE_DUE_DAYS_BEFORE_DELIVERY)
                  : null,
                status: 'unpaid',
              },
              transaction: options?.transaction,
            });
          }

          // 自动建排产记录（幂等）
          const existingPlan = await this.db.getRepository('production_plans').findOne({
            filter: { order_id: order.id },
            transaction: options?.transaction,
          });
          if (!existingPlan) {
            await this.db.getRepository('production_plans').create({
              values: {
                order_id: order.id,
                factory_id: order.production_factory_id,
                status: 'pending',
                special_requirements: order.notes || null,
              },
              transaction: options?.transaction,
            });
          }
        } else if (paymentType === 'balance') {
          // 尾款到账 → 仅标 balance_paid（status 在 M12 发货流程中推进）
          await this.db.getRepository('orders').update({
            filterByTk: order.id,
            values: { balance_paid: true },
            transaction: options?.transaction,
            hooks: false,
          });
        }
      } catch (err) {
        console.error('[nococrm-orders] payments.afterUpdate T9.05 failed:', err);
      }
    });
  }

  // ====================================================================
  // materials hooks
  // ====================================================================
  private registerMaterialHooks() {
    this.db.on('materials.beforeCreate', async (model: any) => {
      if (!model.get('order_id')) {
        throw new Error('materials 创建必须关联订单（order_id 不能为空）');
      }
    });
  }

  async install() {}
  async afterEnable() {}
  async afterDisable() {}
  async remove() {}
}

export default PluginNocoCRMOrdersServer;
