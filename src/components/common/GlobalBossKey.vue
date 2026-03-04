<template>
  <Teleport to="body">
    <Transition name="boss-key">
      <div v-if="isActive" class="boss-key-overlay" @click="handleClick">
        <div class="boss-key-content">
          <component :is="currentModeComponent" />
        </div>
        <div class="hint">Press <kbd>Esc</kbd> or click anywhere to return</div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineComponent, h } from 'vue'
import type { BossKeyMode } from '@/stores/bossKey'
import { useBossKeyStore } from '@/stores/bossKey'

const isActive = ref(false)
const bossKeyStore = useBossKeyStore()

const currentMode = computed(() => bossKeyStore.mode)

const CodeEditor = defineComponent({
  name: 'CodeEditor',
  setup() {
    const fakeCode = [
      { text: 'import { defineStore } from \'pinia\'', type: 'keyword' },
      { text: 'import { ref, computed } from \'vue\'', type: 'keyword' },
      { text: '', type: '' },
      { text: 'interface UserState {', type: 'type' },
      { text: '  id: string', type: 'property' },
      { text: '  name: string', type: 'property' },
      { text: '  email: string', type: 'property' },
      { text: '  role: \'admin\' | \'user\' | \'guest\'', type: 'property' },
      { text: '}', type: 'type' },
      { text: '', type: '' },
      { text: 'export const useUserStore = defineStore(\'user\', () => {', type: 'keyword' },
      { text: '  const user = ref<UserState | null>(null)', type: 'variable' },
      { text: '  const isLoggedIn = computed(() => !!user.value)', type: 'variable' },
      { text: '', type: '' },
      { text: '  async function login(credentials: Credentials) {', type: 'function' },
      { text: '    try {', type: 'keyword' },
      { text: '      const response = await api.post(\'/auth/login\', credentials)', type: 'variable' },
      { text: '      user.value = response.data.user', type: 'variable' },
      { text: '      return { success: true }', type: 'keyword' },
      { text: '    } catch (error) {', type: 'keyword' },
      { text: '      console.error(\'Login failed:\', error)', type: 'function' },
      { text: '      return { success: false, error }', type: 'keyword' },
      { text: '    }', type: 'keyword' },
      { text: '  }', type: 'function' },
      { text: '', type: '' },
      { text: '  function logout() {', type: 'function' },
      { text: '    user.value = null', type: 'variable' },
      { text: '  }', type: 'function' },
      { text: '', type: '' },
      { text: '  return { user, isLoggedIn, login, logout }', type: 'keyword' },
      { text: '})', type: 'keyword' },
    ]

    return () => h('div', { class: 'fake-ide' }, [
      h('header', { class: 'fake-header' }, [
        h('div', { class: 'fake-tabs' }, [
          h('span', { class: 'fake-tab active' }, [
            h('span', { class: 'tab-icon' }, '📄'),
            h('span', { class: 'tab-name' }, 'index.ts'),
          ]),
          h('span', { class: 'fake-tab' }, [
            h('span', { class: 'tab-icon' }, '📄'),
            h('span', { class: 'tab-name' }, 'utils.ts'),
          ]),
          h('span', { class: 'fake-tab' }, [
            h('span', { class: 'tab-icon' }, '📄'),
            h('span', { class: 'tab-name' }, 'api.ts'),
          ]),
        ]),
        h('div', { class: 'fake-actions' }, [
          h('span', { class: 'fake-btn' }, 'Split'),
          h('span', { class: 'fake-btn' }, 'More'),
        ]),
      ]),
      h('main', { class: 'fake-content' }, [
        h('div', { class: 'line-numbers' }, 
          Array.from({ length: 30 }, (_, i) => h('span', {}, i + 1))
        ),
        h('div', { class: 'code-content' },
          fakeCode.map((line, index) => 
            h('div', { class: 'code-line', key: index }, [
              h('span', { class: line.type }, line.text),
            ])
          )
        ),
      ]),
      h('footer', { class: 'fake-footer' }, [
        h('span', { class: 'footer-item' }, 'TypeScript'),
        h('span', { class: 'footer-item' }, 'UTF-8'),
        h('span', { class: 'footer-item' }, 'LF'),
        h('span', { class: 'footer-item' }, 'Spaces: 2'),
      ]),
    ])
  },
})

