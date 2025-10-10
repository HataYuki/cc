import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [glsl(), tailwindcss()],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        dead_code: true,        // remove unreachable code
        unused: true,           // remove unused variables
        drop_console: true,     // remove console.* statements
        drop_debugger: true,    // remove debugger statements
        conditionals: true,     // optimize if-s and conditional expressions
        loops: true,            // optimize loops when condition can be determined
        inline: 2,              // inline function calls (0=disabled, 1=simple, 2=aggressive)
        properties: true,       // optimize property access a["foo"] → a.foo
        comparisons: true,      // optimize comparisons
        evaluate: true,         // evaluate constant expressions
        booleans: true,         // optimize boolean expressions
        typeofs: true,          // optimize typeof calls
        sequences: true,        // join consecutive simple statements using comma
        side_effects: true,     // remove side-effect-free statements
        pure_funcs: ['console.log', 'console.info', 'console.warn'], // treat as pure functions
        arrows: true,           // convert function expressions to arrow functions
        collapse_vars: true,    // collapse single-use variables
        reduce_vars: true       // reduce variables assigned with constant values
      },
      mangle: {
        toplevel: true,         // mangle top-level variable names
        properties: {
          reserved: ['__', 'constructor', 'prototype'] // preserve reserved property names
        }
      },
      format: {
        comments: false,        // remove all comments
        beautify: false,        // disable code formatting
        semicolons: false       // optimize semicolon usage
      }
    },
    chunkSizeWarningLimit: 1000, // warning threshold for chunk size (KB)
    sourcemap: false,            // disable source maps in production
    cssMinify: true,             // enable CSS minification
    assetsInlineLimit: 4096,     // inline assets smaller than 4KB as base64
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],    // separate Three.js into its own chunk
          'gsap': ['gsap'],      // separate GSAP into its own chunk
          'vendor': ['emittery', 'ua-parser-js', 'maath', 'tweakpane'] // other libraries
        }
      }
    }
  }
});