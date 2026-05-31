<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-content">
        <div class="footer-brand">
          <h2 class="brand-name">美味外卖</h2>
          <p class="brand-slogan">用心做美食，诚意送万家</p>
        </div>

        <div class="footer-links">
          <div class="link-group">
            <h3 class="link-title">关于我们</h3>
            <a href="#" class="footer-link">公司简介</a>
            <a href="#" class="footer-link">联系我们</a>
            <a href="#" class="footer-link">加入我们</a>
          </div>

          <div class="link-group">
            <h3 class="link-title">帮助中心</h3>
            <a href="#" class="footer-link">常见问题</a>
            <a href="#" class="footer-link">用户指南</a>
            <a href="#" class="footer-link">意见反馈</a>
          </div>

          <div class="link-group">
            <h3 class="link-title">商务合作</h3>
            <a href="#" class="footer-link">商家入驻</a>
            <a href="#" class="footer-link">广告投放</a>
            <a href="#" class="footer-link">战略合作</a>
          </div>
        </div>

        <div class="footer-contact">
          <h3 class="contact-title">客服热线</h3>
          <p class="contact-phone">400-888-8888</p>
          <p class="contact-time">周一至周日 9:00-22:00</p>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="copyright">
          <p>© {{ currentYear }} 美味外卖 版权所有</p>
          <p>技术支持：美味科技</p>
        </div>
        <div class="social-links">
          <span class="social-icon">📱</span>
          <span class="social-icon">💬</span>
          <span class="social-icon">📧</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--text-primary);
  color: var(--bg-primary);
  margin-top: auto;
  padding: 60px 0 20px;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.footer-content {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 60px;
  margin-bottom: 40px;
}

.footer-brand {
  text-align: left;
}

.brand-name {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 12px;
}

.brand-slogan {
  font-size: 14px;
  color: rgba(255, 248, 240, 0.7);
  line-height: 1.6;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
}

.link-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.link-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--primary-color);
}

.footer-link {
  font-size: 14px;
  color: rgba(255, 248, 240, 0.8);
  transition: color var(--transition-fast);
  cursor: pointer;
}

.footer-link:hover {
  color: var(--primary-color);
}

.footer-contact {
  text-align: right;
}

.contact-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--primary-color);
}

.contact-phone {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.contact-time {
  font-size: 13px;
  color: rgba(255, 248, 240, 0.7);
}

.footer-bottom {
  border-top: 1px solid rgba(255, 248, 240, 0.2);
  padding-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.copyright {
  font-size: 13px;
  color: rgba(255, 248, 240, 0.6);
}

.copyright p {
  margin-bottom: 4px;
}

.social-links {
  display: flex;
  gap: 16px;
}

.social-icon {
  font-size: 20px;
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.social-icon:hover {
  transform: scale(1.2);
}

@media screen and (max-width: 968px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }

  .footer-brand,
  .footer-contact {
    text-align: center;
  }

  .footer-links {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
}

@media screen and (max-width: 640px) {
  .footer {
    padding: 40px 0 20px;
  }

  .footer-links {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
