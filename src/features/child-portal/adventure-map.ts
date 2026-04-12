import { formatPoints } from '@/features/child-portal/format'
import {
  getTaskStatusTone,
  getTaskVisualIcon
} from '@/features/child-portal/helpers'
import type { ChildTaskItem } from '@/features/child-portal/types'

type AdventureTaskStatus = 'active' | 'pending' | 'completed'

export interface AdventureViewport {
  width: number
  height: number
}

export type AdventureResponsiveTier = 'desktop' | 'tablet' | 'phone' | 'narrow-phone'
export type AdventureAnchorColumn = 'left' | 'center' | 'right'

export interface AdventureNode {
  id: string
  kind: 'start' | 'task' | 'end'
  title: string
  icon: string
  imageUrl: string
  tone: string
  pointsText: string
  originalTask: ChildTaskItem | null
  originalIndex: number
  progressTime: number | null
  recordDate: string
  status: AdventureTaskStatus | null
}

export interface AdventureRoute {
  mode: 'challenge' | 'progressed'
  nodeIds: string[]
  taskNodeIds: string[]
  progressedNodeIds: string[]
  idleNodeIds: string[]
}

export interface AdventureLayoutPoint {
  id: string
  x: number
  y: number
  xPercent: number
  yPercent: number
  band: number
  slot: number
  candidateIndex: number
}

