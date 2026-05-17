/**
 * T1.05a 国家地区字典 regions_dict
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'regions_dict',
  title: '国家地区字典',
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
        description: 'ISO 3166 两位代码，如 JP / CN / US',
        required: true,
      },
    },
    {
      type: 'string',
      name: 'name_zh',
      interface: 'input',
      uiSchema: { type: 'string', title: '中文名', 'x-component': 'Input', required: true },
    },
    {
      type: 'string',
      name: 'name_en',
      interface: 'input',
      uiSchema: { type: 'string', title: '英文名', 'x-component': 'Input' },
    },
    {
      type: 'string',
      name: 'phone_code',
      interface: 'input',
      uiSchema: { type: 'string', title: '电话区号', 'x-component': 'Input' },
    },
  ],
});
