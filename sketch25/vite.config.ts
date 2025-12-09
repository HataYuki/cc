import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { glsl } from 'vite-plugin-glsl'


export default defineConfig({
  server: {
    host: true,
  },
  build: {
    minify: 'terser',
    terserOptions: {
      module: true,
      compress: {
        unused: true,
        dead_code: true
      }
    },
    rollupOptions: {
      plugins: [visualizer({ filename: 'stats.html' }), glsl()],
      output: {
        manualChunks: {
          three: ['three'],
          tweakpane: ['tweakpane']
        },
      },
    },
  },
})
