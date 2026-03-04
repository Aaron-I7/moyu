import type { PetType } from '../stores/pet'
import { i18n } from '@/core/i18n'

const catMessages: Record<string, string[]> = {
  idle: ['摸鱼中...', '老板不在~喵~', '带薪撸猫真香~', '今天天气不错~喵', '工作？什么工作？喵~', '铲屎官你来啦~', '摸鱼摸鱼~喵~'],
  happy: ['摸鱼好开心！喵~', '铲屎官最好了！♥', '带薪撸猫美滋滋！喵~', '嘻嘻~今天摸鱼了没？', '摸鱼使我快乐！喵~'],
  hungry: ['饿了...想吃小鱼干~喵', '肚子在叫了...该摸鱼吃饭了', '铲屎官，投喂！喵~', '咕噜咕噜...摸鱼饿了', '想吃小鱼干~喵~'],
  tired: ['摸鱼累了...喵~', '想睡觉...zzz', '摸了一上午鱼...困了', '让我休息一会儿...喵~', '打哈欠~摸鱼好累'],
  sleeping: ['zzz...梦中摸鱼...', '呼呼...喵~', '(做着摸鱼的美梦)', 'zzz...', '...mumble...'],
  playing: ['摸鱼玩耍！喵~', '带薪玩耍！喵喵~', '再来一次！摸鱼快乐！', '嗖嗖嗖！摸鱼真爽！', '太开心了！喵~'],
  eating: ['真好吃！喵~', '啊呜啊呜~摸鱼零食', '好香啊！喵~', '谢谢投喂！喵~', '还想吃~摸鱼口粮'],
  bathing: ['好舒服~喵~', '洗香香~准备继续摸鱼', '泡泡好多~喵', '我喜欢洗澡！喵~', '好清爽！继续摸鱼~'],
  special: ['喵~羽毛！摸鱼必备！', '追到了！喵喵~摸鱼神器', '好好玩！再来！喵~', '嘻嘻~逗猫棒！摸鱼快乐', '抓到了！喵~摸鱼成功'],
}

const dogMessages: Record<string, string[]> = {
  idle: ['摸鱼中...', '老板不在~汪~', '带薪遛狗真香~', '今天天气不错~汪', '工作？什么工作？汪~', '铲屎官你来啦~', '摸鱼摸鱼~汪~'],
  happy: ['摸鱼好开心！汪~', '铲屎官最好了！♥', '带薪遛狗美滋滋！汪~', '嘿嘿~今天摸鱼了没？', '摸鱼使我快乐！汪~'],
  hungry: ['饿了...想吃肉骨头~汪', '肚子在叫了...该摸鱼吃饭了', '铲屎官，投喂！汪~', '咕噜咕噜...摸鱼饿了', '想吃肉骨头~汪~'],
  tired: ['摸鱼累了...汪~', '想睡觉...zzz', '摸了一上午鱼...困了', '让我休息一会儿...汪~', '打哈欠~摸鱼好累'],
  sleeping: ['zzz...梦中摸鱼...', '呼呼...汪~', '(做着摸鱼的美梦)', 'zzz...', '...mumble...'],
  playing: ['摸鱼玩耍！汪~', '带薪玩耍！汪汪~', '再来一次！摸鱼快乐！', '嗖嗖嗖！摸鱼真爽！', '太开心了！汪~'],
  eating: ['真好吃！汪~', '啊呜啊呜~摸鱼零食', '好香啊！汪~', '谢谢投喂！汪~', '还想吃~摸鱼口粮'],
  bathing: ['好舒服~汪~', '洗香香~准备继续摸鱼', '泡泡好多~汪', '我喜欢洗澡！汪~', '好清爽！继续摸鱼~'],
  special: ['汪！散步！摸鱼必备！', '出去玩了！汪汪~摸鱼神器', '闻闻花香~汪！摸鱼快乐', '跑跑跳跳！汪~摸鱼成功', '铲屎官最好了！'],
}

