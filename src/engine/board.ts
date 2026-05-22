import { Tile, Position } from './tiles'

export type Board = (Tile | null)[][]

export function createEmptyBoard(rows: number, cols: number): Board {
  return Array.from({ length: rows }, () => Array(cols).fill(null))
}

export function hasEmptyCells(board: Board): boolean {
  return board.some((row) => row.some((cell) => cell === null))
}

export function getEmptyCells(board: Board): Position[] {
  const empty: Position[] = []
  board.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell === null) empty.push({ row: r, col: c })
    })
  )
  return empty
}

export function cloneBoard(board: Board): Board {
  return board.map((row) =>
    row.map((cell) => (cell ? { ...cell, stateData: { ...cell.stateData } } : null))
  )
}

export function boardsEqual(a: Board, b: Board): boolean {
  for (let r = 0; r < a.length; r++) {
    for (let c = 0; c < a[r].length; c++) {
      const ta = a[r][c]
      const tb = b[r][c]
      if (ta === null && tb === null) continue
      if (ta === null || tb === null) return false
      if (ta.level !== tb.level || ta.state !== tb.state) return false
    }
  }
  return true
}

export function getAdjacentPositions(
  board: Board,
  pos: Position
): Position[] {
  const rows = board.length
  const cols = board[0].length
  const adj: Position[] = []
  if (pos.row > 0) adj.push({ row: pos.row - 1, col: pos.col })
  if (pos.row < rows - 1) adj.push({ row: pos.row + 1, col: pos.col })
  if (pos.col > 0) adj.push({ row: pos.row, col: pos.col - 1 })
  if (pos.col < cols - 1) adj.push({ row: pos.row, col: pos.col + 1 })
  return adj
}

export const BOARD_ROWS = 8
export const BOARD_COLS = 5
