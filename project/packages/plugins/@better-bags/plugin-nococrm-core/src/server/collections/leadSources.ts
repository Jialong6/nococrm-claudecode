/**
 * T2.01 来源字典 lead_sources
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'lead_sources',
  title: '客户来源',
  shared: true,
  sortable: true,
  fields: [
    {
      type: 'bigInt',
      name: 'id',
      primaryKey: true,
      autoIncrement: true,
      interface: 'integer',
    },
    {
      type: 'string',
      name: 'name',
      unique: true,
      interface: 'input',
      uiSchema: { type: 'string', title: '名称', 'x-component': 'Input', required: true },
    },
    {
      type: 'string',
      name: 'name_en',
      interface: 'input',
      uiSchema: { type: 'string', title: '英文名', 'x-component': 'Input' },
    },
    {
      type: 'boolean',
      name: 'is_active',
      interface: 'checkbox',
      defaultValue: true,
      uiSchema: { type: 'boolean', title: '启用', 'x-component': 'Checkbox' },
    },
    {
      type: 'integer',
      name: 'sort_order',
      interface: 'integer',
      defaultValue: 100,
      uiSchema: { type: 'number', title: '排序', 'x-component': 'InputNumber' },
    },
  ],
});
