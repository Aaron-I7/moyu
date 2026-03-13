<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

const numbers = ref<number[]>([])
const expression = ref('')
const answer = ref<number | null>(null)
const messageKey = ref('modules.math24.ready')
const messageType = ref<'info' | 'success' | 'error'>('info')
const solution = ref('')
const showSolution = ref(false)
const operatorPad = ['+', '-', '*', '/', '(', ')']

function randomNum() {
  return Math.floor(Math.random() * 13) + 1
}

function nearlyEqual(a: number, b: number) {
  return Math.abs(a - b) < 1e-6
}

function calcOps(a: number, b: number) {
  const result: Array<{ value: number; expr: string }> = []
  result.push({ value: a + b, expr: `(${a}+${b})` })
  result.push({ value: a - b, expr: `(${a}-${b})` })
  result.push({ value: b - a, expr: `(${b}-${a})` })
  result.push({ value: a * b, expr: `(${a}*${b})` })
  if (!nearlyEqual(b, 0)) result.push({ value: a / b, expr: `(${a}/${b})` })
  if (!nearlyEqual(a, 0)) result.push({ value: b / a, expr: `(${b}/${a})` })
  return result
}

function search24(values: number[], exprs: string[]): string | null {
  if (values.length === 1) {
    return nearlyEqual(values[0]!, 24) ? exprs[0]! : null
  }
  for (let i = 0; i < values.length; i += 1) {
    for (let j = i + 1; j < values.length; j += 1) {
      const restValues: number[] = []
      const restExprs: string[] = []
      for (let k = 0; k < values.length; k += 1) {
        if (k !== i && k !== j) {
          restValues.push(values[k]!)
          restExprs.push(exprs[k]!)
        }
      }
      const pair = calcOps(values[i]!, values[j]!)
      for (const p of pair) {
        const nextValues = [...restValues, p.value]
        const nextExprs = [...restExprs, p.expr]
        const found = search24(nextValues, nextExprs)
        if (found) return found
      }
    }
  }
  return null
}

function generateRound() {
  for (let i = 0; i < 120; i += 1) {
    const candidate = [randomNum(), randomNum(), randomNum(), randomNum()]
    const seedExprs = candidate.map((n) => String(n))
    const found = search24(candidate, seedExprs)
    if (found) {
      numbers.value = candidate
      expression.value = ''
      answer.value = null
      solution.value = found
      showSolution.value = false
      messageKey.value = 'modules.math24.ready'
      messageType.value = 'info'
      return
    }
  }
  numbers.value = [1, 2, 3, 4]
  expression.value = ''
  answer.value = null
  solution.value = '((1+3)*(2+4))'
  showSolution.value = false
  messageKey.value = 'modules.math24.ready'
  messageType.value = 'info'
}

function normalizeNumsFromExpression(input: string) {
  return (input.match(/\d+/g) || []).map((x) => Number(x)).sort((a, b) => a - b)
}

function validateExpression(input: string) {
  if (!/^[\d+\-*/().\s]+$/.test(input)) return false
  const exprNums = normalizeNumsFromExpression(input)
  const sourceNums = [...numbers.value].sort((a, b) => a - b)
  if (exprNums.length !== sourceNums.length) return false
  return exprNums.every((n, idx) => n === sourceNums[idx])
}

function appendToken(token: string) {
  expression.value += token
}

function clearExpression() {
  expression.value = ''
  answer.value = null
  messageKey.value = 'modules.math24.ready'
  messageType.value = 'info'
}

function backspace() {
  expression.value = expression.value.slice(0, -1)
  answer.value = null
}

function submit() {
  const input = expression.value.trim()
  if (!input) {
    messageKey.value = 'modules.math24.empty'
    messageType.value = 'error'
    return
  }
  if (!validateExpression(input)) {
    messageKey.value = 'modules.math24.invalid'
    messageType.value = 'error'
    return
  }
  try {
    const value = Function(`"use strict"; return (${input})`)()
    if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
      messageKey.value = 'modules.math24.invalid'
      messageType.value = 'error'
      return
    }
    answer.value = value
    if (nearlyEqual(value, 24)) {
      messageKey.value = 'modules.math24.success'
      messageType.value = 'success'
    } else {
      messageKey.value = 'modules.math24.fail'
      messageType.value = 'error'
    }
  } catch {
    messageKey.value = 'modules.math24.invalid'
    messageType.value = 'error'
  }
}

const canShowAnswer = computed(() => answer.value !== null)
const canSubmit = computed(() => expression.value.trim().length > 0)

const numberUsage = computed(() => {
  const used = normalizeNumsFromExpression(expression.value)
  return numbers.value.map((n) => ({
    value: n,
    used: used.includes(n)
  }))
})

generateRound()
</script>

