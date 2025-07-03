# Mock 系统测试说明

## 概述

已为权限管理系统创建了完整的 Mock 数据系统，在开发环境下自动拦截 API 请求并返回模拟数据。

## 修复的问题

### 1. **新建用户没反应**

- ✅ 修复了用户列表页面路由参数处理
- ✅ Dashboard 快捷操作 "新建用户" 现在可以正常跳转并打开创建模态框
- ✅ URL 参数`?action=create`会自动触发新建用户功能

### 2. **新增角色 404 错误**

- ✅ 添加了缺失的角色创建和编辑路由：
  - `/role/create` - 新增角色
  - `/role/edit/:id` - 编辑角色
- ✅ Dashboard 快捷操作 "新增角色" 现在可以正常跳转
- ✅ 支持路由参数`?action=create`自动触发新建角色功能

## Mock 数据系统

### 自动拦截的 API

#### 用户 API (`/api/users`)

- `GET /users` - 获取用户列表（支持搜索、分页）
- `GET /users/:id` - 获取用户详情
- `POST /users` - 创建用户
- `PUT /users/:id` - 更新用户
- `DELETE /users/:id` - 删除用户
- `POST /users/:id/reset-password` - 重置密码
- `PATCH /users/:id/status` - 更新用户状态
- `GET /users/:id/roles` - 获取用户角色
- `PUT /users/:id/roles` - 分配用户角色

#### 角色 API (`/api/roles`)

- `GET /roles` - 获取角色列表（支持搜索、分页）
- `GET /roles/:id` - 获取角色详情
- `POST /roles` - 创建角色
- `PUT /roles/:id` - 更新角色
- `DELETE /roles/:id` - 删除角色
- `GET /roles/:id/perms` - 获取角色权限
- `PUT /roles/:id/perms` - 分配角色权限
- `GET /roles/:id/members` - 获取角色成员

#### 资源 API (`/api/resources`)

- `GET /resources` - 获取资源列表
- `GET /resources/tree` - 获取资源树结构

#### Dashboard API (`/api/dashboard`)

- `GET /dashboard/stats` - 获取统计数据
- `GET /dashboard/activities` - 获取最近活动

#### 审计 API (`/api/audit`)

- `GET /audit/logs` - 获取操作日志（支持分页）

### Mock 数据特性

1. **自动生成数据**：

   - 50 个模拟用户（不同状态、部门、角色）
   - 20 个模拟角色（不同等级、权限）
   - 完整的资源权限树
   - 50 条模拟操作日志

2. **网络延迟模拟**：300-800ms 随机延迟，模拟真实网络环境

3. **数据持久化**：在页面刷新前，增删改操作会保持状态

4. **错误处理**：模拟真实的错误响应（如用户不存在、权限不足等）

## 登录测试账号

### 管理员账号

- 用户名：`admin`
- 密码：`123456`
- 权限：所有权限

### 普通用户账号

- 用户名：`user`
- 密码：`123456`
- 权限：仅查看权限

## 测试功能清单

### ✅ Dashboard

- [x] 统计数据显示
- [x] 快捷操作按钮
- [x] 最近活动列表
- [x] 新建用户快捷入口
- [x] 新建角色快捷入口

### ✅ 用户管理

- [x] 用户列表展示
- [x] 用户搜索过滤
- [x] 新建用户（支持路由参数触发）
- [x] 编辑用户
- [x] 删除用户
- [x] 批量删除
- [x] 状态切换
- [x] 重置密码
- [x] 角色分配

### ✅ 角色管理

- [x] 角色列表展示
- [x] 角色搜索过滤
- [x] 新建角色（支持路由跳转）
- [x] 编辑角色
- [x] 删除角色
- [x] 权限分配

### ✅ 其他功能

- [x] 权限指令（v-permission）
- [x] 路由权限控制
- [x] 时间格式化（支持中文显示）
- [x] 响应式布局

## 开发环境启动

```bash
pnpm install
pnpm dev
```

访问：http://localhost:3000

## 技术实现

1. **Mock 拦截器**：在 HTTP 请求拦截器中实现，仅在开发环境生效
2. **数据生成器**：自动生成符合业务逻辑的测试数据
3. **路由参数处理**：支持 URL 查询参数自动触发相应操作
4. **TypeScript 支持**：完整的类型定义，确保类型安全

## 注意事项

1. Mock 系统仅在开发环境（`NODE_ENV === 'development'`）下生效
2. 数据在页面刷新后会重置为初始状态
3. 认证相关 API 由 auth store 单独处理，不经过通用 Mock 系统
4. 如需添加新的 API Mock，请修改`src/mocks/index.ts`文件

## 后续联调

当后端 API 准备就绪时，只需：

1. 设置`NODE_ENV=production`或其他非 development 值
2. 配置正确的后端 API 地址
3. Mock 系统将自动禁用，切换到真实 API 调用
