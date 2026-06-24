<script setup lang="ts">import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { http } from '@/utils/request';
import { MERCHANT_API } from '@/api/paths';
import { tokenManager } from '@/utils/token';
import { toast } from '@/utils/toast';
import { merchantShopApi, merchantDishApi, merchantCategoryApi } from '@/api/merchant';
import type { Shop, Dish, DishCategory, DishSpec, DishAttribute, AttributeOption } from '@/types';
const router = useRouter();
const activeTab = ref('orders');
const isLoading = ref(false);
const currentUser = ref(tokenManager.getUser() || { uid: '', username: '', phone: '', email: '' });
const merchantInfo = ref<{
 name: string;
 phone: string;
 email: string;
 shopName: string;
 shopImage: string;
 totalOrders: number;
 pendingOrders: number;
 completedOrders: number;
 todayOrders: number;
 todayRevenue: number;
}>({
 name: '',
 phone: '',
 email: '',
 shopName: '',
 shopImage: '',
 totalOrders: 0,
 pendingOrders: 0,
 completedOrders: 0,
 todayOrders: 0,
 todayRevenue: 0
});
const orders = ref<any[]>([]);
const showRejectModal = ref(false);
const rejectOrderNo = ref<string | number>('');
const rejectReason = ref('');
const shopInfo = ref<Shop>({
 id: 0,
 name: '',
 logo: '',
 description: '',
 delivery: 0,
 minOrderAmount: 0,
 status: 1,
 grade: 0,
 monthlySales: 0
});
const dishes = ref<Dish[]>([]);
const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:8080/delicious';
const getLogoUrl = (logo: string | undefined): string => {
 if (!logo)
 return 'https://via.placeholder.com/100';
 if (logo.startsWith('http://') || logo.startsWith('https://')) {
 return logo;
 }
 const baseUrl = SERVER_BASE_URL.replace(/\/$/, '');
 const logoPath = logo.startsWith('/') ? logo.slice(1) : logo;
 return `${baseUrl}/${logoPath}`;
};
const loadMerchantInfo = async () => {
 isLoading.value = true;
 try {
 const result = await http.get<any>(MERCHANT_API.MERCHANT_INFO);
 merchantInfo.value = result;
 }
 catch (error) {
 console.error('加载商家信息失败:', error);
 }
 finally {
 isLoading.value = false;
 }
};
const loadOrders = async () => {
 isLoading.value = true;
 try {
 const result = await http.get<any>(MERCHANT_API.ORDER_MANAGE_LIST);
 orders.value = result.orders || [];
 }
 catch (error) {
 console.error('加载订单列表失败:', error);
 orders.value = [];
 }
 finally {
 isLoading.value = false;
 }
};
const loadShopInfo = async () => {
 isLoading.value = true;
 try {
 const result = await http.get<any>(MERCHANT_API.SHOP_MANAGE_INFO);
 shopInfo.value = result.shop || result;
 }
 catch (error) {
 console.error('加载店铺信息失败:', error);
 }
 finally {
 isLoading.value = false;
 }
};
const loadDishes = async () => {
 isLoading.value = true;
 try {
 const result = await http.get<any>(MERCHANT_API.DISH_MANAGE_LIST);
 dishes.value = result.dishes || [];
 }
 catch (error) {
 console.error('加载菜品列表失败:', error);
 dishes.value = [];
 }
 finally {
 isLoading.value = false;
 }
};
const loadCategories = async () => {
 try {
 const result = await merchantCategoryApi.getList();
 categoryList.value = result || [];
 }
 catch (error) {
 console.error('加载分类列表失败:', error);
 categoryList.value = [];
 }
};
const handleTabChange = (tab: string) => {
 activeTab.value = tab;
 if (tab === 'orders') {
 loadOrders();
 }
 else if (tab === 'shop') {
 loadShopInfo();
 }
 else if (tab === 'dishes') {
 loadShopInfo();
 loadCategories();
 loadDishes();
 }
};
const acceptOrder = async (orderNo: string | number) => {
 try {
 const result = await http.post<number>(MERCHANT_API.ORDER_MANAGE_ACCEPT(orderNo));
 toast.success('接单成功');
 const orderIndex = orders.value.findIndex(o => o.orderNo === orderNo);
 if (orderIndex !== -1 && typeof result === 'number') {
 orders.value[orderIndex].pickupCode = result;
 }
 }
 catch (error: any) {
 toast.error(error.message || '接单失败');
 }
};
const openRejectModal = (orderNo: string | number) => {
 rejectOrderNo.value = orderNo;
 rejectReason.value = '';
 showRejectModal.value = true;
};
const closeRejectModal = () => {
 showRejectModal.value = false;
 rejectOrderNo.value = '';
 rejectReason.value = '';
};
const confirmRejectOrder = async () => {
 if (!rejectReason.value.trim()) {
 toast.error('请填写拒单原因');
 return;
 }
 try {
 await http.post(MERCHANT_API.ORDER_MANAGE_REJECT(rejectOrderNo.value), {
 reason: rejectReason.value.trim()
 });
 toast.success('已拒单');
 closeRejectModal();
 loadOrders();
 }
 catch (error: any) {
 toast.error(error.message || '拒单失败');
 }
};
const completeOrder = async (orderNo: string | number) => {
 try {
 await http.post(MERCHANT_API.ORDER_MANAGE_COMPLETE(orderNo));
 toast.success('已完成');
 loadOrders();
 }
 catch (error: any) {
 toast.error(error.message || '操作失败');
 }
};
const getOrderStatusText = (status: number) => {
 const statusMap: Record<number, string> = {
 1: '待付款',
 2: '已付款',
 3: '备货中',
 4: '配送中',
 5: '已送达',
 6: '已取消',
 7: '退款中',
 8: '已完成'
 };
 return statusMap[status] || '未知';
};
const getOrderStatusClass = (status: number) => {
 const classMap: Record<number, string> = {
 1: 'status-pending',
 2: 'status-paid',
 3: 'status-preparing',
 4: 'status-delivering',
 5: 'status-completed',
 6: 'status-canceled',
 7: 'status-refunding',
 8: 'status-completed'
 };
 return classMap[status] || 'status-unknown';
};
const getAuditStatusText = (status: number) => {
 const map: Record<number, string> = {
 0: '未提交',
 1: '审核中',
 2: '通过',
 3: '驳回'
 };
 return map[status] || '未知';
};
const getAuditStatusClass = (status: number) => {
 const map: Record<number, string> = {
 0: 'audit-not-submitted',
 1: 'audit-pending',
 2: 'audit-approved',
 3: 'audit-rejected'
 };
 return map[status] || 'audit-not-submitted';
};
const logout = () => {
 tokenManager.clearTokens();
 router.push('/merchant/login');
};
const uploadImage = async (event: Event, field: 'logo' | 'businessLicense' | 'foodLicense') => {
 const target = event.target as HTMLInputElement;
 const file = target.files?.[0];
 if (!file) return;
 const formData = new FormData();
 formData.append('file', file);
 const uploadFn = {
 logo: merchantShopApi.uploadLogo,
 businessLicense: merchantShopApi.uploadBusinessLicense,
 foodLicense: merchantShopApi.uploadFoodLicense
 }[field];
 if (!uploadFn) return;
 try {
 const result = await uploadFn(formData);
 if (result) {
 shopInfo.value[field] = result;
 toast.success('图片上传成功');
 }
 } catch (error: any) {
 toast.error(error.message || '图片上传失败');
 }
};
const saveShopInfo = async () => {
 try {
 const { logo, businessLicense, foodLicense, ...data } = shopInfo.value;
 await merchantShopApi.update(data);
 toast.success('店铺信息更新成功');
 } catch (error: any) {
 toast.error(error.message || '更新失败');
 }
};
const submitForAudit = async () => {
 try {
 const { logo, businessLicense, foodLicense, ...data } = { ...shopInfo.value, auditStatus: 1 };
 await merchantShopApi.update(data);
 shopInfo.value.auditStatus = 1;
 toast.success('店铺信息已提交审核');
 } catch (error: any) {
 toast.error(error.message || '提交失败');
 }
};
const showAddDishModal = ref(false);
const showEditDishModal = ref(false);
const currentEditDish = ref<Dish | null>(null);
const categoryList = ref<DishCategory[]>([]);
const newDish = ref<Dish>({
 id: 0,
 shopId: 0,
 categoryId: 0,
 name: '',
 image: '',
 description: '',
 price: 0,
 salesPrice: 0,
 boxPrice: 0,
 stock: 0,
 status: 0,
 sales: 0,
 monthSales: 0,
 recommend: 0,
 createTime: '',
 updateTime: '',
 specs: [],
 attributes: []
});
const openAddDishModal = () => {
 newDish.value = {
 id: 0,
 shopId: shopInfo.value.id,
 categoryId: 0,
 name: '',
 image: '',
 description: '',
 price: 0,
 salesPrice: 0,
 boxPrice: 0,
 stock: 0,
 status: 0,
 sales: 0,
 monthSales: 0,
 recommend: 0,
 createTime: '',
 updateTime: '',
 specs: [],
 attributes: []
 };
 showAddDishModal.value = true;
};
const closeAddDishModal = () => {
 showAddDishModal.value = false;
};
const openEditDishModal = (dish: Dish) => {
 currentEditDish.value = {
 ...dish,
 specs: dish.specs ? [...dish.specs] : [],
 attributes: dish.attributes ? dish.attributes.map(attr => ({ ...attr, options: [...attr.options] })) : []
 };
 showEditDishModal.value = true;
};
const uploadDishImage = async (event: Event, target: 'new' | 'edit') => {
 const fileInput = event.target as HTMLInputElement;
 const file = fileInput.files?.[0];
 if (!file) return;
 const formData = new FormData();
 formData.append('file', file);
 const dishId = target === 'new' ? 0 : (currentEditDish.value?.id || 0);
 formData.append('dishId', dishId.toString());
 try {
 const result = await merchantDishApi.uploadImage(formData);
 if (result) {
 if (target === 'new') {
 newDish.value.image = result;
 } else if (target === 'edit' && currentEditDish.value) {
 currentEditDish.value.image = result;
 }
 toast.success('图片上传成功');
 }
 } catch (error: any) {
 toast.error(error.message || '图片上传失败');
 }
};
const addSpec = (target: 'new' | 'edit') => {
 const newSpec: DishSpec = {
 id: 0,
 dishId: target === 'new' ? 0 : (currentEditDish.value?.id || 0),
 name: '',
 price: 0,
 stock: 0,
 status: 0,
 createTime: ''
 };
 if (target === 'new') {
 newDish.value.specs?.push(newSpec);
 } else if (target === 'edit' && currentEditDish.value) {
 currentEditDish.value.specs?.push(newSpec);
 }
};
const removeSpec = (target: 'new' | 'edit', index: number) => {
 if (target === 'new') {
 newDish.value.specs?.splice(index, 1);
 } else if (target === 'edit' && currentEditDish.value) {
 currentEditDish.value.specs?.splice(index, 1);
 }
};
const addAttribute = (target: 'new' | 'edit') => {
 const newAttr: DishAttribute = {
 id: 0,
 dishId: target === 'new' ? 0 : (currentEditDish.value?.id || 0),
 name: '',
 required: 0,
 maxSelect: 1,
 status: 0,
 createTime: '',
 options: []
 };
 if (target === 'new') {
 newDish.value.attributes?.push(newAttr);
 } else if (target === 'edit' && currentEditDish.value) {
 currentEditDish.value.attributes?.push(newAttr);
 }
};
const removeAttribute = (target: 'new' | 'edit', index: number) => {
 if (target === 'new') {
 newDish.value.attributes?.splice(index, 1);
 } else if (target === 'edit' && currentEditDish.value) {
 currentEditDish.value.attributes?.splice(index, 1);
 }
};
const addAttrOption = (target: 'new' | 'edit', attrIndex: number) => {
 const newOption: AttributeOption = {
 id: 0,
 attributeId: 0,
 name: '',
 priceModifier: 0,
 stock: -1,
 createTime: ''
 };
 if (target === 'new') {
 newDish.value.attributes?.[attrIndex]?.options.push(newOption);
 } else if (target === 'edit' && currentEditDish.value) {
 currentEditDish.value.attributes?.[attrIndex]?.options.push(newOption);
 }
};
const removeAttrOption = (target: 'new' | 'edit', attrIndex: number, optionIndex: number) => {
 if (target === 'new') {
 newDish.value.attributes?.[attrIndex]?.options.splice(optionIndex, 1);
 } else if (target === 'edit' && currentEditDish.value) {
 currentEditDish.value.attributes?.[attrIndex]?.options.splice(optionIndex, 1);
 }
};
const closeEditDishModal = () => {
 showEditDishModal.value = false;
 currentEditDish.value = null;
};
const submitAddDish = async () => {
 if (!newDish.value.name || !newDish.value.price) {
 toast.error('请填写菜品名称和价格');
 return;
 }
 try {
 await merchantDishApi.add(newDish.value);
 toast.success('菜品添加成功');
 closeAddDishModal();
 loadDishes();
 } catch (error: any) {
 toast.error(error.message || '添加失败');
 }
};
const submitEditDish = async () => {
 if (!currentEditDish.value || !currentEditDish.value.name || !currentEditDish.value.price) {
 toast.error('请填写菜品名称和价格');
 return;
 }
 try {
 await merchantDishApi.update(currentEditDish.value);
 toast.success('菜品更新成功');
 closeEditDishModal();
 loadDishes();
 } catch (error: any) {
 toast.error(error.message || '更新失败');
 }
};
const deleteDish = async (id: number) => {
 if (!confirm('确定要删除这个菜品吗？')) {
 return;
 }
 try {
 await merchantDishApi.delete(id);
 toast.success('菜品删除成功');
 loadDishes();
 } catch (error: any) {
 toast.error(error.message || '删除失败');
 }
};
const categories = computed(() => {
 const catMap = new Map<number, { category: DishCategory; dishes: Dish[] }>();
 dishes.value.forEach(dish => {
 const cat = dish.category;
 if (cat) {
 if (!catMap.has(cat.id)) {
 catMap.set(cat.id, { category: cat, dishes: [] });
 }
 catMap.get(cat.id)!.dishes.push(dish);
 } else {
 if (!catMap.has(0)) {
 catMap.set(0, { category: { id: 0, shopId: 0, name: '未分类', sort: 999, status: 0, createTime: '' }, dishes: [] });
 }
 catMap.get(0)!.dishes.push(dish);
 }
 });
 return Array.from(catMap.values()).sort((a, b) => a.category.sort - b.category.sort);
});
const showAddCategoryModal = ref(false);
const newCategoryName = ref('');
const openAddCategoryModal = () => {
 newCategoryName.value = '';
 showAddCategoryModal.value = true;
};
const closeAddCategoryModal = () => {
 showAddCategoryModal.value = false;
};
const submitAddCategory = async () => {
 if (!newCategoryName.value.trim()) {
 toast.error('请输入分类名称');
 return;
 }
 try {
 await merchantCategoryApi.add({ name: newCategoryName.value.trim(), shopId: shopInfo.value.id });
 toast.success('分类添加成功');
 closeAddCategoryModal();
 loadCategories();
 loadDishes();
 } catch (error: any) {
 toast.error(error.message || '添加失败');
 }
};
onMounted(() => {
 loadMerchantInfo();
 loadOrders();
});
</script>

