<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { use } from 'echarts/core'
import { BarChart, LineChart, PieChart, RadarChart } from 'echarts/charts'
import { GridComponent, LegendComponent, RadarComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { fetchChildGrowthAdvice, fetchChildGrowthStats } from '@/features/child-portal/client'
import {
  buildGrowthStatsViewModel,
  GROWTH_RANGE_OPTIONS,
  getGrowthEmptyState,
  getGrowthTrendLabel,
  PRIORITY_LABELS,
  PRIORITY_TONES
} from '@/features/child-portal/growth-stats'
import { getDisplayName } from '@/features/child-portal/helpers'
import { ensureChildPortalSession, useChildPortalSession } from '@/features/child-portal/session'
import type {
  ChildGrowthAdviceResponse,
  ChildGrowthRange,
  ChildGrowthStatsResponse
} from '@/features/child-portal/types'

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  GridComponent,
  LegendComponent,
  RadarComponent,
  TooltipComponent
])

const router = useRouter()
const { width: windowWidth } = useWindowSize()
const { childPortalSession } = useChildPortalSession()

const range = ref<ChildGrowthRange>('90d')
const loading = ref(true)
const errorMessage = ref('')
const stats = ref<ChildGrowthStatsResponse | null>(null)

const adviceOpen = ref(false)
const adviceLoading = ref(false)
const adviceError = ref('')
const advice = ref<ChildGrowthAdviceResponse | null>(null)
const adviceRange = ref<ChildGrowthRange | null>(null)

const chartPalette = {
  ink: '#213b56',
  softInk: '#5f7591',
  sky: '#45aef5',
  skyDeep: '#2c86df',
  mint: '#49d38b',
  amber: '#ffbf55',
  amberDeep: '#f09b2a',
  rose: '#ff8d7a',
  line: 'rgba(115, 148, 185, 0.28)',
  tooltip: 'rgba(255, 252, 246, 0.98)'
} as const

const sceneStickers = [
  { key: 'mountain', icon: 'ph:mountains-fill', className: 'growth-scene--mountain' },
  { key: 'tree', icon: 'ph:tree-evergreen-fill', className: 'growth-scene--tree' },
  { key: 'waves', icon: 'ph:waves-fill', className: 'growth-scene--waves' },
  { key: 'camp', icon: 'ph:campfire-fill', className: 'growth-scene--camp' }
] as const

const childProfile = computed(() => stats.value?.child_profile || childPortalSession.value?.childProfile || {})
const displayName = computed(() => getDisplayName(childProfile.value))
const emptyState = computed(() => getGrowthEmptyState(stats.value))
const isPhone = computed(() => windowWidth.value <= 768)
const isTablet = computed(() => windowWidth.value <= 1199)
const isCompactDrawer = computed(() => windowWidth.value <= 900)
const viewModel = computed(() => (stats.value ? buildGrowthStatsViewModel(stats.value) : null))
const topRisk = computed(() => viewModel.value?.risk_flags[0] || null)
const trendLabel = computed(() => (
  viewModel.value ? getGrowthTrendLabel(viewModel.value.trend_direction) : '持平中'
))

const leadMessage = computed(() => {
  const model = viewModel.value
  if (!model) return ''
  const focusCategory = model.category_risks[0]
  if (!focusCategory) {
    return `${displayName.value} 最近的成长航线 ${trendLabel.value}，整体节奏比较平稳。`
  }
  return `${displayName.value} 最近最值得先看的是 ${focusCategory.label}，目前走势 ${trendLabel.value}。`
})

const routeMetrics = computed(() => {
  const model = viewModel.value
  const snapshot = stats.value
  if (!model || !snapshot) return []

  const completedInRange = snapshot.digest?.completed_in_range
    ?? model.execution_series.completed.reduce((sum, value) => sum + value, 0)

  return [
    { key: 'streak', label: '连续活跃', value: `${model.execution_series.streak_days}天`, icon: 'ph:shooting-star-fill', tone: 'sky' },
    { key: 'completed', label: '本段完成', value: `${completedInRange}项`, icon: 'ph:flag-checkered-fill', tone: 'mint' },
    { key: 'reward', label: '待兑现', value: `${model.reward_fulfillment.pending_carry_count}项`, icon: 'ph:gift-fill', tone: 'amber' }
  ]
})

const sparseLabelStep = computed(() => {
  if (range.value === '7d') return 1
  if (range.value === '30d') return isPhone.value ? 4 : isTablet.value ? 3 : 2
  return isPhone.value ? 3 : 2
})

function formatAxisLabel(value: string, index: number, total: number) {
  if (index === 0 || index === total - 1 || index % sparseLabelStep.value === 0) {
    return value
  }
  return ''
}

function getToneColor(tone: 'sky' | 'mint' | 'rose' | 'amber') {
  if (tone === 'mint') return chartPalette.mint
  if (tone === 'rose') return chartPalette.rose
  if (tone === 'amber') return chartPalette.amber
  return chartPalette.sky
}

