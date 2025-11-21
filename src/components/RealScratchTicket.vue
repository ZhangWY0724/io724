<template>
  <div class="real-ticket-container" :style="containerStyle" ref="ticketContainer">
    <!-- Header -->
    <div class="ticket-header">
      <div class="header-top">
        <span class="ticket-price">￥{{ config.price }}</span>
        <span class="ticket-id">NO.{{ ticketId }}</span>
      </div>
      <div class="header-title">
        <h1>{{ title }}</h1>
        <div class="max-prize">最高奖金{{ config.maxPrize }}</div>
      </div>
    </div>

    <!-- Game Area Wrapper -->
    <div class="game-area-wrapper" ref="gameArea">
      <!-- Canvas Overlay -->
      <ScratchCanvas
        v-if="canvasReady"
        :width="canvasWidth"
        :height="canvasHeight"
        :cover-color="theme.scratchColor || '#C0C0C0'"
        :zones="scratchZones"
        @zone-revealed="handleZoneReveal"
        class="scratch-overlay"
      />

      <!-- Underlying Game Content -->
      <div class="ticket-body">
        <!-- Winning Numbers (Standard Mode Only) -->
        <div v-if="gameType === 'standard'" class="game-section winning-section">
          <div class="section-label">中奖号码</div>
          <div class="winning-numbers-row">
            <div 
              v-for="(num, index) in winningNumbers" 
              :key="'win-'+index"
              class="number-box winning-box"
              :ref="el => setZoneRef(el, 'win', index)"
            >
              <div class="number-reveal winning-num">{{ num }}</div>
              <div class="cover-hint" v-if="!winningZones[index]?.isRevealed">👑</div>
            </div>
          </div>
        </div>

        <!-- Your Numbers / Play Area -->
        <div class="game-section play-section">
          <div class="section-label">{{ playAreaLabel }}</div>
          <div class="play-area-grid">
            <div 
              v-for="(spot, index) in playSpots" 
              :key="'play-'+index"
              class="play-spot-wrapper"
            >
              <div 
                class="number-box play-box"
                :class="{ 'is-match': shouldHighlight(spot) }"
                :ref="el => setZoneRef(el, 'play', index)"
              >
                <div class="spot-reveal">
                  <div class="spot-number">{{ spot.number }}</div>
                  <div class="spot-prize" v-if="spot.prize">{{ spot.prize }}</div>
                </div>
                <div class="cover-hint" v-if="!spot.isRevealed">{{ getCoverIcon(index) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="ticket-footer">
      <div class="rules">
        <p>玩法说明：刮开覆盖膜，如果任意“我的号码”与“中奖号码”相同，即可获得该“我的号码”下方所对应的奖金。</p>
      </div>
      <div class="barcode">||| |||| || ||| ||||| |||</div>
    </div>

    <!-- Win Message Overlay -->
    <div v-if="totalWin > 0 && allRevealed" class="win-celebration">
      <div class="win-text">恭喜中奖!</div>
      <div class="win-amount">￥{{ totalWin }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import ScratchCanvas from './ScratchCanvas.vue'

const props = defineProps({
  title: { type: String, default: '刮刮乐' },
  width: { type: Number, default: 400 },
  height: { type: Number, default: 600 },
  config: {
    type: Object,
    default: () => ({
      winningCount: 3,
      playCount: 9,
      price: 10,
      maxPrize: '30万',
      gameType: 'standard', // standard, find_symbol, match_three
      targetSymbol: '7' // for find_symbol
    })
  },
  theme: {
    type: Object,
    default: () => ({
      primary: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
      secondary: '#fff',
      text: '#333',
      scratchColor: '#FFD700'
    })
  }
})

const emit = defineEmits(['win', 'game-over'])

// Game State
const winningNumbers = ref([])
const playSpots = ref([])
const revealedCount = ref(0)
const ticketId = ref(Math.floor(Math.random() * 89999999) + 10000000)

// Canvas & Zones State
const ticketContainer = ref(null)
const gameArea = ref(null)
const canvasReady = ref(false)
const canvasWidth = ref(0)
const canvasHeight = ref(0)
const scratchZones = ref([])
const zoneRefs = ref({}) // Map of id -> element
const winningZones = ref([]) // Track revealed state separately for UI hints

// Computed
const gameType = computed(() => props.config.gameType || 'standard')

const playAreaLabel = computed(() => {
  if (gameType.value === 'find_symbol') return '刮出 "' + props.config.targetSymbol + '" 中奖'
  if (gameType.value === 'match_three') return '刮出3个相同金额中奖'
  return '我的号码'
})

const containerStyle = computed(() => ({
  width: props.width + 'px',
  minHeight: props.height + 'px',
  background: props.theme.primary,
  color: props.theme.text
}))

const totalWin = computed(() => {
  if (gameType.value === 'match_three') {
    const counts = {}
    playSpots.value.forEach(s => {
      if (s.isRevealed) {
        counts[s.number] = (counts[s.number] || 0) + 1
      }
    })
    
    let win = 0
    for (const [amount, count] of Object.entries(counts)) {
      if (count >= 3) {
        win = parsePrize(amount)
        break
      }
    }
    return win
  }
  
  // Standard & Find Symbol
  return playSpots.value
    .filter(s => s.isRevealed && (gameType.value === 'standard' ? shouldHighlight(s) : s.isMatch))
    .reduce((sum, s) => sum + parsePrize(s.prize), 0)
})

const allRevealed = computed(() => {
  const requiredReveals = gameType.value === 'standard' 
    ? props.config.winningCount + props.config.playCount 
    : props.config.playCount
  return revealedCount.value >= requiredReveals
})

// Helpers
const shouldHighlight = (spot) => {
  if (!spot.isMatch || !spot.isRevealed) return false
  
  if (gameType.value === 'standard') {
    const winIndex = winningNumbers.value.indexOf(spot.number)
    return winIndex !== -1 && winningZones.value[winIndex]?.isRevealed
  }
  
  return true
}

const parsePrize = (str) => {
  if (!str) return 0
  if (str.includes('万')) return parseInt(str) * 10000
  return parseInt(str.replace(/[^\d]/g, '')) || 0
}

const getCoverIcon = (index) => {
  if (gameType.value === 'find_symbol') return '❓'
  if (gameType.value === 'match_three') return '💎'
  return '💰'
}

const getRandomNumber = () => Math.floor(Math.random() * 50) + 1

const setZoneRef = (el, type, index) => {
  if (el) {
    zoneRefs.value[`${type}-${index}`] = el
  }
}

// Zone Calculation
const calculateZones = () => {
  if (!gameArea.value) return
  
  const areaRect = gameArea.value.getBoundingClientRect()
  canvasWidth.value = areaRect.width
  canvasHeight.value = areaRect.height
  
  const zones = []
  
  // Winning Numbers Zones
  if (gameType.value === 'standard') {
    winningNumbers.value.forEach((_, index) => {
      const el = zoneRefs.value[`win-${index}`]
      if (el) {
        const rect = el.getBoundingClientRect()
        zones.push({
          id: `win-${index}`,
          x: rect.left - areaRect.left,
          y: rect.top - areaRect.top,
          w: rect.width,
          h: rect.height,
          revealed: winningZones.value[index]?.isRevealed || false
        })
      }
    })
  }
  
  // Play Spots Zones
  playSpots.value.forEach((spot, index) => {
    const el = zoneRefs.value[`play-${index}`]
    if (el) {
      const rect = el.getBoundingClientRect()
      zones.push({
        id: `play-${index}`,
        x: rect.left - areaRect.left,
        y: rect.top - areaRect.top,
        w: rect.width,
        h: rect.height,
        revealed: spot.isRevealed
      })
    }
  })
  
  scratchZones.value = zones
  canvasReady.value = true
}

const handleZoneReveal = (id) => {
  const [type, indexStr] = id.split('-')
  const index = parseInt(indexStr)
  
  if (type === 'win') {
    if (!winningZones.value[index].isRevealed) {
      winningZones.value[index].isRevealed = true
      revealedCount.value++
    }
  } else if (type === 'play') {
    if (!playSpots.value[index].isRevealed) {
      playSpots.value[index].isRevealed = true
      revealedCount.value++
    }
  }
  
  checkGameEnd()
}

const generateGame = async () => {
  canvasReady.value = false
  revealedCount.value = 0
  ticketId.value = Math.floor(Math.random() * 89999999) + 10000000
  winningNumbers.value = []
  playSpots.value = []
  winningZones.value = []
  zoneRefs.value = {}

  const isWinner = Math.random() < 0.3
  const winAmounts = [10, 20, 50, 100, 500, 1000]
  const winAmount = isWinner ? winAmounts[Math.floor(Math.random() * winAmounts.length)] : 0

  // --- STANDARD MODE ---
  if (gameType.value === 'standard') {
    const wins = new Set()
    while(wins.size < props.config.winningCount) {
      wins.add(getRandomNumber())
    }
    winningNumbers.value = Array.from(wins)
    winningZones.value = winningNumbers.value.map(() => ({ isRevealed: false }))

    const spots = []
    let winningSpotIndex = -1
    if (isWinner) {
      winningSpotIndex = Math.floor(Math.random() * props.config.playCount)
    }

    for (let i = 0; i < props.config.playCount; i++) {
      let number, prize
      if (i === winningSpotIndex) {
        number = winningNumbers.value[Math.floor(Math.random() * winningNumbers.value.length)]
        prize = '￥' + winAmount
      } else {
        do {
          number = getRandomNumber()
        } while (winningNumbers.value.includes(number))
        prize = '￥' + winAmounts[Math.floor(Math.random() * winAmounts.length)]
      }
      spots.push({ number, prize, isRevealed: false, isMatch: winningNumbers.value.includes(number) })
    }
    playSpots.value = spots
  }
  
  // --- FIND SYMBOL MODE ---
  else if (gameType.value === 'find_symbol') {
    const target = props.config.targetSymbol || '7'
    const spots = []
    let winningSpotIndex = -1
    if (isWinner) {
      winningSpotIndex = Math.floor(Math.random() * props.config.playCount)
    }

    for (let i = 0; i < props.config.playCount; i++) {
      let number, prize
      if (i === winningSpotIndex) {
        number = target
        prize = '￥' + winAmount
      } else {
        do {
          number = getRandomNumber()
        } while (number == target)
        prize = '￥' + winAmounts[Math.floor(Math.random() * winAmounts.length)]
      }
      spots.push({ number, prize, isRevealed: false, isMatch: number == target })
    }
    playSpots.value = spots
  }

  // --- MATCH THREE MODE ---
  else if (gameType.value === 'match_three') {
    const spots = []
    const amounts = winAmounts.map(a => '￥' + a)
    
    if (isWinner) {
      const targetAmount = '￥' + winAmount
      const indices = new Set()
      while(indices.size < 3) {
        indices.add(Math.floor(Math.random() * props.config.playCount))
      }
      for (let i = 0; i < props.config.playCount; i++) {
        if (indices.has(i)) {
          spots.push({ number: targetAmount, prize: '', isRevealed: false, isMatch: false })
        } else {
          let amount
          do {
            amount = amounts[Math.floor(Math.random() * amounts.length)]
          } while (amount === targetAmount)
          spots.push({ number: amount, prize: '', isRevealed: false, isMatch: false })
        }
      }
    } else {
      for (let i = 0; i < props.config.playCount; i++) {
        const amount = amounts[i % amounts.length]
        spots.push({ number: amount, prize: '', isRevealed: false, isMatch: false })
      }
      for (let i = spots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [spots[i], spots[j]] = [spots[j], spots[i]];
      }
    }
    playSpots.value = spots
  }
  
  // Wait for DOM update to calculate zones
  await nextTick()
  // Small delay to ensure layout is stable (transitions etc)
  setTimeout(calculateZones, 100)
}

watch(revealedCount, () => {
  if (gameType.value === 'match_three') {
    const counts = {}
    playSpots.value.forEach(s => {
      if (s.isRevealed) {
        counts[s.number] = (counts[s.number] || 0) + 1
      }
    })
    let winningAmount = null
    for (const [amount, count] of Object.entries(counts)) {
      if (count >= 3) {
        winningAmount = amount
        break
      }
    }
    playSpots.value.forEach(s => {
      s.isMatch = s.isRevealed && s.number === winningAmount
    })
  }
})

const checkGameEnd = () => {
  if (allRevealed.value) {
    emit('game-over', totalWin.value)
  }
}

onMounted(() => {
  generateGame()
  window.addEventListener('resize', calculateZones)
})
</script>

<style scoped>
.real-ticket-container {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  user-select: none;
  display: flex;
  flex-direction: column;
  padding: 20px;
  border: 1px solid rgba(255,255,255,0.2);
}

.game-area-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.scratch-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 20;
}

/* Header */
.ticket-header {
  text-align: center;
  margin-bottom: 20px;
  position: relative;
}

.header-top {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 10px;
  font-family: monospace;
}

.header-title h1 {
  margin: 0;
  font-size: 36px;
  font-weight: 900;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  letter-spacing: 2px;
}

.max-prize {
  font-size: 14px;
  font-weight: bold;
  background: rgba(255,255,255,0.2);
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  margin-top: 5px;
}

/* Body */
.ticket-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.game-section {
  background: rgba(255,255,255,0.9);
  border-radius: 10px;
  padding: 15px;
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.1);
  position: relative;
  border: 2px dashed #ccc;
}

.section-label {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: #fff;
  padding: 2px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
}

.winning-numbers-row {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 5px;
}

.play-area-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 5px;
}

