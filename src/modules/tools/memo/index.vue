<template>
  <div class="memo-tool">
    <div class="header">
      <div class="header-content">
        <h1>
          <Icon icon="mdi:calendar-edit" width="32" />
          {{ t('tools.memo.title') }}
        </h1>
        <p>{{ t('tools.memo.desc') }}</p>
      </div>
      <button class="add-btn" @click="handleAddClick">
        <Icon icon="mdi:plus" width="20" />
        {{ t('calendar.memo.add') }}
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <Icon icon="mdi:loading" class="spin" width="32" />
    </div>

    <div v-else-if="!user" class="login-prompt">
      <Icon icon="mdi:account-lock" width="48" />
      <p>{{ t('auth.loginRequired') }}</p>
      <button class="login-btn" @click="showAuthModal = true">
        {{ t('auth.login') }}
      </button>
    </div>

    <div v-else class="memo-container">
      <div v-if="Object.keys(groupedMemos).length === 0" class="empty-state">
        <Icon icon="mdi:notebook-outline" width="64" />
        <p>{{ t('calendar.memo.empty') }}</p>
      </div>

      <div v-else class="memo-timeline">
        <div v-for="(memos, date) in groupedMemos" :key="date" class="date-group">
          <div class="date-header">
            <span class="date">{{ formatDate(date) }}</span>
            <span class="day-diff">{{ getDayDiff(date) }}</span>
          </div>
          
          <div class="memo-cards">
            <div v-for="memo in memos" :key="memo.id" class="memo-card">
              <div class="card-content">
                <textarea 
                  v-if="editingId === memo.id" 
                  v-model="editingContent"
                  class="memo-input"
                  rows="3"
                  @keydown.ctrl.enter="saveEdit(memo.id)"
                ></textarea>
                <p v-else class="memo-text">{{ memo.content }}</p>
              </div>
              
              <div class="card-actions">
                <template v-if="editingId === memo.id">
                  <button class="action-btn save" @click="saveEdit(memo.id)" :title="t('common.save')">
                    <Icon icon="mdi:check" width="18" />
                  </button>
                  <button class="action-btn cancel" @click="cancelEdit" :title="t('common.cancel')">
                    <Icon icon="mdi:close" width="18" />
                  </button>
                </template>
                <template v-else>
                  <button class="action-btn edit" @click="startEdit(memo)" :title="t('common.edit')">
                    <Icon icon="mdi:pencil" width="18" />
                  </button>
                  <button class="action-btn delete" @click="handleDelete(memo.id)" :title="t('common.delete')">
                    <Icon icon="mdi:delete" width="18" />
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <MemoModal
      :visible="showMemoModal"
      :date="selectedDate"
      :memos="[]" 
      :loading="false"
      @close="showMemoModal = false"
      @add="handleModalAdd"
      @update="() => {}" 
      @delete="() => {}"
    />
    
    <AuthModal :show="showAuthModal" @close="showAuthModal = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useAuth } from '@/composables/useAuth'
import { useMemoStore, type Memo } from '../calendar/useMemoStore'
import MemoModal from '../calendar/components/MemoModal.vue'
import AuthModal from '@/components/auth/AuthModal.vue'

dayjs.extend(relativeTime)

const { t, locale } = useI18n()
const { user } = useAuth()
const memoStore = useMemoStore()

const showAuthModal = ref(false)
const showMemoModal = ref(false)
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const editingId = ref<string | null>(null)
const editingContent = ref('')

const loading = computed(() => memoStore.loading.value)

// Group memos by date
const groupedMemos = computed(() => {
  const groups: Record<string, Memo[]> = {}
  // Sort memos by date descending
  const sorted = [...memoStore.memos.value].sort((a, b) => 
    dayjs(b.target_date).valueOf() - dayjs(a.target_date).valueOf()
  )
  
  sorted.forEach(memo => {
    if (!groups[memo.target_date]) {
      groups[memo.target_date] = []
    }
    const dateGroup = groups[memo.target_date]
    if (dateGroup) {
      dateGroup.push(memo)
    }
  })
  return groups
})

