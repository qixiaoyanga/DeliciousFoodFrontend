import type { Shop, Dish, Category, CarouselItem } from '@/types'

export const carouselData: CarouselItem[] = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&h=400&fit=crop',
    title: '新用户首单立减',
    subtitle: '满30减10，满50减20',
    link: '/shop/1'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=400&fit=crop',
    title: '今日特惠',
    subtitle: '精选套餐5折起',
    link: '/shop/2'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200&h=400&fit=crop',
    title: '准时必达',
    subtitle: '30分钟送达，迟到必赔',
    link: '/shop/3'
  }
]

export const categoryData: Category[] = [
  { id: 1, name: '全部', icon: '🍽️', count: 156 },
  { id: 2, name: '快餐', icon: '🍔', count: 45 },
  { id: 3, name: '中餐', icon: '🥢', count: 38 },
  { id: 4, name: '西餐', icon: '🍝', count: 22 },
  { id: 5, name: '日料', icon: '🍣', count: 18 },
  { id: 6, name: '甜点', icon: '🍰', count: 15 },
  { id: 7, name: '饮品', icon: '🧋', count: 12 },
  { id: 8, name: '烧烤', icon: '🍖', count: 6 }
]

export const shopData: Shop[] = [
  {
    id: 1,
    name: '老北京炸酱面馆',
    rating: 4.8,
    sales: 8560,
    minimumOrder: 15,
    deliveryFee: 2,
    deliveryTime: '25分钟',
    image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&h=300&fit=crop',
    categories: ['中餐', '面食'],
    description: '正宗老北京风味，百年传承'
  },
  {
    id: 2,
    name: '麦乐汉堡',
    rating: 4.6,
    sales: 12300,
    minimumOrder: 20,
    deliveryFee: 0,
    deliveryTime: '20分钟',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
    categories: ['快餐', '汉堡'],
    description: '现做汉堡，新鲜美味'
  },
  {
    id: 3,
    name: '湘味小厨',
    rating: 4.7,
    sales: 6890,
    minimumOrder: 25,
    deliveryFee: 3,
    deliveryTime: '30分钟',
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=300&fit=crop',
    categories: ['中餐', '川菜'],
    description: '正宗湘菜，辣而不燥'
  },
  {
    id: 4,
    name: '意式披萨坊',
    rating: 4.5,
    sales: 5420,
    minimumOrder: 30,
    deliveryFee: 0,
    deliveryTime: '35分钟',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop',
    categories: ['西餐', '披萨'],
    description: '手工披萨，意大利进口原料'
  },
  {
    id: 5,
    name: '寿司小屋',
    rating: 4.9,
    sales: 4230,
    minimumOrder: 50,
    deliveryFee: 5,
    deliveryTime: '40分钟',
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
    categories: ['日料', '寿司'],
    description: '新鲜食材，匠心制作'
  },
  {
    id: 6,
    name: '甜蜜时光',
    rating: 4.7,
    sales: 3650,
    minimumOrder: 15,
    deliveryFee: 0,
    deliveryTime: '25分钟',
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop',
    categories: ['甜点', '蛋糕'],
    description: '手工蛋糕，甜蜜每一天'
  }
]

export const dishData: Dish[] = [
  {
    id: 1,
    name: '招牌炸酱面',
    price: 18,
    originalPrice: 22,
    image: 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=300&h=300&fit=crop',
    sales: 3250,
    rating: 4.8,
    shopId: 1,
    description: '老北京传统炸酱面'
  },
  {
    id: 2,
    name: '牛肉汉堡套餐',
    price: 28,
    originalPrice: 35,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop',
    sales: 4580,
    rating: 4.6,
    shopId: 2,
    description: '双层牛肉汉堡配薯条可乐'
  },
  {
    id: 3,
    name: '剁椒鱼头',
    price: 68,
    originalPrice: 88,
    image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=300&h=300&fit=crop',
    sales: 1890,
    rating: 4.9,
    shopId: 3,
    description: '正宗湘菜经典'
  },
  {
    id: 4,
    name: '玛格丽特披萨',
    price: 38,
    originalPrice: 48,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&h=300&fit=crop',
    sales: 2340,
    rating: 4.7,
    shopId: 4,
    description: '经典意式披萨'
  },
  {
    id: 5,
    name: '三文鱼刺身',
    price: 88,
    originalPrice: 108,
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=300&h=300&fit=crop',
    sales: 1560,
    rating: 4.9,
    shopId: 5,
    description: '新鲜三文鱼，现切现做'
  },
  {
    id: 6,
    name: '草莓奶油蛋糕',
    price: 58,
    originalPrice: 78,
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop',
    sales: 2890,
    rating: 4.8,
    shopId: 6,
    description: '新鲜草莓，动物奶油'
  },
  {
    id: 7,
    name: '宫保鸡丁',
    price: 32,
    originalPrice: 38,
    image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=300&h=300&fit=crop',
    sales: 4120,
    rating: 4.7,
    shopId: 3,
    description: '川菜经典，开胃下饭'
  },
  {
    id: 8,
    name: '芝士热狗',
    price: 12,
    image: 'https://images.unsplash.com/photo-1619740455993-9e612b50c9a6?w=300&h=300&fit=crop',
    sales: 5680,
    rating: 4.5,
    shopId: 2,
    description: '拉丝芝士，口感丰富'
  }
]