const ExcelSheet = defineComponent({
  name: 'ExcelSheet',
  setup() {
    const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const rows = 20
    const cellData: Record<string, string> = {
      'A1': 'Project', 'B1': 'Owner', 'C1': 'Progress', 'D1': 'Budget', 'E1': 'Spent', 'F1': 'Status', 'G1': 'Due Date', 'H1': 'Notes',
      'A2': 'User Management', 'B2': 'Alex', 'C2': '85%', 'D2': '¥50,000', 'E2': '¥42,500', 'F2': 'In progress', 'G2': '2024-03-15', 'H2': 'Pending test',
      'A3': 'Analytics Platform', 'B3': 'Robin', 'C3': '60%', 'D3': '¥80,000', 'E3': '¥48,000', 'F3': 'In progress', 'G3': '2024-04-01', 'H3': '',
      'A4': 'Mobile Adaptation', 'B4': 'Taylor', 'C4': '100%', 'D4': '¥30,000', 'E4': '¥28,500', 'F4': 'Done', 'G4': '2024-02-28', 'H4': 'Accepted',
      'A5': 'API Optimization', 'B5': 'Jordan', 'C5': '40%', 'D5': '¥25,000', 'E5': '¥10,000', 'F5': 'In progress', 'G5': '2024-03-20', 'H5': '',
      'A6': 'Security Audit', 'B6': 'Morgan', 'C6': '20%', 'D6': '¥15,000', 'E6': '¥3,000', 'F6': 'In progress', 'G6': '2024-04-15', 'H6': 'Waiting vendor',
      'A7': '', 'B7': '', 'C7': '', 'D7': '', 'E7': '', 'F7': '', 'G7': '', 'H7': '',
      'A8': 'Total', 'B8': '', 'C8': '', 'D8': '¥200,000', 'E8': '¥132,000', 'F8': '', 'G8': '', 'H8': '',
    }

    return () => h('div', { class: 'fake-excel' }, [
      h('header', { class: 'excel-header' }, [
        h('div', { class: 'excel-toolbar' }, [
          h('span', { class: 'toolbar-btn' }, 'File'),
          h('span', { class: 'toolbar-btn' }, 'Edit'),
          h('span', { class: 'toolbar-btn' }, 'View'),
          h('span', { class: 'toolbar-btn' }, 'Insert'),
          h('span', { class: 'toolbar-btn' }, 'Format'),
          h('span', { class: 'toolbar-btn' }, 'Data'),
        ]),
        h('div', { class: 'excel-title' }, 'Project Progress Tracker.xlsx - Excel'),
      ]),
      h('div', { class: 'excel-content' }, [
        h('table', { class: 'excel-table' }, [
          h('thead', {}, [
            h('tr', {}, [
              h('th', { class: 'row-header' }, ''),
              ...columns.map(col => h('th', { class: 'col-header' }, col)),
            ]),
          ]),
          h('tbody', {},
            Array.from({ length: rows }, (_, rowIndex) => 
              h('tr', { key: rowIndex }, [
                h('td', { class: 'row-header' }, rowIndex + 1),
                ...columns.map(col => {
                  const cellId = `${col}${rowIndex + 1}`
                  const value = cellData[cellId] || ''
                  const isHeader = rowIndex === 0
                  const isTotal = rowIndex === 7
                  return h('td', { 
                    class: { 
                      'cell': true, 
                      'header-cell': isHeader,
                      'total-cell': isTotal,
                    } 
                  }, value)
                }),
              ])
            )
          ),
        ]),
      ]),
      h('footer', { class: 'excel-footer' }, [
        h('span', { class: 'sheet-tab active' }, 'Sheet1'),
        h('span', { class: 'sheet-tab' }, 'Sheet2'),
        h('span', { class: 'sheet-tab' }, 'Sheet3'),
        h('span', { class: 'add-sheet' }, '+'),
      ]),
    ])
  },
})

