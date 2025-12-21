import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'

export default defineConfig({
  server: {
    host: true,
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
  plugins:
    [
      glsl()
    ]
})
