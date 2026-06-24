<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { http } from '@/utils/request'
import { DELIVERY_API } from '@/api/paths'
import { tokenManager } from '@/utils/token'
import { encryptPassword } from '@/utils/crypto'
import { toast } from '@/utils/toast'

const router = useRouter()

const loginType = ref<'phone' | 'email'>('phone')
const phone = ref('')
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  if (isLoading.value) return
  errorMessage.value = ''

  if (loginType.value === 'phone') {
    if (!phone.value) { errorMessage.value = '请输入手机号'; return }
    if (!/^1[3-9]\d{9}$/.test(phone.value)) { errorMessage.value = '请输入正确的手机号'; return }
  } else {
    if (!email.value) { errorMessage.value = '请输入邮箱'; return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { errorMessage.value = '请输入正确的邮箱'; return }
  }

  if (!password.value) { errorMessage.value = '请输入密码'; return }
  if (password.value.length < 6) { errorMessage.value = '密码长度不能少于6位'; return }

  isLoading.value = true
  try {
    const publicKey = await http.get<string>('/public/public-key', {}, { showError: false })
    const { encryptedData, timestamp, nonce } = encryptPassword(password.value, publicKey)

    const loginData: Record<string, any> = { encryptedData, timestamp, nonce }
    if (loginType.value === 'phone') {
      loginData.phone = phone.value
    } else {
      loginData.email = email.value
    }

    const result = await http.post<any>(DELIVERY_API.DELIVERY_LOGIN, loginData)

    const user = {
      uid: result.id,
      username: result.realName,
      phone: result.phone
    }
    tokenManager.setTokens(result.accessToken, user, undefined, undefined, 'delivery')
    toast.success('登录成功！')
    router.push('/delivery')
  } catch (error: any) {
    errorMessage.value = error.message || '登录失败'
  } finally {
    isLoading.value = false
  }
}

const goToRegister = () => router.push('/delivery/register')
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1 class="login-title">骑手配送端</h1>
        <p class="login-subtitle">DELIVERY CENTER</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="login-type-tabs">
          <button type="button" class="tab-btn" :class="{ active: loginType === 'phone' }" @click="loginType = 'phone'">📱 手机号登录</button>
          <button type="button" class="tab-btn" :class="{ active: loginType === 'email' }" @click="loginType = 'email'">✉️ 邮箱登录</button>
        </div>

        <div class="form-group" v-if="loginType === 'phone'">
          <div class="input-wrapper">
            <span class="input-icon">📱</span>
            <input v-model="phone" type="tel" class="form-input" placeholder="请输入手机号" maxlength="11" />
          </div>
        </div>
        <div class="form-group" v-else>
          <div class="input-wrapper">
            <span class="input-icon">✉️</span>
            <input v-model="email" type="email" class="form-input" placeholder="请输入邮箱" maxlength="50" />
          </div>
        </div>

        <div class="form-group">
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input v-model="password" type="password" class="form-input" placeholder="请输入密码" />
          </div>
        </div>

        <div class="error-message" v-if="errorMessage">{{ errorMessage }}</div>

        <button type="submit" class="login-btn" :disabled="isLoading">
          <span v-if="!isLoading">登 录</span>
          <span v-else>...</span>
        </button>
      </form>

      <div class="register-section">
        <p>还没有骑手账号？<a href="#" @click.prevent="goToRegister" class="link">立即注册</a></p>
      </div>
    </div>

    <div class="login-decoration">
      <div class="deco-circle circle-1"></div>
      <div class="deco-circle circle-2"></div>
      <div class="deco-circle circle-3"></div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0fdf4 0%, rgba(34, 197, 94, 0.1) 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}
.login-container {
  width: 100%;
  max-width: 420px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 48px 40px;
  position: relative;
  z-index: 10;
}
.login-header { text-align: center; margin-bottom: 40px; }
.login-title { font-size: 32px; font-weight: 700; color: #22c55e; margin-bottom: 8px; letter-spacing: 2px; }
.login-subtitle { font-size: 14px; color: var(--text-muted); letter-spacing: 4px; font-weight: 600; }
.login-form { margin-bottom: 24px; }
.login-type-tabs { display: flex; gap: 12px; margin-bottom: 24px; padding: 4px; background: var(--bg-primary); border-radius: var(--radius-md); }
.tab-btn { flex: 1; padding: 12px; border: none; background: transparent; color: var(--text-secondary); font-size: 14px; font-weight: 600; cursor: pointer; border-radius: var(--radius-sm); transition: all var(--transition-fast); }
.tab-btn.active { background: white; color: #22c55e; box-shadow: 0 2px 8px rgba(34, 197, 94, 0.15); }
.form-group { margin-bottom: 20px; }
.input-wrapper { display: flex; align-items: center; background: var(--bg-primary); border: 2px solid transparent; border-radius: var(--radius-md); padding: 0 16px; transition: all var(--transition-fast); }
.input-wrapper:focus-within { border-color: #22c55e; background: white; }
.input-icon { font-size: 20px; margin-right: 12px; }
.form-input { flex: 1; padding: 14px 0; border: none; background: transparent; font-size: 15px; color: var(--text-primary); outline: none; }
.error-message { color: #e74c3c; font-size: 13px; margin-bottom: 16px; padding: 8px 12px; background: rgba(231, 76, 60, 0.1); border-radius: var(--radius-sm); text-align: center; }
.login-btn { width: 100%; padding: 14px; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; border-radius: var(--radius-md); font-size: 17px; font-weight: 700; letter-spacing: 4px; border: none; cursor: pointer; transition: all var(--transition-fast); box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3); }
.login-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4); }
.login-btn:disabled { opacity: 0.8; cursor: not-allowed; }
.register-section { text-align: center; }
.register-section p { font-size: 14px; color: var(--text-secondary); }
.link { color: #22c55e; font-weight: 600; margin-left: 4px; }
.login-decoration { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
.deco-circle { position: absolute; border-radius: 50%; opacity: 0.1; }
.circle-1 { width: 400px; height: 400px; background: #22c55e; top: -200px; right: -100px; }
.circle-2 { width: 300px; height: 300px; background: #eab308; bottom: -150px; left: -100px; }
.circle-3 { width: 200px; height: 200px; background: #22c55e; top: 50%; left: 50%; transform: translate(-50%, -50%); }
</style>