export interface AdventureAnchorZone {
  id: string
  kind: 'start' | 'end'
  column: AdventureAnchorColumn
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface AdventureAnchorSelection {
  zoneId: string
  column: AdventureAnchorColumn
  xPercent: number
  yPercent: number
  bounds: Pick<AdventureAnchorZone, 'minX' | 'maxX' | 'minY' | 'maxY'>
}

export interface AdventureResponsiveProfile {
  tier: AdventureResponsiveTier
  orbSizePx: number
  labelMaxWidthPx: number
  lineStrokePx: number
  markerSizePx: number
  markerOffsetPx: number
  minDistancePx: number
  obstacleDensity: number
}

export interface AdventureLayoutResult {
  compact: boolean
  width: number
  height: number
  seed: number
  minDistancePx: number
  positions: Record<string, AdventureLayoutPoint>
  responsive: AdventureResponsiveProfile
  anchors: {
    startZone: AdventureAnchorSelection
    endZone: AdventureAnchorSelection
  }
  safeArea: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
}

export interface AdventureEdge {
  id: string
  from: string
  to: string
  routeKind: AdventureRoute['mode']
  fromPoint: AdventureLayoutPoint
  toPoint: AdventureLayoutPoint
  path: string
}

type SlotCandidate = AdventureLayoutPoint & {
  key: string
}

const START_ANCHOR_ZONES: AdventureAnchorZone[] = [
  { id: 'start-left', kind: 'start', column: 'left', minX: 18, maxX: 32, minY: 9, maxY: 15 },
  { id: 'start-center', kind: 'start', column: 'center', minX: 42, maxX: 58, minY: 9, maxY: 15 },
  { id: 'start-right', kind: 'start', column: 'right', minX: 68, maxX: 82, minY: 9, maxY: 15 }
]
const END_ANCHOR_COLUMNS = [
  { id: 'end-left', kind: 'end' as const, column: 'left' as const, minX: 18, maxX: 32 },
  { id: 'end-center', kind: 'end' as const, column: 'center' as const, minX: 42, maxX: 58 },
  { id: 'end-right', kind: 'end' as const, column: 'right' as const, minX: 68, maxX: 82 }
]
const SAFE_AREA = { minX: 14, maxX: 86, minY: 18, maxY: 82 }

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function toTimestamp(value?: number | string): number {
  if (!value) {
    return 0
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 0
  }

  return date.getTime()
}

function toStatus(task: ChildTaskItem): AdventureTaskStatus {
  return (task.type || 'active') as AdventureTaskStatus
}

function hashString(input: string): number {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createPrng(seed: number) {
  let state = seed >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seededUnit(seed: number, salt: string) {
  return createPrng(hashString(`${seed}:${salt}`))()
}

function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const next = [...items]
  const random = createPrng(seed)

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = next[index]
    next[index] = next[swapIndex] as T
    next[swapIndex] = current as T
  }

  return next
}

function getSeedInput(tasks: ChildTaskItem[], recordDate: string) {
  const sortedIds = [...tasks]
    .map((task) => task.task_id)
    .sort((left, right) => left.localeCompare(right))

  return `${recordDate || 'unknown'}::${sortedIds.join('|')}`
}

function createAnchorPoint(
  id: string,
  xPercent: number,
  yPercent: number,
  width: number,
  height: number
): AdventureLayoutPoint {
  return {
    id,
    x: (xPercent / 100) * width,
    y: (yPercent / 100) * height,
    xPercent,
    yPercent,
    band: -1,
    slot: -1,
    candidateIndex: -1
  }
}

function getResponsiveTier(width: number): AdventureResponsiveTier {
  if (width > 900) {
    return 'desktop'
  }
  if (width > 640) {
    return 'tablet'
  }
  if (width > 480) {
    return 'phone'
  }
  return 'narrow-phone'
}

function getResponsiveProfile(
  viewport: AdventureViewport,
  compact: boolean
): AdventureResponsiveProfile {
  const width = Math.max(Math.round(viewport.width), 320)
  const height = Math.max(Math.round(viewport.height), 440)
  const tier = getResponsiveTier(width)
  const baseProfile = tier === 'desktop'
    ? {
        orbSizePx: compact ? 84 : 100,
        labelMaxWidthPx: compact ? 148 : 168,
        lineStrokePx: 8,
        markerSizePx: compact ? 40 : 42,
        markerOffsetPx: compact ? 96 : 108,
        minDistancePx: compact ? 148 : 180,
        obstacleDensity: compact ? 0.44 : 0.58,
        distanceScale: 0.32
      }
    : tier === 'tablet'
      ? {
          orbSizePx: compact ? 84 : 88,
          labelMaxWidthPx: compact ? 142 : 148,
          lineStrokePx: 7,
          markerSizePx: 38,
          markerOffsetPx: compact ? 92 : 98,
          minDistancePx: 152,
          obstacleDensity: compact ? 0.38 : 0.42,
          distanceScale: 0.3
        }
      : tier === 'phone'
        ? {
            orbSizePx: compact ? 68 : 72,
            labelMaxWidthPx: compact ? 116 : 124,
            lineStrokePx: 6,
            markerSizePx: 34,
            markerOffsetPx: compact ? 82 : 88,
            minDistancePx: 128,
            obstacleDensity: compact ? 0.24 : 0.28,
            distanceScale: 0.28
          }
        : {
            orbSizePx: compact ? 58 : 62,
            labelMaxWidthPx: compact ? 100 : 108,
            lineStrokePx: 5,
            markerSizePx: 30,
            markerOffsetPx: compact ? 70 : 76,
            minDistancePx: 112,
            obstacleDensity: compact ? 0.16 : 0.2,
            distanceScale: 0.27
          }

  return {
    tier,
    orbSizePx: baseProfile.orbSizePx,
    labelMaxWidthPx: baseProfile.labelMaxWidthPx,
    lineStrokePx: baseProfile.lineStrokePx,
    markerSizePx: baseProfile.markerSizePx,
    markerOffsetPx: baseProfile.markerOffsetPx,
    minDistancePx: Math.round(
      Math.min(baseProfile.minDistancePx, Math.min(width, height) * baseProfile.distanceScale) * 10
    ) / 10,
    obstacleDensity: baseProfile.obstacleDensity
  }
}

function getEndAnchorZones(
  viewport: AdventureViewport,
  responsive: AdventureResponsiveProfile
): AdventureAnchorZone[] {
  const height = Math.max(Math.round(viewport.height), 440)
  const bottomClearancePx = Math.max(responsive.orbSizePx * 0.72 + 18, responsive.markerSizePx + 20)
  const bandHeightPx = Math.max(responsive.orbSizePx * 0.48, 34)
  const maxY = clamp(((height - bottomClearancePx) / height) * 100, 82, 94)
  const minY = clamp(maxY - ((bandHeightPx / height) * 100), 76, maxY - 1.2)

  return END_ANCHOR_COLUMNS.map((zone) => ({
    ...zone,
    minY,
    maxY
  }))
}

function selectAnchor(
  seed: number,
  salt: string,
  zones: AdventureAnchorZone[],
  blockedColumn?: AdventureAnchorColumn
): AdventureAnchorSelection {
  const eligibleZones = zones.filter((zone) => zone.column !== blockedColumn)
  const pool = eligibleZones.length ? eligibleZones : zones
  const zoneIndex = Math.min(
    pool.length - 1,
    Math.floor(seededUnit(seed, `${salt}:zone`) * pool.length)
  )
  const zone = pool[zoneIndex]!
  const xPercent = zone.minX + seededUnit(seed, `${salt}:x`) * (zone.maxX - zone.minX)
  const yPercent = zone.minY + seededUnit(seed, `${salt}:y`) * (zone.maxY - zone.minY)

  return {
    zoneId: zone.id,
    column: zone.column,
    xPercent,
    yPercent,
    bounds: {
      minX: zone.minX,
      maxX: zone.maxX,
      minY: zone.minY,
      maxY: zone.maxY
    }
  }
}

function createCandidates(
  seed: number,
  viewport: AdventureViewport,
  compact: boolean,
  responsive: AdventureResponsiveProfile
): SlotCandidate[] {
  const tier = responsive.tier
  const bandPercents = tier === 'narrow-phone'
    ? (compact ? [21, 34, 46.5, 59, 71.5] : [24, 40, 56, 72])
    : tier === 'phone'
      ? (compact ? [21, 33.5, 46, 58.5, 71] : [22, 39, 56, 73])
      : compact
        ? [20, 32.5, 45, 57.5, 70]
        : [22, 38, 56, 72]
  const slotPercents = tier === 'narrow-phone'
    ? (compact ? [22, 39, 61, 78] : [26, 50, 74])
    : tier === 'phone'
      ? (compact ? [18, 40, 60, 82] : [24, 50, 76])
      : tier === 'tablet'
        ? (compact ? [17, 39, 61, 83] : [20, 50, 80])
        : compact
          ? [16, 39, 61, 84]
          : [22, 50, 78]
  const xJitter = tier === 'narrow-phone'
    ? (compact ? 1.2 : 2.2)
    : tier === 'phone'
      ? (compact ? 1.8 : 3.2)
      : compact
        ? 2.3
        : 5.2
  const yJitter = tier === 'narrow-phone'
    ? (compact ? 2.7 : 3.4)
    : tier === 'phone'
      ? (compact ? 3.1 : 4)
      : compact
        ? 3.8
        : 4.8
  const width = Math.max(viewport.width, 320)
  const height = Math.max(viewport.height, 440)
  const candidates: SlotCandidate[] = []

  bandPercents.forEach((bandPercent, bandIndex) => {
    slotPercents.forEach((slotPercent, slotIndex) => {
      const jitterX = (seededUnit(seed, `candidate:${bandIndex}:${slotIndex}:x`) - 0.5) * xJitter * 2
      const jitterY = (seededUnit(seed, `candidate:${bandIndex}:${slotIndex}:y`) - 0.5) * yJitter * 2
      const middleBias = slotIndex === Math.floor(slotPercents.length / 2) ? 0.65 : 1
      const xPercent = clamp(slotPercent + jitterX * middleBias, SAFE_AREA.minX, SAFE_AREA.maxX)
      const yPercent = clamp(bandPercent + jitterY, SAFE_AREA.minY, SAFE_AREA.maxY)

      candidates.push({
        id: `candidate-${bandIndex}-${slotIndex}`,
        key: `${bandIndex}:${slotIndex}`,
        x: (xPercent / 100) * width,
        y: (yPercent / 100) * height,
        xPercent,
        yPercent,
        band: bandIndex,
        slot: slotIndex,
        candidateIndex: candidates.length
      })
    })
  })

  return candidates
}

function getRouteCandidates(candidates: SlotCandidate[], compact: boolean, seed: number) {
  const maxBand = Math.max(...candidates.map((candidate) => candidate.band))
  const slotCount = compact ? 4 : 3
  const routeCandidates: SlotCandidate[] = []

  for (let bandIndex = 0; bandIndex <= maxBand; bandIndex += 1) {
    const bandCandidates = candidates.filter((candidate) => candidate.band === bandIndex)
    const slotOrder = seededShuffle(
      Array.from({ length: slotCount }, (_, slotIndex) => slotIndex),
      hashString(`${seed}:route-band:${bandIndex}`)
    )

    slotOrder.forEach((slotIndex) => {
      const candidate = bandCandidates.find((item) => item.slot === slotIndex)
      if (candidate) {
        routeCandidates.push(candidate)
      }
    })
  }

  return routeCandidates
}

function getIdleCandidates(candidates: SlotCandidate[], compact: boolean, seed: number) {
  const sidePriority = compact
    ? new Map([
        [0, 0],
        [3, 0],
        [1, 1],
        [2, 1]
      ])
    : new Map([
        [0, 0],
        [2, 0],
        [1, 2]
      ])

  return [...candidates].sort((left, right) => {
    const leftPriority = sidePriority.get(left.slot) ?? 9
    const rightPriority = sidePriority.get(right.slot) ?? 9
    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority
    }

    const leftBandBias = seededUnit(seed, `idle-band:${left.key}`)
    const rightBandBias = seededUnit(seed, `idle-band:${right.key}`)
    if (left.band !== right.band) {
      return left.band - right.band
    }

    return leftBandBias - rightBandBias
  })
}

