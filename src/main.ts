import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// 样式
import 'tailwindcss/tailwind.css'
import './style/index.less'

// Ant Design Vue
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

// 权限指令
import { setupDirectives } from './utils/directives'

const app = createApp(App)

// 状态管理
app.use(createPinia())

// 路由
app.use(router)

// UI库
app.use(Antd)

// 权限指令
setupDirectives(app)

app.mount('#app') 