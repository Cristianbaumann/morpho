import { LevelConfig, LevelObjective, getArc, ARC_BOARD_SIZES } from './levelSystem'
import { getHandcraftedLevel } from './levels/handcrafted'
import { seededRandom, weightedPick } from '../utils/random'
import { createEmptyBoard } from './board'
import { createTile } from './tiles'
import { isGameOver } from './moves'

const LEVEL_WEIGHTS: Record<number, { level: number; weight: number }[]> = {
  1: [{ level: 1, weight: 80 }, { level: 2, weight: 20 }],
  2: [{ level: 1, weight: 60 }, { level: 2, weight: 30 }, { level: 3, weight: 10 }],
  3: [{ level: 1, weight: 45 }, { level: 2, weight: 30 }, { level: 3, weight: 20 }, { level: 4, weight: 5 }],
  4: [{ level: 1, weight: 35 }, { level: 2, weight: 30 }, { level: 3, weight: 20 }, { level: 4, weight: 10 }, { level: 5, weight: 5 }],
  5: [{ level: 1, weight: 25 }, { level: 2, weight: 25 }, { level: 3, weight: 20 }, { level: 4, weight: 15 }, { level: 5, weight: 10 }, { level: 6, weight: 5 }],
  6: [{ level: 1, weight: 15 }, { level: 2, weight: 20 }, { level: 3, weight: 20 }, { level: 4, weight: 15 }, { level: 5, weight: 15 }, { level: 6, weight: 10 }, { level: 7, weight: 5 }],
  7: [{ level: 1, weight: 10 }, { level: 2, weight: 15 }, { level: 3, weight: 15 }, { level: 4, weight: 15 }, { level: 5, weight: 15 }, { level: 6, weight: 10 }, { level: 7, weight: 10 }, { level: 8, weight: 5 }, { level: 9, weight: 3 }, { level: 10, weight: 2 }],
}

const OBJECTIVE_CYCLE = [
  'REACH_TILE', 'TOTAL_MERGES', 'CHAIN_MERGES', 'SURVIVE_TURNS', 'SCORE', 'TOTAL_MERGES',
] as const

function generateObjective(levelId: number, arc: number, rng: () => number): LevelObjective {
  const cycle = OBJECTIVE_CYCLE[(levelId - 31) % OBJECTIVE_CYCLE.length]
  const difficulty = 0.5 + (levelId / 300) * 1.5

  switch (cycle) {
    case 'REACH_TILE':
      return { type: 'REACH_TILE', targetLevel: Math.max(2, Math.round(arc + difficulty)) }
    case 'TOTAL_MERGES':
      return { type: 'TOTAL_MERGES', count: Math.round(3 + difficulty * 4) }
    case 'CHAIN_MERGES':
      return { type: 'CHAIN_MERGES', chainLength: Math.max(2, Math.round(1 + difficulty)) }
    case 'SURVIVE_TURNS':
      return { type: 'SURVIVE_TURNS', turns: Math.round(10 + difficulty * 10) }
    case 'SCORE':
      return { type: 'SCORE', targetScore: Math.round(100 * difficulty * arc * 2) }
  }
}

function generateInitialBoard(
  arc: number,
  boardRows: number,
  boardCols: number,
  rng: () => number,
  attemptOffset = 0
) {
  const emptyRatio = 1.0 - ((arc - 1) / 6) * 0.5
  const weights = LEVEL_WEIGHTS[arc]
  const board = createEmptyBoard(boardRows, boardCols)

  for (let r = 0; r < boardRows; r++) {
    for (let c = 0; c < boardCols; c++) {
      if (rng() > emptyRatio) {
        const level = weightedPick(
          weights.map((w) => w.level),
          weights.map((w) => w.weight),
          rng
        )
        board[r][c] = createTile(level, r, c)
      }
    }
  }

  return board
}

export function getLevel(id: number): LevelConfig {
  if (id <= 30) {
    const handcrafted = getHandcraftedLevel(id)
    if (handcrafted) return handcrafted
  }

  const arc = getArc(id)
  const { rows: boardRows, cols: boardCols } = ARC_BOARD_SIZES[arc]

  let seed = id * 31337 + 42
  let board = generateInitialBoard(arc, boardRows, boardCols, seededRandom(seed))

  let attempts = 0
  while (isGameOver(board) && attempts < 10) {
    seed += 1
    board = generateInitialBoard(arc, boardRows, boardCols, seededRandom(seed))
    attempts++
  }

  const rng = seededRandom(seed)
  const objective = generateObjective(id, arc, rng)
  const parTurns = Math.round(8 + (id / 300) * 22)

  const initialTiles: LevelConfig['initialTiles'] = []
  board.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell) initialTiles!.push({ row: r, col: c, level: cell.level })
    })
  )

  return {
    id,
    boardRows,
    boardCols,
    objective,
    parTurns,
    initialTiles,
    isMilestone: id % 25 === 0,
  }
}
