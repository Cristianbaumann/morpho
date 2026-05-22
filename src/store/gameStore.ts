import { create } from 'zustand'
import { Board, createEmptyBoard, BOARD_ROWS, BOARD_COLS } from '../engine/board'
import { Direction, createTile } from '../engine/tiles'
import { applySwipe, isGameOver } from '../engine/moves'
import { applyBurningEffects, applyElectricEffects, applyTurnEndEffects } from '../engine/states'
import { spawnNewTile, spawnInitialTiles } from '../engine/tileSpawner'
import {
  LevelConfig,
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

  currentLevel: LevelConfig | null
  turnCount: number
  totalMerges: number
  maxChainInLevel: number
  frozenCleared: number
  usedPowers: boolean
  objectiveProgress: ObjectiveProgress | null
  levelStars: StarResult | null
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

function getArcForLevel(level: LevelConfig | null): number {
  if (!level) return 1
  if (level.id <= 30) return 1
  if (level.id <= 60) return 2
  if (level.id <= 100) return 3
  if (level.id <= 150) return 4
  return 5
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
      mode: 'free', board, score: 0, isGameOver: false, isLevelComplete: false,
      previousBoard: null, previousScore: 0, currentLevel: null,
      turnCount: 0, totalMerges: 0, maxChainInLevel: 0, frozenCleared: 0,
      usedPowers: false, objectiveProgress: null, levelStars: null, turnsWithoutMerge: 0,
    })
  },

  startLevel: (level) => {
    const board = makeInitialBoard(level)
    const objectiveProgress = computeObjectiveProgress(level.objective, board, 0, 0, 0, 0, 0)
    set({
      mode: 'level', board, score: 0, isGameOver: false, isLevelComplete: false,
      previousBoard: null, previousScore: 0, currentLevel: level,
      turnCount: 0, totalMerges: 0, maxChainInLevel: 0, frozenCleared: 0,
      usedPowers: false, objectiveProgress, levelStars: null, turnsWithoutMerge: 0,
    })
  },

  swipe: (direction) => {
    const {
      board, score, bestScore, isGameOver: over, isLevelComplete,
      currentLevel, mode, totalMerges, maxChainInLevel, frozenCleared,
      turnsWithoutMerge, turnCount,
    } = get()

    if (over || isLevelComplete) return

    // 1. Apply swipe
    const swipeResult = applySwipe(board, direction)
    if (!swipeResult.moved) return

    let workingBoard = swipeResult.newBoard
    let earnedPoints = swipeResult.pointsEarned
    let mergeCount = swipeResult.mergesCount

    // 2. Apply BURNING effects (destroy lowest adjacent tile)
    const burningResult = applyBurningEffects(workingBoard, swipeResult.mergedPositions)
    workingBoard = burningResult.newBoard
    earnedPoints += burningResult.additionalPoints

    // 3. Apply ELECTRIC cascade
    const electricResult = applyElectricEffects(workingBoard, swipeResult.mergedPositions)
    workingBoard = electricResult.newBoard
    earnedPoints += electricResult.additionalPoints
    mergeCount += electricResult.additionalMerges

    // 4. Spawn new tile
    const arc = mode === 'level' ? getArcForLevel(currentLevel) : undefined
    const newTurnsWithoutMerge = mergeCount > 0 ? 0 : turnsWithoutMerge + 1
    workingBoard = spawnNewTile(workingBoard, {
      arc,
      turnCount,
      turnsWithoutMerge: newTurnsWithoutMerge,
    })

    // 5. Apply turn-end effects (FRAGILE countdown, INFECTED spread, reset flags)
    const turnEndResult = applyTurnEndEffects(workingBoard)
    workingBoard = turnEndResult.newBoard

    const gameOver = isGameOver(workingBoard)
    const newScore = score + earnedPoints
    const newTotalMerges = totalMerges + mergeCount
    const newMaxChain = Math.max(maxChainInLevel, swipeResult.chainLength)
    const newTurnCount = turnCount + 1

    let objectiveProgress = get().objectiveProgress
    let newIsLevelComplete = false
    let levelStars: StarResult | null = null

    if (mode === 'level' && currentLevel) {
      objectiveProgress = computeObjectiveProgress(
        currentLevel.objective, workingBoard, newScore,
        newTotalMerges, newMaxChain, frozenCleared, newTurnCount
      )
      newIsLevelComplete = objectiveProgress.completed
      if (newIsLevelComplete) {
        levelStars = calculateStars(true, get().usedPowers, newTurnCount, currentLevel.parTurns)
      }
    }

    set({
      board: workingBoard,
      score: newScore,
      bestScore: Math.max(newScore, bestScore),
      isGameOver: gameOver,
      isLevelComplete: newIsLevelComplete,
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
        currentLevel.objective, previousBoard, previousScore,
        get().totalMerges, get().maxChainInLevel, get().frozenCleared, get().turnCount - 1
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