const executionOption = computed(() => {
  const model = viewModel.value
  if (!model) return {}

  const labels = model.execution_series.labels
  const lowPointIndex = model.execution_series.low_point_index
  const lowPointValue = lowPointIndex > -1 ? model.execution_series.completion_rate[lowPointIndex] : null

  return {
    animationDuration: 700,
    color: [chartPalette.amber, chartPalette.mint, chartPalette.rose, chartPalette.skyDeep],
    tooltip: {
      trigger: 'axis',
      backgroundColor: chartPalette.tooltip,
      borderColor: 'rgba(255,255,255,0.85)',
      textStyle: { color: chartPalette.ink },
      extraCssText: 'border-radius:18px; box-shadow:0 18px 36px rgba(47,86,128,0.16); padding:14px 16px;',
      formatter: (params: Array<{ marker: string; seriesName: string; value: number | string }>) =>
        params.map((item) => `<div>${item.marker}${item.seriesName}：${item.value}${item.seriesName === '完成率' ? '%' : ''}</div>`).join('')
    },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 14,
      itemHeight: 14,
      icon: 'roundRect',
      textStyle: { color: chartPalette.softInk, fontSize: isPhone.value ? 11 : 12, fontWeight: 700 }
    },
    grid: {
      left: isPhone.value ? 18 : 28,
      right: isPhone.value ? 12 : 24,
      top: 58,
      bottom: isPhone.value ? 24 : 18,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: chartPalette.line } },
      axisTick: { show: false },
      axisLabel: {
        color: chartPalette.softInk,
        fontWeight: 700,
        fontSize: isPhone.value ? 11 : 12,
        formatter: (value: string, index: number) => formatAxisLabel(value, index, labels.length)
      }
    },
    yAxis: [
      {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: chartPalette.softInk, fontWeight: 700 },
        splitLine: { lineStyle: { color: chartPalette.line, type: 'dashed' } }
      },
      {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: { color: chartPalette.softInk, fontWeight: 700, formatter: '{value}%' },
        splitLine: { show: false }
      }
    ],
    series: [
      { name: '提交', type: 'bar', barMaxWidth: isPhone.value ? 12 : 16, itemStyle: { color: chartPalette.amber, borderRadius: [10, 10, 0, 0], opacity: 0.7 }, data: model.execution_series.submitted },
      { name: '完成', type: 'bar', barMaxWidth: isPhone.value ? 12 : 16, itemStyle: { color: chartPalette.mint, borderRadius: [10, 10, 0, 0] }, data: model.execution_series.completed },
      { name: '未通过', type: 'bar', barMaxWidth: isPhone.value ? 12 : 16, itemStyle: { color: chartPalette.rose, borderRadius: [10, 10, 0, 0] }, data: model.execution_series.rejected },
      {
        name: '完成率',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        connectNulls: false,
        symbol: 'circle',
        symbolSize: isPhone.value ? 6 : 8,
        lineStyle: { width: 4, color: chartPalette.skyDeep },
        itemStyle: { color: chartPalette.skyDeep },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(69, 174, 245, 0.28)' },
              { offset: 1, color: 'rgba(69, 174, 245, 0)' }
            ]
          }
        },
        markPoint: lowPointIndex > -1 && typeof lowPointValue === 'number'
          ? {
              symbol: 'pin',
              symbolSize: isPhone.value ? 46 : 56,
              data: [
                {
                  coord: [labels[lowPointIndex], lowPointValue],
                  value: `${lowPointValue}%`,
                  itemStyle: { color: chartPalette.rose },
                  label: { color: '#ffffff', fontWeight: 800, fontSize: isPhone.value ? 10 : 11, formatter: '低谷\n{c}' }
                }
              ]
            }
          : undefined,
        data: model.execution_series.completion_rate
      }
    ]
  }
})

const compassOption = computed(() => {
  const model = viewModel.value
  if (!model) return {}

  return {
    animationDuration: 700,
    color: [chartPalette.skyDeep],
    tooltip: {
      backgroundColor: chartPalette.tooltip,
      borderColor: 'rgba(255,255,255,0.85)',
      textStyle: { color: chartPalette.ink },
      extraCssText: 'border-radius:18px; box-shadow:0 18px 36px rgba(47,86,128,0.16); padding:12px 14px;'
    },
    radar: {
      center: ['50%', '54%'],
      radius: isPhone.value ? '64%' : '72%',
      splitNumber: 4,
      shape: 'polygon',
      axisName: { color: chartPalette.ink, fontSize: isPhone.value ? 11 : 12, fontWeight: 800 },
      splitArea: {
        areaStyle: {
          color: ['rgba(255,255,255,0.48)', 'rgba(248,252,255,0.74)', 'rgba(255,255,255,0.48)', 'rgba(248,252,255,0.74)']
        }
      },
      axisLine: { lineStyle: { color: 'rgba(117, 151, 188, 0.24)' } },
      splitLine: { lineStyle: { color: 'rgba(117, 151, 188, 0.24)' } },
      indicator: model.compass_scores.map((item) => ({ name: item.label, max: 100 }))
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: model.compass_scores.map((item) => item.value),
            name: '成长罗盘',
            lineStyle: { width: 3, color: chartPalette.skyDeep },
            areaStyle: { color: 'rgba(69, 174, 245, 0.24)' },
            itemStyle: { color: chartPalette.skyDeep },
            symbol: 'circle',
            symbolSize: 7
          }
        ]
      }
    ]
  }
})

