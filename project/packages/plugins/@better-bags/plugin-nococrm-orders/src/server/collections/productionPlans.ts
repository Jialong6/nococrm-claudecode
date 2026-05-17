/**
 * T10.02 排产表 production_plans
 * 5 个里程碑字段：裁断 / 缝制 / 钉胶 / 检针 / 包装（来自 02 知识库工厂工序）
 *
 * Hook 行为：T9.05 定金到账后由 plugin.ts 自动创建一条 production_plan 记录（status=pending）
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'production_plans',
  title: '排产计划',
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
      type: 'belongsTo',
      name: 'order',
      target: 'orders',
      foreignKey: 'order_id',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '订单',
        'x-component': 'AssociationField',
        'x-component-props': { fieldNames: { label: 'order_no', value: 'id' } },
        required: true,
      },
    },
    {
      type: 'belongsTo',
      name: 'factory',
      target: 'factories',
      foreignKey: 'factory_id',
      interface: 'm2o',
      uiSchema: { type: 'object', title: '工厂', 'x-component': 'AssociationField' },
    },
    {
      type: 'string',
      name: 'line_no',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '产线编号',
        'x-component': 'Input',
        description: '工厂内部产线编号',
      },
    },
    {
      type: 'date',
      name: 'planned_start',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '计划开工', 'x-component': 'DatePicker', 'x-component-props': { showTime: false } },
    },
    {
      type: 'date',
      name: 'planned_end',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '计划完工', 'x-component': 'DatePicker', 'x-component-props': { showTime: false } },
    },
    {
      type: 'date',
      name: 'actual_start',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '实际开工', 'x-component': 'DatePicker', 'x-component-props': { showTime: false } },
    },
    {
      type: 'date',
      name: 'actual_end',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '实际完工', 'x-component': 'DatePicker', 'x-component-props': { showTime: false } },
    },
    // ====== 5 个里程碑 ======
    {
      type: 'date',
      name: 'milestone_cutting',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '里程碑 · 裁断完成', 'x-component': 'DatePicker', 'x-component-props': { showTime: false } },
    },
    {
      type: 'date',
      name: 'milestone_sewing',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '里程碑 · 缝制完成', 'x-component': 'DatePicker', 'x-component-props': { showTime: false } },
    },
    {
      type: 'date',
      name: 'milestone_gluing',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '里程碑 · 钉胶完成', 'x-component': 'DatePicker', 'x-component-props': { showTime: false } },
    },
    {
      type: 'date',
      name: 'milestone_metal_detect',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        title: '里程碑 · X 线检针完成',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: false },
        description: '缅甸 2 台 / 山东 1 台 X 线检针机',
      },
    },
    {
      type: 'date',
      name: 'milestone_packaging',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '里程碑 · 包装完成', 'x-component': 'DatePicker', 'x-component-props': { showTime: false } },
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'pending',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '状态',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'pending', label: '待开工', color: 'default' },
          { value: 'in_progress', label: '进行中', color: 'gold' },
          { value: 'paused', label: '已暂停', color: 'red' },
          { value: 'completed', label: '已完成', color: 'green' },
        ],
      },
    },
    {
      type: 'text',
      name: 'special_requirements',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: '特殊要求',
        'x-component': 'Input.TextArea',
        description: '从 order.notes 提取的客户特殊质量要求',
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
