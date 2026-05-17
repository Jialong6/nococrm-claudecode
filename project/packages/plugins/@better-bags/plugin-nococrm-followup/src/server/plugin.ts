/**
 * Better Bags NocoCRM Followup - Server Plugin
 *
 * 职责（M7/M8）：
 *   1. 加载 3 个 collection（followup_scripts / negotiations / negotiation_scripts）
 *   2. 扩展 quotations 增加 followup_due_at 字段（T7.02 hook 写入；定时工作流扫此字段）
 *   3. db hooks：
 *      - T7.02 quotations.afterUpdate：status → sent 时计算 followup_due_at = sent_at + 14d
 *      - negotiations.beforeCreate：customer / round_no / occurred_at 自动同步
 *      - T8.03 negotiations.afterSave：count(quotation 的谈判) ≥ 5 → 写 quotation.pending_approval_reason
 *   4. 灌入 seed（12 跟进话术 + 12 谈判话术 = 24 条）
 *
 * T7.03（30 天无联系）由 plugin-workflow-schedule 在 README 中配置，无 hook。
 */

import { Plugin } from '@nocobase/server';
import path from 'path';

const STUCK_FLAG_MARKER = '建议销售经理评估止损';

export class PluginNocoCRMFollowupServer extends Plugin {
  async afterAdd() {}

  beforeLoad() {
    // 扩展 quotations：增加 followup_due_at（T7.02）
    this.db.extendCollection({
      name: 'quotations',
      origin: this.options?.packageName ?? '@better-bags/plugin-nococrm-followup',
      fields: [
        {
          type: 'date',
          name: 'followup_due_at',
          interface: 'datetime',
          uiSchema: {
            type: 'string',
            title: '下次跟进截止',
            'x-component': 'DatePicker',
            'x-component-props': { showTime: false },
            'x-read-pretty': true,
            description: 'status 切换到 sent 时自动 = sent_at + 14 天；定时工作流扫此字段触发跟进任务',
          },
        },
      ],
    });
  }

  async load() {
    await this.importCollections(path.resolve(__dirname, 'collections'));

    this.db.addMigrations({
      namespace: 'nococrm-followup',
      directory: path.resolve(__dirname, 'migrations'),
      context: { plugin: this, db: this.db, app: this.app },
    });

    this.registerQuotationFollowupHook();
    this.registerNegotiationHooks();

    // ACL：登录用户均可读话术库；谈判记录允许业务员增删改
    this.app.acl.allow('followup_scripts', ['list', 'get'], 'loggedIn');
    this.app.acl.allow('negotiation_scripts', ['list', 'get'], 'loggedIn');
    this.app.acl.allow('negotiations', ['list', 'get', 'create', 'update'], 'loggedIn');
    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: [
        'followup_scripts:*',
        'negotiations:*',
        'negotiation_scripts:*',
      ],
    });
  }

  // ====================================================================
  // T7.02 quotation followup hook
  // ====================================================================
  private registerQuotationFollowupHook() {
    this.db.on('quotations.afterUpdate', async (model: any, options: any) => {
      try {
        const prev = model.previous?.('status');
        const next = model.get('status');
        if (next !== 'sent' || prev === 'sent') return;

        const sentAt = model.get('sent_at') ?? new Date();
        const due = new Date(sentAt);
        due.setDate(due.getDate() + 14);

        await this.db.getRepository('quotations').update({
          filterByTk: model.get('id'),
          values: { followup_due_at: due },
          transaction: options?.transaction,
          hooks: false, // 避免再次触发 afterUpdate 形成无限循环
        });
      } catch (err) {
        console.error('[nococrm-followup] followup_due_at hook failed:', err);
      }
    });
  }

  // ====================================================================
  // negotiations hooks (T8.01 sync + T8.03 stuck-flag)
  // ====================================================================
  private registerNegotiationHooks() {
    // beforeCreate：自动同步 customer / round_no / occurred_at
    this.db.on('negotiations.beforeCreate', async (model: any, options: any) => {
      try {
        if (!model.get('occurred_at')) {
          model.set('occurred_at', new Date());
        }
        const quotationId = model.get('quotation_id');
        if (quotationId) {
          if (!model.get('customer_id')) {
            const q = await this.db
              .getRepository('quotations')
              .findOne({ filterByTk: quotationId, transaction: options?.transaction });
            if (q?.customer_id) model.set('customer_id', q.customer_id);
          }
          if (!model.get('round_no')) {
            const last = await this.db.getRepository('negotiations').findOne({
              filter: { quotation_id: quotationId },
              sort: ['-round_no'],
              transaction: options?.transaction,
            });
            const lastRound = Number(last?.round_no) || 0;
            model.set('round_no', lastRound + 1);
          }
        }
      } catch (err) {
        console.error('[nococrm-followup] negotiations.beforeCreate failed:', err);
      }
    });

    // T8.03 谈判止损：≥ 5 轮 → 写 quotation.pending_approval_reason
    this.db.on('negotiations.afterSave', async (model: any, options: any) => {
      try {
        const quotationId = model.get('quotation_id');
        if (!quotationId) return;

        const count = await this.db
          .getRepository('negotiations')
          .count({ filter: { quotation_id: quotationId }, transaction: options?.transaction });
        if (count < 5) return;

        const quotation = await this.db
          .getRepository('quotations')
          .findOne({ filterByTk: quotationId, transaction: options?.transaction });
        if (!quotation) return;

        const existing = String(quotation.pending_approval_reason || '');
        if (existing.includes(STUCK_FLAG_MARKER)) return; // 幂等

        const today = new Date().toISOString().slice(0, 10);
        const flag = `[${today}] 谈判已 ${count} 轮，${STUCK_FLAG_MARKER}（来自 SOP 阶段 7 红线）`;

        await this.db.getRepository('quotations').update({
          filterByTk: quotationId,
          values: {
            pending_approval_reason: existing ? `${existing}\n${flag}` : flag,
          },
          transaction: options?.transaction,
          hooks: false,
        });
      } catch (err) {
        console.error('[nococrm-followup] negotiation stuck-flag failed:', err);
      }
    });
  }

  async install() {}
  async afterEnable() {}
  async afterDisable() {}
  async remove() {}
}

export default PluginNocoCRMFollowupServer;
