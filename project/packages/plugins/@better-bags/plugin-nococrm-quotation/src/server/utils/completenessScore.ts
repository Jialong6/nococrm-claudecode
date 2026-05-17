/**
 * T5.04 询盘完整度评分（纯函数，可单元测试）
 *
 * 评分规则（满分 100）：
 *   +20  product_category 非空
 *   +20  quantity > 0
 *   +15  material 非空
 *   +15  color 非空
 *   +10  sketch_url 非空（含至少一个附件）
 *   +10  target_price > 0
 *   +10  delivery_request 非空
 *
 * < 80 → 需求完善（refining）
 * ≥ 80 → 已交核价（costing）
 */

export interface InquiryLike {
  get(field: string): unknown;
}

const isNonEmptyString = (v: unknown): boolean => typeof v === 'string' && v.trim().length > 0;
const isNonEmptyArrayOrJson = (v: unknown): boolean => {
  if (!v) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'string') return v.trim().length > 0;
  if (typeof v === 'object') return Object.keys(v as Record<string, unknown>).length > 0;
  return false;
};
const isPositiveNumber = (v: unknown): boolean => typeof v === 'number' && v > 0;
const isTruthyDate = (v: unknown): boolean => {
  if (!v) return false;
  if (v instanceof Date) return !Number.isNaN(v.getTime());
  if (typeof v === 'string') return v.trim().length > 0;
  return false;
};

export function computeCompletenessScore(model: InquiryLike): number {
  let score = 0;
  if (model.get('product_category_id') || model.get('product_category')) score += 20;
  if (isPositiveNumber(model.get('quantity'))) score += 20;
  if (isNonEmptyString(model.get('material'))) score += 15;
  if (isNonEmptyString(model.get('color'))) score += 15;
  if (isNonEmptyArrayOrJson(model.get('sketch_url'))) score += 10;
  if (isPositiveNumber(model.get('target_price'))) score += 10;
  if (isTruthyDate(model.get('delivery_request'))) score += 10;
  return score;
}

export const COMPLETENESS_THRESHOLD = 80;
