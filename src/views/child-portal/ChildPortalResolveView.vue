<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { establishChildPortalSession } from '@/features/child-portal/session'

const route = useRoute()
const router = useRouter()
const resolving = ref(true)
const errorMessage = ref('')

const accessToken = computed(() => String(route.params.token || '').trim())

async function resolvePortal(): Promise<void> {
  if (!accessToken.value) {
    errorMessage.value = '链接里缺少访问令牌，请让家长重新生成一次专属链接。'
    resolving.value = false
    return
  }

  resolving.value = true
  errorMessage.value = ''

  try {
    await establishChildPortalSession(accessToken.value)
    await router.replace('/child/home')
  } catch (error) {
    errorMessage.value = String((error as { message?: string })?.message || '专属链接暂时打不开')
    resolving.value = false
  }
}

onMounted(() => {
  void resolvePortal()
})
</script>

<template>
  <section class="portal-resolve">
    <div class="resolve-card">
      <p class="resolve-kicker">儿童专属入口</p>
      <h1>正在打开你的成长空间</h1>
      <p v-if="resolving" class="resolve-copy">正在确认专属链接和会话，请稍等一下。</p>
      <p v-else class="resolve-copy resolve-copy--error">{{ errorMessage }}</p>
      <button v-if="!resolving" type="button" class="resolve-btn" @click="resolvePortal">
        重新尝试
      </button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.portal-resolve {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: clamp(20px, 4vw, 40px);
  background:
    radial-gradient(circle at top, rgba(247, 191, 111, 0.35), transparent 28%),
    linear-gradient(180deg, #fff8eb 0%, #eef6ff 100%);
}

.resolve-card {
  width: min(100%, 520px);
  padding: clamp(28px, 5vw, 40px);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(238, 180, 94, 0.28);
  box-shadow: 0 24px 60px rgba(38, 78, 120, 0.12);
  text-align: center;

  h1 {
    margin: 10px 0 12px;
    font-size: clamp(28px, 5vw, 40px);
    line-height: 1.1;
    color: #20324a;
  }
}

.resolve-kicker {
  margin: 0;
  font-size: 13px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #db8a00;
  font-weight: 800;
}

.resolve-copy {
  margin: 0;
  font-size: 16px;
  line-height: 1.7;
  color: #4c5e77;
}

.resolve-copy--error {
  color: #a03f2b;
}

.resolve-btn {
  margin-top: 20px;
  border: none;
  border-radius: 999px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #ffb14a 0%, #ff7f50 100%);
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}
</style>
