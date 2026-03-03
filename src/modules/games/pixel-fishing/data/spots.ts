/** 像素钓场 — 5 个钓点定义 */
import type { FishingSpot } from '../types'

export const SPOTS: FishingSpot[] = [
  {
    id: 'stream',
    name: '林间溪流',
    description: '清澈的山间小溪，阳光透过树叶洒在水面上，是新手的理想练习地',
    difficulty: 1,
    unlockCondition: 0,
    environmentType: 'stream',
    availableFishIds: [
      'crucian', 'minnow', 'loach', 'shrimp',
      'goldfish', 'gudgeon', 'bitterling', 'crayfish'
    ],
    bgmKey: 'bgm-stream',
    ambientKey: 'amb-birds',
    supportedWeather: ['sunny', 'cloudy', 'rainy'],
    palette: {
      skyTop: 0xF5E0B0,    // 暖奶油色天空
      skyBottom: 0xE8C078,  // 淡琥珀渐变
      waterSurface: 0x2A6A6A, // 深青水面
      waterDeep: 0x142E38,   // 墨绿深水
      ground: 0x3A2820,     // 暗棕土地
      foliage: 0x1A4A2A,    // 深森林绿
      accent: 0xD4A44A      // 琥珀金强调色
    }
  },
  {
    id: 'lake',
    name: '静谧湖泊',
    description: '薄雾笼罩的湖面，柳枝低垂，荷叶与睡莲点缀其间',
    difficulty: 2,
    unlockCondition: 10,
    environmentType: 'lake',
    availableFishIds: [
      'carp', 'catfish', 'perch', 'turtle',
      'bass', 'bluegill', 'pike', 'lotus-koi'
    ],
    bgmKey: 'bgm-stream',
    ambientKey: 'amb-water',
    supportedWeather: ['sunny', 'cloudy', 'rainy'],
    palette: {
      skyTop: 0x5A4878,    // 薰衣草暮色
      skyBottom: 0x9878A8, // 淡紫渐变
      waterSurface: 0x1E4A5A, // 暗蓝绿水面
      waterDeep: 0x0E2030,   // 深墨蓝
      ground: 0x2A3A2A,     // 暗苔绿
      foliage: 0x2A5A3A,    // 深柳绿
      accent: 0xC8A0D8      // 淡紫强调色
    }
  },
  {
    id: 'river',
    name: '山间河流',
    description: '湍急的河水在峡谷间奔涌，需要更高超的技巧才能驾驭这里的水域',
    difficulty: 3,
    unlockCondition: 30,
    environmentType: 'river',
    availableFishIds: [
      'salmon', 'trout', 'sturgeon', 'eel',
      'barbel', 'chub', 'grayling', 'golden-trout'
    ],
    bgmKey: 'bgm-stream',
    ambientKey: 'amb-water',
    supportedWeather: ['sunny', 'cloudy', 'rainy'],
    palette: {
      skyTop: 0x8AAAB8,    // 冷灰蓝天空
      skyBottom: 0xB0C8D0,  // 雾蓝渐变
      waterSurface: 0x2A5A80, // 钢蓝水面
      waterDeep: 0x122A40,   // 深海蓝
      ground: 0x4A4A4A,     // 深灰岩石
      foliage: 0x1A3A1A,    // 暗松绿
      accent: 0xB0885A      // 铜褐强调色
    }
  },
  {
    id: 'coast',
    name: '黄昏海岸',
    description: '灯塔矗立在海角，海鸥在落日余晖中翱翔，潮汐带来深海的馈赠',
    difficulty: 4,
    unlockCondition: 60,
    environmentType: 'coast',
    availableFishIds: [
      'sea-bass', 'flounder', 'mackerel', 'pufferfish',
      'octopus', 'sea-bream', 'swordfish', 'manta-ray'
    ],
    bgmKey: 'bgm-ocean',
    ambientKey: 'amb-water',
    supportedWeather: ['sunny', 'cloudy', 'rainy'],
    palette: {
      skyTop: 0xC85A30,    // 深橙落日
      skyBottom: 0xE8A050,  // 金琥珀
      waterSurface: 0x1A4A68, // 暗靛蓝水面
      waterDeep: 0x0A2038,   // 深夜蓝
      ground: 0x8A7050,     // 暗沙色
      foliage: 0x5A7A5A,    // 灰橄榄绿
      accent: 0xE87040      // 珊瑚红强调色
    }
  },
  {
    id: 'deep-sea',
    name: '神秘深海',
    description: '漆黑的深海中，发光生物如星辰般闪烁，传说中的巨兽潜伏于此',
    difficulty: 5,
    unlockCondition: 100,
    environmentType: 'deep-sea',
    availableFishIds: [
      'anglerfish', 'jellyfish', 'lanternfish', 'giant-squid',
      'viperfish', 'nautilus', 'coelacanth', 'dragon-fish'
    ],
    bgmKey: 'bgm-ocean',
    ambientKey: 'amb-water',
    supportedWeather: ['cloudy', 'rainy', 'snowy'],
    palette: {
      skyTop: 0x08081A,
      skyBottom: 0x121230,
      waterSurface: 0x0A1A3A,
      waterDeep: 0x040810,
      ground: 0x0E0E20,
      foliage: 0x005A7A,
      accent: 0x6A5AAE
    }
  }
]

export function getSpotById(id: string): FishingSpot | undefined {
  return SPOTS.find(s => s.id === id)
}

export function getUnlockedSpots(totalCatch: number): FishingSpot[] {
  return SPOTS.filter(s => totalCatch >= s.unlockCondition)
}
