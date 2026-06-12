<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { addressApi, orderApi } from '@/api'
import { toast } from '@/utils/toast'
import type { Address } from '@/api/address'

const router = useRouter()
const route = useRoute()

const addresses = ref<Address[]>([])
const loading = ref(true)
const showAddModal = ref(false)
const showEditModal = ref(false)
const selectedId = ref(0)
const isSelectMode = ref(false)

const newAddress = ref({
  consignee: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  longitude: 0,
  latitude: 0,
  label: '',
  defaulted: 0
})

const editingAddress = ref<Address | null>(null)

const goBack = () => {
  const orderNo = route.query.orderNo as string
  const from = route.query.from as string

  if (orderNo && from === 'payment') {
    router.push({ path: '/payment/confirm', query: { orderNo, refresh: Date.now().toString() } })
  } else if (orderNo) {
    router.push({ path: '/order/detail', query: { orderNo, refresh: Date.now().toString() } })
  } else {
    router.push({ path: '/order/detail', query: { refresh: Date.now().toString() } })
  }
}

const loadAddresses = async () => {
  try {
    const data = await addressApi.getList()
    addresses.value = data
  } catch (error: any) {
    console.error('获取地址列表失败:', error)
    toast.error('获取地址列表失败')
  } finally {
    loading.value = false
  }
}

const confirmSelection = async () => {
  const selected = addresses.value.find(a => a.id === selectedId.value)
  if (selected) {
    console.log('confirmSelection: 已选择地址:', selected)
    sessionStorage.setItem('selectedAddress', JSON.stringify(selected))

    const orderNo = route.query.orderNo as string
    const from = route.query.from as string

    if (orderNo) {
      try {
        console.log('confirmSelection: 正在更新订单地址, orderNo:', orderNo, 'addressId:', selected.id)
        await orderApi.updateAddress({
          orderNo: parseInt(orderNo),
          addressId: selected.id
        })
        console.log('confirmSelection: 地址更新成功')
        toast.success('地址已更新')

        setTimeout(() => {
          console.log('confirmSelection: 返回支付页面')
          if (from === 'payment') {
            router.push({ path: '/payment/confirm', query: { orderNo, refresh: Date.now().toString() } })
          } else {
            router.push({ path: `/order/detail/${orderNo}`, query: { refresh: Date.now().toString() } })
          }
        }, 100)
      } catch (error: any) {
        console.error('confirmSelection: 更新订单地址失败:', error)
        toast.error('更新订单地址失败')
        router.push({ path: `/order/detail/${orderNo}`, query: { refresh: Date.now().toString() } })
      }
    } else {
      console.log('confirmSelection: 没有订单号，返回订单确认页面')
      router.push({ path: '/order/detail', query: { refresh: Date.now().toString() } })
    }
  } else {
    toast.error('请选择收货地址')
  }
}

const openAddModal = () => {
  newAddress.value = {
    consignee: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    longitude: 0,
    latitude: 0,
    label: '',
    defaulted: 0
  }
  showAddModal.value = true
}

const saveAddress = async () => {
  if (!newAddress.value.consignee || !newAddress.value.phone || !newAddress.value.detail) {
    toast.error('请填写完整信息')
    return
  }

  try {
    const result = await addressApi.add(newAddress.value)
    toast.success('添加成功')
    showAddModal.value = false
    await loadAddresses()
    
    if (isSelectMode.value) {
      console.log('选择模式，尝试选中新建地址')
      console.log('接口返回结果:', result)
      
      if (result && result.id) {
        selectedId.value = result.id
        console.log('使用接口返回的id:', result.id)
      } else {
        const newAddr = addresses.value.find(a => 
          a.consignee === newAddress.value.consignee && 
          a.phone === newAddress.value.phone
        )
        if (newAddr) {
          selectedId.value = newAddr.id
          console.log('通过姓名和电话找到地址:', newAddr.id)
        } else {
          console.log('没有找到新建的地址')
        }
      }
      console.log('当前选中的地址ID:', selectedId.value)
    }
  } catch (error: any) {
    console.error('添加地址失败:', error)
    toast.error('添加地址失败')
  }
}

const openEditModal = (address: Address) => {
  editingAddress.value = { ...address }
  showEditModal.value = true
}

