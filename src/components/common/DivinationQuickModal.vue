<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { functionAdapter } from '@/core/adapter'
import CoinToss from '@/modules/tools/divination/components/CoinToss.vue'
import { YAO_MAP, HEXAGRAMS, type LineVal } from '@/modules/tools/divination/data'
import { useTracking } from '@/composables/useTracking'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const router = useRouter()
const { t, locale } = useI18n({ useScope: 'global' })
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const { track } = useTracking()

const question = ref('')
const tossing = ref(false)
const loading = ref(false)
const currentCoins = ref<boolean[]>([true, true, true])
const result = ref<{
  hexagram_name: string
  original_text: string
  interpretation: string
} | null>(null)
const errorMsg = ref('')

const lines = ref<LineVal[]>([])
const canCast = computed(() => !!question.value.trim() && !loading.value && !tossing.value)

const close = () => {
  emit('update:modelValue', false)
}

const reset = () => {
  question.value = ''
  tossing.value = false
  loading.value = false
  currentCoins.value = [true, true, true]
  result.value = null
  errorMsg.value = ''
  lines.value = []
}

const handleClose = () => {
  close()
  setTimeout(() => reset(), 220)
}

const rollCoins = (): { val: LineVal, coins: boolean[] } => {
  const coins: boolean[] = []
  let sum = 0
  for (let i = 0; i < 3; i++) {
    const isYang = Math.random() < 0.5
    coins.push(isYang)
    sum += isYang ? 3 : 2
  }
  return { val: sum as LineVal, coins }
}

const askWind = async () => {
  if (!functionAdapter) throw new Error('Function adapter not initialized')
  const hexKey = lines.value.map(l => (YAO_MAP[l].yin ? '0' : '1')).join('')
  const hexName = HEXAGRAMS[hexKey] || '未知之卦'
  const movingList = lines.value
    .map((l, i) => YAO_MAP[l].moving ? `第${i + 1}爻动` : null)
    .filter(Boolean)
    .join('、')

  const systemPrompt = `角色设定：你是《剑来》世界观里的算卦亭老掌柜，说话带着江湖气却藏着文气，善用譬喻、语气温和有力量，懂周易解卦更懂人间行路的道理。任务要求：以《剑来》的语言风格解读，输出内容包含3个部分，请务必以纯 JSON 格式返回结果（不要使用 markdown 代码块），包含以下字段：1. "hexagram_name": (String) 卦象名称。2. "original_text": (String) 仅提供本卦的卦辞与大象辞原文。若有变爻，仅补充变爻的爻辞。请直接返回一段纯文本。3. "interpretation": (String) 结合用户提问与卦象，给出温暖、诗意、富有哲理的指引，要求指引不能含糊其词，要有相对明确的回答。字数控制在80-150字。`
  const userPrompt = `我求得一卦：${hexName}。${movingList ? `变爻情况：${movingList}。` : ''}我的困惑/问题是：“${question.value}”请为我解卦，并严格按照 JSON 格式返回。`

  const { data, error } = await functionAdapter.invoke('ai-divination', {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  }, {
    headers: {
      Authorization: `Bearer ${supabaseAnonKey}`
    }
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('No content in response')
  const jsonStr = content.replace(/^```json\s*|\s*```$/g, '').trim()
  const parsed = JSON.parse(jsonStr)
  if (typeof parsed.original_text === 'object' && parsed.original_text !== null) {
    parsed.original_text = Object.values(parsed.original_text).join(' ')
  }
  result.value = parsed
  
  // Track successful divination
  track('divination_result', {
    hexagram: hexName,
    question_length: question.value.length
  })
}

const handleQuickCast = async () => {
  if (!canCast.value) return
  loading.value = true
  errorMsg.value = ''
  result.value = null
  lines.value = []
  try {
    for (let i = 0; i < 6; i++) {
      tossing.value = true
      const { val, coins } = rollCoins()
      currentCoins.value = coins
      await new Promise(resolve => setTimeout(resolve, 900))
      lines.value.push(val)
      tossing.value = false
      await new Promise(resolve => setTimeout(resolve, 120))
    }
    await askWind()
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : 'Unknown Error'
  } finally {
    loading.value = false
  }
}

const goToDivination = () => {
  close()
  router.push(`/${locale.value}/tools/divination`)
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="modelValue" class="quick-modal-mask" @click.self="handleClose">
        <div class="quick-modal">
          <div class="modal-actions">
            <button class="icon-btn" :title="t('common.more')" @click="goToDivination">
              <Icon icon="mdi:arrow-top-right" width="18" />
            </button>
            <button class="icon-btn" @click="handleClose">
              <Icon icon="mdi:close" width="18" />
            </button>
          </div>
          <div class="modal-title">{{ t('modules.divination.title') }}</div>
          <div class="modal-subtitle">{{ t('modules.divination.subtitle') }}</div>
          <textarea
            v-model="question"
            rows="3"
            class="question-input"
            :placeholder="t('modules.divination.placeholder')"
          />
          <div class="coin-wrap">
            <CoinToss :tossing="tossing" :coins="currentCoins" />
          </div>
          <button class="quick-btn" :disabled="!canCast" @click="handleQuickCast">
            {{ loading ? t('modules.divination.loading') : t('modules.divination.quickCast') }}
          </button>
          <div v-if="result" class="result-wrap">
            <div class="result-name">【{{ result.hexagram_name }}】</div>
            <div class="result-text">{{ result.interpretation }}</div>
          </div>
          <div v-else-if="errorMsg" class="error-text">{{ errorMsg }}</div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped lang="scss">
.quick-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(6px);
}

.quick-modal {
  width: min(560px, 92vw);
  max-height: 88vh;
  overflow: auto;
  background: color-mix(in srgb, var(--color-surface) 94%, transparent);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 24px 22px 20px;
  position: relative;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}

.modal-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
}

.icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface) 85%, transparent);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-surface);
    color: var(--color-primary);
    transform: scale(1.05);
  }
}

.modal-title {
  text-align: center;
  font-size: 24px;
  letter-spacing: 8px;
  margin-right: -8px;
  color: var(--color-primary);
}

.modal-subtitle {
  text-align: center;
  margin-top: 8px;
  font-size: 12px;
  letter-spacing: 4px;
  color: var(--color-text-secondary);
}

.question-input {
  margin-top: 16px;
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface) 90%, transparent);
  color: var(--color-text);
  border-radius: var(--border-radius-sm);
  padding: 12px 14px;
  resize: none;
  font-size: 14px;
}

.coin-wrap {
  margin-top: 12px;
}

.quick-btn {
  margin: 10px auto 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 180px;
  padding: 11px 26px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  color: #fff;
  font-size: 14px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
}

.quick-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.result-wrap {
  margin-top: 14px;
  border-top: 1px solid var(--color-border);
  padding-top: 12px;
}

.result-name {
  color: var(--color-primary);
  text-align: center;
  letter-spacing: 2px;
  margin-bottom: 8px;
}

.result-text {
  color: var(--color-text);
  font-size: 14px;
  line-height: 1.85;
  white-space: pre-wrap;
}

.error-text {
  margin-top: 12px;
  color: var(--color-error);
  font-size: 13px;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