const TechForum = defineComponent({
  name: 'TechForum',
  setup() {
    const posts = [
      { id: 1, title: 'Vue 3 Composition API Best Practices', author: 'Frontend Alex', replies: 128, views: 2847, time: '10 min ago', tag: 'featured' },
      { id: 2, title: 'TypeScript 5.0 Deep Dive', author: 'TS Fan', replies: 89, views: 1563, time: '25 min ago', tag: 'tech' },
      { id: 3, title: 'Micro-Frontend Architecture Notes', author: 'Architect Lee', replies: 256, views: 5421, time: '1 hour ago', tag: 'featured' },
      { id: 4, title: 'Node.js Performance Tuning Tips', author: 'Backend Pro', replies: 67, views: 892, time: '2 hours ago', tag: 'tech' },
      { id: 5, title: 'React vs Vue in 2024', author: 'Tech Choice', replies: 312, views: 6789, time: '3 hours ago', tag: 'discussion' },
      { id: 6, title: 'Complete CSS Grid Guide', author: 'CSS Master', replies: 45, views: 654, time: '4 hours ago', tag: 'guide' },
      { id: 7, title: 'Webpack 5 Module Federation in Practice', author: 'Build Expert', replies: 78, views: 1234, time: '5 hours ago', tag: 'tech' },
      { id: 8, title: 'Frontend Security Best Practices', author: 'Security Guard', replies: 156, views: 3456, time: '6 hours ago', tag: 'featured' },
    ]

    return () => h('div', { class: 'fake-forum' }, [
      h('header', { class: 'forum-header' }, [
        h('div', { class: 'forum-logo' }, 'Tech Community'),
        h('div', { class: 'forum-nav' }, [
          h('span', { class: 'nav-item active' }, 'Home'),
          h('span', { class: 'nav-item' }, 'Featured'),
          h('span', { class: 'nav-item' }, 'Share'),
          h('span', { class: 'nav-item' }, 'Q&A'),
          h('span', { class: 'nav-item' }, 'Jobs'),
        ]),
        h('div', { class: 'forum-user' }, [
          h('span', { class: 'user-avatar' }, '👤'),
          h('span', { class: 'user-name' }, 'Ops Team'),
        ]),
      ]),
      h('main', { class: 'forum-content' }, [
        h('div', { class: 'forum-sidebar' }, [
          h('div', { class: 'sidebar-section' }, [
            h('h4', {}, 'Hot Tags'),
            h('div', { class: 'tag-list' }, [
              h('span', { class: 'tag' }, 'Vue'),
              h('span', { class: 'tag' }, 'React'),
              h('span', { class: 'tag' }, 'TypeScript'),
              h('span', { class: 'tag' }, 'Node.js'),
            ]),
          ]),
        ]),
        h('div', { class: 'forum-main' }, [
          h('div', { class: 'post-list' }, 
            posts.map(post => 
              h('div', { class: 'post-item', key: post.id }, [
                h('div', { class: 'post-info' }, [
                  post.tag === 'featured' 
                    ? h('span', { class: 'post-tag-jing' }, 'F')
                    : h('span', { class: 'post-tag' }, post.tag.charAt(0)),
                  h('span', { class: 'post-title' }, post.title),
                ]),
                h('div', { class: 'post-meta' }, [
                  h('span', {}, post.author),
                  h('span', {}, `${post.replies} replies`),
                  h('span', {}, `${post.views} views`),
                  h('span', {}, post.time),
                ]),
              ])
            )
          ),
        ]),
      ]),
    ])
  },
})

