<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { dbAdapter } from '@/core/adapter'
import { useAuth } from '@/composables/useAuth'
import { checkVentContent } from '@/core/contentSafety'
import type { VentPost } from '@/core/adapter/types'

const { t } = useI18n({ useScope: 'global' })
const { nickname, user } = useAuth()

const text = ref('')
const vents = ref<VentPost[]>([])
const loading = ref(false)
const posting = ref(false)
const search = ref('')
const noticeType = ref<'info' | 'success' | 'error'>('info')
const noticeKey = ref('modules.ventWall.noticeReady')
let refreshTimer: number | null = null

const maxLength = 180
const leftCount = computed(() => maxLength - text.value.length)
const quickPrompts = computed(() => [
  t('modules.ventWall.prompts.0'),
  t('modules.ventWall.prompts.1'),
  t('modules.ventWall.prompts.2'),
  t('modules.ventWall.prompts.3')
])
const filteredVents = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  if (!keyword) return vents.value
  return vents.value.filter((item) => item.content.toLowerCase().includes(keyword))
})

function setNotice(type: 'info' | 'success' | 'error', key: string) {
  noticeType.value = type
  noticeKey.value = key
}

function mapSafetyReason(reason?: string) {
  if (reason === 'empty') return 'modules.ventWall.errorEmpty'
  if (reason === 'too_long') return 'modules.ventWall.errorTooLong'
  if (reason === 'contains_illegal') return 'modules.ventWall.errorIllegal'
  if (reason === 'repeat') return 'modules.ventWall.errorRepeat'
  return 'modules.ventWall.errorSubmit'
}

