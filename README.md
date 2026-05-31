# 美味外卖平台 - 前端项目

> 基于 Vue 3 + TypeScript + Vite 的现代化外卖订餐平台

## 项目简介

美味外卖平台是一个功能完善、界面精美的外卖订餐Web应用前端项目，采用 Vue 3 框架和 TypeScript 开发，实现了完整的用户界面和交互体验。

## 技术栈

- **前端框架**：Vue 3.5+ (Composition API)
- **路由管理**：Vue Router 4.x
- **状态管理**：Pinia
- **构建工具**：Vite 8.x
- **开发语言**：TypeScript 5.x
- **样式方案**：CSS3 + CSS Variables

## 项目结构

```
DeliciousFood/
├── src/
│   ├── assets/                 # 静态资源
│   │   ├── main.css           # 全局样式
│   │   └── variables.css      # CSS变量
│   │
│   ├── components/            # Vue组件
│   │   ├── common/            # 公共组件
│   │   ├── shop/              # 店铺组件
│   │   └── dish/              # 菜品组件
│   │
│   ├── views/                 # 页面视图
│   ├── router/                # 路由配置
│   ├── data/                  # 模拟数据
│   ├── types/                 # TypeScript类型
│   │
│   ├── App.vue               # 根组件
│   └── main.ts               # 应用入口
│
├── .trae/documents/          # 设计文档
└── package.json
```

## 功能特性

### ✅ 已实现功能

1. **二级路由架构**
   - 公共组件（导航栏、页脚）独立抽离
   - 路由meta配置控制组件显示/隐藏
   - 登录页无导航条和页脚

2. **登录页面**
   - 简洁美观的登录表单
   - 手机号和密码验证
   - 加载状态动画
   - 演示账号提示

3. **首页功能**
   - **轮播图组件**
     - 自动轮播（5秒间隔）
     - 手动切换（箭头、指示器）
     - 悬停暂停功能
     - 淡入淡出动画
   - **分类导航**
     - 8个美食分类
     - 横向滚动展示
     - 点击筛选功能
   - **店铺卡片**
     - 评分星级展示
     - 配送信息
     - 悬停上浮效果
   - **推荐菜品**
     - 横向滚动展示
     - 价格和销量信息

4. **店铺详情页**
   - 店铺封面和描述
   - 配送信息栏
   - 热门菜品列表

5. **订单页面**
   - 订单状态标签筛选
   - 订单卡片展示
   - 操作按钮

6. **视觉设计**
   - **暖色调配色**：橙色(#FF6B35) + 暖黄色(#FFD93D)
   - **圆角设计**：卡片、按钮采用圆角
   - **阴影层次**：多级阴影效果
   - **响应式布局**：适配移动端、平板、桌面端

7. **交互动效**
   - 导航高亮当前页面
   - 卡片悬停效果
   - 按钮点击反馈
   - 页面加载骨架屏
   - 平滑过渡动画

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问地址：http://localhost:5173/

### 构建生产版本

```bash
npm run build
```

### 类型检查

```bash
npm run type-check
```

### 代码格式化

```bash
npm run format
```

## 路由配置

| 路径 | 页面 | 说明 |
|------|------|------|
| `/login` | 登录页 | 无导航栏和页脚 |
| `/` | 首页 | 包含轮播图、分类、店铺列表 |
| `/shop/:id` | 店铺详情 | 店铺信息和菜品 |
| `/order` | 订单页 | 用户订单列表 |

## 核心组件

### 公共组件

- **NavBar.vue**：顶部导航栏，支持当前页面高亮
- **Footer.vue**：底部版权信息
- **Carousel.vue**：轮播图，支持自动播放和手动切换
- **Loading.vue**：加载状态指示器

### 业务组件

- **ShopCard.vue**：店铺卡片，展示店铺信息
- **ShopList.vue**：店铺列表，支持加载状态
- **CategoryNav.vue**：分类导航，支持筛选
- **DishCard.vue**：菜品卡片，展示菜品信息
- **DishRecommend.vue**：推荐菜品横向列表

## 组件使用示例

### 轮播图组件

```vue
<template>
  <Carousel 
    :items="carouselData" 
    :interval="5000"
    height="400px"
    @change="handleCarouselChange"
  />
</template>

<script setup lang="ts">
import Carousel from '@/components/common/Carousel.vue'
import { carouselData } from '@/data/mockData'

const handleCarouselChange = (index: number) => {
  console.log('当前轮播索引:', index)
}
</script>
```

### 店铺卡片

```vue
<template>
  <ShopCard :shop="shopData" @click="goToShop" />
</template>

<script setup lang="ts">
import ShopCard from '@/components/shop/ShopCard.vue'
import { shopData } from '@/data/mockData'

const goToShop = (id: number) => {
  console.log('跳转店铺:', id)
}
</script>
```

## 数据模型

### 店铺数据

```typescript
interface Shop {
  id: number
  name: string
  rating: number
  sales: number
  minimumOrder: number
  deliveryFee: number
  deliveryTime: string
  image: string
  categories: string[]
  description?: string
}
```

### 菜品数据

```typescript
interface Dish {
  id: number
  name: string
  price: number
  originalPrice?: number
  image: string
  sales: number
  rating: number
  shopId: number
}
```

## 演示账号

- **手机号**：13800138000
- **密码**：123456

## 设计规范

### 配色方案

- **主色调**：橙色 (#FF6B35)
- **辅助色**：暖黄色 (#FFD93D)
- **背景色**：米白色 (#FFF8F0)
- **文字色**：深棕色 (#4A3728)

### 响应式断点

- **桌面端**：≥ 1200px
- **平板端**：768px - 1199px
- **移动端**：< 768px

## 项目文档

- 📄 [产品需求文档](./.trae/documents/PRD-美味外卖平台.md)
- 📄 [技术架构文档](./.trae/documents/技术架构-美味外卖平台.md)
- 📄 [组件结构文档](./组件结构文档.md)

## 开发说明

### 代码规范

- 使用 TypeScript 提供类型安全
- 采用 Composition API (script setup)
- 组件文件采用 PascalCase 命名
- CSS 使用 BEM 命名规范
- 遵循 ESLint 和 Prettier 配置

### 样式系统

项目使用 CSS 变量管理样式，确保一致性和可维护性：

```css
:root {
  --primary-color: #FF6B35;
  --primary-light: #FF8C42;
  --primary-dark: #E85A2C;
  
  --secondary-color: #FFD93D;
  
  --text-primary: #4A3728;
  --text-secondary: #8B7355;
  
  --bg-primary: #FFF8F0;
  --bg-secondary: #FFFFFF;
  
  --shadow-sm: 0 2px 4px rgba(74, 55, 40, 0.08);
  --shadow-md: 0 4px 12px rgba(74, 55, 40, 0.12);
  --shadow-lg: 0 8px 24px rgba(74, 55, 40, 0.16);
  
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  
  --transition-fast: 200ms ease-out;
  --transition-normal: 300ms ease-out;
  --transition-slow: 500ms ease-out;
}
```

## 浏览器兼容

- Chrome ≥ 90
- Firefox ≥ 88
- Safari ≥ 14
- Edge ≥ 90

## 性能优化

- 使用 Vite 快速构建
- 组件懒加载（路由级）
- 图片懒加载
- CSS 变量减少样式重复
- 合理的重绘和回流控制

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系我们：

- 客服热线：400-888-8888
- 邮箱：support@deliciousfood.com

---

**美味外卖平台** - 用心做美食，诚意送万家 🍽️
