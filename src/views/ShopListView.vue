<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { http } from '@/utils/request'
import { CUSTOMER_API } from '@/api/paths'
import { toast } from '@/utils/toast'

const router = useRouter()

const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:8080/delicious'

const getLogoUrl = (logo: string | undefined): string => {
  if (!logo) return 'https://via.placeholder.com/200x150'
  if (logo.startsWith('http://') || logo.startsWith('https://')) {
    return logo
  }
  const baseUrl = SERVER_BASE_URL.replace(/\/$/, '')
  const logoPath = logo.startsWith('/') ? logo.slice(1) : logo
  return `${baseUrl}/${logoPath}`
}

interface Shop {
  id: number
  name: string
  logo: string
  description: string
  grade: number
  monthlySales: number
  delivery: number
  minOrderAmount: number
  businessHours: string
}

const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const isLoading = ref(false)
const shops = ref<Shop[]>([])

const loadShops = async () => {
  isLoading.value = true
  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    if (searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim()
    }
    const result = await http.get<{ records: Shop[]; total: number }>(CUSTOMER_API.SHOP_LIST, params)
    shops.value = result.records
    total.value = result.total
  } catch (error) {
    console.error('加载商家列表失败:', error)
    toast.error('加载失败，请重试')
    shops.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadShops()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    handleSearch()
  }
}

const handlePageChange = (page: number) => {
  if (page < 1 || page > Math.ceil(total.value / pageSize.value)) return
  currentPage.value = page
  loadShops()
}

const handlePageSizeChange = () => {
  currentPage.value = 1
  loadShops()
}

const viewShop = (shopId: number) => {
  router.push(`/shop/${shopId}`)
}



const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

loadShops()
</script>

<template>
  <div class="shop-list-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">所有商家</h1>
      </div>

      <div class="search-bar">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索商家名称..."
            class="search-input"
            @keydown="handleKeydown"
          />
        </div>
        <button class="search-btn" @click="handleSearch">搜索</button>
      </div>

      <div class="shops-container">
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>

        <div v-else-if="shops.length === 0" class="empty-state">
          <div class="empty-icon">🏪</div>
          <p class="empty-text">暂无商家</p>
        </div>

        <div v-else class="shops-grid">
          <div v-for="shop in shops" :key="shop.id" class="shop-card" @click="viewShop(shop.id)">
            <div class="shop-image">
              <img :src="getLogoUrl(shop.logo)" alt="店铺图片" />
            </div>
            <div class="shop-info">
              <h3 class="shop-name">{{ shop.name }}</h3>
              <p class="shop-desc">{{ shop.description || '暂无描述' }}</p>
              <div class="shop-meta">
                <span class="meta-item">⭐ {{ shop.grade }}</span>
                <span class="meta-item">📦 {{ shop.monthlySales }}单/月</span>
                <span class="meta-item">💰 ¥{{ shop.delivery }}配送费</span>
              </div>
              <div class="shop-footer">
                <span class="min-order">¥{{ shop.minOrderAmount }}起送</span>
                <span class="business-hours">{{ shop.businessHours }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="total > 0" class="pagination">
        <div class="pagination-info">
          共 {{ total }} 条记录，当前第 {{ currentPage }} / {{ totalPages }} 页
        </div>
        <div class="pagination-controls">
          <button
            class="pagination-btn"
            :disabled="currentPage === 1"
            @click="handlePageChange(currentPage - 1)"
          >
            上一页
          </button>
          <div class="page-numbers">
            <button
              v-for="page in Math.min(5, totalPages)"
              :key="page"
              class="page-btn"
              :class="{ active: currentPage === page }"
              @click="handlePageChange(page)"
            >
              {{ page }}
            </button>
          </div>
          <button
            class="pagination-btn"
            :disabled="currentPage === totalPages"
            @click="handlePageChange(currentPage + 1)"
          >
            下一页
          </button>
          <select v-model="pageSize" class="page-size-select" @change="handlePageSizeChange">
            <option :value="10">10条/页</option>
            <option :value="20">20条/页</option>
            <option :value="50">50条/页</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shop-list-page {
  min-height: calc(100vh - 200px);
  padding: 40px 0;
  background: var(--bg-primary);
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: white;
  border-radius: var(--radius-md);
  padding: 0 16px;
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.search-input-wrapper:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
}

.search-icon {
  font-size: 16px;
  margin-right: 12px;
}

.search-input {
  flex: 1;
  padding: 14px;
  border: none;
  font-size: 15px;
  color: var(--text-primary);
  background: transparent;
}

.search-input:focus {
  outline: none;
}

.search-input::placeholder {
  color: var(--text-hint);
}

.search-btn {
  padding: 14px 28px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.search-btn:hover {
  background: var(--primary-dark);
}

.shops-container {
  margin-bottom: 32px;
}

.loading-state {
  text-align: center;
  padding: 80px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 107, 53, 0.2);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.empty-text {
  font-size: 18px;
  color: var(--text-secondary);
}

.shops-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.shop-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.shop-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.shop-image {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.shop-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.shop-info {
  padding: 16px;
}

.shop-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.shop-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 12px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shop-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.meta-item {
  font-size: 13px;
  color: var(--text-secondary);
}

.shop-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.min-order {
  font-size: 13px;
  color: var(--primary-color);
  font-weight: 600;
}

.business-hours {
  font-size: 12px;
  color: var(--text-muted);
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
}

.pagination-info {
  font-size: 14px;
  color: var(--text-secondary);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-btn {
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.page-btn:hover:not(.active) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.page-btn.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.page-size-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-primary);
  background: white;
  cursor: pointer;
}

.page-size-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

@media screen and (max-width: 768px) {
  .page-title {
    font-size: 26px;
  }

  .search-bar {
    flex-direction: column;
  }

  .shops-grid {
    grid-template-columns: 1fr;
  }

  .pagination {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .pagination-controls {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>