function formatTime(ts: string) {
  const date = new Date(ts)
  if (Number.isNaN(date.getTime())) return '--'
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function applyPrompt(prompt: string) {
  const merged = text.value ? `${text.value} ${prompt}` : prompt
  text.value = merged.slice(0, maxLength)
}

async function fetchVents() {
  loading.value = true
  const { data, error } = await dbAdapter.listVents(80)
  if (!error) {
    vents.value = data
  }
  loading.value = false
}

async function submitVent() {
  const checked = checkVentContent(text.value, maxLength)
  if (!checked.ok) {
    setNotice('error', mapSafetyReason(checked.reason))
    return
  }
  posting.value = true
  const result = await dbAdapter.createVent(user.value?.id || null, nickname.value, text.value)
  posting.value = false
  if (!result.ok) {
    setNotice('error', mapSafetyReason(result.reason))
    return
  }
  text.value = ''
  setNotice('success', 'modules.ventWall.success')
  await fetchVents()
}

onMounted(async () => {
  await fetchVents()
  refreshTimer = window.setInterval(() => {
    void fetchVents()
  }, 7000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<template>
  <div class="page">
    <div class="page-inner">
      <div class="header">
        <h1>{{ t('modules.ventWall.title') }}</h1>
        <p>{{ t('modules.ventWall.subtitle') }}</p>
      </div>

      <div class="panel composer">
        <div class="composer-top">
          <div class="user-badge">
            <span>{{ t('modules.ventWall.currentUser') }}</span>
            <strong>{{ nickname }}</strong>
          </div>
          <div class="safety-tip">{{ t('modules.ventWall.safetyTip') }}</div>
        </div>
        <textarea
          v-model="text"
          class="input"
          :placeholder="t('modules.ventWall.placeholder')"
          :maxlength="maxLength"
        />
        <div class="prompt-row">
          <button
            v-for="prompt in quickPrompts"
            :key="prompt"
            class="prompt-chip"
            @click="applyPrompt(prompt)"
          >
            {{ prompt }}
          </button>
        </div>
        <div class="meta-row">
          <span class="left-count" :data-warn="leftCount < 20">{{ t('modules.ventWall.left', { count: leftCount }) }}</span>
          <div class="action-row">
            <button class="ghost-btn" @click="text = ''">{{ t('modules.ventWall.clear') }}</button>
            <button class="submit-btn" :disabled="posting" @click="submitVent">
              {{ posting ? t('modules.ventWall.submitting') : t('modules.ventWall.submit') }}
            </button>
          </div>
        </div>
        <div class="progress-wrap">
          <div class="progress" :style="{ width: `${Math.min(100, Math.max(0, (text.length / maxLength) * 100))}%` }" />
        </div>
        <div class="notice" :data-type="noticeType">{{ t(noticeKey) }}</div>
      </div>

      <div class="panel feed">
        <div class="feed-head">
          <h2>{{ t('modules.ventWall.feedTitle') }}</h2>
          <div class="feed-actions">
            <input v-model="search" class="search-input" :placeholder="t('modules.ventWall.search')" />
            <button class="refresh-btn" @click="fetchVents">{{ t('modules.ventWall.refresh') }}</button>
          </div>
        </div>
        <div v-if="loading" class="state">{{ t('modules.ventWall.loading') }}</div>
        <div v-else-if="filteredVents.length === 0" class="state">{{ t('modules.ventWall.empty') }}</div>
        <div v-else class="list">
          <article v-for="item in filteredVents" :key="item.id" class="item">
            <div class="item-head">
              <span class="author">{{ item.user_name || t('modules.ventWall.anonymous') }}</span>
              <span class="time">{{ formatTime(item.created_at) }}</span>
            </div>
            <p class="content">{{ item.content }}</p>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page {
  min-height: 100%;
  padding-top: 56px;
}

.page-inner {
  max-width: 980px;
  margin: 0 auto;
  padding: 20px 12px 32px;
}

.header {
  margin-bottom: 16px;

  h1 {
    margin: 0 0 6px;
    font-size: 30px;
    color: var(--color-text);
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 14px;
  }
}

.panel {
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  box-shadow: var(--shadow);
  padding: 14px;
}

.composer {
  margin-bottom: 12px;
  display: grid;
  gap: 10px;
}

.composer-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.user-badge {
  font-size: 12px;
  color: var(--color-text-secondary);
  display: inline-flex;
  gap: 8px;
  align-items: center;

  strong {
    color: var(--color-text);
    font-size: 13px;
  }
}

.safety-tip {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.input {
  width: 100%;
  min-height: 120px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  resize: vertical;
  padding: 11px 12px;
  font-size: 14px;
  outline: none;
}

.prompt-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.prompt-chip {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: var(--transition);

  &:hover {
    color: var(--color-text);
    border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
  }
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-count {
  color: var(--color-text-secondary);
  font-size: 12px;

  &[data-warn='true'] {
    color: #dc2626;
  }
}

.action-row {
  display: flex;
  gap: 8px;
}

.ghost-btn {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  border-radius: 10px;
  height: 34px;
  padding: 0 12px;
  cursor: pointer;
}

.submit-btn,
.refresh-btn {
  border: 1px solid color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
  background: color-mix(in srgb, var(--color-primary) 18%, var(--color-surface));
  color: var(--color-text);
  border-radius: 10px;
  height: 34px;
  padding: 0 12px;
  cursor: pointer;
  transition: var(--transition);

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.progress-wrap {
  height: 4px;
  background: color-mix(in srgb, var(--color-border) 45%, transparent);
  border-radius: 99px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 60%, #22c55e));
}

.notice {
  font-size: 13px;
  color: var(--color-text-secondary);

  &[data-type='success'] {
    color: #16a34a;
  }

  &[data-type='error'] {
    color: #dc2626;
  }
}

.feed-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;

  h2 {
    margin: 0;
    font-size: 16px;
    color: var(--color-text);
    white-space: nowrap;
  }
}

.feed-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: flex-end;
}

.search-input {
  max-width: 220px;
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  height: 34px;
  padding: 0 10px;
}

.state {
  color: var(--color-text-secondary);
  font-size: 13px;
  padding: 8px 0;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--color-surface) 96%, transparent);
}

.item-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.author {
  font-size: 12px;
  color: var(--color-primary);
  font-weight: 600;
}

.time {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.content {
  margin: 0;
  color: var(--color-text);
  font-size: 14px;
  line-height: 1.55;
  white-space: pre-wrap;
}

[data-theme='pixel'] {
  .panel,
  .input,
  .prompt-chip,
  .ghost-btn,
  .submit-btn,
  .refresh-btn,
  .search-input,
  .item {
    border-radius: 0;
    border-width: 2px;
  }

  .prompt-chip:hover,
  .submit-btn:hover,
  .refresh-btn:hover {
    box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.3);
  }
}

[data-theme='night'] {
  .panel {
    border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
  }
}

@media (max-width: 820px) {
  .composer-top {
    flex-direction: column;
    align-items: flex-start;
  }

  .meta-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .feed-head {
    flex-direction: column;
    align-items: stretch;
  }

  .feed-actions {
    justify-content: flex-start;
  }

  .search-input {
    max-width: unset;
  }
}
</style>
