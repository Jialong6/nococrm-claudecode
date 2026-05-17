/**
 * T1.03 工厂表 factories
 * 来源：tasks.md M1 + 知识库 02-工厂硬件与设备产能
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'factories',
  title: '工厂',
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
      uiSchema: {
        type: 'number',
        title: 'ID',
        'x-component': 'InputNumber',
        'x-read-pretty': true,
      },
    },
    {
      type: 'string',
      name: 'code',
      unique: true,
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '工厂代码',
        'x-component': 'Input',
        'x-validator': { pattern: '^[A-Z]{2}_[A-Z]{2,3}$' },
        description: '格式：CN_XX 或 MM_YYY（例如 CN_RZ / CN_QD / MM_YGN）',
        required: true,
      },
    },
    {
      type: 'string',
      name: 'name',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '工厂名',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      type: 'string',
      name: 'country',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '国家',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'CN', label: '中国' },
          { value: 'MM', label: '缅甸' },
        ],
        required: true,
      },
    },
    {
      type: 'string',
      name: 'address',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: '地址',
        'x-component': 'Input.TextArea',
      },
    },
    {
      type: 'integer',
      name: 'capacity_monthly_pcs',
      interface: 'integer',
      defaultValue: 0,
      uiSchema: {
        type: 'number',
        title: '月产能（件）',
        'x-component': 'InputNumber',
        'x-component-props': { min: 0 },
      },
    },
    {
      type: 'integer',
      name: 'sewing_workers',
      interface: 'integer',
      defaultValue: 0,
      uiSchema: {
        type: 'number',
        title: '缝纫工人数',
        'x-component': 'InputNumber',
        'x-component-props': { min: 0 },
      },
    },
    {
      type: 'integer',
      name: 'flat_machines',
      interface: 'integer',
      defaultValue: 0,
      uiSchema: {
        type: 'number',
        title: '平车数',
        'x-component': 'InputNumber',
      },
    },
    {
      type: 'integer',
      name: 'computer_machines',
      interface: 'integer',
      defaultValue: 0,
      uiSchema: {
        type: 'number',
        title: '电脑车数',
        'x-component': 'InputNumber',
      },
    },
    {
      type: 'json',
      name: 'equipment',
      interface: 'json',
      uiSchema: {
        type: 'object',
        title: '完整设备明细',
        'x-component': 'Input.JSON',
        description: '示例：{ "高车": 60, "双针车": 12, "裁断机": 10 }',
      },
    },
    {
      type: 'belongsTo',
      name: 'contact_person',
      target: 'users',
      foreignKey: 'contact_person_id',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '联系人',
        'x-component': 'AssociationField',
        'x-component-props': { fieldNames: { label: 'nickname', value: 'id' } },
      },
    },
    {
      type: 'boolean',
      name: 'is_sampling_center',
      interface: 'checkbox',
      defaultValue: false,
      uiSchema: {
        type: 'boolean',
        title: '是否打样中心',
        'x-component': 'Checkbox',
      },
    },
    {
      type: 'boolean',
      name: 'is_active',
      interface: 'checkbox',
      defaultValue: true,
      uiSchema: {
        type: 'boolean',
        title: '启用',
        'x-component': 'Checkbox',
      },
    },
  ],
});
