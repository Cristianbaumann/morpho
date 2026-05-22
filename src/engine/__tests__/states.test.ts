import { applySwipe, isGameOver } from '../moves'
import { applyBurningEffects, applyElectricEffects, applyTurnEndEffects } from '../states'
import { createEmptyBoard } from '../board'
import { createTile } from '../tiles'

function board(rows: number, cols: number, tiles: Array<[number, number, number, string?]>) {
  const b = createEmptyBoard(rows, cols)
  for (const [r, c, level, state] of tiles) {
    b[r][c] = createTile(level, r, c, (state as any) ?? 'NORMAL')
  }
  return b
}

// ---------- FROZEN ----------
describe('FROZEN tiles', () => {
  test('FROZEN tile does not move on swipe', () => {
    // [null, null, FROZEN(2)] → LEFT → FROZEN stays at col 2
    const b = board(1, 3, [[0, 2, 2, 'FROZEN']])
    const { newBoard, moved } = applySwipe(b, 'LEFT')
    expect(moved).toBe(false)
    expect(newBoard[0][2]?.state).toBe('FROZEN')
  })

  test('different-level tile stops before FROZEN (LEFT)', () => {
    // [null, A(1), FROZEN(2)] → LEFT → A goes to col 0, FROZEN stays at col 2
    const b = board(1, 3, [[0, 1, 1], [0, 2, 2, 'FROZEN']])
    const { newBoard } = applySwipe(b, 'LEFT')
    expect(newBoard[0][0]?.level).toBe(1)
    expect(newBoard[0][0]?.state).toBe('NORMAL')
    expect(newBoard[0][2]?.state).toBe('FROZEN')
  })

  test('same-level tile merges with FROZEN on RIGHT swipe', () => {
    // [A(2), null, FROZEN(2)] → RIGHT → A slides right and merges with FROZEN
    const b = board(1, 3, [[0, 0, 2], [0, 2, 2, 'FROZEN']])
    const { newBoard, moved, mergesCount } = applySwipe(b, 'RIGHT')
    expect(moved).toBe(true)
    expect(mergesCount).toBe(1)
    expect(newBoard[0][2]?.level).toBe(3)
    expect(newBoard[0][2]?.state).toBe('NORMAL')
    expect(newBoard[0][2]?.isMerged).toBe(true)
  })

  test('FROZEN merge gives x2 points', () => {
    const b = board(1, 3, [[0, 0, 1], [0, 2, 1, 'FROZEN']])
    const { pointsEarned } = applySwipe(b, 'RIGHT')
    // BASE_POINTS[1] = 10, multiplier = 2 → 20
    expect(pointsEarned).toBe(20)
  })

  test('non-matching tile does NOT merge with FROZEN', () => {
    const b = board(1, 3, [[0, 0, 1], [0, 2, 3, 'FROZEN']])
    const { newBoard, mergesCount } = applySwipe(b, 'RIGHT')
    expect(mergesCount).toBe(0)
    expect(newBoard[0][2]?.state).toBe('FROZEN')
  })
})

// ---------- CHAINED ----------
describe('CHAINED tiles', () => {
  test('CHAINED tile does not move', () => {
    const b = board(1, 3, [[0, 2, 2, 'CHAINED']])
    ;(b[0][2] as any).stateData = { pushesLeft: 2 }
    const { newBoard } = applySwipe(b, 'LEFT')
    expect(newBoard[0][2]?.state).toBe('CHAINED')
  })

  test('first push decrements pushesLeft', () => {
    const b = board(1, 3, [[0, 0, 2], [0, 2, 2, 'CHAINED']])
    b[0][2]!.stateData = { pushesLeft: 2 }
    const { newBoard } = applySwipe(b, 'RIGHT')
    expect(newBoard[0][2]?.stateData?.pushesLeft).toBe(1)
    expect(newBoard[0][1]?.level).toBe(2) // A stops adjacent
  })

  test('second push merges CHAINED tile', () => {
    const b = board(1, 3, [[0, 0, 2], [0, 2, 2, 'CHAINED']])
    b[0][2]!.stateData = { pushesLeft: 1 }
    const { newBoard, mergesCount } = applySwipe(b, 'RIGHT')
    expect(mergesCount).toBe(1)
    expect(newBoard[0][2]?.level).toBe(3)
    expect(newBoard[0][2]?.state).toBe('NORMAL')
  })
})

