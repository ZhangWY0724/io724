<template>
  <canvas ref="canvas" class="gravity-background"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineEmits } from 'vue'

const emit = defineEmits(['animation-complete'])
const canvas = ref(null)
let ctx = null
let animationFrameId = null
let backgroundStars = []
let accentStars = []
let nebulaClouds = []
let shootingStars = []
let mouseTrails = []
let milkyWayStars = []
let milkyWayDust = [] // New: Dust particles
let constellationStars = []
let ringLayout = null
let currentConnections = []
let previousConstellationStars = []
let previousConnections = []

let previousHue = 45
let tick = 0
let activeSign = 'Leo'
let canvasSize = { width: 0, height: 0 }
let hoverSegment = null
let isPointerOver = false
let transitionProgress = 1
const transitionSpeed = 0.025
let warpSpeed = 0 

// Intro Animation State
const introState = {
  opacity: 0,        // Phase 1: Background fade in
  ringProgress: 0,   // Phase 2: Ring draw
  constellationOpacity: 0, // Phase 3: Constellation fade in
  finished: false
}

// Elemental Colors for Dynamic Themes
const elementalThemes = {
  Fire: { hue: 20, sat: 80, light: 60, base: '#2a1010' }, // Leo, Aries, Sagittarius
  Earth: { hue: 140, sat: 60, light: 50, base: '#0f2015' }, // Taurus, Virgo, Capricorn
  Air: { hue: 200, sat: 70, light: 70, base: '#101a2a' }, // Gemini, Libra, Aquarius
  Water: { hue: 240, sat: 80, light: 65, base: '#10102a' } // Cancer, Scorpio, Pisces
}

const signElements = {
  Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
  Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
  Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
  Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water'
}

let currentTheme = { ...elementalThemes.Fire }
let targetTheme = { ...elementalThemes.Fire }

const lerp = (a, b, t) => a + (b - a) * t
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

const getActiveHue = () => constellationDefinitions[activeSign]?.hue ?? 45

const normalizeAngle = (value) => {
  let angle = value % (Math.PI * 2)
  if (angle < 0) angle += Math.PI * 2
  return angle
}

const isAngleWithinSegment = (angle, start, end) => {
  if (start <= end) {
    return angle >= start && angle <= end
  }
  return angle >= start || angle <= end
}

const mouse = {
  x: -9999,
  y: -9999,
  lastX: -9999,
  lastY: -9999,
  active: false
}

const drawAccentStars = () => {
  accentStars.forEach((star) => {
    const offset = Math.sin(tick * star.swaySpeed + star.phase) * star.swayRange
    const x = star.baseX + offset
    const y = star.baseY + offset * 0.3

    const glow = ctx.createRadialGradient(x, y, 0, x, y, star.size * 3)
    glow.addColorStop(0, 'rgba(255, 255, 255, 0.6)')
    glow.addColorStop(0.4, `hsla(${star.hue}, 80%, 65%, 0.5)`)
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)')

    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(x, y, star.size * 2.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.beginPath()
    ctx.arc(x, y, star.size * 0.5, 0, Math.PI * 2)
    ctx.fill()
  })
}

const zodiacRing = [
  { name: 'Aries', icon: '♈', angle: -70, hue: 210 },
  { name: 'Taurus', icon: '♉', angle: -40, hue: 220 },
  { name: 'Gemini', icon: '♊', angle: -10, hue: 230 },
  { name: 'Cancer', icon: '♋', angle: 20, hue: 200 },
  { name: 'Leo', icon: '♌', angle: 50, hue: 45 },
  { name: 'Virgo', icon: '♍', angle: 80, hue: 180 },
  { name: 'Libra', icon: '♎', angle: 110, hue: 160 },
  { name: 'Scorpio', icon: '♏', angle: 140, hue: 330 },
  { name: 'Sagittarius', icon: '♐', angle: 170, hue: 300 },
  { name: 'Capricorn', icon: '♑', angle: 200, hue: 260 },
  { name: 'Aquarius', icon: '♒', angle: 230, hue: 250 },
  { name: 'Pisces', icon: '♓', angle: 260, hue: 240 }
]

