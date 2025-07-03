# 用户中心权限管理系统

一个基于 Vue 3 + TypeScript + Ant Design Vue + Tailwind CSS 的现代化权限管理系统前端项目。

## 📋 功能特性

- 🔐 **用户管理** - 用户账号的增删改查、状态管理、密码重置
- 👥 **角色管理** - 角色创建、权限分配、成员管理
- 🌳 **菜单管理** - 树形菜单结构、动态路由、权限控制
- 🔑 **权限管理** - 细粒度权限控制、按钮级权限、API权限
- 📊 **授权中心** - 角色权限矩阵、用户角色关系可视化
- 📝 **审计日志** - 操作记录追踪、安全审计
- 🎨 **现代化界面** - 响应式设计、暗色模式、国际化支持

## 🚀 技术栈

- **前端框架**: Vue 3.4 + Composition API
- **开发语言**: TypeScript 5.3
- **构建工具**: Vite 5.0
- **UI组件库**: Ant Design Vue 4.1
- **CSS框架**: Tailwind CSS 3.4
- **状态管理**: Pinia 2.1
- **路由管理**: Vue Router 4.2
- **HTTP客户端**: Axios 1.6
- **日期处理**: Day.js 1.11

## 📦 安装和运行

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0 或 yarn >= 1.22.0 或 pnpm >= 8.0.0

### 克隆项目

\`\`\`bash
git clone <repository-url>
cd permission-center
\`\`\`

### 安装依赖

\`\`\`bash
# 使用 npm
npm install

# 或使用 yarn
yarn install

# 或使用 pnpm
pnpm install
\`\`\`

### 开发环境运行

\`\`\`bash
npm run dev
\`\`\`

项目将在 [http://localhost:3000](http://localhost:3000) 启动

### 构建生产版本

\`\`\`bash
npm run build
\`\`\`

### 预览生产版本

\`\`\`bash
npm run preview
\`\`\`

## 🏗️ 项目结构

\`\`\`
src/
├── api/                 # API 接口
│   ├── auth.ts         # 认证相关接口
│   ├── user.ts         # 用户管理接口
│   ├── role.ts         # 角色管理接口
│   └── resource.ts     # 资源管理接口
├── components/          # 通用组件
│   ├── layout/         # 布局组件
│   └── ...             # 其他业务组件
├── layouts/            # 布局模板
│   ├── BasicLayout.vue # 基础布局
│   └── BlankLayout.vue # 空白布局
├── router/             # 路由配置
│   └── index.ts        # 路由主文件
├── stores/             # 状态管理
│   └── auth.ts         # 认证状态
├── types/              # TypeScript 类型定义
│   └── index.ts        # 全局类型
├── utils/              # 工具函数
│   ├── http.ts         # HTTP 请求封装
│   └── directives.ts   # Vue 指令
├── views/              # 页面组件
│   ├── auth/           # 认证页面
│   ├── dashboard/      # 仪表盘
│   ├── user/           # 用户管理
│   ├── role/           # 角色管理
│   ├── resource/       # 资源管理
│   ├── grant/          # 授权中心
│   ├── audit/          # 审计管理
│   └── error/          # 错误页面
├── style/              # 全局样式
│   └── index.less      # 主样式文件
├── App.vue             # 根组件
└── main.ts             # 入口文件
\`\`\`

## 🎯 核心功能

### 权限控制

系统提供多层级的权限控制：

1. **路由权限** - 页面级别的访问控制
2. **按钮权限** - 组件级别的操作权限
3. **数据权限** - 接口级别的数据访问权限

### 权限指令使用

\`\`\`vue
<!-- 隐藏无权限按钮 -->
<a-button v-permission="'user:create'">新增用户</a-button>

<!-- 禁用无权限按钮 -->
<a-button v-permission-disabled="'user:update'">编辑用户</a-button>

<!-- 角色权限控制 -->
<div v-role="'admin'">管理员内容</div>
\`\`\`

### API 接口

所有 API 接口都经过统一封装，支持：

- 自动添加认证头
- 统一错误处理
- 响应数据格式化
- 请求/响应拦截

\`\`\`typescript
// 使用示例
import { userApi } from '@api/user'

// 获取用户列表
const users = await userApi.getUsers({ keyword: 'admin' })

// 创建用户
const newUser = await userApi.createUser({
  username: 'test',
  password: '123456'
})
\`\`\`

## 🔧 开发规范

### 代码风格

- 使用 Vue 3 Composition API
- TypeScript 严格模式
- ESLint + Prettier 代码检查
- 组件采用 PascalCase 命名
- 文件名采用 kebab-case

### 组件开发

\`\`\`vue
<template>
  <div class="component-name">
    <!-- 模板内容 -->
  </div>
</template>

<script setup lang="ts">
// 导入依赖
import { ref, computed } from 'vue'

// 类型定义
interface Props {
  title: string
  disabled?: boolean
}

// Props 定义
const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

// 事件定义
const emit = defineEmits<{
  change: [value: string]
}>()

// 响应式数据
const loading = ref(false)

// 计算属性
const isDisabled = computed(() => props.disabled || loading.value)
</script>

<style scoped>
.component-name {
  /* 组件样式 */
}
</style>
\`\`\`

### 样式规范

- 优先使用 Tailwind CSS 工具类
- 复杂样式使用 Less 编写
- 组件样式采用 scoped 作用域
- 遵循 BEM 命名规范

## 🚀 部署指南

### 环境变量

创建对应环境的配置文件：

\`\`\`bash
# .env.development
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_TITLE=用户中心权限管理系统（开发）

# .env.production
VITE_API_BASE_URL=https://api.example.com/api
VITE_APP_TITLE=用户中心权限管理系统
\`\`\`

### Nginx 配置

\`\`\`nginx
server {
    listen 80;
    server_name example.com;
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
\`\`\`

### Docker 部署

\`\`\`dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
\`\`\`

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (\`git checkout -b feature/AmazingFeature\`)
3. 提交更改 (\`git commit -m 'Add some AmazingFeature'\`)
4. 推送到分支 (\`git push origin feature/AmazingFeature\`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详细信息

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目 Issues: [GitHub Issues](../../issues)
- 邮箱: your-email@example.com

## 🙏 致谢

感谢以下开源项目：

- [Vue.js](https://vuejs.org/)
- [Ant Design Vue](https://antdv.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)

---

⭐ 如果这个项目对你有帮助，请给它一个 star！ 