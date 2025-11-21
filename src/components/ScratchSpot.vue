<template>
  <div class="scratch-spot" :style="{ width: width + 'px', height: height + 'px' }">
    <!-- The content to be revealed -->
    <div class="spot-content">
      <slot></slot>
    </div>
    <!-- The scratch layer -->
    <canvas
      ref="canvas"
      :width="width"
      :height="height"
      @mousedown="startScratching"
      @mousemove="scratch"
      @mouseup="stopScratching"
      @mouseleave="stopScratching"
      @touchstart="startScratching"
      @touchmove="scratch"
      @touchend="stopScratching"
    ></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  width: {
    type: Number,
    default: 100
  },
  height: {
    type: Number,
    default: 100
  },
  coverColor: {
    type: String,
    default: '#C0C0C0' // Silver
  },
  coverText: {
    type: String,
    default: '?'
  }
})

const emit = defineEmits(['reveal', 'scratch-progress'])

const canvas = ref(null)
const ctx = ref(null)
const isScratching = ref(false)
const isRevealed = ref(false)
const scratchedPixels = ref(0)
const totalPixels = ref(0)

const initCanvas = () => {
  if (!canvas.value) return
  ctx.value = canvas.value.getContext('2d')
  
  // Draw cover
  ctx.value.fillStyle = props.coverColor
  ctx.value.fillRect(0, 0, props.width, props.height)
  
  // Add texture/noise to make it look like foil
  addNoise(ctx.value, props.width, props.height)
  
  // Draw text
  ctx.value.fillStyle = '#666'
  ctx.value.font = 'bold 20px Arial'
  ctx.value.textAlign = 'center'
  ctx.value.textBaseline = 'middle'
  ctx.value.fillText(props.coverText, props.width / 2, props.height / 2)
  
  // Setup scratching
  ctx.value.globalCompositeOperation = 'destination-out'
  
  totalPixels.value = props.width * props.height
}

const addNoise = (context, w, h) => {
  const imageData = context.getImageData(0, 0, w, h)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const noise = Math.random() * 20 - 10
    data[i] = Math.min(255, Math.max(0, data[i] + noise))
    data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise))
    data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise))
  }
  context.putImageData(imageData, 0, 0)
}

const getPos = (e) => {
  const rect = canvas.value.getBoundingClientRect()
  let clientX, clientY
  
  if (e.changedTouches) {
    clientX = e.changedTouches[0].clientX
    clientY = e.changedTouches[0].clientY
  } else {
    clientX = e.clientX
    clientY = e.clientY
  }
  
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  }
}

const startScratching = (e) => {
  isScratching.value = true
  scratch(e)
}

const scratch = (e) => {
  if (!isScratching.value || !ctx.value || isRevealed.value) return
  e.preventDefault()
  
  const pos = getPos(e)
  
  ctx.value.beginPath()
  ctx.value.arc(pos.x, pos.y, 10, 0, Math.PI * 2) // Smaller brush for precision
  ctx.value.fill()
  
  // Check progress periodically (not every frame for performance)
  if (Math.random() > 0.8) {
    checkProgress()
  }
}

const stopScratching = () => {
  isScratching.value = false
  checkProgress()
}

const checkProgress = () => {
  if (isRevealed.value) return
  
  // Simple sampling or keep track of scratched area
  // For performance, we can just assume if user scratches enough, it's revealed
  // Or use getImageData (expensive)
  
  // Let's use a simplified "scratched enough" logic based on events or just emit progress
  // For now, let's do a real pixel check on stop
  
  const imageData = ctx.value.getImageData(0, 0, props.width, props.height)
  let clearPixels = 0
  const data = imageData.data
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] === 0) clearPixels++
  }
  
  const percentage = clearPixels / totalPixels.value
  emit('scratch-progress', percentage)
  
  if (percentage > 0.4) { // If 40% scratched, consider revealed
    isRevealed.value = true
    // Optional: Clear the rest
    // ctx.value.clearRect(0, 0, props.width, props.height)
    emit('reveal')
  }
}

onMounted(() => {
  initCanvas()
})

watch(() => props.coverColor, initCanvas)
</script>

<style scoped>
.scratch-spot {
  position: relative;
  display: inline-block;
  user-select: none;
  border-radius: 4px;
  overflow: hidden;
  background: white; /* Background for the content */
  box-shadow: inset 0 0 5px rgba(0,0,0,0.1);
}

.spot-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
  font-weight: bold;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="gray" stroke="white" stroke-width="2"/></svg>') 10 10, auto;
}
</style>