const constellationDefinitions = {
  Leo: {
    hue: 45,
    stars: [
      { name: 'Regulus', x: 0.18, y: 0.35, size: 4.6 },
      { name: 'Eta Leonis', x: 0.28, y: 0.27, size: 3.4 },
      { name: 'Algieba', x: 0.36, y: 0.32, size: 3.9 },
      { name: 'Adhafera', x: 0.44, y: 0.28, size: 3.2 },
      { name: 'Ras Elased Australis', x: 0.5, y: 0.24, size: 2.8 },
      { name: 'Subra', x: 0.58, y: 0.22, size: 2.4 },
      { name: 'Zosma', x: 0.64, y: 0.38, size: 3.6 },
      { name: 'Chertan', x: 0.74, y: 0.46, size: 3.3 },
      { name: 'Denebola', x: 0.84, y: 0.52, size: 4.1 }
    ],
    connections: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [2, 6],
      [6, 7],
      [7, 8]
    ]
  },
  Aries: {
    hue: 210,
    stars: [
      { x: 0.18, y: 0.68, size: 2.4 },
      { x: 0.3, y: 0.58, size: 3.2 },
      { x: 0.4, y: 0.52, size: 2.8 },
      { x: 0.52, y: 0.46, size: 2.6 },
      { x: 0.62, y: 0.38, size: 2.4 },
      { x: 0.72, y: 0.32, size: 2.3 },
      { x: 0.82, y: 0.28, size: 2.0 },
      { x: 0.66, y: 0.24, size: 2.1 }
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [4, 7]]
  },
  Taurus: {
    hue: 220,
    stars: [
      { x: 0.2, y: 0.76, size: 2.7 },
      { x: 0.32, y: 0.66, size: 3.1 },
      { x: 0.44, y: 0.62, size: 2.7 },
      { x: 0.54, y: 0.52, size: 3.4 },
      { x: 0.62, y: 0.42, size: 2.6 },
      { x: 0.7, y: 0.32, size: 2.4 },
      { x: 0.8, y: 0.26, size: 2.2 },
      { x: 0.62, y: 0.24, size: 2.3 },
      { x: 0.48, y: 0.28, size: 2.1 }
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [4, 7], [7, 8], [3, 8]]
  },
  Gemini: {
    hue: 230,
    stars: [
      { x: 0.2, y: 0.76, size: 2.6 },
      { x: 0.3, y: 0.64, size: 2.4 },
      { x: 0.38, y: 0.52, size: 2.6 },
      { x: 0.46, y: 0.4, size: 2.5 },
      { x: 0.54, y: 0.28, size: 2.4 },
      { x: 0.34, y: 0.3, size: 2.2 },
      { x: 0.42, y: 0.18, size: 2.2 },
      { x: 0.62, y: 0.68, size: 2.6 },
      { x: 0.72, y: 0.58, size: 2.4 },
      { x: 0.8, y: 0.46, size: 2.5 },
      { x: 0.74, y: 0.32, size: 2.3 },
      { x: 0.66, y: 0.2, size: 2.2 }
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6], [7, 8], [8, 9], [9, 10], [10, 11], [8, 4]]
  },
  Cancer: {
    hue: 200,
    stars: [
      { x: 0.22, y: 0.64, size: 2.3 },
      { x: 0.32, y: 0.56, size: 2.4 },
      { x: 0.4, y: 0.48, size: 2.6 },
      { x: 0.5, y: 0.4, size: 2.5 },
      { x: 0.58, y: 0.34, size: 2.3 },
      { x: 0.66, y: 0.3, size: 2.2 },
      { x: 0.74, y: 0.36, size: 2.1 },
      { x: 0.6, y: 0.24, size: 2.0 },
      { x: 0.46, y: 0.3, size: 2.1 }
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [4, 7], [7, 8], [3, 8]]
  },
  Virgo: {
    hue: 180,
    stars: [
      { x: 0.26, y: 0.78, size: 2.6 },
      { x: 0.34, y: 0.66, size: 2.7 },
      { x: 0.42, y: 0.56, size: 2.5 },
      { x: 0.54, y: 0.48, size: 2.6 },
      { x: 0.64, y: 0.4, size: 2.4 },
      { x: 0.74, y: 0.32, size: 2.3 },
      { x: 0.82, y: 0.22, size: 2.1 },
      { x: 0.58, y: 0.28, size: 2.2 },
      { x: 0.44, y: 0.34, size: 2.1 }
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [4, 7], [7, 8], [3, 8]]
  },
  Libra: {
    hue: 160,
    stars: [
      { x: 0.24, y: 0.72, size: 2.5 },
      { x: 0.34, y: 0.6, size: 2.6 },
      { x: 0.46, y: 0.56, size: 2.7 },
      { x: 0.56, y: 0.48, size: 2.5 },
      { x: 0.66, y: 0.42, size: 2.4 },
      { x: 0.76, y: 0.34, size: 2.3 },
      { x: 0.82, y: 0.24, size: 2.1 },
      { x: 0.58, y: 0.3, size: 2.2 }
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [3, 7], [7, 1]]
  },
  Scorpio: {
    hue: 330,
    stars: [
      { x: 0.18, y: 0.74, size: 3.2 },
      { x: 0.28, y: 0.64, size: 3.0 },
      { x: 0.4, y: 0.56, size: 2.8 },
      { x: 0.5, y: 0.48, size: 2.7 },
      { x: 0.6, y: 0.4, size: 2.5 },
      { x: 0.7, y: 0.34, size: 2.4 },
      { x: 0.78, y: 0.28, size: 2.3 },
      { x: 0.82, y: 0.2, size: 2.1 },
      { x: 0.74, y: 0.16, size: 2.0 },
      { x: 0.64, y: 0.18, size: 2.2 },
      { x: 0.5, y: 0.26, size: 2.3 }
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [7, 9], [4, 10]]
  },
  Sagittarius: {
    hue: 300,
    stars: [
      { x: 0.2, y: 0.74, size: 2.7 },
      { x: 0.3, y: 0.64, size: 2.6 },
      { x: 0.4, y: 0.56, size: 2.4 },
      { x: 0.5, y: 0.48, size: 2.6 },
      { x: 0.6, y: 0.4, size: 2.5 },
      { x: 0.7, y: 0.34, size: 2.3 },
      { x: 0.78, y: 0.28, size: 2.2 },
      { x: 0.7, y: 0.22, size: 2.1 },
      { x: 0.58, y: 0.26, size: 2.2 },
      { x: 0.46, y: 0.3, size: 2.2 },
      { x: 0.52, y: 0.18, size: 2.0 }
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [4, 8], [8, 9], [9, 10]]
  },
  Capricorn: {
    hue: 260,
    stars: [
      { x: 0.22, y: 0.7, size: 2.6 },
      { x: 0.32, y: 0.6, size: 2.5 },
      { x: 0.42, y: 0.52, size: 2.4 },
      { x: 0.52, y: 0.46, size: 2.3 },
      { x: 0.62, y: 0.4, size: 2.3 },
      { x: 0.72, y: 0.34, size: 2.2 },
      { x: 0.78, y: 0.26, size: 2.1 },
      { x: 0.64, y: 0.24, size: 2.1 },
      { x: 0.5, y: 0.32, size: 2.2 }
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [4, 7], [7, 8], [3, 8]]
  },
  Aquarius: {
    hue: 250,
    stars: [
      { x: 0.18, y: 0.72, size: 2.5 },
      { x: 0.3, y: 0.66, size: 2.4 },
      { x: 0.42, y: 0.6, size: 2.4 },
      { x: 0.54, y: 0.54, size: 2.3 },
      { x: 0.66, y: 0.48, size: 2.3 },
      { x: 0.76, y: 0.4, size: 2.2 },
      { x: 0.84, y: 0.32, size: 2.1 },
      { x: 0.74, y: 0.26, size: 2.1 },
      { x: 0.62, y: 0.3, size: 2.1 },
      { x: 0.5, y: 0.34, size: 2.1 },
      { x: 0.58, y: 0.22, size: 2.0 }
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [4, 7], [7, 8], [8, 9], [9, 10]]
  },
  Pisces: {
    hue: 240,
    stars: [
      { x: 0.2, y: 0.72, size: 2.4 },
      { x: 0.3, y: 0.64, size: 2.5 },
      { x: 0.4, y: 0.56, size: 2.4 },
      { x: 0.5, y: 0.48, size: 2.3 },
      { x: 0.6, y: 0.4, size: 2.2 },
      { x: 0.7, y: 0.32, size: 2.2 },
      { x: 0.78, y: 0.24, size: 2.1 },
      { x: 0.66, y: 0.2, size: 2.0 },
      { x: 0.54, y: 0.28, size: 2.1 },
      { x: 0.42, y: 0.34, size: 2.1 }
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [4, 7], [7, 8], [8, 9]]
  }
}

