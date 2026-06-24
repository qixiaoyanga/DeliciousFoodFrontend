<script setup lang="ts">
import type { Shop } from '@/types'

interface Props {
  shop: Shop
}

defineProps<Props>()

const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:8080/delicious'

const formatNumber = (num: number | null) => {
  if (num == null) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

const getImageUrl = (imagePath: string): string => {
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  return `${SERVER_BASE_URL}/${imagePath.replace(/^\//, '')}`
}

const goToShop = (id: number) => {
  window.location.href = `/shop/${id}`
}
</script>

<template>
  <div class="shop-card" @click="goToShop(shop.id)">
    <div class="shop-image-wrapper">
      <img :src="getImageUrl(shop.logo)" :alt="shop.name" class="shop-image" />
      <div class="shop-badges">
        <span class="badge badge-free" v-if="shop.delivery === 0">免配送费</span>
        <span class="badge badge-high" v-if="shop.grade != null && shop.grade >= 4.5">高分店铺</span>
      </div>
      <div class="shop-closed" v-if="shop.businessHours">
        <span class="closed-icon">⏰</span>
        <span class="closed-text">{{ shop.businessHours }}</span>
      </div>
    </div>

    <div class="shop-info">
      <h3 class="shop-name">{{ shop.name }}</h3>
      
      <div class="shop-rating">
        <div class="rating-container">
          <span class="rating-star">⭐</span>
          <span class="rating-score">{{ shop.grade != null ? shop.grade.toFixed(1) : '暂无评分' }}</span>
        </div>
        <span class="sales">月售 {{ formatNumber(shop.monthlySales) }}</span>
      </div>

      <div class="shop-meta">
        <div class="meta-item">
          <span class="meta-icon">🚚</span>
          <span class="meta-text">配送 ¥{{ shop.delivery != null ? shop.delivery.toFixed(2) : '0.00' }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-icon">💰</span>
          <span class="meta-text">起送 ¥{{ shop.minOrderAmount != null ? shop.minOrderAmount.toFixed(2) : '0.00' }}</span>
        </div>
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: 1px solid rgba(74, 55, 40, 0.08);
}

.shop-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 32px rgba(255, 107, 53, 0.15);
  border-color: rgba(255, 107, 53, 0.2);
}

.shop-card:active {
  transform: translateY(-4px) scale(0.99);
}

.shop-image-wrapper {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.shop-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.shop-card:hover .shop-image {
  transform: scale(1.08);
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
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  backdrop-filter: blur(4px);
}

.badge-free {
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  color: white;
}

.badge-high {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.shop-closed {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  border-radius: 20px;
}

.closed-icon {
  font-size: 14px;
}

.closed-text {
  font-size: 12px;
  color: white;
}

.shop-info {
  padding: 18px;
}

.shop-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.shop-rating {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.rating-container {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rating-star {
  font-size: 18px;
}

.rating-score {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-color);
}

.sales {
  font-size: 13px;
  color: var(--text-muted);
  padding: 4px 10px;
  background: rgba(74, 55, 40, 0.06);
  border-radius: 12px;
}

.shop-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
  padding-bottom: 14px;
  border-bottom: 1px dashed rgba(74, 55, 40, 0.1);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-icon {
  font-size: 15px;
}

.meta-text {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.shop-description {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-top: 12px;
}

@media screen and (max-width: 768px) {
  .shop-image-wrapper {
    height: 160px;
  }

  .shop-name {
    font-size: 16px;
  }

  .shop-meta {
    gap: 12px;
  }

  .badge {
    padding: 3px 8px;
    font-size: 11px;
  }
}
</style>
