import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(() => {
  const repository = process.env.GITHUB_REPOSITORY || ''
  const repositoryName = repository.split('/')[1]
  const pagesBase = repositoryName ? `/${repositoryName}/` : '/'
  const base = process.env.GITHUB_ACTIONS === 'true' ? pagesBase : '/'

  return {
    base,
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      open: true
    },
    build: {
      target: 'es2015' as const,
      minify: 'esbuild' as const,
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            'icon-vendor': ['@iconify/vue']
          }
        }
      }
    }
  }
})
