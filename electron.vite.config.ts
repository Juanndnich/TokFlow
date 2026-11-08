import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  main: {
    resolve: {
      preserveSymlinks: true,
      alias: {
        '@shared': resolve('src/shared'),
        '@core': resolve('src/core')
      }
    },
    plugins: [externalizeDepsPlugin({ exclude: [] })],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts')
        }
      }
    }
  },
  preload: {
    resolve: {
      preserveSymlinks: true,
      alias: {
        '@shared': resolve('src/shared'),
        '@core': resolve('src/core')
      }
    },
    plugins: [externalizeDepsPlugin({ exclude: [] })],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.ts')
        }
      }
    }
  },
  renderer: {
    resolve: {
      preserveSymlinks: true,
      alias: {
        '@renderer': resolve('src/renderer'),
        '@shared': resolve('src/shared'),
        '@core': resolve('src/core')
      }
    },
    plugins: [preact()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html')
        }
      }
    }
  }
})
