import './assets/variables.css'
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { autoLogin } from './utils/token'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 先尝试自动登录（通过refreshToken刷新获取accessToken）
autoLogin().then(() => {
  app.mount('#app')
}).catch(() => {
  // 自动登录失败也正常启动应用（可能用户未登录）
  app.mount('#app')
})
