```
<template>
  <div class="app">
    <GravityBackground @animation-complete="handleAnimationComplete" />
    <!-- Main Content Wrapper -->
    <div class="main-content" :class="{ 'visible': showContent }">
      <!-- 导航栏 -->
      <nav class="navbar" :class="{ 'scrolled': isScrolled }">
        <div class="container">
          <div class="logo">IO724</div>
          <ul class="nav-links">
            <li><a href="#home" @click="handleNavClick">首页</a></li>
            <li><a href="#about" @click="handleNavClick">关于</a></li>
            <li><a href="#skills" @click="handleNavClick">技能</a></li>
            <li><a href="#contact" @click="handleNavClick">联系</a></li>
          </ul>
          <button class="mobile-menu-btn" @click="toggleMobileMenu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        <div class="mobile-menu" :class="{ 'active': isMobileMenuOpen }">
          <a href="#home" @click="handleNavClick">首页</a>
          <a href="#about" @click="handleNavClick">关于</a>
          <a href="#skills" @click="handleNavClick">技能</a>
          <a href="#contact" @click="handleNavClick">联系</a>
        </div>
      </nav>

      <!-- 主页内容容器 -->
      <div v-if="currentView === 'home'">
        <!-- 主页英雄区 -->
        <section id="home" class="hero">
        <div class="hero-background">
          <!-- 动态背景由 GravityBackground 组件提供 -->
        </div>
        <div class="container hero-content">
          <div class="hero-text">
            <h1 class="hero-title">
              <span class="greeting">你好，我是</span>
              <span class="name">IO724</span>
            </h1>
            <p class="hero-subtitle">
              <span class="typing-text">{{ typedText }}</span>
              <span class="cursor">|</span>
            </p>
            <div class="hero-tags">
              <span class="tag">🦁 狮子座</span>
              <span class="tag">👨‍💻 程序员</span>
              <span class="tag">💻 .NET</span>
            </div>
            <div class="hero-buttons">
              <a href="#about" class="btn btn-primary" @click="scrollToSection">了解更多</a>
              <a href="#contact" class="btn btn-secondary" @click="scrollToSection">联系我</a>
            </div>
          </div>
        </div>
        <div class="scroll-indicator">
          <div class="mouse"></div>
        </div>
      </section>

      <!-- 关于区域 -->
      <section id="about" class="about">
        <div class="container">
          <h2 class="section-title">关于我</h2>
          <div class="about-content">
            <div class="about-card">
              <div class="card-icon">🎯</div>
              <h3>热爱编程</h3>
              <p>专注于 .NET 和 C# 开发，追求代码质量和技术创新</p>
            </div>
            <div class="about-card">
              <div class="card-icon">🦁</div>
              <h3>狮子座</h3>
              <p>充满热情和创造力，勇于挑战和探索新技术</p>
            </div>
            <div class="about-card">
              <div class="card-icon">🚀</div>
              <h3>持续学习</h3>
              <p>保持好奇心，不断学习新技术，提升技术能力</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 技能区域 -->
      <section id="skills" class="skills">
        <div class="container">
          <h2 class="section-title">技术栈</h2>
          <div class="skills-grid">
            <div class="skill-card" v-for="skill in skills" :key="skill.name">
              <div class="skill-icon">{{ skill.icon }}</div>
              <h3>{{ skill.name }}</h3>
              <div class="skill-bar">
                <div class="skill-progress" :style="{ width: skill.level + '%' }"></div>
              </div>
              <p class="skill-level">{{ skill.level }}%</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 联系区域 -->
      <section id="contact" class="contact">
        <div class="container">
          <h2 class="section-title">联系我</h2>
          <div class="contact-content">
            <div class="contact-info">
              <h3>让我们一起创造些什么</h3>
              <p>如果你有任何想法或项目合作，欢迎随时联系我！</p>
              <div class="social-links">
                <a href="#" class="social-link" title="GitHub">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                <a href="#" class="social-link" title="Email">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </a>
                <a href="#" class="social-link" title="Twitter">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                  </svg>
                </a>
              </div>
            </div>
            <form class="contact-form" @submit.prevent="handleSubmit">
              <div class="form-group">
                <input type="text" placeholder="你的名字" v-model="form.name" required>
              </div>
              <div class="form-group">
                <input type="email" placeholder="你的邮箱" v-model="form.email" required>
              </div>
              <div class="form-group">
                <textarea placeholder="留言内容" v-model="form.message" rows="5" required></textarea>
              </div>
              <button type="submit" class="btn btn-primary">发送消息</button>
            </form>
          </div>
        </div>
        </section>
      </div>

      <!-- 页脚 -->
      <footer class="footer">
        <div class="container">
          <p>&copy; 2025 IO724.com | 程序员 · 狮子座 · .NET开发者</p>
          <p class="footer-tech">Built with Vue 3</p>
          <p class="footer-tech">Power By Gemini 3 Pro</p>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import GravityBackground from './components/GravityBackground.vue'

// 状态管理
const currentView = ref('home')
const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)
const showContent = ref(false) // New: Controls content visibility
const typedText = ref('')
const form = ref({
  name: '',
  email: '',
  message: ''
})

// 打字机效果文本
const fullText = '.NET & C# 开发者 | 后端工程师 | 技术爱好者'
let typingIndex = 0
let typingTimer = null

// 技能数据
const skills = ref([
  { name: 'C#', icon: '💎', level: 95 },
  { name: '.NET Core', icon: '🔷', level: 90 },
  { name: 'ASP.NET', icon: '🌐', level: 88 },
  { name: 'SQL Server', icon: '🗄️', level: 85 },
  { name: 'Vue.js', icon: '💚', level: 80 },
  { name: 'Git', icon: '📦', level: 85 },
  { name: 'Docker', icon: '🐳', level: 75 },
  { name: 'Azure', icon: '☁️', level: 70 }
])

// 打字机效果
const typeText = () => {
  if (typingIndex < fullText.length) {
    typedText.value += fullText.charAt(typingIndex)
    typingIndex++
    typingTimer = setTimeout(typeText, 100)
  }
}

// 动画完成回调
const handleAnimationComplete = () => {
  showContent.value = true
  document.body.style.overflow = '' // Unlock scroll
  // Start typing effect only after content is shown
  setTimeout(typeText, 500)
}

// 滚动处理
const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

// 导航点击处理
const handleNavClick = async (e) => {
  e.preventDefault()
  const href = e.currentTarget.getAttribute('href')
  
  // 如果当前不是主页，先切换回主页
  if (currentView.value !== 'home') {
    currentView.value = 'home'
    await nextTick()
  }
  
  const section = document.querySelector(href)
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' })
  }
  closeMobileMenu()
}

// 平滑滚动 (保留用于兼容)
const scrollToSection = handleNavClick

// 移动菜单
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

// 星星样式
const getStarStyle = (index) => {
  return {
    left: Math.random() * 100 + '%',
    top: Math.random() * 100 + '%',
    animationDelay: Math.random() * 3 + 's',
    animationDuration: (Math.random() * 2 + 2) + 's'
  }
}

// 表单提交
const handleSubmit = () => {
  alert('感谢您的留言！这是一个演示页面，实际项目中需要连接后端API。')
  form.value = { name: '', email: '', message: '' }
}

// 生命周期
onMounted(() => {
  // Force scroll to top on refresh
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual'
  }
  window.scrollTo(0, 0)
  document.body.style.overflow = 'hidden' // Lock scroll initially
  
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (typingTimer) clearTimeout(typingTimer)
})
</script>

<style>
/* Global styles for transitions */
.main-content {
  opacity: 0;
  transition: opacity 1.5s ease-out;
}

.main-content.visible {
  opacity: 1;
}


</style>
```
