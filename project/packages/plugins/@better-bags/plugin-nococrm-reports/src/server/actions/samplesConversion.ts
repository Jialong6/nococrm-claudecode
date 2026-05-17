/**
 * T16.04 打样转化率 samples:conversionRate
 *
 * 输入：dateRange
 * 输出：[{sample_type, label, count, conversion_from_first_pct}]
 */

const TYPES: Array<{ value: string; label: string }> = [
  { value: 'first', label: '首样' },
  { value: 'second', label: '二次样' },
  { value: 'third', label: '三次样' },
  { value: 'fourth', label: '四次样' },
  { value: 'pp', label: 'PP 样（产前样）' },
];

export default async function samplesConversion(ctx: any, next: () => Promise<void>) {
  try {
    const params = ctx.action?.params ?? {};
    const filter: Record<string, any> = {};
    if (Array.isArray(params.dateRange) && params.dateRange.length === 2) {
      filter.created_at = { $between: params.dateRange };
    }

    const samples = await ctx.db.getRepository('samples').find({
      filter,
      fields: ['sample_type'],
    });

    const counts: Record<string, number> = {};
    for (const s of samples) {
      const t = String(s.sample_type ?? s.get?.('sample_type') ?? 'first');
      counts[t] = (counts[t] || 0) + 1;
    }

    const firstCount = counts.first || 1; // 避免除 0
    ctx.body = TYPES.map((t) => ({
      sample_type: t.value,
      label: t.label,
      count: counts[t.value] || 0,
      conversion_from_first_pct: Math.round(((counts[t.value] || 0) / firstCount) * 10000) / 100,
    }));
  } catch (err: any) {
    ctx.throw(500, `samplesConversion failed: ${err?.message || err}`);
  }
  await next();
}
