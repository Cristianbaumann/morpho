import { Board, getEmptyCells, cloneBoard } from './board'
import { Tile, TileState, createTile, Position } from './tiles'
import { applySwipe } from './moves'

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

export function spawnNewTile(board: Board): Board {
  const empty = getEmptyCells(board)
  if (empty.length === 0) return board

  const level = pickSpawnLevel(board)

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

  const newBoard = cloneBoard(board)
  const tile = createTile(level, chosenPos.row, chosenPos.col)
  newBoard[chosenPos.row][chosenPos.col] = tile

  return newBoard
}

export function spawnInitialTiles(board: Board, count = 2): Board {
  let b = board
  for (let i = 0; i < count; i++) {
    b = spawnNewTile(b)
  }
  return b
}
