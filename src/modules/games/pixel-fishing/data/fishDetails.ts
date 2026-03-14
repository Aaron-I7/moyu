import type { Fish } from '../types'

function getImageUrl(fishId: string): string {
  return `/fish-images/${fishId}.webp`
}

export const FISH_DETAILS: Record<string, Partial<Fish>> = {
  'crucian': {
    imageUrl: getImageUrl('crucian'),
    baikeUrl: 'https://baike.baidu.com/item/%E9%B2%AB%E9%B1%BC',
    scientificName: 'Carassius auratus',
    habitat: '淡水湖泊、河流、池塘',
    diet: '杂食性：藻类、水草、小型无脊椎动物',
    funFact: '鲫鱼是最常见的淡水鱼之一，适应能力极强，几乎遍布全国各地的淡水水域。'
  },
  'minnow': {
    imageUrl: getImageUrl('minnow'),
    baikeUrl: 'https://baike.baidu.com/item/%E9%B2%A6%E9%B1%BC',
    scientificName: 'Phoxinus phoxinus',
    habitat: '清澈的溪流和河流',
    diet: '杂食性：藻类、昆虫幼虫、浮游生物',
    funFact: '鲦鱼体型虽小，但游动速度极快，常成群结队活动。'
  },
  'loach': {
    imageUrl: getImageUrl('loach'),
    baikeUrl: 'https://baike.baidu.com/item/%E6%B3%A5%E9%B3%85',
    scientificName: 'Misgurnus anguillicaudatus',
    habitat: '泥沙底质的静水或缓流水域',
    diet: '杂食性：底栖无脊椎动物、有机碎屑',
    funFact: '泥鳅可以用肠进行呼吸，在缺氧环境下能直接从空气中获取氧气。'
  },
  'shrimp': {
    imageUrl: getImageUrl('shrimp'),
    baikeUrl: 'https://baike.baidu.com/item/%E6%B2%B3%E8%99%BE',
    scientificName: 'Macrobrachium nipponense',
    habitat: '淡水河流、湖泊、池塘',
    diet: '杂食性：藻类、有机碎屑、小型无脊椎动物',
    funFact: '淡水虾是水质清洁的指示生物，对水质变化非常敏感。'
  },
  'goldfish': {
    imageUrl: getImageUrl('goldfish'),
    baikeUrl: 'https://baike.baidu.com/item/%E9%87%91%E9%B1%BC',
    scientificName: 'Carassius auratus auratus',
    habitat: '人工养殖环境、公园池塘',
    diet: '杂食性：鱼饵、藻类、昆虫',
    funFact: '金鱼是由野生鲫鱼驯化而来，已有千年以上的养殖历史。'
  },
  'gudgeon': {
    imageUrl: getImageUrl('gudgeon'),
    baikeUrl: 'https://baike.baidu.com/item/%E6%A3%92%E8%8A%B1%E9%B1%BC',
    scientificName: 'Gobio gobio',
    habitat: '沙石底质的清澈河流',
    diet: '底栖无脊椎动物、昆虫幼虫',
    funFact: '棒花鱼口角有一对短须，是辨别它的重要特征。'
  },
  'bitterling': {
    imageUrl: getImageUrl('bitterling'),
    baikeUrl: 'https://baike.baidu.com/item/%E5%BD%A9%E7%9F%B3%E9%B2%8B',
    scientificName: 'Rhodeus sinensis',
    habitat: '水草丰富的静水或缓流水域',
    diet: '藻类、有机碎屑',
    funFact: '彩石鲋的繁殖依赖河蚌，雌鱼会将卵产在河蚌体内孵化。'
  },
  'crayfish': {
    imageUrl: getImageUrl('crayfish'),
    baikeUrl: 'https://baike.baidu.com/item/%E5%85%8B%E6%B0%8F%E5%8E%9F%E8%9E%AF%E8%9B%BE',
    scientificName: 'Procambarus clarkii',
    habitat: '淡水河流、湖泊、稻田',
    diet: '杂食性：水草、小鱼、虾、有机碎屑',
    funFact: '小龙虾是外来物种，原产于北美洲，现已广泛分布于全国各地。'
  },
  'carp': {
    imageUrl: getImageUrl('carp'),
    baikeUrl: 'https://baike.baidu.com/item/%E9%B2%A4%E9%B1%BC',
    scientificName: 'Cyprinus carpio',
    habitat: '淡水湖泊、河流、池塘',
    diet: '杂食性：底栖生物、水草、有机碎屑',
    funFact: '鲤鱼是世界上最古老的养殖鱼类之一，在中国有"鲤鱼跳龙门"的美好寓意。'
  },
  'catfish': {
    imageUrl: getImageUrl('catfish'),
    baikeUrl: 'https://baike.baidu.com/item/%E9%B2%B6%E9%B1%BC',
    scientificName: 'Silurus asotus',
    habitat: '淡水河流、湖泊底层',
    diet: '肉食性：小鱼、虾、水生昆虫',
    funFact: '鲶鱼是夜行性鱼类，依靠触须感知周围环境，视力较弱。'
  },
  'perch': {
    imageUrl: getImageUrl('perch'),
    baikeUrl: 'https://baike.baidu.com/item/%E9%B2%88%E9%B1%BC',
    scientificName: 'Lateolabrax japonicus',
    habitat: '淡水及河口区域',
    diet: '肉食性：小鱼、虾、蟹',
    funFact: '鲈鱼是著名的食用鱼，肉质鲜美，有"江上往来人，但爱鲈鱼美"的诗句。'
  },
  'turtle': {
    imageUrl: getImageUrl('turtle'),
    baikeUrl: 'https://baike.baidu.com/item/%E4%B8%AD%E5%8D%8E%E9%BE%9F',
    scientificName: 'Pelodiscus sinensis',
    habitat: '淡水河流、湖泊、池塘',
    diet: '杂食性：小鱼、虾、螺、水草',
    funFact: '中华鳖是中国传统的滋补食材，寿命可达数十年。'
  },
  'bass': {
    imageUrl: getImageUrl('bass'),
    baikeUrl: 'https://baike.baidu.com/item/%E5%A4%A7%E5%8F%A3%E9%B2%88',
    scientificName: 'Micropterus salmoides',
    habitat: '淡水湖泊、水库',
    diet: '肉食性：小鱼、虾、蛙',
    funFact: '大口黑鲈原产于北美洲，是著名的游钓鱼类，现已引入中国养殖。'
  },
  'bluegill': {
    imageUrl: getImageUrl('bluegill'),
    baikeUrl: 'https://baike.baidu.com/item/%E8%93%9D%E9%B3%83%E5%A4%AA%E9%98%B3%E9%B1%BC',
    scientificName: 'Lepomis macrochirus',
    habitat: '淡水湖泊、池塘',
    diet: '杂食性：昆虫、小鱼、甲壳类',
    funFact: '蓝鳃太阳鱼原产于北美洲，鳃盖后缘有一块醒目的蓝色斑块。'
  },
  'pike': {
    imageUrl: getImageUrl('pike'),
    baikeUrl: 'https://baike.baidu.com/item/%E7%8B%97%E9%B1%BC',
    scientificName: 'Esox lucius',
    habitat: '淡水湖泊、河流',
    diet: '肉食性：鱼类、蛙类、小型水鸟',
    funFact: '狗鱼是凶猛的掠食者，牙齿锋利，能捕食体型比自己小的各种动物。'
  },
  'lotus-koi': {
    imageUrl: getImageUrl('lotus-koi'),
    baikeUrl: 'https://baike.baidu.com/item/%E9%94%A6%E9%B2%A4',
    scientificName: 'Cyprinus carpio var. koi',
    habitat: '人工养殖池塘、公园湖泊',
    diet: '杂食性：鱼饵、藻类、昆虫',
    funFact: '锦鲤被誉为"水中活宝石"，在日本被视为吉祥之物，寿命可达数十年。'
  },
  'salmon': {
    imageUrl: getImageUrl('salmon'),
    baikeUrl: 'https://baike.baidu.com/item/%E4%B8%89%E6%96%87%E9%B1%BC',
    scientificName: 'Oncorhynchus',
    habitat: '海洋及淡水河流',
    diet: '肉食性：小鱼、甲壳类',
    funFact: '三文鱼具有洄游特性，在海洋中生长，回到出生的河流产卵后死亡。'
  },
  'trout': {
    imageUrl: getImageUrl('trout'),
    baikeUrl: 'https://baike.baidu.com/item/%E8%99%B9%E9%B3%9F',
    scientificName: 'Oncorhynchus mykiss',
    habitat: '清澈寒冷的溪流和湖泊',
    diet: '肉食性：昆虫、小鱼、甲壳类',
    funFact: '虹鳟体侧有一条彩虹般的色带，是冷水性鱼类的代表。'
  },
  'sturgeon': {
    imageUrl: getImageUrl('sturgeon'),
    baikeUrl: 'https://baike.baidu.com/item/%E9%B2%9F%E9%B1%BC',
    scientificName: 'Acipenser',
    habitat: '大型河流及河口',
    diet: '底栖无脊椎动物、小鱼',
    funFact: '鲟鱼是现存最古老的鱼类之一，被称为"水中活化石"，鱼卵可制成珍贵的鱼子酱。'
  },
  'eel': {
    imageUrl: getImageUrl('eel'),
    baikeUrl: 'https://baike.baidu.com/item/%E9%B3%97%E9%B1%BC',
    scientificName: 'Anguilla japonica',
    habitat: '淡水河流、湖泊',
    diet: '肉食性：小鱼、虾、蟹、贝类',
    funFact: '鳗鱼在深海产卵，幼鱼洄游至淡水生长，是著名的降河洄游鱼类。'
  },
  'barbel': {
    imageUrl: getImageUrl('barbel'),
    baikeUrl: 'https://baike.baidu.com/item/%E5%B7%B4%E9%B1%BC',
    scientificName: 'Barbus barbus',
    habitat: '清澈的河流底层',
    diet: '底栖无脊椎动物、藻类',
    funFact: '巴波鱼口边有四根触须，用于在泥沙中搜寻食物。'
  },
  'chub': {
    imageUrl: getImageUrl('chub'),
    baikeUrl: 'https://baike.baidu.com/item/%E6%BA%AA%E5%93%A5',
    scientificName: 'Zacco platypus',
    habitat: '山间溪流',
    diet: '杂食性：藻类、昆虫、小鱼',
    funFact: '溪哥适应力极强，是山间溪流中最常见的鱼类之一。'
  },
  'grayling': {
    imageUrl: getImageUrl('grayling'),
    baikeUrl: 'https://baike.baidu.com/item/%E8%8C%B4%E9%B1%BC',
    scientificName: 'Thymallus thymallus',
    habitat: '清澈寒冷的河流',
    diet: '肉食性：昆虫、甲壳类',
    funFact: '茴鱼背鳍高大如旗帜，肉质带有淡淡的茴香味，因此得名。'
  },
  'golden-trout': {
    imageUrl: getImageUrl('golden-trout'),
    baikeUrl: 'https://baike.baidu.com/item/%E9%87%91%E9%B3%9F',
    scientificName: 'Oncorhynchus aguabonita',
    habitat: '高山清澈溪流',
    diet: '肉食性：昆虫、小鱼、甲壳类',
    funFact: '金鳟全身金光闪耀，是最美丽的鳟鱼之一，仅生存于最纯净的水域。'
  },
  'sea-bass': {
    imageUrl: getImageUrl('sea-bass'),
    baikeUrl: 'https://baike.baidu.com/item/%E6%B5%B7%E9%B2%88',
    scientificName: 'Lateolabrax japonicus',
    habitat: '沿海及河口区域',
    diet: '肉食性：小鱼、虾、蟹',
    funFact: '海鲈是著名的食用鱼，肉质细嫩，清蒸或红烧都十分美味。'
  },
  'flounder': {
    imageUrl: getImageUrl('flounder'),
    baikeUrl: 'https://baike.baidu.com/item/%E6%AF%94%E7%9B%AE%E9%B1%BC',
    scientificName: 'Paralichthys olivaceus',
    habitat: '沿海沙泥底海域',
    diet: '肉食性：小鱼、虾、蟹',
    funFact: '比目鱼两只眼睛长在同一侧，身体扁平，常侧卧于海底。'
  },
  'mackerel': {
    imageUrl: getImageUrl('mackerel'),
    baikeUrl: 'https://baike.baidu.com/item/%E9%B2%AD%E9%B1%BC',
    scientificName: 'Scomber japonicus',
    habitat: '沿海中上层水域',
    diet: '肉食性：小鱼、浮游甲壳类',
    funFact: '鲭鱼是群游性鱼类，游动速度极快，银蓝色的条纹是它的标志性特征。'
  },
  'pufferfish': {
    imageUrl: getImageUrl('pufferfish'),
    baikeUrl: 'https://baike.baidu.com/item/%E6%B2%B3%E8%B1%9A',
    scientificName: 'Tetraodontidae',
    habitat: '沿海及河口区域',
    diet: '杂食性：贝类、甲壳类、藻类',
    funFact: '河豚受惊时会膨胀成球，体内含有剧毒的河豚毒素，但经过专业处理后是珍贵的美食。'
  },
  'octopus': {
    imageUrl: getImageUrl('octopus'),
    baikeUrl: 'https://baike.baidu.com/item/%E7%AB%A0%E9%B1%BC',
    scientificName: 'Octopus',
    habitat: '沿海岩礁及沙泥底海域',
    diet: '肉食性：贝类、蟹、小鱼',
    funFact: '章鱼是最聪明的无脊椎动物之一，能开瓶盖、走迷宫，甚至使用工具。'
  },
  'sea-bream': {
    imageUrl: getImageUrl('sea-bream'),
    baikeUrl: 'https://baike.baidu.com/item/%E7%9C%9F%E9%B2%B7',
    scientificName: 'Pagrus major',
    habitat: '沿海岩礁及沙泥底海域',
    diet: '肉食性：贝类、蟹、小鱼',
    funFact: '真鲷是日本料理中的高级食材，红色的鱼身象征吉祥，常用于庆典场合。'
  },
  'swordfish': {
    imageUrl: getImageUrl('swordfish'),
    baikeUrl: 'https://baike.baidu.com/item/%E6%97%97%E9%B1%BC',
    scientificName: 'Istiophorus platypterus',
    habitat: '热带及亚热带海域',
    diet: '肉食性：小鱼、乌贼',
    funFact: '旗鱼是海洋中速度最快的鱼类之一，时速可达110公里，长长的背鳍如旗帜般壮观。'
  },
  'manta-ray': {
    imageUrl: getImageUrl('manta-ray'),
    baikeUrl: 'https://baike.baidu.com/item/%E8%9D%A0%E9%B2%BC',
    scientificName: 'Manta birostris',
    habitat: '热带及亚热带海域',
    diet: '滤食性：浮游生物、小鱼',
    funFact: '蝠鲼翼展可达7米，优雅地在海中滑翔，被称为"海洋中的蝴蝶"。'
  },
  'anglerfish': {
    imageUrl: getImageUrl('anglerfish'),
    baikeUrl: 'https://baike.baidu.com/item/%E9%AE%9F%E9%B1%87',
    scientificName: 'Lophiiformes',
    habitat: '深海',
    diet: '肉食性：鱼类、甲壳类',
    funFact: '鮟鱇鱼头顶有发光的诱饵，用于在黑暗的深海中吸引猎物。'
  },
  'jellyfish': {
    imageUrl: getImageUrl('jellyfish'),
    baikeUrl: 'https://baike.baidu.com/item/%E6%B0%B4%E6%AF%8D',
    scientificName: 'Medusozoa',
    habitat: '全球海洋',
    diet: '滤食性：浮游生物、小鱼',
    funFact: '水母没有大脑、心脏和血液，身体95%以上是水，却已在地球上生存了6亿年。'
  },
  'lanternfish': {
    imageUrl: getImageUrl('lanternfish'),
    baikeUrl: 'https://baike.baidu.com/item/%E7%81%AF%E7%AC%BC%E9%B1%BC',
    scientificName: 'Myctophidae',
    habitat: '深海',
    diet: '肉食性：浮游甲壳类',
    funFact: '灯笼鱼腹部有发光器官，能发出蓝绿色的光，是深海中最常见的鱼类之一。'
  },
  'giant-squid': {
    imageUrl: getImageUrl('giant-squid'),
    baikeUrl: 'https://baike.baidu.com/item/%E5%A4%A7%E7%8E%8B%E4%B9%8C%E8%B4%BC',
    scientificName: 'Architeuthis dux',
    habitat: '深海',
    diet: '肉食性：鱼类、乌贼',
    funFact: '大王乌贼是传说中的海怪原型，体长可达13米，拥有动物界最大的眼睛。'
  },
  'viperfish': {
    imageUrl: getImageUrl('viperfish'),
    baikeUrl: 'https://baike.baidu.com/item/%E8%9D%B0%E9%B1%BC',
    scientificName: 'Chauliodus',
    habitat: '深海',
    diet: '肉食性：鱼类',
    funFact: '蝰鱼拥有恐怖的獠牙，长度超过头部，是深海中最凶猛的捕食者之一。'
  },
  'nautilus': {
    imageUrl: getImageUrl('nautilus'),
    baikeUrl: 'https://baike.baidu.com/item/%E9%B9%A6%E9%B9%89%E8%9E%BA',
    scientificName: 'Nautilus',
    habitat: '深海',
    diet: '肉食性：甲壳类、小鱼',
    funFact: '鹦鹉螺是地球上最古老的生物之一，5亿年来几乎没有变化，被称为"活化石"。'
  },
  'coelacanth': {
    imageUrl: getImageUrl('coelacanth'),
    baikeUrl: 'https://baike.baidu.com/item/%E8%85%94%E6%A3%98%E9%B1%BC',
    scientificName: 'Latimeria',
    habitat: '深海',
    diet: '肉食性：鱼类、乌贼',
    funFact: '腔棘鱼曾被认为已灭绝6500万年，直到1938年才在非洲海岸被重新发现，是真正的"活化石"。'
  },
  'dragon-fish': {
    imageUrl: getImageUrl('dragon-fish'),
    baikeUrl: 'https://baike.baidu.com/item/%E6%B7%B1%E6%B5%B7%E9%BE%99%E9%B1%BC',
    scientificName: 'Stomias boa',
    habitat: '深海',
    diet: '肉食性：鱼类',
    funFact: '深海龙鱼浑身散发着幽蓝的光芒，是深海中最神秘的生物之一，如同传说中的龙。'
  }
}

export function getFishDetails(fishId: string): Partial<Fish> {
  return FISH_DETAILS[fishId] || {}
}

export function enrichFishData(fish: Fish): Fish {
  const details = FISH_DETAILS[fish.id]
  return {
    ...fish,
    imageUrl: details?.imageUrl || '',
    baikeUrl: details?.baikeUrl,
    scientificName: details?.scientificName,
    habitat: details?.habitat,
    diet: details?.diet,
    funFact: details?.funFact
  }
}
