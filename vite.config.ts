import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { resolve } from 'path'

export default defineConfig(() => {
  const repository = process.env.GITHUB_REPOSITORY || ''
  const repositoryName = repository.split('/')[1] || ''
  const isUserPage = repositoryName.endsWith('.github.io')
  const pagesBase = isUserPage ? '/' : `/${repositoryName}/`
  const normalizedPagesBase = pagesBase.endsWith('/') ? pagesBase : `${pagesBase}/`

  const isGitHubActions = process.env.GITHUB_ACTIONS === 'true'
  const base = isGitHubActions ? normalizedPagesBase : '/'

  return {
    base,
    define: {
      __VUE_I18N_FULL_INSTALL__: true,
      __VUE_I18N_LEGACY_API__: false,
      __INTLIFY_PROD_DEVTOOLS__: false,
      __INTLIFY_DROP_MESSAGE_COMPILER__: false
    },
    plugins: [
      vue(),
      ViteImageOptimizer(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'robots.txt'],
        manifest: {
          name: 'Moyu - Breakflow',
          short_name: 'Breakflow',
          description: 'Micro-Break Platform for Global Workers',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
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
