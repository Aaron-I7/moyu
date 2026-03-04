export type ThemeId = 'day' | 'night' | 'pixel'

export interface ThemeConfig {
  id: ThemeId
  name: string
  i18nKey: string
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
  day: {
    id: 'day',
    name: 'Day',
    i18nKey: 'theme.day',
    description: 'Editorial daylight with clean contrast and soft paper surface',
    icon: 'mdi:palette',
    fontFamily: '"Public Sans", "Segoe UI", sans-serif',
    colors: {
      primary: '#6E2CF4',
      secondary: '#8F64FF',
      accent: '#18A57B',
      background: '#F5F6FB',
      surface: '#FFFFFF',
      text: '#111735',
      textSecondary: '#4F597C',
      border: '#DCE2F0',
      success: '#0F9E77',
      warning: '#D97706',
      error: '#DC2626'
    },
    effects: {
      shadow: '0 10px 26px rgba(30, 42, 86, 0.1)',
      borderRadius: '16px',
      transition: 'all 0.2s cubic-bezier(0.2, 0.7, 0.2, 1)'
    }
  },
  
  night: {
    id: 'night',
    name: 'Night',
    i18nKey: 'theme.night',
    description: 'Global dark layout with premium contrast and deep surfaces',
    icon: 'mdi:weather-night',
    fontFamily: '"Public Sans", "Segoe UI", sans-serif',
    colors: {
      primary: '#A78BFA',
      secondary: '#60A5FA',
      accent: '#22C55E',
      background: '#090D17',
      surface: '#131B2E',
      text: '#E9EEFF',
      textSecondary: '#96A4C6',
      border: '#27324A',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#F87171'
    },
    effects: {
      shadow: '0 16px 38px rgba(2, 6, 20, 0.55)',
      borderRadius: '18px',
      transition: 'all 0.2s cubic-bezier(0.2, 0.7, 0.2, 1)'
    }
  },
  
  pixel: {
    id: 'pixel',
    name: 'Pixel',
    i18nKey: 'theme.pixel',
    description: 'Retro arcade pixel system with sharp edges and high contrast',
    icon: 'mdi:controller-classic',
    fontFamily: '"Public Sans", "Segoe UI", sans-serif',
    colors: {
      primary: '#F5D60A',
      secondary: '#F97316',
      accent: '#22D3EE',
      background: '#111111',
      surface: '#1B1B1B',
      text: '#F5F5F5',
      textSecondary: '#C2C2C2',
      border: '#3A3A3A',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#FB7185'
    },
    effects: {
      shadow: '0 0 0 2px rgba(0, 0, 0, 0.5)',
      borderRadius: '0px',
      transition: 'all 0.15s steps(2, end)',
      pixelBorder: true
    }
  }
}

export const themeList = Object.values(themes)
