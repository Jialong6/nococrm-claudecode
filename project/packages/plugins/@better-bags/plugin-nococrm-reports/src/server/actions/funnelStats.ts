/**
 * T16.01 13 阶段客户漏斗 customers:funnelStats
 *
 * 输入：可选 dateRange / owner_id
 * 输出：[{stage, label, count, conversion}]
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

export default async function funnelStats(ctx: any, next: () => Promise<void>) {
  try {
    const { dateRange, owner_id } = ctx.action?.params ?? {};
    const filter: Record<string, any> = {};
    if (owner_id) filter.owner_id = owner_id;
    if (Array.isArray(dateRange) && dateRange.length === 2) {
      filter.created_at = { $between: dateRange };
    }

    const repo = ctx.db.getRepository('customers');
    const rows = await repo.find({ filter, fields: ['status'] });
    const counts: Record<string, number> = {};
    for (const r of rows) {
      const s = String(r.get?.('status') ?? r.status ?? 'new');
      counts[s] = (counts[s] || 0) + 1;
    }

    const total = rows.length || 1;
    ctx.body = STAGES.map((s) => {
      const count = counts[s.value] || 0;
      return {
        stage: s.value,
        label: s.label,
        count,
        conversion: Math.round((count / total) * 100),
      };
    });
  } catch (err: any) {
    ctx.throw(500, `funnelStats failed: ${err?.message || err}`);
  }
  await next();
}
