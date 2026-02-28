---
name: "moyu-adder"
description: "Add or modify game/tool/reading module to Moyu platform. Invoke when user wants to create game, tool, or reading module."
---

# Moyu Adder

This skill helps you Add or modify modules (games/tools/reading) to the Moyu platform while maintaining architectural consistency and design quality.

## When to Invoke

Invoke this skill when:
- User wants to Add or modify a game module
- User wants to Add or modify a tool module  
- User wants to Add or modify a reading module
- User asks to create a feature for the platform

## Core Principles

### 1. Module Independence (Decoupling)

Each module MUST be completely independent:
- **No imports from other modules** - Each module is self-contained
- **No shared state between modules** - State management is private
- **Private resources** - All components, composables, utils, and assets are private to the module
- **Only depend on core modules** - router, theme, module registry are shared

### 2. Design Consistency (Multi-Theme Support)

All UI components MUST support 3 themes:

| Theme | Key Characteristics |
|-------|---------------------|
| **default** | Rounded corners (12px), soft shadows, smooth transitions, modern colors |
| **pixel** | No border-radius, 2px borders, pixel shadows (3px 3px 0 rgba(0,0,0,0.3)), Press Start 2P font |
| **retro** | Neon glow effects, box-shadow with rgba(139, 92, 246, 0.3), Chakra Petch font, subtle scanlines |

Use CSS variables for theming:
```scss
color: var(--color-primary);
background: var(--color-surface);
border-radius: var(--border-radius);
box-shadow: var(--shadow);
transition: var(--transition);
```

### 3. Research Before Implementation

Before creating a module, ALWAYS:
1. **Search existing modules** for similar implementations
2. **Web search** are there any implementation solutions for reference
3. It should have complete functionality. Emojis cannot be used, instead, SVG should be used.

## Step-by-Step Guide

### Step 1: Research Phase

```bash
# Search for similar implementations in the codebase
# Use SearchCodebase or Grep tools

# Example searches:
# - "similar game logic"
# - "audio player implementation"
# - "file reader pattern"
```

Research checklist:
- [ ] Are there similar modules in the codebase?
- [ ] Are there npm packages that solve this problem?
- [ ] What design patterns are used in existing modules?
- [ ] Can any existing code be reused?

### Step 2: Determine Module Category

Ask user to confirm:
- **games**: `/games/{module-name}` - Entertainment, puzzles, casual games
- **tools**: `/tools/{module-name}` - Utilities, productivity tools
- **reading**: `/reading/{module-name}` - Reading-related features

### Step 3: Create Module Directory

```bash
# For games
mkdir -p src/modules/games/{module-name}/components
mkdir -p src/modules/games/{module-name}/composables
mkdir -p src/modules/games/{module-name}/assets/images

# For tools
mkdir -p src/modules/tools/{module-name}/components
mkdir -p src/modules/tools/{module-name}/composables
mkdir -p src/modules/tools/{module-name}/assets
```

### Step 4: Create config.ts

```typescript
// src/modules/{category}/{module-name}/config.ts
import type { ModuleConfig } from '@/core/module/types'

const moduleConfig: ModuleConfig = {
  id: '{module-name}',
  name: '{Module Display Name}',
  description: '{Module description}',
  category: '{category}', // 'games' | 'tools' | 'reading'
  tags: ['tag1', 'tag2'],
  icon: 'mdi:{icon-name}',
  iconType: 'iconify',
  route: '/{category}/{module-name}',
  component: async () => {
    const mod = await import('./index.vue')
    return mod.default
  },
  meta: {
    title: '{Module Name} - 摸鱼吧'
  },
  enabled: true,
  order: 1
}

export default moduleConfig
```

### Step 5: Create index.vue with Theme Support

```vue
<script setup lang="ts">
// Import private composables only
// import { useModule } from './composables/useModule'
</script>

<template>
  <div class="page">
    <div class="page-inner">
      <div class="page-header">
        <h1>{Module Name}</h1>
        <p>{Description}</p>
      </div>
      
      <!-- Module content -->
    </div>
  </div>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding-top: 56px;
}

.page-inner {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
}

.page-header {
  margin-bottom: 32px;
  
  h1 {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 4px;
  }
  
  p {
    font-size: 15px;
    color: var(--color-text-secondary);
  }
}

// Theme: pixel - No border-radius, pixel borders
[data-theme="pixel"] {
  .card, .btn {
    border-radius: 0;
    border-width: 2px;
    
    &:hover {
      box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.3);
    }
  }
}

// Theme: retro - Neon glow effects
[data-theme="retro"] {
  .card:hover {
    border-color: var(--color-primary);
    box-shadow: 0 0 15px rgba(139, 92, 246, 0.2);
  }
}
</style>
```

### Step 6: Create types.ts

```typescript
// src/modules/{category}/{module-name}/types.ts
export interface ModuleState {
  // Define module state
}

export interface ModuleConfig {
  // Define module config
}
```

### Step 7: Register Module

Add to category index file:

```typescript
// src/modules/games/index.ts (for games)
// or src/modules/tools/index.ts (for tools)

import newModuleConfig from './{module-name}/config'

// Add to the modules array
const gameModules: ModuleConfig[] = [
  // ... existing modules
  newModuleConfig
]
```
## Theme Compatibility Checklist

Before completing, verify:

- [ ] Uses CSS variables (var(--color-primary), etc.)
- [ ] Has `[data-theme="pixel"]` styles with border-radius: 0
- [ ] Has `[data-theme="retro"]` styles with glow effects
- [ ] Hover states work in all themes
- [ ] Text contrast is sufficient in all themes
- [ ] No hardcoded colors

## Module Independence Checklist

- [ ] No imports from other modules
- [ ] All components are in module's components/ folder
- [ ] All composables are in module's composables/ folder
- [ ] All types are in module's types.ts
- [ ] Only depends on core modules (router, theme, registry)

## Available Icons

Use iconify icons with `mdi:` prefix:
- Games: `mdi:gamepad-variant`, `mdi:puzzle`, `mdi:pac-man`, `mdi:cards`
- Tools: `mdi:tools`, `mdi:wrench`, `mdi:cog`, `mdi:calculator`
- Audio: `mdi:music-note`, `mdi:volume-high`, `mdi:headphones`
- Reading: `mdi:book-open-page-variant`, `mdi:book`, `mdi:text`
- And 100+ more at https://icon-sets.iconify.design/mdi/

## Use chrome devtools mdc for functional testing verification

## Example: Adding a Pomodoro Timer

### Step 1: Research
- Search for "timer" in codebase
- Check npm for pomodoro libraries
- Find similar implementations from web

### Step 2: Create Structure
```
src/modules/tools/pomodoro/
├── index.vue
├── config.ts
├── types.ts
├── composables/
│   └── useTimer.ts
└── components/
    └── TimerDisplay.vue
```

### Step 3: Implement with Theme Support
- Use CSS variables for colors
- Add pixel theme styles (no border-radius)
- Add retro theme styles (glow effects)

### Step 4: Register
- Add to `src/modules/tools/index.ts`

### Step 5: Use chrome devtools mdc for functional testing verification

## Common Mistakes to Avoid

1. **Importing from other modules** - Each module must be self-contained
2. **Forgetting theme styles** - Must support all 3 themes
3. **Hardcoded colors** - Always use CSS variables
4. **Missing registration** - Don't forget to add to index.ts
5. **Wrong route path** - Must match category structure
6. **Skipping research** - Always check for existing solutions first