<template>
  <div class="page">
    <div class="page-inner">
      <div class="header">
        <h1>{{ t('modules.math24.title') }}</h1>
        <p>{{ t('modules.math24.subtitle') }}</p>
      </div>

      <div class="board">
        <div class="top-grid">
          <div class="cards-wrap">
            <div class="cards">
              <button
                v-for="(num, idx) in numbers"
                :key="`${idx}-${num}`"
                class="card"
                @click="appendToken(String(num))"
              >
                {{ num }}
              </button>
            </div>
            <div class="usage">
              <span>{{ t('modules.math24.usage') }}</span>
              <div class="usage-chips">
                <span
                  v-for="(n, idx) in numberUsage"
                  :key="`${idx}-${n.value}`"
                  class="usage-chip"
                  :data-used="n.used"
                >
                  {{ n.value }}
                </span>
              </div>
            </div>
          </div>

          <div class="pad-wrap">
            <div class="operator-pad">
              <button v-for="op in operatorPad" :key="op" class="pad-btn op" @click="appendToken(op)">{{ op }}</button>
            </div>
            <div class="quick-actions">
              <button class="btn ghost" @click="backspace">{{ t('modules.math24.backspace') }}</button>
              <button class="btn ghost" @click="clearExpression">{{ t('modules.math24.clear') }}</button>
              <button class="btn ghost" @click="generateRound">{{ t('modules.math24.nextRound') }}</button>
            </div>
          </div>
        </div>

        <div class="composer">
          <input
            v-model="expression"
            type="text"
            :placeholder="t('modules.math24.placeholder')"
            class="expr-input"
            @keyup.enter="submit"
          >
          <button class="btn primary" :disabled="!canSubmit" @click="submit">{{ t('modules.math24.submit') }}</button>
        </div>

        <div class="feedback" :data-type="messageType">{{ t(messageKey) }}</div>
        <div v-if="canShowAnswer" class="answer">{{ t('modules.math24.answer', { value: answer }) }}</div>

        <div class="solution-card">
          <button class="solution-toggle" @click="showSolution = !showSolution">
            {{ showSolution ? t('modules.math24.hideHint') : t('modules.math24.showHint') }}
          </button>
          <code v-if="showSolution">{{ solution }}</code>
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

.board {
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  box-shadow: var(--shadow);
  padding: 16px;
  display: grid;
  gap: 14px;
}

.top-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 14px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.card {
  height: 84px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--color-primary) 30%, var(--color-border));
  background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  font-weight: 800;
  color: var(--color-text);
  cursor: pointer;
  transition: var(--transition);

  &:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--color-primary) 55%, var(--color-border));
  }
}

.usage {
  margin-top: 10px;
  display: grid;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.usage-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.usage-chip {
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 4px 10px;
  background: var(--color-surface);
  color: var(--color-text-secondary);

  &[data-used='true'] {
    color: #16a34a;
    border-color: color-mix(in srgb, #16a34a 45%, var(--color-border));
  }
}

.pad-wrap {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 10px;
  background: color-mix(in srgb, var(--color-surface) 96%, transparent);
}

.operator-pad {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.pad-btn {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  height: 40px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);

  &:hover {
    border-color: color-mix(in srgb, var(--color-primary) 45%, var(--color-border));
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.composer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.expr-input {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  padding: 11px 12px;
  font-size: 14px;
  outline: none;
}

.btn {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  padding: 0 12px;
  cursor: pointer;
  transition: var(--transition);
  height: 42px;

  &:hover {
    border-color: color-mix(in srgb, var(--color-primary) 45%, var(--color-border));
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn.primary {
  min-width: 120px;
  background: color-mix(in srgb, var(--color-primary) 20%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
}

.btn.ghost {
  height: 36px;
  font-size: 12px;
}

.feedback {
  font-size: 14px;

  &[data-type='success'] {
    color: #16a34a;
  }

  &[data-type='error'] {
    color: #dc2626;
  }

  &[data-type='info'] {
    color: var(--color-text-secondary);
  }
}

.answer {
  font-size: 14px;
  color: var(--color-text);
}

.solution-card {
  border-top: 1px dashed var(--color-border);
  padding-top: 10px;
  display: grid;
  gap: 8px;
}

.solution-toggle {
  width: fit-content;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 7px 12px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.solution-card code {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
}

[data-theme='pixel'] {
  .board,
  .card,
  .usage-chip,
  .pad-wrap,
  .pad-btn,
  .expr-input,
  .btn,
  .solution-toggle,
  .solution-card code {
    border-radius: 0;
    border-width: 2px;
  }

  .card:hover,
  .pad-btn:hover,
  .btn:hover {
    box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.3);
  }
}

[data-theme='night'] {
  .board,
  .pad-wrap {
    border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
  }
}

@media (max-width: 860px) {
  .top-grid {
    grid-template-columns: 1fr;
  }

  .cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .composer {
    grid-template-columns: 1fr;
  }
}
</style>
