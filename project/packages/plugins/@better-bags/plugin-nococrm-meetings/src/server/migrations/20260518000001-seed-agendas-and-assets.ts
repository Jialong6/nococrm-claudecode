/**
 * Seed Migration: 议程模板 + 公司资料库
 *
 * 包含：
 *   - meeting_agenda_templates (5): 初次介绍 / 需求确认 / 工厂参观 / 报价讨论 / 大货前确认
 *   - company_assets (10): 公司简介中英日 + 双工厂介绍 + ISO 证书 + QC 流程 + 设备清单
 *                          + 日本品牌案例 + AQL 2.5 抽检说明（来源：01/02/05 知识库）
 *
 * 幂等：每张表先检查是否已有数据，已有则跳过。
 */

import { Migration } from '@nocobase/server';

const AGENDA_TEMPLATES_SEED = [
  {
    name: '初次介绍',
    description: '潜在客户首次接触，建立信任',
    applicable_type: 'all',
    sort_order: 10,
    body: `# 初次介绍议程（建议 45-60 分钟）

## 1. 双方自我介绍 (5 min)
- 客户公司背景 / 产品线 / 主要市场
- Better Bags：成立 2003 年，20+ 年箱包 OEM/ODM 经验

## 2. 公司核心优势 (10 min)
- 中国山东 + 缅甸仰光 双工厂布局
- 日本市场为主，对品质与交期严格把控
- 工艺单 / 用量表 / 首件确认的标准化品管流程

## 3. 客户需求初步了解 (15 min)
- 产品类别（背包 / 通勤包 / 学生包 / 其他）
- 预估年度采购量
- 目标市场与消费层
- 当前供应链痛点

## 4. 我方能力展示 (10 min)
- ISO 9001 证书
- 日本品牌成功案例 2-3 个
- 设备清单（X 线检针机 / 高车 / 电脑车）

## 5. 下一步 (5 min)
- 产品设计稿 / 规格书发送时间
- 是否需要工厂参观
- 后续沟通频率与负责人
`,
  },
  {
    name: '需求确认',
    description: '客户需求收集，为核价做准备',
    applicable_type: 'all',
    sort_order: 20,
    body: `# 需求确认议程（建议 60 分钟）

## 1. 产品规格确认 (15 min)
- 款式 / 尺寸 / 颜色 / 内部结构
- 设计稿 vs 实物样品
- 是否包含品牌 logo / 吊牌 / 包装

## 2. 材料与辅料 (10 min)
- 主面料：尼龙 / 涤纶 / 帆布 / 其他
- 里料 / 五金 / 拉链 / 织带 / 包装规格
- 客供 vs 我方采购

## 3. 数量与交期 (10 min)
- 单款单色数量（缅甸大货 MOQ 1500 件起）
- 期望交货时间
- 是否分批发货

## 4. 价格与商务条款 (10 min)
- 目标 FOB 单价（缅甸 → FOB Yangon，国内 → FOB Qingdao）
- 付款条款（新客户：T/T 30% 定金 + 70% 尾款）
- 是否需要 L/C

## 5. 打样安排 (10 min)
- 是否需要打样（首样 1 周）
- 样品规格与颜色
- 修改轮次预期（行业惯例 1-2 次）

## 6. 待办清单 (5 min)
- 客户：发送设计稿 / 规格书 / 原样
- 我方：核价并出报价单（5 个工作日）
`,
  },
  {
    name: '工厂参观',
    description: '现场或视频参观工厂，建立信任',
    applicable_type: 'tour',
    sort_order: 30,
    body: `# 工厂参观议程（线下 2-3 小时 / 视频 1 小时）

## 1. 工厂概况 (15 min)
- 厂区面积 / 员工规模 / 月产能
- 山东日照：8000㎡，约 100 人车缝，月产 50000 件
- 缅甸仰光 NGWE PIN LAI：370 人车缝，月产 200000 件

## 2. 生产车间 (30 min)
- 裁断车间（裁断机 10 台）
- 缝纫车间（平车 420 / 电脑车 48 / 高车 60 / 双针车 12）
- 钉胶 / 包装区
- X 线检针机展示（缅甸 2 台 / 山东 1 台）

## 3. 仓储与物料 (10 min)
- 面辅料仓
- 成品仓
- 国内东莞沙田中转仓的作用

## 4. QC 流程 (20 min)
- 进料检验
- 首件确认
- AQL 2.5 抽检
- 出货前 100% 成品检
- 客户验厂配合流程

## 5. 客户问答 (15 min)
- 现场答疑
- 客户特殊关注点

## 6. 总结与下一步 (10 min)
- 当日反馈
- 后续沟通计划
`,
  },
  {
    name: '报价讨论',
    description: '报价单发送后客户反馈讨论',
    applicable_type: 'all',
    sort_order: 40,
    body: `# 报价讨论议程（45 分钟）

## 1. 报价复述 (10 min)
- 单价 / 数量 / 总金额
- FOB 港 / 交期 / 付款条款
- 报价有效期

## 2. 客户关切 (20 min)
- 价格异议（是否在目标价范围）
- 交期异议（90 天大货是否可压缩）
- 付款条款异议
- 材料 / 工艺差异讨论

## 3. 应对方案 (10 min)
- 阶梯折扣方案
- 材料调整方案
- 分批发货方案
- 价值主张强化（品质 / 交期 / 服务）

## 4. 下一步 (5 min)
- 修订报价单发送时间
- 是否进入打样阶段
- 决策人确认时间
`,
  },
  {
    name: '大货前确认',
    description: 'PP 样审核 + 大货前最终确认',
    applicable_type: 'all',
    sort_order: 50,
    body: `# 大货前确认议程（60 分钟）

## 1. PP 样审核 (20 min)
- 颜色 / 尺寸 / 工艺细节
- 包装方式
- 客户最终签字确认

## 2. 大货排产计划 (15 min)
- 物料齐套时间（约 1 个月）
- 排线开工日期
- 各里程碑（裁断 / 缝制 / 钉胶 / 检针 / 包装 / 检验）
- 预计完工日

## 3. 质量控制约定 (10 min)
- AQL 抽检等级（默认 2.5）
- 客户验厂安排
- 第三方验货方案

## 4. 物流与文件 (10 min)
- 货代选择
- 出货文件清单（发票 / 装箱单 / 原产地证）
- 海运 ETD / ETA

## 5. 付款节点 (5 min)
- 定金确认
- 尾款时间
- 文件提交时点
`,
  },
];

