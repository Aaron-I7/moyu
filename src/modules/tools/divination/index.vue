<script setup lang="ts">
import { ref, computed } from 'vue'
import { functionAdapter } from '@/core/adapter'
import { useI18n } from 'vue-i18n'
import { YAO_MAP, HEXAGRAMS, type LineVal } from './data'
import CoinToss from './components/CoinToss.vue'
import YaoLine from './components/YaoLine.vue'
import WindBells from './components/WindBells.vue'

type Step = 'input' | 'casting' | 'result'

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const { t, tm } = useI18n({ useScope: 'global' })

const step = ref<Step>('input')
const question = ref('')
const lines = ref<LineVal[]>([])
const tossing = ref(false)
const currentCoins = ref<boolean[]>([true, true, true]) // true=Yang(Head)=3, false=Yin(Tail)=2
const resultData = ref<{
  hexagram_name: string
  original_text: string
  interpretation: string
} | null>(null)
const errorMsg = ref('')
const loading = ref(false)
const bellRing = ref(false)

const hexKey = computed(() => {
  if (lines.value.length !== 6) return null
  // yin (6,8) -> 0, yang (7,9) -> 1
  return lines.value.map(l => (YAO_MAP[l].yin ? "0" : "1")).join("")
})

const hexName = computed(() => hexKey.value ? (HEXAGRAMS[hexKey.value] || "未知之卦") : null)

const tossStepLabels = computed<string[]>(() => {
  const raw = tm('modules.divination.tossStep') as unknown
  return Array.isArray(raw) ? raw.map(v => String(v)) : []
})

const getTossStepLabel = (index: number): string => {
  return tossStepLabels.value[index] || String(index + 1)
}

const rollCoins = (): { val: LineVal, coins: boolean[] } => {
  const coins: boolean[] = []
  let s = 0
  for (let i = 0; i < 3; i++) {
    const isYang = Math.random() < 0.5
    coins.push(isYang)
    s += isYang ? 3 : 2
  }
  return { val: s as LineVal, coins }
}

const handleToss = () => {
  if (!tossing.value && lines.value.length < 6) {
    tossing.value = true
    // Pre-calculate result but wait for animation
    const { val, coins } = rollCoins()
    
    // Update coins state immediately so they settle on this result after animation
    // But we might want them to "spin" then settle.
    // CoinToss component handles the "spin" when tossing=true.
    // When tossing becomes false, it shows `currentCoins`.
    // So we should update `currentCoins` right before or after we stop tossing?
    // If we update it now, it doesn't matter because they are spinning.
    currentCoins.value = coins
    
    setTimeout(() => {
      lines.value.push(val)
      tossing.value = false
      
      if (lines.value.length === 6) {
        setTimeout(() => { bellRing.value = true }, 350)
        setTimeout(() => { bellRing.value = false }, 2400)
      }
    }, 1200) // 1.2s animation
  }
}

