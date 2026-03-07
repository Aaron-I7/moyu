<script setup lang="ts">
import { ref, computed } from 'vue'
import { YAO_MAP, HEXAGRAMS, type LineVal } from './data'
import CoinToss from './components/CoinToss.vue'
import YaoLine from './components/YaoLine.vue'
import WindBells from './components/WindBells.vue'

type Step = 'input' | 'casting' | 'result'

const step = ref<Step>('input')
const question = ref('')
const lines = ref<LineVal[]>([])
const tossing = ref(false)
const response = ref('')
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
  response.value = ''
  
  const movingList = lines.value
    .map((l, i) => YAO_MAP[l].moving ? `第${i + 1}爻动` : null)
    .filter(Boolean)
    .join("、")
    
  // Mock AI response logic
  // In a real app, you would call an API here.
  // For now, we simulate a "Spring Breeze" response.
  
  setTimeout(() => {
    const intros = [
      "春风拂过，万物生长。",
      "风起于青萍之末。",
      "心中若有桃花源，何处不是水云间。",
      "事缓则圆，人缓则安。"
    ]
    const intro = intros[Math.floor(Math.random() * intros.length)]
    
    response.value = `
【${hexName.value}】
${intro}

此卦显示，${(lines.value[5] || 0) % 2 !== 0 ? '阳气上升' : '阴气下降'}，局势正在变化之中。${movingList ? `变爻显示：${movingList}，意味着转折点已现。` : '卦象平稳，宜静守。'}

针对你的问题：“${question.value}”
春风不语，但意已明。与其向外求索，不如向内观照。${question.value.length > 5 ? '此事看似复杂，实则' : '此事'}关键在于本心。顺应自然，无需强求，答案自会浮现。
    `.trim()
    
    loading.value = false
  }, 2500)
}

const reset = () => {
  step.value = 'input'
  question.value = ''
  lines.value = []
  response.value = ''
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
          
          <div v-else class="response-text fade-up">
            {{ response }}
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
