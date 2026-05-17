/**
 * Better Bags NocoCRM Quotation - Server Plugin
 *
 * 职责（M5/M6）：
 *   1. 自动加载 4 个 collection（inquiries / cost_estimates / quotations / samples）
 *   2. 注册 8+ 数据库 Hooks 兑现业务红线（来自 03/04/05/06 知识库）：
 *      - T5.04 inquiries.beforeSave: 自动评分 + status 切换（需求完善 vs 已交核价）
 *      - T6.02 quotations.beforeSave: 按工厂国家自动填 incoterms
 *      - T6.03 quotations.beforeSave: 新客户禁选 tt_bl
 *      - T6.04 quotations.beforeSave: 缅甸大货 lead_time 不得 < 90 天
 *      - T6.05 quotations.beforeSave: 按 MOQ + 急单自动路由工厂
 *      - T6.06 quotations.beforeSave: 单价 < cost_estimate.final_price → status 锁回 draft
 *      - quotations.beforeCreate: valid_until 默认 +30d / customer 从 inquiry 同步
 *      - T6.07 samples.beforeCreate: planned_finish_at = +7d / sampling_factory = CN_QD / customer 同步
 *      - T6.08 samples.afterSave: revision_no ≥ 4 → customer.risk_flag = true
 *   3. 注册基础 ACL + snippet
 *
 * 异常处理策略：所有 hook 内部都 try/catch，单个 hook 出错只 console.error，
 * 不影响主流程；唯有"违反业务红线"的硬校验 throw（T6.03 / T6.04）。
 */

import { Plugin } from '@nocobase/server';
import path from 'path';

import { COMPLETENESS_THRESHOLD, computeCompletenessScore } from './utils/completenessScore';

export class PluginNocoCRMQuotationServer extends Plugin {
  async afterAdd() {}

  beforeLoad() {}

