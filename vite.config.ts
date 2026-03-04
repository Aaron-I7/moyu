import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(() => {
  const repository = process.env.GITHUB_REPOSITORY || ''
  const repositoryName = repository.split('/')[1] || ''
  const isUserPage = repositoryName.endsWith('.github.io')
  const pagesBase = isUserPage ? '/' : `/${repositoryName}/`
  // 确保 base 始终以 / 结尾，这对于 GitHub Pages 子路径至关重要
  const normalizedPagesBase = pagesBase.endsWith('/') ? pagesBase : `${pagesBase}/`
  const base = process.env.GITHUB_ACTIONS === 'true' ? normalizedPagesBase : '/'

  return {
    base,
    define: {
      __VUE_I18N_FULL_INSTALL__: true,
      __VUE_I18N_LEGACY_API__: false,
      __INTLIFY_PROD_DEVTOOLS__: false,
      __INTLIFY_DROP_MESSAGE_COMPILER__: false
    },
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
