/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineConfig } from 'vite'
import rollupNodePolyFill from 'rollup-plugin-node-polyfills'

export default defineConfig({
  define: {
    global: 'window',
  },
  server: {
    hmr: false,
  },
  resolve: {
    alias: {
      stream: 'readable-stream',
      zlib: 'browserify-zlib',
      util: 'util',
    },
  },
  optimizeDeps: {
    rolldownOptions: {
      plugins: [
        (<any>rollupNodePolyFill)(),
      ],
    },
  },
  build: {
    rolldownOptions: {
      plugins: [
        (<any>rollupNodePolyFill)(),
      ],
    },
  },
})
