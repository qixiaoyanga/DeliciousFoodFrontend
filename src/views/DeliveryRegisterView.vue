<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { http } from '@/utils/request'
import { DELIVERY_API } from '@/api/paths'
import { encryptPassword } from '@/utils/crypto'
import { toast } from '@/utils/toast'

const router = useRouter()
const phone = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const realName = ref('')
const idCard = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const handleRegister = async () => {
  if (isLoading.value) return
  errorMessage.value = ''

  if (!phone.value) { errorMessage.value = '请输入手机号'; return }
  if (!/^1[3-9]\d{9}$/.test(phone.value)) { errorMessage.value = '请输入正确的手机号'; return }
  if (!email.value) { errorMessage.value = '请输入邮箱'; return }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { errorMessage.value = '请输入正确的邮箱'; return }
  if (!password.value) { errorMessage.value = '请输入密码'; return }
  if (password.value.length < 6) { errorMessage.value = '密码长度不能少于6位'; return }
  if (!confirmPassword.value) { errorMessage.value = '请输入确认密码'; return }
  if (password.value !== confirmPassword.value) { errorMessage.value = '两次输入的密码不一致'; return }
  if (!realName.value) { errorMessage.value = '请输入姓名'; return }
  if (!idCard.value) { errorMessage.value = '请输入身份证号'; return }
  if (!/^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(idCard.value)) { errorMessage.value = '请输入正确的身份证号'; return }

  isLoading.value = true
  try {
    const publicKey = await http.get<string>('/public/public-key', {}, { showError: false })
    const { encryptedData, timestamp, nonce } = encryptPassword(password.value, publicKey)

    await http.post(DELIVERY_API.DELIVERY_REGISTER, {
      phone: phone.value,
      email: email.value,
      realName: realName.value,
      idCard: idCard.value,
      encryptedData,
      timestamp,
      nonce
    })

    toast.success('注册成功！请登录')
    router.push('/delivery/login')
  } catch (error: any) {
    errorMessage.value = error.message || '注册失败，请重试'
  } finally {
    isLoading.value = false
  }
}

const goToLogin = () => router.push('/delivery/login')
</script>

<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-header">
        <h1 class="register-title">骑手注册</h1>
        <p class="register-subtitle">DELIVERY REGISTER</p>
      </div>

      <form class="register-form" @submit.prevent="handleRegister">
        <div class="form-group">
          <div class="input-wrapper"><span class="input-icon">📱</span><input v-model="phone" type="tel" class="form-input" placeholder="请输入手机号" maxlength="11" /></div>
        </div>
        <div class="form-group">
          <div class="input-wrapper"><span class="input-icon">✉️</span><input v-model="email" type="email" class="form-input" placeholder="请输入邮箱" maxlength="50" /></div>
        </div>
        <div class="form-group">
          <div class="input-wrapper"><span class="input-icon">🔒</span><input v-model="password" type="password" class="form-input" placeholder="请输入密码（至少6位）" /></div>
        </div>
        <div class="form-group">
          <div class="input-wrapper"><span class="input-icon">🔑</span><input v-model="confirmPassword" type="password" class="form-input" placeholder="请再次输入密码" /></div>
        </div>
        <div class="form-group">
          <div class="input-wrapper"><span class="input-icon">👤</span><input v-model="realName" type="text" class="form-input" placeholder="请输入真实姓名" /></div>
        </div>
        <div class="form-group">
          <div class="input-wrapper"><span class="input-icon">🆔</span><input v-model="idCard" type="text" class="form-input" placeholder="请输入身份证号" maxlength="18" /></div>
        </div>

        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

        <button type="submit" class="register-btn" :disabled="isLoading">
          <span v-if="isLoading">...</span>
          <span v-else>立即注册</span>
        </button>

        <div class="login-link">
          <span>已有骑手账号？</span>
          <button type="button" class="link-btn" @click="goToLogin">立即登录</button>
        </div>
      </form>
    </div>
    <div class="register-decoration">
      <div class="deco-circle circle-1"></div>
      <div class="deco-circle circle-2"></div>
      <div class="deco-circle circle-3"></div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0fdf4 0%, rgba(34, 197, 94, 0.1) 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}
.register-container {
  width: 100%;
  max-width: 420px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 48px 40px;
  position: relative;
  z-index: 10;
}
.register-header { text-align: center; margin-bottom: 32px; }
.register-title { font-size: 32px; font-weight: 700; color: #22c55e; margin-bottom: 8px; letter-spacing: 2px; }
.register-subtitle { font-size: 14px; color: var(--text-muted); letter-spacing: 4px; font-weight: 600; }
.register-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { margin-bottom: 0; }
.input-wrapper { display: flex; align-items: center; background: var(--bg-primary); border: 2px solid transparent; border-radius: var(--radius-md); padding: 0 16px; transition: all var(--transition-fast); }
.input-wrapper:focus-within { border-color: #22c55e; background: white; }
.input-icon { font-size: 20px; margin-right: 12px; }
.form-input { flex: 1; padding: 14px 0; border: none; background: transparent; font-size: 15px; color: var(--text-primary); outline: none; }
.error-message { padding: 12px; background: rgba(245, 108, 108, 0.1); border-radius: var(--radius-sm); font-size: 13px; color: #f56c6c; text-align: center; }
.register-btn { padding: 14px; background: linear-gradient(135deg, #22c55e, #16a34a); border: none; border-radius: var(--radius-md); font-size: 17px; font-weight: 700; color: white; letter-spacing: 4px; cursor: pointer; transition: all var(--transition-fast); box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3); }
.register-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4); }
.register-btn:disabled { opacity: 0.8; cursor: not-allowed; }
.login-link { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; color: var(--text-secondary); }
.link-btn { background: none; border: none; color: #22c55e; font-size: 14px; font-weight: 500; cursor: pointer; }
.register-decoration { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
.deco-circle { position: absolute; border-radius: 50%; opacity: 0.1; }
.circle-1 { width: 400px; height: 400px; background: #22c55e; top: -200px; right: -100px; }
.circle-2 { width: 300px; height: 300px; background: #eab308; bottom: -150px; left: -100px; }
.circle-3 { width: 200px; height: 200px; background: #22c55e; top: 50%; left: 50%; transform: translate(-50%, -50%); }
</style>
