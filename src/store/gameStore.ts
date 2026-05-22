import { create } from 'zustand'
import { Board, createEmptyBoard, BOARD_ROWS, BOARD_COLS } from '../engine/board'
import { Direction, PowerType, createTile } from '../engine/tiles'
import { applySwipe, isGameOver } from '../engine/moves'
import { spawnNewTile, spawnInitialTiles } from '../engine/tileSpawner'
import {
  LevelConfig,
  LevelObjective,
  ObjectiveProgress,
  computeObjectiveProgress,
  calculateStars,
  starsToCoins,
  StarResult,
} from '../engine/levelSystem'

type GameMode = 'free' | 'level'

interface GameState {
  mode: GameMode
  board: Board
  score: number
  bestScore: number
  isGameOver: boolean
  isLevelComplete: boolean
  previousBoard: Board | null
  previousScore: number

  // level mode
  currentLevel: LevelConfig | null
  turnCount: number
  totalMerges: number
  maxChainInLevel: number
  frozenCleared: number
  usedPowers: boolean
  objectiveProgress: ObjectiveProgress | null
  levelStars: StarResult | null

  // anti-frustration
  turnsWithoutMerge: number

  startFreeGame: () => void
  startLevel: (level: LevelConfig) => void
  swipe: (direction: Direction) => void
  undo: () => void
  resetGame: () => void
  getLevelReward: () => { stars: StarResult; coins: number } | null
}

function makeInitialBoard(level: LevelConfig): Board {
  const board = createEmptyBoard(level.boardRows, level.boardCols)
  if (level.initialTiles) {
    for (const { row, col, level: tileLevel, state } of level.initialTiles) {
      board[row][col] = createTile(tileLevel, row, col, state ?? 'NORMAL')
    }
  }
  return spawnInitialTiles(board, level.initialTiles?.length ? 1 : 2)
}

export const useGameStore = create<GameState>((set, get) => ({
  mode: 'free',
  board: createEmptyBoard(BOARD_ROWS, BOARD_COLS),
  score: 0,
  bestScore: 0,
  isGameOver: false,
  isLevelComplete: false,
  previousBoard: null,
  previousScore: 0,
  currentLevel: null,
  turnCount: 0,
  totalMerges: 0,
  maxChainInLevel: 0,
  frozenCleared: 0,
  usedPowers: false,
  objectiveProgress: null,
  levelStars: null,
  turnsWithoutMerge: 0,

  startFreeGame: () => {
    const board = spawnInitialTiles(createEmptyBoard(BOARD_ROWS, BOARD_COLS), 2)
    set({
      mode: 'free',
      board,
      score: 0,
      isGameOver: false,
      isLevelComplete: false,
      previousBoard: null,
      previousScore: 0,
      currentLevel: null,
      turnCount: 0,
      totalMerges: 0,
      maxChainInLevel: 0,
      frozenCleared: 0,
      usedPowers: false,
      objectiveProgress: null,
      levelStars: null,
      turnsWithoutMerge: 0,
    })
  },

  startLevel: (level) => {
    const board = makeInitialBoard(level)
    const objectiveProgress = computeObjectiveProgress(
      level.objective, board, 0, 0, 0, 0, 0
    )
    set({
      mode: 'level',
      board,
      score: 0,
      isGameOver: false,
      isLevelComplete: false,
      previousBoard: null,
      previousScore: 0,
      currentLevel: level,
      turnCount: 0,
      totalMerges: 0,
      maxChainInLevel: 0,
      frozenCleared: 0,
      usedPowers: false,
      objectiveProgress,
      levelStars: null,
      turnsWithoutMerge: 0,
    })
  },

  swipe: (direction) => {
    const {
      board, score, bestScore, isGameOver: over, isLevelComplete,
      currentLevel, mode, totalMerges, maxChainInLevel, frozenCleared,
      turnsWithoutMerge,
    } = get()

    if (over || isLevelComplete) return

    const result = applySwipe(board, direction)
    if (!result.moved) return

    const newTurnsWithoutMerge = result.mergesCount > 0 ? 0 : turnsWithoutMerge + 1
    const boardWithTile = spawnNewTile(result.newBoard)
    const gameOver = isGameOver(boardWithTile)
    const newScore = score + result.pointsEarned
    const newTotalMerges = totalMerges + result.mergesCount
    const newMaxChain = Math.max(maxChainInLevel, result.chainLength)
    const newTurnCount = get().turnCount + 1

    let objectiveProgress = get().objectiveProgress
    let isLevelComplete = false
    let levelStars: StarResult | null = null

    if (mode === 'level' && currentLevel) {
      objectiveProgress = computeObjectiveProgress(
        currentLevel.objective,
        boardWithTile,
        newScore,
        newTotalMerges,
        newMaxChain,
        frozenCleared,
        newTurnCount
      )
      isLevelComplete = objectiveProgress.completed
      if (isLevelComplete) {
        levelStars = calculateStars(true, get().usedPowers, newTurnCount, currentLevel.parTurns)
      }
    }

    set({
      board: boardWithTile,
      score: newScore,
      bestScore: Math.max(newScore, bestScore),
      isGameOver: gameOver,
      isLevelComplete,
      previousBoard: board,
      previousScore: score,
      totalMerges: newTotalMerges,
      maxChainInLevel: newMaxChain,
      turnCount: newTurnCount,
      objectiveProgress,
      levelStars,
      turnsWithoutMerge: newTurnsWithoutMerge,
    })
  },

  undo: () => {
    const { previousBoard, previousScore, currentLevel, mode } = get()
    if (!previousBoard) return

    let objectiveProgress = get().objectiveProgress
    if (mode === 'level' && currentLevel) {
      objectiveProgress = computeObjectiveProgress(
        currentLevel.objective, previousBoard, previousScore, 0, 0, 0, get().turnCount - 1
      )
    }

    set({
      board: previousBoard,
      score: previousScore,
      previousBoard: null,
      isGameOver: false,
      isLevelComplete: false,
      turnCount: Math.max(0, get().turnCount - 1),
      objectiveProgress,
      usedPowers: true,
    })
  },

  resetGame: () => {
    const { mode, currentLevel } = get()
    if (mode === 'level' && currentLevel) {
      get().startLevel(currentLevel)
    } else {
      get().startFreeGame()
    }
  },

  getLevelReward: () => {
    const { levelStars, score } = get()
    if (!levelStars) return null
    return { stars: levelStars, coins: starsToCoins(levelStars) }
  },
}))
