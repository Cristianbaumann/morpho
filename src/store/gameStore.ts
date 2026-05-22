import { create } from 'zustand'
import { Board, createEmptyBoard, BOARD_ROWS, BOARD_COLS } from '../engine/board'
import { Direction, PowerType } from '../engine/tiles'
import { applySwipe, isGameOver } from '../engine/moves'
import { spawnNewTile, spawnInitialTiles } from '../engine/tileSpawner'

interface GameState {
  board: Board
  score: number
  bestScore: number
  isGameOver: boolean
  previousBoard: Board | null
  previousScore: number

  startGame: () => void
  swipe: (direction: Direction) => void
  undo: () => void
  resetGame: () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  board: createEmptyBoard(BOARD_ROWS, BOARD_COLS),
  score: 0,
  bestScore: 0,
  isGameOver: false,
  previousBoard: null,
  previousScore: 0,

  startGame: () => {
    const emptyBoard = createEmptyBoard(BOARD_ROWS, BOARD_COLS)
    const board = spawnInitialTiles(emptyBoard, 2)
    set({ board, score: 0, isGameOver: false, previousBoard: null, previousScore: 0 })
  },

  swipe: (direction) => {
    const { board, score, bestScore } = get()
    if (get().isGameOver) return

    const result = applySwipe(board, direction)
    if (!result.moved) return

    const boardWithNewTile = spawnNewTile(result.newBoard)
    const gameOver = isGameOver(boardWithNewTile)
    const newScore = score + result.pointsEarned

    set({
      previousBoard: board,
      previousScore: score,
      board: boardWithNewTile,
      score: newScore,
      bestScore: Math.max(newScore, bestScore),
      isGameOver: gameOver,
    })
  },

  undo: () => {
    const { previousBoard, previousScore } = get()
    if (!previousBoard) return
    set({
      board: previousBoard,
      score: previousScore,
      previousBoard: null,
      isGameOver: false,
    })
  },

  resetGame: () => {
    const emptyBoard = createEmptyBoard(BOARD_ROWS, BOARD_COLS)
    const board = spawnInitialTiles(emptyBoard, 2)
    set({ board, score: 0, isGameOver: false, previousBoard: null, previousScore: 0 })
  },
}))