const rabbitMessages: Record<string, string[]> = {
  idle: ['摸鱼中...', '老板不在~', '带薪撸兔真香~', '今天天气不错~', '工作？什么工作？', '铲屎官你来啦~', '摸鱼摸鱼~蹦蹦~'],
  happy: ['摸鱼好开心！', '铲屎官最好了！♥', '带薪撸兔美滋滋！蹦蹦~', '嘻嘻~今天摸鱼了没？', '摸鱼使我快乐！蹦~'],
  hungry: ['饿了...想吃胡萝卜~', '肚子在叫了...该摸鱼吃饭了', '铲屎官，投喂！', '咕噜咕噜...摸鱼饿了', '想吃胡萝卜~'],
  tired: ['摸鱼累了...', '想睡觉...zzz', '摸了一上午鱼...困了', '让我休息一会儿...', '打哈欠~摸鱼好累'],
  sleeping: ['zzz...梦中摸鱼...', '呼呼...', '(做着摸鱼的美梦)', 'zzz...', '...mumble...'],
  playing: ['摸鱼玩耍！', '带薪玩耍！蹦蹦~', '再来一次！摸鱼快乐！', '跳跳跳！摸鱼真爽！', '太开心了！蹦~'],
  eating: ['真好吃！', '啊呜啊呜~摸鱼零食', '好香啊！', '谢谢投喂！', '还想吃~摸鱼口粮'],
  bathing: ['好舒服~', '洗香香~准备继续摸鱼', '泡泡好多~', '我喜欢洗澡！', '好清爽！继续摸鱼~'],
  special: ['胡萝卜！蹦蹦~摸鱼必备！', '好吃好吃！摸鱼神器', '谢谢铲屎官！蹦~摸鱼快乐', '最喜欢胡萝卜了！摸鱼成功', '咔嚓咔嚓~摸鱼零食'],
}

const petMessages: Record<PetType, Record<string, string[]>> = {
  cat: catMessages,
  dog: dogMessages,
  rabbit: rabbitMessages,
}

const defaultMessages: Record<PetType, string[]> = {
  cat: ['...', '喵~', '铲屎官~'],
  dog: ['...', '汪~', '铲屎官~'],
  rabbit: ['...', '蹦蹦~', '铲屎官~'],
}

export function usePetMessages() {
  function getEnglishMessage(state: string, petType: PetType): string {
    const petNameMap: Record<PetType, string> = {
      cat: 'kitty',
      dog: 'pup',
      rabbit: 'bunny'
    }
    const petName = petNameMap[petType]
    const stateMap: Record<string, string[]> = {
      idle: [`Chilling with my ${petName} vibe.`, 'Quiet focus mode.', 'Tiny break, big smile.'],
      happy: ['I feel great!', 'This is a good moment.', 'Thank you for caring!'],
      hungry: ['I am getting hungry.', 'Snack time maybe?', 'Could I have a little treat?'],
      tired: ['I feel sleepy now.', 'Need a short rest.', 'Can we slow down a bit?'],
      sleeping: ['Zzz...', 'Dreaming softly.', 'Resting mode.'],
      playing: ['That was fun!', 'Play time is the best.', 'More fun, please!'],
      eating: ['Yummy!', 'That tastes good.', 'Thanks for the food!'],
      bathing: ['Fresh and clean!', 'Bath time feels nice.', 'So refreshing.'],
      special: ['That was special!', 'I love this activity.', 'Let us do it again.']
    }
    const list = stateMap[state] ?? stateMap.idle ?? ['...']
    return list[Math.floor(Math.random() * list.length)] || '...'
  }

  function getMessage(state: string, petType: PetType = 'cat'): string {
    if ((i18n.global.locale as any).value === 'en') {
      return getEnglishMessage(state, petType)
    }
    const messages = petMessages[petType]
    const list = messages[state]
    if (!list || list.length === 0) {
      const defaults = defaultMessages[petType]
      return defaults[Math.floor(Math.random() * defaults.length)]!
    }
    const message = list[Math.floor(Math.random() * list.length)]
    return message ?? defaultMessages[petType][0]!
  }

  return { getMessage }
}
