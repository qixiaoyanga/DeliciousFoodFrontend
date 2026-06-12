<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authApi, userApi } from '@/api'
import { toast } from '@/utils/toast'
import { encryptPassword } from '@/utils/crypto'
import type { User } from '@/types'

const router = useRouter()

const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:8080/delicious'

const user = ref<User | null>(null)
const loading = ref(true)

const getAvatarUrl = (imagePath: string | undefined): string | undefined => {
  if (!imagePath) return undefined
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  const fileName = imagePath.split('/').pop()
  if (!fileName) return undefined
  return `${SERVER_BASE_URL}/user/avatars/${fileName}`
}

const genderText = computed(() => {
  if (!user.value) return ''
  return user.value.gender === 1 ? '男' : user.value.gender === 2 ? '女' : '未知'
})

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

const loadUserInfo = async () => {
  try {
    const userInfo = await userApi.getInfo()
    user.value = userInfo
    console.log('获取用户信息成功:', userInfo)
  } catch (error: any) {
    console.error('获取用户信息失败:', error)
    toast.error('获取用户信息失败')
  }
}

const goToPage = (path: string) => {
  router.push(path)
}

const showRealNameModal = ref(false)
const showEditModal = ref(false)
const showChangePwdModal = ref(false)
const showAvatarModal = ref(false)

const realNameForm = ref({
  realName: '',
  idCard: ''
})

const realNameInfo = ref<{ realName: string; idCard: string } | null>(null)
const hasRealNameAuth = ref(false)

const editForm = ref({
  username: '',
  phone: '',
  email: '',
  gender: 0,
  birthday: ''
})

const changePwdForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const initEditForm = () => {
  if (user.value) {
    editForm.value = {
      username: user.value.username || '',
      phone: user.value.phone || '',
      email: user.value.email || '',
      gender: user.value.gender || 0,
      birthday: user.value.birthday ? formatDateForInput(user.value.birthday) : ''
    }
  }
}

const formatDateForInput = (dateStr: string): string => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toISOString().split('T')[0]
  } catch {
    return dateStr.split('T')[0] || ''
  }
}

const maskRealName = (name: string): string => {
  if (!name) return ''
  if (name.length <= 1) return name
  return name.charAt(0) + '*'.repeat(name.length - 1)
}

const maskIdCard = (idCard: string): string => {
  if (!idCard || idCard.length < 18) return ''
  return idCard.substring(0, 4) + '**********' + idCard.substring(14)
}

const loadRealNameInfo = async () => {
  try {
    const info = await userApi.getRealName()
    if (info && info.realName && info.idCard) {
      realNameInfo.value = info
      hasRealNameAuth.value = true
    } else {
      realNameInfo.value = null
      hasRealNameAuth.value = false
    }
  } catch (error: any) {
    realNameInfo.value = null
    hasRealNameAuth.value = false
  }
}

const handleRealNameBtnClick = async () => {
  await loadRealNameInfo()
  showRealNameModal.value = true
}

const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string>('')

const handleAvatarClick = () => {
  showAvatarModal.value = true
}

const handleAvatarChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB')
      return
    }
    avatarFile.value = file
    avatarPreview.value = URL.createObjectURL(file)
  }
}

const uploadAvatar = async () => {
  if (!avatarFile.value) {
    toast.error('请选择图片')
    return
  }

  try {
    await userApi.uploadAvatar(avatarFile.value)
    toast.success('头像上传成功')
    showAvatarModal.value = false
    avatarFile.value = null
    avatarPreview.value = ''
    await loadUserInfo()
  } catch (error: any) {
    console.error('上传头像失败:', error)
    toast.error('上传头像失败')
  }
}

