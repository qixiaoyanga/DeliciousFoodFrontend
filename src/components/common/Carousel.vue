<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import type { CarouselItem } from '@/types'

const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:8080/delicious'

interface Props {
  items: CarouselItem[]
  interval?: number
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  interval: 5000,
  height: '400px'
})

const getImageUrl = (imagePath: string): string => {
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  return `${SERVER_BASE_URL}/${imagePath.replace(/^\//, '')}`
}

const emit = defineEmits<{
  (e: 'change', index: number): void
}>()

const currentIndex = ref(0)
const isHovering = ref(false)
let timer: number | null = null

const nextSlide = () => {
  if (currentIndex.value < props.items.length - 1) {
    currentIndex.value++
  } else {
    currentIndex.value = 0
  }
  emit('change', currentIndex.value)
}

const prevSlide = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  } else {
    currentIndex.value = props.items.length - 1
  }
  emit('change', currentIndex.value)
}

const goToSlide = (index: number) => {
  currentIndex.value = index
  emit('change', currentIndex.value)
}

const startAutoPlay = () => {
  if (timer) clearInterval(timer)
  timer = window.setInterval(() => {
    if (!isHovering.value) {
      nextSlide()
    }
  }, props.interval)
}

const stopAutoPlay = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

onMounted(() => {
  startAutoPlay()
})

onUnmounted(() => {
  stopAutoPlay()
})
</script>

<template>
  <div
    class="carousel"
    :style="{ height }"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
  >
    <div class="carousel-track">
      <div
        v-for="(item, index) in items"
        :key="item.id"
        class="carousel-slide"
        :class="{ active: index === currentIndex }"
      >
        <img :src="getImageUrl(item.image)" :alt="item.title" class="carousel-image" />
        <div class="carousel-overlay">
          <div class="carousel-content">
            <h2 class="carousel-title">{{ item.title }}</h2>
            <p class="carousel-subtitle">{{ item.subtitle }}</p>
          </div>
        </div>
      </div>
    </div>

    <button class="carousel-btn prev" @click="prevSlide">
      <span class="btn-icon">❮</span>
    </button>

    <button class="carousel-btn next" @click="nextSlide">
      <span class="btn-icon">❯</span>
    </button>

    <div class="carousel-indicators">
      <button
        v-for="(_, index) in items"
        :key="index"
        class="indicator"
        :class="{ active: index === currentIndex }"
        @click="goToSlide(index)"
      />
    </div>
  </div>
</template>

<style scoped>
.carousel {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: var(--radius-lg);
}

.carousel-track {
  width: 100%;
  height: 100%;
  position: relative;
}

.carousel-slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity var(--transition-slow);
  pointer-events: none;
}

.carousel-slide.active {
  opacity: 1;
  pointer-events: auto;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(74, 55, 40, 0.8) 0%,
    rgba(74, 55, 40, 0.4) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-content {
  text-align: center;
  color: white;
  padding: 20px;
}

.carousel-title {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 16px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.carousel-subtitle {
  font-size: 20px;
  opacity: 0.95;
  font-weight: 500;
}

.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-md);
  z-index: 10;
}

.carousel-btn:hover {
  background: white;
  transform: translateY(-50%) scale(1.1);
  box-shadow: var(--shadow-lg);
}

.carousel-btn:active {
  transform: translateY(-50%) scale(0.95);
}

.carousel-btn.prev {
  left: 24px;
}

.carousel-btn.next {
  right: 24px;
}

.btn-icon {
  font-size: 20px;
  color: var(--text-primary);
  font-weight: bold;
}

.carousel-indicators {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  z-index: 10;
}

.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transition: all var(--transition-fast);
  border: 2px solid transparent;
}

.indicator:hover {
  background: rgba(255, 255, 255, 0.8);
}

.indicator.active {
  background: var(--primary-color);
  border-color: white;
  transform: scale(1.2);
}

@media screen and (max-width: 768px) {
  .carousel-title {
    font-size: 28px;
  }

  .carousel-subtitle {
    font-size: 16px;
  }

  .carousel-btn {
    width: 40px;
    height: 40px;
  }

  .carousel-btn.prev {
    left: 12px;
  }

  .carousel-btn.next {
    right: 12px;
  }
}
</style>
