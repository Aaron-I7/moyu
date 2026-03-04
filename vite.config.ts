import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig(() => {
  const repository = process.env.GITHUB_REPOSITORY || ''
  const repositoryName = repository.split('/')[1] || ''
  const isUserPage = repositoryName.endsWith('.github.io')
  const pagesBase = isUserPage ? '/' : `/${repositoryName}/`
  const normalizedPagesBase = pagesBase.endsWith('/') ? pagesBase : `${pagesBase}/`

  const isGitHubActions = process.env.GITHUB_ACTIONS === 'true'
  const isCloudflare = process.env.CF_PAGES === '1'
  const base = (isGitHubActions ? normalizedPagesBase : (isCloudflare ? '/' : '/'))

  return {
    base,
    define: {
      __VUE_I18N_FULL_INSTALL__: true,
      __VUE_I18N_LEGACY_API__: false,
      __INTLIFY_PROD_DEVTOOLS__: false,
      __INTLIFY_DROP_MESSAGE_COMPILER__: false
    },
    plugins: [vue(), cloudflare()],
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
  };
})