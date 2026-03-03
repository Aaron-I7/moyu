<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import GlobalBossKey from '@/components/common/GlobalBossKey.vue'
import GlobalToolMenu from '@/components/common/GlobalToolMenu.vue'
import GlobalDanmaku from '@/components/common/GlobalDanmaku.vue'
import DanmakuFab from '@/components/common/DanmakuFab.vue'
</script>

<template>
  <div class="app-container">
    <GlobalDanmaku />
    <AppHeader />
    <main class="app-main">
      <router-view />
    </main>
    <GlobalToolMenu />
    <GlobalBossKey />
    <DanmakuFab />
  </div>
</template>

<style scoped lang="scss">
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-top: 56px;
}

.app-main {
  flex: 1;
  overflow: auto;
}
</style>
