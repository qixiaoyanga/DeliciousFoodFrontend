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
  { id: 1, name: '川菜', icon: '�️', count: 0 },
  { id: 2, name: '粤菜', icon: '🦐', count: 0 },
  { id: 3, name: '湘菜', icon: '🔥', count: 0 },
  { id: 4, name: '火锅', icon: '�', count: 0 },
  { id: 5, name: '烧烤', icon: '�', count: 0 },
  { id: 6, name: '奶茶', icon: '🧋', count: 0 },
  { id: 7, name: '炸鸡汉堡', icon: '🍔', count: 0 },
  { id: 8, name: '面食', icon: '🍜', count: 0 },
  { id: 9, name: '日韩料理', icon: '🍣', count: 0 },
  { id: 10, name: '甜品', icon: '�', count: 0 }
]

export const shopData: Shop[] = [
  {
    id: 5,
    name: '湘味人家',
    logo: '/shop/shop_logo/logo5.jpg',
    description: '地道湖南菜，香辣过瘾',
    grade: 4.4,
    monthlySales: 1600,
    delivery: 5.50,
    minOrderAmount: 22.00,
    businessHours: '09:30-21:30'
  },
  {
    id: 4,
    name: '沪上生煎',
    logo: '/shop/shop_logo/logo4.jpg',
    description: '上海特色生煎包',
    grade: 4.3,
    monthlySales: 3000,
    delivery: 3.50,
    minOrderAmount: 15.00,
    businessHours: '06:30-20:00'
  },
  {
    id: 3,
    name: '京味涮肉',
    logo: '/shop/shop_logo/logo3.jpg',
    description: '老北京铜锅涮肉',
    grade: 4.6,
    monthlySales: 2100,
    delivery: 4.00,
    minOrderAmount: 30.00,
    businessHours: '11:00-23:00'
  },
  {
    id: 2,
    name: '粤来香',
    logo: '/shop/shop_logo/logo2.jpg',
    description: '精致粤菜，健康之选',
    grade: 4.8,
    monthlySales: 800,
    delivery: 6.00,
    minOrderAmount: 25.00,
    businessHours: '10:00-21:00'
  },
  {
    id: 1,
    name: '川味小厨',
    logo: '/shop/shop_logo/logo1.jpg',
    description: '正宗川菜，麻辣鲜香',
    grade: 4.5,
    monthlySales: 1200,
    delivery: 5.00,
    minOrderAmount: 20.00,
    businessHours: '09:00-22:00'
  }
]

export const dishData: Dish[] = [
  {
    id: 12,
    shopId: 4,
    categoryId: 1,
    name: '鲜肉生煎',
    image: '/shop/shop_dish/dish12.jpg',
    description: '底板金黄，汤汁饱满',
    price: 12.00,
    salesPrice: 12.00,
    boxPrice: 1.00,
    stock: 300,
    status: 0,
    sales: 4000,
    monthSales: 400,
    recommend: 1,
    createTime: '2026-06-01T16:00:00.000+00:00',
    updateTime: '2026-06-01T16:00:00.000+00:00'
  },
  {
    id: 13,
    shopId: 4,
    categoryId: 1,
    name: '虾仁生煎',
    image: '/shop/shop_dish/dish13.jpg',
    description: '整颗虾仁，鲜美弹牙',
    price: 18.00,
    salesPrice: 18.00,
    boxPrice: 1.00,
    stock: 200,
    status: 0,
    sales: 2500,
    monthSales: 250,
    recommend: 1,
    createTime: '2026-06-01T16:00:00.000+00:00',
    updateTime: '2026-06-01T16:00:00.000+00:00'
  },
  {
    id: 9,
    shopId: 3,
    categoryId: 1,
    name: '手切鲜羊肉',
    image: '/shop/shop_dish/dish9.jpg',
    description: '鲜嫩无膻，铜锅绝配',
    price: 68.00,
    salesPrice: 68.00,
    boxPrice: 2.00,
    stock: 200,
    status: 0,
    sales: 1800,
    monthSales: 180,
    recommend: 1,
    createTime: '2026-06-01T16:00:00.000+00:00',
    updateTime: '2026-06-01T16:00:00.000+00:00'
  },
  {
    id: 10,
    shopId: 3,
    categoryId: 1,
    name: '精品肥牛',
    image: '/shop/shop_dish/dish10.jpg',
    description: '雪花纹路，入口即化',
    price: 78.00,
    salesPrice: 78.00,
    boxPrice: 2.00,
    stock: 150,
    status: 0,
    sales: 1600,
    monthSales: 160,
    recommend: 1,
    createTime: '2026-06-01T16:00:00.000+00:00',
    updateTime: '2026-06-01T16:00:00.000+00:00'
  },
  {
    id: 15,
    shopId: 5,
    categoryId: 1,
    name: '辣椒炒肉',
    image: '/shop/shop_dish/dish15.jpg',
    description: '湖南招牌，香辣下饭',
    price: 38.00,
    salesPrice: 38.00,
    boxPrice: 1.00,
    stock: 100,
    status: 0,
    sales: 1100,
    monthSales: 110,
    recommend: 1,
    createTime: '2026-06-01T16:00:00.000+00:00',
    updateTime: '2026-06-01T16:00:00.000+00:00'
  },
  {
    id: 6,
    shopId: 2,
    categoryId: 1,
    name: '虾饺皇',
    image: '/shop/shop_dish/dish6.jpg',
    description: '皮薄馅大，整只鲜虾',
    price: 32.00,
    salesPrice: 30.00,
    boxPrice: 1.00,
    stock: 120,
    status: 0,
    sales: 900,
    monthSales: 90,
    recommend: 1,
    createTime: '2026-06-01T16:00:00.000+00:00',
    updateTime: '2026-06-01T16:00:00.000+00:00'
  }
]