const createBackgroundStars = (count, width, height) => {
  const stars = []
  // Create more stars for better density
  for (let i = 0; i < count * 1.5; i++) {
    const z = Math.random() * 2 + 0.5 // Depth factor
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      z: z,
      baseSize: (Math.random() * 1.2 + 0.3) / z, // Distant stars are smaller
      size: 0, // Will be calculated
      speed: (0.02 + Math.random() * 0.05) / z, // Distant stars move slower
      alpha: 0.1 + Math.random() * 0.4,
      hue: Math.random() > 0.8 ? (Math.random() * 60 + 200) : 0, // Mostly white, some blue/purple
      twinkleOffset: Math.random() * 100,
      twinkleSpeed: 0.01 + Math.random() * 0.03
    })
  }
  return stars
}

const createNebulaClouds = (width, height) => {
  const clouds = []
  const count = 6
  for (let i = 0; i < count; i++) {
    clouds.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.min(width, height) * (0.3 + Math.random() * 0.4),
      hue: Math.random() * 60 + 200, // Blue to Purple range
      alpha: 0.03 + Math.random() * 0.04,
      speed: 0.002 + Math.random() * 0.003,
      offset: Math.random() * Math.PI * 2
    })
  }

  return clouds
}

const createMilkyWayStars = () => {
  const stars = []
  const dust = []
  
  // 1. Galactic Core (Dense center)
  for (let i = 0; i < 400; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = Math.random()
    const radius = dist * 120 // Compact core
    
    dust.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.6,
      size: Math.random() * 2 + 1,
      alpha: (1 - dist) * 0.3,
      hueOffset: Math.random() * 30
    })
  }

  // 2. Spiral Arms (Stars & Dust)
  const armCount = 3
  const particlesPerArm = 1200 // High density for realism
  
  for (let i = 0; i < armCount; i++) {
    for (let j = 0; j < particlesPerArm; j++) {
      const armAngle = (Math.PI * 2 / armCount) * i
      const dist = Math.random()
      // Logarithmic spiral equation
      const spiralAngle = armAngle + dist * 4 
      const radius = 100 + dist * 950 // Enlarge radius (was 600)
      
      // Random scatter that increases with distance
      const scatter = Math.random() * (30 + dist * 100)
      const scatterAngle = Math.random() * Math.PI * 2
      
      const x = Math.cos(spiralAngle) * radius + Math.cos(scatterAngle) * scatter
      const y = (Math.sin(spiralAngle) * radius + Math.sin(scatterAngle) * scatter) * 0.4 // Flattened
      
      const isStar = Math.random() > 0.7 // 30% are bright stars, 70% are dust
      
      if (isStar) {
        stars.push({
          x, y,
          size: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.8 + 0.2,
          hueOffset: Math.random() * 40 - 20
        })
      } else {
        dust.push({
          x, y,
          size: Math.random() * 3 + 2, // Dust is larger but fainter
          alpha: Math.random() * 0.15 + 0.02,
          hueOffset: Math.random() * 40 - 20
        })
      }
    }
  }
  
  return { stars, dust }
}

const buildConstellation = (width, height) => {
  ringLayout = buildRingLayout(width, height)
  canvasSize = { width, height }
  setActiveConstellation(activeSign)
}

const setActiveConstellation = (signName = activeSign) => {
  if (!ringLayout) return
  const fallback = constellationDefinitions['Leo']
  const definition = constellationDefinitions[signName] ?? fallback
  const nextSign = definition ? signName : 'Leo'
  const switching = constellationStars.length > 0 && nextSign !== activeSign

  if (switching) {
    previousConstellationStars = constellationStars.map((star) => ({ ...star }))
    previousConnections = currentConnections.slice()
    previousHue = getActiveHue()
    transitionProgress = 0
  } else if (!constellationStars.length) {
    previousConstellationStars = []
    previousConnections = []
    previousHue = getActiveHue()
    transitionProgress = 1
  }



  activeSign = nextSign
  
  // Update Target Theme
  const element = signElements[activeSign] || 'Fire'
  targetTheme = elementalThemes[element]
  
  // Trigger Warp Effect
  warpSpeed = 2.0

  const stars = definition?.stars ?? fallback.stars

  const bounds = stars.reduce((acc, star) => ({
    minX: Math.min(acc.minX, star.x),
    maxX: Math.max(acc.maxX, star.x),
    minY: Math.min(acc.minY, star.y),
    maxY: Math.max(acc.maxY, star.y)
  }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity })

  const widthRange = Math.max(0.001, bounds.maxX - bounds.minX)
  const heightRange = Math.max(0.001, bounds.maxY - bounds.minY)
  const targetHalfWidth = ringLayout.radiusX * 0.52
  const targetHalfHeight = ringLayout.radiusY * 0.42

  constellationStars = stars.map((star) => {
    const normalizedX = ((star.x - bounds.minX) / widthRange - 0.5) * 2
    const normalizedY = ((star.y - bounds.minY) / heightRange - 0.5) * 2
    const mappedX = ringLayout.centerX + normalizedX * targetHalfWidth
    const mappedY = ringLayout.centerY + normalizedY * targetHalfHeight
    const floatDistance = 8 + Math.random() * 10

    return {
      ...star,
      baseX: mappedX,
      baseY: mappedY,
      x: mappedX,
      y: mappedY,
      pulseOffset: Math.random() * Math.PI * 2,
      currentRadius: star.size ?? 3,
      highlightStrength: 0,
      floatSpeed: 0.0025 + Math.random() * 0.002,
      floatPhaseX: Math.random() * Math.PI * 2,
      floatPhaseY: Math.random() * Math.PI * 2,
      floatDistance
    }
  })

  currentConnections = definition?.connections ?? []
}

const createAccentStars = (count, width, height) =>
  Array.from({ length: count }, () => {
    const side = Math.random() > 0.5 ? 'left' : 'right'
    const x = side === 'left'
      ? Math.random() * width * 0.25
      : width * 0.75 + Math.random() * width * 0.25
    const y = Math.random() * height
    return {
      baseX: x,
      baseY: y,
      swayRange: 6 + Math.random() * 12,
      swaySpeed: 0.005 + Math.random() * 0.01,
      phase: Math.random() * Math.PI * 2,
      size: 1.2 + Math.random() * 1.3,
      hue: 45 + Math.random() * 15
    }
  })

const resizeCanvas = () => {
  if (!canvas.value) return
  const { innerWidth, innerHeight } = window
  canvas.value.width = innerWidth
  canvas.value.height = innerHeight
  backgroundStars = createBackgroundStars(150, innerWidth, innerHeight)
  nebulaClouds = createNebulaClouds(innerWidth, innerHeight)
  const mwData = createMilkyWayStars()
  milkyWayStars = mwData.stars
  milkyWayDust = mwData.dust
  accentStars = createAccentStars(25, innerWidth, innerHeight)
  buildConstellation(innerWidth, innerHeight)
}

const animate = () => {
  if (!canvas.value) return
  tick += 1
  if (transitionProgress < 1) {
    transitionProgress = Math.min(1, transitionProgress + transitionSpeed)
    if (transitionProgress >= 1) {
      previousConstellationStars = []
      previousConnections = []
    }
  }

  if (transitionProgress >= 1) {
    previousConstellationStars = []
    previousConnections = []
  }

  // Intro Animation Logic
  if (!introState.finished) {
    if (introState.opacity < 1) {
      introState.opacity += 0.008 // Phase 1: Slow fade in
    } else if (introState.ringProgress < 1) {
      introState.ringProgress += 0.006 // Phase 2: Slightly faster (was 0.004)
    } else if (introState.constellationOpacity < 1) {
      introState.ringProgress = 1
      introState.constellationOpacity += 0.015 // Phase 3: Fade in constellation
    } else {
      introState.constellationOpacity = 1
      if (!introState.finished) {
        introState.finished = true
        emit('animation-complete') // Phase 4: Signal content
      }
    }
  }

  // Smoothly interpolate theme
  currentTheme.hue = lerp(currentTheme.hue, targetTheme.hue, 0.05)
  currentTheme.base = targetTheme.base // Simple switch for base, or could interpolate RGB
  
  // Decay warp speed
  warpSpeed = lerp(warpSpeed, 0, 0.05)

  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  
  drawDeepSpaceBackground()
  
  // Apply global intro opacity
  ctx.globalAlpha = introState.opacity
  
  // Unified Rotation for Background Elements
  ctx.save()
  ctx.translate(canvas.value.width / 2, canvas.value.height / 2)
  ctx.rotate(tick * 0.0003) // Global rotation speed
  
  // Draw elements centered at (0,0)
  // Note: Background stars and nebula need to be drawn relative to center for rotation to work correctly
  // However, they are currently generated with screen coordinates (0 to width, 0 to height).
  // We need to offset them by (-width/2, -height/2) during drawing or generation.
  // For simplicity, we'll translate back temporarily for them if they rely on absolute coords, 
  // BUT to rotate them, they must be drawn in the rotated context.
  // Let's adjust the draw functions to handle this or just translate context back and forth?
  // Actually, easiest is to translate context to top-left (-w/2, -h/2) inside the rotated frame.
  ctx.translate(-canvas.value.width / 2, -canvas.value.height / 2)
  
  drawMilkyWay() // Milky Way is drawn at (0,0) internally? No, we removed its translation. 
                 // Wait, Milky Way generation (createMilkyWayStars) produces coordinates centered at (0,0)?
                 // Let's check createMilkyWayStars.
                 // Yes: x = Math.cos(angle) * radius. It produces centered coordinates.
                 // So for Milky Way, we need to be at (0,0) inside the rotated frame.
                 
  // Let's split the rotation groups.
  
  ctx.restore() // Reset for safety
  
  // --- ROTATING GROUP ---
  ctx.save()
  ctx.translate(canvas.value.width / 2, canvas.value.height / 2)
  ctx.rotate(tick * 0.0003)
  
  // 1. Milky Way (Centered coordinates)
  drawMilkyWay() 
  
  // 2. Nebula & Background Stars (Screen coordinates)
  // To rotate these around center, we draw them at (x - center, y - center)
  ctx.translate(-canvas.value.width / 2, -canvas.value.height / 2)
  drawNebula()
  drawBackgroundStars()
  drawShootingStars() 
  
  ctx.restore()
  // --- END ROTATING GROUP ---

  drawMouseTrails() // Trails should NOT rotate with background
  
  // Ring handles its own progress logic
  drawZodiacRing()
  
  // Only draw constellation when ring is done, using fade opacity
  if (introState.ringProgress >= 1) {
    ctx.save()
    ctx.globalAlpha = introState.constellationOpacity
    drawAccentStars()
    drawConstellation()
    ctx.restore()
  }
  
  ctx.globalAlpha = 1 // Reset

  animationFrameId = requestAnimationFrame(animate)
}

const drawDeepSpaceBackground = () => {
  const gradient = ctx.createRadialGradient(
    canvas.value.width / 2, canvas.value.height / 2, 0,
    canvas.value.width / 2, canvas.value.height / 2, Math.max(canvas.value.width, canvas.value.height)
  )
  // Dynamic base color based on theme
  gradient.addColorStop(0, currentTheme.base) 
  gradient.addColorStop(1, '#020205') 
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
}

const drawMilkyWay = () => {
  ctx.save()
  // No translation/rotation here, handled globally
  
  // 1. Draw Galactic Core Glow
  const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 300)
  coreGradient.addColorStop(0, `hsla(${currentTheme.hue}, 80%, 80%, 0.25)`)
  coreGradient.addColorStop(0.4, `hsla(${currentTheme.hue}, 60%, 60%, 0.1)`)
  coreGradient.addColorStop(1, 'hsla(0,0%,0%,0)')
  ctx.fillStyle = coreGradient
  ctx.fillRect(-400, -400, 800, 800)

  // 2. Draw Dust (Cloudy effect)
  milkyWayDust.forEach(p => {
    ctx.fillStyle = `hsla(${currentTheme.hue + p.hueOffset}, 60%, 50%, ${p.alpha})`
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
  })

  // 3. Draw Stars (Bright points)
  milkyWayStars.forEach(star => {
    ctx.fillStyle = `hsla(${currentTheme.hue + star.hueOffset}, 70%, 90%, ${star.alpha})`
    ctx.beginPath()
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
    ctx.fill()
  })
  
  ctx.restore()
}

const drawShootingStars = () => {
  // Spawn random shooting stars
  if (Math.random() < 0.015) {
    shootingStars.push({
      x: Math.random() * canvas.value.width,
      y: Math.random() * canvas.value.height * 0.5,
      len: Math.random() * 80 + 50,
      speed: Math.random() * 10 + 10,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.5,
      life: 1
    })
  }

  shootingStars.forEach((star, index) => {
    star.x += Math.cos(star.angle) * star.speed
    star.y += Math.sin(star.angle) * star.speed
    star.life -= 0.02
    
    if (star.life <= 0) {
      shootingStars.splice(index, 1)
      return
    }

    const gradient = ctx.createLinearGradient(
      star.x, star.y, 
      star.x - Math.cos(star.angle) * star.len, 
      star.y - Math.sin(star.angle) * star.len
    )
    gradient.addColorStop(0, `rgba(255, 255, 255, ${star.life})`)
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    
    ctx.strokeStyle = gradient
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(star.x, star.y)
    ctx.lineTo(star.x - Math.cos(star.angle) * star.len, star.y - Math.sin(star.angle) * star.len)
    ctx.stroke()
  })
}

// Meteor Trail State
let trailHistory = []
const trailLength = 15

const drawMouseTrails = () => {
  // 1. Update Trail History
  if (mouse.active) {
    trailHistory.push({ x: mouse.x, y: mouse.y, age: 0 })
  }
  
  // Maintain trail length
  if (trailHistory.length > trailLength) {
    trailHistory.shift()
  }
  
  // Age points and remove old ones (if mouse inactive)
  if (!mouse.active && trailHistory.length > 0) {
    trailHistory.shift()
  }
  
  if (trailHistory.length < 3) return

  // 2. Draw Main Meteor Stream
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  
  // Create gradient for the main trail
  const head = trailHistory[trailHistory.length - 1]
  const tail = trailHistory[0]
  const gradient = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y)
  gradient.addColorStop(0, `hsla(${currentTheme.hue}, 80%, 50%, 0)`)
  gradient.addColorStop(1, `hsla(${currentTheme.hue}, 90%, 80%, 0.8)`)
  
  ctx.strokeStyle = gradient
  ctx.lineWidth = 3
  ctx.shadowBlur = 10
  ctx.shadowColor = `hsla(${currentTheme.hue}, 80%, 60%, 0.5)`
  
  ctx.beginPath()
  ctx.moveTo(trailHistory[0].x, trailHistory[0].y)
  
  // Correct Bezier Curve for smooth path
  for (let i = 1; i < trailHistory.length - 1; i++) {
    const xc = (trailHistory[i].x + trailHistory[i + 1].x) / 2
    const yc = (trailHistory[i].y + trailHistory[i + 1].y) / 2
    ctx.quadraticCurveTo(trailHistory[i].x, trailHistory[i].y, xc, yc)
  }
  // Connect to the very last point
  ctx.lineTo(trailHistory[trailHistory.length - 1].x, trailHistory[trailHistory.length - 1].y)
  
  ctx.stroke()
  
  // 3. Draw "Silk" Threads (Sine wave offsets)
  drawSilkThread(trailHistory, 1, 5, 0.1)
  drawSilkThread(trailHistory, -1, 4, 0.15)
  
  // 4. Draw Head Glow
  ctx.shadowBlur = 15
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(head.x, head.y, 2, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.restore()
}

const drawSilkThread = (points, direction, amp, freq) => {
  ctx.beginPath()
  ctx.lineWidth = 1
  ctx.strokeStyle = `hsla(${currentTheme.hue + 20}, 70%, 70%, 0.3)`
  
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    // Calculate normal vector for offset
    let nx = 0, ny = 0
    if (i < points.length - 1) {
      const next = points[i + 1]
      const dx = next.x - p.x
      const dy = next.y - p.y
      const len = Math.sqrt(dx * dx + dy * dy) || 1
      nx = -dy / len
      ny = dx / len
    }
    
    const wave = Math.sin(i * freq + tick * 0.1) * amp * direction
    const x = p.x + nx * wave
    const y = p.y + ny * wave
    
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
}

const drawNebula = () => {
  nebulaClouds.forEach(cloud => {
    const x = cloud.x + Math.sin(tick * cloud.speed + cloud.offset) * 50
    const y = cloud.y + Math.cos(tick * cloud.speed + cloud.offset) * 50
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, cloud.radius)
    // Use currentTheme hue
    gradient.addColorStop(0, `hsla(${currentTheme.hue + cloud.offset * 20}, 60%, 40%, ${cloud.alpha})`)
    gradient.addColorStop(1, 'hsla(0, 0%, 0%, 0)')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, cloud.radius, 0, Math.PI * 2)
    ctx.fill()
  })
}

const drawBackgroundStars = () => {
  const centerX = canvas.value.width / 2
  const centerY = canvas.value.height / 2
  // Parallax based on mouse position relative to center
  const parallaxX = (mouse.x - centerX) * 0.02
  const parallaxY = (mouse.y - centerY) * 0.02

  backgroundStars.forEach((star) => {
    // Move stars (Speed increases drastically with warp)
    const warpFactor = 1 + warpSpeed * 40 // Increased from 5 to 40
    star.y += star.speed * warpFactor
    
    // Elongate stars during warp
    const length = warpSpeed > 0.1 ? star.size * warpSpeed * 10 : 0
    if (star.y > canvas.value.height) {
      star.y = -5
      star.x = Math.random() * canvas.value.width
    }

    // Apply parallax
    const drawX = star.x + parallaxX / star.z
    const drawY = star.y + parallaxY / star.z

    // Twinkle
    const alpha = star.alpha + Math.sin((tick * star.twinkleSpeed) + star.twinkleOffset) * 0.2
    
    ctx.fillStyle = star.hue > 0 
      ? `hsla(${star.hue}, 70%, 80%, ${Math.max(0.1, alpha)})`
      : `rgba(255, 255, 255, ${Math.max(0.1, alpha)})`
      
    ctx.beginPath()
    if (length > 0) {
      // Draw streak
      ctx.ellipse(drawX, drawY, star.baseSize, star.baseSize + length, 0, 0, Math.PI * 2)
    } else {
      ctx.arc(drawX, drawY, star.baseSize, 0, Math.PI * 2)
    }
    ctx.fill()
  })
}

const drawConstellation = () => {
  const fadeIn = Math.max(0, Math.min(1, transitionProgress))
  const fadeOut = previousConstellationStars.length ? Math.max(0, 1 - transitionProgress) : 0

  if (fadeOut > 0.01) {
    drawConstellationSet(previousConstellationStars, previousConnections, previousHue, fadeOut, false)
  }

  drawConstellationSet(constellationStars, currentConnections, getActiveHue(), fadeIn || 1, true)
}

const drawConstellationSet = (stars, connections, hue, opacity, isActive) => {
  if (!stars.length || opacity <= 0) return
  const easedOpacity = Math.max(0, Math.min(1, opacity))

  if (isActive) {
    stars.forEach((star) => {
      const pulse = Math.sin(tick * 0.03 + star.pulseOffset) * 0.35
      let radius = (star.size ?? 3) + pulse
      const dx = mouse.x - star.x
      const dy = mouse.y - star.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (mouse.active && distance < 180) {
        const influence = (180 - distance) / 180
        radius += 1.5 * influence
        star.x += dx * 0.012 * influence
        star.y += dy * 0.012 * influence
        star.highlightStrength = influence
      } else {
        const floatTargetX = star.baseX + Math.sin(tick * star.floatSpeed + star.floatPhaseX) * star.floatDistance
        const floatTargetY = star.baseY + Math.cos(tick * star.floatSpeed + star.floatPhaseY) * star.floatDistance * 0.6
        star.x += (floatTargetX - star.x) * 0.08
        star.y += (floatTargetY - star.y) * 0.08
        star.highlightStrength *= 0.9
      }

      star.currentRadius = radius
    })
  }

  drawConstellationLines(stars, connections, hue, easedOpacity, isActive)

  stars.forEach((star) => {
    if (isActive && star.highlightStrength > 0.01) {
      drawMouseHighlight(star, star.highlightStrength, hue, easedOpacity)
    }
    // Special Leo effect: Extra golden glow
    const isLeo = activeSign === 'Leo' && isActive
    drawStarGlow(star, hue, easedOpacity, isLeo)
  })
}

const drawConstellationLines = (stars, connections, hue, opacity, isActive) => {
  connections.forEach(([fromIndex, toIndex]) => {
    const from = stars[fromIndex]
    const to = stars[toIndex]
    if (!from || !to) return

    const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y)
    // Dynamic pulsing opacity for lines
    const pulse = isActive ? 0.85 + Math.sin(tick * 0.05) * 0.15 : 0.85
    
    gradient.addColorStop(0, `hsla(${hue}, 80%, 70%, ${pulse * opacity})`)
    gradient.addColorStop(1, `hsla(${hue + 20}, 80%, 60%, ${(pulse - 0.2) * opacity})`)
    
    ctx.strokeStyle = gradient
    ctx.lineWidth = isActive ? 1.6 : 1.4
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
  })
}

const drawStarGlow = (star, hue, opacity = 1, isLeo = false) => {
  const radius = star.currentRadius
  // Enhanced glow size
  const glowSize = isLeo ? radius * 5 : radius * 3.5
  
  const gradient = ctx.createRadialGradient(
    star.x,
    star.y,
    0,
    star.x,
    star.y,
    glowSize
  )
  
  if (isLeo) {
    // Golden/Fiery glow for Leo
    gradient.addColorStop(0, `rgba(255, 250, 220, ${0.95 * opacity})`)
    gradient.addColorStop(0.3, `hsla(40, 100%, 60%, ${0.6 * opacity})`)
    gradient.addColorStop(1, `hsla(20, 100%, 50%, 0)`)
  } else {
    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.95 * opacity})`)
    gradient.addColorStop(0.5, `hsla(${hue}, 85%, 70%, ${0.45 * opacity})`)
    gradient.addColorStop(1, `hsla(${hue}, 85%, 65%, 0)`)
  }

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(star.x, star.y, glowSize, 0, Math.PI * 2)
  ctx.fill()

  // Core brightness
  ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * opacity})`
  ctx.beginPath()
  ctx.arc(star.x, star.y, radius * 0.4, 0, Math.PI * 2)
  ctx.fill()
}

const drawMouseHighlight = (star, strength, hue, opacity = 1) => {
  ctx.strokeStyle = `hsla(${hue}, 90%, 70%, ${(0.2 + strength * 0.4) * opacity})`
  ctx.lineWidth = 0.8 + strength * 1.2
  ctx.beginPath()
  ctx.moveTo(star.x, star.y)
  ctx.lineTo(mouse.x, mouse.y)
  ctx.stroke()
}

const buildRingLayout = (width, height) => {
  const radiusX = Math.min(width, height) * 0.48
  const radiusY = Math.min(width, height) * 0.32
  const centerX = width / 2
  const centerY = height / 2
  const span = 12 * (Math.PI / 180)

  const segments = zodiacRing.map((sign) => {
    const angle = (sign.angle - 90) * (Math.PI / 180)
    const start = angle - span
    const end = angle + span
    const labelRadiusX = radiusX + 35
    const labelRadiusY = radiusY + 25
    const labelX = centerX + Math.cos(angle) * labelRadiusX
    const labelY = centerY + Math.sin(angle) * labelRadiusY
    return {
      ...sign,
      start,
      end,
      labelX,
      labelY,
      floatPhase: Math.random() * Math.PI * 2
    }
  })

  return { centerX, centerY, radiusX, radiusY, segments }
}

