import type { Fish } from '../types'
import { FISH_DETAILS } from './fishDetails'

function createFish(base: Omit<Fish, 'imageUrl' | 'baikeUrl' | 'scientificName' | 'habitat' | 'diet' | 'funFact'>): Fish {
  const details = FISH_DETAILS[base.id] || {}
  return {
    ...base,
    imageUrl: details.imageUrl || '',
    baikeUrl: details.baikeUrl,
    scientificName: details.scientificName,
    habitat: details.habitat,
    diet: details.diet,
    funFact: details.funFact
  }
}

export const FISH_DATA: Fish[] = [
  createFish({
    id: 'crucian', name: '鲫鱼', description: '最常见的淡水鱼，银色鳞片在阳光下闪闪发光',
    rarity: 'common', sizeRange: [10, 25], weightRange: [0.1, 0.5],
    catchDifficulty: 1, timingBarSpeed: 120, timingBarGreenZone: 0.65, timingBarMoving: false,
    value: 5, spriteKey: 'fish-crucian', spotIds: ['stream'],
    stages: 1, preferredWeather: ['sunny', 'cloudy']
  }),
  createFish({
    id: 'minnow', name: '小鲦鱼', description: '体型娇小但游速极快的小型鱼',
    rarity: 'common', sizeRange: [3, 8], weightRange: [0.01, 0.05],
    catchDifficulty: 1, timingBarSpeed: 140, timingBarGreenZone: 0.7, timingBarMoving: false,
    value: 2, spriteKey: 'fish-minnow', spotIds: ['stream'],
    stages: 1, preferredWeather: ['sunny', 'cloudy']
  }),
  createFish({
    id: 'loach', name: '泥鳅', description: '喜欢躲在溪底石缝中的滑溜小鱼',
    rarity: 'common', sizeRange: [8, 18], weightRange: [0.02, 0.1],
    catchDifficulty: 2, timingBarSpeed: 150, timingBarGreenZone: 0.6, timingBarMoving: false,
    value: 8, spriteKey: 'fish-loach', spotIds: ['stream'],
    stages: 1, preferredWeather: ['cloudy', 'rainy']
  }),
  createFish({
    id: 'shrimp', name: '溪虾', description: '透明的小虾，在清澈的溪水中悠哉游弋',
    rarity: 'common', sizeRange: [2, 5], weightRange: [0.005, 0.02],
    catchDifficulty: 1, timingBarSpeed: 110, timingBarGreenZone: 0.7, timingBarMoving: false,
    value: 3, spriteKey: 'fish-shrimp', spotIds: ['stream'],
    stages: 1, preferredWeather: ['sunny', 'cloudy', 'rainy']
  }),
  createFish({
    id: 'goldfish', name: '野生金鱼', description: '意外出现在溪流中的金色小鱼，据说会带来好运',
    rarity: 'uncommon', sizeRange: [5, 12], weightRange: [0.02, 0.08],
    catchDifficulty: 3, timingBarSpeed: 170, timingBarGreenZone: 0.5, timingBarMoving: false,
    value: 20, spriteKey: 'fish-goldfish', spotIds: ['stream'],
    stages: 1, preferredWeather: ['sunny']
  }),
  createFish({
    id: 'gudgeon', name: '棒花鱼', description: '喜欢在石子间觅食的底栖小鱼',
    rarity: 'uncommon', sizeRange: [6, 14], weightRange: [0.03, 0.08],
    catchDifficulty: 2, timingBarSpeed: 160, timingBarGreenZone: 0.52, timingBarMoving: false,
    value: 12, spriteKey: 'fish-gudgeon', spotIds: ['stream'],
    stages: 1, preferredWeather: ['cloudy']
  }),
  createFish({
    id: 'bitterling', name: '彩石鲋', description: '雄鱼在繁殖季会呈现出虹彩般的绚丽色泽',
    rarity: 'rare', sizeRange: [4, 9], weightRange: [0.01, 0.04],
    catchDifficulty: 5, timingBarSpeed: 210, timingBarGreenZone: 0.35, timingBarMoving: false,
    value: 50, spriteKey: 'fish-bitterling', spotIds: ['stream'],
    stages: 2, preferredWeather: ['rainy']
  }),
  createFish({
    id: 'crayfish', name: '小龙虾', description: '挥舞着大钳子的溪流霸主，脾气不太好',
    rarity: 'rare', sizeRange: [8, 15], weightRange: [0.03, 0.1],
    catchDifficulty: 4, timingBarSpeed: 200, timingBarGreenZone: 0.38, timingBarMoving: false,
    value: 35, spriteKey: 'fish-crayfish', spotIds: ['stream'],
    stages: 2, preferredWeather: ['rainy', 'cloudy']
  }),
  createFish({
    id: 'carp', name: '鲤鱼', description: '体型健壮的湖中常客，力气不小',
    rarity: 'common', sizeRange: [20, 50], weightRange: [0.5, 3],
    catchDifficulty: 2, timingBarSpeed: 140, timingBarGreenZone: 0.62, timingBarMoving: false,
    value: 10, spriteKey: 'fish-carp', spotIds: ['lake'],
    stages: 1, preferredWeather: ['sunny', 'cloudy']
  }),
  createFish({
    id: 'catfish', name: '鲶鱼', description: '长着长长胡须的夜行猎手',
    rarity: 'common', sizeRange: [25, 60], weightRange: [0.8, 5],
    catchDifficulty: 3, timingBarSpeed: 150, timingBarGreenZone: 0.58, timingBarMoving: false,
    value: 15, spriteKey: 'fish-catfish', spotIds: ['lake'],
    stages: 1, preferredWeather: ['cloudy', 'rainy']
  }),
  createFish({
    id: 'perch', name: '鲈鱼', description: '条纹分明的中型捕食者',
    rarity: 'common', sizeRange: [15, 35], weightRange: [0.3, 1.5],
    catchDifficulty: 2, timingBarSpeed: 145, timingBarGreenZone: 0.6, timingBarMoving: false,
    value: 12, spriteKey: 'fish-perch', spotIds: ['lake'],
    stages: 1, preferredWeather: ['sunny', 'cloudy']
  }),
  createFish({
    id: 'turtle', name: '湖龟', description: '慢悠悠在湖中游荡的老寿星',
    rarity: 'uncommon', sizeRange: [15, 30], weightRange: [0.5, 3],
    catchDifficulty: 4, timingBarSpeed: 100, timingBarGreenZone: 0.45, timingBarMoving: false,
    value: 30, spriteKey: 'fish-turtle', spotIds: ['lake'],
    stages: 2, preferredWeather: ['sunny']
  }),
  createFish({
    id: 'bass', name: '黑鲈', description: '凶猛的淡水掠食者，钓客的最爱',
    rarity: 'uncommon', sizeRange: [20, 45], weightRange: [0.5, 3],
    catchDifficulty: 4, timingBarSpeed: 180, timingBarGreenZone: 0.48, timingBarMoving: false,
    value: 25, spriteKey: 'fish-bass', spotIds: ['lake'],
    stages: 2, preferredWeather: ['cloudy']
  }),
  createFish({
    id: 'bluegill', name: '蓝鳃太阳鱼', description: '鳃部带着耀眼蓝色光泽的美丽鱼种',
    rarity: 'uncommon', sizeRange: [10, 22], weightRange: [0.1, 0.6],
    catchDifficulty: 3, timingBarSpeed: 165, timingBarGreenZone: 0.5, timingBarMoving: false,
    value: 18, spriteKey: 'fish-bluegill', spotIds: ['lake'],
    stages: 1, preferredWeather: ['sunny']
  }),
  createFish({
    id: 'pike', name: '狗鱼', description: '水中的伏击大师，拥有令人畏惧的牙齿',
    rarity: 'rare', sizeRange: [40, 80], weightRange: [2, 8],
    catchDifficulty: 6, timingBarSpeed: 220, timingBarGreenZone: 0.32, timingBarMoving: false,
    value: 60, spriteKey: 'fish-pike', spotIds: ['lake'],
    stages: 2, preferredWeather: ['rainy', 'cloudy']
  }),
  createFish({
    id: 'lotus-koi', name: '荷塘锦鲤', description: '在荷叶间穿梭的华贵锦鲤，据说能实现愿望',
    rarity: 'epic', sizeRange: [30, 55], weightRange: [1, 4],
    catchDifficulty: 7, timingBarSpeed: 250, timingBarGreenZone: 0.25, timingBarMoving: true,
    value: 120, spriteKey: 'fish-lotus-koi', spotIds: ['lake'],
    stages: 3, preferredWeather: ['sunny']
  }),
  createFish({
    id: 'salmon', name: '三文鱼', description: '逆流而上的勇者，肌肉发达力量惊人',
    rarity: 'common', sizeRange: [30, 70], weightRange: [1, 6],
    catchDifficulty: 4, timingBarSpeed: 170, timingBarGreenZone: 0.55, timingBarMoving: false,
    value: 20, spriteKey: 'fish-salmon', spotIds: ['river'],
    stages: 2, preferredWeather: ['cloudy', 'rainy']
  }),
  createFish({
    id: 'trout', name: '虹鳟', description: '身侧有着彩虹般色带的优雅游泳健将',
    rarity: 'common', sizeRange: [20, 50], weightRange: [0.5, 3],
    catchDifficulty: 3, timingBarSpeed: 165, timingBarGreenZone: 0.58, timingBarMoving: false,
    value: 18, spriteKey: 'fish-trout', spotIds: ['river'],
    stages: 1, preferredWeather: ['sunny', 'cloudy']
  }),
  createFish({
    id: 'sturgeon', name: '鲟鱼', description: '远古时期便存在的活化石，体型巨大',
    rarity: 'rare', sizeRange: [60, 150], weightRange: [5, 30],
    catchDifficulty: 7, timingBarSpeed: 200, timingBarGreenZone: 0.3, timingBarMoving: false,
    value: 80, spriteKey: 'fish-sturgeon', spotIds: ['river'],
    stages: 3, preferredWeather: ['rainy']
  }),
  createFish({
    id: 'eel', name: '河鳗', description: '蛇形的神秘鱼类，力气出奇地大',
    rarity: 'uncommon', sizeRange: [30, 80], weightRange: [0.5, 3],
    catchDifficulty: 5, timingBarSpeed: 190, timingBarGreenZone: 0.45, timingBarMoving: false,
    value: 35, spriteKey: 'fish-eel', spotIds: ['river'],
    stages: 2, preferredWeather: ['rainy', 'cloudy']
  }),
  createFish({
    id: 'barbel', name: '巴波鱼', description: '嘴边长着触须的河底觅食者',
    rarity: 'common', sizeRange: [25, 55], weightRange: [0.8, 4],
    catchDifficulty: 3, timingBarSpeed: 155, timingBarGreenZone: 0.55, timingBarMoving: false,
    value: 15, spriteKey: 'fish-barbel', spotIds: ['river'],
    stages: 1, preferredWeather: ['cloudy']
  }),
  createFish({
    id: 'chub', name: '溪哥', description: '适应力极强的杂食性河鱼',
    rarity: 'common', sizeRange: [15, 40], weightRange: [0.3, 2],
    catchDifficulty: 2, timingBarSpeed: 140, timingBarGreenZone: 0.6, timingBarMoving: false,
    value: 10, spriteKey: 'fish-chub', spotIds: ['river'],
    stages: 1, preferredWeather: ['sunny', 'cloudy']
  }),
  createFish({
    id: 'grayling', name: '茴鱼', description: '背鳍如旗帜般高展的冷水鱼',
    rarity: 'uncommon', sizeRange: [20, 45], weightRange: [0.3, 2],
    catchDifficulty: 5, timingBarSpeed: 185, timingBarGreenZone: 0.48, timingBarMoving: false,
    value: 28, spriteKey: 'fish-grayling', spotIds: ['river'],
    stages: 2, preferredWeather: ['cloudy', 'rainy']
  }),
  createFish({
    id: 'golden-trout', name: '金鳟', description: '全身金光闪耀的稀有鳟鱼，仅在最清澈的水域出没',
    rarity: 'epic', sizeRange: [25, 50], weightRange: [0.5, 3],
    catchDifficulty: 8, timingBarSpeed: 260, timingBarGreenZone: 0.22, timingBarMoving: true,
    value: 150, spriteKey: 'fish-golden-trout', spotIds: ['river'],
    stages: 3, preferredWeather: ['sunny']
  }),
  createFish({
    id: 'sea-bass', name: '海鲈', description: '海岸线上最常见的大型鱼，战斗力十足',
    rarity: 'common', sizeRange: [30, 70], weightRange: [1, 8],
    catchDifficulty: 4, timingBarSpeed: 175, timingBarGreenZone: 0.52, timingBarMoving: false,
    value: 22, spriteKey: 'fish-sea-bass', spotIds: ['coast'],
    stages: 2, preferredWeather: ['cloudy', 'rainy']
  }),
  createFish({
    id: 'flounder', name: '比目鱼', description: '扁平的海底隐者，两只眼睛长在同一侧',
    rarity: 'common', sizeRange: [20, 50], weightRange: [0.5, 3],
    catchDifficulty: 3, timingBarSpeed: 150, timingBarGreenZone: 0.55, timingBarMoving: false,
    value: 18, spriteKey: 'fish-flounder', spotIds: ['coast'],
    stages: 1, preferredWeather: ['sunny', 'cloudy']
  }),
  createFish({
    id: 'mackerel', name: '鲭鱼', description: '成群巡游的快速鱼种，银蓝条纹极为漂亮',
    rarity: 'common', sizeRange: [20, 40], weightRange: [0.3, 1.5],
    catchDifficulty: 3, timingBarSpeed: 185, timingBarGreenZone: 0.55, timingBarMoving: false,
    value: 15, spriteKey: 'fish-mackerel', spotIds: ['coast'],
    stages: 1, preferredWeather: ['sunny', 'cloudy']
  }),
  createFish({
    id: 'pufferfish', name: '河豚', description: '受惊时会膨胀成球的可爱家伙，但千万别吃',
    rarity: 'uncommon', sizeRange: [10, 25], weightRange: [0.2, 1],
    catchDifficulty: 5, timingBarSpeed: 200, timingBarGreenZone: 0.45, timingBarMoving: false,
    value: 40, spriteKey: 'fish-pufferfish', spotIds: ['coast'],
    stages: 2, preferredWeather: ['sunny']
  }),
  createFish({
    id: 'octopus', name: '章鱼', description: '八条腕足的智慧生物，极其聪明的逃脱大师',
    rarity: 'uncommon', sizeRange: [20, 60], weightRange: [1, 5],
    catchDifficulty: 6, timingBarSpeed: 210, timingBarGreenZone: 0.42, timingBarMoving: false,
    value: 45, spriteKey: 'fish-octopus', spotIds: ['coast'],
    stages: 2, preferredWeather: ['rainy', 'cloudy']
  }),
  createFish({
    id: 'sea-bream', name: '真鲷', description: '吉祥的红色海鱼，肉质鲜美',
    rarity: 'uncommon', sizeRange: [25, 50], weightRange: [0.8, 4],
    catchDifficulty: 4, timingBarSpeed: 180, timingBarGreenZone: 0.48, timingBarMoving: false,
    value: 35, spriteKey: 'fish-sea-bream', spotIds: ['coast'],
    stages: 2, preferredWeather: ['sunny', 'cloudy']
  }),
  createFish({
    id: 'swordfish', name: '旗鱼', description: '海洋中速度最快的鱼之一，长长的吻部如剑锋',
    rarity: 'rare', sizeRange: [80, 200], weightRange: [10, 50],
    catchDifficulty: 8, timingBarSpeed: 250, timingBarGreenZone: 0.28, timingBarMoving: false,
    value: 100, spriteKey: 'fish-swordfish', spotIds: ['coast'],
    stages: 3, preferredWeather: ['sunny']
  }),
  createFish({
    id: 'manta-ray', name: '蝠鲼', description: '张开翼展如毯的优雅海洋精灵',
    rarity: 'epic', sizeRange: [100, 300], weightRange: [15, 80],
    catchDifficulty: 9, timingBarSpeed: 270, timingBarGreenZone: 0.2, timingBarMoving: true,
    value: 200, spriteKey: 'fish-manta-ray', spotIds: ['coast'],
    stages: 3, preferredWeather: ['rainy']
  }),
  createFish({
    id: 'anglerfish', name: '鮟鱇鱼', description: '头顶发光诱饵的深海猎手，样貌虽丑但独具魅力',
    rarity: 'common', sizeRange: [15, 40], weightRange: [0.5, 3],
    catchDifficulty: 5, timingBarSpeed: 185, timingBarGreenZone: 0.5, timingBarMoving: false,
    value: 28, spriteKey: 'fish-anglerfish', spotIds: ['deep-sea'],
    stages: 2, preferredWeather: ['cloudy', 'rainy']
  }),
  createFish({
    id: 'jellyfish', name: '水母', description: '透明而美丽的浮游生灵，触手泛着微光',
    rarity: 'common', sizeRange: [10, 50], weightRange: [0.1, 2],
    catchDifficulty: 4, timingBarSpeed: 130, timingBarGreenZone: 0.55, timingBarMoving: false,
    value: 20, spriteKey: 'fish-jellyfish', spotIds: ['deep-sea'],
    stages: 1, preferredWeather: ['rainy', 'cloudy']
  }),
  createFish({
    id: 'lanternfish', name: '灯笼鱼', description: '腹部排列着发光器官的深海小精灵',
    rarity: 'common', sizeRange: [5, 12], weightRange: [0.02, 0.08],
    catchDifficulty: 4, timingBarSpeed: 175, timingBarGreenZone: 0.52, timingBarMoving: false,
    value: 25, spriteKey: 'fish-lanternfish', spotIds: ['deep-sea'],
    stages: 1, preferredWeather: ['cloudy']
  }),
  createFish({
    id: 'giant-squid', name: '大王乌贼', description: '深海传说中的巨兽，巨大的眼睛能在黑暗中洞察一切',
    rarity: 'rare', sizeRange: [200, 500], weightRange: [50, 200],
    catchDifficulty: 8, timingBarSpeed: 240, timingBarGreenZone: 0.3, timingBarMoving: false,
    value: 120, spriteKey: 'fish-giant-squid', spotIds: ['deep-sea'],
    stages: 3, preferredWeather: ['rainy']
  }),
  createFish({
    id: 'viperfish', name: '蝰鱼', description: '拥有恐怖獠牙的深海捕食者',
    rarity: 'uncommon', sizeRange: [15, 35], weightRange: [0.3, 1.5],
    catchDifficulty: 6, timingBarSpeed: 210, timingBarGreenZone: 0.42, timingBarMoving: false,
    value: 45, spriteKey: 'fish-viperfish', spotIds: ['deep-sea'],
    stages: 2, preferredWeather: ['cloudy', 'rainy']
  }),
  createFish({
    id: 'nautilus', name: '鹦鹉螺', description: '亿万年未曾改变的活化石，螺旋壳如同精密的数学艺术',
    rarity: 'uncommon', sizeRange: [12, 25], weightRange: [0.3, 1],
    catchDifficulty: 6, timingBarSpeed: 195, timingBarGreenZone: 0.44, timingBarMoving: false,
    value: 55, spriteKey: 'fish-nautilus', spotIds: ['deep-sea'],
    stages: 2, preferredWeather: ['rainy']
  }),
  createFish({
    id: 'coelacanth', name: '腔棘鱼', description: '曾被认为已灭绝的远古之鱼，每一次出现都是奇迹',
    rarity: 'legendary', sizeRange: [80, 180], weightRange: [20, 90],
    catchDifficulty: 10, timingBarSpeed: 300, timingBarGreenZone: 0.14, timingBarMoving: true,
    value: 500, spriteKey: 'fish-coelacanth', spotIds: ['deep-sea'],
    stages: 4, preferredWeather: ['snowy']
  }),
  createFish({
    id: 'dragon-fish', name: '龙鱼', description: '深海中最神秘的存在，浑身散发着幽蓝龙焰般的光芒',
    rarity: 'legendary', sizeRange: [40, 100], weightRange: [5, 25],
    catchDifficulty: 10, timingBarSpeed: 320, timingBarGreenZone: 0.12, timingBarMoving: true,
    value: 800, spriteKey: 'fish-dragon-fish', spotIds: ['deep-sea'],
    stages: 4, preferredWeather: ['snowy']
  })
]

export function getFishById(id: string): Fish | undefined {
  return FISH_DATA.find(f => f.id === id)
}

export function getFishBySpot(spotId: string): Fish[] {
  return FISH_DATA.filter(f => f.spotIds.includes(spotId))
}

export function getFishByRarity(rarity: string): Fish[] {
  return FISH_DATA.filter(f => f.rarity === rarity)
}
