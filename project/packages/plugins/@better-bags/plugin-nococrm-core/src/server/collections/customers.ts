/**
 * T2.02 客户主表 customers + T2.04 priority 颜色映射
 * 来源：tasks.md M2 + CLAUDE.md A/B/C/D 标准
 *
 * 字段说明：30+ 字段覆盖基本/联系/分级/业务/元数据五大块。
 * priority 单选项配置 4 种颜色（uiSchema.enum[*].color）。
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'customers',
  title: '客户',
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
      name: 'customer_code',
      patterns: [
        { type: 'string', options: { value: 'CUST-' } },
        { type: 'date', options: { format: 'YYYYMM' } },
        { type: 'string', options: { value: '-' } },
        { type: 'integer', options: { digits: 3, start: 1 } },
      ],
      interface: 'sequence',
      uiSchema: { type: 'string', title: '客户编号', 'x-component': 'Input', 'x-read-pretty': true },
    },
    // === 基本信息 ===
    {
      type: 'string',
      name: 'company_name',
      interface: 'input',
      uiSchema: { type: 'string', title: '公司名（中）', 'x-component': 'Input', required: true },
    },
    {
      type: 'string',
      name: 'company_name_en',
      interface: 'input',
      uiSchema: { type: 'string', title: '公司名（英）', 'x-component': 'Input' },
    },
    {
      type: 'belongsTo',
      name: 'country',
      target: 'regions_dict',
      foreignKey: 'country_code',
      targetKey: 'code',
      interface: 'm2o',
      uiSchema: { type: 'object', title: '国家', 'x-component': 'AssociationField' },
    },
    {
      type: 'string',
      name: 'city',
      interface: 'input',
      uiSchema: { type: 'string', title: '城市', 'x-component': 'Input' },
    },
    {
      type: 'string',
      name: 'industry',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '行业',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'brand', label: '品牌商' },
          { value: 'trading', label: '贸易商' },
          { value: 'retail', label: '零售' },
          { value: 'design', label: '设计公司' },
          { value: 'other', label: '其他' },
        ],
      },
    },
    {
      type: 'string',
      name: 'website',
      interface: 'url',
      uiSchema: { type: 'string', title: '网站', 'x-component': 'Input.URL' },
    },
    // === 联系方式 ===
    {
      type: 'string',
      name: 'primary_contact',
      interface: 'input',
      uiSchema: { type: 'string', title: '主要联系人', 'x-component': 'Input', required: true },
    },
    {
      type: 'string',
      name: 'phone',
      interface: 'phone',
      uiSchema: { type: 'string', title: '电话', 'x-component': 'Input' },
    },
    {
      type: 'string',
      name: 'email',
      interface: 'email',
      uiSchema: { type: 'string', title: '邮箱', 'x-component': 'Input', required: true },
    },
    {
      type: 'string',
      name: 'wechat',
      interface: 'input',
      uiSchema: { type: 'string', title: '微信', 'x-component': 'Input' },
    },
    {
      type: 'string',
      name: 'whatsapp',
      interface: 'input',
      uiSchema: { type: 'string', title: 'WhatsApp', 'x-component': 'Input' },
    },
    // === 分级与状态 ===
    {
      type: 'string',
      name: 'priority',
      interface: 'radioGroup',
      defaultValue: 'D',
      uiSchema: {
        type: 'string',
        title: '客户等级',
        'x-component': 'Radio.Group',
        required: true,
        enum: [
          { value: 'A', label: 'A 类 - 现有客户', color: '#2e7d32' },
          { value: 'B', label: 'B 类 - 重要新客户', color: '#ef6c00' },
          { value: 'C', label: 'C 类 - 一般潜客', color: '#7b1fa2' },
          { value: 'D', label: 'D 类 - 低意向', color: '#546e7a' },
        ],
      },
    },
    {
      type: 'string',
      name: 'status',
      interface: 'radioGroup',
      defaultValue: 'new',
      uiSchema: {
        type: 'string',
        title: '客户状态',
        'x-component': 'Radio.Group',
        required: true,
        enum: [
          { value: 'new', label: '新建', color: 'default' },
          { value: 'following', label: '跟进中', color: 'blue' },
          { value: 'quoted', label: '已报价', color: 'cyan' },
          { value: 'negotiating', label: '谈判中', color: 'gold' },
          { value: 'ordered', label: '已下单', color: 'orange' },
          { value: 'closed', label: '已成交', color: 'green' },
          { value: 'maintaining', label: '长期维护', color: 'purple' },
          { value: 'lost', label: '已流失', color: 'red' },
        ],
      },
    },
    {
      type: 'boolean',
      name: 'risk_flag',
      interface: 'checkbox',
      defaultValue: false,
      uiSchema: {
        type: 'boolean',
        title: '高风险',
        'x-component': 'Checkbox',
        description: '打样 ≥ 4 次或谈判 ≥ 5 轮自动标记',
      },
    },
    {
      type: 'belongsTo',
      name: 'source',
      target: 'lead_sources',
      foreignKey: 'source_id',
      interface: 'm2o',
      uiSchema: { type: 'object', title: '来源', 'x-component': 'AssociationField', required: true },
    },
    // === 业务字段 ===
    {
      type: 'integer',
      name: 'annual_volume_estimate',
      interface: 'integer',
      uiSchema: {
        type: 'number',
        title: '预估年单量（件）',
        'x-component': 'InputNumber',
        'x-component-props': { min: 0 },
      },
    },
    {
      type: 'belongsToMany',
      name: 'target_categories',
      target: 'product_categories',
      through: 'customers_product_categories',
      foreignKey: 'customer_id',
      otherKey: 'product_category_id',
      interface: 'm2m',
      uiSchema: { type: 'array', title: '目标品类', 'x-component': 'AssociationField' },
    },
    {
      type: 'belongsTo',
      name: 'preferred_factory',
      target: 'factories',
      foreignKey: 'preferred_factory_id',
      interface: 'm2o',
      uiSchema: { type: 'object', title: '偏好工厂', 'x-component': 'AssociationField' },
    },
    {
      type: 'belongsTo',
      name: 'owner',
      target: 'users',
      foreignKey: 'owner_id',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '业务员',
        'x-component': 'AssociationField',
        'x-component-props': { fieldNames: { label: 'nickname', value: 'id' } },
        required: true,
      },
    },
    // === 时间 ===
    {
      type: 'date',
      name: 'first_contact_at',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '首次接触时间', 'x-component': 'DatePicker', 'x-component-props': { showTime: true } },
    },
    {
      type: 'date',
      name: 'last_contact_at',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '最近联系时间', 'x-component': 'DatePicker', 'x-component-props': { showTime: true } },
    },
    {
      type: 'date',
      name: 'first_meeting_at',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '首次会议时间', 'x-component': 'DatePicker', 'x-component-props': { showTime: true } },
    },
    {
      type: 'string',
      name: 'first_meeting_outcome',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '首次会议结果',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'positive', label: '积极', color: 'green' },
          { value: 'neutral', label: '中性', color: 'default' },
          { value: 'negative', label: '消极', color: 'red' },
        ],
      },
    },
    {
      type: 'belongsTo',
      name: 'tenant',
      target: 'factories',
      foreignKey: 'tenant_id',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '主负责工厂',
        'x-component': 'AssociationField',
        description: '用于多工厂场景的数据隔离',
      },
    },
    {
      type: 'text',
      name: 'notes',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '备注', 'x-component': 'Input.TextArea' },
    },
  ],
});
