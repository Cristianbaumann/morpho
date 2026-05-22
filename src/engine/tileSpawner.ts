import { Board, getEmptyCells, cloneBoard } from './board'
import { Tile, TileState, createTile, Position } from './tiles'

// Probability tables per arc (from 03-tile-states.md)
type StateWeight = { state: TileState; weight: number }

const ARC_STATE_WEIGHTS: Record<number, StateWeight[]> = {
  1: [{ state: 'NORMAL', weight: 100 }],
  2: [{ state: 'NORMAL', weight: 85 }, { state: 'FROZEN', weight: 10 }, { state: 'FRAGILE', weight: 5 }],
  3: [{ state: 'NORMAL', weight: 70 }, { state: 'FROZEN', weight: 10 }, { state: 'FRAGILE', weight: 8 }, { state: 'BURNING', weight: 7 }, { state: 'INFECTED', weight: 5 }],
  4: [{ state: 'NORMAL', weight: 60 }, { state: 'FROZEN', weight: 10 }, { state: 'FRAGILE', weight: 7 }, { state: 'BURNING', weight: 7 }, { state: 'INFECTED', weight: 7 }, { state: 'CHAINED', weight: 5 }, { state: 'ELECTRIC', weight: 4 }],
  5: [{ state: 'NORMAL', weight: 50 }, { state: 'FROZEN', weight: 10 }, { state: 'FRAGILE', weight: 7 }, { state: 'BURNING', weight: 7 }, { state: 'INFECTED', weight: 7 }, { state: 'CHAINED', weight: 7 }, { state: 'ELECTRIC', weight: 6 }, { state: 'GOLDEN', weight: 6 }],
}

const FREE_MODE_TURN_ARCS: Array<{ minTurn: number; arc: number }> = [
  { minTurn: 0, arc: 1 },
  { minTurn: 20, arc: 2 },
  { minTurn: 40, arc: 3 },
  { minTurn: 70, arc: 4 },
  { minTurn: 100, arc: 5 },
]

function getArcForTurn(turn: number): number {
  let arc = 1
  for (const entry of FREE_MODE_TURN_ARCS) {
    if (turn >= entry.minTurn) arc = entry.arc
  }
  return arc
}

function pickWeighted<T>(items: Array<{ weight: number } & T>, rand: number): T {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = rand * total
  for (const item of items) {
    r -= item.weight
    if (r <= 0) return item
  }
  return items[items.length - 1]
}

let _lastState: TileState = 'NORMAL'

function pickState(arc: number): TileState {
  const weights = ARC_STATE_WEIGHTS[Math.min(arc, 5)] ?? ARC_STATE_WEIGHTS[5]
  const picked = pickWeighted(weights, Math.random()).state

  // Anti-spam: no two consecutive special states
  if (picked !== 'NORMAL' && _lastState !== 'NORMAL') {
    _lastState = 'NORMAL'
    return 'NORMAL'
  }

  _lastState = picked
  return picked
}

function getStateData(state: TileState): Tile['stateData'] {
  switch (state) {
    case 'FRAGILE': return { turnsLeft: 1 }
    case 'INFECTED': return { turnsLeft: 3 }
    case 'CHAINED': return { pushesLeft: 2 }
    default: return {}
  }
}

function countPossibleMergesIfPlaced(board: Board, pos: Position, level: number): number {
  let count = 0
  const { row, col } = pos
  const rows = board.length
  const cols = board[0].length
  const neighbors = [
    row > 0 ? board[row - 1][col] : null,
    row < rows - 1 ? board[row + 1][col] : null,
    col > 0 ? board[row][col - 1] : null,
    col < cols - 1 ? board[row][col + 1] : null,
  ]
  for (const n of neighbors) {
    if (n && n.level === level && n.state === 'NORMAL') count++
  }
  return count
}

function pickSpawnLevel(board: Board): number {
  const tiles: Tile[] = []
  board.forEach((row) => row.forEach((t) => { if (t) tiles.push(t) }))
  if (tiles.length === 0) return 1
  const levels = tiles.map((t) => t.level)
  const minLevel = Math.min(...levels)
  const maxLevel = Math.max(...levels)
  const cap = Math.max(minLevel + 2, 2)
  return Math.floor(Math.random() * Math.min(cap, maxLevel - minLevel + 1)) + minLevel
}

export type SpawnOptions = {
  arc?: number
  turnCount?: number
  turnsWithoutMerge?: number
}

export function spawnNewTile(board: Board, opts: SpawnOptions = {}): Board {
  const empty = getEmptyCells(board)
  if (empty.length === 0) return board

  const arc = opts.arc ?? (opts.turnCount !== undefined ? getArcForTurn(opts.turnCount) : 1)
  let level = pickSpawnLevel(board)

  // Anti-frustration: 5+ turns without merge → bias toward most common level
  if ((opts.turnsWithoutMerge ?? 0) >= 5) {
    const tiles: Tile[] = []
    board.forEach((row) => row.forEach((t) => { if (t) tiles.push(t) }))
    if (tiles.length > 0 && Math.random() < 0.8) {
      const levelCounts: Record<number, number> = {}
      tiles.forEach((t) => { levelCounts[t.level] = (levelCounts[t.level] ?? 0) + 1 })
      level = parseInt(
        Object.entries(levelCounts).sort(([, a], [, b]) => b - a)[0][0],
        10
      )
    }
  }

  let chosenPos: Position
  if (Math.random() < 0.6) {
    const scored = empty.map((pos) => ({
      pos,
      score: countPossibleMergesIfPlaced(board, pos, level),
    }))
    scored.sort((a, b) => b.score - a.score)
    const top = scored.filter((s) => s.score === scored[0].score)
    chosenPos = top[Math.floor(Math.random() * top.length)].pos
  } else {
    chosenPos = empty[Math.floor(Math.random() * empty.length)]
  }

  const state = pickState(arc)
  const stateData = getStateData(state)

  const newBoard = cloneBoard(board)
  newBoard[chosenPos.row][chosenPos.col] = createTile(level, chosenPos.row, chosenPos.col, state, stateData)

  return newBoard
}

export function spawnInitialTiles(board: Board, count = 2): Board {
  let b = board
  for (let i = 0; i < count; i++) {
    b = spawnNewTile(b, { arc: 1 })
  }
  return b
}
