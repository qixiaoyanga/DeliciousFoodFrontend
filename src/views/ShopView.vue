<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Loading from '@/components/common/Loading.vue'
import DishCard from '@/components/dish/DishCard.vue'
import { shopData, dishData } from '@/data/mockData'
import { shopDetailApi, shopDishApi } from '@/api'
import type { Shop, Dish } from '@/types'

const route = useRoute()
const shopId = ref(parseInt(route.params.id as string))
const shop = ref<Shop | null | undefined>(null)
const dishes = ref<Dish[]>([])
const isLoading = ref(true)

const loadShopDetail = async (id: number): Promise<Shop> => {
  try {
    return await shopDetailApi.getDetail(id)
  } catch (error) {
    console.error('加载店铺详情失败:', error)
    return shopData.find(s => s.id === id) || shopData[0] || ({} as Shop)
  }
}

const loadShopDishes = async (id: number): Promise<Dish[]> => {
  try {
    return await shopDishApi.getDishes(id)
  } catch (error) {
    console.error('加载店铺菜品失败:', error)
    const filtered = dishData.filter(d => d.shopId === id)
    return filtered.length > 0 ? filtered : dishData.slice(0, 4)
  }
}

const initData = async () => {
  isLoading.value = true
  try {
    const [shopResult, dishesResult] = await Promise.all([
      loadShopDetail(shopId.value),
      loadShopDishes(shopId.value)
    ])
    shop.value = shopResult
    dishes.value = dishesResult
  } catch (error) {
    console.error('初始化店铺数据失败:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  initData()
})
</script>

<template>
  <div class="shop-view">
    <Loading v-if="isLoading" />

    <div v-else-if="shop" class="shop-detail">
      <section class="shop-hero">
        <div class="hero-image">
          <img :src="shop.image" :alt="shop.name" />
          <div class="hero-overlay"></div>
        </div>
        <div class="hero-content container">
          <h1 class="shop-name">{{ shop.name }}</h1>
          <p class="shop-desc">{{ shop.description }}</p>

          <div class="shop-stats">
            <div class="stat-item">
              <span class="stat-value">{{ shop.rating }}</span>
              <span class="stat-label">评分</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ shop.sales }}</span>
              <span class="stat-label">月售</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ shop.deliveryTime }}</span>
              <span class="stat-label">配送时间</span>
            </div>
          </div>
        </div>
      </section>

      <section class="shop-info-bar">
        <div class="container">
          <div class="info-bar-grid">
            <div class="info-item">
              <span class="info-icon">💰</span>
              <span class="info-label">起送价</span>
              <span class="info-value">¥{{ shop.minimumOrder }}</span>
            </div>
            <div class="info-item">
              <span class="info-icon">📦</span>
              <span class="info-label">配送费</span>
              <span class="info-value" :class="{ free: shop.deliveryFee === 0 }">
                {{ shop.deliveryFee === 0 ? '免费' : `¥${shop.deliveryFee}` }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-icon">⏱️</span>
              <span class="info-label">平均配送</span>
              <span class="info-value">{{ shop.deliveryTime }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="dishes-section">
        <div class="container">
          <h2 class="section-title">热门菜品</h2>
          <div class="dishes-grid">
            <DishCard
              v-for="dish in dishes"
              :key="dish.id"
              :dish="dish"
            />
          </div>
        </div>
      </section>
    </div>

    <div v-else class="not-found">
      <div class="not-found-icon">🔍</div>
      <h2>店铺不存在</h2>
      <p>抱歉，您访问的店铺不存在</p>
    </div>
  </div>
</template>

<style scoped>
.shop-view {
  min-height: 100vh;
}

.shop-hero {
  position: relative;
  height: 300px;
}

.hero-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.hero-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7));
}

.hero-content {
  position: absolute;
  bottom: 40px;
  left: 0;
  right: 0;
  color: white;
}

.shop-name {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 12px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.shop-desc {
  font-size: 16px;
  margin-bottom: 20px;
  opacity: 0.95;
}

.shop-stats {
  display: flex;
  gap: 32px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--secondary-color);
}

.stat-label {
  font-size: 13px;
  opacity: 0.9;
  margin-top: 4px;
}

.shop-info-bar {
  background: var(--bg-card);
  padding: 24px 0;
  box-shadow: var(--shadow-sm);
  margin-bottom: 32px;
}

.info-bar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.info-icon {
  font-size: 24px;
}

.info-label {
  font-size: 13px;
  color: var(--text-muted);
}

.info-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.info-value.free {
  color: var(--primary-color);
}

.dishes-section {
  padding: 40px 0;
}

.section-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 24px;
  padding-left: 16px;
  border-left: 6px solid var(--primary-color);
}

.dishes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
}

.not-found {
  text-align: center;
  padding: 100px 20px;
}

.not-found-icon {
  font-size: 80px;
  margin-bottom: 24px;
}

.not-found h2 {
  font-size: 28px;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.not-found p {
  font-size: 16px;
  color: var(--text-secondary);
}

@media screen and (max-width: 768px) {
  .shop-hero {
    height: 240px;
  }

  .shop-name {
    font-size: 28px;
  }

  .shop-stats {
    gap: 20px;
  }

  .stat-value {
    font-size: 20px;
  }

  .info-bar-grid {
    gap: 16px;
  }

  .dishes-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}
</style>