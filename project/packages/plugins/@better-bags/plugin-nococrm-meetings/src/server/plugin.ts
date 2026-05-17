/**
 * Better Bags NocoCRM Meetings - Server Plugin
 *
 * 职责（M3/M4）：
 *   1. 自动加载 collections/ 目录里 4 个 collection 定义
 *   2. 注册 ACL（议程模板 / 资料库登录可读）
 *   3. 数据库 Hooks 兜底关键工作流：
 *      - meetings.beforeCreate：选了 agenda_template 时把 body 复制到 agenda 字段（T3.02）
 *      - meetings.afterUpdate：status 变为 completed 时回写 customer.first_meeting_at / outcome（T4.03）
 *   4. 灌入 seed 数据（5 议程模板 + 10 公司资料）
 *
 * 完整工作流（24h/1h 邮件提醒 / 工厂参观通知 IT / 24h 跟进任务）见 README，
 * 用户在 UI 工作流模块里按截图清单完成或导入 JSON。
 */

import { Plugin } from '@nocobase/server';
import path from 'path';

const COMPLETED_STATUSES = new Set(['completed']);

export class PluginNocoCRMMeetingsServer extends Plugin {
  async afterAdd() {}

  beforeLoad() {}

  async load() {
    // 自动加载 4 个 collection
    await this.importCollections(path.resolve(__dirname, 'collections'));

    // 注册 seed migrations
    this.db.addMigrations({
      namespace: 'nococrm-meetings',
      directory: path.resolve(__dirname, 'migrations'),
      context: { plugin: this, db: this.db, app: this.app },
    });

    // ACL
    this.app.acl.allow('meeting_agenda_templates', ['list', 'get'], 'loggedIn');
    this.app.acl.allow('company_assets', ['list', 'get'], 'loggedIn');
    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: [
        'meetings:*',
        'meeting_notes:*',
        'meeting_agenda_templates:*',
        'company_assets:*',
      ],
    });

    // Hook 1: 选了议程模板时自动填充 agenda（T3.02）
    this.db.on('meetings.beforeCreate', async (model, options) => {
      const templateId = model.get('agenda_template_id') ?? model.get('agendaTemplateId');
      const currentAgenda = model.get('agenda');
      if (!templateId || (currentAgenda && String(currentAgenda).trim().length > 0)) {
        return;
      }
      const repo = this.db.getRepository('meeting_agenda_templates');
      const tpl = await repo.findOne({ filterByTk: templateId, transaction: options?.transaction });
      if (tpl?.body) {
        model.set('agenda', tpl.body);
      }
    });

    // Hook 2: meeting 完成时回写 customer（T4.03/T4.04 入口）
    this.db.on('meetings.afterUpdate', async (model, options) => {
      const prevStatus = model.previous('status');
      const nextStatus = model.get('status');
      if (prevStatus === nextStatus || !COMPLETED_STATUSES.has(String(nextStatus))) {
        return;
      }
      const customerId = model.get('customer_id') ?? model.get('customerId');
      if (!customerId) return;

      const customersRepo = this.db.getRepository('customers');
      if (!customersRepo) return;

      const customer = await customersRepo.findOne({
        filterByTk: customerId,
        transaction: options?.transaction,
      });
      if (!customer) return;

      const meetingScheduledAt = model.get('scheduled_at');
      const meetingOutcome = model.get('outcome');

      const patch: Record<string, unknown> = {};

      // 首次会议时间：仅在首次设置时回写，避免后续会议把首次时间盖掉
      if (!customer.get('first_meeting_at') && meetingScheduledAt) {
        patch.first_meeting_at = meetingScheduledAt;
        if (meetingOutcome) {
          patch.first_meeting_outcome = meetingOutcome;
        }
      }

      // 最近联系时间：每次会议完成都更新
      patch.last_contact_at = new Date();

      if (Object.keys(patch).length > 0) {
        await customersRepo.update({
          filterByTk: customerId,
          values: patch,
          transaction: options?.transaction,
        });
      }
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginNocoCRMMeetingsServer;
