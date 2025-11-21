<template>
  <div class="scratch-canvas-container" ref="container">
    <canvas 
      ref="canvas"
      @mousedown="startScratch"
      @mousemove="scratch"
      @mouseup="stopScratch"
      @mouseleave="stopScratch"
      @touchstart="startScratch"
      @touchmove="scratch"
      @touchend="stopScratch"
    ></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'

const props = defineProps({
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  brushSize: { type: Number, default: 30 },
  coverColor: { type: String, default: '#ccc' },
  zones: { type: Array, default: () => [] } // Array of { id, x, y, w, h }
})

const emit = defineEmits(['zone-revealed', 'scratch-start', 'scratch-end'])

const container = ref(null)
const canvas = ref(null)
let ctx = null
let isDrawing = false
let lastX = 0
let lastY = 0
let checkTimer = null

// Initialize Canvas
const initCanvas = () => {
  if (!canvas.value) return
  const cvs = canvas.value
  cvs.width = props.width
  cvs.height = props.height
  ctx = cvs.getContext('2d', { willReadFrequently: true })
  
  // Clear canvas first
  ctx.clearRect(0, 0, props.width, props.height)
  
  // Fill only the zones with cover color
  ctx.fillStyle = props.coverColor
  
  if (props.zones.length > 0) {
    props.zones.forEach(zone => {
      // Draw rounded rectangle for better look
      roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 5)
      ctx.fill()
    })
  } else {
    // Fallback if no zones defined yet (or if intended to cover all)
    // But for now, let's assume we only want to cover zones if they exist.
    // If strictly no zones, maybe we shouldn't cover anything?
    // Or keep old behavior? Let's keep old behavior if zones is empty to be safe, 
    // but usually zones will be populated.
    // Actually, if zones are empty, we probably shouldn't draw anything or it covers everything.
    // Let's default to NOT covering everything if zones are empty, to avoid the "huge block" issue.
  }
  
  // Add some noise/texture for realism (only on filled parts)
  // We need to use composite operation to only draw noise on existing pixels
  ctx.globalCompositeOperation = 'source-atop'
  addNoise()
  ctx.globalCompositeOperation = 'source-over'
}

const roundRect = (ctx, x, y, w, h, r) => {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const addNoise = () => {
  if (!ctx) return
  const imageData = ctx.getImageData(0, 0, props.width, props.height)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    // Only add noise to non-transparent pixels
    if (data[i+3] > 0) {
      const noise = (Math.random() - 0.5) * 20
      data[i] = Math.min(255, Math.max(0, data[i] + noise))
      data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise))
      data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise))
    }
  }
  ctx.putImageData(imageData, 0, 0)
}

// Scratch Logic
const getPos = (e) => {
  const rect = canvas.value.getBoundingClientRect()
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  }
}

const startScratch = (e) => {
  isDrawing = true
  const { x, y } = getPos(e)
  lastX = x
  lastY = y
  scratch(e) // Scratch immediately on click
  emit('scratch-start')
}

const scratch = (e) => {
  if (!isDrawing || !ctx) return
  e.preventDefault() // Prevent scrolling on touch
  
  const { x, y } = getPos(e)
  
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.lineWidth = props.brushSize
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.moveTo(lastX, lastY)
  ctx.lineTo(x, y)
  ctx.stroke()
  
  lastX = x
  lastY = y
  
  // Throttle hit detection
  if (!checkTimer) {
    checkTimer = setTimeout(() => {
      checkZones()
      checkTimer = null
    }, 100)
  }
}

const stopScratch = () => {
  isDrawing = false
  emit('scratch-end')
}

// Hit Detection
const checkZones = () => {
  if (!props.zones.length) return
  
  props.zones.forEach(zone => {
    if (zone.revealed) return // Skip already revealed
    
    // Check center point and a few surrounding points
    const samplePoints = [
      { x: zone.x + zone.w / 2, y: zone.y + zone.h / 2 },
      { x: zone.x + zone.w * 0.25, y: zone.y + zone.h * 0.25 },
      { x: zone.x + zone.w * 0.75, y: zone.y + zone.h * 0.75 },
      { x: zone.x + zone.w * 0.25, y: zone.y + zone.h * 0.75 },
      { x: zone.x + zone.w * 0.75, y: zone.y + zone.h * 0.25 }
    ]
    
    let clearPoints = 0
    samplePoints.forEach(p => {
      // Ensure point is within canvas
      if (p.x < 0 || p.x >= props.width || p.y < 0 || p.y >= props.height) return
      
      const pixel = ctx.getImageData(p.x, p.y, 1, 1).data
      // Alpha channel is the 4th byte (index 3). If it's 0, it's transparent.
      if (pixel[3] < 128) { // < 50% opacity
        clearPoints++
      }
    })
    
    // If majority of points are clear, consider it revealed
    if (clearPoints >= 3) {
      emit('zone-revealed', zone.id)
    }
  })
}

onMounted(() => {
  initCanvas()
})

watch(() => props.coverColor, initCanvas)
watch(() => props.zones, initCanvas, { deep: true })
</script>

<style scoped>
.scratch-canvas-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  touch-action: none; /* Disable browser handling of gestures */
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="white" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="white"/></svg>') 12 12, auto;
}
</style>