.play-spot-wrapper {
  display: flex;
  justify-content: center;
}

/* Number Boxes */
.number-box {
  width: 80px;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.winning-box {
  width: 60px;
  height: 60px;
}

.cover-hint {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: rgba(0,0,0,0.1); /* Faint hint under canvas */
  z-index: 1;
}

/* Reveal Content */
.number-reveal {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  z-index: 2;
}

.spot-reveal {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.play-box.is-match {
  background: #fffacd;
}

.play-box.is-match .spot-number {
  color: #e53e3e;
}

.spot-number {
  font-size: 24px;
  font-weight: 900;
  color: #333;
}

.spot-prize {
  font-size: 12px;
  color: #666;
  font-weight: bold;
}

/* Footer */
.ticket-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 10px;
  opacity: 0.7;
}

.rules {
  margin-bottom: 10px;
  line-height: 1.4;
}

.barcode {
  font-family: 'Libre Barcode 39', monospace;
  font-size: 24px;
  letter-spacing: 2px;
  transform: scaleY(0.8);
}

/* Win Animation */
.win-celebration {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 215, 0, 0.95);
  padding: 20px 40px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 0 50px rgba(255, 215, 0, 0.5);
  z-index: 100;
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.win-text {
  font-size: 24px;
  font-weight: bold;
  color: #d35400;
}

.win-amount {
  font-size: 48px;
  font-weight: 900;
  color: #c0392b;
}

@keyframes popIn {
  from { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
  to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}
</style>
