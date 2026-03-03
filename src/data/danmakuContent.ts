export interface DanmakuItem {
  id: number
  content: string
  category: 'relax' | 'humor' | 'tip' | 'motivation'
  emoji?: string
}

export const DANMAKU_CONTENT: DanmakuItem[] = [
  {
    id: 1,
    content: '工作累了？试试 20-20-20 法则：每20分钟看20英尺外的物体20秒',
    category: 'tip',
    emoji: '👀'
  },
  {
    id: 2,
    content: '老板说"这个需求很简单"时，请保持微笑并深呼吸',
    category: 'humor',
    emoji: '😊'
  },
  {
    id: 3,
    content: '适当摸鱼可以提高创造力，这是有科学依据的！',
    category: 'relax',
    emoji: '💡'
  },
  {
    id: 4,
    content: '站起来活动一下，接杯水，让身体放松放松',
    category: 'tip',
    emoji: '🚶'
  },
  {
    id: 5,
    content: '今天的任务已完成 87%，你已经很棒了！',
    category: 'motivation',
    emoji: '⭐'
  },
  {
    id: 6,
    content: '程序员三大谎言：这个很简单、马上就好、我测试过了',
    category: 'humor',
    emoji: '😂'
  },
  {
    id: 7,
    content: '深呼吸，放慢节奏，效率反而会更高哦',
    category: 'relax',
    emoji: '🧘'
  },
  {
    id: 8,
    content: '记得眨眼！长时间盯着屏幕容易眼干眼涩',
    category: 'tip',
    emoji: '👁️'
  },
  {
    id: 9,
    content: '代码写不完没关系，身体最重要，记得按时吃饭',
    category: 'motivation',
    emoji: '🍚'
  },
  {
    id: 10,
    content: '世界上最遥远的距离是：我在改 bug，你在写新功能',
    category: 'humor',
    emoji: '🐛'
  },
  {
    id: 11,
    content: '午休时间到！趴一会儿，下午精神更好',
    category: 'relax',
    emoji: '😴'
  },
  {
    id: 12,
    content: '键盘敲击声也是一种音乐，只是听众只有你自己',
    category: 'humor',
    emoji: '🎹'
  },
  {
    id: 13,
    content: '遇到难题先放一放，灵感往往在放松时出现',
    category: 'tip',
    emoji: '✨'
  },
  {
    id: 14,
    content: '你已经连续工作 2 小时了，该休息一下啦！',
    category: 'motivation',
    emoji: '⏰'
  },
  {
    id: 15,
    content: '产品经理说"就改一个小功能"，程序员听了想打人',
    category: 'humor',
    emoji: '😤'
  },
  {
    id: 16,
    content: '窗外的风景也很美，偶尔抬头看看吧',
    category: 'relax',
    emoji: '🌳'
  },
  {
    id: 17,
    content: '喝水提醒：你的身体需要补充水分啦！',
    category: 'tip',
    emoji: '💧'
  },
  {
    id: 18,
    content: '不要和产品经理争论，他们有无限的需求弹药',
    category: 'humor',
    emoji: '🎯'
  },
  {
    id: 19,
    content: '每一个 bug 都是成长的机会，加油！',
    category: 'motivation',
    emoji: '💪'
  },
  {
    id: 20,
    content: '摸鱼不是偷懒，是为了更好地工作！',
    category: 'relax',
    emoji: '🐟'
  }
]

export function getRandomDanmaku(): DanmakuItem {
  const index = Math.floor(Math.random() * DANMAKU_CONTENT.length)
  return DANMAKU_CONTENT[index]!
}

export function getDanmakuByCategory(category: DanmakuItem['category']): DanmakuItem[] {
  return DANMAKU_CONTENT.filter(item => item.category === category)
}
