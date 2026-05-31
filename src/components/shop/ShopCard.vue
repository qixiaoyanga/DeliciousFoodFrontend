<script setup lang="ts">
import type { Shop } from '@/types'

interface Props {
  shop: Shop
}

defineProps<Props>()

const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

const goToShop = (id: number) => {
  window.location.href = `/shop/${id}`
}
</script>

<template>
  <div class="shop-card" @click="goToShop(shop.id)">
    <div class="shop-image-wrapper">
      <img :src="shop.image" :alt="shop.name" class="shop-image" />
      <div class="shop-badges">
        <span class="badge" v-if="shop.deliveryFee === 0">免配送费</span>
      </div>
    </div>

    <div class="shop-info">
      <h3 class="shop-name">{{ shop.name }}</h3>
      
      <div class="shop-rating">
        <span class="rating-score">{{ shop.rating }}</span>
        <div class="rating-stars">
          <span
            v-for="i in 5"
            :key="i"
            class="star"
            :class="{ filled: i <= Math.round(shop.rating) }"
          >
            ★
          </span>
        </div>
        <span class="sales">月售 {{ formatNumber(shop.sales) }}</span>
      </div>

      <div class="shop-meta">
        <div class="meta-item">
          <span class="meta-icon">🚚</span>
          <span class="meta-text">{{ shop.deliveryTime }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-icon">💰</span>
          <span class="meta-text">起送 ¥{{ shop.minimumOrder }}</span>
        </div>
        <div class="meta-item" v-if="shop.deliveryFee > 0">
          <span class="meta-icon">📦</span>
          <span class="meta-text">配送 ¥{{ shop.deliveryFee }}</span>
        </div>
      </div>

      <div class="shop-tags">
        <span class="tag" v-for="tag in shop.categories" :key="tag">
          {{ tag }}
        </span>
      </div>

      <p class="shop-description" v-if="shop.description">
        {{ shop.description }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.shop-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
  cursor: pointer;
}

.shop-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-lg);
}

.shop-card:active {
  transform: translateY(-4px) scale(0.98);
}

.shop-image-wrapper {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.shop-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal);
}

.shop-card:hover .shop-image {
  transform: scale(1.05);
}

.shop-badges {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  padding: 4px 10px;
  background: var(--primary-color);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
}

.shop-info {
  padding: 16px;
}

.shop-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.shop-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.rating-score {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-color);
}

.rating-stars {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 14px;
  color: #ddd;
}

.star.filled {
  color: var(--secondary-color);
}

.sales {
  font-size: 13px;
  color: var(--text-muted);
  margin-left: 8px;
}

.shop-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(74, 55, 40, 0.1);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-icon {
  font-size: 14px;
}

.meta-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.shop-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.tag {
  padding: 3px 10px;
  background: rgba(255, 107, 53, 0.08);
  color: var(--primary-color);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
}

.shop-description {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media screen and (max-width: 768px) {
  .shop-image-wrapper {
    height: 160px;
  }

  .shop-name {
    font-size: 16px;
  }

  .shop-meta {
    gap: 8px;
  }
}
</style>
