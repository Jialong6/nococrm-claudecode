/**
 * Better Bags NocoCRM Core - Server Plugin
 *
 * 职责（M1/M2）：
 *   1. 自动加载 collections/ 目录里 7 个 collection 定义
 *   2. 扩展 NocoBase 内置 users 表，增加 employee_no / phone / region / job_title / is_active / department 等字段
 *   3. 注册基础 ACL（loggedIn 可读字典；factories / customers 由后续 M15 细化）
 *   4. 启用时执行 seed migration 灌入预置数据
 */

import { Plugin } from '@nocobase/server';
import path from 'path';

export class PluginNocoCRMCoreServer extends Plugin {
  async afterAdd() {}

  beforeLoad() {
    // 扩展 users：业务员/工厂人员区分（T1.02）
    this.db.extendCollection({
      name: 'users',
      origin: this.options?.packageName ?? '@better-bags/plugin-nococrm-core',
      fields: [
        {
          type: 'string',
          name: 'employee_no',
          unique: true,
          interface: 'input',
          uiSchema: {
            type: 'string',
            title: '工号',
            'x-component': 'Input',
          },
        },
        {
          type: 'string',
          name: 'phone',
          interface: 'phone',
          uiSchema: { type: 'string', title: '电话', 'x-component': 'Input' },
        },
        {
          type: 'string',
          name: 'region',
          interface: 'radioGroup',
          uiSchema: {
            type: 'string',
            title: '地区',
            'x-component': 'Radio.Group',
            enum: [
              { value: 'CN', label: '中国' },
              { value: 'MM', label: '缅甸' },
              { value: 'OTHER', label: '其他' },
            ],
          },
        },
        {
          type: 'string',
          name: 'job_title',
          interface: 'input',
          uiSchema: { type: 'string', title: '职位', 'x-component': 'Input' },
        },
        {
          type: 'boolean',
          name: 'is_active',
          defaultValue: true,
          interface: 'checkbox',
          uiSchema: { type: 'boolean', title: '在职', 'x-component': 'Checkbox' },
        },
      ],
    });
  }

  async load() {
    // 自动加载 7 个 collection 定义文件
    await this.importCollections(path.resolve(__dirname, 'collections'));

    // 注册 seed migrations 目录（NocoBase 在 install 与启动时自动执行）
    this.db.addMigrations({
      namespace: 'nococrm-core',
      directory: path.resolve(__dirname, 'migrations'),
      context: { plugin: this, db: this.db, app: this.app },
    });

    // 基础 ACL：所有登录用户都能读字典表（字典本身不含敏感信息）
    this.app.acl.allow('regions_dict', 'list', 'loggedIn');
    this.app.acl.allow('regions_dict', 'get', 'loggedIn');
    this.app.acl.allow('currencies_dict', 'list', 'loggedIn');
    this.app.acl.allow('currencies_dict', 'get', 'loggedIn');
    this.app.acl.allow('lead_sources', 'list', 'loggedIn');
    this.app.acl.allow('lead_sources', 'get', 'loggedIn');
    this.app.acl.allow('product_categories', 'list', 'loggedIn');
    this.app.acl.allow('product_categories', 'get', 'loggedIn');
    this.app.acl.allow('factories', 'list', 'loggedIn');
    this.app.acl.allow('factories', 'get', 'loggedIn');

    // 注册插件 snippet，方便管理员在角色管理里一键授权
    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: [
        'factories:*',
        'product_categories:*',
        'regions_dict:*',
        'currencies_dict:*',
        'lead_sources:*',
        'customers:*',
        'contacts:*',
      ],
    });
  }

  async install() {
    // 安装时插入预置数据（参考 migrations/20260517000001-seed-base-dicts）
    // 由于 NocoBase 会在 install 阶段自动跑 migrations，这里留空即可。
  }

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginNocoCRMCoreServer;
