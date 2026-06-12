<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api'
import { encryptPassword } from '@/utils/crypto'
import { toast } from '@/utils/toast'
import { http } from '@/utils/request'
import { CUSTOMER_API } from '@/api/paths'

const router = useRouter()

const email = ref('')
const code = ref('')
const password = ref('')
const confirmPassword = ref('')
const step = ref(1)
const isLoading = ref(false)
const errorMessage = ref('')
const countdown = ref(0)
const emailSent = ref(false)

const validateEmail = (value: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}

const sendCode = async () => {
  if (isLoading.value) return

  if (!email.value) {
    errorMessage.value = '请输入邮箱'
    return
  }
  if (!validateEmail(email.value)) {
    errorMessage.value = '请输入正确的邮箱格式'
    return
  }

  isLoading.value = true
  try {
    await http.post(CUSTOMER_API.FORGOT_PASSWORD_SEND_CODE, { email: email.value }, { skipAuth: true })
    toast.success('验证码已发送到您的邮箱')
    emailSent.value = true
    startCountdown()
    step.value = 2
  } catch (error: any) {
    errorMessage.value = error.message || '发送失败，请重试'
  } finally {
    isLoading.value = false
  }
}

const startCountdown = () => {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

const verifyCode = async () => {
  if (isLoading.value) return

  if (!code.value) {
    errorMessage.value = '请输入验证码'
    return
  }
  if (code.value.length !== 6) {
    errorMessage.value = '请输入6位验证码'
    return
  }

  isLoading.value = true
  try {
    await http.post(CUSTOMER_API.FORGOT_PASSWORD_VERIFY_CODE, {
      email: email.value,
      code: code.value
    }, { skipAuth: true })
    step.value = 3
    errorMessage.value = ''
  } catch (error: any) {
    errorMessage.value = error.message || '验证码错误，请重试'
  } finally {
    isLoading.value = false
  }
}

const resetPassword = async () => {
  if (isLoading.value) return

  if (!password.value) {
    errorMessage.value = '请输入新密码'
    return
  }
  if (password.value.length < 6) {
    errorMessage.value = '密码长度不能少于6位'
    return
  }
  if (!confirmPassword.value) {
    errorMessage.value = '请输入确认密码'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }

  isLoading.value = true
  try {
    const publicKey = await authApi.getPublicKey()
    const { encryptedData, timestamp, nonce } = encryptPassword(password.value, publicKey)

    await http.post(CUSTOMER_API.FORGOT_PASSWORD_RESET, {
      email: email.value,
      code: code.value,
      encryptedData,
      timestamp,
      nonce
    }, { skipAuth: true })

    toast.success('密码重置成功！')
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  } catch (error: any) {
    errorMessage.value = error.message || '重置失败，请重试'
  } finally {
    isLoading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}

const goBack = () => {
  if (step.value > 1) {
    step.value--
    errorMessage.value = ''
  } else {
    goToLogin()
  }
}
</script>

<template>
  <div class="forgot-password-page">
    <div class="forgot-password-container">
      <div class="forgot-password-header">
        <button class="back-btn" @click="goBack">←</button>
        <h1 class="forgot-password-title">找回密码</h1>
      </div>

      <div class="progress-bar">
        <div class="progress-step" :class="{ active: step >= 1, done: step > 1 }">
          <span class="step-number">1</span>
          <span class="step-label">输入邮箱</span>
        </div>
        <div class="progress-line" :class="{ active: step > 1 }"></div>
        <div class="progress-step" :class="{ active: step >= 2, done: step > 2 }">
          <span class="step-number">2</span>
          <span class="step-label">验证邮箱</span>
        </div>
        <div class="progress-line" :class="{ active: step > 2 }"></div>
        <div class="progress-step" :class="{ active: step >= 3 }">
          <span class="step-number">3</span>
          <span class="step-label">设置密码</span>
        </div>
      </div>

      <form class="forgot-password-form" @submit.prevent>
        <template v-if="step === 1">
          <div class="form-group">
            <label class="form-label">邮箱 *</label>
            <input
              v-model="email"
              type="email"
              placeholder="请输入注册时使用的邮箱"
              class="form-input"
            />
          </div>

          <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

          <button
            type="button"
            class="next-btn"
            :disabled="isLoading"
            @click="sendCode"
          >
            <span v-if="isLoading">发送中...</span>
            <span v-else>发送验证码</span>
          </button>

          <div class="login-link">
            <span>记得密码了？</span>
            <button type="button" class="link-btn" @click="goToLogin">立即登录</button>
          </div>
        </template>

        <template v-else-if="step === 2">
          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input
              :value="email"
              type="email"
              class="form-input readonly"
              readonly
            />
          </div>

          <div class="form-group">
            <label class="form-label">验证码 *</label>
            <div class="code-input-group">
              <input
                v-model="code"
                type="text"
                placeholder="请输入6位验证码"
                class="form-input code-input"
                maxlength="6"
              />
              <button
                type="button"
                class="send-code-btn"
                :disabled="countdown > 0 || isLoading"
                @click="sendCode"
              >
                <span v-if="countdown > 0">{{ countdown }}s</span>
                <span v-else-if="isLoading">发送中</span>
                <span v-else>重新发送</span>
              </button>
            </div>
          </div>

          <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

          <button
            type="button"
            class="next-btn"
            :disabled="isLoading"
            @click="verifyCode"
          >
            <span v-if="isLoading">验证中...</span>
            <span v-else>下一步</span>
          </button>

          <div class="login-link">
            <span>记得密码了？</span>
            <button type="button" class="link-btn" @click="goToLogin">立即登录</button>
          </div>
        </template>

        <template v-else-if="step === 3">
          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input
              :value="email"
              type="email"
              class="form-input readonly"
              readonly
            />
          </div>

          <div class="form-group">
            <label class="form-label">新密码 *</label>
            <input
              v-model="password"
              type="password"
              placeholder="请输入新密码（至少6位）"
              class="form-input"
              maxlength="20"
            />
          </div>

          <div class="form-group">
            <label class="form-label">确认密码 *</label>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              class="form-input"
              maxlength="20"
            />
          </div>

          <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

          <button
            type="button"
            class="next-btn"
            :disabled="isLoading"
            @click="resetPassword"
          >
            <span v-if="isLoading">重置中...</span>
            <span v-else>重置密码</span>
          </button>

          <div class="login-link">
            <span>记得密码了？</span>
            <button type="button" class="link-btn" @click="goToLogin">立即登录</button>
          </div>
        </template>
      </form>
    </div>
  </div>
</template>

<style scoped>
.forgot-password-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary-color) 0%, #ff8c42 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.forgot-password-container {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: var(--radius-lg);
  padding: 32px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.forgot-password-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.back-btn {
  width: 36px;
  height: 36px;
  background: rgba(74, 55, 40, 0.05);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 18px;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn:hover {
  background: rgba(74, 55, 40, 0.1);
}

.forgot-password-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.progress-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  padding: 0 8px;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(74, 55, 40, 0.1);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.progress-step.active .step-number {
  background: var(--primary-color);
  color: white;
}

.progress-step.done .step-number {
  background: var(--success-color);
  color: white;
}

.step-label {
  font-size: 12px;
  color: var(--text-muted);
}

.progress-step.active .step-label,
.progress-step.done .step-label {
  color: var(--text-secondary);
}

.progress-line {
  flex: 1;
  height: 2px;
  background: rgba(74, 55, 40, 0.1);
  margin: 0 8px;
  transition: all var(--transition-fast);
}

.progress-line.active {
  background: var(--primary-color);
}

.forgot-password-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.form-input {
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-primary);
  background: rgba(74, 55, 40, 0.03);
  transition: all var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  background: white;
}

.form-input::placeholder {
  color: var(--text-hint);
}

.form-input.readonly {
  background: rgba(74, 55, 40, 0.05);
  color: var(--text-secondary);
  cursor: not-allowed;
}

.code-input-group {
  display: flex;
  gap: 12px;
}

.code-input {
  flex: 1;
}

.send-code-btn {
  padding: 12px 20px;
  background: rgba(74, 55, 40, 0.05);
  border: 1px solid rgba(74, 55, 40, 0.1);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--primary-color);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.send-code-btn:hover:not(:disabled) {
  background: rgba(255, 107, 53, 0.08);
  border-color: rgba(255, 107, 53, 0.2);
}

.send-code-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  padding: 12px;
  background: rgba(245, 108, 108, 0.1);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: #f56c6c;
  text-align: center;
}

.next-btn {
  padding: 14px;
  background: var(--primary-color);
  border: none;
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.next-btn:hover:not(:disabled) {
  background: var(--primary-dark);
}

.next-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

.link-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
}

.link-btn:hover {
  text-decoration: underline;
}
</style>