const Terminal = defineComponent({
  name: 'Terminal',
  setup() {
    const lines = [
      { type: 'prompt', text: 'PS C:\\Workspace\\ops> Get-Process' },
      { type: 'output', text: '' },
      { type: 'info', text: 'Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName' },
      { type: 'info', text: '-----  ------    -----      -----     ------     --  -- -----------' },
      { type: 'output', text: '' },
      { type: 'success', text: '   105      13    24560      39344      12.32   4320   1 Teams' },
      { type: 'output', text: '' },
      { type: 'info', text: '    88      10    18220      30188       4.15   7812   1 Outlook' },
      { type: 'info', text: '    76       8    16544      27612       2.34   9236   1 Excel' },
      { type: 'info', text: '    66       7    12320      21804       1.41   3356   1 OneDrive' },
      { type: 'output', text: '' },
      { type: 'prompt', text: 'PS C:\\Workspace\\ops> Get-Date' },
      { type: 'output', text: 'Tuesday, March 03, 2026 10:24:08 AM' },
      { type: 'output', text: '' },
      { type: 'output', text: '' },
      { type: 'output', text: 'Daily operations status: normal' },
      { type: 'output', text: 'Scheduled reports: synced' },
      { type: 'output', text: 'Workspace checks: passed' },
      { type: 'output', text: 'Pending items: 2 (documentation review)' },
      { type: 'output', text: 'Next sync window: 14:00' },
      { type: 'output', text: '' },
      { type: 'prompt', text: 'PS C:\\Workspace\\ops> _' },
    ]

    return () => h('div', { class: 'fake-terminal' }, [
      h('header', { class: 'terminal-header' }, [
        h('div', { class: 'terminal-title' }, 'Windows PowerShell'),
        h('div', { class: 'terminal-controls' }, [
          h('span', { class: 'control-btn minimize' }, '─'),
          h('span', { class: 'control-btn maximize' }, '□'),
          h('span', { class: 'control-btn close' }, '✕'),
        ]),
      ]),
      h('main', { class: 'terminal-content' },
        lines.map((line, index) => 
          h('div', { class: ['terminal-line', line.type], key: index }, line.text || '\u00A0')
        )
      ),
    ])
  },
})

const modeComponents: Record<BossKeyMode, any> = {
  code: CodeEditor,
  excel: ExcelSheet,
  forum: TechForum,
  terminal: Terminal,
}

const currentModeComponent = computed(() => modeComponents[currentMode.value])

function handleClick() {
  isActive.value = false
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    isActive.value = !isActive.value
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

defineExpose({ isActive })
</script>

<style scoped lang="scss">
.boss-key-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: #1e1e1e;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.boss-key-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  cursor: default;
}

.hint {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  color: #666;
  z-index: 100000;
  pointer-events: none;

  kbd {
    display: inline-block;
    padding: 2px 8px;
    background: #333;
    border: 1px solid #555;
    border-radius: 4px;
    font-family: inherit;
    color: #aaa;
  }
}

.boss-key-enter-active,
.boss-key-leave-active {
  transition: opacity 0.1s ease;
}

.boss-key-enter-from,
.boss-key-leave-to {
  opacity: 0;
}
</style>

<style lang="scss">
.fake-ide {
  width: 100%;
  height: 100%;
  background: #252526;
  display: flex;
  flex-direction: column;
}

.fake-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  height: 36px;
  background: #323233;
  border-bottom: 1px solid #3c3c3c;
  flex-shrink: 0;
}

.fake-tabs {
  display: flex;
  gap: 0;
}

.fake-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 36px;
  font-size: 13px;
  color: #969696;
  background: #2d2d2d;
  border-right: 1px solid #252526;

  &.active {
    background: #252526;
    color: #ffffff;
    border-top: 1px solid #007acc;
    margin-top: -1px;
  }
}

.tab-icon {
  font-size: 14px;
}

.tab-name {
  font-family: 'Consolas', 'Monaco', monospace;
}

.fake-actions {
  display: flex;
  gap: 8px;
}

.fake-btn {
  font-size: 12px;
  color: #969696;
  padding: 2px 8px;
  border-radius: 3px;

  &:hover {
    background: #3c3c3c;
  }
}

.fake-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.line-numbers {
  width: 50px;
  padding: 12px 0;
  background: #1e1e1e;
  text-align: right;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  color: #858585;
  user-select: none;
  flex-shrink: 0;

  span {
    display: block;
    padding-right: 16px;
    line-height: 1.6;
  }
}

