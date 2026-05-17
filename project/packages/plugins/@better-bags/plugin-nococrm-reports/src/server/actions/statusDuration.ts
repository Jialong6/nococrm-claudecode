/**
 * T16.05 阶段停留时长 customers:statusDuration
 *
 * 简化方案：用 customers.updated_at - customers.created_at 估算当前 status 的停留时长。
 * 理想方案需 audit_logs 拿到状态变更历史；此处不依赖 audit_logs。
 *
 * 输入：dateRange（按 created_at 过滤）
 * 输出：[{status, label, p25, p50, p75, p95, count}]（单位：天）
 */

const STAGES: Array<{ value: string; label: string }> = [
  { value: 'new', label: '新建' },
  { value: 'following', label: '跟进中' },
  { value: 'quoted', label: '已报价' },
  { value: 'negotiating', label: '谈判中' },
  { value: 'ordered', label: '已下单' },
  { value: 'closed', label: '已成交' },
  { value: 'maintaining', label: '长期维护' },
  { value: 'lost', label: '已流失' },
];

function percentile(arr: number[], p: number): number {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return Math.round(sorted[idx] * 100) / 100;
}

export default async function statusDuration(ctx: any, next: () => Promise<void>) {
  try {
    const params = ctx.action?.params ?? {};
    const filter: Record<string, any> = {};
    if (Array.isArray(params.dateRange) && params.dateRange.length === 2) {
      filter.created_at = { $between: params.dateRange };
    }

    const customers = await ctx.db.getRepository('customers').find({
      filter,
      fields: ['status', 'created_at', 'updated_at'],
    });

    const buckets: Record<string, number[]> = {};
    for (const c of customers) {
      const status = String(c.status ?? c.get?.('status') ?? 'new');
      const created = new Date(c.created_at);
      const updated = new Date(c.updated_at || c.created_at);
      const days = Math.max(0, (updated.getTime() - created.getTime()) / 86400000);
      if (!buckets[status]) buckets[status] = [];
      buckets[status].push(days);
    }

    ctx.body = STAGES.map((s) => {
      const arr = buckets[s.value] || [];
      return {
        status: s.value,
        label: s.label,
        count: arr.length,
        p25: percentile(arr, 25),
        p50: percentile(arr, 50),
        p75: percentile(arr, 75),
        p95: percentile(arr, 95),
      };
    });
  } catch (err: any) {
    ctx.throw(500, `statusDuration failed: ${err?.message || err}`);
  }
  await next();
}
