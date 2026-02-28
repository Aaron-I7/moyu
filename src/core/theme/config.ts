export type ThemeId = 'default' | 'pixel' | 'retro'

export interface ThemeConfig {
  id: ThemeId
  name: string
  description: string
  icon: string
  fontFamily: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
    textSecondary: string
    border: string
    success: string
    warning: string
    error: string
  }
  effects: {
    shadow: string
    borderRadius: string
    transition: string
    glow?: string
    scanlines?: boolean
    pixelBorder?: boolean
  }
}

export const themes: Record<ThemeId, ThemeConfig> = {
  default: {
    id: 'default',
    name: '默认',
    description: '简洁现代风格',
    icon: 'mdi:palette',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    colors: {
      primary: '#10B981',
      secondary: '#3B82F6',
      accent: '#F59E0B',
      background: '#F9FAFB',
      surface: '#FFFFFF',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444'
    },
    effects: {
      shadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      borderRadius: '12px',
      transition: 'all 0.2s ease'
    }
  },
  
  pixel: {
    id: 'pixel',
    name: '像素风格',
    description: '8-bit 复古游戏风格',
    icon: 'mdi:gamepad-variant',
    fontFamily: '"Press Start 2P", cursive',
    colors: {
      primary: '#4ADE80',
      secondary: '#60A5FA',
      accent: '#FBBF24',
      background: '#1E293B',
      surface: '#334155',
      text: '#E2E8F0',
      textSecondary: '#94A3B8',
      border: '#475569',
      success: '#4ADE80',
      warning: '#FBBF24',
      error: '#F87171'
    },
    effects: {
      shadow: '3px 3px 0 rgba(0, 0, 0, 0.3)',
      borderRadius: '0',
      transition: 'none',
      pixelBorder: true
    }
  },
  
  retro: {
    id: 'retro',
    name: '复古未来',
    description: '80年代霓虹赛博风格',
    icon: 'mdi:weather-night',
    fontFamily: '"Chakra Petch", sans-serif',
    colors: {
      primary: '#8B5CF6',
      secondary: '#06B6D4',
      accent: '#EC4899',
      background: '#0F172A',
      surface: '#1E293B',
      text: '#F1F5F9',
      textSecondary: '#94A3B8',
      border: '#334155',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444'
    },
    effects: {
      shadow: '0 0 20px rgba(139, 92, 246, 0.3)',
      borderRadius: '8px',
      transition: 'all 0.3s ease',
      glow: '0 0 10px currentColor',
      scanlines: true
    }
  }
}

export const themeList = Object.values(themes)
