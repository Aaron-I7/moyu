import type { Weather, WeatherConfig, FishRarity } from '../types'

export const WEATHER_CONFIG: Record<Weather, WeatherConfig> = {
  sunny: {
    type: 'sunny',
    name: '晴朗',
    icon: '☀️',
    description: '阳光明媚，适合垂钓的好天气',
    fishRarityBonus: {
      common: 1.2,
      uncommon: 1.1
    },
    ambientParticles: ['butterfly', 'sparkle'],
    skyTint: 0xFFF8E8,
    waterTint: 0x7EB8D8
  },
  cloudy: {
    type: 'cloudy',
    name: '多云',
    icon: '⛅',
    description: '云层遮蔽，鱼儿更加活跃',
    fishRarityBonus: {
      uncommon: 1.3,
      rare: 1.2
    },
    ambientParticles: ['leaf'],
    skyTint: 0xE8E8E8,
    waterTint: 0x6A9AB8
  },
  rainy: {
    type: 'rainy',
    name: '雨天',
    icon: '🌧️',
    description: '细雨绵绵，稀有鱼种更易出现',
    fishRarityBonus: {
      rare: 1.4,
      epic: 1.3
    },
    ambientParticles: ['raindrop', 'splash'],
    skyTint: 0xC8D0D8,
    waterTint: 0x5A8AA8
  },
  snowy: {
    type: 'snowy',
    name: '雪天',
    icon: '❄️',
    description: '银装素裹，传说之鱼悄然现身',
    fishRarityBonus: {
      epic: 1.5,
      legendary: 1.8
    },
    ambientParticles: ['snowflake', 'glow'],
    skyTint: 0xF0F4F8,
    waterTint: 0x8AA8B8
  }
}

export function getWeatherConfig(weather: Weather): WeatherConfig {
  return WEATHER_CONFIG[weather]
}

export function getRandomWeather(): Weather {
  const weathers: Weather[] = ['sunny', 'sunny', 'sunny', 'cloudy', 'cloudy', 'rainy', 'snowy']
  const index = Math.floor(Math.random() * weathers.length)
  return weathers[index] ?? 'sunny'
}

export function calculateRarityBonus(
  baseChance: number,
  rarity: FishRarity,
  weather: Weather
): number {
  const config = WEATHER_CONFIG[weather]
  const bonus = config.fishRarityBonus[rarity] ?? 1
  return baseChance * bonus
}
