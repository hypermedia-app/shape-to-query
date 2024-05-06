/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineConfig } from 'vite'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
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
    esbuildOptions: {
      plugins: [
        <any>NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
        }),
      ],
    },
  },
  build: {
    rollupOptions: {
      plugins: [
        (<any>rollupNodePolyFill)(),
      ],
    },
  },
})
