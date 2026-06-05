<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Category } from '@/types'

const iconMap: Record<string, string> = {
  '川菜': '🌶️',
  '粤菜': '🦐',
  '湘菜': '🔥',
  '火锅': '🍲',
  '烧烤': '🍖',
  '奶茶': '🧋',
  '炸鸡汉堡': '🍔',
  '面食': '🍜',
  '日韩料理': '🍣',
  '甜品': '🍰',
  '全部': '🍽️',
  '快餐': '🍱',
  '中餐': '🥢',
  '西餐': '🍝',
  '日料': '🍣',
  '饮品': '🥤',
  '海鲜': '🦞',
  '牛排': '🥩',
  '披萨': '🍕',
  '寿司': '🍣',
  '拉面': '🍜',
  '包子': '🥟',
  '饺子': '🥟',
  '炒饭': '🍳',
  '麻辣烫': '🍲',
  '冒菜': '🍲',
  '干锅': '🍳',
  '拌饭': '🍚',
  '粥': '🥣',
  '汤': '🥣',
  '沙拉': '🥗',
  '三明治': '🥪',
  '薯条': '🍟',
  '鸡翅': '🍗',
  '意面': '🍝',
  '咖啡': '☕',
  '冰淇淋': '🍦',
  '蛋糕': '🎂',
  '面包': '🍞',
  '饭团': '🍙',
  '刺身': '🍣',
  '寿喜烧': '🍲',
  '咖喱': '🍛',
  '烤肉': '🥩',
  '冷面': '🍜',
  '石锅拌饭': '🍚',
  '部队火锅': '🍲',
  '炸鸡': '🍗',
  '汉堡': '🍔',
  '热狗': '🌭',
  '可乐': '🥤',
  '果汁': '🧃',
  '茶': '🍵',
  '酒': '🍺',
  '水果': '🍉',
  '蔬菜': '🥦',
  '零食': '🍿',
  '坚果': '🥜',
  '巧克力': '🍫',
  '糖果': '🍬'
}

const colorMap: Record<string, string | undefined> = {
  '川菜': '#ff6b35',
  '粤菜': '#00b4d8',
  '湘菜': '#d62828',
  '火锅': '#e63946',
  '烧烤': '#bc6c25',
  '奶茶': '#cdb4db',
  '炸鸡汉堡': '#f77f00',
  '面食': '#2a9d8f',
  '日韩料理': '#e9c46a',
  '甜品': '#ffcad4',
  '全部': '#457b9d'
}

const getCategoryIcon = (name: string): string => {
  return iconMap[name] || ''
}

const getCategoryColor = (name: string): string => {
  const color = colorMap[name]
  if (color) {
    return color
  }
  const colors: string[] = [
    '#ff6b35', '#00b4d8', '#d62828', '#e63946', '#bc6c25',
    '#cdb4db', '#f77f00', '#2a9d8f', '#e9c46a', '#ffcad4',
    '#457b9d', '#9b59b6', '#1abc9c', '#e74c3c', '#3498db',
    '#f39c12', '#95a5a6', '#34495e', '#27ae60', '#c0392b'
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length
  return colors[index] ?? '#457b9d'
}

const getFirstChar = (name: string): string => {
  return name.charAt(0).toUpperCase()
}

interface Props {
  categories: Category[]
  selectedId?: number
}

const props = withDefaults(defineProps<Props>(), {
  selectedId: 0
})

const emit = defineEmits<{
  (e: 'select', category: Category): void
}>()

const selectedCategory = ref(props.selectedId)
const scrollContainer = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const startX = ref(0)
const scrollLeft = ref(0)

const handleSelect = (category: Category) => {
  if (isDragging.value) return
  selectedCategory.value = category.id
  emit('select', category)
}

const onMouseDown = (e: MouseEvent) => {
  if (!scrollContainer.value) return
  isDragging.value = true
  startX.value = e.pageX - scrollContainer.value.offsetLeft
  scrollLeft.value = scrollContainer.value.scrollLeft
  scrollContainer.value.style.cursor = 'grabbing'
}

const onMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !scrollContainer.value) return
  e.preventDefault()
  const x = e.pageX - scrollContainer.value.offsetLeft
  const walk = (x - startX.value) * 1.5
  scrollContainer.value.scrollLeft = scrollLeft.value - walk
}

const onMouseUp = () => {
  isDragging.value = false
  if (scrollContainer.value) {
    scrollContainer.value.style.cursor = 'grab'
  }
}

const onMouseLeave = () => {
  onMouseUp()
}
</script>

<template>
  <div class="category-nav">
    <div class="category-header">
      <h3 class="category-title">
        <span class="title-icon">📋</span>
        美食分类
      </h3>
      <span class="category-hint">
        <span class="hint-icon">👆</span>
        可拖动浏览
      </span>
    </div>
    <div
      ref="scrollContainer"
      class="category-scroll"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseLeave"
    >
      <button
        v-for="category in categories"
        :key="category.id"
        class="category-item"
        :class="{ active: selectedCategory === category.id }"
        @click="handleSelect(category)"
      >
        <span v-if="getCategoryIcon(category.name)" class="category-icon">
          {{ getCategoryIcon(category.name) }}
        </span>
        <span v-else class="category-badge" :style="{ background: getCategoryColor(category.name) }">
          {{ getFirstChar(category.name) }}
        </span>
        <span class="category-name">{{ category.name }}</span>
        <span class="category-dot"></span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.category-nav {
  width: 100%;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px dashed rgba(74, 55, 40, 0.1);
}

.category-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.title-icon {
  font-size: 22px;
}

.category-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
  background: rgba(74, 55, 40, 0.06);
  padding: 4px 12px;
  border-radius: 12px;
}

.hint-icon {
  font-size: 14px;
  animation: bounce 1.5s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

.category-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 4px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  cursor: grab;
  user-select: none;
  scroll-behavior: smooth;
}

.category-scroll::-webkit-scrollbar {
  display: none;
}

.category-scroll:active {
  cursor: grabbing;
}

.category-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: 2px solid transparent;
  min-width: 100px;
  flex-shrink: 0;
  overflow: hidden;
}

.category-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.08) 0%, rgba(255, 217, 61, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.category-item:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 24px rgba(255, 107, 53, 0.15);
}

.category-item:hover::before {
  opacity: 1;
}

.category-item:hover .category-icon {
  transform: scale(1.15) rotate(-5deg);
}

.category-item:active {
  transform: translateY(-3px);
}

.category-item.active {
  border-color: var(--primary-color);
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 107, 53, 0.05) 100%);
}

.category-item.active::before {
  opacity: 1;
}

.category-item.active .category-icon {
  transform: scale(1.2);
}

.category-item.active .category-dot {
  width: 20px;
  background: var(--primary-color);
}

.category-icon {
  font-size: 36px;
  line-height: 1;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.category-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: white;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.category-item:hover .category-badge {
  transform: scale(1.15);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.category-item.active .category-badge {
  transform: scale(1.2);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
}

.category-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  position: relative;
  z-index: 1;
  transition: color 0.3s ease;
}

.category-item.active .category-name {
  color: var(--primary-color);
}

.category-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

@media screen and (max-width: 768px) {
  .category-nav {
    padding: 16px;
  }

  .category-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .category-item {
    min-width: 90px;
    padding: 14px 18px;
  }

  .category-icon {
    font-size: 32px;
  }

  .category-name {
    font-size: 13px;
  }
}
</style>