const categoryOption = computed(() => {
  const model = viewModel.value
  if (!model) return {}

  const items = model.category_risks
  return {
    animationDuration: 700,
    color: [chartPalette.mint, chartPalette.rose, chartPalette.amberDeep],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: chartPalette.tooltip,
      borderColor: 'rgba(255,255,255,0.85)',
      textStyle: { color: chartPalette.ink },
      extraCssText: 'border-radius:18px; box-shadow:0 18px 36px rgba(47,86,128,0.16); padding:14px 16px;',
      formatter: (params: Array<{ dataIndex: number }>) => {
        const item = items[params[0]?.dataIndex ?? 0]
        if (!item) return ''
        return [
          `<strong>${item.label}</strong>`,
          `提交：${item.submitted}`,
          `完成：${item.completed}`,
          `未通过：${item.rejected}`,
          `未闭环：${item.open_loop}`
        ].map((row) => `<div>${row}</div>`).join('')
      }
    },
    legend: {
      top: 0,
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 14,
      textStyle: { color: chartPalette.softInk, fontWeight: 700, fontSize: isPhone.value ? 11 : 12 }
    },
    grid: {
      left: isPhone.value ? 72 : 110,
      right: isPhone.value ? 18 : 48,
      top: 54,
      bottom: 10,
      containLabel: true
    },
    xAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: chartPalette.softInk, fontWeight: 700 },
      splitLine: { lineStyle: { color: chartPalette.line, type: 'dashed' } }
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: items.map((item) => item.label),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: chartPalette.ink, fontWeight: 800, fontSize: isPhone.value ? 11 : 12 }
    },
    series: [
      { name: '完成', type: 'bar', stack: 'terrain', barMaxWidth: isPhone.value ? 16 : 20, itemStyle: { color: chartPalette.mint, borderRadius: [10, 0, 0, 10] }, data: items.map((item) => item.completed) },
      { name: '未通过', type: 'bar', stack: 'terrain', barMaxWidth: isPhone.value ? 16 : 20, itemStyle: { color: chartPalette.rose }, data: items.map((item) => item.rejected) },
      {
        name: '未闭环',
        type: 'bar',
        stack: 'terrain',
        barMaxWidth: isPhone.value ? 16 : 20,
        label: {
          show: true,
          position: 'right',
          color: chartPalette.ink,
          fontWeight: 800,
          fontSize: isPhone.value ? 10 : 11,
          formatter: ({ dataIndex }: { dataIndex: number }) => {
            const item = items[dataIndex]
            return item ? `提交 ${item.submitted}` : ''
          }
        },
        itemStyle: { color: chartPalette.amberDeep, borderRadius: [0, 10, 10, 0] },
        data: items.map((item) => item.open_loop)
      }
    ]
  }
})

const rewardStatusOption = computed(() => {
  const model = viewModel.value
  if (!model) return {}

  const items = model.reward_fulfillment.status_breakdown
  return {
    animationDuration: 700,
    tooltip: {
      trigger: 'item',
      backgroundColor: chartPalette.tooltip,
      borderColor: 'rgba(255,255,255,0.85)',
      textStyle: { color: chartPalette.ink },
      extraCssText: 'border-radius:18px; box-shadow:0 18px 36px rgba(47,86,128,0.16); padding:12px 14px;'
    },
    series: [
      {
        type: 'pie',
        radius: isPhone.value ? ['50%', '74%'] : ['56%', '78%'],
        center: ['50%', '52%'],
        minAngle: 12,
        padAngle: 2,
        labelLine: { length: isPhone.value ? 10 : 14, length2: isPhone.value ? 8 : 10 },
        label: {
          color: chartPalette.ink,
          fontWeight: 800,
          fontSize: isPhone.value ? 10 : 11,
          formatter: '{b|{b}}\n{c|{c}}',
          rich: {
            b: { fontWeight: 800, color: chartPalette.ink, lineHeight: 18 },
            c: { fontWeight: 700, color: chartPalette.softInk }
          }
        },
        itemStyle: { borderColor: 'rgba(255,255,255,0.92)', borderWidth: 4, borderRadius: 10 },
        data: items.map((item) => ({ name: item.label, value: item.value, itemStyle: { color: getToneColor(item.tone) } }))
      }
    ]
  }
})

const rewardTrendOption = computed(() => {
  const model = viewModel.value
  if (!model) return {}

  const labels = model.reward_fulfillment.labels
  return {
    animationDuration: 700,
    color: [chartPalette.amber, chartPalette.skyDeep],
    tooltip: {
      trigger: 'axis',
      backgroundColor: chartPalette.tooltip,
      borderColor: 'rgba(255,255,255,0.85)',
      textStyle: { color: chartPalette.ink },
      extraCssText: 'border-radius:18px; box-shadow:0 18px 36px rgba(47,86,128,0.16); padding:14px 16px;'
    },
    legend: {
      top: 0,
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 14,
      textStyle: { color: chartPalette.softInk, fontWeight: 700, fontSize: isPhone.value ? 11 : 12 }
    },
    grid: {
      left: isPhone.value ? 18 : 26,
      right: isPhone.value ? 12 : 18,
      top: 52,
      bottom: 12,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: chartPalette.line } },
      axisTick: { show: false },
      axisLabel: {
        color: chartPalette.softInk,
        fontWeight: 700,
        fontSize: isPhone.value ? 11 : 12,
        formatter: (value: string, index: number) => formatAxisLabel(value, index, labels.length)
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: chartPalette.softInk, fontWeight: 700 },
      splitLine: { lineStyle: { color: chartPalette.line, type: 'dashed' } }
    },
    series: [
      { name: '已兑换', type: 'bar', barMaxWidth: isPhone.value ? 14 : 18, itemStyle: { color: chartPalette.amber, borderRadius: [10, 10, 0, 0] }, data: model.reward_fulfillment.redeemed },
      { name: '已使用', type: 'line', smooth: true, symbol: 'circle', symbolSize: isPhone.value ? 6 : 8, lineStyle: { width: 4, color: chartPalette.skyDeep }, itemStyle: { color: chartPalette.skyDeep }, data: model.reward_fulfillment.used }
    ]
  }
})

async function loadStats(showLoading = true) {
  if (showLoading) loading.value = true
  errorMessage.value = ''

  try {
    const session = await ensureChildPortalSession()
    if (!session?.webSessionToken) {
      throw new Error('当前会话已经失效，请重新打开家长分享的儿童入口。')
    }
    stats.value = await fetchChildGrowthStats(session.webSessionToken, range.value)
  } catch (error) {
    errorMessage.value = String((error as { message?: string })?.message || '成长统计加载失败')
  } finally {
    if (showLoading) loading.value = false
  }
}