const drawZodiacRing = () => {
  if (!ringLayout || !ctx) return
  const { centerX, centerY, radiusX, radiusY, segments } = ringLayout

  ctx.save()
  ctx.lineCap = 'round'

  segments.forEach((segment) => {
    const isActive = segment.name === activeSign
    const isHovered = hoverSegment && hoverSegment.name === segment.name
    
    // Intro Animation: Sequential Reveal
    // Map segment index (0-11) to progress (0-1)
    const segmentIndex = zodiacRing.findIndex(s => s.name === segment.name)
    const segmentStartProgress = segmentIndex / 12
    const segmentEndProgress = (segmentIndex + 1) / 12
    
    // If intro hasn't reached this segment, skip
    if (introState.ringProgress < segmentStartProgress) return
    
    // Calculate opacity for this specific segment during intro
    let introOpacity = 1
    if (introState.ringProgress < segmentEndProgress) {
      introOpacity = (introState.ringProgress - segmentStartProgress) * 12
    }

    const brightnessBoost = isHovered ? 1.15 : 1
    const baseAlpha = isActive ? 0.85 : (isHovered ? 0.5 : 0.25)
    const width = isActive ? 3.8 : (isHovered ? 2.1 : 1.3)
    const gradient = ctx.createLinearGradient(centerX, centerY - radiusY, centerX, centerY + radiusY)
    const hue = segment.hue
    
    // Apply intro opacity
    const finalAlpha = baseAlpha * introOpacity
    
    gradient.addColorStop(0, `hsla(${hue}, 80%, ${(isActive ? 70 : 55) * brightnessBoost}%, ${finalAlpha})`)
    gradient.addColorStop(1, `hsla(${hue + 20}, 70%, ${(isActive ? 65 : 50) * brightnessBoost}%, ${finalAlpha * 0.6})`)

    ctx.strokeStyle = gradient
    ctx.lineWidth = width
    ctx.beginPath()
    
    // Animate the arc drawing
    const currentArcEnd = segment.start + (segment.end - segment.start) * introOpacity
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, segment.start, currentArcEnd)
    ctx.stroke()

    // mark nodes & labels (fade in with segment)
    ctx.globalAlpha = introOpacity * introState.opacity
    const markerRadius = isActive ? 3.4 : 2
    const anchorAngle = (segment.start + segment.end) / 2
    const markerX = centerX + Math.cos(anchorAngle) * radiusX
    const markerY = centerY + Math.sin(anchorAngle) * radiusY
    const markerGradient = ctx.createRadialGradient(markerX, markerY, 0, markerX, markerY, markerRadius * 3)
    markerGradient.addColorStop(0, 'rgba(255,255,255,0.8)')
    markerGradient.addColorStop(0.5, `hsla(${segment.hue}, 80%, 70%, ${isActive ? 0.75 : 0.4})`)
    markerGradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = markerGradient
    ctx.beginPath()
    ctx.arc(markerX, markerY, markerRadius * (isActive ? 2.2 : 1.3), 0, Math.PI * 2)
    ctx.fill()

    // labels
    ctx.font = isActive ? '600 13px "Inter", sans-serif' : '500 11px "Inter", sans-serif'
    ctx.fillStyle = `hsla(${segment.hue}, 40%, ${isActive ? 85 : 75}%, ${isActive ? 0.95 : 0.55})`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const labelGlow = ctx.createRadialGradient(segment.labelX, segment.labelY, 0, segment.labelX, segment.labelY, 18)
    labelGlow.addColorStop(0, `hsla(${segment.hue}, 70%, 70%, ${isActive ? 0.38 : 0.2})`)
    labelGlow.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = labelGlow
    ctx.beginPath()
    ctx.arc(segment.labelX, segment.labelY, 14, 0, Math.PI * 2)
    ctx.fill()

    drawRingLabel(segment, isActive)
    
    ctx.globalAlpha = 1 // Reset for next segment
  })

  ctx.restore()
}

const drawRingLabel = (segment, isActive) => {
  const labelX = segment.labelX
  const labelY = segment.labelY
  const labelColor = `hsla(${segment.hue}, 40%, ${isActive ? 85 : 75}%, ${isActive ? 0.95 : 0.75})`

  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${isActive ? 600 : 500} ${isActive ? 11 : 10}px "Inter", sans-serif`
  ctx.fillStyle = labelColor
  ctx.fillText(segment.name, labelX, labelY + (isActive ? 14 : 12))
  ctx.restore()
}

const handleMouseMove = (event) => {
  mouse.x = event.clientX
  mouse.y = event.clientY
  mouse.active = true
  updateHoverState(event)
}

const handleMouseLeave = () => {
  mouse.active = false
  mouse.x = -9999
  mouse.y = -9999
  hoverSegment = null
  isPointerOver = false
}

const handleClick = (event) => {
  if (!hoverSegment) return
  setActiveConstellation(hoverSegment.name)
}

const updateHoverState = (event) => {
  if (!ringLayout) return
  const rect = canvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const { centerX, centerY, radiusX, radiusY, segments } = ringLayout

  const relX = x - centerX
  const relY = y - centerY
  const angle = Math.atan2(relY / radiusY, relX / radiusX)
  const distance = Math.sqrt((relX * relX) / (radiusX * radiusX) + (relY * relY) / (radiusY * radiusY))

  if (distance >= 0.9 && distance <= 1.1) {
    const normalizedAngle = normalizeAngle(angle)
    hoverSegment = segments.find(segment => isAngleWithinSegment(normalizedAngle, normalizeAngle(segment.start), normalizeAngle(segment.end))) || null
    isPointerOver = !!hoverSegment
    canvas.value.style.cursor = hoverSegment ? 'pointer' : 'default'
  } else {
    hoverSegment = null
    isPointerOver = false
    canvas.value.style.cursor = 'default'
  }
}

onMounted(() => {
  ctx = canvas.value.getContext('2d')
  resizeCanvas()
  animate()

  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseleave', handleMouseLeave)
  window.addEventListener('click', handleClick)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseleave', handleMouseLeave)
  window.removeEventListener('click', handleClick)
  cancelAnimationFrame(animationFrameId)
})
</script>

<style scoped>
.gravity-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
  background: #05070a; /* Fallback color */
}
</style>
