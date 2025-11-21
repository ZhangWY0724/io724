import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: "/io724/",  // 在此处加上base，其余部分不用改
  plugins: [vue()],
  server: {
    port: 3000,
    open: true
  }
})
