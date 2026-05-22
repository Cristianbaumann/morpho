import { Tile, Direction, createTile, createTileId } from './tiles'
import { Board, cloneBoard, boardsEqual } from './board'
import { computePoints } from './scoring'

export type MoveResult = {
  newBoard: Board
  moved: boolean
  pointsEarned: number
  mergesCount: number
  chainLength: number
  mergedPositions: Array<{ row: number; col: number; level: number }>
}

function canMerge(a: Tile, b: Tile): boolean {
  if (a.state === 'FROZEN' || a.state === 'CHAINED') return false
  if (b.state === 'FROZEN' || b.state === 'CHAINED') return false
  if (a.state === 'FRAGILE' && (a.stateData.turnsLeft ?? 1) <= 0) return false
  if (b.state === 'FRAGILE' && (b.stateData.turnsLeft ?? 1) <= 0) return false

  if (a.state === 'GOLDEN') {
    return Math.floor(a.level / 3) === Math.floor(b.level / 3)
  }
  if (b.state === 'GOLDEN') {
    return Math.floor(a.level / 3) === Math.floor(b.level / 3)
  }

  return a.level === b.level
}

function computeMergedState(a: Tile, b: Tile): Tile['state'] {
  if (a.state === 'BURNING' || b.state === 'BURNING') return 'BURNING'
  if (a.state === 'ELECTRIC' || b.state === 'ELECTRIC') return 'ELECTRIC'
  if (a.state === 'GOLDEN') return b.state === 'NORMAL' ? 'NORMAL' : b.state
  if (b.state === 'GOLDEN') return a.state === 'NORMAL' ? 'NORMAL' : a.state
  if (a.state !== 'NORMAL') return a.state
  if (b.state !== 'NORMAL') return b.state
  return 'NORMAL'
}

function mergeTwo(
  a: Tile,
  b: Tile,
  row: number,
  col: number
): { tile: Tile; points: number } {
  const mergedState = computeMergedState(a, b)
  const stateMultiplier =
    mergedState === 'BURNING'
      ? 3
      : a.state === 'FROZEN' || b.state === 'FROZEN'
      ? 2
      : mergedState === 'ELECTRIC'
      ? 1.5
      : mergedState === 'GOLDEN'
      ? 1.5
      : 1

  const points = computePoints(a.level) * stateMultiplier

  const tile: Tile = {
    id: createTileId(),
    level: a.level + 1,
    state: mergedState,
    stateData: {},
    position: { row, col },
    isNew: false,
    isMerged: true,
  }

  return { tile, points }
}

function moveLine(
  tiles: (Tile | null)[],
  rowOrCol: number,
  isRow: boolean
): { result: (Tile | null)[]; points: number; merges: number } {
  const compacted = tiles.filter((t): t is Tile => t !== null)
  const merged: Tile[] = []
  let points = 0
  let merges = 0
  let i = 0

  while (i < compacted.length) {
    if (i + 1 < compacted.length && canMerge(compacted[i], compacted[i + 1])) {
      const pos = isRow
        ? { row: rowOrCol, col: merged.length }
        : { row: merged.length, col: rowOrCol }
      const { tile, points: p } = mergeTwo(compacted[i], compacted[i + 1], pos.row, pos.col)
      merged.push(tile)
      points += p
      merges++
      i += 2
    } else {
      merged.push(compacted[i])
      i++
    }
  }

  while (merged.length < tiles.length) {
    merged.push(null as unknown as Tile)
  }

  return { result: merged as (Tile | null)[], points, merges }
}

export function applySwipe(board: Board, direction: Direction): MoveResult {
  const rows = board.length
  const cols = board[0].length
  const newBoard = cloneBoard(board)
  let totalPoints = 0
  let totalMerges = 0
  const mergedPositions: MoveResult['mergedPositions'] = []

  if (direction === 'LEFT') {
    for (let r = 0; r < rows; r++) {
      const { result, points, merges } = moveLine(newBoard[r], r, true)
      result.forEach((t, c) => {
        if (t) t.position = { row: r, col: c }
        newBoard[r][c] = t
      })
      totalPoints += points
      totalMerges += merges
    }
  } else if (direction === 'RIGHT') {
    for (let r = 0; r < rows; r++) {
      const reversed = [...newBoard[r]].reverse()
      const { result, points, merges } = moveLine(reversed, r, true)
      const unreversed = [...result].reverse()
      unreversed.forEach((t, c) => {
        if (t) t.position = { row: r, col: c }
        newBoard[r][c] = t
      })
      totalPoints += points
      totalMerges += merges
    }
  } else if (direction === 'UP') {
    for (let c = 0; c < cols; c++) {
      const col = newBoard.map((row) => row[c])
      const { result, points, merges } = moveLine(col, c, false)
      result.forEach((t, r) => {
        if (t) t.position = { row: r, col: c }
        newBoard[r][c] = t
      })
      totalPoints += points
      totalMerges += merges
    }
  } else if (direction === 'DOWN') {
    for (let c = 0; c < cols; c++) {
      const col = newBoard.map((row) => row[c]).reverse()
      const { result, points, merges } = moveLine(col, c, false)
      const unreversed = [...result].reverse()
      unreversed.forEach((t, r) => {
        if (t) t.position = { row: r, col: c }
        newBoard[r][c] = t
      })
      totalPoints += points
      totalMerges += merges
    }
  }

  const moved = !boardsEqual(board, newBoard)

  return {
    newBoard,
    moved,
    pointsEarned: totalPoints,
    mergesCount: totalMerges,
    chainLength: totalMerges,
    mergedPositions,
  }
}

export function isGameOver(board: Board): boolean {
  if (board.some((row) => row.some((cell) => cell === null))) return false

  const directions: Direction[] = ['LEFT', 'RIGHT', 'UP', 'DOWN']
  for (const dir of directions) {
    const result = applySwipe(board, dir)
    if (result.moved) return false
  }

  return true
}