  async load() {
    await this.importCollections(path.resolve(__dirname, 'collections'));

    // M5/M6 无字典需要 seed；保留 migrations 目录用于后续修复，此处不强制注册
    // 如果未来要灌入 seed，参照 plugin-nococrm-core 注册 addMigrations
    this.registerInquiryHooks();
    this.registerQuotationHooks();
    this.registerSampleHooks();

    // 基础 ACL
    this.app.acl.allow('inquiries', ['list', 'get'], 'loggedIn');
    this.app.acl.allow('quotations', ['list', 'get'], 'loggedIn');
    this.app.acl.allow('samples', ['list', 'get'], 'loggedIn');
    // cost_estimates 默认不开放给登录用户，等 M15 finance 角色完善
    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: [
        'inquiries:*',
        'cost_estimates:*',
        'quotations:*',
        'samples:*',
      ],
    });
  }

  // ====================================================================
  // T5.04 inquiries hooks
  // ====================================================================
  private registerInquiryHooks() {
    this.db.on('inquiries.beforeSave', async (model: any) => {
      try {
        const score = computeCompletenessScore(model);
        model.set('completeness_score', score);

        // 只在 collecting / refining 状态下自动切换；已交核价 / 已报价 / 已废弃 保持人工控制
        const status = model.get('status');
        if (status === 'collecting' || status === 'refining' || !status) {
          model.set('status', score >= COMPLETENESS_THRESHOLD ? 'costing' : 'refining');
        }
      } catch (err) {
        console.error('[nococrm-quotation] computeCompletenessScore failed:', err);
      }
    });
  }

  // ====================================================================
  // quotations hooks (T6.02 - T6.06)
  // ====================================================================
  private registerQuotationHooks() {
    // beforeCreate：默认值 + 关联同步
    this.db.on('quotations.beforeCreate', async (model: any, options: any) => {
      try {
        // valid_until 默认 = now + 30 天
        if (!model.get('valid_until')) {
          const d = new Date();
          d.setDate(d.getDate() + 30);
          model.set('valid_until', d);
        }
        // customer 从 inquiry 同步
        if (!model.get('customer_id') && model.get('inquiry_id')) {
          const inq = await this.db
            .getRepository('inquiries')
            .findOne({ filterByTk: model.get('inquiry_id'), transaction: options?.transaction });
          if (inq) {
            model.set('customer_id', inq.customer_id);
            // quantity 如果没填，从 inquiry 同步
            if (!model.get('quantity')) {
              model.set('quantity', inq.quantity);
            }
          }
        }
      } catch (err) {
        console.error('[nococrm-quotation] quotations.beforeCreate failed:', err);
      }
    });

    // T6.05 工厂路由（beforeSave，先于其他依赖 production_factory 的 hook）
    this.db.on('quotations.beforeSave', async (model: any, options: any) => {
      try {
        if (model.get('production_factory_id')) return; // 已选不覆盖

        let isUrgent = false;
        if (model.get('inquiry_id')) {
          const inq = await this.db
            .getRepository('inquiries')
            .findOne({ filterByTk: model.get('inquiry_id'), transaction: options?.transaction });
          isUrgent = Boolean(inq?.is_urgent);
        }
        const qty = Number(model.get('quantity')) || 0;
        const targetCode = qty >= 1500 && !isUrgent ? 'MM_YGN' : 'CN_RZ';
        const factory = await this.db
          .getRepository('factories')
          .findOne({ filter: { code: targetCode }, transaction: options?.transaction });
        if (factory) {
          model.set('production_factory_id', factory.id);
        }
      } catch (err) {
        console.error('[nococrm-quotation] factory routing failed:', err);
      }
    });

    // T6.02 incoterms 默认（根据 production_factory.country）
    this.db.on('quotations.beforeSave', async (model: any, options: any) => {
      try {
        if (model.get('incoterms')) return;
        const factoryId = model.get('production_factory_id');
        if (!factoryId) return;
        const factory = await this.db
          .getRepository('factories')
          .findOne({ filterByTk: factoryId, transaction: options?.transaction });
        if (factory?.country === 'MM') {
          model.set('incoterms', 'FOB Yangon');
        } else if (factory?.country === 'CN') {
          model.set('incoterms', 'FOB Qingdao');
        }
      } catch (err) {
        console.error('[nococrm-quotation] incoterms default failed:', err);
      }
    });

    // T6.04 lead_time 下限校验
    this.db.on('quotations.beforeSave', async (model: any, options: any) => {
      const factoryId = model.get('production_factory_id');
      if (!factoryId) return;
      const factory = await this.db
        .getRepository('factories')
        .findOne({ filterByTk: factoryId, transaction: options?.transaction });
      const leadTime = Number(model.get('lead_time_days'));
      if (factory?.country === 'MM' && leadTime > 0 && leadTime < 90) {
        throw new Error('缅甸大货交期不得短于 90 天（来自 04 知识库 PP 样确认 + 3 个月）');
      }
    });

    // T6.03 payment_terms 新客户硬校验
    this.db.on('quotations.beforeSave', async (model: any, options: any) => {
      if (model.get('payment_terms') !== 'tt_bl') return;
      const customerId = model.get('customer_id');
      if (!customerId) return;
      const customer = await this.db
        .getRepository('customers')
        .findOne({ filterByTk: customerId, transaction: options?.transaction });
      if (!customer) return;

      let orderCount = 0;
      try {
        orderCount =
          (await this.db
            .getRepository('orders')
            ?.count({ filter: { customer_id: customerId }, transaction: options?.transaction })) ?? 0;
      } catch {
        // orders 表可能在 M9 之前还没建；此时 orderCount 保持 0
      }

      if (customer.status !== 'closed' || orderCount < 3) {
        throw new Error(
          'T/T 见提单复印件付款 仅 VIP 客户可用（已成交且历史订单 ≥ 3）。新客户请使用 T/T 30/70 或 L/C。',
        );
      }
    });

    // T6.06 价格底线审批
    this.db.on('quotations.beforeSave', async (model: any, options: any) => {
      try {
        const prevStatus = model.previous?.('status');
        const nextStatus = model.get('status');
        // 仅在 "尝试切到 sent" 时触发
        if (nextStatus !== 'sent' || prevStatus === 'sent') return;

        const inquiryId = model.get('inquiry_id');
        if (!inquiryId) return;
        const ce = await this.db
          .getRepository('cost_estimates')
          .findOne({ filter: { inquiry_id: inquiryId }, transaction: options?.transaction });
        if (!ce?.final_price) return;

        const unitPrice = Number(model.get('unit_price'));
        const finalPrice = Number(ce.final_price);
        if (unitPrice > 0 && unitPrice < finalPrice) {
          model.set('status', 'draft');
          model.set(
            'pending_approval_reason',
            `单价 ${unitPrice} 低于建议价 ${finalPrice}，需销售经理审批后才能发送。`,
          );
        }
      } catch (err) {
        console.error('[nococrm-quotation] price floor check failed:', err);
      }
    });

    // sent_at 自动填充
    this.db.on('quotations.beforeSave', async (model: any) => {
      const prevStatus = model.previous?.('status');
      const nextStatus = model.get('status');
      if (nextStatus === 'sent' && prevStatus !== 'sent' && !model.get('sent_at')) {
        model.set('sent_at', new Date());
      }
      if (nextStatus === 'confirmed' && prevStatus !== 'confirmed' && !model.get('confirmed_at')) {
        model.set('confirmed_at', new Date());
      }
    });
  }

  // ====================================================================
  // samples hooks (T6.07 / T6.08)
  // ====================================================================
  private registerSampleHooks() {
    this.db.on('samples.beforeCreate', async (model: any, options: any) => {
      try {
        // 默认打样工厂 = 青岛打样中心
        if (!model.get('sampling_factory_id')) {
          const qd = await this.db
            .getRepository('factories')
            .findOne({ filter: { code: 'CN_QD' }, transaction: options?.transaction });
          if (qd) model.set('sampling_factory_id', qd.id);
        }

        // planned_finish_at = requested_at + 7d（首样 1 周，来自 05 知识库）
        if (model.get('requested_at') && !model.get('planned_finish_at')) {
          const d = new Date(model.get('requested_at'));
          d.setDate(d.getDate() + 7);
          model.set('planned_finish_at', d);
        }

        // customer 从 quotation 自动同步
        if (!model.get('customer_id') && model.get('quotation_id')) {
          const q = await this.db
            .getRepository('quotations')
            .findOne({ filterByTk: model.get('quotation_id'), transaction: options?.transaction });
          if (q) model.set('customer_id', q.customer_id);
        }
      } catch (err) {
        console.error('[nococrm-quotation] samples.beforeCreate failed:', err);
      }
    });

    // T6.08 打样轮次 ≥ 4 高风险告警
    this.db.on('samples.afterSave', async (model: any, options: any) => {
      try {
        const revision = Number(model.get('revision_no')) || 0;
        if (revision < 4) return;
        const customerId = model.get('customer_id');
        if (!customerId) return;

        const customersRepo = this.db.getRepository('customers');
        const customer = await customersRepo.findOne({
          filterByTk: customerId,
          transaction: options?.transaction,
        });
        if (!customer || customer.risk_flag) return; // 已经标红，避免覆盖业务员手动 notes

        await customersRepo.update({
          filterByTk: customerId,
          values: {
            risk_flag: true,
            notes:
              (customer.notes ? customer.notes + '\n' : '') +
              `[${new Date().toISOString().slice(0, 10)}] 打样已达 ${revision} 次，触发高风险（05 知识库红线）`,
          },
          transaction: options?.transaction,
        });
      } catch (err) {
        console.error('[nococrm-quotation] sample high-risk flag failed:', err);
      }
    });
  }

  async install() {}
  async afterEnable() {}
  async afterDisable() {}
  async remove() {}
}

export default PluginNocoCRMQuotationServer;
