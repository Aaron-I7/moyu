<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { supabase } from '@/core/supabase/client'
import dayjs from 'dayjs'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

// 1. 中文事件映射
const EVENT_NAME_MAP: Record<string, string> = {
  'session_start': '会话开始',
  'tool_start': '开始使用工具',
  'tool_end': '结束使用工具',
  'auth_view': '点开登录界面',
  'divination_result': '春风问签',
  'danmaku_sent': '发送弹幕'
}

// 2. 工具路径映射
const TOOL_PATH_MAP: Record<string, string> = {
  '/tools/pomodoro': '番茄钟',
  '/tools/focus': '专注模式',
  '/tools/calendar': '日历',
  '/tools/memo': '备忘录',
  '/tools/noise': '白噪音',
  '/games/pixel-fishing': '像素钓鱼',
  '/relax/wooden-fish': '电子木鱼',
  '/relax/pet': '赛博宠物',
  '/reading': '阅读模式'
}

const loading = ref(true)
const events = ref<any[]>([])

const totalSessions = computed(() => new Set(events.value.map(e => e.session_id)).size)
const activeUsers = computed(() => new Set(events.value.filter(e => e.user_id).map(e => e.user_id)).size)

// Helper to check if event is from registered user
const isRegistered = (e: any) => !!e.user_id

const eventTimelineOption = computed(() => {
  const grouped: Record<string, number> = {}
  events.value.forEach(e => {
    // 3. 确保按小时分组 (MM-DD HH:00)
    const time = dayjs(e.created_at).format('MM-DD HH:00')
    grouped[time] = (grouped[time] || 0) + 1
  })
  
  const keys = Object.keys(grouped).sort()
  return {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: keys, name: '时间 (小时)' },
    yAxis: { type: 'value', name: '事件数' },
    series: [{ data: keys.map(k => grouped[k]), type: 'line', smooth: true, areaStyle: {} }]
  }
})

const behaviorTypeOption = computed(() => {
  const grouped: Record<string, number> = {}
  events.value.forEach(e => {
    // 仅统计关键行为
    if (!EVENT_NAME_MAP[e.event_name] && e.event_name !== 'page_view') return
    
    // 将 page_view 映射为更具体的行为或忽略
    let name = EVENT_NAME_MAP[e.event_name]
    if (!name) return

    if (e.event_name === 'tool_start' || e.event_name === 'tool_end') {
        const cleanUrl = e.url.replace(/^\/(en|zh)/, '')
        const toolName = Object.keys(TOOL_PATH_MAP).find(path => cleanUrl.includes(path))
        if (toolName) {
           name += ` [${TOOL_PATH_MAP[toolName]}]`
        }
    }
    
    grouped[name] = (grouped[name] || 0) + 1
  })
  
  return {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left', type: 'scroll' },
    series: [
      {
        name: '行为分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: Object.keys(grouped).map(k => ({ value: grouped[k], name: k }))
      }
    ]
  }
})

// 4. 工具使用排行图表配置
const toolUsageOption = computed(() => {
  const grouped: Record<string, { total: number, registered: number }> = {}
  
  events.value.forEach(e => {
    // 仅统计工具开始事件
    if (e.event_name !== 'tool_start' || !e.url) return
    
    // 移除语言前缀 (/en, /zh) 并匹配工具
    const cleanUrl = e.url.replace(/^\/(en|zh)/, '')
    // 简单匹配：只要包含工具路径前缀即可
    const toolName = Object.keys(TOOL_PATH_MAP).find(path => cleanUrl.includes(path))
    
    if (toolName) {
      const name = TOOL_PATH_MAP[toolName]
      if (!grouped[name]) grouped[name] = { total: 0, registered: 0 }
      grouped[name].total++
      if (isRegistered(e)) grouped[name].registered++
    }
  })
  
  // 排序
  const sorted = Object.entries(grouped).sort((a, b) => b[1].total - a[1].total)
  
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['总使用次数', '注册用户'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', boundaryGap: [0, 0.01], name: '使用次数' },
    yAxis: { type: 'category', data: sorted.map(i => i[0]) }, // 工具名称
    series: [
      {
        name: '总使用次数',
        type: 'bar',
        data: sorted.map(i => i[1].total),
        itemStyle: { color: '#6E2CF4' }
      },
      {
        name: '注册用户',
        type: 'bar',
        data: sorted.map(i => i[1].registered),
        itemStyle: { color: '#00C48C' }
      }
    ]
  }
})