<template>
  <div class="merchant-page">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-section">
          <div class="logo-icon">🏪</div>
          <div class="logo-text">
            <h2>商家管理</h2>
            <p>后台系统</p>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button
          class="nav-item"
          :class="{ active: activeTab === 'dashboard' }"
          @click="handleTabChange('dashboard')"
        >
          <span class="nav-icon">📊</span>
          <span class="nav-text">数据看板</span>
        </button>
        <button
          class="nav-item"
          :class="{ active: activeTab === 'orders' }"
          @click="handleTabChange('orders')"
        >
          <span class="nav-icon">📋</span>
          <span class="nav-text">订单管理</span>
          <span v-if="merchantInfo.pendingOrders > 0" class="nav-badge">
            {{ merchantInfo.pendingOrders }}
          </span>
        </button>
        <button
          class="nav-item"
          :class="{ active: activeTab === 'shop' }"
          @click="handleTabChange('shop')"
        >
          <span class="nav-icon">🏠</span>
          <span class="nav-text">店铺管理</span>
        </button>
        <button
          class="nav-item"
          :class="{ active: activeTab === 'dishes' }"
          @click="handleTabChange('dishes')"
        >
          <span class="nav-icon">🍽️</span>
          <span class="nav-text">菜品管理</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <button class="logout-btn" @click="logout">
          <span class="nav-icon">🚪</span>
          <span class="nav-text">退出登录</span>
        </button>
      </div>
    </aside>

    <main class="main-content">
      <header class="top-header">
        <div class="header-info">
          <div class="user-avatar">
            <span class="avatar-icon">👤</span>
          </div>
          <div class="user-details">
            <h3>{{ currentUser.username || '商家店铺' }}</h3>
            <p>{{ currentUser.username || '商家' }} | {{ currentUser.phone }}</p>
          </div>
        </div>
        <div class="header-actions">
          <span class="current-time">{{ new Date().toLocaleDateString('zh-CN') }}</span>
        </div>
      </header>

      <div v-if="activeTab === 'dashboard'" class="content-area">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon orders-icon">📋</div>
            <div class="stat-info">
              <p class="stat-value">{{ merchantInfo.totalOrders }}</p>
              <p class="stat-label">总订单数</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon pending-icon">⏳</div>
            <div class="stat-info">
              <p class="stat-value">{{ merchantInfo.pendingOrders }}</p>
              <p class="stat-label">待处理订单</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon completed-icon">✅</div>
            <div class="stat-info">
              <p class="stat-value">{{ merchantInfo.completedOrders }}</p>
              <p class="stat-label">已完成订单</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon revenue-icon">💰</div>
            <div class="stat-info">
              <p class="stat-value">¥{{ merchantInfo.todayRevenue.toFixed(2) }}</p>
              <p class="stat-label">今日营收</p>
            </div>
          </div>
        </div>

        <div class="quick-actions">
          <h3 class="section-title">快捷操作</h3>
          <div class="action-buttons">
            <button class="action-btn" @click="handleTabChange('orders')">
              <span class="action-icon">📋</span>
              <span class="action-text">查看订单</span>
            </button>
            <button class="action-btn" @click="handleTabChange('shop')">
              <span class="action-icon">🏠</span>
              <span class="action-text">管理店铺</span>
            </button>
            <button class="action-btn" @click="handleTabChange('dishes')">
              <span class="action-icon">🍽️</span>
              <span class="action-text">管理菜品</span>
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'orders'" class="content-area">
        <div class="section-header">
          <h3 class="section-title">订单管理</h3>
        </div>

        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>

        <div v-else-if="orders.length === 0" class="empty-state">
          <div class="empty-icon">📦</div>
          <p>暂无订单</p>
        </div>

        <div v-else class="order-list">
          <div v-for="order in orders" :key="order.id" class="order-card">
            <div class="order-header">
              <span class="order-no">订单号：{{ order.orderNo }}</span>
              <span class="order-status" :class="getOrderStatusClass(order.status)">
                {{ getOrderStatusText(order.status) }}
              </span>
            </div>
            <div class="order-items">
              <div v-for="item in (order.items || [])" :key="item.dishId" class="order-item">
                <div class="item-main">
                  <span class="item-name">{{ item.dishName }}</span>
                  <span class="item-quantity">x{{ item.quantity }}</span>
                </div>
                <div v-if="item.specName" class="item-spec">
                  <span class="spec-label">规格：</span>
                  <span class="spec-value">{{ item.specName }}</span>
                </div>
                <div v-if="item.attributeDetail" class="item-spec">
                  <span class="spec-label">属性：</span>
                  <span class="spec-value">{{ item.attributeDetail }}</span>
                </div>
                <div class="item-price-row">
                  <span class="item-box-fee" v-if="item.boxFee > 0">打包费 ¥{{ item.boxFee }}</span>
                  <span class="item-amount">小计 ¥{{ item.amount }}</span>
                </div>
              </div>
              <div class="order-remark">
                <span class="remark-label">订单备注：</span>
                <span class="remark-value">{{ order.remark || '-' }}</span>
              </div>
            </div>
            <div class="order-footer">
              <span class="order-total">合计：¥{{ order.actualAmount?.toFixed(2) || 0 }}</span>
              <div class="order-actions">
                <button v-if="order.status === 2" class="action-btn-small primary" @click="acceptOrder(order.orderNo)">
                  接单
                </button>
                <button v-if="order.status === 2" class="action-btn-small danger" @click="openRejectModal(order.orderNo)">
                  拒单
                </button>
                <button v-if="order.status === 3" class="action-btn-small primary" @click="completeOrder(order.orderNo)">
                  完成
                </button>
                <div v-if="order.pickupCode" class="pickup-code">
                  <span class="pickup-code-label">取件码：</span>
                  <span class="pickup-code-value">{{ order.pickupCode }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showRejectModal" class="modal-overlay" @click.self="closeRejectModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>拒单原因</h3>
            <button class="modal-close" @click="closeRejectModal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">请填写拒单原因</label>
              <textarea
                v-model="rejectReason"
                class="form-input"
                placeholder="请输入拒单原因..."
                rows="4"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeRejectModal">取消</button>
            <button class="btn btn-primary" @click="confirmRejectOrder">确认拒单</button>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'shop'" class="content-area">
        <div class="section-header">
          <h3 class="section-title">店铺管理</h3>
          <span class="audit-badge" :class="getAuditStatusClass(shopInfo.auditStatus ?? 0)">
            {{ getAuditStatusText(shopInfo.auditStatus ?? 0) }}
          </span>
        </div>

        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- 未提交状态：只显示注册店铺 -->
        <div v-else-if="shopInfo.auditStatus === 0" class="audit-status-container">
          <div class="audit-status-card">
            <div class="audit-icon">📝</div>
            <h3 class="audit-title">您还未注册店铺</h3>
            <p class="audit-desc">请填写店铺信息并提交审核，审核通过后即可开始营业</p>
            <button class="btn btn-primary btn-large" @click="shopInfo.auditStatus = -1">注册店铺</button>
          </div>
        </div>

        <!-- 审核中状态 -->
        <div v-else-if="shopInfo.auditStatus === 1" class="audit-status-container">
          <div class="audit-status-card">
            <div class="audit-icon pending">⏳</div>
            <h3 class="audit-title">店铺审核中</h3>
            <p class="audit-desc">您的店铺信息正在审核中，请耐心等待</p>
            <div class="audit-info">
              <span class="info-label">提交时间：</span>
              <span class="info-value">{{ shopInfo.updateTime || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 驳回状态：显示驳回原因和重新提交 -->
        <div v-else-if="shopInfo.auditStatus === 3" class="audit-status-container">
          <div class="audit-status-card rejected">
            <div class="audit-icon">❌</div>
            <h3 class="audit-title">店铺审核被驳回</h3>
            <div class="reject-reason-box">
              <span class="reason-label">驳回原因：</span>
              <span class="reason-content">{{ shopInfo.rejectReason || '未填写驳回原因' }}</span>
            </div>
            <button class="btn btn-primary btn-large" @click="shopInfo.auditStatus = -1">重新提交</button>
          </div>
        </div>

        <!-- 通过状态或编辑状态：正常显示表单 -->
        <div v-else-if="shopInfo.auditStatus === 2 || shopInfo.auditStatus === -1" class="shop-form">
          <div class="form-section">
            <h4 class="form-section-title">基本信息</h4>
            <div class="form-row">
              <div class="form-group">
                <label>店铺名称 *</label>
                <input v-model="shopInfo.name" type="text" class="form-input" placeholder="请输入店铺名称" />
              </div>
              <div class="form-group">
                <label>店铺图片</label>
                <div class="image-upload">
                  <img :src="getLogoUrl(shopInfo.logo)" alt="店铺图片" class="preview-image" />
                  <label class="upload-btn">
                    <span>上传图片</span>
                    <input type="file" accept="image/*" class="hidden-input" @change="(e) => uploadImage(e, 'logo')" />
                  </label>
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group full-width">
                <label>店铺描述</label>
                <textarea v-model="shopInfo.description" class="form-input" placeholder="请输入店铺描述"></textarea>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4 class="form-section-title">配送设置</h4>
            <div class="form-row">
              <div class="form-group">
                <label>配送费（元）</label>
                <input v-model.number="shopInfo.delivery" type="number" step="0.01" class="form-input" placeholder="请输入配送费" />
              </div>
              <div class="form-group">
                <label>起送价（元）</label>
                <input v-model.number="shopInfo.minOrderAmount" type="number" step="0.01" class="form-input" placeholder="请输入起送价" />
              </div>
              <div class="form-group">
                <label>配送范围（米）</label>
                <input v-model.number="shopInfo.radius" type="number" class="form-input" placeholder="请输入配送范围" />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4 class="form-section-title">营业信息</h4>
            <div class="form-row">
              <div class="form-group">
                <label>营业时间</label>
                <input v-model="shopInfo.businessHours" type="text" class="form-input" placeholder="如：09:00-22:00" />
              </div>
              <div class="form-group">
                <label>营业状态</label>
                <select v-model.number="shopInfo.status" class="form-input">
                  <option :value="1">营业中</option>
                  <option :value="0">休息中</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4 class="form-section-title">店铺地址</h4>
            <div class="form-row">
              <div class="form-group">
                <label>省份</label>
                <input v-model="shopInfo.province" type="text" class="form-input" placeholder="请输入省份" />
              </div>
              <div class="form-group">
                <label>城市</label>
                <input v-model="shopInfo.city" type="text" class="form-input" placeholder="请输入城市" />
              </div>
              <div class="form-group">
                <label>区县</label>
                <input v-model="shopInfo.district" type="text" class="form-input" placeholder="请输入区县" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group full-width">
                <label>详细地址</label>
                <input v-model="shopInfo.address" type="text" class="form-input" placeholder="请输入详细地址" />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4 class="form-section-title">资质信息</h4>
            <div class="form-row">
              <div class="form-group">
                <label>营业执照</label>
                <div class="image-upload">
                  <img :src="getLogoUrl(shopInfo.businessLicense)" alt="营业执照" class="preview-image" />
                  <label class="upload-btn">
                    <span>上传</span>
                    <input type="file" accept="image/*" class="hidden-input" @change="(e) => uploadImage(e, 'businessLicense')" />
                  </label>
                </div>
              </div>
              <div class="form-group">
                <label>食品许可证</label>
                <div class="image-upload">
                  <img :src="getLogoUrl(shopInfo.foodLicense)" alt="食品许可证" class="preview-image" />
                  <label class="upload-btn">
                    <span>上传</span>
                    <input type="file" accept="image/*" class="hidden-input" @change="(e) => uploadImage(e, 'foodLicense')" />
                  </label>
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>法人姓名</label>
                <input v-model="shopInfo.legalPersonName" type="text" class="form-input" placeholder="请输入法人姓名" />
              </div>
              <div class="form-group">
                <label>法人身份证</label>
                <input v-model="shopInfo.legalPersonIdCard" type="text" class="form-input" placeholder="请输入法人身份证号" />
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn btn-secondary" @click="shopInfo.auditStatus = shopInfo.auditStatus === -1 ? 0 : 2">取消</button>
            <button v-if="shopInfo.auditStatus === 2" class="btn btn-primary" @click="saveShopInfo">保存修改</button>
            <button v-else class="btn btn-primary" @click="submitForAudit">提交审核</button>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'dishes'" class="content-area">
        <div class="section-header">
          <h3 class="section-title">菜品管理</h3>
          <div class="section-actions">
            <button class="add-btn" @click="openAddCategoryModal">+ 添加分类</button>
            <button class="add-btn" @click="openAddDishModal">+ 添加菜品</button>
          </div>
        </div>

        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>

        <div v-else-if="dishes.length === 0" class="empty-state">
          <div class="empty-icon">🍽️</div>
          <p>暂无菜品</p>
        </div>

        <div v-else class="dish-category-list">
          <div v-for="cat in categories" :key="cat.category.id" class="dish-category-section">
            <div class="category-header">
              <div class="category-info">
                <span class="category-icon">📁</span>
                <h3 class="category-name">{{ cat.category.name }}</h3>
                <span class="category-count">({{ cat.dishes.length }}个菜品)</span>
              </div>
            </div>
            <div class="dish-grid">
              <div v-for="dish in cat.dishes" :key="dish.id" class="dish-card">
                <div class="dish-image-wrapper">
                  <img :src="getLogoUrl(dish.image)" alt="菜品图片" class="dish-image" />
                  <span v-if="dish.recommend === 1" class="dish-tag recommend">推荐</span>
                  <span v-if="dish.stock > 0 && dish.stock < 20" class="dish-tag low-stock">库存不足</span>
                </div>
                <div class="dish-info">
                  <div class="dish-header">
                    <h4>{{ dish.name }}</h4>
                  </div>
                  <p class="dish-desc">{{ dish.description }}</p>
                  <div class="dish-meta">
                    <span class="dish-price">¥{{ dish.price }}</span>
                    <span v-if="dish.salesPrice > 0 && dish.salesPrice !== dish.price" class="dish-sale-price">¥{{ dish.salesPrice }}</span>
                  </div>
                  <div class="dish-stats">
                    <span class="stat-item">销量: {{ dish.sales }}</span>
                    <span class="stat-item">月销: {{ dish.monthSales }}</span>
                    <span class="stat-item">库存: {{ dish.stock }}</span>
                  </div>
                </div>
                <div class="dish-actions">
                  <button class="action-btn-small" @click="openEditDishModal(dish)">编辑</button>
                  <button class="action-btn-small danger" @click="deleteDish(dish.id)">删除</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>

  <div v-if="showAddDishModal" class="modal-overlay" @click.self="closeAddDishModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>添加菜品</h3>
        <button class="modal-close" @click="closeAddDishModal">×</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label>菜品名称</label>
            <input v-model="newDish.name" type="text" class="form-input" placeholder="请输入菜品名称" />
          </div>
          <div class="form-group">
            <label>分类</label>
            <select v-model.number="newDish.categoryId" class="form-input">
              <option :value="0">请选择分类</option>
              <option v-for="cat in categoryList" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>原价</label>
            <input v-model.number="newDish.price" type="number" class="form-input" placeholder="请输入原价" />
          </div>
          <div class="form-group">
            <label>售价</label>
            <input v-model.number="newDish.salesPrice" type="number" class="form-input" placeholder="请输入售价" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>打包费</label>
            <input v-model.number="newDish.boxPrice" type="number" class="form-input" placeholder="请输入打包费" />
          </div>
          <div class="form-group">
            <label>库存</label>
            <input v-model.number="newDish.stock" type="number" class="form-input" placeholder="请输入库存" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>菜品描述</label>
            <textarea v-model="newDish.description" class="form-input" placeholder="请输入菜品描述"></textarea>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>菜品图片</label>
            <div class="image-upload">
              <img :src="getLogoUrl(newDish.image)" alt="菜品图片" class="preview-image" />
              <label class="upload-btn">
                <span>上传图片</span>
                <input type="file" accept="image/*" class="hidden-input" @change="(e) => uploadDishImage(e, 'new')" />
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>推荐</label>
            <select v-model.number="newDish.recommend" class="form-input">
              <option :value="0">否</option>
              <option :value="1">是</option>
            </select>
          </div>
        </div>

        <div class="form-section">
          <h4 class="form-section-title">菜品规格</h4>
          <button class="add-btn" @click="addSpec('new')">+ 添加规格</button>
          <div v-if="newDish.specs && newDish.specs.length > 0" class="spec-list">
            <div v-for="(spec, index) in newDish.specs" :key="index" class="spec-item">
              <div class="form-row">
                <div class="form-group">
                  <label>规格名称</label>
                  <input v-model="spec.name" type="text" class="form-input" placeholder="如：小份" />
                </div>
                <div class="form-group">
                  <label>价格</label>
                  <input v-model.number="spec.price" type="number" step="0.01" class="form-input" placeholder="请输入价格" />
                </div>
                <div class="form-group">
                  <label>库存</label>
                  <input v-model.number="spec.stock" type="number" class="form-input" placeholder="请输入库存" />
                </div>
                <button class="action-btn-small danger" @click="removeSpec('new', index)">删除</button>
              </div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h4 class="form-section-title">菜品属性</h4>
          <button class="add-btn" @click="addAttribute('new')">+ 添加属性</button>
          <div v-if="newDish.attributes && newDish.attributes.length > 0" class="attr-list">
            <div v-for="(attr, attrIndex) in newDish.attributes" :key="attrIndex" class="attr-item">
              <div class="form-row">
                <div class="form-group">
                  <label>属性名称</label>
                  <input v-model="attr.name" type="text" class="form-input" placeholder="如：辣度" />
                </div>
                <div class="form-group">
                  <label>是否必填</label>
                  <select v-model.number="attr.required" class="form-input">
                    <option :value="0">否</option>
                    <option :value="1">是</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>最多可选</label>
                  <input v-model.number="attr.maxSelect" type="number" class="form-input" placeholder="最多可选数量" />
                </div>
                <button class="action-btn-small danger" @click="removeAttribute('new', attrIndex)">删除属性</button>
              </div>
              <div class="attr-options">
                <button class="add-btn" @click="addAttrOption('new', attrIndex)">+ 添加选项</button>
                <div v-if="attr.options && attr.options.length > 0">
                  <div v-for="(option, optIndex) in attr.options" :key="optIndex" class="form-row">
                    <div class="form-group">
                      <label>选项名称</label>
                      <input v-model="option.name" type="text" class="form-input" placeholder="如：微辣" />
                    </div>
                    <div class="form-group">
                      <label>加价</label>
                      <input v-model.number="option.priceModifier" type="number" step="0.01" class="form-input" placeholder="加价金额" />
                    </div>
                    <button class="action-btn-small danger" @click="removeAttrOption('new', attrIndex, optIndex)">删除</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeAddDishModal">取消</button>
        <button class="btn btn-primary" @click="submitAddDish">确认添加</button>
      </div>
    </div>
  </div>

  <div v-if="showEditDishModal && currentEditDish" class="modal-overlay" @click.self="closeEditDishModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>编辑菜品</h3>
        <button class="modal-close" @click="closeEditDishModal">×</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label>菜品名称</label>
            <input v-model="currentEditDish.name" type="text" class="form-input" placeholder="请输入菜品名称" />
          </div>
          <div class="form-group">
            <label>分类</label>
            <select v-model.number="currentEditDish.categoryId" class="form-input">
              <option :value="0">请选择分类</option>
              <option v-for="cat in categoryList" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>原价</label>
            <input v-model.number="currentEditDish.price" type="number" class="form-input" placeholder="请输入原价" />
          </div>
          <div class="form-group">
            <label>售价</label>
            <input v-model.number="currentEditDish.salesPrice" type="number" class="form-input" placeholder="请输入售价" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>打包费</label>
            <input v-model.number="currentEditDish.boxPrice" type="number" class="form-input" placeholder="请输入打包费" />
          </div>
          <div class="form-group">
            <label>库存</label>
            <input v-model.number="currentEditDish.stock" type="number" class="form-input" placeholder="请输入库存" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>菜品描述</label>
            <textarea v-model="currentEditDish.description" class="form-input" placeholder="请输入菜品描述"></textarea>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>菜品图片</label>
            <div class="image-upload">
              <img :src="getLogoUrl(currentEditDish.image)" alt="菜品图片" class="preview-image" />
              <label class="upload-btn">
                <span>上传图片</span>
                <input type="file" accept="image/*" class="hidden-input" @change="(e) => uploadDishImage(e, 'edit')" />
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>推荐</label>
            <select v-model.number="currentEditDish.recommend" class="form-input">
              <option :value="0">否</option>
              <option :value="1">是</option>
            </select>
          </div>
        </div>

        <div class="form-section">
          <h4 class="form-section-title">菜品规格</h4>
          <button class="add-btn" @click="addSpec('edit')">+ 添加规格</button>
          <div v-if="currentEditDish.specs && currentEditDish.specs.length > 0" class="spec-list">
            <div v-for="(spec, index) in currentEditDish.specs" :key="index" class="spec-item">
              <div class="form-row">
                <div class="form-group">
                  <label>规格名称</label>
                  <input v-model="spec.name" type="text" class="form-input" placeholder="如：小份" />
                </div>
                <div class="form-group">
                  <label>价格</label>
                  <input v-model.number="spec.price" type="number" step="0.01" class="form-input" placeholder="请输入价格" />
                </div>
                <div class="form-group">
                  <label>库存</label>
                  <input v-model.number="spec.stock" type="number" class="form-input" placeholder="请输入库存" />
                </div>
                <button class="action-btn-small danger" @click="removeSpec('edit', index)">删除</button>
              </div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h4 class="form-section-title">菜品属性</h4>
          <button class="add-btn" @click="addAttribute('edit')">+ 添加属性</button>
          <div v-if="currentEditDish.attributes && currentEditDish.attributes.length > 0" class="attr-list">
            <div v-for="(attr, attrIndex) in currentEditDish.attributes" :key="attrIndex" class="attr-item">
              <div class="form-row">
                <div class="form-group">
                  <label>属性名称</label>
                  <input v-model="attr.name" type="text" class="form-input" placeholder="如：辣度" />
                </div>
                <div class="form-group">
                  <label>是否必填</label>
                  <select v-model.number="attr.required" class="form-input">
                    <option :value="0">否</option>
                    <option :value="1">是</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>最多可选</label>
                  <input v-model.number="attr.maxSelect" type="number" class="form-input" placeholder="最多可选数量" />
                </div>
                <button class="action-btn-small danger" @click="removeAttribute('edit', attrIndex)">删除属性</button>
              </div>
              <div class="attr-options">
                <button class="add-btn" @click="addAttrOption('edit', attrIndex)">+ 添加选项</button>
                <div v-if="attr.options && attr.options.length > 0">
                  <div v-for="(option, optIndex) in attr.options" :key="optIndex" class="form-row">
                    <div class="form-group">
                      <label>选项名称</label>
                      <input v-model="option.name" type="text" class="form-input" placeholder="如：微辣" />
                    </div>
                    <div class="form-group">
                      <label>加价</label>
                      <input v-model.number="option.priceModifier" type="number" step="0.01" class="form-input" placeholder="加价金额" />
                    </div>
                    <button class="action-btn-small danger" @click="removeAttrOption('edit', attrIndex, optIndex)">删除</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeEditDishModal">取消</button>
        <button class="btn btn-primary" @click="submitEditDish">确认更新</button>
      </div>
    </div>
  </div>

  <div v-if="showAddCategoryModal" class="modal-overlay" @click.self="closeAddCategoryModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>添加分类</h3>
        <button class="modal-close" @click="closeAddCategoryModal">×</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>分类名称</label>
          <input v-model="newCategoryName" type="text" class="form-input" placeholder="请输入分类名称" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeAddCategoryModal">取消</button>
        <button class="btn btn-primary" @click="submitAddCategory">确认添加</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.merchant-page {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary);
}

.sidebar {
  width: 260px;
  background: var(--bg-card);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar-header {
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 36px;
}

.logo-text h2 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.logo-text p {
  font-size: 12px;
  color: var(--text-muted);
  margin: 4px 0 0;
}

.sidebar-nav {
  flex: 1;
  padding: 16px;
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 4px;
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.nav-item:hover {
  background: var(--bg-primary);
}

.nav-item.active {
  background: rgba(255, 107, 53, 0.1);
  color: var(--primary-color);
}

.nav-icon {
  font-size: 20px;
}

.nav-text {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
}

.nav-item.active .nav-text {
  color: var(--primary-color);
}

.nav-badge {
  margin-left: auto;
  padding: 2px 8px;
  background: #e74c3c;
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: 10px;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--border-color);
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.logout-btn:hover {
  background: rgba(231, 76, 60, 0.1);
}

.logout-btn .nav-text {
  color: #e74c3c;
}

.main-content {
  flex: 1;
  margin-left: 260px;
}

.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
}

.avatar-icon {
  font-size: 28px;
}

.user-details h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.user-details p {
  font-size: 13px;
  color: var(--text-muted);
  margin: 4px 0 0;
}

.current-time {
  font-size: 14px;
  color: var(--text-secondary);
}

.content-area {
  padding: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.add-btn {
  padding: 10px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.add-btn:hover {
  background: var(--primary-dark);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: var(--shadow-sm);
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.orders-icon {
  background: rgba(52, 152, 219, 0.1);
}

.pending-icon {
  background: rgba(243, 156, 18, 0.1);
}

.completed-icon {
  background: rgba(39, 174, 96, 0.1);
}

.revenue-icon {
  background: rgba(155, 89, 182, 0.1);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.stat-label {
  font-size: 14px;
  color: var(--text-muted);
  margin: 4px 0 0;
}

.quick-actions {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.action-buttons {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
  background: var(--bg-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: rgba(255, 107, 53, 0.1);
  transform: translateY(-2px);
}

.action-icon {
  font-size: 32px;
}

.action-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 16px;
  color: var(--text-muted);
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.order-no {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.order-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-pending {
  background: rgba(243, 156, 18, 0.1);
  color: #f39c12;
}

.status-paid {
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.status-preparing {
  background: rgba(155, 89, 182, 0.1);
  color: #9b59b6;
}

.status-delivering {
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.status-completed {
  background: rgba(39, 174, 96, 0.1);
  color: #27ae60;
}

.status-canceled {
  background: rgba(149, 165, 166, 0.1);
  color: #95a5a6;
}

.status-refunding {
  background: rgba(241, 196, 15, 0.1);
  color: #f1c40f;
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.order-item {
  padding: 12px;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
}

.item-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.item-quantity {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
}

.item-spec,
.item-attribute {
  font-size: 13px;
  margin-bottom: 4px;
}

.spec-label,
.attr-label {
  color: var(--text-muted);
}

.spec-value,
.attr-value {
  color: var(--text-secondary);
}

.item-price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-color);
}

.item-box-fee {
  font-size: 12px;
  color: var(--text-muted);
}

.item-amount {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
}

.order-remark {
  padding: 12px;
  margin-top: 8px;
  background: var(--bg-warning);
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.remark-label {
  color: var(--text-muted);
}

.remark-value {
  color: var(--text-secondary);
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-total {
  font-size: 16px;
  font-weight: 700;
  color: var(--primary-color);
}

.order-actions {
  display: flex;
  gap: 12px;
}

.action-btn-small {
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn-small.primary {
  background: var(--primary-color);
  color: white;
}

.action-btn-small.primary:hover {
  background: var(--primary-dark);
}

.action-btn-small.danger {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.action-btn-small.danger:hover {
  background: rgba(231, 76, 60, 0.2);
}

.pickup-code {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: rgba(46, 204, 113, 0.1);
  border-radius: 6px;
}

.pickup-code-label {
  font-size: 13px;
  color: #2ecc71;
}

.pickup-code-value {
  font-size: 16px;
  font-weight: 700;
  color: #2ecc71;
  margin-left: 4px;
}

.shop-form {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 32px;
  box-shadow: var(--shadow-sm);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.form-input {
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-primary);
  transition: border-color var(--transition-fast);
  outline: none;
}

.form-input:focus {
  border-color: var(--primary-color);
}

.form-input::placeholder {
  color: var(--text-muted);
}

.form-input textarea {
  min-height: 100px;
  resize: vertical;
}

.image-upload {
  display: flex;
  align-items: center;
  gap: 16px;
}

.preview-image {
  width: 100px;
  height: 100px;
  border-radius: var(--radius-md);
  object-fit: cover;
  border: 1px solid var(--border-color);
}

.upload-btn {
  padding: 12px 20px;
  background: var(--bg-primary);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.upload-btn:hover {
  background: rgba(255, 107, 53, 0.1);
  border-color: var(--primary-color);
}

.hidden-input {
  display: none;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.submit-btn {
  padding: 12px 32px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.submit-btn:hover {
  background: var(--primary-dark);
}

.audit-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.audit-pending {
  background: rgba(243, 156, 18, 0.1);
  color: #f39c12;
}

.audit-approved {
  background: rgba(39, 174, 96, 0.1);
  color: #27ae60;
}

.audit-rejected {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.audit-not-submitted {
  background: rgba(149, 165, 166, 0.1);
  color: #95a5a6;
}

.audit-status-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
}

.audit-status-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 48px;
  text-align: center;
  max-width: 480px;
  box-shadow: var(--shadow-md);
}

.audit-status-card.rejected {
  border: 2px solid rgba(231, 76, 60, 0.3);
}

.audit-icon {
  font-size: 64px;
  margin-bottom: 24px;
}

.audit-icon.pending {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.audit-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px;
}

.audit-desc {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0 0 32px;
  line-height: 1.6;
}

.audit-info {
  display: flex;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
}

.info-label {
  color: var(--text-muted);
}

.info-value {
  color: var(--text-primary);
}

.reject-reason-box {
  background: rgba(231, 76, 60, 0.1);
  border-radius: var(--radius-md);
  padding: 16px 24px;
  margin-bottom: 32px;
  text-align: left;
}

.reason-label {
  font-size: 14px;
  color: #e74c3c;
  font-weight: 600;
}

.reason-content {
  font-size: 14px;
  color: var(--text-primary);
  margin-top: 8px;
  display: block;
}

.btn-large {
  padding: 14px 48px;
  font-size: 16px;
}

.form-section {
  margin-bottom: 32px;
}

.form-section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--primary-color);
  display: inline-block;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.form-row.full-width {
  grid-template-columns: 1fr;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.btn-secondary {
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: rgba(0, 0, 0, 0.02);
}

.section-actions {
  display: flex;
  gap: 12px;
}

.dish-category-list {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.dish-category-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.category-header {
  padding: 16px 20px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

.category-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-icon {
  font-size: 18px;
}

.category-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.category-count {
  font-size: 13px;
  color: var(--text-muted);
}

.dish-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
}

.dish-card {
  background: var(--bg-card);
  border-radius: 0;
  overflow: hidden;
  transition: all var(--transition-fast);
  border-right: 1px solid var(--border-color);
}

.dish-card:last-child {
  border-right: none;
}

.dish-card:hover {
  background: rgba(255, 107, 53, 0.03);
}

.dish-image-wrapper {
  position: relative;
}

.dish-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.dish-tag {
  position: absolute;
  top: 10px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.dish-tag.recommend {
  left: 10px;
  background: var(--primary-color);
  color: white;
}

.dish-tag.low-stock {
  right: 10px;
  background: #e74c3c;
  color: white;
}

.dish-info {
  padding: 20px;
}

.dish-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.dish-info h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.dish-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0 0 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.dish-meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}

.dish-price {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-color);
}

.dish-sale-price {
  font-size: 14px;
  font-weight: 600;
  color: #e74c3c;
  text-decoration: line-through;
}

.dish-category {
  font-size: 12px;
  color: var(--text-muted);
  padding: 2px 8px;
  background: var(--bg-primary);
  border-radius: 4px;
}

.dish-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-muted);
}

.stat-item {
  display: flex;
  align-items: center;
}

.dish-actions {
  display: flex;
  border-top: 1px solid var(--border-color);
}

.dish-actions .action-btn-small {
  flex: 1;
  border-radius: 0;
  background: transparent;
  color: var(--text-secondary);
}

.dish-actions .action-btn-small:hover {
  background: var(--bg-primary);
}

@media screen and (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .dish-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (max-width: 768px) {
  .sidebar {
    width: 100%;
    transform: translateX(-100%);
  }

  .main-content {
    margin-left: 0;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .dish-list {
    grid-template-columns: 1fr;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 1000;
  padding: 40px 20px;
  overflow-y: auto;
}

.modal-content {
  width: 100%;
  max-width: 850px;
  max-height: calc(100vh - 80px);
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 50%;
}

.modal-close:hover {
  background: var(--bg-secondary);
}

.modal-body {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.btn-secondary:hover {
  background: var(--bg-primary);
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.form-section {
  margin-bottom: 24px;
}

.form-section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--border-color);
}

.spec-list, .attr-list {
  margin-top: 12px;
}

.spec-item, .attr-item {
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  margin-bottom: 12px;
}

.attr-options {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-color);
}

.image-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.preview-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.upload-btn:hover {
  background: var(--primary-light);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.hidden-input {
  display: none;
}
</style>
