/**
 * T16.07 财务现金流 payments:cashFlow
 *
 * 输入：month（YYYY-MM，默认本月）
 * 输出：{
 *   month,
 *   deposit_receivable, deposit_paid, deposit_overdue,
 *   balance_receivable, balance_paid, balance_overdue,
 *   total_receivable, total_paid, total_overdue
 * }
 */

function startEndOfMonth(month?: string): [Date, Date] {
  let year: number;
  let m: number;
  if (typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)) {
    [year, m] = month.split('-').map((s) => Number(s));
  } else {
    const now = new Date();
    year = now.getFullYear();
    m = now.getMonth() + 1;
  }
  const start = new Date(year, m - 1, 1);
  const end = new Date(year, m, 1);
  return [start, end];
}

export default async function cashFlow(ctx: any, next: () => Promise<void>) {
  try {
    const params = ctx.action?.params ?? {};
    const [start, end] = startEndOfMonth(params.month);
    const monthLabel = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;

    const payments = await ctx.db.getRepository('payments').find({
      filter: { due_date: { $between: [start, end] } },
      fields: ['type', 'status', 'amount', 'due_date', 'paid_at'],
    });

    const now = new Date();
    const acc = {
      month: monthLabel,
      deposit_receivable: 0,
      deposit_paid: 0,
      deposit_overdue: 0,
      balance_receivable: 0,
      balance_paid: 0,
      balance_overdue: 0,
      total_receivable: 0,
      total_paid: 0,
      total_overdue: 0,
    };

    for (const p of payments) {
      const type = String(p.type ?? p.get?.('type') ?? 'other');
      const status = String(p.status ?? p.get?.('status') ?? 'unpaid');
      const amount = Number(p.amount) || 0;
      const dueDate = p.due_date ? new Date(p.due_date) : null;
      const isOverdue = status !== 'paid' && dueDate && dueDate.getTime() < now.getTime();

      if (type === 'deposit') {
        if (status === 'paid') acc.deposit_paid += amount;
        else acc.deposit_receivable += amount;
        if (isOverdue) acc.deposit_overdue += amount;
      } else if (type === 'balance') {
        if (status === 'paid') acc.balance_paid += amount;
        else acc.balance_receivable += amount;
        if (isOverdue) acc.balance_overdue += amount;
      }

      if (status === 'paid') acc.total_paid += amount;
      else acc.total_receivable += amount;
      if (isOverdue) acc.total_overdue += amount;
    }

    // 保留 2 位小数
    Object.keys(acc).forEach((k) => {
      if (typeof (acc as any)[k] === 'number') {
        (acc as any)[k] = Math.round((acc as any)[k] * 100) / 100;
      }
    });

    ctx.body = acc;
  } catch (err: any) {
    ctx.throw(500, `cashFlow failed: ${err?.message || err}`);
  }
  await next();
}
