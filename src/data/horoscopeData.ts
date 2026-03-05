// 职场运势数据源 - 全行业通用版
// Workplace Horoscope Data - Universal Edition

export interface HoroscopeItem {
  id: string
  content: string // 宜/忌的内容
  type: 'good' | 'bad' // good=宜, bad=忌
}

export interface QuoteItem {
  id: string
  text: string
  author?: string
}

// 宜（Good）- 职场正能量与摸鱼技巧
export const GOOD_LIST: string[] = [
  '准点下班', '带薪如厕', '清理桌面', '拒绝内卷', 
  '喝杯奶茶', '午睡半小时', '整理文件', '备份数据',
  '更新简历', '按时吃饭', '眺望远方', '听首好歌',
  '摸鱼划水', '拒绝加班', '早睡早起', '坚持运动',
  '夸奖同事', '保持微笑', '即时保存', '重启电脑',
  '清理邮箱', '制定计划', '复盘总结', '学习新知',
  '冥想片刻', '伸个懒腰', '补充水分', '吃点零食'
]

// 忌（Bad）- 职场避坑指南
export const BAD_LIST: string[] = [
  '通宵熬夜', '久坐不动', '过度焦虑', '甚至内耗',
  '频繁开会', '忘记保存', '情绪失控', '暴饮暴食',
  '盲目跟风', '拖延症发作', '无意义争论', '轻信谣言',
  '带病工作', '久视屏幕', '憋尿', '不吃早餐',
  '乱发脾气', '背后议论', '推卸责任', '过度承诺',
  '忽视健康', '透支信用', '沉迷八卦', '优柔寡断',
  '死磕细节', '自我怀疑', '盲目乐观', '忽视风险'
]

// API 接口定义
export interface ApiQuote {
  q: string // quote content
  a: string // author
  h?: string // html formatted
}

export interface HoroscopeData {
  date: string
  good: string
  bad: string
  quote: QuoteItem
}

// 缓存 Key
const QUOTE_CACHE_KEY = 'moyu-daily-quote'
const CACHE_DURATION = 1000 * 60 * 60 * 6 // 6小时缓存

// 获取每日金句（优先使用 API，失败降级到本地）
export async function fetchDailyQuote(): Promise<QuoteItem> {
  const fallback = QUOTES[Math.floor(Math.random() * QUOTES.length)] ?? { id: '0', text: 'Work hard, play hard.', author: 'Anonymous' }
  try {
    // 1. 检查缓存
    const cached = localStorage.getItem(QUOTE_CACHE_KEY)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data
      }
    }

    // 2. 尝试调用 API (使用 ZenQuotes Free API 通过代理或直接调用)
    // 注意：ZenQuotes 免费版有 CORS 限制，通常需要后端代理。
    // 这里我们尝试使用一个支持 CORS 的免费 Quotes API，如 Quotable 或 API Ninjas (需要 key)
    // 为了简单且无需 key，我们尝试使用 quotable.io (开源免费)
    const response = await fetch('https://api.quotable.io/random?tags=wisdom|inspirational')
    
    if (!response.ok) throw new Error('API request failed')
    
    const data = await response.json()
    const quote: QuoteItem = {
      id: data._id,
      text: data.content,
      author: data.author
    }

    // 3. 写入缓存
    localStorage.setItem(QUOTE_CACHE_KEY, JSON.stringify({
      data: quote,
      timestamp: Date.now()
    }))

    return quote

  } catch (error) {
    console.warn('Failed to fetch daily quote, using fallback:', error)
    // 降级：从本地库随机
    return fallback
  }
}

// 每日金句（Daily Quotes）- 职场/生活/幽默
export const QUOTES: QuoteItem[] = [
  { id: '1', text: '工作是无限的，生命是有限的。', author: '摸鱼哲学' },
  { id: '2', text: '休息是为了走更长远的路，或者只是为了休息。', author: '无名氏' },
  { id: '3', text: '不要用战术上的勤奋，掩盖战略上的懒惰。', author: '雷军' },
  { id: '4', text: '今天解决不了的事情，明天可能也解决不了，所以先睡吧。', author: '反内卷指南' },
  { id: '5', text: '保持心脏跳动，就是今天最大的KPI。', author: '生存法则' },
  { id: '6', text: '老板画的饼，吃多了会消化不良。', author: '职场养生' },
  { id: '7', text: '虽然即使去不了远方，也别忘了看看窗外的云。', author: '每日心情' },
  { id: '8', text: '在这个内卷的时代，保持松弛感是一种超能力。', author: '心理建设' },
  { id: '9', text: 'Deadline是第一生产力，但健康是唯一生产力。', author: '效率悖论' },
  { id: '10', text: '做不完的工作就像海里的水，喝不完也晒不干。', author: '摸鱼学家' }
]

// 根据日期生成伪随机运势（保证同一天每个人看到的一样，或者刷新变动，这里选择基于日期+随机）
// 为了趣味性，我们每次刷新随机展示，或者基于日期哈希
export async function getDailyHoroscope(): Promise<HoroscopeData> {
  const today = new Date()
  
  // 随机选择 1 个宜，1 个忌 (保持本地随机，因为这部分是有趣的“玄学”)
  const good = GOOD_LIST[Math.floor(Math.random() * GOOD_LIST.length)] ?? "准点下班"
  const bad = BAD_LIST[Math.floor(Math.random() * BAD_LIST.length)] ?? "通宵熬夜"
  
  // 异步获取真实金句
  const quote = await fetchDailyQuote()
  
  return {
    date: today.toLocaleDateString(),
    good,
    bad,
    quote
  }
}
