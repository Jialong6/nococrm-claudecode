/**
 * T2.03 联系人表 contacts
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'contacts',
  title: '联系人',
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
      name: 'name',
      interface: 'input',
      uiSchema: { type: 'string', title: '姓名', 'x-component': 'Input', required: true },
    },
    {
      type: 'string',
      name: 'position',
      interface: 'input',
      uiSchema: { type: 'string', title: '职位', 'x-component': 'Input' },
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
      uiSchema: { type: 'string', title: '邮箱', 'x-component': 'Input' },
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
    {
      type: 'boolean',
      name: 'is_primary',
      interface: 'checkbox',
      defaultValue: false,
      uiSchema: {
        type: 'boolean',
        title: '主联系人',
        'x-component': 'Checkbox',
        description: '同一客户下唯一',
      },
    },
    {
      type: 'string',
      name: 'decision_role',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '决策角色',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'decision_maker', label: '决策人', color: 'red' },
          { value: 'procurement', label: '采购', color: 'blue' },
          { value: 'technical', label: '技术', color: 'cyan' },
          { value: 'finance', label: '财务', color: 'gold' },
          { value: 'assistant', label: '助理', color: 'default' },
          { value: 'other', label: '其他', color: 'default' },
        ],
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
