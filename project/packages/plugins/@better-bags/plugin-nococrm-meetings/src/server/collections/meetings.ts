/**
 * T3.01 会议表 meetings
 * 来源：tasks.md M3
 *
 * 关键关联：
 *   - customer：必填，决定会议归属哪个客户
 *   - agenda_template：选填，选模板后会议 agenda 字段自动填充
 *   - participants_internal：通过 m2m 表 meetings_users_internal 关联 users
 *   - status：状态机驱动会议提醒与回写客户首次会议时间
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'meetings',
  title: '会议',
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
      name: 'meeting_no',
      patterns: [
        { type: 'string', options: { value: 'MEET-' } },
        { type: 'date', options: { format: 'YYYYMMDD' } },
        { type: 'string', options: { value: '-' } },
        { type: 'integer', options: { digits: 3, start: 1 } },
      ],
      interface: 'sequence',
      uiSchema: {
        type: 'string',
        title: '会议编号',
        'x-component': 'Input',
        'x-read-pretty': true,
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
        required: true,
      },
    },
    {
      type: 'string',
      name: 'type',
      interface: 'radioGroup',
      defaultValue: 'zoom',
      uiSchema: {
        type: 'string',
        title: '会议类型',
        'x-component': 'Radio.Group',
        required: true,
        enum: [
          { value: 'zoom', label: 'Zoom', color: 'blue' },
          { value: 'teams', label: 'Teams', color: 'cyan' },
          { value: 'phone', label: '电话', color: 'default' },
          { value: 'tour_onsite', label: '工厂参观（线下）', color: 'gold' },
          { value: 'tour_video', label: '工厂参观（视频）', color: 'green' },
        ],
      },
    },
    {
      type: 'date',
      name: 'scheduled_at',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        title: '计划时间',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: true },
        required: true,
      },
    },
    {
      type: 'integer',
      name: 'duration_min',
      interface: 'integer',
      defaultValue: 60,
      uiSchema: {
        type: 'number',
        title: '时长（分钟）',
        'x-component': 'InputNumber',
        'x-component-props': { min: 5, max: 480 },
      },
    },
    {
      type: 'string',
      name: 'timezone',
      interface: 'input',
      defaultValue: 'Asia/Shanghai',
      uiSchema: { type: 'string', title: '时区', 'x-component': 'Input' },
    },
    {
      type: 'belongsToMany',
      name: 'participants_internal',
      target: 'users',
      through: 'meetings_users_internal',
      foreignKey: 'meeting_id',
      otherKey: 'user_id',
      interface: 'm2m',
      uiSchema: {
        type: 'array',
        title: '内部参与人',
        'x-component': 'AssociationField',
        'x-component-props': { fieldNames: { label: 'nickname', value: 'id' }, multiple: true },
      },
    },
    {
      type: 'text',
      name: 'participants_external',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: '外部参与人',
        'x-component': 'Input.TextArea',
        description: '一行一个，格式：姓名 / 职位 / 邮箱',
      },
    },
    {
      type: 'string',
      name: 'meeting_link',
      interface: 'url',
      uiSchema: { type: 'string', title: '会议链接', 'x-component': 'Input.URL' },
    },
    {
      type: 'belongsTo',
      name: 'agenda_template',
      target: 'meeting_agenda_templates',
      foreignKey: 'agenda_template_id',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '议程模板',
        'x-component': 'AssociationField',
        description: '选模板后议程字段会自动填充内容',
      },
    },
    {
      type: 'text',
      name: 'agenda',
      interface: 'markdown',
      uiSchema: { type: 'string', title: '议程', 'x-component': 'Markdown' },
    },
    {
      type: 'string',
      name: 'status',
      interface: 'radioGroup',
      defaultValue: 'scheduled',
      uiSchema: {
        type: 'string',
        title: '状态',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'scheduled', label: '已预约', color: 'default' },
          { value: 'confirmed', label: '已确认', color: 'blue' },
          { value: 'in_progress', label: '进行中', color: 'gold' },
          { value: 'completed', label: '已完成', color: 'green' },
          { value: 'cancelled', label: '已取消', color: 'red' },
          { value: 'rescheduled', label: '已改期', color: 'orange' },
        ],
      },
    },
    {
      type: 'string',
      name: 'outcome',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '结果',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'positive', label: '积极', color: 'green' },
          { value: 'neutral', label: '中性', color: 'default' },
          { value: 'negative', label: '消极', color: 'red' },
          { value: 'pending', label: '未定', color: 'gold' },
        ],
      },
    },
    {
      type: 'boolean',
      name: 'reminder_24h_sent',
      defaultValue: false,
      interface: 'checkbox',
      uiSchema: { type: 'boolean', title: '24h 提醒已发', 'x-component': 'Checkbox' },
    },
    {
      type: 'boolean',
      name: 'reminder_1h_sent',
      defaultValue: false,
      interface: 'checkbox',
      uiSchema: { type: 'boolean', title: '1h 提醒已发', 'x-component': 'Checkbox' },
    },
    {
      type: 'text',
      name: 'notes',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '备注', 'x-component': 'Input.TextArea' },
    },
  ],
});
