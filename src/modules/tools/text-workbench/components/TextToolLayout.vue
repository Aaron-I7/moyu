<script setup lang="ts">
defineProps<{
  inputTitle: string
  outputTitle: string
  outputHint?: string
}>()
</script>

<template>
  <div class="layout">
    <aside class="sidebar panel">
      <slot name="sidebar" />
    </aside>

    <section class="pane panel input-pane">
      <div class="pane-header">
        <span class="title">{{ inputTitle }}</span>
      </div>
      <div class="pane-body">
        <slot name="input" />
      </div>
    </section>

    <section class="pane panel output-pane">
      <div class="pane-header">
        <span class="title">{{ outputTitle }}</span>
        <span v-if="outputHint" class="hint">{{ outputHint }}</span>
      </div>
      <div class="pane-body">
        <slot name="output" />
      </div>
    </section>

    <div class="footer panel">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.layout {
  display: grid;
  grid-template-columns: 260px 1fr 1fr;
  grid-template-rows: 1fr auto;
  grid-template-areas:
    'sidebar input output'
    'footer footer footer';
  gap: 12px;
  height: 100%;
}

.panel {
  border: 1px solid #d9e3f7;
  border-radius: 14px;
  background: #f8fbff;
  box-shadow: 0 10px 24px rgba(61, 84, 164, 0.08);
}

.sidebar {
  grid-area: sidebar;
  padding: 12px;
}

.pane {
  display: grid;
  grid-template-rows: auto 1fr;
  background: #fff;
  overflow: hidden;
}

.input-pane {
  grid-area: input;
}

.output-pane {
  grid-area: output;
}

.pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e3ebfb;
  padding: 12px 14px;
  background: #f4f8ff;
}

.title {
  font-size: 12px;
  font-weight: 700;
  color: #1f3e86;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hint {
  font-size: 12px;
  color: #5b6f96;
}

.pane-body {
  padding: 12px;
}

.footer {
  grid-area: footer;
  padding: 10px 12px;
  background: #ecf3ff;
}

@media (max-width: 1080px) {
  .layout {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      'sidebar sidebar'
      'input output'
      'footer footer';
  }
}

@media (max-width: 860px) {
  .layout {
    grid-template-columns: 1fr;
    grid-template-areas:
      'sidebar'
      'input'
      'output'
      'footer';
  }

  .pane {
    min-height: 360px;
  }
}

[data-theme='pixel'] {
  .panel {
    border-radius: 0;
    border-width: 2px;
  }
}
</style>
