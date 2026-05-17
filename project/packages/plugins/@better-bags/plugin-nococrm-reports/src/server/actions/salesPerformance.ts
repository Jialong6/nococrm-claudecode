/**
 * T16.02 销售业绩报表 orders:salesPerformance
 *
 * 输入：period（month|quarter，默认 month）/ dateRange / owner_id
 * 输出：[{owner_id, owner_name, period, order_count, total_amount, avg_amount}]
 */

function periodKey(date: Date | string, period: 'month' | 'quarter'): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return 'unknown';
  const y = d.getFullYear();
  if (period === 'quarter') {
    const q = Math.floor(d.getMonth() / 3) + 1;
    return `${y}-Q${q}`;
  }
  return `${y}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default async function salesPerformance(ctx: any, next: () => Promise<void>) {
  try {
    const params = ctx.action?.params ?? {};
    const period: 'month' | 'quarter' = params.period === 'quarter' ? 'quarter' : 'month';
    const owner_id = params.owner_id;

    const filter: Record<string, any> = { status: 'delivered', deposit_paid: true };
    if (Array.isArray(params.dateRange) && params.dateRange.length === 2) {
      filter.created_at = { $between: params.dateRange };
    }

    const orders = await ctx.db.getRepository('orders').find({
      filter,
      fields: ['quantity', 'unit_price', 'created_at', 'customer_id'],
      appends: ['customer.owner.nickname', 'customer.owner.id'],
    });

    type Bucket = { owner_id?: number | string; owner_name?: string; period: string; order_count: number; total_amount: number };
    const buckets = new Map<string, Bucket>();

    for (const o of orders) {
      const ownerId = o.customer?.owner?.id ?? o.customer?.owner_id;
      if (owner_id && String(ownerId) !== String(owner_id)) continue;
      const ownerName = o.customer?.owner?.nickname ?? (ownerId ? `User#${ownerId}` : '未分配');
      const key = `${ownerId || 'na'}::${periodKey(o.created_at, period)}`;
      const amount = (Number(o.quantity) || 0) * (Number(o.unit_price) || 0);
      const cur = buckets.get(key) ?? {
        owner_id: ownerId,
        owner_name: ownerName,
        period: periodKey(o.created_at, period),
        order_count: 0,
        total_amount: 0,
      };
      cur.order_count += 1;
      cur.total_amount += amount;
      buckets.set(key, cur);
    }

    ctx.body = Array.from(buckets.values()).map((b) => ({
      ...b,
      total_amount: Math.round(b.total_amount * 100) / 100,
      avg_amount: b.order_count ? Math.round((b.total_amount / b.order_count) * 100) / 100 : 0,
    }));
  } catch (err: any) {
    ctx.throw(500, `salesPerformance failed: ${err?.message || err}`);
  }
  await next();
}