const sessionList = computed(() => {
  const sessions: Record<string, any> = {}
  
  // 1. 按 Session ID 聚类
  events.value.forEach(e => {
    const sid = e.session_id || 'unknown'
    if (!sessions[sid]) {
      sessions[sid] = {
        id: sid,
        startTime: e.created_at,
        lastTime: e.created_at,
        isRegistered: !!e.user_id,
        events: []
      }
    }
    
    // 更新最后活动时间
    if (new Date(e.created_at) > new Date(sessions[sid].lastTime)) {
      sessions[sid].lastTime = e.created_at
    }
    // 更新开始时间（取最早的）
    if (new Date(e.created_at) < new Date(sessions[sid].startTime)) {
      sessions[sid].startTime = e.created_at
    }
    
    sessions[sid].events.push(e)
  })
  
  // 2. 处理每个 Session 的关键路径
  return Object.values(sessions)
    .sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime())
    .slice(0, 20) // 只取最近 20 个会话
    .map(session => {
      // 按时间正序排列事件
      const sortedEvents = session.events.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      
      const timeline: string[] = []
      
      sortedEvents.forEach((e: any) => {
        const time = dayjs(e.created_at).format('HH:mm:ss')
        
        if (e.event_name === 'tool_start') {
          const cleanUrl = e.url.replace(/^\/(en|zh)/, '')
          const toolName = Object.keys(TOOL_PATH_MAP).find(path => cleanUrl.includes(path))
          const pageName = toolName ? TOOL_PATH_MAP[toolName] : cleanUrl
          timeline.push(`${time} 开始使用 [${pageName}]`)
        } else if (e.event_name === 'tool_end') {
          const cleanUrl = e.properties?.path?.replace(/^\/(en|zh)/, '') || ''
          const toolName = Object.keys(TOOL_PATH_MAP).find(path => cleanUrl.includes(path))
          const pageName = toolName ? TOOL_PATH_MAP[toolName] : cleanUrl
          const duration = e.properties?.duration ? Math.round(e.properties.duration / 1000) + '秒' : ''
          timeline.push(`${time} 结束使用 [${pageName}] ${duration}`)
        } else if (e.event_name === 'auth_view') {
          timeline.push(`${time} 点开登录界面`)
        } else if (e.event_name === 'danmaku_sent') {
          timeline.push(`${time} 发送弹幕: ${e.properties?.length || 0}字`)
        } else if (e.event_name === 'divination_result') {
          timeline.push(`${time} 春风问签: ${e.properties?.hexagram || ''}`)
        }
      })
      
      return {
        id: session.id,
        startTime: session.startTime,
        duration: dayjs(session.lastTime).diff(dayjs(session.startTime), 'minute'),
        isRegistered: session.isRegistered,
        timeline
      }
    })
})