const updateAddress = async () => {
  if (!editingAddress.value) return

  if (!editingAddress.value.consignee || !editingAddress.value.phone || !editingAddress.value.detail) {
    toast.error('请填写完整信息')
    return
  }

  try {
    await addressApi.update(editingAddress.value.id, editingAddress.value)
    toast.success('更新成功')
    showEditModal.value = false
    await loadAddresses()
  } catch (error: any) {
    console.error('更新地址失败:', error)
    toast.error('更新地址失败')
  }
}

const deleteAddress = async (id: number) => {
  if (!confirm('确定要删除这个地址吗？')) return

  try {
    await addressApi.delete(id)
    toast.success('删除成功')
    await loadAddresses()
  } catch (error: any) {
    console.error('删除地址失败:', error)
    toast.error('删除地址失败')
  }
}

const setDefault = async (id: number) => {
  try {
    await addressApi.setDefault(id)
    toast.success('已设为默认地址')
    await loadAddresses()
  } catch (error: any) {
    console.error('设置默认地址失败:', error)
    toast.error('设置默认地址失败')
  }
}

const getFullAddress = (address: Address) => {
  const parts = []
  if (address.province) parts.push(address.province)
  if (address.city) parts.push(address.city)
  if (address.district) parts.push(address.district)
  if (address.detail) parts.push(address.detail)
  return parts.join('')
}

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  isSelectMode.value = params.get('select') === 'true'

  await loadAddresses()
})
</script>

<template>
  <div class="address-view">
    <div class="container">
      <div class="header">
        <button class="back-btn" @click="goBack">
          <span>←</span>
        </button>
        <h1 class="title">{{ isSelectMode ? '选择收货地址' : '收货地址' }}</h1>
        <div class="placeholder"></div>
      </div>

      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="addresses.length === 0" class="empty-container">
        <div class="empty-icon">📍</div>
        <h3 class="empty-title">暂无收货地址</h3>
        <button class="add-address-btn" @click="openAddModal">添加收货地址</button>
      </div>

      <div v-else class="address-list">
        <div
          v-for="address in addresses"
          :key="address.id"
          class="address-card"
          :class="{ selected: selectedId === address.id }"
        >
          <div v-if="isSelectMode" class="select-radio" @click="selectedId = address.id">
            <div class="radio-inner" :class="{ checked: selectedId === address.id }"></div>
          </div>

          <div class="address-content">
            <div class="address-header">
              <div class="user-info">
                <span class="user-name">{{ address.consignee }}</span>
                <span class="user-phone">{{ address.phone }}</span>
              </div>
              <div class="address-tags">
                <span v-if="address.defaulted === 1" class="default-tag">默认</span>
                <span v-if="address.label" class="label-tag">{{ address.label }}</span>
              </div>
            </div>
            <p class="address-detail">{{ getFullAddress(address) }}</p>
          </div>

          <div v-if="!isSelectMode" class="address-actions">
            <button class="action-btn edit" @click="openEditModal(address)">编辑</button>
            <button class="action-btn default" @click="setDefault(address.id)" v-if="address.defaulted !== 1">设为默认</button>
            <button class="action-btn delete" @click="deleteAddress(address.id)">删除</button>
          </div>
        </div>
      </div>

      <div v-if="isSelectMode && addresses.length > 0" class="bottom-actions">
        <button class="add-address-btn" @click="openAddModal">添加新地址</button>
        <button class="confirm-btn" @click="confirmSelection">确认选择</button>
      </div>

      <div v-if="!isSelectMode" class="add-address-wrapper">
        <button class="add-address-btn full-width" @click="openAddModal">
          <span class="add-icon">+</span>
          <span>添加收货地址</span>
        </button>
      </div>
    </div>

    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>添加收货地址</h3>
          <button class="close-btn" @click="showAddModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>收货人 *</label>
            <input type="text" v-model="newAddress.consignee" placeholder="请输入收货人姓名" />
          </div>
          <div class="form-group">
            <label>联系电话 *</label>
            <input type="tel" v-model="newAddress.phone" placeholder="请输入联系电话" />
          </div>
          <div class="form-group">
            <label>所在地区</label>
            <div class="region-row">
              <input type="text" v-model="newAddress.province" placeholder="省" />
              <input type="text" v-model="newAddress.city" placeholder="市" />
              <input type="text" v-model="newAddress.district" placeholder="区" />
            </div>
          </div>
          <div class="form-group">
            <label>详细地址 *</label>
            <textarea v-model="newAddress.detail" placeholder="请输入详细地址" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>标签</label>
            <input type="text" v-model="newAddress.label" placeholder="如：家、公司" />
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="newAddress.defaulted" :true-value="1" :false-value="0" />
              <span>设为默认地址</span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showAddModal = false">取消</button>
          <button class="btn-confirm" @click="saveAddress">保存</button>
        </div>
      </div>
    </div>

    <div v-if="showEditModal && editingAddress" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>编辑收货地址</h3>
          <button class="close-btn" @click="showEditModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>收货人 *</label>
            <input type="text" v-model="editingAddress.consignee" placeholder="请输入收货人姓名" />
          </div>
          <div class="form-group">
            <label>联系电话 *</label>
            <input type="tel" v-model="editingAddress.phone" placeholder="请输入联系电话" />
          </div>
          <div class="form-group">
            <label>所在地区</label>
            <div class="region-row">
              <input type="text" v-model="editingAddress.province" placeholder="省" />
              <input type="text" v-model="editingAddress.city" placeholder="市" />
              <input type="text" v-model="editingAddress.district" placeholder="区" />
            </div>
          </div>
          <div class="form-group">
            <label>详细地址 *</label>
            <textarea v-model="editingAddress.detail" placeholder="请输入详细地址" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>标签</label>
            <input type="text" v-model="editingAddress.label" placeholder="如：家、公司" />
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="editingAddress.defaulted" :true-value="1" :false-value="0" />
              <span>设为默认地址</span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showEditModal = false">取消</button>
          <button class="btn-confirm" @click="updateAddress">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.address-view {
  min-height: calc(100vh - 100px);
  background: var(--bg-secondary);
}

