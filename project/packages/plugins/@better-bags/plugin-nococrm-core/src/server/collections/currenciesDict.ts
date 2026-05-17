/**
 * T1.05b 币种字典 currencies_dict
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'currencies_dict',
  title: '币种字典',
  shared: true,
  fields: [
    {
      type: 'string',
      name: 'code',
      primaryKey: true,
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'ISO 代码',
        'x-component': 'Input',
        description: 'ISO 4217，如 USD / CNY / JPY',
        required: true,
      },
    },
    {
      type: 'string',
      name: 'symbol',
      interface: 'input',
      uiSchema: { type: 'string', title: '符号', 'x-component': 'Input' },
    },
    {
      type: 'string',
      name: 'name',
      interface: 'input',
      uiSchema: { type: 'string', title: '中文名', 'x-component': 'Input' },
    },
    {
      type: 'string',
      name: 'name_en',
      interface: 'input',
      uiSchema: { type: 'string', title: '英文名', 'x-component': 'Input' },
    },
  ],
});