async function loadAdvice(force = false) {
  if (!force && advice.value && adviceRange.value === range.value) return

  adviceLoading.value = true
  adviceError.value = ''

  try {
    const session = await ensureChildPortalSession()
    if (!session?.webSessionToken) {
      throw new Error('当前会话已经失效，请重新打开儿童入口。')
    }
    advice.value = await fetchChildGrowthAdvice(session.webSessionToken, range.value)
    adviceRange.value = range.value
  } catch (error) {
    adviceError.value = String((error as { message?: string })?.message || 'AIGC 分析失败')
  } finally {
    adviceLoading.value = false
  }
}

function openAdviceDrawer() {
  adviceOpen.value = true
  void loadAdvice(false)
}

function closeAdviceDrawer() {
  adviceOpen.value = false
}

function goHome() {
  void router.push('/child/home')
}

watch(range, () => {
  advice.value = null
  adviceRange.value = null
  void loadStats(true)
  if (adviceOpen.value) void loadAdvice(true)
})

onMounted(() => {
  void loadStats(true)
})
</script>

<template>
  <section class="growth-page">
    <div class="growth-page__backdrop"></div>
    <div class="growth-page__halo growth-page__halo--left"></div>
    <div class="growth-page__halo growth-page__halo--right"></div>

    <header class="growth-topbar">
      <div class="growth-topbar__inner">
        <button type="button" class="growth-topbar__back" @click="goHome">
          <Icon icon="ph:caret-left-bold" />
          <span>返回儿童首页</span>
        </button>

        <div class="growth-topbar__title">
          <span class="growth-topbar__eyebrow">成长航线</span>
          <h1>成长统计</h1>
          <p>和 {{ displayName }} 一起看清最近的成长节奏。</p>
        </div>

        <div class="growth-topbar__ranges">
          <button
            v-for="item in GROWTH_RANGE_OPTIONS"
            :key="item.value"
            type="button"
            class="growth-range"
            :class="{ 'growth-range--active': range === item.value }"
            @click="range = item.value"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
    </header>

    <main class="growth-shell">
      <section v-if="loading" class="growth-loading">
        <div class="growth-loading__hero"></div>
        <div class="growth-loading__grid">
          <div class="growth-loading__panel"></div>
          <div class="growth-loading__panel"></div>
          <div class="growth-loading__panel growth-loading__panel--wide"></div>
        </div>
      </section>

      <section v-else-if="errorMessage" class="growth-state growth-state--error">
        <Icon icon="ph:warning-circle-duotone" />
        <h2>成长统计暂时打不开</h2>
        <p>{{ errorMessage }}</p>
        <button type="button" @click="loadStats(true)">重新加载</button>
      </section>

      <section v-else-if="emptyState" class="growth-state growth-state--empty">
        <Icon icon="ph:binoculars-duotone" />
        <h2>还没有新的成长航线</h2>
        <p>{{ emptyState }}</p>
      </section>

      <template v-else-if="stats && viewModel">
        <section class="growth-hero">
          <div
            v-for="item in sceneStickers"
            :key="item.key"
            class="growth-scene"
            :class="item.className"
          >
            <Icon :icon="item.icon" />
          </div>

          <div class="growth-hero__header">
            <div>
              <span class="growth-pill growth-pill--sky">
                <Icon icon="ph:map-trifold-fill" />
                习惯执行航线
              </span>
              <h2>先看路线，再看分叉</h2>
              <p>{{ leadMessage }}</p>
            </div>

            <div v-if="topRisk" class="growth-hero__focus" :class="`growth-hero__focus--${topRisk.tone}`">
              <span>当前提醒</span>
              <strong>{{ topRisk.label }}</strong>
              <p>{{ topRisk.detail }}</p>
            </div>
          </div>

          <div class="growth-signal-strip">
            <article
              v-for="item in viewModel.summary_signals"
              :key="item.key"
              class="growth-signal"
              :class="`growth-signal--${item.tone}`"
            >
              <span class="growth-signal__icon">
                <Icon :icon="item.icon" />
              </span>
              <div class="growth-signal__body">
                <small>{{ item.label }}</small>
                <strong>{{ item.value }}</strong>
                <p>{{ item.detail }}</p>
              </div>
            </article>
          </div>

          <div class="growth-hero__chart">
            <v-chart class="growth-chart growth-chart--hero" :option="executionOption" autoresize />
          </div>

          <div class="growth-route-metrics">
            <div
              v-for="item in routeMetrics"
              :key="item.key"
              class="growth-route-metric"
              :class="`growth-route-metric--${item.tone}`"
            >
              <Icon :icon="item.icon" />
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>

          <div class="growth-risk-strip">
            <div
              v-for="item in viewModel.risk_flags"
              :key="item.key"
              class="growth-risk"
              :class="`growth-risk--${item.tone}`"
            >
              <strong>{{ item.label }}</strong>
              <span>{{ item.detail }}</span>
            </div>
          </div>
        </section>

        <section class="growth-grid">
          <article class="growth-panel growth-panel--compass">
            <header class="growth-panel__header">
              <div>
                <span class="growth-pill growth-pill--mint">
                  <Icon icon="ph:compass-tool-fill" />
                  成长罗盘
                </span>
                <h3>把稳定度和回升势头一起看</h3>
              </div>
            </header>

            <v-chart class="growth-chart growth-chart--radar" :option="compassOption" autoresize />
          </article>

          <article class="growth-panel growth-panel--terrain">
            <header class="growth-panel__header">
              <div>
                <span class="growth-pill growth-pill--amber">
                  <Icon icon="ph:mountains-fill" />
                  任务地形分布
                </span>
                <h3>先看哪些习惯更容易掉队</h3>
              </div>
            </header>

            <v-chart class="growth-chart growth-chart--terrain" :option="categoryOption" autoresize />
          </article>

          <article class="growth-panel growth-panel--reward">
            <header class="growth-panel__header growth-panel__header--reward">
              <div>
                <span class="growth-pill growth-pill--rose">
                  <Icon icon="ph:treasure-chest-fill" />
                  奖励兑现轨迹
                </span>
                <h3>奖励有没有真正走到兑现这一步</h3>
              </div>

              <div class="growth-panel__reward-meta">
                <span>兑现率 {{ viewModel.reward_fulfillment.fulfillment_rate }}%</span>
                <span>待兑现 {{ viewModel.reward_fulfillment.pending_carry_count }} 项</span>
              </div>
            </header>

            <div class="growth-reward-layout">
              <div class="growth-reward-chart growth-reward-chart--ring">
                <v-chart class="growth-chart growth-chart--reward-ring" :option="rewardStatusOption" autoresize />
              </div>

              <div class="growth-reward-chart">
                <v-chart class="growth-chart growth-chart--reward-trend" :option="rewardTrendOption" autoresize />
              </div>
            </div>
          </article>
        </section>
      </template>
    </main>

    <button type="button" class="growth-aigc-entry" @click="openAdviceDrawer">
      <Icon icon="ph:sparkle-fill" />
      <span>AIGC 建议</span>
    </button>

    <transition name="growth-drawer-fade">
      <div v-if="adviceOpen" class="growth-drawer-mask" @click="closeAdviceDrawer">
        <aside
          class="growth-drawer"
          :class="{ 'growth-drawer--bottom': isCompactDrawer }"
          @click.stop
        >
          <div class="growth-drawer__header">
            <div>
              <span>冒险导师</span>
              <h3>下一步建议</h3>
            </div>
            <div class="growth-drawer__actions">
              <button type="button" class="action-btn action-btn--secondary" @click="loadAdvice(true)">
                <Icon icon="ph:arrows-clockwise-bold" />
                <span>重新分析</span>
              </button>
              <button type="button" class="action-btn action-btn--primary" @click="closeAdviceDrawer">关闭</button>
            </div>
          </div>

          <div v-if="adviceLoading" class="growth-drawer__skeleton">
            <div v-for="item in 3" :key="item" class="growth-drawer__skeleton-card"></div>
          </div>

          <div v-else-if="adviceError" class="growth-drawer__error">
            <Icon icon="ph:warning-circle-duotone" />
            <p>{{ adviceError }}</p>
            <button type="button" @click="loadAdvice(true)">再试一次</button>
          </div>

          <div v-else class="growth-drawer__cards">
            <article
              v-for="(item, index) in advice?.advice_cards || []"
              :key="`${item.title}-${index}`"
              class="growth-advice-card"
              :class="`growth-advice-card--${PRIORITY_TONES[item.priority]}`"
            >
              <div class="growth-advice-card__top">
                <span class="growth-advice-card__priority">{{ PRIORITY_LABELS[item.priority] }}</span>
                <strong>#{{ index + 1 }}</strong>
              </div>
              <h4>{{ item.title }}</h4>
              <p>{{ item.reason }}</p>
              <div class="growth-advice-card__tags">
                <span v-for="tag in item.based_on" :key="tag">{{ tag }}</span>
              </div>
              <div class="growth-advice-card__next">
                <Icon icon="ph:arrow-right-bold" />
                <span>{{ item.next_step }}</span>
              </div>
            </article>
          </div>
        </aside>
      </div>
    </transition>
  </section>