.code-content {
  flex: 1;
  padding: 12px 16px;
  overflow: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.code-line {
  white-space: pre;
  color: #d4d4d4;
}

.keyword { color: #569cd6; }
.type { color: #4ec9b0; }
.property { color: #9cdcfe; }
.variable { color: #9cdcfe; }
.function { color: #dcdcaa; }
.string { color: #ce9178; }
.comment { color: #6a9955; }

.fake-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 12px;
  height: 24px;
  background: #007acc;
  font-size: 12px;
  color: #ffffff;
  flex-shrink: 0;
}

.footer-item {
  opacity: 0.9;
}

.fake-excel {
  width: 100%;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', Tahoma, sans-serif;
}

.excel-header {
  background: #217346;
  color: white;
  flex-shrink: 0;
}

.excel-toolbar {
  display: flex;
  gap: 4px;
  padding: 8px 16px 4px;
}

.toolbar-btn {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 3px;
  cursor: default;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.excel-title {
  padding: 4px 16px 8px;
  font-size: 13px;
  opacity: 0.9;
}

.excel-content {
  flex: 1;
  overflow: auto;
  background: #fff;
}

.excel-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.col-header, .row-header {
  background: #f3f2f1;
  color: #323130;
  font-weight: 600;
  text-align: center;
  padding: 6px 8px;
  border: 1px solid #d4d4d4;
  position: sticky;
}

.col-header {
  top: 0;
  min-width: 80px;
}

.row-header {
  left: 0;
  width: 40px;
}

.cell {
  padding: 6px 8px;
  border: 1px solid #e1dfdd;
  color: #323130;
  min-width: 80px;
}

.header-cell {
  background: #e6f2ea;
  font-weight: 600;
}

.total-cell {
  background: #fff4ce;
  font-weight: 600;
}

.excel-footer {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 8px;
  height: 28px;
  background: #f3f2f1;
  border-top: 1px solid #d4d4d4;
  flex-shrink: 0;
}

.sheet-tab {
  padding: 4px 12px;
  font-size: 12px;
  color: #323130;
  cursor: default;
  border-bottom: 2px solid transparent;

  &.active {
    background: #fff;
    border-bottom-color: #217346;
  }
}

.add-sheet {
  padding: 4px 8px;
  font-size: 14px;
  color: #323130;
  cursor: default;
}

.fake-forum {
  width: 100%;
  height: 100%;
  background: #f4f5f5;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.forum-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.forum-logo {
  font-size: 20px;
  font-weight: 700;
  color: #1e80ff;
}

.forum-nav {
  display: flex;
  gap: 24px;
}

.nav-item {
  font-size: 14px;
  color: #515767;
  cursor: default;

  &.active {
    color: #1e80ff;
    font-weight: 500;
  }
}

.forum-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  font-size: 20px;
}

.user-name {
  font-size: 14px;
  color: #515767;
}

.forum-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.forum-sidebar {
  width: 200px;
  padding: 16px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.sidebar-section {
  h4 {
    font-size: 14px;
    color: #252933;
    margin: 0 0 12px;
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  display: inline-block;
  padding: 4px 10px;
  background: #f2f3f5;
  border-radius: 4px;
  font-size: 12px;
  color: #515767;
}

.forum-main {
  flex: 1;
  padding: 16px;
  overflow: auto;
}

.post-list {
  background: #fff;
  border-radius: 4px;
}

.post-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #e8e8e8;

  &:last-child {
    border-bottom: none;
  }
}

.post-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.post-tag {
  display: inline-block;
  padding: 2px 6px;
  background: #e8f3ff;
  border-radius: 2px;
  font-size: 12px;
  color: #1e80ff;
}

.post-tag-jing {
  display: inline-block;
  padding: 2px 6px;
  background: #fff0e5;
  border-radius: 2px;
  font-size: 12px;
  color: #f64242;
}

.post-title {
  font-size: 14px;
  color: #252933;
  font-weight: 500;
}

.post-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #8a919f;
}

.fake-terminal {
  width: 100%;
  height: 100%;
  background: #0c0c0c;
  display: flex;
  flex-direction: column;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  height: 32px;
  background: #1f1f1f;
  flex-shrink: 0;
}

.terminal-title {
  font-size: 12px;
  color: #cccccc;
}

.terminal-controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  border-radius: 2px;

  &.minimize { background: #ffbd2e; color: #996600; }
  &.maximize { background: #28c93f; color: #006600; }
  &.close { background: #ff5f57; color: #990000; }
}

.terminal-content {
  flex: 1;
  padding: 12px 16px;
  overflow: auto;
  font-family: 'Cascadia Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.terminal-line {
  white-space: pre;

  &.prompt { color: #569cd6; }
  &.output { color: #cccccc; }
  &.info { color: #6a9955; }
  &.success { color: #4ec9b0; }
  &.error { color: #f14c4c; }
}
</style>
