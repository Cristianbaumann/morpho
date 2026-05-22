import { Tile, Direction, createTileId } from './tiles'
import { Board, cloneBoard, boardsEqual } from './board'
import { computePoints } from './scoring'

export type MoveResult = {
  newBoard: Board
  moved: boolean
  pointsEarned: number
  mergesCount: number
  chainLength: number
  mergedPositions: Array<{ row: number; col: number; level: number; state: Tile['state'] }>
}

function isWallState(t: Tile | null): boolean {
  return t?.state === 'FROZEN' || t?.state === 'CHAINED'
}

function canMerge(a: Tile, b: Tile): boolean {
  if (isWallState(a) || isWallState(b)) return false
  if (a.state === 'FRAGILE' && (a.stateData.turnsLeft ?? 1) <= 0) return false
  if (b.state === 'FRAGILE' && (b.stateData.turnsLeft ?? 1) <= 0) return false
  if (a.state === 'GOLDEN' || b.state === 'GOLDEN') {
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

function mergeStateMultiplier(a: Tile, b: Tile): number {
  const s = computeMergedState(a, b)
  if (s === 'BURNING') return 3
  if (s === 'ELECTRIC') return 1.5
  if (s === 'GOLDEN' || a.state === 'GOLDEN' || b.state === 'GOLDEN') return 1.5
  return 1
}

function makeMergedTile(a: Tile, b: Tile, row: number, col: number): { tile: Tile; points: number } {
  const state = computeMergedState(a, b)
  const points = computePoints(a.level) * mergeStateMultiplier(a, b)
  return {
    tile: {
      id: createTileId(),
      level: a.level + 1,
      state,
      stateData: {},
      position: { row, col },
      isNew: false,
      isMerged: true,
    },
    points,
  }
}

// Processes one line, always packing toward index 0.
// For RIGHT/DOWN, caller reverses input and output.
// FROZEN/CHAINED tiles are walls: they stay in place.
// Non-wall tiles compact left within segments between walls.
// Leading tile of each segment may interact with the FROZEN/CHAINED wall to its left.
function processLine(
  line: (Tile | null)[],
  rowOrCol: number,
  isRow: boolean
): { result: (Tile | null)[]; points: number; merges: number; mergedStates: Array<{ row: number; col: number; state: Tile['state']; level: number }> } {
  const len = line.length
  const result: (Tile | null)[] = new Array(len).fill(null)
  let totalPoints = 0
  let totalMerges = 0
  const mergedStates: Array<{ row: number; col: number; state: Tile['state']; level: number }> = []

  // Place walls first — they don't move
  for (let i = 0; i < len; i++) {
    if (isWallState(line[i])) {
      result[i] = { ...line[i]!, stateData: { ...line[i]!.stateData } }
    }
  }

  // Process each segment between walls
  let segStart = 0
  for (let i = 0; i <= len; i++) {
    const isW = i < len && isWallState(line[i])
    if (i === len || isW) {
      const segEnd = i - 1
      if (segEnd >= segStart) {
        // Collect non-null non-wall tiles in this segment
        const segTiles: Tile[] = []
        for (let j = segStart; j <= segEnd; j++) {
          if (line[j] && !isWallState(line[j])) segTiles.push(line[j]!)
        }

        if (segTiles.length > 0) {
          // Standard 2048 merge within segment
          const merged: (Tile | null)[] = []
          let si = 0
          while (si < segTiles.length) {
            if (si + 1 < segTiles.length && canMerge(segTiles[si], segTiles[si + 1])) {
              const col = isRow ? segStart + merged.length : rowOrCol
              const row = isRow ? rowOrCol : segStart + merged.length
              const { tile, points: p } = makeMergedTile(segTiles[si], segTiles[si + 1], row, col)
              merged.push(tile)
              totalPoints += p
              totalMerges++
              mergedStates.push({ row: tile.position.row, col: tile.position.col, state: tile.state, level: tile.level })
              si += 2
            } else {
              merged.push(segTiles[si])
              si++
            }
          }

          // Check wall interaction at segStart - 1 (to the LEFT of this segment)
          const wallIdx = segStart - 1
          if (wallIdx >= 0 && isWallState(result[wallIdx]) && merged.length > 0) {
            const wallTile = result[wallIdx]!
            const leading = merged[0] as Tile

            if (leading.level === wallTile.level) {
              const wRow = isRow ? rowOrCol : wallIdx
              const wCol = isRow ? wallIdx : rowOrCol

              if (wallTile.state === 'FROZEN') {
                result[wallIdx] = {
                  id: createTileId(),
                  level: wallTile.level + 1,
                  state: 'NORMAL',
                  stateData: {},
                  position: { row: wRow, col: wCol },
                  isNew: false,
                  isMerged: true,
                }
                totalPoints += computePoints(wallTile.level) * 2
                totalMerges++
                mergedStates.push({ row: wRow, col: wCol, state: 'NORMAL', level: wallTile.level + 1 })
                merged.shift()
              } else if (wallTile.state === 'CHAINED') {
                const pushesLeft = wallTile.stateData.pushesLeft ?? 2
                if (pushesLeft <= 1) {
                  result[wallIdx] = {
                    id: createTileId(),
                    level: wallTile.level + 1,
                    state: 'NORMAL',
                    stateData: {},
                    position: { row: wRow, col: wCol },
                    isNew: false,
                    isMerged: true,
                  }
                  totalPoints += computePoints(wallTile.level) * 2.5
                  totalMerges++
                  mergedStates.push({ row: wRow, col: wCol, state: 'NORMAL', level: wallTile.level + 1 })
                  merged.shift()
                } else {
                  // First push: decrement counter, leading tile stays (not consumed)
                  result[wallIdx] = {
                    ...wallTile,
                    stateData: { ...wallTile.stateData, pushesLeft: pushesLeft - 1 },
                  }
                }
              }
            }
          }

          // Place remaining tiles in segment starting at segStart
          let writePos = segStart
          for (const t of merged) {
            if (!t) continue
            while (result[writePos] !== null && writePos <= segEnd) writePos++
            if (writePos > segEnd) break
            const row = isRow ? rowOrCol : writePos
            const col = isRow ? writePos : rowOrCol
            result[writePos] = { ...t, position: { row, col } }
            writePos++
          }
        }
      }
      segStart = i + 1
    }
  }

  return { result, points: totalPoints, merges: totalMerges, mergedStates }
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
      const { result, points, merges, mergedStates } = processLine(newBoard[r], r, true)
      result.forEach((t, c) => { newBoard[r][c] = t })
      totalPoints += points
      totalMerges += merges
      mergedPositions.push(...mergedStates)
    }
  } else if (direction === 'RIGHT') {
    for (let r = 0; r < rows; r++) {
      const reversed = [...newBoard[r]].reverse()
      const { result, points, merges, mergedStates } = processLine(reversed, r, true)
      const unreversed = [...result].reverse()
      unreversed.forEach((t, c) => { newBoard[r][c] = t })
      totalPoints += points
      totalMerges += merges
      // Fix column indices for reversed processing
      mergedStates.forEach((ms) => mergedPositions.push({ ...ms, col: cols - 1 - ms.col }))
    }
  } else if (direction === 'UP') {
    for (let c = 0; c < cols; c++) {
      const col = newBoard.map((row) => row[c])
      const { result, points, merges, mergedStates } = processLine(col, c, false)
      result.forEach((t, r) => { newBoard[r][c] = t })
      totalPoints += points
      totalMerges += merges
      mergedPositions.push(...mergedStates)
    }
  } else if (direction === 'DOWN') {
    for (let c = 0; c < cols; c++) {
      const col = newBoard.map((row) => row[c]).reverse()
      const { result, points, merges, mergedStates } = processLine(col, c, false)
      const unreversed = [...result].reverse()
      unreversed.forEach((t, r) => { newBoard[r][c] = t })
      totalPoints += points
      totalMerges += merges
      mergedStates.forEach((ms) => mergedPositions.push({ ...ms, row: rows - 1 - ms.row }))
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
    if (applySwipe(board, dir).moved) return false
  }
  return true
}