function getSpacedIndexes(total: number, count: number) {
  if (count <= 0 || total <= 0) {
    return []
  }

  return Array.from({ length: count }, (_, index) =>
    clamp(Math.floor(((index + 1) * total) / (count + 1)), 0, total - 1)
  )
}

function getDistance(left: AdventureLayoutPoint | SlotCandidate, right: AdventureLayoutPoint | SlotCandidate) {
  return Math.hypot(left.x - right.x, left.y - right.y)
}

function isFarEnough(
  candidate: SlotCandidate,
  occupied: AdventureLayoutPoint[],
  minDistancePx: number
) {
  return occupied.every((point) => getDistance(candidate, point) >= minDistancePx)
}

function selectCandidate(
  orderedCandidates: SlotCandidate[],
  targetIndex: number,
  usedKeys: Set<string>,
  occupiedTaskPoints: AdventureLayoutPoint[],
  minDistancePx: number,
  minIndex = 0
) {
  const boundedTarget = clamp(targetIndex, minIndex, orderedCandidates.length - 1)
  const searchOrder = new Set<number>()

  for (let distance = 0; distance < orderedCandidates.length; distance += 1) {
    const forward = boundedTarget + distance
    const backward = boundedTarget - distance

    if (forward < orderedCandidates.length && forward >= minIndex) {
      searchOrder.add(forward)
    }
    if (backward >= minIndex && backward < orderedCandidates.length) {
      searchOrder.add(backward)
    }
  }

  for (const candidateIndex of searchOrder) {
    const candidate = orderedCandidates[candidateIndex]
    if (!candidate || usedKeys.has(candidate.key)) {
      continue
    }

    if (isFarEnough(candidate, occupiedTaskPoints, minDistancePx)) {
      return { candidate, index: candidateIndex }
    }
  }

  for (let candidateIndex = minIndex; candidateIndex < orderedCandidates.length; candidateIndex += 1) {
    const candidate = orderedCandidates[candidateIndex]
    if (!candidate || usedKeys.has(candidate.key)) {
      continue
    }

    return { candidate, index: candidateIndex }
  }

  return null
}

