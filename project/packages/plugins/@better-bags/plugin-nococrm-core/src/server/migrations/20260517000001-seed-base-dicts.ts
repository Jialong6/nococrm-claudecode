/**
 * Seed Migration: 灌入 Better Bags 业务基础字典数据
 *
 * 包含：
 *   - factories (3): CN_RZ 山东日照 / CN_QD 青岛打样中心 / MM_YGN 缅甸仰光（来自 02 知识库）
 *   - product_categories (6): 背包/通勤包/休闲包/学生包/布包/其他（来自 03 知识库）
 *   - regions_dict (20): 主要国家
 *   - currencies_dict (7): USD/CNY/JPY/EUR/GBP/KRW/MMK
 *   - lead_sources (11): 网站表单/ChatBot/邮件/WhatsApp/微信/展会/朋友介绍/海关数据/Google 广告/LinkedIn/其他
 *
 * 幂等：每张表先检查是否已有数据，已有则跳过。
 */

import { Migration } from '@nocobase/server';

const REGIONS_SEED = [
  { code: 'JP', name_zh: '日本', name_en: 'Japan', phone_code: '+81' },
  { code: 'CN', name_zh: '中国', name_en: 'China', phone_code: '+86' },
  { code: 'US', name_zh: '美国', name_en: 'United States', phone_code: '+1' },
  { code: 'DE', name_zh: '德国', name_en: 'Germany', phone_code: '+49' },
  { code: 'FR', name_zh: '法国', name_en: 'France', phone_code: '+33' },
  { code: 'GB', name_zh: '英国', name_en: 'United Kingdom', phone_code: '+44' },
  { code: 'KR', name_zh: '韩国', name_en: 'South Korea', phone_code: '+82' },
  { code: 'VN', name_zh: '越南', name_en: 'Vietnam', phone_code: '+84' },
  { code: 'TH', name_zh: '泰国', name_en: 'Thailand', phone_code: '+66' },
  { code: 'MM', name_zh: '缅甸', name_en: 'Myanmar', phone_code: '+95' },
  { code: 'IN', name_zh: '印度', name_en: 'India', phone_code: '+91' },
  { code: 'ID', name_zh: '印尼', name_en: 'Indonesia', phone_code: '+62' },
  { code: 'SG', name_zh: '新加坡', name_en: 'Singapore', phone_code: '+65' },
  { code: 'AU', name_zh: '澳大利亚', name_en: 'Australia', phone_code: '+61' },
  { code: 'CA', name_zh: '加拿大', name_en: 'Canada', phone_code: '+1' },
  { code: 'ES', name_zh: '西班牙', name_en: 'Spain', phone_code: '+34' },
  { code: 'IT', name_zh: '意大利', name_en: 'Italy', phone_code: '+39' },
  { code: 'RU', name_zh: '俄罗斯', name_en: 'Russia', phone_code: '+7' },
  { code: 'BR', name_zh: '巴西', name_en: 'Brazil', phone_code: '+55' },
  { code: 'MX', name_zh: '墨西哥', name_en: 'Mexico', phone_code: '+52' },
];

const CURRENCIES_SEED = [
  { code: 'USD', symbol: '$', name: '美元', name_en: 'US Dollar' },
  { code: 'CNY', symbol: '¥', name: '人民币', name_en: 'Chinese Yuan' },
  { code: 'JPY', symbol: '¥', name: '日元', name_en: 'Japanese Yen' },
  { code: 'EUR', symbol: '€', name: '欧元', name_en: 'Euro' },
  { code: 'GBP', symbol: '£', name: '英镑', name_en: 'British Pound' },
  { code: 'KRW', symbol: '₩', name: '韩元', name_en: 'South Korean Won' },
  { code: 'MMK', symbol: 'K', name: '缅元', name_en: 'Myanmar Kyat' },
];

const LEAD_SOURCES_SEED = [
  { name: '网站表单', name_en: 'Website Form', sort_order: 10 },
  { name: 'ChatBot', name_en: 'ChatBot', sort_order: 20 },
  { name: '邮件', name_en: 'Email', sort_order: 30 },
  { name: 'WhatsApp', name_en: 'WhatsApp', sort_order: 40 },
  { name: '微信', name_en: 'WeChat', sort_order: 50 },
  { name: '展会', name_en: 'Trade Show', sort_order: 60 },
  { name: '朋友介绍', name_en: 'Referral', sort_order: 70 },
  { name: '海关数据', name_en: 'Customs Data', sort_order: 80 },
  { name: 'Google 广告', name_en: 'Google Ads', sort_order: 90 },
  { name: 'LinkedIn', name_en: 'LinkedIn', sort_order: 100 },
  { name: '其他', name_en: 'Other', sort_order: 999 },
];

