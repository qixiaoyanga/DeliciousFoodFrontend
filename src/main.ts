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

autoLogin().then(() => {
  app.mount('#app')
}).catch(() => {
  app.mount('#app')
})