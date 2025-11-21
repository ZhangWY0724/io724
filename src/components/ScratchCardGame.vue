<template>
  <div class="scratch-game-container">
    <!-- 头部导航 -->
    <div class="game-header">
      <button class="back-btn" @click="handleBack">
        {{ isPlaying ? '← 返回大厅' : '← 返回首页' }}
      </button>
      <h2>{{ isPlaying ? selectedCard.title : '刮刮乐大厅' }}</h2>
    </div>
    
    <!-- 大厅视图：展示所有种类 -->
    <div v-if="!isPlaying" class="lobby-grid">
      <div 
        v-for="(card, index) in cardTypes" 
        :key="index" 
        class="card-preview"
        @click="selectCard(card)"
      >
        <div 
          class="preview-visual" 
          :style="{ 
            backgroundImage: `url(${card.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }"
        >
          <!-- <span class="preview-icon">{{ card.icon }}</span> -->
          <span class="preview-price">面值: {{ card.price }}元</span>
        </div>
        <div class="preview-info">
          <h3>{{ card.title }}</h3>
          <p>最高奖金: {{ card.maxPrize }}</p>
        </div>
      </div>
    </div>

    <!-- 游戏视图：具体的刮刮乐页面 -->
    <div v-else class="game-area">
      <div class="ticket-container">
        <RealScratchTicket
          :key="ticketKey"
          :title="selectedCard.title"
          :config="selectedCard.config"
          :theme="selectedCard.theme"
          :width="400"
          :height="600"
          @game-over="handleGameOver"
        />
        
        <div class="game-controls">
          <p class="instruction" v-if="!gameEnded">刮开所有区域看看中奖了吗！</p>
          <p class="result-msg" v-else>
            {{ winAmount > 0 ? '恭喜！你赢得了 ￥' + winAmount : '很遗憾，未中奖' }}
          </p>
          <button class="btn btn-primary play-again-btn" @click="playAgain" v-if="gameEnded">
            再来一张
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import RealScratchTicket from './RealScratchTicket.vue'

const emit = defineEmits(['back'])

// 状态
const isPlaying = ref(false)
const selectedCard = ref(null)
const ticketKey = ref(0) // 用于强制重置组件
const gameEnded = ref(false)
const winAmount = ref(0)

// 常见的刮刮乐种类
const cardTypes = [
  { 
    title: '喜相逢', 
    price: 10, 
    maxPrize: '30万', 
    image: '/images/scratch_cards/xi_xiang_feng.png',
    config: { winningCount: 2, playCount: 6, price: 10, maxPrize: '30万', gameType: 'standard' },
    theme: {
      primary: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
      secondary: '#ff758c',
      text: '#c0392b',
      scratchColor: '#FFD700'
    }
  },
  { 
    title: '超级777', 
    price: 20, 
    maxPrize: '100万', 
    image: '/images/scratch_cards/super_777.png',
    config: { winningCount: 0, playCount: 9, price: 20, maxPrize: '100万', gameType: 'find_symbol', targetSymbol: '7' },
    theme: {
      primary: 'linear-gradient(135deg, #1a1a1a 0%, #434343 100%)',
      secondary: '#d4af37',
      text: '#d4af37',
      scratchColor: '#d4af37'
    }
  },
  { 
    title: '好运十倍', 
    price: 10, 
    maxPrize: '40万', 
    image: '/images/scratch_cards/lucky_10x.png',
    config: { winningCount: 0, playCount: 12, price: 10, maxPrize: '40万', gameType: 'find_symbol', targetSymbol: '10X' },
    theme: {
      primary: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
      secondary: '#2ecc71',
      text: '#27ae60',
      scratchColor: '#C0C0C0'
    }
  },
  { 
    title: '点石成金', 
    price: 20, 
    maxPrize: '100万', 
    image: '/images/scratch_cards/gold_touch.png',
    config: { winningCount: 0, playCount: 12, price: 20, maxPrize: '100万', gameType: 'match_three' },
    theme: {
      primary: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
      secondary: '#9b59b6',
      text: '#8e44ad',
      scratchColor: '#e0c3fc'
    }
  },
  { 
    title: '大吉大利', 
    price: 5, 
    maxPrize: '10万', 
    image: '/images/scratch_cards/great_luck.png',
    config: { winningCount: 0, playCount: 6, price: 5, maxPrize: '10万', gameType: 'match_three' },
    theme: {
      primary: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)',
      secondary: '#e84393',
      text: '#d63031',
      scratchColor: '#ff758c'
    }
  },
  { 
    title: '财运亨通', 
    price: 10, 
    maxPrize: '25万', 
    image: '/images/scratch_cards/wealth_flow.png',
    config: { winningCount: 0, playCount: 9, price: 10, maxPrize: '25万', gameType: 'match_three' },
    theme: {
      primary: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      secondary: '#0984e3',
      text: '#0984e3',
      scratchColor: '#74b9ff'
    }
  },
  { 
    title: '年年有余', 
    price: 10, 
    maxPrize: '20万', 
    image: '/images/scratch_cards/abundance.png',
    config: { winningCount: 0, playCount: 9, price: 10, maxPrize: '20万', gameType: 'find_symbol', targetSymbol: '🐟' },
    theme: {
      primary: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      secondary: '#00b894',
      text: '#00b894',
      scratchColor: '#55efc4'
    }
  },
  { 
    title: '龙年大悦', 
    price: 30, 
    maxPrize: '150万', 
    image: '/images/scratch_cards/wealth_flow.png', // Placeholder
    config: { winningCount: 0, playCount: 15, price: 30, maxPrize: '150万', gameType: 'find_symbol', targetSymbol: '🐲' },
    theme: {
      primary: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      secondary: '#fdcb6e',
      text: '#e17055',
      scratchColor: '#fab1a0'
    }
  }
]

// 逻辑处理
const selectCard = (card) => {
  selectedCard.value = card
  startNewGame()
  isPlaying.value = true
}

const startNewGame = () => {
  gameEnded.value = false
  winAmount.value = 0
  ticketKey.value++ // 强制重新渲染组件
}

const playAgain = () => {
  startNewGame()
}

const handleBack = () => {
  if (isPlaying.value) {
    isPlaying.value = false
    selectedCard.value = null
  } else {
    emit('back')
  }
}

const handleGameOver = (amount) => {
  winAmount.value = amount
  gameEnded.value = true
}
</script>

<style scoped>
.scratch-game-container {
  padding: 100px 20px 40px;
  min-height: 100vh;
  background: rgba(15, 23, 42, 0.95);
  color: white;
}

.game-header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 40px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.back-btn {
  position: absolute;
  left: 0;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
  z-index: 10;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

h2 {
  font-size: 32px;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

/* 大厅网格 */
.lobby-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.card-preview {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.card-preview:hover {
  transform: translateY(-10px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.3);
}

.preview-visual {
  height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  position: relative;
  background-size: cover;
  background-position: center;
  padding-bottom: 10px;
}

.preview-icon {
  font-size: 48px;
  margin-bottom: 10px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

.preview-price {
  background: rgba(0,0,0,0.3);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: bold;
}

.preview-info {
  padding: 15px;
  text-align: center;
}

.preview-info h3 {
  margin: 0 0 5px 0;
  color: #fff;
  font-size: 18px;
}

.preview-info p {
  margin: 0;
  color: #a0aec0;
  font-size: 14px;
}

/* 游戏区域 */
.game-area {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
  animation: fadeIn 0.5s ease;
}

.ticket-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

.game-controls {
  text-align: center;
  min-height: 80px;
}

.instruction {
  font-size: 18px;
  color: #a0aec0;
  animation: pulse 2s infinite;
}

.result-msg {
  font-size: 24px;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 20px;
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.play-again-btn {
  font-size: 18px;
  padding: 12px 36px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

@keyframes popIn {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .lobby-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  .preview-visual {
    height: 100px;
  }
  
  .preview-icon {
    font-size: 32px;
  }
}
</style>