.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: white;
  margin: 0 -20px 16px -20px;
}

.back-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(74, 55, 40, 0.05);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  color: var(--text-primary);
}

.title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.placeholder {
  width: 40px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
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

.empty-container {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24px;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.address-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: white;
  border-radius: var(--radius-lg);
  padding: 16px;
  border: 2px solid transparent;
  transition: all var(--transition-fast);
}

.address-card.selected {
  border-color: var(--primary-color);
  background: rgba(255, 107, 53, 0.03);
}

.select-radio {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(74, 55, 40, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 4px;
}

.radio-inner {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: transparent;
  transition: all var(--transition-fast);
}

.radio-inner.checked {
  background: var(--primary-color);
}

.address-content {
  flex: 1;
  min-width: 0;
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.user-phone {
  font-size: 14px;
  color: var(--text-secondary);
}

.address-tags {
  display: flex;
  gap: 8px;
}

.default-tag {
  padding: 2px 8px;
  background: var(--primary-color);
  color: white;
  font-size: 12px;
  border-radius: 4px;
}

.label-tag {
  padding: 2px 8px;
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  font-size: 12px;
  border-radius: 4px;
}

.address-detail {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.address-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.action-btn.edit {
  background: rgba(74, 55, 40, 0.08);
  color: var(--text-primary);
}

.action-btn.default {
  background: rgba(255, 107, 53, 0.1);
  color: var(--primary-color);
}

.action-btn.delete {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.add-address-wrapper {
  padding: 24px 0;
}

.add-address-btn {
  flex: 1;
  padding: 14px;
  background: rgba(74, 55, 40, 0.05);
  border: 2px dashed rgba(74, 55, 40, 0.2);
  border-radius: var(--radius-lg);
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.add-address-btn.full-width {
  width: 100%;
}

.add-icon {
  font-size: 20px;
  color: var(--primary-color);
}

.confirm-btn {
  flex: 2;
  padding: 14px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
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
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(74, 55, 40, 0.08);
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  font-size: 24px;
  color: var(--text-muted);
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(74, 55, 40, 0.15);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-primary);
  box-sizing: border-box;
}

.form-group textarea {
  resize: none;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: var(--text-muted);
}

.region-row {
  display: flex;
  gap: 8px;
}

.region-row input {
  flex: 1;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid rgba(74, 55, 40, 0.08);
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 12px;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel {
  background: rgba(74, 55, 40, 0.08);
  color: var(--text-primary);
  border: none;
}

.btn-confirm {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
}

@media screen and (max-width: 768px) {
  .address-view {
    min-height: calc(100vh - 80px);
  }

  .address-card {
    padding: 12px;
  }

  .action-btn {
    padding: 4px 8px;
    font-size: 12px;
  }
}
</style>