// 来自 02-工厂硬件与设备产能.md
const FACTORIES_SEED = [
  {
    code: 'CN_RZ',
    name: '山东日照主厂',
    country: 'CN',
    address: '山东省日照市莒县洛河镇',
    capacity_monthly_pcs: 50000,
    sewing_workers: 100,
    flat_machines: 120,
    computer_machines: 22,
    equipment: {
      其他辅助设备: 20,
      X线检针机: 1,
      厂房面积平米: 8000,
    },
    is_sampling_center: false,
    is_active: true,
  },
  {
    code: 'CN_QD',
    name: '青岛打样中心',
    country: 'CN',
    address: '山东省青岛市',
    capacity_monthly_pcs: 0,
    sewing_workers: 0,
    flat_machines: 0,
    computer_machines: 0,
    equipment: { 备注: '专门打样车间，负责快速开发、打样、改版和核价' },
    is_sampling_center: true,
    is_active: true,
  },
  {
    code: 'MM_YGN',
    name: '缅甸仰光工厂',
    country: 'MM',
    address: '缅甸仰光 NGWE PIN LAI 工业区',
    capacity_monthly_pcs: 200000,
    sewing_workers: 370,
    flat_machines: 420,
    computer_machines: 48,
    equipment: {
      高车: 60,
      双针车: 12,
      裁断机: 10,
      打钉机: 10,
      X线检针机: 2,
      摇臂高车: 2,
      切带机: 5,
      熨烫机: 1,
      自动分条机: 1,
      卷料机: 1,
    },
    is_sampling_center: false,
    is_active: true,
  },
];

// 来自 03-产品线与接单策略.md：缅甸 MOQ 1500 是硬约束
const PRODUCT_CATEGORIES_SEED = [
  { name: '背包', name_en: 'Backpack', name_ja: 'バックパック', default_moq: 1500, sort_order: 10 },
  { name: '都市通勤包', name_en: 'Commuter Bag', name_ja: 'コミューターバッグ', default_moq: 1500, sort_order: 20 },
  { name: '休闲包', name_en: 'Casual Bag', name_ja: 'カジュアルバッグ', default_moq: 1500, sort_order: 30 },
  { name: '学生包', name_en: 'School Bag', name_ja: 'スクールバッグ', default_moq: 1500, sort_order: 40 },
  { name: '布包', name_en: 'Tote Bag', name_ja: 'トートバッグ', default_moq: 1500, sort_order: 50 },
  { name: '其他', name_en: 'Other', name_ja: 'その他', default_moq: 1500, sort_order: 999 },
];

export default class SeedBaseDictsMigration extends Migration {
  on = 'afterLoad' as const;
  appVersion = '<2.x';

  async up() {
    const db = this.db;

    // regions_dict
    const regionsRepo = db.getRepository('regions_dict');
    if (regionsRepo && (await regionsRepo.count()) === 0) {
      await regionsRepo.createMany({ records: REGIONS_SEED });
    }

    // currencies_dict
    const currenciesRepo = db.getRepository('currencies_dict');
    if (currenciesRepo && (await currenciesRepo.count()) === 0) {
      await currenciesRepo.createMany({ records: CURRENCIES_SEED });
    }

    // lead_sources
    const sourcesRepo = db.getRepository('lead_sources');
    if (sourcesRepo && (await sourcesRepo.count()) === 0) {
      await sourcesRepo.createMany({ records: LEAD_SOURCES_SEED });
    }

    // factories
    const factoriesRepo = db.getRepository('factories');
    if (factoriesRepo && (await factoriesRepo.count()) === 0) {
      await factoriesRepo.createMany({ records: FACTORIES_SEED });
    }

    // product_categories
    const categoriesRepo = db.getRepository('product_categories');
    if (categoriesRepo && (await categoriesRepo.count()) === 0) {
      // 默认全部路由到缅甸（MOQ ≥ 1500 都走 MM_YGN，由后续 quotation 工作流再覆盖）
      const ygn = await factoriesRepo.findOne({ filter: { code: 'MM_YGN' } });
      const records = PRODUCT_CATEGORIES_SEED.map((c) => ({
        ...c,
        default_factory_id: ygn?.id,
      }));
      await categoriesRepo.createMany({ records });
    }
  }
}