// 来自 01/02/05 知识库
const COMPANY_ASSETS_SEED = [
  {
    asset_type: 'company_intro',
    title: '公司简介（中文）',
    description: '一页纸公司介绍，含成立年份 / 双工厂布局 / 核心市场',
    language: 'zh',
    is_public: true,
    sort_order: 10,
  },
  {
    asset_type: 'company_intro',
    title: 'Company Profile (English)',
    description: 'One-pager profile with founding year, dual-factory layout, core market',
    language: 'en',
    is_public: true,
    sort_order: 20,
  },
  {
    asset_type: 'company_intro',
    title: '会社案内（日本語）',
    description: '日本市場向け会社案内',
    language: 'ja',
    is_public: true,
    sort_order: 30,
  },
  {
    asset_type: 'factory_intro',
    title: '山东日照主厂介绍',
    description: '厂房 8000 ㎡ / 缝纫 100 人 / 平车 120 / 电脑车 22 / X 线检针机 1 台',
    language: 'all',
    is_public: true,
    sort_order: 40,
  },
  {
    asset_type: 'factory_intro',
    title: '缅甸仰光工厂介绍',
    description:
      'NGWE PIN LAI 工业区 / 缝纫 370 人 / 平车 420 / 电脑车 48 / 高车 60 / 双针车 12 / X 线检针机 2 台',
    language: 'all',
    is_public: true,
    sort_order: 50,
  },
  {
    asset_type: 'iso_cert',
    title: 'ISO 9001 质量管理体系认证',
    description: '有效期内的 ISO 9001 证书扫描件',
    language: 'all',
    is_public: true,
    sort_order: 60,
  },
  {
    asset_type: 'qc_process',
    title: 'QC 品质流程图',
    description: '进料检验 → 首件确认 → 在线巡检 → AQL 2.5 抽检 → 100% 成品检',
    language: 'all',
    is_public: true,
    sort_order: 70,
  },
  {
    asset_type: 'equipment',
    title: '完整设备清单',
    description: '平车 / 电脑车 / 高车 / 双针车 / 裁断机 / 打钉机 / X 线检针机 / 摇臂高车 / 切带机 / 熨烫机',
    language: 'all',
    is_public: true,
    sort_order: 80,
  },
  {
    asset_type: 'customer_case',
    title: '日本品牌成功案例集',
    description: '20+ 年日本市场合作经验，包含多家品牌的代表性订单',
    language: 'all',
    is_public: false,
    sort_order: 90,
  },
  {
    asset_type: 'qc_process',
    title: 'AQL 2.5 抽检说明',
    description: 'AQL 2.5 抽检的样本量计算 / 致命 / 主要 / 次要缺陷判定标准',
    language: 'all',
    is_public: true,
    sort_order: 100,
  },
];

export default class SeedAgendasAndAssetsMigration extends Migration {
  on = 'afterLoad' as const;
  appVersion = '<2.x';

  async up() {
    const db = this.db;

    const tplRepo = db.getRepository('meeting_agenda_templates');
    if (tplRepo && (await tplRepo.count()) === 0) {
      await tplRepo.createMany({ records: AGENDA_TEMPLATES_SEED });
    }

    const assetsRepo = db.getRepository('company_assets');
    if (assetsRepo && (await assetsRepo.count()) === 0) {
      await assetsRepo.createMany({ records: COMPANY_ASSETS_SEED });
    }
  }
}