// ---------- BURNING ----------
describe('BURNING effects', () => {
  test('BURNING merge destroys lowest adjacent tile', () => {
    // Board: BURNING(3) merged at [0,0], adjacent tiles at [0,1](level 1) and [1,0](level 2)
    const b = createEmptyBoard(2, 2)
    b[0][0] = { ...createTile(3, 0, 0, 'BURNING'), isMerged: true }
    b[0][1] = createTile(1, 0, 1)
    b[1][0] = createTile(2, 1, 0)

    const mergedPositions = [{ row: 0, col: 0, level: 3, state: 'BURNING' as const }]
    const { newBoard } = applyBurningEffects(b, mergedPositions)

    // Lowest adjacent is level 1 at [0,1] → should be destroyed
    expect(newBoard[0][1]).toBeNull()
    expect(newBoard[1][0]?.level).toBe(2)
  })

  test('BURNING does not destroy newly merged tile', () => {
    const b = createEmptyBoard(2, 2)
    b[0][0] = { ...createTile(3, 0, 0, 'BURNING'), isMerged: true }
    b[0][1] = { ...createTile(1, 0, 1), isMerged: true } // recently merged, skip

    const mergedPositions = [{ row: 0, col: 0, level: 3, state: 'BURNING' as const }]
    const { newBoard } = applyBurningEffects(b, mergedPositions)

    // isMerged tile should not be destroyed
    expect(newBoard[0][1]).not.toBeNull()
  })
})

// ---------- FRAGILE ----------
describe('FRAGILE tiles', () => {
  test('FRAGILE tile removed after turnsLeft reaches 0', () => {
    const b = createEmptyBoard(2, 2)
    b[0][0] = { ...createTile(1, 0, 0, 'FRAGILE'), stateData: { turnsLeft: 1 } }
    b[0][1] = createTile(2, 0, 1)

    const { newBoard } = applyTurnEndEffects(b)
    expect(newBoard[0][0]).toBeNull()
    expect(newBoard[0][1]?.level).toBe(2)
  })

  test('FRAGILE tile with turnsLeft > 1 decrements counter', () => {
    const b = createEmptyBoard(2, 2)
    b[0][0] = { ...createTile(1, 0, 0, 'FRAGILE'), stateData: { turnsLeft: 2 } }

    const { newBoard } = applyTurnEndEffects(b)
    expect(newBoard[0][0]).not.toBeNull()
    expect(newBoard[0][0]?.stateData?.turnsLeft).toBe(1)
  })
})

// ---------- ELECTRIC ----------
describe('ELECTRIC effects', () => {
  test('ELECTRIC cascade merges same-level tiles pairwise', () => {
    // Board: two level-2 tiles (pre-merge level), electric merge created level-3
    const b = createEmptyBoard(2, 3)
    b[0][0] = { ...createTile(3, 0, 0, 'ELECTRIC'), isMerged: true }
    b[0][1] = createTile(2, 0, 1) // should cascade merge
    b[1][0] = createTile(2, 1, 0) // should cascade merge

    const mergedPositions = [{ row: 0, col: 0, level: 3, state: 'ELECTRIC' as const }]
    const { newBoard, additionalMerges } = applyElectricEffects(b, mergedPositions)

    expect(additionalMerges).toBe(1)
    // One pair merged → one level-3 tile, one null
    const level3Tiles = newBoard.flat().filter((t) => t?.level === 3)
    const level2Tiles = newBoard.flat().filter((t) => t?.level === 2)
    expect(level3Tiles.length).toBe(2) // original + cascade
    expect(level2Tiles.length).toBe(0)
  })
})

// ---------- existing tests still pass ----------
describe('standard moves (regression)', () => {
  test('normal tiles still merge left', () => {
    const b = board(1, 4, [[0, 1, 1], [0, 3, 1]])
    const { newBoard, moved, mergesCount } = applySwipe(b, 'LEFT')
    expect(moved).toBe(true)
    expect(mergesCount).toBe(1)
    expect(newBoard[0][0]?.level).toBe(2)
  })

  test('isGameOver still works', () => {
    const b = board(2, 2, [[0, 0, 1], [0, 1, 2], [1, 0, 3], [1, 1, 4]])
    expect(isGameOver(b)).toBe(true)
  })
})
