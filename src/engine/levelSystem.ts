import { Board } from './board'
import { Tile } from './tiles'

export type LevelObjective =
  | { type: 'REACH_TILE'; targetLevel: number }
  | { type: 'TOTAL_MERGES'; count: number }
  | { type: 'CHAIN_MERGES'; chainLength: number }
  | { type: 'CLEAR_FROZEN'; count: number }
  | { type: 'SURVIVE_TURNS'; turns: number }
  | { type: 'SCORE'; targetScore: number }

export type LevelConfig = {
  id: number
  boardRows: number
  boardCols: number
  objective: LevelObjective
  parTurns: number
  initialTiles?: Array<{ row: number; col: number; level: number; state?: Tile['state'] }>
  isMilestone?: boolean
}

export type ObjectiveProgress = {
  current: number
  target: number
  completed: boolean
}

export type StarResult = 1 | 2 | 3

export function getObjectiveTarget(obj: LevelObjective): number {
  switch (obj.type) {
    case 'REACH_TILE': return obj.targetLevel
    case 'TOTAL_MERGES': return obj.count
    case 'CHAIN_MERGES': return obj.chainLength
    case 'CLEAR_FROZEN': return obj.count
    case 'SURVIVE_TURNS': return obj.turns
    case 'SCORE': return obj.targetScore
  }
}

export function getObjectiveLabel(obj: LevelObjective): string {
  switch (obj.type) {
    case 'REACH_TILE': return `Reach tile ${obj.targetLevel}`
    case 'TOTAL_MERGES': return `Make ${obj.count} merges`
    case 'CHAIN_MERGES': return `Chain ${obj.chainLength} merges in one swipe`
    case 'CLEAR_FROZEN': return `Unfreeze ${obj.count} tiles`
    case 'SURVIVE_TURNS': return `Survive ${obj.turns} turns`
    case 'SCORE': return `Score ${obj.targetScore} points`
  }
}

export function computeObjectiveProgress(
  obj: LevelObjective,
  board: Board,
  score: number,
  totalMerges: number,
  maxChain: number,
  frozenCleared: number,
  turnCount: number
): ObjectiveProgress {
  switch (obj.type) {
    case 'REACH_TILE': {
      const maxLevel = board
        .flat()
        .filter(Boolean)
        .reduce((max, t) => Math.max(max, t!.level), 0)
      return { current: maxLevel, target: obj.targetLevel, completed: maxLevel >= obj.targetLevel }
    }
    case 'TOTAL_MERGES':
      return { current: totalMerges, target: obj.count, completed: totalMerges >= obj.count }
    case 'CHAIN_MERGES':
      return { current: maxChain, target: obj.chainLength, completed: maxChain >= obj.chainLength }
    case 'CLEAR_FROZEN':
      return { current: frozenCleared, target: obj.count, completed: frozenCleared >= obj.count }
    case 'SURVIVE_TURNS':
      return { current: turnCount, target: obj.turns, completed: turnCount >= obj.turns }
    case 'SCORE':
      return { current: score, target: obj.targetScore, completed: score >= obj.targetScore }
  }
}

export function calculateStars(
  completed: boolean,
  usedPowers: boolean,
  turnCount: number,
  parTurns: number
): StarResult {
  if (!completed) return 1
  if (!usedPowers && turnCount <= parTurns) return 3
  if (!usedPowers) return 2
  return 1
}

export function starsToCoins(stars: StarResult): number {
  if (stars === 3) return 40
  if (stars === 2) return 20
  return 10
}

export const ARC_BOARD_SIZES: Record<number, { rows: number; cols: number }> = {
  1: { rows: 6, cols: 4 },
  2: { rows: 7, cols: 5 },
  3: { rows: 8, cols: 5 },
  4: { rows: 8, cols: 5 },
  5: { rows: 8, cols: 6 },
  6: { rows: 9, cols: 6 },
  7: { rows: 9, cols: 7 },
}

export function getArc(levelId: number): number {
  if (levelId <= 30) return 1
  if (levelId <= 60) return 2
  if (levelId <= 100) return 3
  if (levelId <= 150) return 4
  if (levelId <= 200) return 5
  if (levelId <= 250) return 6
  return 7
}
