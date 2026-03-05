<template>
  <div v-if="visible" class="memo-modal-overlay" @click.self="$emit('close')">
    <div class="memo-modal">
      <header class="modal-header">
        <h3 class="modal-title">
          <Icon icon="mdi:calendar-edit" width="20" />
          {{ t('calendar.memo.title', { date: formattedDate }) }}
        </h3>
        <button class="close-btn" @click="$emit('close')">
          <Icon icon="mdi:close" width="20" />
        </button>
      </header>

      <div class="modal-body">
        <div class="alert-info">
          <Icon icon="mdi:information-outline" width="16" />
          <span>{{ t('calendar.memo.retention') }}</span>
        </div>

        <div v-if="loading" class="loading-state">
          <Icon icon="mdi:loading" class="spin" width="24" />
        </div>

        <div v-else class="memo-list">
          <div v-if="memos.length === 0" class="empty-state">
            <Icon icon="mdi:notebook-outline" width="48" />
            <p>{{ t('calendar.memo.empty') }}</p>
          </div>

          <div v-for="memo in memos" :key="memo.id" class="memo-item">
            <div class="memo-content">
              <textarea 
                v-if="editingId === memo.id" 
                v-model="editingContent"
                class="memo-input"
                rows="3"
                @keydown.ctrl.enter="saveEdit(memo.id)"
              ></textarea>
              <p v-else class="memo-text">{{ memo.content }}</p>
            </div>
            
            <div class="memo-actions">
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

        <div class="add-memo-section">
          <textarea
            v-model="newMemoContent"
            class="memo-input new"
            :placeholder="t('calendar.memo.placeholder')"
            rows="2"
            @keydown.ctrl.enter="handleAdd"
          ></textarea>
          <button 
            class="add-btn" 
            :disabled="!newMemoContent.trim()"
            @click="handleAdd"
          >
            <Icon icon="mdi:plus" width="20" />
            {{ t('common.add') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import type { Memo } from '../useMemoStore'

const props = defineProps<{
  visible: boolean
  date: string // YYYY-MM-DD
  memos: Memo[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'add', content: string): void
  (e: 'update', id: string, content: string): void
  (e: 'delete', id: string): void
}>()

const { t, locale } = useI18n()

const newMemoContent = ref('')
const editingId = ref<string | null>(null)
const editingContent = ref('')

const formattedDate = computed(() => {
  return dayjs(props.date).format(locale.value === 'zh' ? 'YYYY年M月D日' : 'MMM D, YYYY')
})

const handleAdd = () => {
  if (!newMemoContent.value.trim()) return
  emit('add', newMemoContent.value)
  newMemoContent.value = ''
}

const startEdit = (memo: Memo) => {
  editingId.value = memo.id
  editingContent.value = memo.content
}

const saveEdit = (id: string) => {
  if (!editingContent.value.trim()) return
  emit('update', id, editingContent.value)
  editingId.value = null
  editingContent.value = ''
}

const cancelEdit = () => {
  editingId.value = null
  editingContent.value = ''
}

const handleDelete = (id: string) => {
  if (confirm(t('calendar.memo.confirmDelete'))) {
    emit('delete', id)
  }
}

// Reset state when closed
watch(() => props.visible, (val) => {
  if (!val) {
    newMemoContent.value = ''
    cancelEdit()
  }
})
</script>

<style scoped lang="scss">
.memo-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.memo-modal {
  width: 90%;
  max-width: 500px;
  background: var(--color-surface);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border);
  max-height: 80vh;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
  
  .modal-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text);
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
  }
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  &:hover { color: var(--color-text); }
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.alert-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border-radius: 8px;
  font-size: 12px;
  color: var(--color-primary);
}

.memo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 100px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--color-text-tertiary);
  padding: 32px 0;
  
  p { font-size: 13px; }
}

.memo-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--color-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  
  .memo-content {
    flex: 1;
    min-width: 0;
  }
  
  .memo-text {
    font-size: 14px;
    line-height: 1.5;
    color: var(--color-text);
    white-space: pre-wrap;
    word-break: break-word;
  }
  
  .memo-input {
    width: 100%;
    padding: 8px;
    border: 1px solid var(--color-primary);
    border-radius: 6px;
    background: var(--color-surface);
    color: var(--color-text);
    resize: vertical;
    font-family: inherit;
    font-size: 14px;
    
    &:focus { outline: none; }
  }
  
  .memo-actions {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .action-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;
    color: var(--color-text-secondary);
    
    &:hover {
      background: var(--color-surface);
      color: var(--color-text);
    }
    
    &.save { color: var(--color-success); &:hover { background: color-mix(in srgb, var(--color-success) 10%, transparent); } }
    &.delete { color: var(--color-error); &:hover { background: color-mix(in srgb, var(--color-error) 10%, transparent); } }
  }
}

.add-memo-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid var(--color-border);
  padding-top: 16px;
  
  .memo-input.new {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-background);
    color: var(--color-text);
    resize: none;
    font-family: inherit;
    font-size: 14px;
    transition: all 0.2s;
    
    &:focus {
      border-color: var(--color-primary);
      background: var(--color-surface);
      outline: none;
    }
  }
  
  .add-btn {
    align-self: flex-end;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s;
    
    &:hover:not(:disabled) {
      filter: brightness(1.1);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 32px;
  color: var(--color-text-secondary);
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
