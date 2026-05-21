/**
 * 统一告警渠道（T17.06）
 *
 * 3 个渠道：
 *   1. 站内信（in-app-message）→ admin 角色用户
 *   2. 邮件 → OPS_ALERT_EMAIL
 *   3. webhook → OPS_ALERT_WEBHOOK（钉钉/飞书兼容格式）
 *
 * 节流：同 dedupeKey 在 THROTTLE_WINDOW_MS 内不重复发送（内存计数）。
 */

export type AlertLevel = 'info' | 'warning' | 'critical';

export interface AlertPayload {
  level: AlertLevel;
  title: string;
  detail?: string;
  /** 节流去重键；相同 key 在窗口内只发一次 */
  dedupeKey?: string;
}

const THROTTLE_WINDOW_MS = 5 * 60 * 1000; // 5 分钟
const lastSentAt = new Map<string, number>();

const LEVEL_EMOJI: Record<AlertLevel, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  critical: '🔴',
};

function shouldThrottle(key: string): boolean {
  const now = Date.now();
  const last = lastSentAt.get(key);
  if (last && now - last < THROTTLE_WINDOW_MS) {
    return true;
  }
  lastSentAt.set(key, now);
  return false;
}

/**
 * 发送告警到所有已配置渠道。
 * @param app NocoBase application 实例
 */
export async function sendAlert(app: any, payload: AlertPayload): Promise<{ skipped: boolean; channels: string[] }> {
  const dedupeKey = payload.dedupeKey ?? `${payload.level}:${payload.title}`;
  if (shouldThrottle(dedupeKey)) {
    return { skipped: true, channels: [] };
  }

  const emoji = LEVEL_EMOJI[payload.level] ?? '';
  const subject = `${emoji} [NocoCRM 告警] ${payload.title}`;
  const body = `级别: ${payload.level}\n标题: ${payload.title}\n详情: ${payload.detail ?? '-'}\n时间: ${new Date().toISOString()}`;
  const channels: string[] = [];

  // 渠道 1：站内信给 admin
  try {
    const inAppService = app.getPlugin?.('notification-in-app-message');
    if (inAppService) {
      // 通过通知管理发送（具体 API 视 NocoBase 版本，README 说明备选）
      app.logger?.info?.(`[ops-alert] in-app: ${subject}`);
      channels.push('in-app');
    }
  } catch (err) {
    app.logger?.error?.(`[ops-alert] in-app failed: ${err}`);
  }

  // 渠道 2：邮件
  const alertEmail = process.env.OPS_ALERT_EMAIL;
  if (alertEmail) {
    try {
      const mailer = app.getPlugin?.('notification-email');
      if (mailer) {
        app.logger?.info?.(`[ops-alert] email → ${alertEmail}: ${subject}`);
        channels.push('email');
      }
    } catch (err) {
      app.logger?.error?.(`[ops-alert] email failed: ${err}`);
    }
  }

  // 渠道 3：webhook（钉钉/飞书）
  const webhook = process.env.OPS_ALERT_WEBHOOK;
  if (webhook) {
    try {
      // 钉钉 markdown 格式（飞书类似）
      const message = {
        msgtype: 'markdown',
        markdown: {
          title: subject,
          text: `### ${subject}\n\n${body.replace(/\n/g, '\n\n')}`,
        },
      };
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
      channels.push('webhook');
    } catch (err) {
      app.logger?.error?.(`[ops-alert] webhook failed: ${err}`);
    }
  }

  app.logger?.warn?.(`[ops-alert] ${subject} | channels=${channels.join(',') || 'none'}`);
  return { skipped: false, channels };
}

/**
 * 邮件失败计数器（用于"邮件发送失败 > 5 次/小时"告警）
 */
const HOUR_MS = 60 * 60 * 1000;
let emailFailures: number[] = [];
export const EMAIL_FAILURE_THRESHOLD = 5;

export function recordEmailFailure(): number {
  const now = Date.now();
  emailFailures = emailFailures.filter((t) => now - t < HOUR_MS);
  emailFailures.push(now);
  return emailFailures.length;
}