function buildCurvedPath(fromPoint: AdventureLayoutPoint, toPoint: AdventureLayoutPoint) {
  const deltaY = toPoint.y - fromPoint.y
  const controlOffset = Math.max(34, Math.abs(deltaY) * 0.36)
  const cp1y = fromPoint.y + controlOffset
  const cp2y = toPoint.y - controlOffset

  return [
    `M ${fromPoint.x.toFixed(2)} ${fromPoint.y.toFixed(2)}`,
    `C ${fromPoint.x.toFixed(2)} ${cp1y.toFixed(2)}, ${toPoint.x.toFixed(2)} ${cp2y.toFixed(2)}, ${toPoint.x.toFixed(2)} ${toPoint.y.toFixed(2)}`
  ].join(' ')
}

export function buildAdventureNodes(tasks: ChildTaskItem[] = [], recordDate = ''): AdventureNode[] {
  const taskNodes = tasks.map((task, index) => {
    const status = toStatus(task)
    const progressTime = status === 'active'
      ? null
      : toTimestamp(task.completed_at ?? task.submitted_at) || null

    return {
      id: task.task_id,
      kind: 'task' as const,
      title: task.title,
      icon: getTaskVisualIcon(task.type),
      imageUrl: task.image_url || '',
      tone: getTaskStatusTone(task.type),
      pointsText: task.points === undefined ? '' : formatPoints(task.points),
      originalTask: task,
      originalIndex: index,
      progressTime,
      recordDate,
      status
    }
  })

  return [
    {
      id: 'start',
      kind: 'start',
      title: '出发',
      icon: 'ph:flag-banner-fill',
      imageUrl: '',
      tone: 'sky',
      pointsText: '',
      originalTask: null,
      originalIndex: -1,
      progressTime: null,
      recordDate,
      status: null
    },
    ...taskNodes,
    {
      id: 'end',
      kind: 'end',
      title: '终点',
      icon: 'ph:treasure-chest-fill',
      imageUrl: '',
      tone: 'amber',
      pointsText: '',
      originalTask: null,
      originalIndex: Number.MAX_SAFE_INTEGER,
      progressTime: null,
      recordDate,
      status: null
    }
  ]
}