</template>

<style scoped lang="scss">
@use '@/features/child-portal/adventure-theme.scss' as theme;

.growth-page {
  --growth-ink: #213b56;
  --growth-soft-ink: #5f7591;
  --growth-sky: #45aef5;
  --growth-sky-deep: #2c86df;
  --growth-mint: #49d38b;
  --growth-amber: #ffbf55;
  --growth-amber-deep: #ef9b2a;
  --growth-rose: #ff8d7a;
  --growth-paper: rgba(255, 255, 255, 0.92);

  position: relative;
  min-height: 100vh;
  padding: 20px 24px calc(120px + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(180deg, #ecf8ff 0%, #f6fbff 32%, #fff6df 100%);
  color: var(--growth-ink);
  overflow-x: hidden;
  font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;

  @include theme.respond-max(phone) {
    padding: 16px 14px calc(108px + env(safe-area-inset-bottom, 0px));
  }
}

.growth-page__backdrop,
.growth-page__halo {
  position: fixed;
  pointer-events: none;
}

.growth-page__backdrop {
  inset: 0;
  background:
    radial-gradient(circle at 10% 16%, rgba(255, 220, 125, 0.45), transparent 32%),
    radial-gradient(circle at 92% 14%, rgba(77, 184, 255, 0.28), transparent 26%),
    radial-gradient(circle at 88% 84%, rgba(73, 211, 139, 0.2), transparent 28%);
  z-index: 0;
}

.growth-page__halo {
  z-index: 1;
  border-radius: 999px;
  filter: blur(60px);
  opacity: 0.42;
}

.growth-page__halo--left {
  width: 220px;
  height: 220px;
  left: -80px;
  top: 200px;
  background: rgba(255, 191, 85, 0.42);
}

.growth-page__halo--right {
  width: 260px;
  height: 260px;
  right: -100px;
  top: 420px;
  background: rgba(69, 174, 245, 0.26);
}

.growth-topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  padding-bottom: 18px;
}

.growth-topbar__inner {
  @include theme.sign-shell(
    linear-gradient(135deg, rgba(255, 245, 205, 0.95) 0%, rgba(213, 239, 255, 0.98) 45%, rgba(255, 255, 255, 0.98) 100%),
    #213b56,
    #86b3d8
  );
  max-width: 1320px;
  margin: 0 auto;
  position: relative;
  z-index: 2;

  @include theme.respond-max(tablet) {
    gap: 16px;
  }
}

.growth-topbar__back {
  @include theme.stat-chip;
  border: none;
  cursor: pointer;
  color: var(--growth-ink);
  font-size: 14px;
  font-weight: 900;
  transition: transform 0.24s ease, box-shadow 0.24s ease;

  svg {
    font-size: 16px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 20px rgba(47, 86, 128, 0.12);
  }
}

.growth-topbar__title {
  flex: 1;

  h1 {
    margin: 4px 0 0;
    font-family: 'STZhongsong', 'Songti SC', 'Noto Serif SC', serif;
    font-size: clamp(34px, 4vw, 52px);
    font-weight: 900;
    line-height: 1;
    letter-spacing: 1px;
  }

  p {
    margin: 10px 0 0;
    color: var(--growth-soft-ink);
    font-size: 15px;
    font-weight: 700;
  }
}

.growth-topbar__eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(34, 139, 203, 0.12);
  color: var(--growth-sky-deep);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.growth-topbar__ranges {
  display: inline-flex;
  gap: 8px;
  padding: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.86);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);

  @include theme.respond-max(phone) {
    width: 100%;
    justify-content: space-between;
  }
}

