<script setup lang="ts">
import { ref, computed } from 'vue'
import { supabase } from '@/core/supabase/client'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
import { YAO_MAP, HEXAGRAMS, type LineVal } from './data'
import CoinToss from './components/CoinToss.vue'
import YaoLine from './components/YaoLine.vue'
import WindBells from './components/WindBells.vue'

type Step = 'input' | 'casting' | 'result'

const step = ref<Step>('input')
const question = ref('')
const lines = ref<LineVal[]>([])
const tossing = ref(false)
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

const rollCoins = (): LineVal => {
  let s = 0
  for (let i = 0; i < 3; i++) s += Math.random() < 0.5 ? 2 : 3
  return s as LineVal
}

const handleToss = () => {
  if (!tossing.value && lines.value.length < 6) {
    tossing.value = true
  }
}

const handleTossComplete = () => {
  const yao = rollCoins()
  lines.value.push(yao)
  
  if (lines.value.length === 6) {
    setTimeout(() => { bellRing.value = true }, 350)
    setTimeout(() => { bellRing.value = false }, 2400)
  }
  
  tossing.value = false
}

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
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    const systemPrompt = `角色设定：你是《剑来》世界观里的算卦亭老掌柜，说话带着江湖气却藏着文气，善用譬喻、语气温和有力量，懂周易解卦更懂人间行路的道理。。
任务要求：以《剑来》的语言风格解读，输出内容包含3个部分，请务必以纯 JSON 格式返回结果（不要使用 markdown 代码块），包含以下字段：
1. "hexagram_name": (String) 卦象名称（例如“乾为天”）。
2. "original_text": (String) 仅提供本卦的卦辞与大象辞原文。若有变爻，仅补充变爻的爻辞。**请直接返回一段纯文本，严禁使用 JSON 对象或键值对结构**。"
3. "interpretation": (String) 解卦正文。结合用户提问与卦象，给出温暖、诗意、富有哲理的指引。字数控制在80 - 150字以内。
风格要求：
- 避免生硬的周易术语，全部转化为江湖语言
- 每段文字有画面感，读起来像听陈平安讲道理
- 语气不绝对，留有余地，符合「算卦不问必死，只说进退」的江湖规矩`

    const userPrompt = `我求得一卦：${hexName.value}。
${movingList ? `变爻情况：${movingList}。` : ''}
我的困惑/问题是：“${question.value}”
请为我解卦，并严格按照 JSON 格式返回。`

    const { data, error } = await supabase.functions.invoke('ai-divination', {
      body: {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      },
      // Explicitly set headers to avoid Supabase client from trying to refresh session
      // This fixes the "Lock broken by another request" error when user is not logged in or session is unstable
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`
      }
    })

    if (error) throw error
    
    // Handle error returned from Edge Function as 200 OK
    if (data?.error) {
      throw new Error(data.error)
    }
    
    const content = data?.choices?.[0]?.message?.content
    console.log(content)
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
        <div class="title-text">问春风</div>
        <div class="divider" />
        <div class="subtitle">金钱卦 · 六爻占</div>
      </div>
      
      <!-- 阶段：输入 -->
      <div v-if="step === 'input'" class="fade-up">
        <div class="input-hint">心中所惑，书于此处</div>
        <textarea 
          v-model="question" 
          rows="4" 
          placeholder="所惑之事……"
          class="question-input"
        />
        <div class="action-area">
          <button 
            class="btn-primary" 
            :disabled="!question.trim()"
            @click="step = 'casting'"
          >
            起卦
          </button>
        </div>
      </div>
      
      <!-- 阶段：投掷 -->
      <div v-else-if="step === 'casting'" class="fade-up">
        <div class="current-question">{{ question }}</div>
        
        <!-- 进度点 -->
        <div class="dots">
          <div 
            v-for="(_, i) in 6" 
            :key="i"
            class="dot"
            :class="{
              active: i < lines.length,
              current: i === lines.length
            }"
          />
        </div>
        
        <!-- 铜钱区 -->
        <div class="coin-area">
          <CoinToss v-if="tossing" @complete="handleTossComplete" />
          <div v-else class="coin-placeholder">
            {{ lines.length === 0 ? "静心，方可起卦" : lines.length < 6 ? `已得第${["一","二","三","四","五"][lines.length-1]}爻` : "六爻已成" }}
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
              {{ tossing ? "掷中……" : `投掷第${["一","二","三","四","五","六"][lines.length]}爻` }}
            </button>
          </template>
          <template v-else>
            <div class="hex-name-display">{{ hexName }}</div>
            <button class="btn-primary" @click="askWind">问春风</button>
            <button class="btn-ghost" @click="reset">重新起卦</button>
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
          <div class="response-title">· 春风有言 ·</div>
          
          <div v-if="loading" class="loading-dots">
            <div v-for="i in 3" :key="i" class="loading-dot" :style="{ animationDelay: `${(i-1)*0.28}s` }" />
            <span class="loading-text">春风徐来……</span>
          </div>
          
          <div v-else-if="resultData" class="response-content fade-up">
            <div class="res-hex-name">【{{ resultData.hexagram_name }}】</div>
            <div class="res-original">{{ resultData.original_text }}</div>
            <div class="res-interpretation">{{ resultData.interpretation }}</div>
            <div class="res-disclaimer"> 弟子不必不如师，但凭本心 </div>
          </div>
          
          <div v-else-if="errorMsg" class="response-text fade-up">
            {{ errorMsg }}
          </div>
        </div>
        
        <div v-if="!loading" class="action-area">
          <button class="btn-primary" @click="reset">再问一卦</button>
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
  justify-content: center;
  font-family: 'Noto Serif SC', 'STSong', serif;
  padding: 0;
  z-index: 0; /* 降低层级，Header 通常是 100 */
  overflow: hidden;
  color: var(--color-text);
}

.main-card {
  max-width: 460px;
  width: 100%;
  background: var(--card-glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 36px 32px;
  position: relative;
  z-index: 1;
  box-shadow: var(--shadow);
  margin: 20px;
}

.bells-container {
  text-align: center;
  margin-bottom: 22px;
}

.card-header {
  text-align: center;
  margin-bottom: 28px;
  
  .title-text {
    font-size: 25px;
    font-weight: 300;
    letter-spacing: 16px;
    background: linear-gradient(90deg, var(--color-primary), var(--color-secondary), var(--color-accent), var(--color-secondary), var(--color-primary));
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 5s linear infinite;
  }
  
  .divider {
    width: 72px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--color-border), transparent);
    margin: 11px auto 7px;
  }
  
  .subtitle {
    font-size: 11px;
    color: var(--color-text-secondary);
    letter-spacing: 5px;
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
  height: 118px;
  display: flex;
  align-items: center;
  justify-content: center;
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
