import { writeFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Try to read .env file manually
let envSiteUrl = ''
try {
  const envFile = readFileSync(resolve('.env'), 'utf-8')
  const match = envFile.match(/VITE_SITE_URL=(.+)/)
  if (match) {
    envSiteUrl = match[1].trim()
  }
} catch (e) {
  // .env might not exist in CI/CD or production
}

const siteUrl = (process.env.VITE_SITE_URL || process.env.SITE_URL || envSiteUrl || 'https://muyu.click').replace(/\/$/, '')
const routes = [
  '/',
  '/games',
  '/relax',
  '/tools',
  '/reading',
  '/games/pixel-fishing',
  '/relax/wooden-fish',
  '/relax/virtual-pet',
  '/tools/white-noise'
]
const locales = ['en', 'zh']
const localizedRoutes = locales.flatMap(locale =>
  routes.map(route => `/${locale}${route === '/' ? '' : route}`)
)

const urlset = localizedRoutes.map(route => `  <url><loc>${siteUrl}${route}</loc></url>`).join('\n')
const content = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>\n`

writeFileSync(resolve('public', 'sitemap.xml'), content, 'utf-8')
writeFileSync(resolve('public', 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`, 'utf-8')