onMounted(async () => {
  if (user.value) {
    const start = dayjs().subtract(30, 'day').format('YYYY-MM-DD')
    const future = dayjs().add(1, 'year').format('YYYY-MM-DD')
    await memoStore.fetchMemos(start, future)
  }
})

watch(user, async (newUser) => {
  if (newUser) {
    const start = dayjs().subtract(30, 'day').format('YYYY-MM-DD')
    const future = dayjs().add(1, 'year').format('YYYY-MM-DD')
    await memoStore.fetchMemos(start, future)
  }
})

const formatDate = (date: string) => {
  return dayjs(date).format(locale.value === 'zh' ? 'YYYY年M月D日' : 'MMM D, YYYY')
}

const getDayDiff = (date: string) => {
  const target = dayjs(date)
  const today = dayjs().startOf('day')
  const diff = target.diff(today, 'day')
  
  if (diff === 0) return t('tools.calendar.today')
  if (diff === 1) return locale.value === 'zh' ? '明天' : 'Tomorrow'
  if (diff === -1) return locale.value === 'zh' ? '昨天' : 'Yesterday'
  
  return target.from(today)
}

const handleAddClick = () => {
  if (!user.value) {
    showAuthModal.value = true
    return
  }
  selectedDate.value = dayjs().format('YYYY-MM-DD')
  showMemoModal.value = true
}

const handleModalAdd = async (content: string) => {
  await memoStore.addMemo(content, selectedDate.value)
  showMemoModal.value = false
}

const startEdit = (memo: Memo) => {
  editingId.value = memo.id
  editingContent.value = memo.content
}

const saveEdit = async (id: string) => {
  if (!editingContent.value.trim()) return
  await memoStore.updateMemo(id, editingContent.value)
  editingId.value = null
  editingContent.value = ''
}

const cancelEdit = () => {
  editingId.value = null
  editingContent.value = ''
}

const handleDelete = async (id: string) => {
  if (confirm(t('calendar.memo.confirmDelete'))) {
    await memoStore.deleteMemo(id)
  }
}
</script>

<style scoped lang="scss">
.memo-tool {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  
  .header-content {
    h1 {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 24px;
      margin: 0 0 8px;
      color: var(--color-text);
    }
    
    p {
      margin: 0;
      color: var(--color-text-secondary);
    }
  }
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 48px;
  color: var(--color-text-secondary);
}

.login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 64px;
  background: var(--color-surface);
  border-radius: 24px;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  
  .login-btn {
    padding: 8px 24px;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 64px;
  color: var(--color-text-tertiary);
}

.memo-timeline {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.date-group {
  .date-header {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 16px;
    padding-left: 4px;
    
    .date {
      font-size: 18px;
      font-weight: 700;
      color: var(--color-text);
    }
    
    .day-diff {
      font-size: 13px;
      color: var(--color-text-secondary);
      background: var(--color-surface);
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid var(--color-border);
    }
  }
}

.memo-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.memo-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 16px;
  transition: all 0.2s;
  
  &:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-sm);
  }
  
  .card-content {
    flex: 1;
    min-width: 0;
  }
  
  .memo-text {
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
    color: var(--color-text);
    white-space: pre-wrap;
  }
  
  .memo-input {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--color-primary);
    border-radius: 8px;
    background: var(--color-background);
    color: var(--color-text);
    font-family: inherit;
    font-size: 15px;
    resize: vertical;
    
    &:focus { outline: none; }
  }
  
  .card-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    opacity: 0.6;
    transition: opacity 0.2s;
    
    .memo-card:hover & {
      opacity: 1;
    }
  }
  
  .action-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    color: var(--color-text-secondary);
    transition: all 0.2s;
    
    &:hover {
      background: var(--color-background);
      color: var(--color-text);
    }
    
    &.save { color: var(--color-success); background: color-mix(in srgb, var(--color-success) 10%, transparent); }
    &.delete:hover { color: var(--color-error); background: color-mix(in srgb, var(--color-error) 10%, transparent); }
  }
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