const handleQuickToss = async () => {
  if (tossing.value || lines.value.length >= 6) return
  
  // Generate remaining lines
  const remaining = 6 - lines.value.length
  
  for (let i = 0; i < remaining; i++) {
    const { val, coins } = rollCoins()
    currentCoins.value = coins
    lines.value.push(val)
    // Small delay for visual effect
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  if (lines.value.length === 6) {
    setTimeout(() => { bellRing.value = true }, 350)
    setTimeout(() => { bellRing.value = false }, 2400)
  }
}

// Removed handleTossComplete as logic is now inside handleToss timeout

const askWind = async () => {
  step.value = 'result'
  loading.value = true
  resultData.value = null
  errorMsg.value = ''
  
  const movingList = lines.value
    .map((l, i) => YAO_MAP[l].moving ? `第${i + 1}爻动` : null)
    .filter(Boolean)
    .join("、")
    
  try {
    if (!functionAdapter) {
      throw new Error('Function adapter not initialized')
    }

    const systemPrompt = `角色设定：你是《剑来》世界观里的算卦亭老掌柜，说话带着江湖气却藏着文气，善用譬喻、语气温和有力量，懂周易解卦更懂人间行路的道理。。
    任务要求：以《剑来》的语言风格解读，输出内容包含3个部分，请务必以纯 JSON 格式返回结果（不要使用 markdown 代码块），包含以下字段：
    1. "hexagram_name": (String) 卦象名称（例如“乾为天”）。
    2. "original_text": (String) 仅提供本卦的卦辞与大象辞原文。若有变爻，仅补充变爻的爻辞。**请直接返回一段纯文本，严禁使用 JSON 对象或键值对结构**。"
    3. "interpretation": (String) 解卦正文。结合用户提问与卦象，给出温暖、诗意、富有哲理的指引，要求指引不能含糊其词，要有相对明确的回答。字数控制在80 - 150字以内。
    风格要求：
    - 避免生硬的周易术语，全部转化为江湖语言
    - 每段文字有画面感，读起来像听陈平安讲道理
    - 语气不绝对，留有余地，符合「算卦不问必死，只说进退」的江湖规矩`

    const userPrompt = `我求得一卦：${hexName.value}。
${movingList ? `变爻情况：${movingList}。` : ''}
我的困惑/问题是：“${question.value}”
请为我解卦，并严格按照 JSON 格式返回。`

    const { data, error } = await functionAdapter.invoke('ai-divination', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`
        }
      }
    )

    if (error) throw error
    
    // Handle error returned from Edge Function as 200 OK
    if (data?.error) {
      throw new Error(data.error)
    }
    
    const content = data?.choices?.[0]?.message?.content
    if (content) {
      try {
        // Try to parse JSON, removing any potential markdown code blocks if present
        const jsonStr = content.replace(/^```json\s*|\s*```$/g, '').trim()
        const parsed = JSON.parse(jsonStr)
        
        // Safety check: ensure original_text is a string
        if (typeof parsed.original_text === 'object' && parsed.original_text !== null) {
          // If AI returned an object, flatten it
          parsed.original_text = Object.values(parsed.original_text).join(' ')
        } else if (typeof parsed.original_text === 'string' && parsed.original_text.trim().startsWith('{')) {
           // If AI returned a JSON string inside the field, try to parse and flatten
           try {
             const innerObj = JSON.parse(parsed.original_text)
             parsed.original_text = Object.values(innerObj).join(' ')
           } catch (e) {
             // Keep as is if parsing fails
           }
        }
        
        resultData.value = parsed
      } catch (e) {
        console.error('JSON Parse Error', e)
        // Fallback if JSON parsing fails, treat entire content as interpretation
        resultData.value = {
          hexagram_name: hexName.value || '未知之卦',
          original_text: '（解析格式异常，暂无原文）',
          interpretation: content
        }
      }
    } else {
      throw new Error('No content in response')
    }
  } catch (err) {
    console.error('Divination error:', err)
    errorMsg.value = `春风似乎有些犹豫，未能清晰传达意旨。\n\n或许是网络连接波动，请稍后再试。\n\n（${err instanceof Error ? err.message : '未知错误'}）`
  } finally {
    loading.value = false
  }
}

const reset = () => {
  step.value = 'input'
  question.value = ''
  lines.value = []
  resultData.value = null
  errorMsg.value = ''
  loading.value = false
  tossing.value = false
}
</script>

<template>
  <div class="divination-page">
    <div class="main-card">
      <!-- 风铃 -->
      <div class="bells-container">
        <WindBells :ringing="bellRing" />
      </div>
      
      <!-- 标题 -->
      <div class="card-header">
        <div class="title-text">{{ t('modules.divination.title') }}</div>
        <div class="divider" />
        <div class="subtitle">{{ t('modules.divination.subtitle') }}</div>
      </div>
      
      <!-- 铜钱装饰 (仅在input阶段显示，casting阶段有自己的CoinToss) -->
      <div v-if="step === 'input'" class="coin-decoration fade-up">
         <CoinToss :tossing="false" :coins="[true, true, true]" />
      </div>
      
      <!-- 阶段：输入 -->
      <div v-if="step === 'input'" class="fade-up">
        <div class="input-hint">{{ t('modules.divination.inputHint') }}</div>
        <textarea 
          v-model="question" 
          rows="4" 
          :placeholder="t('modules.divination.placeholder')"
          class="question-input"
        />
        <div class="action-area">
          <button 
            class="btn-primary" 
            :disabled="!question.trim()"
            @click="step = 'casting'"
          >
            {{ t('modules.divination.cast') }}
          </button>
        </div>
      </div>
      
      <!-- 阶段：投掷 -->
      <div v-else-if="step === 'casting'" class="fade-up">
        <div class="current-question">“ {{ question }} ”</div>
        
        <!-- 铜钱区 -->
        <div class="coin-area">
          <CoinToss :tossing="tossing" :coins="currentCoins" />
          <div v-if="!tossing" class="coin-placeholder">
            {{ lines.length === 0 ? t('modules.divination.wait') : lines.length < 6 ? t('modules.divination.gotLine', { n: getTossStepLabel(lines.length - 1) }) : t('modules.divination.complete') }}
          </div>
        </div>
        
        <!-- 爻象 -->
        <div v-if="lines.length > 0" class="yao-list">
          <YaoLine 
            v-for="(yao, i) in [...lines].reverse()" 
            :key="lines.length - 1 - i" 
            :yao="yao" 
            :idx="lines.length - 1 - i" 
            :show="true" 
          />
        </div>
        
        <div class="action-area">
          <template v-if="lines.length < 6">
            <button class="btn-primary" @click="handleToss" :disabled="tossing">
              {{ tossing ? t('modules.divination.casting') : t('modules.divination.toss', { n: getTossStepLabel(lines.length) }) }}
            </button>
            <button class="btn-ghost" @click="handleQuickToss" :disabled="tossing">
              {{ t('modules.divination.quickCast') }}
            </button>
          </template>
          <template v-else>
            <div class="hex-name-display">{{ hexName }}</div>
            <button class="btn-primary" @click="askWind">{{ t('modules.divination.ask') }}</button>
            <button class="btn-ghost" @click="reset">{{ t('modules.divination.reset') }}</button>
          </template>
        </div>
      </div>
      
      <!-- 阶段：结果 -->
      <div v-else-if="step === 'result'" class="fade-up">
        <div class="result-header">
          <div class="result-hex-name">{{ hexName }}</div>
          <div class="result-divider" />
        </div>
        
        <div class="result-yao-list">
          <YaoLine 
            v-for="(yao, i) in [...lines].reverse()" 
            :key="lines.length - 1 - i" 
            :yao="yao" 
            :idx="lines.length - 1 - i" 
            :show="true" 
          />
        </div>
        
        <div class="response-section">
          <div class="response-title">{{ t('modules.divination.responseTitle') }}</div>
          
          <div v-if="loading" class="loading-dots">
            <div v-for="i in 3" :key="i" class="loading-dot" :style="{ animationDelay: `${(i-1)*0.28}s` }" />
            <span class="loading-text">{{ t('modules.divination.loading') }}</span>
          </div>
          
          <div v-else-if="resultData" class="response-content fade-up">
            <div class="res-hex-name">【{{ resultData.hexagram_name }}】</div>
            <div class="res-original">{{ resultData.original_text }}</div>
            <div class="res-interpretation">{{ resultData.interpretation }}</div>
            <div class="res-disclaimer"> {{ t('modules.divination.disclaimer') }} </div>
          </div>
          
          <div v-else-if="errorMsg" class="response-text fade-up">
            {{ errorMsg }}
          </div>
        </div>
        
        <div v-if="!loading" class="action-area">
          <button class="btn-primary" @click="reset">{{ t('modules.divination.again') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;600&display=swap');

.divination-page {
  /* 使用 absolute 而非 fixed，让它位于内容区内，不遮挡 fixed 的 Header */
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  min-height: 100%;
  height: 100%;
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* 垂直居中，如果内容多了会自动撑开 */
  font-family: 'Noto Serif SC', 'STSong', serif;
  padding: 60px 20px; /* 增加上下padding，防止内容贴边，特别是Header */
  z-index: 0; /* 降低层级，Header 通常是 100 */
  overflow-y: auto; /* 允许滚动 */
  color: var(--color-text);
  box-sizing: border-box;
}

.main-card {
  max-width: 420px; /* 稍微调窄一点，更精致 */
  width: 100%;
  background: var(--card-glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 40px 32px;
  position: relative;
  z-index: 1;
  box-shadow: 0 10px 40px -10px rgba(0,0,0,0.1);
  margin: auto; /* 配合 flex 布局居中 */
  transition: all 0.3s ease;
}

.bells-container {
  text-align: center;
  margin-bottom: 16px;
  margin-top: -10px; /* 稍微上移 */
}

.card-header {
  text-align: center;
  margin-bottom: 32px;
  
  .title-text {
    font-size: 28px;
    font-weight: 400;
    letter-spacing: 12px;
    margin-right: -12px; /* 视觉修正letter-spacing */
    background: linear-gradient(90deg, var(--color-primary), var(--color-secondary), var(--color-accent), var(--color-secondary), var(--color-primary));
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 8s linear infinite;
  }
  
  .divider {
    width: 40px;
    height: 2px;
    background: var(--color-primary);
    opacity: 0.2;
    margin: 16px auto 12px;
    border-radius: 2px;
  }
  
  .subtitle {
    font-size: 12px;
    color: var(--color-text-secondary);
    letter-spacing: 6px;
    margin-right: -6px;
    text-transform: uppercase;
    opacity: 0.7;
  }
}

.coin-decoration {
  margin-bottom: 32px;
  /* Override inner styles for decoration purpose if needed */
  :deep(.coin-toss-container) {
    height: auto; 
    gap: 24px;
  }
  :deep(.coin-wrapper) {
    width: 56px;
    height: 56px;
  }
}

.input-hint {
  font-size: 12px;
  color: var(--color-text-secondary);
  letter-spacing: 2px;
  text-align: center;
  margin-bottom: 12px;
}

.question-input {
  width: 100%;
  box-sizing: border-box;
  background: color-mix(in srgb, var(--color-surface) 50%, transparent);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  padding: 13px 15px;
  font-size: 14px;
  line-height: 2;
  color: var(--color-text);
  font-family: 'Noto Serif SC', serif;
  letter-spacing: 1px;
  resize: none;
  outline: none;
  transition: all 0.3s;
  
  &::placeholder {
    color: var(--color-text-secondary);
    opacity: 0.5;
  }
  
  &:focus {
    border-color: var(--color-primary);
    background: var(--color-surface);
  }
}

.action-area {
  text-align: center;
  margin-top: 22px;
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  background-size: 200%;
  border: none;
  border-radius: 999px;
  color: white;
  font-family: inherit;
  font-size: 14px;
  letter-spacing: 6px;
  padding: 12px 36px;
  cursor: pointer;
  transition: all 0.35s;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--color-primary) 40%, transparent);
  
  &:hover {
    background-position: 100%;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px color-mix(in srgb, var(--color-primary) 50%, transparent);
    letter-spacing: 8px;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    letter-spacing: 6px;
    transform: none;
  }
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: 13px;
  letter-spacing: 4px;
  padding: 9px 24px;
  cursor: pointer;
  border-radius: 999px;
  transition: all 0.3s;
  
  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 5%, transparent);
  }
}

.current-question {
  font-size: 13px;
  color: var(--color-text-secondary);
  letter-spacing: 2px;
  text-align: center;
  margin-bottom: 20px;
  line-height: 1.85;
  padding: 0 6px;
}

.dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 18px;
  
  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--color-text) 10%, transparent);
    border: 1px solid var(--color-border);
    transition: all 0.35s;
    
    &.active {
      background: var(--color-primary);
      box-shadow: 0 0 5px color-mix(in srgb, var(--color-primary) 40%, transparent);
      border-color: var(--color-primary);
    }
    
    &.current {
      background: color-mix(in srgb, var(--color-primary) 30%, transparent);
    }
  }
}

.coin-area {
  height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.coin-placeholder {
  font-size: 12px;
  color: var(--color-text-secondary);
  letter-spacing: 3px;
  text-align: center;
  opacity: 0.7;
}

.yao-list {
  display: flex;
  flex-direction: column;
  gap: 11px;
  margin: 6px 0 18px;
  padding: 0 2px;
}

.hex-name-display {
  width: 100%;
  text-align: center;
  margin-bottom: 10px;
  font-size: 17px;
  color: var(--color-primary);
  letter-spacing: 7px;
}

.result-header {
  text-align: center;
  margin-bottom: 18px;
  
  .result-hex-name {
    font-size: 17px;
    color: var(--color-primary);
    letter-spacing: 8px;
    margin-bottom: 4px;
  }
  
  .result-divider {
    width: 56px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--color-border), transparent);
    margin: 0 auto;
  }
}

.result-yao-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 22px;
  padding: 0 2px;
}

.response-section {
  border-top: 1px solid var(--color-border);
  padding-top: 22px;
  
  .response-title {
    font-size: 11px;
    color: var(--color-text-secondary);
    letter-spacing: 4px;
    text-align: center;
    margin-bottom: 14px;
  }
}

.loading-dots {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  padding: 22px 0;
  
  .loading-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--color-primary);
    animation: pulse 1.2s ease-in-out infinite;
  }
  
  .loading-text {
    margin-left: 10px;
    font-size: 12px;
    color: var(--color-text-secondary);
    letter-spacing: 3px;
  }
}

.response-content {
  padding: 0 4px;
}

.res-hex-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
  text-align: center;
  margin-bottom: 12px;
  letter-spacing: 2px;
}

.res-original {
  font-size: 13px;
  color: var(--color-text-secondary);
  opacity: 0.8;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--color-surface) 50%, transparent);
  border-radius: 4px;
  line-height: 1.6;
  white-space: pre-wrap;
  text-align: justify;
}

.res-interpretation {
  font-size: 14px;
  color: var(--color-text);
  line-height: 2.3;
  letter-spacing: 1.5px;
  text-align: justify;
  margin-bottom: 20px;
  white-space: pre-wrap;
}

.res-disclaimer {
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: right;
  opacity: 0.6;
  margin-top: 10px;
  font-style: italic;
}

.response-text {
  font-size: 14px;
  color: var(--color-text);
  line-height: 2.3;
  letter-spacing: 1.5px;
  text-align: justify;
  padding: 0 4px;
  white-space: pre-wrap;
}

/* Animations */
.fade-up {
  animation: fadeUp 0.5s ease;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes shimmer {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

@keyframes pulse {
  0%, 100% { opacity: 0.38; }
  50% { opacity: 0.75; }
}

@keyframes breathe {
  0%, 100% { box-shadow: 0 8px 40px rgba(160,120,40,0.1); }
  50% { box-shadow: 0 14px 52px rgba(160,120,40,0.18); }
}

@keyframes bellIdle0 { 0%, 100% { transform: rotate(0deg); } 20% { transform: rotate(2.8deg); } 55% { transform: rotate(-2deg); } 80% { transform: rotate(1.5deg); } }
@keyframes bellIdle1 { 0%, 100% { transform: rotate(0deg); } 30% { transform: rotate(-3.2deg); } 65% { transform: rotate(2.4deg); } }
@keyframes bellIdle2 { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(1.8deg); } 60% { transform: rotate(-2.6deg); } 85% { transform: rotate(1.2deg); } }

@keyframes bellRing0 { 0% { transform: rotate(0); } 8% { transform: rotate(-14deg); } 20% { transform: rotate(16deg); } 100% { transform: rotate(0); } }
@keyframes bellRing1 { 0% { transform: rotate(0); } 10% { transform: rotate(15deg); } 22% { transform: rotate(-13deg); } 100% { transform: rotate(0); } }
@keyframes bellRing2 { 0% { transform: rotate(0); } 12% { transform: rotate(-12deg); } 24% { transform: rotate(14deg); } 100% { transform: rotate(0); } }

@keyframes ropeRing0 { 0%, 100% { transform: skewX(0); } 20% { transform: skewX(-6deg); } 40% { transform: skewX(7deg); } 60% { transform: skewX(-5deg); } 80% { transform: skewX(3deg); } }
@keyframes ropeRing1 { 0%, 100% { transform: skewX(0); } 15% { transform: skewX(7deg); } 35% { transform: skewX(-6deg); } 55% { transform: skewX(5deg); } 75% { transform: skewX(-3deg); } }
@keyframes ropeRing2 { 0%, 100% { transform: skewX(0); } 18% { transform: skewX(-5deg); } 38% { transform: skewX(6deg); } 58% { transform: skewX(-4deg); } 78% { transform: skewX(2deg); } }

@keyframes windStreak {
  0% { transform: translateX(-150px); opacity: 0; }
  15% { opacity: var(--wo, 0.06); }
  85% { opacity: var(--wo, 0.06); }
  100% { transform: translateX(110vw); opacity: 0; }
}

@keyframes leafDrift {
  0% { opacity: 0; transform: translate(0,0) rotate(0deg) scale(1); }
  12% { opacity: 0.65; }
  50% { transform: translate(calc(var(--tx)*0.5), calc(var(--ty)*0.55)) rotate(calc(var(--tr)*0.55)) scale(0.94); }
  85% { opacity: 0.22; }
  100% { opacity: 0; transform: translate(var(--tx), var(--ty)) rotate(var(--tr)) scale(0.82); }
}
</style>
