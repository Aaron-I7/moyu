
// 计时器状态
export type TimerMode = 'work' | 'short-break' | 'long-break'
export type TimerStatus = 'idle' | 'running' | 'paused'

// 计时器设置
export interface PomodoroSettings {
  workDuration: number       // 分钟
  shortBreakDuration: number // 分钟
  longBreakDuration: number  // 分钟
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  longBreakInterval: number
  customTaskName: string
  allowGlobalPlayback: boolean
}


// 统计数据
export interface PomodoroStats {
  todayPomodoros: number
  totalMinutes: number
  lastUpdate: string // YYYY-MM-DD
  history: PomodoroHistoryItem[]
}

export interface PomodoroHistoryItem {
  id: string
  date: string // ISO string
  duration: number // minutes
  taskName: string
  mode: TimerMode
}

// 音频资源
export type SoundCategory = 'animals' | 'nature' | 'noise' | 'places' | 'rain' | 'things' | 'transport' | 'urban'

export interface SoundItem {
  id: string
  label: string // i18n key or raw text
  src: string
  volume: number // 0-1
  active: boolean
  icon: string // iconify string
  category: SoundCategory
}

// 用户保存的混音组合
export interface SoundMix {
  id: string
  name: string
  sounds: { id: string; volume: number }[]
}

