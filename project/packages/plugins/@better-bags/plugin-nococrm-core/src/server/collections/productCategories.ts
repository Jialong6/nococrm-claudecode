/**
 * T1.04 产品分类 product_categories
 * 来源：tasks.md M1 + 知识库 03-产品线与接单策略
 * 业务红线：缅甸路由 default_moq = 1500（来自 03 知识库）
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'product_categories',
  title: '产品分类',
  shared: true,
  sortable: true,
  createdBy: true,
  updatedBy: true,
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
      interface: 'input',
      unique: true,
      uiSchema: { type: 'string', title: '分类名（中）', 'x-component': 'Input', required: true },
    },
    {
      type: 'string',
      name: 'name_en',
      interface: 'input',
      uiSchema: { type: 'string', title: '英文名', 'x-component': 'Input' },
    },
    {
      type: 'string',
      name: 'name_ja',
      interface: 'input',
      uiSchema: { type: 'string', title: '日文名', 'x-component': 'Input' },
    },
    {
      type: 'belongsTo',
      name: 'default_factory',
      target: 'factories',
      foreignKey: 'default_factory_id',
      interface: 'm2o',
      uiSchema: { type: 'object', title: '默认工厂', 'x-component': 'AssociationField' },
    },
    {
      type: 'integer',
      name: 'default_moq',
      interface: 'integer',
      defaultValue: 1500,
      uiSchema: {
        type: 'number',
        title: '默认 MOQ',
        'x-component': 'InputNumber',
        description: '缅甸大货默认 1500（来自 03 知识库）',
      },
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
