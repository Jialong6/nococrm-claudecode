/**
 * T4.02 公司销售资料库 company_assets
 * 来源：01 公司概况 / 02 工厂硬件 / 05 研发打样 知识库
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'company_assets',
  title: '公司资料',
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
      name: 'asset_type',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '资料类型',
        'x-component': 'Radio.Group',
        required: true,
        enum: [
          { value: 'company_intro', label: '公司简介', color: 'blue' },
          { value: 'factory_intro', label: '工厂介绍', color: 'cyan' },
          { value: 'iso_cert', label: 'ISO 证书', color: 'gold' },
          { value: 'customer_case', label: '客户案例', color: 'green' },
          { value: 'factory_video', label: '工厂视频', color: 'purple' },
          { value: 'qc_process', label: 'QC 流程图', color: 'orange' },
          { value: 'capacity', label: '产能介绍', color: 'magenta' },
          { value: 'equipment', label: '设备清单', color: 'default' },
          { value: 'other', label: '其他', color: 'default' },
        ],
      },
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: { type: 'string', title: '标题', 'x-component': 'Input', required: true },
    },
    {
      type: 'text',
      name: 'description',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '描述', 'x-component': 'Input.TextArea' },
    },
    {
      type: 'attachment',
      name: 'file',
      interface: 'attachment',
      uiSchema: {
        type: 'array',
        title: '文件',
        'x-component': 'Upload.Attachment',
        'x-component-props': { multiple: false },
      },
    },
    {
      type: 'string',
      name: 'external_url',
      interface: 'url',
      uiSchema: {
        type: 'string',
        title: '外部链接',
        'x-component': 'Input.URL',
        description: '如果资料在外部（YouTube / Bilibili / OSS），填这里',
      },
    },
    {
      type: 'string',
      name: 'language',
      interface: 'radioGroup',
      defaultValue: 'all',
      uiSchema: {
        type: 'string',
        title: '语言',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'zh', label: '中文' },
          { value: 'en', label: '英文' },
          { value: 'ja', label: '日文' },
          { value: 'all', label: '通用' },
        ],
      },
    },
    {
      type: 'boolean',
      name: 'is_public',
      defaultValue: true,
      interface: 'checkbox',
      uiSchema: {
        type: 'boolean',
        title: '可对外',
        'x-component': 'Checkbox',
        description: '勾选后可在销售资料 block 中显示给客户',
      },
    },
    {
      type: 'integer',
      name: 'sort_order',
      defaultValue: 100,
      interface: 'integer',
      uiSchema: { type: 'number', title: '排序', 'x-component': 'InputNumber' },
    },
  ],
});
