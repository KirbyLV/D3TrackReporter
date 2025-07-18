import { designerPythonLoader } from '@disguise-one/designer-pythonapi/vite-loader'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // for relative paths when served from file or subdirectory
  plugins: [
    vue(),
    designerPythonLoader()
  ],
})