const handleRealNameAuth = async () => {
  if (!realNameForm.value.realName || !realNameForm.value.idCard) {
    toast.error('请填写完整信息')
    return
  }

  if (realNameForm.value.idCard.length !== 18) {
    toast.error('请输入正确的身份证号')
    return
  }

  try {
    await userApi.submitRealName({
      realName: realNameForm.value.realName,
      idCard: realNameForm.value.idCard
    })
    toast.success('实名认证成功')
    showRealNameModal.value = false
    realNameForm.value = { realName: '', idCard: '' }
    hasRealNameAuth.value = true
    await loadRealNameInfo()
    await loadUserInfo()
  } catch (error: any) {
    console.error('实名认证失败:', error)
    toast.error('实名认证失败')
  }
}

const handleUpdateInfo = async () => {
  if (!editForm.value.username || !editForm.value.phone) {
    toast.error('请填写必填信息')
    return
  }

  try {
    const updateData: Partial<User> = {
      username: editForm.value.username,
      phone: editForm.value.phone
    }
    if (editForm.value.email) updateData.email = editForm.value.email
    if (editForm.value.gender) updateData.gender = editForm.value.gender
    if (editForm.value.birthday) updateData.birthday = new Date(editForm.value.birthday).toISOString()

    await userApi.updateInfo(updateData)
    toast.success('信息修改成功')
    showEditModal.value = false
    await loadUserInfo()
  } catch (error: any) {
    console.error('修改信息失败:', error)
    toast.error('修改信息失败')
  }
}

const handleChangePassword = async () => {
  const { oldPassword, newPassword, confirmPassword } = changePwdForm.value

  if (!oldPassword || !newPassword || !confirmPassword) {
    toast.error('请填写完整信息')
    return
  }

  if (newPassword.length < 6) {
    toast.error('新密码长度不能少于6位')
    return
  }

  if (newPassword !== confirmPassword) {
    toast.error('两次输入的密码不一致')
    return
  }

  try {
    const publicKey = await authApi.getPublicKey()
    const { encryptedData: oldEncrypted, timestamp, nonce } = encryptPassword(oldPassword, publicKey)
    const { encryptedData: newEncrypted } = encryptPassword(newPassword, publicKey)

    await userApi.updatePassword({
      oldEncryptedData: oldEncrypted,
      newEncryptedData: newEncrypted,
      timestamp,
      nonce
    })

    toast.success('密码修改成功')
    showChangePwdModal.value = false
    changePwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  } catch (error: any) {
    console.error('修改密码失败:', error)
    toast.error('修改密码失败')
  }
}

const handleLogout = async () => {
  try {
    await authApi.logout()
    toast.success('退出成功')
    router.push('/login')
  } catch (error: any) {
    console.error('退出失败:', error)
    toast.error('退出失败')
  }
}

onMounted(async () => {
  await loadUserInfo()
  await loadRealNameInfo()
  loading.value = false
})
</script>

