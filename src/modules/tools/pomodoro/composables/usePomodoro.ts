import { ref, computed } from 'vue'
import { useSoundEngine } from './useSoundEngine'
import { useCloudSync } from '@/composables/useCloudSync'
import {
  type TimerMode,
  type TimerStatus,
  type PomodoroSettings,
  type PomodoroStats,
  DEFAULT_SETTINGS
} from '../types'

const SETTINGS_KEY = 'moyu-pomodoro-settings'
const STATS_KEY = 'moyu-pomodoro-stats'

// Global State
const mode = ref<TimerMode>('work')
const status = ref<TimerStatus>('idle')
const timeLeft = ref(DEFAULT_SETTINGS.workDuration * 60)
const totalTime = ref(DEFAULT_SETTINGS.workDuration * 60)

// 统计数据
const stats = ref<PomodoroStats>({
  todayPomodoros: 0,
  totalMinutes: 0,
  lastUpdate: new Date().toISOString().split('T')[0] || '',
  history: []
})

// 设置
const settings = ref<PomodoroSettings>({ ...DEFAULT_SETTINGS })

// Web Worker 实例
let timerWorker: Worker | null = null

export function usePomodoro() {
  // 音频引擎
  const soundEngine = useSoundEngine()
  const { pushData } = useCloudSync()

  // 初始化
  function init() {
    loadSettings()
    loadStats()
    // 只有在未初始化时重置计时器，避免热重载重置
    if (!timerWorker) {
      resetTimer()
    }
    
    // 初始化 Web Worker (Inline Worker)
    if (!timerWorker) {
      const workerScript = `
        let intervalId = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            intervalId = setInterval(() => {
              self.postMessage('tick');
            }, 1000);
          } else if (e.data === 'stop') {
            clearInterval(intervalId);
            intervalId = null;
          }
        };
      `
      const blob = new Blob([workerScript], { type: 'application/javascript' })
      timerWorker = new Worker(URL.createObjectURL(blob))
      
      timerWorker.onmessage = (e) => {
        if (e.data === 'tick') {
          tick()
        }
      }
    }

    // 恢复之前的声音状态（如果有 active 但未播放的）
    soundEngine.fadeInAll()
  }

  function cleanup() {
    timerWorker?.terminate()
    timerWorker = null
    // Removed automatic sound stopping to support global playback
    // soundEngine.stopAll() 
    status.value = 'idle'
  }

  function loadSettings() {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        settings.value = { ...DEFAULT_SETTINGS, ...parsed }
      } catch (e) {
        console.error('Failed to load pomodoro settings', e)
      }
    }
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
    pushData('pomodoro-settings', settings.value)
    // 如果当前处于 idle 状态，更新时间
    if (status.value === 'idle') {
      resetTimer()
    }
  }

  function loadStats() {
    const saved = localStorage.getItem(STATS_KEY)
    const today = new Date().toISOString().split('T')[0]
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // 如果是新的一天，重置今日数据
        if (parsed.lastUpdate !== today) {
          stats.value = {
            todayPomodoros: 0,
            totalMinutes: parsed.totalMinutes,
            lastUpdate: today || '',
            history: parsed.history || []
          }
        } else {
          stats.value = {
            ...parsed,
            history: parsed.history || []
          }
        }
      } catch (e) {
        console.error('Failed to load stats', e)
      }
    }
    saveStats()
  }

  function saveStats() {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats.value))
    pushData('pomodoro-stats', stats.value)
  }

  // 计时器逻辑
  function tick() {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      completePhase()
    }
  }

  function start() {
    if (status.value === 'running') return
    status.value = 'running'
    timerWorker?.postMessage('start')
  }

  function pause() {
    if (status.value !== 'running') return
    status.value = 'paused'
    timerWorker?.postMessage('stop')
  }

  function resetTimer() {
    pause()
    status.value = 'idle'
    
    let duration = settings.value.workDuration
    if (mode.value === 'short-break') duration = settings.value.shortBreakDuration
    if (mode.value === 'long-break') duration = settings.value.longBreakDuration
    
    timeLeft.value = duration * 60
    totalTime.value = duration * 60
  }

  function skip() {
    completePhase()
  }

  function completePhase() {
    pause()
    soundEngine.fadeOutAll()
    
    // 播放提示音
    // soundEngine.playAlert() (TODO)

    // 更新统计
    if (mode.value === 'work') {
      stats.value.todayPomodoros++
      stats.value.totalMinutes += settings.value.workDuration
      
      // 添加历史记录
      stats.value.history.unshift({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        duration: settings.value.workDuration,
        taskName: settings.value.customTaskName || 'Focus Session',
        mode: 'work'
      })
      
      saveStats()
    }

    // 切换模式
    if (mode.value === 'work') {
      // 判断是否长休
      const pomodoros = stats.value.todayPomodoros
      if (pomodoros > 0 && pomodoros % settings.value.longBreakInterval === 0) {
        mode.value = 'long-break'
      } else {
        mode.value = 'short-break'
      }
    } else {
      mode.value = 'work'
    }

    resetTimer()

    // 自动开始
    const shouldAutoStart = mode.value === 'work' 
      ? settings.value.autoStartPomodoros 
      : settings.value.autoStartBreaks
      
    if (shouldAutoStart) {
      start()
    }
  }

  // 计算属性
  const progress = computed(() => {
    return ((totalTime.value - timeLeft.value) / totalTime.value) * 100
  })

  const formattedTime = computed(() => {
    const m = Math.floor(timeLeft.value / 60).toString().padStart(2, '0')
    const s = (timeLeft.value % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  })

  return {
    mode,
    status,
    timeLeft,
    progress,
    formattedTime,
    stats,
    settings,
    soundEngine,
    init,
    cleanup,
    start,
    pause,
    skip,
    resetTimer,
    saveSettings
  }
}
