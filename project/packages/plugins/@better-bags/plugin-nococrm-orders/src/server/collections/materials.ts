/**
 * T10.01 + T10.03 物料表 materials
 *
 * 含 3 个 formula 字段（来自 04 知识库时间轴：东莞 14d + 验货 7d + 海运 14d）：
 *   - expected_dongguan_arrival = po_date + 14d
 *   - expected_qc_pass = expected_dongguan_arrival + 7d
 *   - expected_factory_arrival = expected_qc_pass + 14d
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'materials',
  title: '物料',
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
      type: 'string',
      name: 'item_no',
      interface: 'input',
      uiSchema: { type: 'string', title: '物料编号', 'x-component': 'Input' },
    },
    {
      type: 'string',
      name: 'item_name',
      interface: 'input',
      uiSchema: { type: 'string', title: '物料名', 'x-component': 'Input', required: true },
    },
    {
      type: 'string',
      name: 'category',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '类别',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'fabric', label: '面料' },
          { value: 'lining', label: '里料' },
          { value: 'hardware', label: '五金' },
          { value: 'zipper', label: '拉链' },
          { value: 'webbing', label: '织带' },
          { value: 'packaging', label: '包装' },
          { value: 'other', label: '其他' },
        ],
      },
    },
    {
      type: 'string',
      name: 'supplier',
      interface: 'input',
      uiSchema: { type: 'string', title: '供应商', 'x-component': 'Input' },
    },
    {
      type: 'decimal',
      name: 'quantity',
      interface: 'number',
      uiSchema: {
        type: 'number',
        title: '数量',
        'x-component': 'InputNumber',
        'x-component-props': { precision: 2, min: 0 },
      },
    },
    {
      type: 'string',
      name: 'unit',
      defaultValue: 'pcs',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '单位',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'm', label: '米' },
          { value: 'pcs', label: '个' },
          { value: 'roll', label: '卷' },
          { value: 'set', label: '套' },
          { value: 'kg', label: '公斤' },
          { value: 'other', label: '其他' },
        ],
      },
    },
    {
      type: 'decimal',
      name: 'unit_price',
      interface: 'number',
      uiSchema: { type: 'number', title: '单价', 'x-component': 'InputNumber', 'x-component-props': { precision: 4, min: 0 } },
    },
    {
      type: 'date',
      name: 'po_date',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        title: '采购下单日',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: false },
      },
    },
    // ====== 04 知识库时间轴：3 个 formula 字段 ======
    {
      type: 'formula',
      name: 'expected_dongguan_arrival',
      dataType: 'date',
      expression: "DATE_ADD(po_date, INTERVAL 14 DAY)",
      interface: 'formula',
      uiSchema: {
        type: 'string',
        title: '预计到东莞日',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: false },
        'x-read-pretty': true,
        description: '= po_date + 14 天（供应商生产 + 国内物流）',
      },
    },
    {
      type: 'formula',
      name: 'expected_qc_pass',
      dataType: 'date',
      expression: "DATE_ADD(po_date, INTERVAL 21 DAY)",
      interface: 'formula',
      uiSchema: {
        type: 'string',
        title: '预计验货通过日',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: false },
        'x-read-pretty': true,
        description: '= 到东莞日 + 7 天（验货周期；现货可压缩至 1-2 天）',
      },
    },
    {
      type: 'formula',
      name: 'expected_factory_arrival',
      dataType: 'date',
      expression: "DATE_ADD(po_date, INTERVAL 35 DAY)",
      interface: 'formula',
      uiSchema: {
        type: 'string',
        title: '预计到工厂日',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: false },
        'x-read-pretty': true,
        description: '= 验货通过日 + 14 天（海运 + 清关）',
      },
    },
    // ====== 实际时间字段 ======
    {
      type: 'date',
      name: 'supplier_eta_dg',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        title: '供应商承诺到东莞日',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: false },
      },
    },
    {
      type: 'date',
      name: 'actual_dg_arrival',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '实际到东莞日', 'x-component': 'DatePicker', 'x-component-props': { showTime: false } },
    },
    {
      type: 'date',
      name: 'qc_pass_date',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '国内验货通过日', 'x-component': 'DatePicker', 'x-component-props': { showTime: false } },
    },
    {
      type: 'date',
      name: 'shipped_to_factory',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '发往工厂日', 'x-component': 'DatePicker', 'x-component-props': { showTime: false } },
    },
    {
      type: 'date',
      name: 'received_at_factory',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '工厂收货日', 'x-component': 'DatePicker', 'x-component-props': { showTime: false } },
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'po_placed',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '状态',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'po_placed', label: '已下单', color: 'default' },
          { value: 'supplier_producing', label: '供应商生产中', color: 'cyan' },
          { value: 'arrived_dg', label: '已到东莞', color: 'blue' },
          { value: 'qc_inspection', label: '验货中', color: 'gold' },
          { value: 'waiting_shipment', label: '待发运', color: 'orange' },
          { value: 'in_transit', label: '海运中', color: 'purple' },
          { value: 'arrived_factory', label: '已到工厂', color: 'green' },
          { value: 'abnormal', label: '异常', color: 'red' },
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
