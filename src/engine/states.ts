import { Board, cloneBoard, getAdjacentPositions } from './board'
import { Tile, createTile, createTileId } from './tiles'
import { computePoints } from './scoring'
import { MoveResult } from './moves'

export type StateEffectResult = {
  newBoard: Board
  additionalPoints: number
  additionalMerges: number
  frozenCleared: number
}

// --- BURNING ---
// After a BURNING merge: destroy the lowest-level adjacent tile (no points for destroyed tile)
export function applyBurningEffects(board: Board, mergedPositions: MoveResult['mergedPositions']): StateEffectResult {
  let newBoard = cloneBoard(board)
  let additionalPoints = 0

  const burningMerges = mergedPositions.filter((mp) => mp.state === 'BURNING')

  for (const { row, col } of burningMerges) {
    const adj = getAdjacentPositions(newBoard, { row, col })
    const candidates = adj
      .map((pos) => newBoard[pos.row][pos.col])
      .filter((t): t is Tile => t !== null && !t.isMerged)

    if (candidates.length === 0) continue

    // Destroy the lowest-level adjacent tile
    const target = candidates.reduce((min, t) => (t.level < min.level ? t : min))
    newBoard[target.position.row][target.position.col] = null
  }

  return { newBoard, additionalPoints, additionalMerges: 0, frozenCleared: 0 }
}

// --- ELECTRIC ---
// After an ELECTRIC merge at level N: all remaining tiles of level N-1 merge pairwise
export function applyElectricEffects(board: Board, mergedPositions: MoveResult['mergedPositions']): StateEffectResult {
  let newBoard = cloneBoard(board)
  let additionalPoints = 0
  let additionalMerges = 0

  const electricMerges = mergedPositions.filter((mp) => mp.state === 'ELECTRIC')
  const processedLevels = new Set<number>()

  for (const { level } of electricMerges) {
    const preMergeLevel = level - 1
    if (processedLevels.has(preMergeLevel)) continue
    processedLevels.add(preMergeLevel)

    // Find all tiles of the pre-merge level (not already merged this turn)
    const targets: Tile[] = []
    newBoard.forEach((row) =>
      row.forEach((t) => {
        if (t && t.level === preMergeLevel && !t.isMerged) targets.push(t)
      })
    )

    // Pair them up (sort by position, pair consecutively)
    targets.sort((a, b) =>
      a.position.row !== b.position.row
        ? a.position.row - b.position.row
        : a.position.col - b.position.col
    )

    for (let i = 0; i + 1 < targets.length; i += 2) {
      const a = targets[i]
      const b = targets[i + 1]
      const newTile: Tile = {
        id: createTileId(),
        level: preMergeLevel + 1,
        state: 'NORMAL',
        stateData: {},
        position: { ...a.position },
        isNew: false,
        isMerged: true,
      }
      newBoard[a.position.row][a.position.col] = newTile
      newBoard[b.position.row][b.position.col] = null
      additionalPoints += computePoints(preMergeLevel) * 1.5
      additionalMerges++
    }
  }

  return { newBoard, additionalPoints, additionalMerges, frozenCleared: 0 }
}

// --- TURN END EFFECTS ---
// FRAGILE: countdown → remove if turnsLeft <= 0
// INFECTED: countdown → spread if turnsLeft <= 0
export function applyTurnEndEffects(board: Board): StateEffectResult {
  let newBoard = cloneBoard(board)
  const rows = newBoard.length
  const cols = newBoard[0].length

  // Process FRAGILE tiles (decrement turnsLeft, remove if expired)
  const toRemove: Array<{ row: number; col: number }> = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = newBoard[r][c]
      if (!t || t.isMerged) continue

      if (t.state === 'FRAGILE') {
        const turnsLeft = (t.stateData.turnsLeft ?? 1) - 1
        if (turnsLeft <= 0) {
          toRemove.push({ row: r, col: c })
        } else {
          newBoard[r][c] = {
            ...t,
            stateData: { ...t.stateData, turnsLeft },
          }
        }
      }
    }
  }
  for (const { row, col } of toRemove) {
    newBoard[row][col] = null
  }

  // Process INFECTED tiles (decrement turnsLeft, spread if expired)
  const toSpread: Array<{ row: number; col: number }> = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = newBoard[r][c]
      if (!t || t.isMerged) continue

      if (t.state === 'INFECTED') {
        const turnsLeft = (t.stateData.turnsLeft ?? 3) - 1
        if (turnsLeft <= 0) {
          toSpread.push({ row: r, col: c })
          // Reset the spreader's counter
          newBoard[r][c] = { ...t, stateData: { ...t.stateData, turnsLeft: 3 } }
        } else {
          newBoard[r][c] = { ...t, stateData: { ...t.stateData, turnsLeft } }
        }
      }
    }
  }

  for (const pos of toSpread) {
    const adj = getAdjacentPositions(newBoard, pos)
    const candidates = adj.filter(({ row, col }) => {
      const t = newBoard[row][col]
      return t && t.state !== 'FROZEN' && t.state !== 'CHAINED' && t.state !== 'INFECTED'
    })
    if (candidates.length === 0) continue
    const target = candidates[Math.floor(Math.random() * candidates.length)]
    const targetTile = newBoard[target.row][target.col]!
    newBoard[target.row][target.col] = {
      ...targetTile,
      state: 'INFECTED',
      stateData: { ...targetTile.stateData, turnsLeft: 3 },
    }
  }

  // Reset isMerged flags for next turn
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (newBoard[r][c]?.isMerged) {
        newBoard[r][c] = { ...newBoard[r][c]!, isMerged: false }
      }
      if (newBoard[r][c]?.isNew) {
        newBoard[r][c] = { ...newBoard[r][c]!, isNew: false }
      }
    }
  }

  return { newBoard, additionalPoints: 0, additionalMerges: 0, frozenCleared: 0 }
}