.growth-range {
  border: none;
  background: transparent;
  color: var(--growth-soft-ink);
  padding: 10px 18px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  transition: transform 0.24s ease, background 0.24s ease, color 0.24s ease;

  &:hover {
    transform: translateY(-1px);
  }

  @include theme.respond-max(phone) {
    flex: 1;
    padding: 10px 0;
  }
}

.growth-range--active {
  background: linear-gradient(135deg, var(--growth-sky) 0%, var(--growth-sky-deep) 100%);
  color: #ffffff;
  box-shadow: 0 10px 18px rgba(44, 134, 223, 0.28);
}

.growth-shell {
  @include theme.page-shell;
  max-width: 1320px;
  position: relative;
  z-index: 2;
}

.growth-loading {
  display: grid;
  gap: 24px;
}

.growth-loading__hero,
.growth-loading__panel {
  position: relative;
  overflow: hidden;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.84);
  border: 3px solid rgba(255, 255, 255, 0.86);
  box-shadow: 0 18px 28px rgba(56, 86, 123, 0.08);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.84), transparent);
    transform: translateX(-100%);
    animation: growthScan 1.8s infinite ease-in-out;
  }
}

.growth-loading__hero {
  min-height: 420px;
}

.growth-loading__grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 24px;

  @include theme.respond-max(phone) {
    grid-template-columns: 1fr;
  }
}

.growth-loading__panel {
  min-height: 320px;
  grid-column: span 6;
}

.growth-loading__panel--wide {
  grid-column: 1 / -1;
}

.growth-state {
  @include theme.empty-state(320px);
  @include theme.surface-card(40px, 30px);
  gap: 14px;

  h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 900;
    color: var(--growth-ink);
  }

  p {
    max-width: 440px;
  }
}

.growth-state--error {
  button {
    border: none;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--growth-sky) 0%, var(--growth-sky-deep) 100%);
    color: #ffffff;
    padding: 12px 22px;
    font-weight: 900;
    cursor: pointer;
    box-shadow: 0 12px 20px rgba(44, 134, 223, 0.24);
  }
}

.growth-hero,
.growth-panel {
  @include theme.surface-card(26px, 30px);
}

.growth-hero {
  position: relative;
  overflow: hidden;
  padding: 30px 30px 24px;
  background: linear-gradient(180deg, rgba(255, 252, 243, 0.96) 0%, rgba(245, 250, 255, 0.98) 58%, rgba(255, 255, 255, 0.96) 100%);

  &::before {
    content: '';
    position: absolute;
    inset: auto 10% 108px 8%;
    height: 0;
    border-top: 4px dashed rgba(73, 174, 245, 0.34);
    transform: rotate(-2.2deg);
  }

  &::after {
    content: '';
    position: absolute;
    inset: auto auto 92px 16%;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--growth-sky) 0%, var(--growth-sky-deep) 100%);
    border: 4px solid rgba(255, 255, 255, 0.92);
    box-shadow: 0 0 0 6px rgba(69, 174, 245, 0.14);
    animation: portalOrbPulse 2.8s ease-in-out infinite;
  }

  @include theme.respond-max(phone) {
    padding: 22px 18px 18px;
    border-radius: 26px;
  }
}

.growth-scene {
  position: absolute;
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.58);
  color: var(--growth-soft-ink);
  opacity: 0.88;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.76);
  pointer-events: none;

  svg {
    font-size: 28px;
  }

  @include theme.respond-max(phone) {
    width: 42px;
    height: 42px;

    svg {
      font-size: 22px;
    }
  }
}

.growth-scene--mountain {
  top: 18px;
  right: 26px;
  color: rgba(83, 118, 148, 0.8);
}

.growth-scene--tree {
  right: 112px;
  top: 146px;
  color: rgba(67, 163, 100, 0.85);
}

.growth-scene--waves {
  left: 28px;
  bottom: 34px;
  color: rgba(64, 168, 233, 0.82);
}

.growth-scene--camp {
  left: 136px;
  top: 112px;
  color: rgba(240, 155, 42, 0.82);
}

