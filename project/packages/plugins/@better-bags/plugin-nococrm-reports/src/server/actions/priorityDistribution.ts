/**
 * T16.06 客户分级分布 customers:priorityDistribution
 *
 * 输入：trend（boolean，是否返回月度趋势，默认 false）
 * 输出：{current: [{priority, label, color, count}], trend?: [{month, A, B, C, D}]}
 */

const PRIORITIES = [
  { value: 'A', label: 'A 类 - 现有客户', color: '#2e7d32' },
  { value: 'B', label: 'B 类 - 重要新客户', color: '#ef6c00' },
  { value: 'C', label: 'C 类 - 一般潜客', color: '#7b1fa2' },
  { value: 'D', label: 'D 类 - 低意向', color: '#546e7a' },
];

function monthKey(date: Date | string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return 'unknown';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default async function priorityDistribution(ctx: any, next: () => Promise<void>) {
  try {
    const params = ctx.action?.params ?? {};
    const trendMode = params.trend === true || params.trend === 'true';

    const customers = await ctx.db.getRepository('customers').find({
      fields: ['priority', 'created_at'],
    });

    const currentCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const c of customers) {
      const p = String(c.priority ?? c.get?.('priority') ?? 'D');
      if (p in currentCounts) currentCounts[p] += 1;
    }
    const current = PRIORITIES.map((p) => ({ ...p, count: currentCounts[p.value] || 0 }));

    const body: any = { current };

    if (trendMode) {
      const trendMap = new Map<string, { month: string; A: number; B: number; C: number; D: number }>();
      for (const c of customers) {
        const month = monthKey(c.created_at);
        const p = String(c.priority ?? c.get?.('priority') ?? 'D');
        const cur = trendMap.get(month) ?? { month, A: 0, B: 0, C: 0, D: 0 };
        if (p in cur) (cur as any)[p] += 1;
        trendMap.set(month, cur);
      }
      body.trend = Array.from(trendMap.values()).sort((a, b) => a.month.localeCompare(b.month));
    }

    ctx.body = body;
  } catch (err: any) {
    ctx.throw(500, `priorityDistribution failed: ${err?.message || err}`);
  }
  await next();
}
