/**
 * T16.03 工厂产能利用率 factories:capacityUtilization
 *
 * 输入：dateRange（默认本月）
 * 输出：[{factory_code, factory_name, period, used_pcs, capacity_pcs, utilization_pct}]
 */

function monthKey(date: Date | string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return 'unknown';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default async function capacityUtilization(ctx: any, next: () => Promise<void>) {
  try {
    const params = ctx.action?.params ?? {};
    const filter: Record<string, any> = {};
    if (Array.isArray(params.dateRange) && params.dateRange.length === 2) {
      filter.planned_start = { $between: params.dateRange };
    }

    const plans = await ctx.db.getRepository('production_plans').find({
      filter,
      fields: ['planned_start', 'planned_end', 'factory_id', 'order_id'],
      appends: ['factory.code', 'factory.name', 'factory.capacity_monthly_pcs', 'order.quantity'],
    });

    type Bucket = {
      factory_code: string;
      factory_name: string;
      period: string;
      used_pcs: number;
      capacity_pcs: number;
    };
    const buckets = new Map<string, Bucket>();

    for (const p of plans) {
      if (!p.factory) continue;
      const period = monthKey(p.planned_start);
      const key = `${p.factory.code}::${period}`;
      const qty = Number(p.order?.quantity) || 0;
      const cur = buckets.get(key) ?? {
        factory_code: p.factory.code,
        factory_name: p.factory.name,
        period,
        used_pcs: 0,
        capacity_pcs: Number(p.factory.capacity_monthly_pcs) || 0,
      };
      cur.used_pcs += qty;
      buckets.set(key, cur);
    }

    ctx.body = Array.from(buckets.values()).map((b) => ({
      ...b,
      utilization_pct: b.capacity_pcs
        ? Math.round((b.used_pcs / b.capacity_pcs) * 10000) / 100
        : 0,
    }));
  } catch (err: any) {
    ctx.throw(500, `capacityUtilization failed: ${err?.message || err}`);
  }
  await next();
}