export function buildAdventureRoute(nodes: AdventureNode[]): AdventureRoute {
  const taskNodes = nodes.filter((node) => node.kind === 'task')
  const recordDate = taskNodes[0]?.recordDate || nodes[0]?.recordDate || ''
  const seed = hashString(getSeedInput(taskNodes.map((node) => node.originalTask!).filter(Boolean), recordDate))
  const challengeTaskIds = seededShuffle(
    taskNodes.map((node) => node.id),
    hashString(`${seed}:challenge-route`)
  )
  const progressedNodes = [...taskNodes]
    .filter((node) => node.status === 'completed' || node.status === 'pending')
    .sort((left, right) => {
      const leftTime = left.progressTime ?? Number.MAX_SAFE_INTEGER
      const rightTime = right.progressTime ?? Number.MAX_SAFE_INTEGER
      if (leftTime !== rightTime) {
        return leftTime - rightTime
      }
      if (left.originalIndex !== right.originalIndex) {
        return left.originalIndex - right.originalIndex
      }

      return left.id.localeCompare(right.id)
    })
  const progressedNodeIds = progressedNodes.map((node) => node.id)
  const progressedNodeIdSet = new Set(progressedNodeIds)
  const idleNodeIds = challengeTaskIds.filter((nodeId) => !progressedNodeIdSet.has(nodeId))

  if (progressedNodeIds.length > 0) {
    const taskNodeIds = [...progressedNodeIds, ...idleNodeIds]
    return {
      mode: 'progressed',
      nodeIds: ['start', ...taskNodeIds, 'end'],
      taskNodeIds,
      progressedNodeIds,
      idleNodeIds
    }
  }

  return {
    mode: 'challenge',
    nodeIds: ['start', ...challengeTaskIds, 'end'],
    taskNodeIds: challengeTaskIds,
    progressedNodeIds: [],
    idleNodeIds: []
  }
}

