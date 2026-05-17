/**
 * Seed Migration: 24 条话术
 *   - 12 条 followup_scripts（4 场景 × 中/英/日）
 *   - 12 条 negotiation_scripts（4 关切类别 × 中/英/日）
 *
 * 幂等：每张表先检查是否已有数据，已有则跳过。
 */

import { Migration } from '@nocobase/server';

// ====================================================================
// followup_scripts seed (T7.04)
// ====================================================================
const FOLLOWUP_SCRIPTS_SEED = [
  // ── decision_check 决策进展询问
  {
    scenario: 'decision_check',
    language: 'zh',
    subject: '{{customer.company_name}} 报价 {{quotation.quotation_no}} 决策进展确认',
    body:
      '{{customer.primary_contact}}，您好：\n\n上次我们发送的报价 {{quotation.quotation_no}} 距今已有两周，想了解一下贵司目前的决策进展。\n\n如果在价格、交期或其他条款上还有疑问，欢迎随时沟通；我们也可以根据实际需求做进一步调整。\n\n期待您的回复。\n\n{{user.nickname}} · Better Bags',
    applicable_priority: 'A,B,C',
    sort_order: 10,
  },
  {
    scenario: 'decision_check',
    language: 'en',
    subject: 'Following up on quotation {{quotation.quotation_no}}',
    body:
      'Dear {{customer.primary_contact}},\n\nI wanted to check in on the status of our quotation {{quotation.quotation_no}}, which we sent about two weeks ago.\n\nIf there are any remaining questions on pricing, lead time, or commercial terms, please let us know - we can also adjust the offer based on your needs.\n\nLooking forward to hearing from you.\n\nBest regards,\n{{user.nickname}} · Better Bags',
    applicable_priority: 'A,B,C',
    sort_order: 11,
  },
  {
    scenario: 'decision_check',
    language: 'ja',
    subject: 'お見積 {{quotation.quotation_no}} の検討状況のご確認',
    body:
      '{{customer.primary_contact}} 様\n\n先日お送りいたしましたお見積 {{quotation.quotation_no}} について、ご検討状況を伺いたくご連絡申し上げます。\n\n価格・納期・商務条件などにご不明点がございましたら、お気軽にお知らせください。ご要望に応じて柔軟に対応いたします。\n\n何卒よろしくお願いいたします。\n\n{{user.nickname}} · Better Bags',
    applicable_priority: 'A,B,C',
    sort_order: 12,
  },

  // ── new_case 提供新案例
  {
    scenario: 'new_case',
    language: 'zh',
    subject: '新增日本品牌成功案例分享 · 供 {{customer.company_name}} 参考',
    body:
      '{{customer.primary_contact}}，您好：\n\n近期我们刚完成一个与贵司产品定位类似的日本品牌订单，已得到客户高度认可。\n\n附件为案例摘要（材料 / 产能 / 交期实绩），希望对您的决策有参考价值。如果需要更多细节或样品，请直接回复邮件。\n\n{{user.nickname}} · Better Bags',
    applicable_priority: 'A,B,C',
    sort_order: 20,
  },
  {
    scenario: 'new_case',
    language: 'en',
    subject: 'New customer case for your reference',
    body:
      'Dear {{customer.primary_contact}},\n\nWe recently completed a project for a Japanese brand with a product positioning similar to yours, and received excellent feedback.\n\nA brief case summary (materials / capacity / actual lead time) is attached for your reference. If you would like additional details or samples, just let us know.\n\nBest regards,\n{{user.nickname}} · Better Bags',
    applicable_priority: 'A,B,C',
    sort_order: 21,
  },
  {
    scenario: 'new_case',
    language: 'ja',
    subject: '新規実績のご紹介 · ご参考までに',
    body:
      '{{customer.primary_contact}} 様\n\n最近、貴社の製品ポジショニングと近い日本ブランドの案件を完了し、お客様から高い評価をいただきました。\n\n素材・生産能力・実納期などのケースサマリーを添付しております。ご検討の参考になれば幸いです。詳細やサンプルが必要でしたら、本メールへご返信ください。\n\n{{user.nickname}} · Better Bags',
    applicable_priority: 'A,B,C',
    sort_order: 22,
  },

  // ── tech_support 技术补充
  {
    scenario: 'tech_support',
    language: 'zh',
    subject: '{{customer.company_name}} 技术补充资料',
    body:
      '{{customer.primary_contact}}，您好：\n\n根据上次沟通，附上以下技术补充资料：\n\n- 工艺单与用量表样板\n- X 线检针机操作流程\n- AQL 2.5 抽检的样本量与判定标准\n\n如有其他技术细节需要确认，请直接回复，我会协调工厂技术员与您对接。\n\n{{user.nickname}} · Better Bags',
    applicable_priority: 'A,B,C,D',
    sort_order: 30,
  },
  {
    scenario: 'tech_support',
    language: 'en',
    subject: 'Technical materials for your review',
    body:
      'Dear {{customer.primary_contact}},\n\nFollowing our previous discussion, please find the technical materials below:\n\n- Spec sheet & consumption table template\n- X-ray needle detection procedure\n- AQL 2.5 sampling size and acceptance criteria\n\nIf any additional technical clarification is needed, please reply and I will coordinate with our factory engineers.\n\nBest regards,\n{{user.nickname}} · Better Bags',
    applicable_priority: 'A,B,C,D',
    sort_order: 31,
  },
  {
    scenario: 'tech_support',
    language: 'ja',
    subject: '技術資料の追加共有',
    body:
      '{{customer.primary_contact}} 様\n\n先日のお打ち合わせを踏まえ、下記の技術資料をお送りいたします：\n\n- 仕様書および使用量表のテンプレート\n- X 線検針機の運用フロー\n- AQL 2.5 抜き取り検査のサンプル数および合否基準\n\nその他ご確認事項がございましたら、本メールへご返信ください。工場の技術担当と連携してご対応いたします。\n\n{{user.nickname}} · Better Bags',
    applicable_priority: 'A,B,C,D',
    sort_order: 32,
  },

  // ── greeting 节日问候
  {
    scenario: 'greeting',
    language: 'zh',
    subject: '节日问候 · Better Bags 全体团队',
    body:
      '{{customer.primary_contact}}，您好：\n\n值此佳节，Better Bags 全体团队向您及贵公司全体同仁致以最诚挚的问候。感谢一直以来的信任与支持，期待新的一年继续紧密合作。\n\n{{user.nickname}} · Better Bags',
    applicable_priority: 'A,B,C,D',
    sort_order: 40,
  },
  {
    scenario: 'greeting',
    language: 'en',
    subject: 'Season\'s greetings from Better Bags',
    body:
      'Dear {{customer.primary_contact}},\n\nOn behalf of the entire Better Bags team, we extend our warmest wishes to you and your colleagues. Thank you for your continued trust and partnership; we look forward to another productive year together.\n\nBest regards,\n{{user.nickname}} · Better Bags',
    applicable_priority: 'A,B,C,D',
    sort_order: 41,
  },
  {
    scenario: 'greeting',
    language: 'ja',
    subject: '季節のご挨拶 · Better Bags 一同より',
    body:
      '{{customer.primary_contact}} 様\n\nBetter Bags 一同より、{{customer.company_name}} の皆様に心からのご挨拶を申し上げます。\n\n日頃のご愛顧に深く感謝しております。新しい一年も変わらぬご支援を賜りますようお願い申し上げます。\n\n{{user.nickname}} · Better Bags',
    applicable_priority: 'A,B,C,D',
    sort_order: 42,
  },
];

