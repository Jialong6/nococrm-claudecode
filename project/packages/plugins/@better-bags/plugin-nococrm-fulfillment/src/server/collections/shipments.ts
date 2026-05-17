/**
 * T12.01 发货表 shipments
 * Hooks（见 plugin.ts）：
 *   - beforeCreate (T12.02)：order.balance_paid=false 且非 VIP → throw
 *   - afterCreate：order.status='shipping_pending'
 *   - beforeSave (T12.05)：status=shipped 时三个文件必填校验
 *   - afterUpdate (T12.03 + T12.04)：bl_no 从空 → 非空 时自动填 atd；status 同步到 order
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'shipments',
  title: '发货',
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
      name: 'shipment_no',
      patterns: [
        { type: 'string', options: { value: 'SH-' } },
        { type: 'date', options: { format: 'YYYYMMDD' } },
        { type: 'string', options: { value: '-' } },
        { type: 'integer', options: { digits: 3, start: 1 } },
      ],
      interface: 'sequence',
      uiSchema: { type: 'string', title: '发货编号', 'x-component': 'Input', 'x-read-pretty': true },
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
      type: 'string',
      name: 'forwarder',
      interface: 'input',
      uiSchema: { type: 'string', title: '货代公司', 'x-component': 'Input' },
    },
    {
      type: 'string',
      name: 'forwarder_contact',
      interface: 'input',
      uiSchema: { type: 'string', title: '货代联系方式', 'x-component': 'Input' },
    },
    {
      type: 'string',
      name: 'booking_no',
      interface: 'input',
      uiSchema: { type: 'string', title: '订舱号', 'x-component': 'Input' },
    },
    {
      type: 'string',
      name: 'container_type',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '柜型',
        'x-component': 'Radio.Group',
        enum: [
          { value: '40HQ', label: '40HQ 高箱' },
          { value: '20GP', label: '20GP 普箱' },
          { value: 'LCL', label: 'LCL 拼柜' },
        ],
      },
    },
    {
      type: 'string',
      name: 'container_no',
      interface: 'input',
      uiSchema: { type: 'string', title: '柜号', 'x-component': 'Input' },
    },
    {
      type: 'string',
      name: 'bl_no',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '提单号 (B/L No.)',
        'x-component': 'Input',
        description: '从空填到非空时，hook 自动填 atd 并提示发邮件通知客户',
      },
    },
    {
      type: 'string',
      name: 'port_loading',
      interface: 'input',
      uiSchema: { type: 'string', title: '起运港', 'x-component': 'Input', description: '通常 Yangon 或 Qingdao' },
    },
    {
      type: 'string',
      name: 'port_discharge',
      interface: 'input',
      uiSchema: { type: 'string', title: '卸货港', 'x-component': 'Input' },
    },
    {
      type: 'date',
      name: 'etd',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '预计开船 ETD', 'x-component': 'DatePicker', 'x-component-props': { showTime: false } },
    },
    {
      type: 'date',
      name: 'atd',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        title: '实际开船 ATD',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: false },
        description: 'bl_no 录入时自动填当前时间',
      },
    },
    {
      type: 'date',
      name: 'eta',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '预计到港 ETA', 'x-component': 'DatePicker', 'x-component-props': { showTime: false } },
    },
    {
      type: 'date',
      name: 'ata',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '实际到港 ATA', 'x-component': 'DatePicker', 'x-component-props': { showTime: false } },
    },
    {
      type: 'date',
      name: 'delivered_at',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        title: '客户签收',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: false },
      },
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'booking_pending',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '状态',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'booking_pending', label: '待订舱', color: 'default' },
          { value: 'booked', label: '已订舱', color: 'blue' },
          { value: 'loaded', label: '已装柜', color: 'cyan' },
          { value: 'shipped', label: '已开船', color: 'gold' },
          { value: 'arrived', label: '已到港', color: 'orange' },
          { value: 'cleared', label: '已清关', color: 'purple' },
          { value: 'delivered', label: '已交付', color: 'green' },
        ],
      },
    },
    {
      type: 'attachment',
      name: 'invoice_file',
      interface: 'attachment',
      uiSchema: {
        type: 'array',
        title: '商业发票 Invoice',
        'x-component': 'Upload.Attachment',
        description: '切到"已开船"前必填',
      },
    },
    {
      type: 'attachment',
      name: 'packing_list_file',
      interface: 'attachment',
      uiSchema: {
        type: 'array',
        title: '装箱单 Packing List',
        'x-component': 'Upload.Attachment',
        description: '切到"已开船"前必填',
      },
    },
    {
      type: 'attachment',
      name: 'origin_cert_file',
      interface: 'attachment',
      uiSchema: {
        type: 'array',
        title: '原产地证 Certificate of Origin',
        'x-component': 'Upload.Attachment',
        description: '切到"已开船"前必填',
      },
    },
    {
      type: 'attachment',
      name: 'other_docs',
      interface: 'attachment',
      uiSchema: {
        type: 'array',
        title: '其他单证',
        'x-component': 'Upload.Attachment',
        'x-component-props': { multiple: true },
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