export function buildAdventureLayout(
  nodes: AdventureNode[],
  viewport: AdventureViewport
): AdventureLayoutResult {
  const width = Math.max(Math.round(viewport.width), 320)
  const height = Math.max(Math.round(viewport.height), 440)
  const taskNodes = nodes.filter((node) => node.kind === 'task')
  const tasks = taskNodes.map((node) => node.originalTask!).filter(Boolean)
  const recordDate = taskNodes[0]?.recordDate || nodes[0]?.recordDate || ''
  const seed = hashString(getSeedInput(tasks, recordDate))
  const route = buildAdventureRoute(nodes)
  const compact = taskNodes.length > 6 || width < 900
  const responsive = getResponsiveProfile({ width, height }, compact)
  const minDistancePx = responsive.minDistancePx
  const anchorDistance = Math.max(
    Math.min(minDistancePx - 18, responsive.orbSizePx * 1.4),
    responsive.orbSizePx + 10
  )
  const candidates = createCandidates(seed, { width, height }, compact, responsive)
  const routeCandidates = getRouteCandidates(candidates, compact, seed)
  const routeIndexes = getSpacedIndexes(routeCandidates.length, route.taskNodeIds.length)
  const usedKeys = new Set<string>()
  const startAnchor = selectAnchor(seed, 'anchor:start', START_ANCHOR_ZONES)
  const endAnchor = selectAnchor(
    seed,
    'anchor:end',
    getEndAnchorZones({ width, height }, responsive),
    startAnchor.column
  )
  const startPoint = createAnchorPoint('start', startAnchor.xPercent, startAnchor.yPercent, width, height)
  const endPoint = createAnchorPoint('end', endAnchor.xPercent, endAnchor.yPercent, width, height)
  const positions: Record<string, AdventureLayoutPoint> = {
    start: startPoint,
    end: endPoint
  }
  const occupiedTaskPoints: AdventureLayoutPoint[] = []
  const protectedAnchors = [
    { point: startPoint, distance: anchorDistance },
    { point: endPoint, distance: anchorDistance }
  ]
  let minRouteCandidateIndex = 0

  route.taskNodeIds.forEach((nodeId, index) => {
    const targetIndex = routeIndexes[index] ?? minRouteCandidateIndex
    const selection = selectCandidate(
      routeCandidates,
      targetIndex,
      usedKeys,
      occupiedTaskPoints,
      minDistancePx,
      minRouteCandidateIndex
    )

    const fallbackCandidate = selection?.candidate || routeCandidates.find((candidate) => !usedKeys.has(candidate.key))
    if (!fallbackCandidate) {
      return
    }

    const anchorSafeCandidate = protectedAnchors.every((anchor) => getDistance(fallbackCandidate, anchor.point) >= anchor.distance)
      ? fallbackCandidate
      : routeCandidates.find((candidate) =>
          !usedKeys.has(candidate.key) &&
          protectedAnchors.every((anchor) => getDistance(candidate, anchor.point) >= anchor.distance) &&
          isFarEnough(candidate, occupiedTaskPoints, minDistancePx)
        ) || fallbackCandidate

    usedKeys.add(anchorSafeCandidate.key)
    positions[nodeId] = { ...anchorSafeCandidate, id: nodeId }
    occupiedTaskPoints.push(positions[nodeId]!)
    minRouteCandidateIndex = Math.max(selection?.index ?? targetIndex, minRouteCandidateIndex) + 1
  })

  const remainingCandidates = candidates.filter((candidate) => !usedKeys.has(candidate.key))
  const idleCandidatePool = getIdleCandidates(remainingCandidates, compact, seed)
  const idleNodeIds = route.mode === 'progressed' && route.taskNodeIds.length < taskNodes.length
    ? seededShuffle(route.idleNodeIds, hashString(`${seed}:idle-nodes`))
    : []
  const idleIndexes = getSpacedIndexes(idleCandidatePool.length, idleNodeIds.length)

  idleNodeIds.forEach((nodeId, index) => {
    const targetIndex = idleIndexes[index] ?? 0
    const selection = selectCandidate(
      idleCandidatePool,
      targetIndex,
      usedKeys,
      occupiedTaskPoints,
      minDistancePx
    )

    const fallbackCandidate = selection?.candidate || idleCandidatePool.find((candidate) => !usedKeys.has(candidate.key))
    if (!fallbackCandidate) {
      return
    }

    const anchorSafeCandidate = protectedAnchors.every((anchor) => getDistance(fallbackCandidate, anchor.point) >= anchor.distance)
      ? fallbackCandidate
      : idleCandidatePool.find((candidate) =>
          !usedKeys.has(candidate.key) &&
          protectedAnchors.every((anchor) => getDistance(candidate, anchor.point) >= anchor.distance) &&
          isFarEnough(candidate, occupiedTaskPoints, minDistancePx)
        ) || fallbackCandidate

    usedKeys.add(anchorSafeCandidate.key)
    positions[nodeId] = { ...anchorSafeCandidate, id: nodeId }
    occupiedTaskPoints.push(positions[nodeId]!)
  })

  return {
    compact,
    width,
    height,
    seed,
    minDistancePx,
    positions,
    responsive,
    anchors: {
      startZone: startAnchor,
      endZone: endAnchor
    },
    safeArea: { ...SAFE_AREA }
  }
}

export function buildAdventureEdges(
  route: AdventureRoute,
  layout: AdventureLayoutResult
): AdventureEdge[] {
  if (route.taskNodeIds.length === 0) {
    return []
  }

  const edges: AdventureEdge[] = []

  for (let index = 0; index < route.nodeIds.length - 1; index += 1) {
    const from = route.nodeIds[index]
    const to = route.nodeIds[index + 1]
    if (!from || !to) {
      continue
    }
    const fromPoint = layout.positions[from]
    const toPoint = layout.positions[to]

    if (!fromPoint || !toPoint) {
      continue
    }

    edges.push({
      id: `${from}->${to}`,
      from,
      to,
      routeKind: route.mode,
      fromPoint,
      toPoint,
      path: buildCurvedPath(fromPoint, toPoint)
    })
  }

  return edges
}