// ====================================================================
// negotiation_scripts seed (T8.05)
// ====================================================================
const NEGOTIATION_SCRIPTS_SEED = [
  // ── price 价格异议
  {
    concern_category: 'price',
    language: 'zh',
    title: '价格异议 · 强调价值主张',
    body:
      '## 应对要点\n\n1. **共情**：理解贵司在成本控制上的诉求。\n2. **价值主张**：我们 20+ 年专注日本市场，对工艺细节、AQL 2.5 抽检、X 线检针的标准化让退货率长期 < 0.5%，这部分隐性成本远低于行业均值。\n3. **双工厂成本结构**：缅甸大货人工成本仅为日照的 35%；山东日照承担试单与急单减少试错损失。\n4. **双赢方案**：可提供阶梯折扣（1500-2999 件 X%，3000-4999 件 Y%）或建议调整面辅料组合压低单价。\n5. **底线**：不接明显低于成本的订单（来自 03 知识库）。',
    sort_order: 10,
  },
  {
    concern_category: 'price',
    language: 'en',
    title: 'Price Objection · Value Proposition',
    body:
      '## Talking Points\n\n1. **Empathy**: Acknowledge cost-control pressure.\n2. **Value**: 20+ years focused on Japan market; standardized AQL 2.5, X-ray needle detection, and craftsmanship keep return rates < 0.5%, which means lower hidden cost than industry average.\n3. **Dual-factory structure**: Myanmar bulk labour is ~35% of Rizhao; Rizhao handles trial/urgent orders to minimise iteration loss.\n4. **Win-win**: Offer tiered discounts (1,500-2,999 X%, 3,000-4,999 Y%) or suggest material adjustments to lower unit price.\n5. **Bottom line**: We will not accept orders below cost (per kb 03).',
    sort_order: 11,
  },
  {
    concern_category: 'price',
    language: 'ja',
    title: '価格交渉 · バリュープロポジション',
    body:
      '## 応対ポイント\n\n1. **共感**：コスト管理の重要性に理解を示す。\n2. **価値訴求**：20 年以上日本市場に特化、AQL 2.5 と X 線検針機による標準化で返品率は 0.5% 未満。隠れたコストは業界平均より低い。\n3. **二拠点コスト構造**：ミャンマー大量生産の人件費は日照の約 35%。日照では試作と急ぎを担当しイテレーションロスを最小化。\n4. **WIN-WIN 案**：階段式割引（1,500-2,999 個 X%、3,000-4,999 個 Y%）または素材調整による単価圧縮。\n5. **下限**：原価割れの受注は致しません（KB 03 に基づく）。',
    sort_order: 12,
  },

  // ── lead_time 交期异议
  {
    concern_category: 'lead_time',
    language: 'zh',
    title: '交期异议 · 90 天来源说明',
    body:
      '## 应对要点\n\n1. **90 天交期由来**（来自 04 知识库）：物料采购 2 周 + 国内入仓验货 1 周 + 国际海运清关 2 周 + 缅甸排产生产 4-5 周，共约 12-13 周。\n2. **加急方案**：若 ≤ 1500 件或必须压缩交期，路由到山东日照工厂，最快 30 天起陆续交货。\n3. **风险点**：拼柜延迟与排产等待是常见变量，需提前告知客户。\n4. **价值主张**：与其压缩交期导致品质降级，不如确保 PP 样确认 + 100% 成品检的完整流程。',
    sort_order: 20,
  },
  {
    concern_category: 'lead_time',
    language: 'en',
    title: 'Lead Time Objection · 90-Day Breakdown',
    body:
      '## Talking Points\n\n1. **90-day lead time breakdown** (kb 04): material sourcing 2w + DG inbound QC 1w + ocean shipping & clearance 2w + Myanmar production scheduling & manufacturing 4-5w ≈ 12-13 weeks.\n2. **Expedited option**: For ≤ 1,500 pcs or urgent orders we route to Rizhao (Shandong); first delivery as early as 30 days.\n3. **Variables**: Consolidation delays and production queue are common - we flag them early.\n4. **Value**: Compressing lead time at the cost of PP-sample approval and 100% finished QC is a false economy.',
    sort_order: 21,
  },
  {
    concern_category: 'lead_time',
    language: 'ja',
    title: '納期交渉 · 90 日の根拠説明',
    body:
      '## 応対ポイント\n\n1. **90 日納期の内訳**（KB 04）：原料調達 2 週 + 国内入庫検品 1 週 + 海運通関 2 週 + ミャンマー生産計画・縫製 4-5 週 = 約 12-13 週。\n2. **緊急対応**：1,500 個以下または短納期が必須の場合は山東日照工場に振替、最短 30 日からの順次納入。\n3. **リスク**：混載便の遅延や生産ライン待ちが発生する可能性があり、早めに共有します。\n4. **価値訴求**：PP サンプル承認と全数完成検品を省略する短納期化は、結局トータルコスト増になります。',
    sort_order: 22,
  },

  // ── payment 付款异议
  {
    concern_category: 'payment',
    language: 'zh',
    title: '付款条款异议 · T/T 30/70 行业标准',
    body:
      '## 应对要点\n\n1. **T/T 30/70 是行业标准**（来自 06 知识库）：30% 定金锁定排产，70% 尾款验货后支付。\n2. **VIP 政策**：已成交且历史订单 ≥ 3 的客户可申请 "T/T 见提单 1 周内"。\n3. **L/C 选项**：对大额订单或新客户均可接受信用证结算，保障双方资金安全。\n4. **不接受账期**：新客户严格执行 T/T，不开口子（一旦放开难以收回）。\n5. **双赢话术**："这个条款保障了双方利益——您 30% 启动生产，70% 验货后再付。"',
    sort_order: 30,
  },
  {
    concern_category: 'payment',
    language: 'en',
    title: 'Payment Terms · T/T 30/70 Industry Standard',
    body:
      '## Talking Points\n\n1. **T/T 30/70 is industry standard** (kb 06): 30% deposit locks production schedule, 70% balance after QC.\n2. **VIP policy**: Customers with status=closed and 3+ past orders can request "T/T against B/L within 1 week".\n3. **L/C option**: For large orders or new customers we accept L/C for mutual safety.\n4. **No credit terms**: Strict T/T for new customers - once relaxed it is hard to roll back.\n5. **Win-win**: "These terms protect both sides - 30% to start production, 70% only after quality inspection."',
    sort_order: 31,
  },
  {
    concern_category: 'payment',
    language: 'ja',
    title: '支払条件 · T/T 30/70 は業界標準',
    body:
      '## 応対ポイント\n\n1. **T/T 30/70 は業界標準**（KB 06）：30% 前金で生産枠を確保、70% 残金は検品後にお支払い。\n2. **VIP 条件**：成約済み（status=closed）かつ過去 3 件以上の取引があるお客様は「T/T 船荷証券提示後 1 週間以内」が利用可能。\n3. **L/C 選択肢**：大口取引や新規顧客には信用状決済を承ります。\n4. **掛売は不可**：新規顧客には T/T を厳守。一度認めると元に戻せません。\n5. **WIN-WIN 訴求**：「この条件は双方の利益を守ります - 30% で生産開始、70% は品質確認後」',
    sort_order: 32,
  },

  // ── moq MOQ 异议
  {
    concern_category: 'moq',
    language: 'zh',
    title: 'MOQ 异议 · 1500 件由来与试单方案',
    body:
      '## 应对要点\n\n1. **MOQ 1500 是缅甸大货红线**（来自 03 知识库）：低于 1500 件无法摊薄人工与排产成本。\n2. **试单方案**：< 1500 件可以路由到山东日照工厂，单款几百件起接，30 天交货。\n3. **多款合并**：若客户需多 SKU，可以合并到一个 PO 算总量（每款仍需 ≥ 1500 件单色）。\n4. **不接受补贴单**：1500 件以下走缅甸大货意味着我们补贴客户，违反业务红线。\n5. **未来扩展**：如果客户能承诺年单量 ≥ 5000 件，可单独商谈灵活方案。',
    sort_order: 40,
  },
  {
    concern_category: 'moq',
    language: 'en',
    title: 'MOQ Objection · Origin of 1,500 pcs',
    body:
      '## Talking Points\n\n1. **MOQ 1,500 is a hard line for Myanmar bulk** (kb 03): below 1,500 we cannot amortise labour and scheduling cost.\n2. **Trial-order option**: < 1,500 pcs routes to Rizhao (Shandong); we accept a few hundred pcs/style, 30-day delivery.\n3. **Multi-SKU**: Combine multiple SKUs into one PO (each SKU still ≥ 1,500 pcs/colour for Myanmar).\n4. **No subsidised orders**: Running < 1,500 in Myanmar means we subsidise the customer - violates internal policy.\n5. **Future scale**: If annual volume ≥ 5,000 pcs is committed, we can discuss tailored terms.',
    sort_order: 41,
  },
  {
    concern_category: 'moq',
    language: 'ja',
    title: 'MOQ 交渉 · 1,500 個の根拠と試作案',
    body:
      '## 応対ポイント\n\n1. **MOQ 1,500 個はミャンマー大量生産の絶対基準**（KB 03）：これを下回ると人件費とライン稼働費を吸収できません。\n2. **試作対応**：1,500 個未満は山東日照工場に振替、数百個から受注可能、30 日納期。\n3. **複数 SKU 合算**：複数 SKU を 1 つの PO にまとめて合算可（ただし型・色ごとに 1,500 個以上必要）。\n4. **赤字受注は不可**：1,500 個未満をミャンマーで生産することは弊社負担となり、社内ポリシーに反します。\n5. **将来の拡大**：年間 5,000 個以上のコミットメントがあれば、柔軟な条件を個別協議可能です。',
    sort_order: 42,
  },
];

export default class SeedFollowupScriptsMigration extends Migration {
  on = 'afterLoad' as const;
  appVersion = '<2.x';

  async up() {
    const db = this.db;

    const followupRepo = db.getRepository('followup_scripts');
    if (followupRepo && (await followupRepo.count()) === 0) {
      await followupRepo.createMany({ records: FOLLOWUP_SCRIPTS_SEED });
    }

    const negotiationRepo = db.getRepository('negotiation_scripts');
    if (negotiationRepo && (await negotiationRepo.count()) === 0) {
      await negotiationRepo.createMany({ records: NEGOTIATION_SCRIPTS_SEED });
    }
  }
}
