<template>
  <div class="scratch-ticket" :style="{ width: width + 'px', height: height + 'px' }">
    <div class="ticket-bg" :style="{ backgroundImage: `url(${bgImage})` }"></div>
    <div class="ticket-content">
      <!-- <h3>{{ title }}</h3> -->
      <div class="prize-area">
        <span class="prize-text">{{ prize }}</span>
      </div>
    </div>
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
  title: {
    type: String,
    default: '刮刮乐'
  },
  prize: {
    type: String,
    default: '谢谢惠顾'
  },
  width: {
    type: Number,
    default: 300
  },
  height: {
    type: Number,
    default: 180
  },
  coverColor: {
    type: String,
    default: '#ccc'
  },
  bgImage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['reveal'])

const canvas = ref(null)
const isScratching = ref(false)
const ctx = ref(null)

const initCanvas = () => {
  if (!canvas.value) return
  ctx.value = canvas.value.getContext('2d')
  
  // Fill with cover color
  ctx.value.fillStyle = props.coverColor
  ctx.value.fillRect(0, 0, props.width, props.height)
  
  // Add "Scratch Here" text
  ctx.value.fillStyle = '#666'
  ctx.value.font = 'bold 24px Arial'
  ctx.value.textAlign = 'center'
  ctx.value.textBaseline = 'middle'
  ctx.value.fillText('刮开中奖', props.width / 2, props.height / 2)
  
  // Set composite operation for scratching
  ctx.value.globalCompositeOperation = 'destination-out'
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
  emit('reveal')
}

const scratch = (e) => {
  if (!isScratching.value || !ctx.value) return
  e.preventDefault() // Prevent scrolling on touch
  
  const pos = getPos(e)
  
  ctx.value.beginPath()
  ctx.value.arc(pos.x, pos.y, 15, 0, Math.PI * 2)
  ctx.value.fill()
}

const stopScratching = () => {
  isScratching.value = false
}

onMounted(() => {
  initCanvas()
})
</script>

<style scoped>
.scratch-ticket {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  background: white;
  user-select: none;
}

.ticket-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  z-index: 0;
}

.ticket-content {
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
}

.ticket-content h3 {
  display: none; /* Hide title as it is likely in the image */
}

.prize-area {
  font-weight: 900;
  font-size: 32px;
  color: #e74c3c;
  text-shadow: 2px 2px 0px #fff;
  background: rgba(255, 255, 255, 0.8);
  padding: 10px 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  cursor: crosshair;
}
</style>