.growth-hero__header,
.growth-panel__header {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;

  h2,
  h3 {
    margin: 14px 0 0;
    font-size: clamp(24px, 2.8vw, 34px);
    font-weight: 900;
    line-height: 1.1;
    color: var(--growth-ink);
  }

  p {
    margin: 10px 0 0;
    color: var(--growth-soft-ink);
    font-size: 15px;
    font-weight: 700;
  }

  @include theme.respond-max(tablet) {
    flex-direction: column;
  }
}

.growth-panel__header {
  h3 {
    font-size: clamp(22px, 2.4vw, 28px);
  }
}

.growth-panel__header--reward {
  @include theme.respond-max(tablet) {
    align-items: stretch;
  }
}

.growth-hero__focus {
  min-width: min(320px, 100%);
  padding: 18px 20px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.82);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);

  span {
    display: inline-flex;
    align-items: center;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.78);
    font-size: 12px;
    font-weight: 900;
  }

  strong {
    display: block;
    margin-top: 12px;
    font-size: 19px;
    font-weight: 900;
  }

  p {
    margin-top: 8px;
    font-size: 14px;
  }
}

.growth-hero__focus--rose {
  background: rgba(255, 242, 239, 0.94);
  color: #8b473f;
}

.growth-hero__focus--amber {
  background: rgba(255, 247, 228, 0.94);
  color: #8d5a13;
}

.growth-hero__focus--sky {
  background: rgba(239, 248, 255, 0.94);
  color: #275f9f;
}

.growth-hero__focus--mint {
  background: rgba(239, 255, 247, 0.94);
  color: #21644c;
}

.growth-pill {
  @include theme.title-pill(
    linear-gradient(135deg, rgba(255, 255, 255, 0.78) 0%, rgba(255, 255, 255, 0.54) 100%),
    #213b56
  );
}

.growth-pill--sky {
  background: linear-gradient(135deg, #e0f4ff 0%, #c4ecff 100%);
}

.growth-pill--mint {
  background: linear-gradient(135deg, #e7fff1 0%, #c7f8dc 100%);
}

.growth-pill--amber {
  background: linear-gradient(135deg, #fff7df 0%, #ffe4a3 100%);
}

.growth-pill--rose {
  background: linear-gradient(135deg, #fff0ea 0%, #ffd6ca 100%);
}

.growth-signal-strip {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 22px;

  @include theme.respond-max(tablet) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @include theme.respond-max(phone) {
    grid-template-columns: 1fr;
    margin-top: 18px;
  }
}

.growth-signal {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 16px 16px 14px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.84);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.76);
}

.growth-signal__icon {
  width: 42px;
  height: 42px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  color: #ffffff;
  flex: none;

  svg {
    font-size: 22px;
  }
}

.growth-signal--sky .growth-signal__icon {
  background: linear-gradient(135deg, var(--growth-sky) 0%, var(--growth-sky-deep) 100%);
}

.growth-signal--mint .growth-signal__icon {
  background: linear-gradient(135deg, #58dd93 0%, #1fb878 100%);
}

.growth-signal--amber .growth-signal__icon {
  background: linear-gradient(135deg, #ffc972 0%, #f09b2a 100%);
}

.growth-signal--rose .growth-signal__icon {
  background: linear-gradient(135deg, #ffa28f 0%, #ff7a68 100%);
}

.growth-signal__body {
  min-width: 0;

  small {
    display: block;
    color: var(--growth-soft-ink);
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.04em;
  }

  strong {
    display: block;
    margin-top: 8px;
    font-size: 24px;
    font-weight: 900;
    line-height: 1;
  }

  p {
    margin: 8px 0 0;
    color: var(--growth-soft-ink);
    font-size: 13px;
    font-weight: 700;
    line-height: 1.5;
  }
}

.growth-hero__chart {
  position: relative;
  z-index: 2;
  margin-top: 20px;
}

.growth-chart {
  width: 100%;
}

.growth-chart--hero {
  height: 430px;

  @include theme.respond-max(phone) {
    height: 340px;
  }
}

.growth-chart--radar,
.growth-chart--terrain {
  height: 320px;

  @include theme.respond-max(phone) {
    height: 280px;
  }
}

.growth-chart--reward-ring,
.growth-chart--reward-trend {
  height: 320px;

  @include theme.respond-max(phone) {
    height: 260px;
  }
}

.growth-route-metrics {
  position: relative;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
}

.growth-route-metric {
  @include theme.stat-chip;
  font-weight: 900;
  color: var(--growth-ink);

  svg {
    font-size: 18px;
  }

  span {
    color: var(--growth-soft-ink);
    font-size: 13px;
  }

  strong {
    font-size: 16px;
  }
}

.growth-route-metric--sky svg {
  color: var(--growth-sky-deep);
}

.growth-route-metric--mint svg {
  color: var(--growth-mint);
}

.growth-route-metric--amber svg {
  color: var(--growth-amber-deep);
}

.growth-risk-strip {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;

  @include theme.respond-max(tablet) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @include theme.respond-max(phone) {
    grid-template-columns: 1fr;
  }
}

.growth-risk {
  padding: 15px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid rgba(255, 255, 255, 0.8);

  strong,
  span {
    display: block;
  }

  strong {
    font-size: 14px;
    font-weight: 900;
  }

  span {
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--growth-soft-ink);
    font-weight: 700;
  }
}

.growth-risk--rose strong {
  color: #a34f44;
}

.growth-risk--amber strong {
  color: #9b621a;
}

.growth-risk--sky strong {
  color: #28629c;
}

.growth-risk--mint strong {
  color: #256349;
}

.growth-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 24px;

  @include theme.respond-max(phone) {
    grid-template-columns: 1fr;
    gap: 18px;
  }
}

.growth-panel--compass {
  grid-column: span 4;
}

.growth-panel--terrain {
  grid-column: span 8;
}

.growth-panel--reward {
  grid-column: 1 / -1;
}

@media (max-width: 1199px) and (min-width: 769px) {
  .growth-panel--compass,
  .growth-panel--terrain {
    grid-column: span 6;
  }
}

@include theme.respond-max(phone) {
  .growth-panel--compass,
  .growth-panel--terrain,
  .growth-panel--reward {
    grid-column: auto;
  }
}

.growth-panel__reward-meta {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 10px;

  span {
    @include theme.stat-chip;
    font-size: 13px;
    font-weight: 900;
    color: var(--growth-ink);
  }
}

.growth-reward-layout {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: 18px;
  margin-top: 18px;

  @include theme.respond-max(tablet) {
    grid-template-columns: 1fr;
  }
}

.growth-reward-chart {
  min-width: 0;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.56);
  border: 1px solid rgba(255, 255, 255, 0.82);
  padding: 12px 12px 6px;
}

.growth-aigc-entry {
  position: fixed;
  right: 24px;
  bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  z-index: 28;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: none;
  padding: 15px 22px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ffbf55 0%, #45aef5 100%);
  color: #ffffff;
  font-size: 15px;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 20px 28px rgba(51, 110, 170, 0.24);
  transition: transform 0.24s ease, box-shadow 0.24s ease;

  svg {
    font-size: 20px;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 24px 34px rgba(51, 110, 170, 0.3);
  }

  @include theme.respond-max(phone) {
    left: 14px;
    right: 14px;
    justify-content: center;
    bottom: calc(14px + env(safe-area-inset-bottom, 0px));
  }
}

.growth-drawer-mask {
  position: fixed;
  inset: 0;
  z-index: 34;
  display: flex;
  justify-content: flex-end;
  background: rgba(22, 40, 60, 0.38);
  backdrop-filter: blur(8px);

  @include theme.respond-max(phone) {
    align-items: flex-end;
  }
}

.growth-drawer {
  width: min(468px, 100%);
  height: 100%;
  padding: 28px 22px;
  background: linear-gradient(180deg, rgba(255, 249, 232, 0.98) 0%, rgba(238, 247, 255, 0.98) 100%);
  box-shadow: -18px 0 48px rgba(25, 47, 70, 0.2);
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.growth-drawer--bottom {
  width: 100%;
  max-height: min(78vh, 720px);
  height: auto;
  border-radius: 28px 28px 0 0;
  box-shadow: 0 -20px 42px rgba(25, 47, 70, 0.24);
}

.growth-drawer__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: 20px;
  border-bottom: 2px dashed rgba(95, 117, 145, 0.2);

  span {
    color: var(--growth-sky-deep);
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  h3 {
    margin: 10px 0 0;
    font-size: 28px;
    font-weight: 900;
    color: var(--growth-ink);
  }

  @include theme.respond-max(phone) {
    flex-direction: column;
  }
}

.growth-drawer__actions {
  display: flex;
  gap: 10px;

  @include theme.respond-max(phone) {
    width: 100%;
  }
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  border-radius: 999px;
  padding: 11px 16px;
  font-weight: 900;
  cursor: pointer;

  @include theme.respond-max(phone) {
    flex: 1;
  }
}

.action-btn--primary {
  background: linear-gradient(135deg, var(--growth-sky) 0%, var(--growth-sky-deep) 100%);
  color: #ffffff;
}

.action-btn--secondary {
  background: rgba(255, 255, 255, 0.78);
  color: var(--growth-ink);
  border: 1px solid rgba(255, 255, 255, 0.84);
}

.growth-drawer__skeleton {
  display: grid;
  gap: 14px;
  margin-top: 22px;
}

.growth-drawer__skeleton-card {
  height: 176px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.72);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.84), transparent);
    transform: translateX(-100%);
    animation: growthScan 1.8s infinite ease-in-out;
  }
}

