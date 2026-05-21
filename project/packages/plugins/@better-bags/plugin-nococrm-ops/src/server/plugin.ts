/**
 * Better Bags NocoCRM Ops & Alerts - Server Plugin
 *
 * 职责（M17 T17.06）：
 *   1. 提供 ops:sendAlert action（供 UI 工作流"失败分支"调用）
 *   2. 提供 ops:testAlert action（手动测试告警链路）
 *   3. 监听可捕获的错误事件：
 *      - app error（数据库连接失败等）
 *      - 工作流执行失败（如果 plugin-workflow 暴露事件）
 *      - 邮件发送失败计数（> 5 次/小时）
 *
 * 告警渠道见 alertChannels.ts（站内信 / 邮件 / webhook，含 5 分钟节流）。
 *
 * 注：NocoBase 不同版本的错误事件 API 不稳定；本插件采用"代码兜底 + UI 工作流补充"模式：
 *     - 能监听到的事件直接发告警
 *     - 监听不到的（如细粒度 workflow 节点失败），在 README 指引用户用 UI 工作流失败分支调用 ops:sendAlert
 */

import { Plugin } from '@nocobase/server';
import { AlertLevel, EMAIL_FAILURE_THRESHOLD, recordEmailFailure, sendAlert } from './alertChannels';

export class PluginNocoCRMOpsServer extends Plugin {
  async afterAdd() {}

  beforeLoad() {}

  async load() {
    this.registerActions();
    this.registerErrorListeners();

    // ACL：sendAlert 给登录用户（供工作流调用）；testAlert 仅 admin
    this.app.acl.allow('ops', 'sendAlert', 'loggedIn');
    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: ['ops:*'],
    });
  }

  // ====================================================================
  // ops:sendAlert / ops:testAlert
  // ====================================================================
  private registerActions() {
    this.app.resourceManager.registerActionHandlers({
      'ops:sendAlert': async (ctx: any, next: () => Promise<void>) => {
        const { level, title, detail, dedupeKey } = ctx.action?.params?.values ?? ctx.action?.params ?? {};
        if (!title) {
          ctx.throw(400, 'title 不能为空');
          return;
        }
        const result = await sendAlert(this.app, {
          level: (level as AlertLevel) || 'warning',
          title,
          detail,
          dedupeKey,
        });
        ctx.body = result;
        await next();
      },

      'ops:testAlert': async (ctx: any, next: () => Promise<void>) => {
        const result = await sendAlert(this.app, {
          level: 'info',
          title: '测试告警',
          detail: '这是一条来自 plugin-nococrm-ops 的测试告警，用于验证告警链路是否畅通。',
          dedupeKey: `test:${Date.now()}`, // 测试不节流
        });
        ctx.body = { ok: true, ...result };
        await next();
      },
    });
  }

  // ====================================================================
  // 错误事件监听
  // ====================================================================
  private registerErrorListeners() {
    // 应用级错误（含数据库连接失败）
    this.app.on('error', async (err: any) => {
      try {
        await sendAlert(this.app, {
          level: 'critical',
          title: '应用错误',
          detail: String(err?.message || err),
          dedupeKey: `app-error:${err?.code || err?.name || 'unknown'}`,
        });
      } catch (e) {
        this.app.logger?.error?.(`[ops] error listener failed: ${e}`);
      }
    });

    // 邮件发送失败计数（监听通知失败事件，事件名视版本，做兜底）
    this.db.on('notifications.afterCreate', async (model: any) => {
      try {
        const status = model.get?.('status');
        if (status === 'failed' || status === 'error') {
          const count = recordEmailFailure();
          if (count >= EMAIL_FAILURE_THRESHOLD) {
            await sendAlert(this.app, {
              level: 'warning',
              title: `邮件发送失败已达 ${count} 次/小时`,
              detail: '请检查 SMTP 配置 / 网络 / 收件人地址。',
              dedupeKey: 'email-failure-burst',
            });
          }
        }
      } catch {
        // notifications 表不存在或字段不同则忽略
      }
    });

    // 启动健康检查
    this.app.on('afterStart', async () => {
      this.app.logger?.info?.('[ops] plugin-nococrm-ops started, alert channels ready');
    });
  }

  async install() {}
  async afterEnable() {}
  async afterDisable() {}
  async remove() {}
}

export default PluginNocoCRMOpsServer;
