/**
 * T6.01 正式报价单 quotations
 * 由 plugin.ts 多个 beforeSave hook 驱动业务红线：
 *   - T6.02 incoterms 默认（按 production_factory.country）
 *   - T6.03 payment_terms 新客户硬校验（tt_bl 仅 VIP）
 *   - T6.04 lead_time 下限校验（缅甸 ≥ 90 天）
 *   - T6.05 工厂路由（quantity ≥ 1500 且非急单 → 缅甸）
 *   - T6.06 价格底线审批（低于 cost_estimates.final_price → status 锁回 draft）
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'quotations',
  title: '报价单',
  shared: true,
  sortable: true,
  createdBy: true,
  updatedBy: true,
  logging: true,
  fields: [
    {
      type: 'bigInt',
      name: 'id',
      primaryKey: true,
      autoIncrement: true,
      interface: 'integer',
    },
    {
      type: 'sequence',
      name: 'quotation_no',
      patterns: [
        { type: 'string', options: { value: 'QT-' } },
        { type: 'date', options: { format: 'YYYYMMDD' } },
        { type: 'string', options: { value: '-' } },
        { type: 'integer', options: { digits: 3, start: 1 } },
      ],
      interface: 'sequence',
      uiSchema: { type: 'string', title: '报价单号', 'x-component': 'Input', 'x-read-pretty': true },
    },
    {
      type: 'belongsTo',
      name: 'inquiry',
      target: 'inquiries',
      foreignKey: 'inquiry_id',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '询盘',
        'x-component': 'AssociationField',
        'x-component-props': { fieldNames: { label: 'inquiry_no', value: 'id' } },
        required: true,
      },
    },
    {
      type: 'belongsTo',
      name: 'customer',
      target: 'customers',
      foreignKey: 'customer_id',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '客户',
        'x-component': 'AssociationField',
        'x-component-props': { fieldNames: { label: 'company_name', value: 'id' } },
        description: '从 inquiry 自动同步',
      },
    },
    {
      type: 'integer',
      name: 'version',
      defaultValue: 1,
      interface: 'integer',
      uiSchema: {
        type: 'number',
        title: '版本号',
        'x-component': 'InputNumber',
        'x-component-props': { min: 1 },
      },
    },
    {
      type: 'decimal',
      name: 'unit_price',
      interface: 'number',
      uiSchema: {
        type: 'number',
        title: '单价',
        'x-component': 'InputNumber',
        'x-component-props': { min: 0, precision: 2 },
        required: true,
      },
    },
    {
      type: 'belongsTo',
      name: 'currency',
      target: 'currencies_dict',
      foreignKey: 'currency_code',
      targetKey: 'code',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '币种',
        'x-component': 'AssociationField',
      },
    },
    {
      type: 'integer',
      name: 'quantity',
      interface: 'integer',
      uiSchema: {
        type: 'number',
        title: '数量',
        'x-component': 'InputNumber',
        'x-component-props': { min: 1 },
        required: true,
      },
    },
    {
      type: 'formula',
      name: 'total',
      dataType: 'decimal',
      expression: 'unit_price * quantity',
      interface: 'formula',
      uiSchema: { type: 'number', title: '总金额', 'x-component': 'InputNumber', 'x-read-pretty': true },
    },
    {
      type: 'string',
      name: 'incoterms',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '贸易条款',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'FOB Yangon', label: 'FOB Yangon（缅甸默认）' },
          { value: 'FOB Qingdao', label: 'FOB Qingdao（国内默认）' },
          { value: 'CIF', label: 'CIF' },
          { value: 'EXW', label: 'EXW' },
          { value: 'DDP', label: 'DDP' },
          { value: 'other', label: '其他' },
        ],
        description: '不填将根据工厂国家自动设置',
      },
    },
    {
      type: 'string',
      name: 'payment_terms',
      defaultValue: 'tt_30_70',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '付款条款',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'tt_30_70', label: 'T/T 30% 定金 + 70% 尾款（新客户默认）' },
          { value: 'tt_bl', label: 'T/T 见提单复印件 1 周内（仅 VIP）' },
          { value: 'lc', label: 'L/C 信用证' },
          { value: 'other', label: '其他' },
        ],
        description: '新客户选 tt_bl 会被系统阻止',
      },
    },
    {
      type: 'integer',
      name: 'lead_time_days',
      defaultValue: 90,
      interface: 'integer',
      uiSchema: {
        type: 'number',
        title: '交期（天）',
        'x-component': 'InputNumber',
        'x-component-props': { min: 1 },
        description: '缅甸大货不得短于 90 天；山东急单允许 30 天',
      },
    },
    {
      type: 'date',
      name: 'valid_until',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        title: '报价有效期',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: false },
        description: '默认 now + 30 天',
      },
    },
    {
      type: 'belongsTo',
      name: 'production_factory',
      target: 'factories',
      foreignKey: 'production_factory_id',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '生产工厂',
        'x-component': 'AssociationField',
        description: '不填将按 MOQ + 急单自动路由（≥1500 非急单 → 缅甸；其余 → 日照）',
      },
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'draft',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '状态',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'draft', label: '草稿', color: 'default' },
          { value: 'sent', label: '已发送', color: 'blue' },
          { value: 'negotiating', label: '谈判中', color: 'gold' },
          { value: 'confirmed', label: '已确认', color: 'cyan' },
          { value: 'contracted', label: '已合同化', color: 'green' },
          { value: 'expired', label: '已过期', color: 'default' },
          { value: 'abandoned', label: '已废弃', color: 'red' },
        ],
      },
    },
    {
      type: 'text',
      name: 'pending_approval_reason',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: '待审批原因',
        'x-component': 'Input.TextArea',
        'x-read-pretty': true,
        description: '价格底线触发审批时，系统自动写入说明',
      },
    },
    {
      type: 'date',
      name: 'sent_at',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '发送时间', 'x-component': 'DatePicker', 'x-component-props': { showTime: true } },
    },
    {
      type: 'date',
      name: 'confirmed_at',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '客户确认时间', 'x-component': 'DatePicker', 'x-component-props': { showTime: true } },
    },
    {
      type: 'text',
      name: 'notes',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: '备注',
        'x-component': 'Input.TextArea',
        description: '人工覆盖路由建议时，请说明理由',
      },
    },
  ],
});
