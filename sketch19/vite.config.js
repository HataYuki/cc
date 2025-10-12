import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';
import tailwindcss from '@tailwindcss/vite'
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [
    glsl({
      compress: true,         // GLSL code compression
      watch: true,           // watch mode
      root: '/',             // root path
      transform: (code, id) => {
        // Remove all newlines and extra whitespace from GLSL
        return code
          .replace(/\n/g, ' ')           // Replace newlines with spaces
          .replace(/\r/g, ' ')           // Replace carriage returns with spaces
          .replace(/\s+/g, ' ')          // Replace multiple spaces with single space
          .replace(/;\s+/g, ';')         // Remove spaces after semicolons
          .replace(/{\s+/g, '{')         // Remove spaces after opening braces
          .replace(/\s+}/g, '}')         // Remove spaces before closing braces
          .trim();                       // Remove leading/trailing whitespace
      }
    }), 
    tailwindcss(),
    wasm(),
    topLevelAwait()
  ],
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
        properties: true,      // don't optimize property access to avoid runtime errors
        comparisons: true,      // optimize comparisons
        evaluate: true,         // evaluate constant expressions
        booleans: true,         // optimize boolean expressions
        typeofs: true,          // optimize typeof calls
        sequences: true,       // don't join consecutive statements to avoid issues
        side_effects: true,    // don't remove statements that might have side effects
        pure_funcs: ['console.log', 'console.info', 'console.warn'], // treat as pure functions
        arrows: true,           // convert function expressions to arrow functions
        collapse_vars: true,    // collapse single-use variables
        reduce_vars: true       // reduce variables assigned with constant values
      },
      mangle: {
        toplevel: false,        // don't mangle top-level variable names
        properties: false       // don't mangle property names to avoid runtime errors
      },
      format: {
        comments: false,        // remove all comments
        beautify: false,        // disable code formatting
        semicolons: false,      // optimize semicolon usage
        wrap_iife: true,        // wrap IIFEs in parentheses
        ascii_only: false,      // allow unicode characters
        inline_script: false,   // escape </script> in strings
        keep_numbers: false,    // don't keep original number literals
        indent_level: 0,        // no indentation
        max_line_len: 10000000, // essentially unlimited line length
        braces: false,          // omit braces when safe
        preamble: "",           // no preamble
        quote_style: 1,         // prefer single quotes
        wrap_func_args: false   // don't wrap function arguments
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
          'vendor': ['emittery', 'ua-parser-js', 'maath', 'tweakpane'], // other libraries
          'rapier': ['@dimforge/rapier3d'] // separate Rapier3D physics engine
        }
      }
    }
  }
});