.growth-drawer__error {
  @include theme.empty-state(240px);
  margin-top: 20px;

  button {
    border: none;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--growth-sky) 0%, var(--growth-sky-deep) 100%);
    color: #ffffff;
    padding: 12px 20px;
    font-weight: 900;
    cursor: pointer;
  }
}

.growth-drawer__cards {
  display: grid;
  gap: 14px;
  margin-top: 22px;
}

.growth-advice-card {
  padding: 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.84);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.74);

  h4 {
    margin: 14px 0 0;
    font-size: 22px;
    font-weight: 900;
    color: var(--growth-ink);
  }

  p {
    margin: 12px 0 0;
    color: var(--growth-soft-ink);
    font-size: 14px;
    line-height: 1.7;
    font-weight: 700;
  }
}

.growth-advice-card--rose {
  background: rgba(255, 240, 236, 0.92);
}

.growth-advice-card--amber {
  background: rgba(255, 247, 228, 0.92);
}

.growth-advice-card--sky {
  background: rgba(239, 248, 255, 0.92);
}

.growth-advice-card__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  color: var(--growth-soft-ink);
  font-size: 13px;
  font-weight: 900;
}

.growth-advice-card__priority {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
}

.growth-advice-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;

  span {
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.76);
    color: var(--growth-ink);
    font-size: 12px;
    font-weight: 800;
  }
}

.growth-advice-card__next {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 16px;
  color: var(--growth-ink);
  font-size: 14px;
  font-weight: 900;

  svg {
    margin-top: 2px;
    color: var(--growth-sky-deep);
  }
}

@keyframes growthScan {
  100% {
    transform: translateX(100%);
  }
}

.growth-drawer-fade-enter-active,
.growth-drawer-fade-leave-active {
  transition: opacity 0.24s ease;
}

.growth-drawer-fade-enter-from,
.growth-drawer-fade-leave-to {
  opacity: 0;
}
</style>