// 预设音效
export const PRESET_SOUNDS: SoundItem[] = [
  // Animals
  { id: 'beehive', label: 'Beehive', src: '/sounds/animals/beehive.ogg', volume: 0.5, active: false, icon: 'mdi:beehive-outline', category: 'animals' },
  { id: 'birds', label: 'Birds', src: '/sounds/animals/birds.ogg', volume: 0.5, active: false, icon: 'mdi:bird', category: 'animals' },
  { id: 'cat-purring', label: 'Cat Purring', src: '/sounds/animals/cat-purring.ogg', volume: 0.5, active: false, icon: 'mdi:cat', category: 'animals' },
  { id: 'chickens', label: 'Chickens', src: '/sounds/animals/chickens.ogg', volume: 0.5, active: false, icon: 'mdi:food-drumstick', category: 'animals' }, // Approximate
  { id: 'cows', label: 'Cows', src: '/sounds/animals/cows.ogg', volume: 0.5, active: false, icon: 'mdi:cow', category: 'animals' },
  { id: 'crickets', label: 'Crickets', src: '/sounds/animals/crickets.ogg', volume: 0.5, active: false, icon: 'mdi:bug', category: 'animals' },
  { id: 'crows', label: 'Crows', src: '/sounds/animals/crows.ogg', volume: 0.5, active: false, icon: 'mdi:bird', category: 'animals' },
  { id: 'dog-barking', label: 'Dog Barking', src: '/sounds/animals/dog-barking.ogg', volume: 0.5, active: false, icon: 'mdi:dog', category: 'animals' },
  { id: 'frog', label: 'Frog', src: '/sounds/animals/frog.ogg', volume: 0.5, active: false, icon: 'mdi:frog', category: 'animals' },
  { id: 'horse-gallop', label: 'Horse Gallop', src: '/sounds/animals/horse-gallop.ogg', volume: 0.5, active: false, icon: 'mdi:horse', category: 'animals' },
  { id: 'owl', label: 'Owl', src: '/sounds/animals/owl.ogg', volume: 0.5, active: false, icon: 'mdi:owl', category: 'animals' },
  { id: 'seagulls', label: 'Seagulls', src: '/sounds/animals/seagulls.ogg', volume: 0.5, active: false, icon: 'mdi:bird', category: 'animals' },
  { id: 'sheep', label: 'Sheep', src: '/sounds/animals/sheep.ogg', volume: 0.5, active: false, icon: 'mdi:sheep', category: 'animals' },
  { id: 'whale', label: 'Whale', src: '/sounds/animals/whale.ogg', volume: 0.5, active: false, icon: 'mdi:dolphin', category: 'animals' }, // Approximate
  { id: 'wolf', label: 'Wolf', src: '/sounds/animals/wolf.ogg', volume: 0.5, active: false, icon: 'mdi:dog-side', category: 'animals' },
  { id: 'woodpecker', label: 'Woodpecker', src: '/sounds/animals/woodpecker.ogg', volume: 0.5, active: false, icon: 'mdi:bird', category: 'animals' },

  // Nature
  { id: 'campfire', label: 'Campfire', src: '/sounds/nature/campfire.ogg', volume: 0.5, active: false, icon: 'mdi:campfire', category: 'nature' },
  { id: 'droplets', label: 'Droplets', src: '/sounds/nature/droplets.ogg', volume: 0.5, active: false, icon: 'mdi:water', category: 'nature' },
  { id: 'field', label: 'Field', src: '/sounds/nature/field.ogg', volume: 0.5, active: false, icon: 'mdi:grass', category: 'nature' },
  { id: 'howling-wind', label: 'Howling Wind', src: '/sounds/nature/howling-wind.ogg', volume: 0.5, active: false, icon: 'mdi:weather-windy', category: 'nature' },
  { id: 'jungle', label: 'Jungle', src: '/sounds/nature/jungle.ogg', volume: 0.5, active: false, icon: 'mdi:forest', category: 'nature' },
  { id: 'lake', label: 'Lake', src: '/sounds/nature/lake.ogg', volume: 0.5, active: false, icon: 'mdi:water', category: 'nature' },
  { id: 'river', label: 'River', src: '/sounds/nature/river.ogg', volume: 0.5, active: false, icon: 'mdi:waves', category: 'nature' },
  { id: 'walk-in-snow', label: 'Walk in Snow', src: '/sounds/nature/walk-in-snow.ogg', volume: 0.5, active: false, icon: 'mdi:snowflake', category: 'nature' },
  { id: 'walk-on-gravel', label: 'Walk on Gravel', src: '/sounds/nature/walk-on-gravel.ogg', volume: 0.5, active: false, icon: 'mdi:shoe-print', category: 'nature' },
  { id: 'walk-on-leaves', label: 'Walk on Leaves', src: '/sounds/nature/walk-on-leaves.ogg', volume: 0.5, active: false, icon: 'mdi:leaf', category: 'nature' },
  { id: 'waterfall', label: 'Waterfall', src: '/sounds/nature/waterfall.ogg', volume: 0.5, active: false, icon: 'mdi:waterfall', category: 'nature' },
  { id: 'waves', label: 'Waves', src: '/sounds/nature/waves.ogg', volume: 0.5, active: false, icon: 'mdi:waves', category: 'nature' },
  { id: 'wind-in-trees', label: 'Wind in Trees', src: '/sounds/nature/wind-in-trees.ogg', volume: 0.5, active: false, icon: 'mdi:pine-tree', category: 'nature' },
  { id: 'wind', label: 'Wind', src: '/sounds/nature/wind.ogg', volume: 0.5, active: false, icon: 'mdi:weather-windy', category: 'nature' },

  // Noise
  { id: 'brown-noise', label: 'Brown Noise', src: '/sounds/noise/brown-noise.ogg', volume: 0.5, active: false, icon: 'mdi:blur', category: 'noise' },
  { id: 'eating-chips', label: 'Eating Chips', src: '/sounds/noise/eating-chips.ogg', volume: 0.5, active: false, icon: 'mdi:food-variant', category: 'noise' },
  { id: 'piano', label: 'Piano', src: '/sounds/noise/piano.ogg', volume: 0.5, active: false, icon: 'mdi:piano', category: 'noise' },
  { id: 'pink-noise', label: 'Pink Noise', src: '/sounds/noise/pink-noise.ogg', volume: 0.5, active: false, icon: 'mdi:blur', category: 'noise' },
  { id: 'study', label: 'Study', src: '/sounds/noise/study.ogg', volume: 0.5, active: false, icon: 'mdi:school', category: 'noise' },
  { id: 'white-noise', label: 'White Noise', src: '/sounds/noise/white-noise.ogg', volume: 0.5, active: false, icon: 'mdi:blur', category: 'noise' },

  // Places
  { id: 'airport', label: 'Airport', src: '/sounds/places/airport.ogg', volume: 0.5, active: false, icon: 'mdi:airplane', category: 'places' },
  { id: 'cafe', label: 'Cafe', src: '/sounds/places/cafe.ogg', volume: 0.5, active: false, icon: 'mdi:coffee', category: 'places' },
  { id: 'carousel', label: 'Carousel', src: '/sounds/places/carousel.ogg', volume: 0.5, active: false, icon: 'mdi:ferris-wheel', category: 'places' }, // Approximate
  { id: 'church', label: 'Church', src: '/sounds/places/church.ogg', volume: 0.5, active: false, icon: 'mdi:church', category: 'places' },
  { id: 'construction-site', label: 'Construction', src: '/sounds/places/construction-site.ogg', volume: 0.5, active: false, icon: 'mdi:account-hard-hat', category: 'places' },
  { id: 'crowded-bar', label: 'Crowded Bar', src: '/sounds/places/crowded-bar.ogg', volume: 0.5, active: false, icon: 'mdi:glass-mug-variant', category: 'places' },
  { id: 'kitchen', label: 'Kitchen', src: '/sounds/places/kitchen.ogg', volume: 0.5, active: false, icon: 'mdi:chef-hat', category: 'places' },
  { id: 'laboratory', label: 'Laboratory', src: '/sounds/places/laboratory.ogg', volume: 0.5, active: false, icon: 'mdi:flask', category: 'places' },
  { id: 'laundry-room', label: 'Laundry Room', src: '/sounds/places/laundry-room.ogg', volume: 0.5, active: false, icon: 'mdi:washing-machine', category: 'places' },
  { id: 'library', label: 'Library', src: '/sounds/places/library.ogg', volume: 0.5, active: false, icon: 'mdi:bookshelf', category: 'places' },
  { id: 'night-village', label: 'Night Village', src: '/sounds/places/night-village.ogg', volume: 0.5, active: false, icon: 'mdi:home-city', category: 'places' },
  { id: 'office', label: 'Office', src: '/sounds/places/office.ogg', volume: 0.5, active: false, icon: 'mdi:desk', category: 'places' },
  { id: 'restaurant', label: 'Restaurant', src: '/sounds/places/restaurant.ogg', volume: 0.5, active: false, icon: 'mdi:silverware', category: 'places' },
  { id: 'subway-station', label: 'Subway Station', src: '/sounds/places/subway-station.ogg', volume: 0.5, active: false, icon: 'mdi:subway', category: 'places' },
  { id: 'supermarket', label: 'Supermarket', src: '/sounds/places/supermarket.ogg', volume: 0.5, active: false, icon: 'mdi:cart', category: 'places' },
  { id: 'temple', label: 'Temple', src: '/sounds/places/temple.ogg', volume: 0.5, active: false, icon: 'mdi:temple-buddhist', category: 'places' }, // Approximate
  { id: 'underwater', label: 'Underwater', src: '/sounds/places/underwater.ogg', volume: 0.5, active: false, icon: 'mdi:diving-scuba', category: 'places' },

  // Rain
  { id: 'heavy-rain-on-glass', label: 'Heavy Rain on Glass', src: '/sounds/rain/heavy-rain-on-glass.ogg', volume: 0.5, active: false, icon: 'mdi:weather-pouring', category: 'rain' },
  { id: 'heavy_rain', label: 'Heavy Rain', src: '/sounds/rain/heavy_rain.ogg', volume: 0.5, active: false, icon: 'mdi:weather-pouring', category: 'rain' },
  { id: 'light-rain', label: 'Light Rain', src: '/sounds/rain/light-rain.ogg', volume: 0.5, active: false, icon: 'mdi:weather-rainy', category: 'rain' },
  { id: 'rain-on-car-roof', label: 'Rain on Car Roof', src: '/sounds/rain/rain-on-car-roof.ogg', volume: 0.5, active: false, icon: 'mdi:car', category: 'rain' },
  { id: 'rain-on-eaves', label: 'Rain on Eaves', src: '/sounds/rain/rain-on-eaves.ogg', volume: 0.5, active: false, icon: 'mdi:home-roof', category: 'rain' },
  { id: 'rain-on-empty-street', label: 'Rain on Street', src: '/sounds/rain/rain-on-empty-street.ogg', volume: 0.5, active: false, icon: 'mdi:road', category: 'rain' },
  { id: 'rain-on-leaves', label: 'Rain on Leaves', src: '/sounds/rain/rain-on-leaves.ogg', volume: 0.5, active: false, icon: 'mdi:leaf', category: 'rain' },
  { id: 'rain-on-raincoat', label: 'Rain on Raincoat', src: '/sounds/rain/rain-on-raincoat.ogg', volume: 0.5, active: false, icon: 'mdi:tshirt-crew', category: 'rain' },
  { id: 'rain-on-tent', label: 'Rain on Tent', src: '/sounds/rain/rain-on-tent.ogg', volume: 0.5, active: false, icon: 'mdi:tent', category: 'rain' },
  { id: 'rain-on-umbrella', label: 'Rain on Umbrella', src: '/sounds/rain/rain-on-umbrella.ogg', volume: 0.5, active: false, icon: 'mdi:umbrella', category: 'rain' },
  { id: 'rain-on-windowsill', label: 'Rain on Windowsill', src: '/sounds/rain/rain-on-windowsill.ogg', volume: 0.5, active: false, icon: 'mdi:window-closed', category: 'rain' },
  { id: 'rain-on-wooden-house', label: 'Rain on Wooden House', src: '/sounds/rain/rain-on-wooden-house.ogg', volume: 0.5, active: false, icon: 'mdi:home', category: 'rain' },
  { id: 'rain-while-driving', label: 'Rain While Driving', src: '/sounds/rain/rain-while-driving.ogg', volume: 0.5, active: false, icon: 'mdi:steering', category: 'rain' },
  { id: 'thunderstorm', label: 'Thunderstorm', src: '/sounds/rain/thunderstorm.ogg', volume: 0.5, active: false, icon: 'mdi:weather-lightning', category: 'rain' },

  // Things
  { id: 'boiling-water', label: 'Boiling Water', src: '/sounds/things/boiling-water.ogg', volume: 0.5, active: false, icon: 'mdi:pot-steam', category: 'things' },
  { id: 'bubbles', label: 'Bubbles', src: '/sounds/things/bubbles.ogg', volume: 0.5, active: false, icon: 'mdi:chart-bubble', category: 'things' },
  { id: 'ceiling-fan', label: 'Ceiling Fan', src: '/sounds/things/ceiling-fan.ogg', volume: 0.5, active: false, icon: 'mdi:fan', category: 'things' },
  { id: 'clock', label: 'Clock', src: '/sounds/things/clock.ogg', volume: 0.5, active: false, icon: 'mdi:clock-outline', category: 'things' },
  { id: 'dryer', label: 'Dryer', src: '/sounds/things/dryer.ogg', volume: 0.5, active: false, icon: 'mdi:tumble-dryer', category: 'things' },
  { id: 'ear-cleaning-1', label: 'Ear Cleaning 1', src: '/sounds/things/ear-cleaning-1.ogg', volume: 0.5, active: false, icon: 'mdi:ear-hearing', category: 'things' },
  { id: 'ear-cleaning-2', label: 'Ear Cleaning 2', src: '/sounds/things/ear-cleaning-2.ogg', volume: 0.5, active: false, icon: 'mdi:ear-hearing', category: 'things' },
  { id: 'guitar', label: 'Guitar', src: '/sounds/things/guitar.ogg', volume: 0.5, active: false, icon: 'mdi:guitar-acoustic', category: 'things' },
  { id: 'guzheng', label: 'Guzheng', src: '/sounds/things/guzheng.ogg', volume: 0.5, active: false, icon: 'mdi:music-note', category: 'things' },
  { id: 'keyboard-sound', label: 'Keyboard', src: '/sounds/things/keyboard.ogg', volume: 0.5, active: false, icon: 'mdi:keyboard', category: 'things' }, // Changed id to avoid conflict with noise/keyboard if any
  { id: 'light-piano', label: 'Light Piano', src: '/sounds/things/light-piano.ogg', volume: 0.5, active: false, icon: 'mdi:piano', category: 'things' },
  { id: 'morse-code', label: 'Morse Code', src: '/sounds/things/morse-code.ogg', volume: 0.5, active: false, icon: 'mdi:radio-tower', category: 'things' },
  { id: 'paper', label: 'Paper', src: '/sounds/things/paper.ogg', volume: 0.5, active: false, icon: 'mdi:paper-roll', category: 'things' },
  { id: 'singing-bowl', label: 'Singing Bowl', src: '/sounds/things/singing-bowl.ogg', volume: 0.5, active: false, icon: 'mdi:bowl', category: 'things' },
  { id: 'slide-projector', label: 'Slide Projector', src: '/sounds/things/slide-projector.ogg', volume: 0.5, active: false, icon: 'mdi:projector', category: 'things' },
  { id: 'tuning-radio', label: 'Tuning Radio', src: '/sounds/things/tuning-radio.ogg', volume: 0.5, active: false, icon: 'mdi:radio', category: 'things' },
  { id: 'typewriter', label: 'Typewriter', src: '/sounds/things/typewriter.ogg', volume: 0.5, active: false, icon: 'mdi:typewriter', category: 'things' },
  { id: 'vinyl-effect', label: 'Vinyl', src: '/sounds/things/vinyl-effect.ogg', volume: 0.5, active: false, icon: 'mdi:disc', category: 'things' },
  { id: 'washing-machine', label: 'Washing Machine', src: '/sounds/things/washing-machine.ogg', volume: 0.5, active: false, icon: 'mdi:washing-machine', category: 'things' },
  { id: 'wind-chimes', label: 'Wind Chimes', src: '/sounds/things/wind-chimes.ogg', volume: 0.5, active: false, icon: 'mdi:bell-ring-outline', category: 'things' },
  { id: 'windshield-wipers', label: 'Wipers', src: '/sounds/things/windshield-wipers.ogg', volume: 0.5, active: false, icon: 'mdi:wiper', category: 'things' },

  // Transport
  { id: 'airplane', label: 'Airplane', src: '/sounds/transport/airplane.ogg', volume: 0.5, active: false, icon: 'mdi:airplane', category: 'transport' },
  { id: 'inside-a-train', label: 'Inside Train', src: '/sounds/transport/inside-a-train.ogg', volume: 0.5, active: false, icon: 'mdi:train', category: 'transport' },
  { id: 'rowing-boat', label: 'Rowing Boat', src: '/sounds/transport/rowing-boat.ogg', volume: 0.5, active: false, icon: 'mdi:rowing', category: 'transport' },
  { id: 'sailboat', label: 'Sailboat', src: '/sounds/transport/sailboat.ogg', volume: 0.5, active: false, icon: 'mdi:sail-boat', category: 'transport' },
  { id: 'submarine', label: 'Submarine', src: '/sounds/transport/submarine.ogg', volume: 0.5, active: false, icon: 'mdi:submarine', category: 'transport' },
  { id: 'train', label: 'Train', src: '/sounds/transport/train.ogg', volume: 0.5, active: false, icon: 'mdi:train-variant', category: 'transport' },

  // Urban
  { id: 'ambulance-siren', label: 'Ambulance', src: '/sounds/urban/ambulance-siren.ogg', volume: 0.5, active: false, icon: 'mdi:ambulance', category: 'urban' },
  { id: 'busy-street', label: 'Busy Street', src: '/sounds/urban/busy-street.ogg', volume: 0.5, active: false, icon: 'mdi:road-variant', category: 'urban' },
  { id: 'crowd', label: 'Crowd', src: '/sounds/urban/crowd.ogg', volume: 0.5, active: false, icon: 'mdi:account-group', category: 'urban' },
  { id: 'fireworks', label: 'Fireworks', src: '/sounds/urban/fireworks.ogg', volume: 0.5, active: false, icon: 'mdi:firework', category: 'urban' },
  { id: 'highway', label: 'Highway', src: '/sounds/urban/highway.ogg', volume: 0.5, active: false, icon: 'mdi:highway', category: 'urban' },
  { id: 'road', label: 'Road', src: '/sounds/urban/road.ogg', volume: 0.5, active: false, icon: 'mdi:road', category: 'urban' },
  { id: 'traffic', label: 'Traffic', src: '/sounds/urban/traffic.ogg', volume: 0.5, active: false, icon: 'mdi:traffic-light', category: 'urban' }
]

export const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  longBreakInterval: 4,
  customTaskName: '',
  allowGlobalPlayback: false
}
