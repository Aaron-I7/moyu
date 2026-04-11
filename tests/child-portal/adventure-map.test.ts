import { describe, expect, it } from 'vitest'
import {
  buildAdventureEdges,
  buildAdventureLayout,
  buildAdventureNodes,
  buildAdventureRoute
} from '../../src/features/child-portal/adventure-map'
import type { ChildTaskItem } from '../../src/features/child-portal/types'

function createTask(
  taskId: string,
  overrides: Partial<ChildTaskItem> = {}
): ChildTaskItem {
  return {
    task_id: taskId,
    title: `任务 ${taskId}`,
    points: 10,
    type: 'active',
    ...overrides
  }
}

function getTaskPoints(layout: ReturnType<typeof buildAdventureLayout>) {
  return Object.values(layout.positions).filter((point) => point.id !== 'start' && point.id !== 'end')
}

function isWithin(percent: number, min: number, max: number) {
  return percent >= min && percent <= max
}

describe('adventure map layout', () => {
  it('keeps positions stable for the same record date and task ids', () => {
    const tasks = [createTask('a'), createTask('b'), createTask('c')]
    const nodes = buildAdventureNodes(tasks, '2026-04-10')
    const left = buildAdventureLayout(nodes, { width: 900, height: 620 })
    const right = buildAdventureLayout(nodes, { width: 900, height: 620 })

    expect(left.positions).toEqual(right.positions)
    expect(left.seed).toBe(right.seed)
  })

  it('keeps start and end anchors inside the configured top and bottom zones', () => {
    const nodes = buildAdventureNodes([createTask('a')], '2026-04-10')
    const layout = buildAdventureLayout(nodes, { width: 900, height: 620 })

    expect(['left', 'center', 'right']).toContain(layout.anchors.startZone.column)
    expect(['left', 'center', 'right']).toContain(layout.anchors.endZone.column)
    expect(isWithin(layout.positions.start.xPercent, 18, 82)).toBe(true)
    expect(isWithin(layout.positions.start.yPercent, 9, 15)).toBe(true)
    expect(isWithin(layout.positions.end.xPercent, 18, 82)).toBe(true)
    expect(isWithin(layout.positions.end.yPercent, 88, 94)).toBe(true)
  })

  it('keeps start and end anchors in different columns', () => {
    const nodes = buildAdventureNodes([createTask('a'), createTask('b')], '2026-04-10')
    const layout = buildAdventureLayout(nodes, { width: 900, height: 620 })

    expect(layout.anchors.startZone.column).not.toBe(layout.anchors.endZone.column)
  })

  it('changes anchor zones or task positions when the reroll seed changes', () => {
    const tasks = [createTask('a'), createTask('b'), createTask('c')]
    const first = buildAdventureLayout(buildAdventureNodes(tasks, '2026-04-10::layout-0'), { width: 900, height: 620 })
    const second = buildAdventureLayout(buildAdventureNodes(tasks, '2026-04-10::layout-1'), { width: 900, height: 620 })
    const anchorChanged =
      first.anchors.startZone.zoneId !== second.anchors.startZone.zoneId ||
      first.anchors.endZone.zoneId !== second.anchors.endZone.zoneId
    const positionsChanged = JSON.stringify(first.positions) !== JSON.stringify(second.positions)

    expect(anchorChanged || positionsChanged).toBe(true)
  })

  it('places every task node inside the safe area', () => {
    const tasks = Array.from({ length: 8 }, (_, index) => createTask(String(index + 1)))
    const nodes = buildAdventureNodes(tasks, '2026-04-10')
    const layout = buildAdventureLayout(nodes, { width: 900, height: 620 })

    getTaskPoints(layout).forEach((point) => {
      expect(point.xPercent).toBeGreaterThanOrEqual(layout.safeArea.minX)
      expect(point.xPercent).toBeLessThanOrEqual(layout.safeArea.maxX)
      expect(point.yPercent).toBeGreaterThanOrEqual(layout.safeArea.minY)
      expect(point.yPercent).toBeLessThanOrEqual(layout.safeArea.maxY)
    })
  })

  it('keeps task nodes beyond the minimum center distance on a roomy compact layout', () => {
    const tasks = Array.from({ length: 9 }, (_, index) => createTask(String(index + 1)))
    const nodes = buildAdventureNodes(tasks, '2026-04-10')
    const layout = buildAdventureLayout(nodes, { width: 960, height: 680 })
    const points = getTaskPoints(layout)

    for (let leftIndex = 0; leftIndex < points.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < points.length; rightIndex += 1) {
        const left = points[leftIndex]
        const right = points[rightIndex]
        const distance = Math.hypot(left.x - right.x, left.y - right.y)
        expect(distance).toBeGreaterThanOrEqual(layout.minDistancePx - 0.01)
      }
    }
  })

  it('connects all tasks in seed order when no task has progressed yet', () => {
    const tasks = [createTask('a'), createTask('b'), createTask('c')]
    const nodes = buildAdventureNodes(tasks, '2026-04-10')
    const route = buildAdventureRoute(nodes)
    const layout = buildAdventureLayout(nodes, { width: 900, height: 620 })
    const edges = buildAdventureEdges(route, layout)

    expect(route.mode).toBe('challenge')
    expect(route.nodeIds[0]).toBe('start')
    expect(route.nodeIds.at(-1)).toBe('end')
    expect(route.taskNodeIds).toHaveLength(3)
    expect(edges.map((edge) => `${edge.from}->${edge.to}`)).toEqual([
      `start->${route.taskNodeIds[0]}`,
      `${route.taskNodeIds[0]}->${route.taskNodeIds[1]}`,
      `${route.taskNodeIds[1]}->${route.taskNodeIds[2]}`,
      `${route.taskNodeIds[2]}->end`
    ])
  })

  it('moves progressed tasks to the front and keeps remaining tasks connected in challenge order', () => {
    const tasks = [
      createTask('active-1'),
      createTask('pending-1', { type: 'pending', submitted_at: 3000 }),
      createTask('completed-1', { type: 'completed', completed_at: 1000 }),
      createTask('pending-2', { type: 'pending', submitted_at: 2000 }),
      createTask('active-2')
    ]
    const nodes = buildAdventureNodes(tasks, '2026-04-10')
    const route = buildAdventureRoute(nodes)
    const challengeRoute = buildAdventureRoute(buildAdventureNodes([
      createTask('active-1'),
      createTask('pending-1'),
      createTask('completed-1'),
      createTask('pending-2'),
      createTask('active-2')
    ], '2026-04-10'))
    const remainingChallengeOrder = challengeRoute.taskNodeIds.filter((nodeId) =>
      !['completed-1', 'pending-2', 'pending-1'].includes(nodeId)
    )

    expect(route.mode).toBe('progressed')
    expect(route.progressedNodeIds).toEqual(['completed-1', 'pending-2', 'pending-1'])
    expect(route.idleNodeIds).toEqual(remainingChallengeOrder)
    expect(route.taskNodeIds).toEqual(['completed-1', 'pending-2', 'pending-1', ...remainingChallengeOrder])
  })

  it('uses submitted_at to order pending tasks on the main route', () => {
    const nodes = buildAdventureNodes([
      createTask('later', { type: 'pending', submitted_at: 2000 }),
      createTask('soon', { type: 'pending', submitted_at: 1000 })
    ], '2026-04-10')
    const route = buildAdventureRoute(nodes)

    expect(route.taskNodeIds).toEqual(['soon', 'later'])
  })

  it('keeps the unfinished tasks on the path after a middle task is completed later', () => {
    const nodes = buildAdventureNodes([
      createTask('task-1', { type: 'completed', completed_at: 1000 }),
      createTask('task-2'),
      createTask('task-3'),
      createTask('task-4', { type: 'completed', completed_at: 4000 }),
      createTask('task-5')
    ], '2026-04-10')
    const route = buildAdventureRoute(nodes)

    expect(route.progressedNodeIds).toEqual(['task-1', 'task-4'])
    expect(route.taskNodeIds.slice(0, 2)).toEqual(['task-1', 'task-4'])
    expect(route.nodeIds[0]).toBe('start')
    expect(route.nodeIds.at(-1)).toBe('end')
    expect(route.taskNodeIds).toHaveLength(5)
  })

  it('switches to compact mode for many tasks without increasing the supplied viewport height', () => {
    const tasks = Array.from({ length: 10 }, (_, index) => createTask(String(index + 1)))
    const nodes = buildAdventureNodes(tasks, '2026-04-10')
    const layout = buildAdventureLayout(nodes, { width: 840, height: 560 })

    expect(layout.compact).toBe(true)
    expect(layout.height).toBe(560)
  })
})