onMounted(async () => {
  if (!supabase) {
    loading.value = false
    return
  }
  
  const { data, error } = await supabase
    .from('analytics_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(2000)
    
  if (data) {
    events.value = data
  }
  loading.value = false
})
</script>

<template>
  <div class="dashboard-page moyu-page">
    <header class="dashboard-header moyu-panel">
      <div class="header-left">
        <h1>数据分析仪表盘</h1>
        <p>用户活动实时概览</p>
      </div>
      <div class="header-right">
        <span class="status-badge" :class="{ active: !loading }">
          {{ loading ? '加载中...' : '实时在线' }}
        </span>
      </div>
    </header>

    <div class="stats-grid">
      <div class="stat-card moyu-panel">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <h3>总会话数</h3>
          <div class="stat-value">{{ totalSessions }}</div>
        </div>
      </div>
      <div class="stat-card moyu-panel">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <h3>注册用户数</h3>
          <div class="stat-value">{{ activeUsers }}</div>
        </div>
      </div>
      <div class="stat-card moyu-panel">
        <div class="stat-icon">🔌</div>
        <div class="stat-content">
          <h3>注册用户占比</h3>
          <div class="stat-value">{{ totalSessions ? Math.round((activeUsers / totalSessions) * 100) : 0 }}%</div>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card moyu-panel">
        <h3>流量趋势 (事件/小时)</h3>
        <div class="chart-container">
          <v-chart class="chart" :option="eventTimelineOption" autoresize />
        </div>
      </div>
      <div class="chart-card moyu-panel">
        <h3>行为分布</h3>
        <div class="chart-container">
          <v-chart class="chart" :option="behaviorTypeOption" autoresize />
        </div>
      </div>
      <div class="chart-card moyu-panel full-width">
        <h3>热门工具排行</h3>
        <div class="chart-container">
          <v-chart class="chart" :option="toolUsageOption" autoresize />
        </div>
      </div>
    </div>
    
    <div class="recent-events moyu-panel">
      <h3>用户行为时间轴 (最近20个会话)</h3>
      <div class="session-list">
        <div v-for="session in sessionList" :key="session.id" class="session-card">
          <div class="session-header">
            <div class="session-info">
              <span class="session-id">会话: {{ session.id.substring(0, 8) }}...</span>
              <span v-if="session.isRegistered" class="user-badge registered">已注册</span>
              <span v-else class="user-badge guest">访客</span>
            </div>
            <span class="session-meta">
              {{ dayjs(session.startTime).format('MM-DD HH:mm') }} | 持续 {{ session.duration }} 分钟
            </span>
          </div>
          <div class="timeline">
            <div v-if="session.timeline.length === 0" class="empty-timeline">
              暂无关键行为
            </div>
            <div v-else v-for="(item, index) in session.timeline" :key="index" class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">{{ item }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.session-list {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.session-card {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  background: var(--color-surface); /* Changed to surface for better contrast */
  box-shadow: var(--shadow-sm); /* Added subtle shadow */
}

.session-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 8px;
}

.session-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  
  &.registered {
    background: color-mix(in srgb, var(--color-success) 10%, transparent);
    color: var(--color-success);
    border: 1px solid color-mix(in srgb, var(--color-success) 20%, transparent);
  }
  
  &.guest {
    background: color-mix(in srgb, var(--color-text-secondary) 10%, transparent);
    color: var(--color-text-secondary);
  }
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text);
}

.timeline-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
  flex-shrink: 0;
}

.empty-timeline {
  color: var(--color-text-secondary);
  font-size: 12px;
  font-style: italic;
}

.full-width {
  grid-column: 1 / -1;
}

.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-radius: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);

  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: var(--color-text);
  }

  p {
    margin: 4px 0 0;
    color: var(--color-text-secondary);
  }
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: var(--color-background);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-text-secondary);
  }

  &.active {
    color: var(--color-success);
    background: color-mix(in srgb, var(--color-success) 10%, transparent);
    
    &::before {
      background: var(--color-success);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-success) 20%, transparent);
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--color-primary);
  }
}

.stat-icon {
  font-size: 32px;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background);
  border-radius: 12px;
}

.stat-content {
  h3 {
    margin: 0;
    font-size: 14px;
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-text);
    line-height: 1.2;
    margin-top: 4px;
  }
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
}

.chart-card {
  padding: 24px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  min-height: 400px;
  display: flex;
  flex-direction: column;

  h3 {
    margin: 0 0 20px;
    font-size: 18px;
    color: var(--color-text);
  }
}

.chart-container {
  flex: 1;
  width: 100%;
  min-height: 300px;
}

.recent-events {
  padding: 24px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;

  h3 {
    margin: 0 0 20px;
    font-size: 18px;
    color: var(--color-text);
  }
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  th, td {
    text-align: left;
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-border);
  }

  th {
    color: var(--color-text-secondary);
    font-weight: 600;
    background: var(--color-background);
    
    &:first-child { border-top-left-radius: 8px; }
    &:last-child { border-top-right-radius: 8px; }
  }

  td {
    color: var(--color-text);
  }

  tr:last-child td {
    border-bottom: none;
  }
}

.event-tag {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 600;
}

.url-cell {
  color: var(--color-text-secondary);
  font-family: monospace;
}

.session-cell {
  color: var(--color-text-secondary);
  font-family: monospace;
  font-size: 12px;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
