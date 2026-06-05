<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Carousel from '@/components/common/Carousel.vue'
import Loading from '@/components/common/Loading.vue'
import CategoryNav from '@/components/dish/CategoryNav.vue'
import ShopList from '@/components/shop/ShopList.vue'
import DishRecommend from '@/components/dish/DishRecommend.vue'
import { carouselData, categoryData, shopData, dishData } from '@/data/mockData'
import { categoryApi, carouselApi, shopApi, dishApi } from '@/api'
import type { Category, Shop, Dish, CarouselItem } from '@/types'

const isLoading = ref(true)
const allCategory: Category = { id: 0, name: '全部', icon: '🍽️', count: 0 }
const selectedCategory = ref<Category>(allCategory)
const filteredShops = ref<Shop[]>([])
const categories = ref<Category[]>([])
const carousels = ref<CarouselItem[]>([])
const recommendDishes = ref<Dish[]>([])

const loadCategories = async (): Promise<Category[]> => {
  try {
    return await categoryApi.getList()
  } catch (error) {
    console.error('加载分类失败:', error)
    return categoryData
  }
}

const loadCarousels = async (): Promise<CarouselItem[]> => {
  try {
    return await carouselApi.getList()
  } catch (error) {
    console.error('加载轮播图失败:', error)
    return carouselData
  }
}

const loadShops = async (tagId?: number): Promise<Shop[]> => {
  try {
    const result = await shopApi.getList({ tagId, page: 1, pageSize: 20 })
    return result.list
  } catch (error) {
    console.error('加载店铺失败:', error)
    return shopData
  }
}

const loadRecommendDishes = async (): Promise<Dish[]> => {
  try {
    return await dishApi.getRecommend({ limit: 6 })
  } catch (error) {
    console.error('加载推荐菜品失败:', error)
    return dishData.slice(0, 6)
  }
}

const initData = async () => {
  isLoading.value = true
  try {
    const [cats, items, shops, dishes] = await Promise.all([
      loadCategories(),
      loadCarousels(),
      loadShops(),
      loadRecommendDishes()
    ])
    categories.value = [allCategory, ...cats]
    carousels.value = items
    filteredShops.value = shops
    recommendDishes.value = dishes
    selectedCategory.value = allCategory
  } catch (error) {
    console.error('初始化数据失败:', error)
    categories.value = [allCategory, ...categoryData]
    carousels.value = carouselData
    filteredShops.value = shopData
    recommendDishes.value = dishData.slice(0, 6)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  initData()
})

const handleCategorySelect = async (category: Category) => {
  selectedCategory.value = category
  isLoading.value = true
  try {
    const tagId = category.id === 0 ? undefined : category.id
    filteredShops.value = await loadShops(tagId)
  } catch (error) {
    console.error('切换分类失败:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="home-page">
    <section class="hero-section">
      <div class="container">
        <Carousel :items="carousels.length > 0 ? carousels : carouselData" height="400px" />
      </div>
    </section>

    <section class="category-section">
      <div class="container">
        <CategoryNav
          :categories="categories.length > 0 ? categories : categoryData"
          :selected-id="selectedCategory.id"
          @select="handleCategorySelect"
        />
      </div>
    </section>

    <section class="shop-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">
            {{ selectedCategory.id === 0 ? '热门店铺' : `${selectedCategory.name}店铺` }}
          </h2>
          <span class="shop-count">共 {{ filteredShops.length }} 家</span>
        </div>

        <Loading v-if="isLoading" />
        <ShopList v-else :shops="filteredShops" />
      </div>
    </section>

    <section class="recommend-section">
      <div class="container">
        <DishRecommend :dishes="recommendDishes.length > 0 ? recommendDishes : dishData" title="热门推荐" />
      </div>
    </section>

    <section class="features-section">
      <div class="container">
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🍽️</div>
            <h3 class="feature-title">精选美食</h3>
            <p class="feature-desc">汇聚各类优质餐厅，提供丰富多样的美食选择</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🚚</div>
            <h3 class="feature-title">快速配送</h3>
            <p class="feature-desc">专业配送团队，平均30分钟送达，准时必达</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">💰</div>
            <h3 class="feature-title">优惠多多</h3>
            <p class="feature-desc">新人立减、满减优惠、折扣菜品，省钱更实惠</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">⭐</div>
            <h3 class="feature-title">品质保障</h3>
            <p class="feature-desc">严格商家审核，真实用户评价，吃得放心</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  width: 100%;
}

.hero-section {
  padding: 24px 0;
  background: var(--bg-primary);
}

.category-section {
  padding: 24px 0;
}

.shop-section {
  padding: 40px 0;
  background: var(--bg-secondary);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  position: relative;
  padding-left: 16px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 100%;
  background: var(--primary-color);
  border-radius: 3px;
}

.shop-count {
  font-size: 14px;
  color: var(--text-muted);
  background: rgba(74, 55, 40, 0.08);
  padding: 6px 14px;
  border-radius: var(--radius-sm);
}

.recommend-section {
  padding: 40px 0;
}

.features-section {
  padding: 60px 0;
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.05) 0%, rgba(255, 217, 61, 0.05) 100%);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.feature-card {
  background: var(--bg-card);
  padding: 32px 24px;
  border-radius: var(--radius-lg);
  text-align: center;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.feature-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.feature-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

@media screen and (max-width: 1024px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (max-width: 768px) {
  .hero-section {
    padding: 16px 0;
  }

  .shop-section,
  .recommend-section {
    padding: 24px 0;
  }

  .section-title {
    font-size: 22px;
  }

  .features-section {
    padding: 40px 0;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .feature-card {
    padding: 24px 20px;
  }
}
</style>