<template>
  <div class="profile-view">
    <div class="profile-header">
      <div class="header-bg"></div>
      <div class="profile-info">
        <div class="avatar-section" @click="handleAvatarClick">
          <div v-if="user?.image" class="avatar">
            <img :src="getAvatarUrl(user.image)" alt="用户头像" />
            <div class="avatar-edit">
              <span>更换头像</span>
            </div>
          </div>
          <div v-else class="avatar-default">
            {{ user?.username?.charAt(0) || '?' }}
            <div class="avatar-edit">
              <span>更换头像</span>
            </div>
          </div>
          <div class="vip-badge">VIP{{ user?.memberLevel || 0 }}</div>
        </div>
        <div class="user-info">
          <h2 class="username">{{ user?.username || '用户' }}</h2>
          <p class="phone">{{ user?.phone || '未绑定手机' }}</p>
        </div>
      </div>
    </div>

    <div class="container">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else>
        <div class="info-card">
          <div class="info-list">
            <div class="info-row">
              <span class="info-label">用户名</span>
              <span class="info-value">{{ user?.username || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">手机号</span>
              <span class="info-value">{{ user?.phone || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">邮箱</span>
              <span class="info-value">{{ user?.email || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">性别</span>
              <span class="info-value">{{ genderText }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">会员等级</span>
              <span class="info-value vip-level">VIP {{ user?.memberLevel || 0 }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">注册时间</span>
              <span class="info-value">{{ formatDate(user?.registerTime) }}</span>
            </div>
          </div>
        </div>

        <div class="action-card">
          <button class="action-btn primary" @click="handleRealNameBtnClick">
            <span class="action-icon">✓</span>
            <span>{{ hasRealNameAuth || user?.realName ? '已实名认证' : '实名认证' }}</span>
          </button>
          <button class="action-btn" @click="initEditForm(); showEditModal = true">
            <span class="action-icon">✏️</span>
            <span>修改信息</span>
          </button>
          <button class="action-btn" @click="showChangePwdModal = true">
            <span class="action-icon">🔒</span>
            <span>修改密码</span>
          </button>
        </div>

        <div class="menu-card">
          <div class="menu-list">
            <div class="menu-item" @click="goToPage('/order')">
              <span class="menu-icon">📋</span>
              <span class="menu-text">我的订单</span>
              <span class="menu-arrow">›</span>
            </div>
            <div class="menu-item" @click="goToPage('/address')">
              <span class="menu-icon">📍</span>
              <span class="menu-text">收货地址</span>
              <span class="menu-arrow">›</span>
            </div>
          </div>
        </div>

        <div class="bottom-section">
          <button class="logout-btn" @click="handleLogout">
            <span class="logout-icon">🚪</span>
            <span>退出登录</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="showAvatarModal" class="modal-overlay" @click.self="showAvatarModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>更换头像</h3>
          <button class="modal-close" @click="showAvatarModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="avatar-upload-container">
            <div class="avatar-preview-box">
              <img v-if="avatarPreview" :src="avatarPreview" alt="头像预览" />
              <div v-else class="avatar-placeholder">
                <span class="placeholder-icon">📷</span>
                <span class="placeholder-text">点击选择图片</span>
              </div>
            </div>
            <input 
              id="avatar-upload"
              type="file" 
              accept="image/jpeg,image/png,image/gif" 
              class="avatar-input"
              @change="handleAvatarChange"
            />
            <label for="avatar-upload" class="upload-btn">
              <span>选择图片</span>
            </label>
            <p class="upload-tip">支持 JPG、PNG、GIF 格式，大小不超过 5MB</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showAvatarModal = false">取消</button>
          <button class="btn-confirm" @click="uploadAvatar">确认上传</button>
        </div>
      </div>
    </div>

    <div v-if="showRealNameModal" class="modal-overlay" @click.self="showRealNameModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ hasRealNameAuth ? '实名认证信息' : '实名认证' }}</h3>
          <button class="modal-close" @click="showRealNameModal = false">×</button>
        </div>
        <div class="modal-body">
          <div v-if="hasRealNameAuth" class="auth-info">
            <div class="info-item">
              <span class="info-label">真实姓名</span>
              <span class="info-value">{{ maskRealName(realNameInfo?.realName || '') }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">身份证号码</span>
              <span class="info-value">{{ maskIdCard(realNameInfo?.idCard || '') }}</span>
            </div>
            <p class="info-tip">实名认证信息已提交，不可修改</p>
          </div>
          <div v-else>
            <div class="form-group">
              <label>真实姓名</label>
              <input
                v-model="realNameForm.realName"
                type="text"
                placeholder="请输入真实姓名"
              />
            </div>
            <div class="form-group">
              <label>身份证号码</label>
              <input
                v-model="realNameForm.idCard"
                type="text"
                placeholder="请输入18位身份证号"
                maxlength="18"
              />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button v-if="!hasRealNameAuth" class="btn-cancel" @click="showRealNameModal = false">取消</button>
          <button v-if="!hasRealNameAuth" class="btn-confirm" @click="handleRealNameAuth">确认认证</button>
          <button v-else class="btn-confirm" @click="showRealNameModal = false">我知道了</button>
        </div>
      </div>
    </div>

    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>修改个人信息</h3>
          <button class="modal-close" @click="showEditModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>用户名 *</label>
            <input
              v-model="editForm.username"
              type="text"
              placeholder="请输入用户名"
            />
          </div>
          <div class="form-group">
            <label>手机号 *</label>
            <input
              v-model="editForm.phone"
              type="tel"
              placeholder="请输入手机号"
              maxlength="11"
              readonly
              class="readonly"
            />
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input
              v-model="editForm.email"
              type="email"
              placeholder="请输入邮箱"
              readonly
              class="readonly"
            />
          </div>
          <div class="form-group">
            <label>性别</label>
            <div class="gender-options">
              <label class="gender-option">
                <input type="radio" v-model="editForm.gender" :value="1" />
                <span>男</span>
              </label>
              <label class="gender-option">
                <input type="radio" v-model="editForm.gender" :value="2" />
                <span>女</span>
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>生日</label>
            <input
              v-model="editForm.birthday"
              type="date"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showEditModal = false">取消</button>
          <button class="btn-confirm" @click="handleUpdateInfo">保存修改</button>
        </div>
      </div>
    </div>

    <div v-if="showChangePwdModal" class="modal-overlay" @click.self="showChangePwdModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>修改密码</h3>
          <button class="modal-close" @click="showChangePwdModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>原密码</label>
            <input
              v-model="changePwdForm.oldPassword"
              type="password"
              placeholder="请输入原密码"
            />
          </div>
          <div class="form-group">
            <label>新密码</label>
            <input
              v-model="changePwdForm.newPassword"
              type="password"
              placeholder="请输入新密码（至少6位）"
            />
          </div>
          <div class="form-group">
            <label>确认密码</label>
            <input
              v-model="changePwdForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showChangePwdModal = false">取消</button>
          <button class="btn-confirm" @click="handleChangePassword">确认修改</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-view {
  min-height: calc(100vh - 100px);
  background: var(--bg-secondary);
}

.profile-header {
  position: relative;
  padding-bottom: 32px;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(135deg, var(--primary-color) 0%, #FF8A65 100%);
  border-radius: 0 0 40px 40px;
}

.profile-info {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 60px 24px 0;
  max-width: 600px;
  margin: 0 auto;
}

.avatar-section {
  position: relative;
}

.avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  position: relative;
  cursor: pointer;
}

.avatar:hover .avatar-edit {
  opacity: 1;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-default {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 700;
  color: var(--primary-color);
  position: relative;
  cursor: pointer;
}

.avatar-default:hover .avatar-edit {
  opacity: 1;
}

.avatar-edit {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 0 0 50% 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.avatar-edit span {
  font-size: 10px;
  color: white;
}

.vip-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  padding: 2px 8px;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #8B4513;
  font-size: 11px;
  font-weight: 700;
  border-radius: 10px;
  border: 2px solid white;
}

.user-info {
  flex: 1;
}

.username {
  font-size: 22px;
  font-weight: 700;
  color: white;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.phone {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

.container {
  max-width: 600px;
  margin: -20px auto 0;
  padding: 0 16px;
  position: relative;
  z-index: 1;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 107, 53, 0.2);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.info-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: var(--shadow-sm);
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(74, 55, 40, 0.03);
  border-radius: var(--radius-md);
}

.info-label {
  font-size: 15px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 15px;
  color: var(--text-primary);
  font-weight: 500;
}

.info-value.vip-level {
  padding: 2px 12px;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #8B4513;
  font-size: 13px;
  font-weight: 700;
  border-radius: 12px;
}

.menu-card {
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  margin-bottom: 12px;
}

.menu-list {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background: rgba(255, 107, 53, 0.05);
}

.menu-icon {
  font-size: 22px;
}

.menu-text {
  flex: 1;
  font-size: 15px;
  color: var(--text-primary);
}

.menu-arrow {
  font-size: 20px;
  color: var(--text-hint);
}

.bottom-section {
  padding: 24px 0 40px;
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: rgba(74, 55, 40, 0.05);
  border: 1px solid rgba(74, 55, 40, 0.1);
  border-radius: var(--radius-lg);
  font-size: 16px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.logout-btn:hover {
  background: rgba(229, 57, 53, 0.08);
  color: var(--danger-color);
  border-color: rgba(229, 57, 53, 0.2);
}

.logout-icon {
  font-size: 18px;
}

@media screen and (max-width: 768px) {
  .profile-view {
    min-height: calc(100vh - 80px);
  }

  .header-bg {
    height: 180px;
  }

  .profile-info {
    padding: 50px 16px 0;
    gap: 12px;
  }

  .avatar,
  .avatar-default {
    width: 75px;
    height: 75px;
  }

  .avatar-default {
    font-size: 28px;
  }

  .username {
    font-size: 20px;
  }

  .container {
    padding: 0 12px;
  }

  .info-card {
    padding: 16px;
  }

  .info-row {
    padding: 10px 12px;
  }

  .info-label,
  .info-value {
    font-size: 14px;
  }
}

.action-card {
  display: flex;
  gap: 12px;
  background: white;
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: var(--shadow-sm);
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: rgba(74, 55, 40, 0.05);
  border: 1px solid rgba(74, 55, 40, 0.1);
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: rgba(255, 107, 53, 0.08);
  border-color: rgba(255, 107, 53, 0.2);
}

.action-btn.primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, #FF8A65 100%);
  border-color: var(--primary-color);
  color: white;
}

.action-btn.primary:hover {
  opacity: 0.9;
}

.action-icon {
  font-size: 16px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  width: 100%;
  max-width: 480px;
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 50%;
  transition: background var(--transition-fast);
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.05);
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 15px;
  color: var(--text-primary);
  transition: border-color var(--transition-fast);
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-group input::placeholder {
  color: var(--text-hint);
}

.form-group input.readonly {
  background: rgba(74, 55, 40, 0.05);
  color: var(--text-secondary);
  cursor: not-allowed;
}

.gender-options {
  display: flex;
  gap: 24px;
}

.gender-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.gender-option input[type="radio"] {
  width: 18px;
  height: 18px;
  margin: 0;
}

.gender-option span {
  font-size: 14px;
  color: var(--text-primary);
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border-color);
}

.btn-cancel {
  flex: 1;
  padding: 14px;
  background: rgba(74, 55, 40, 0.05);
  border: 1px solid rgba(74, 55, 40, 0.1);
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-cancel:hover {
  background: rgba(0, 0, 0, 0.05);
}

.btn-confirm {
  flex: 1;
  padding: 14px;
  background: linear-gradient(135deg, var(--primary-color) 0%, #FF8A65 100%);
  border: none;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.btn-confirm:hover {
  opacity: 0.9;
}

.auth-info {
  padding: 16px;
  background: rgba(74, 55, 40, 0.03);
  border-radius: var(--radius-md);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .info-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.info-item .info-value {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.info-tip {
  margin-top: 16px;
  padding: 12px;
  background: rgba(255, 107, 53, 0.08);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--primary-color);
  text-align: center;
}

.avatar-upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.avatar-preview-box {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px dashed var(--border-color);
  background: rgba(74, 55, 40, 0.03);
}

.avatar-preview-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.placeholder-icon {
  font-size: 32px;
}

.placeholder-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.avatar-input {
  display: none;
}

.upload-btn {
  padding: 12px 32px;
  background: rgba(74, 55, 40, 0.05);
  border: 1px solid rgba(74, 55, 40, 0.1);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.upload-btn:hover {
  background: rgba(255, 107, 53, 0.08);
  border-color: rgba(255, 107, 53, 0.2);
}

.upload-tip {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}
</style>
