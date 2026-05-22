import { applySwipe, isGameOver } from '../moves'
import { createEmptyBoard } from '../board'
import { createTile } from '../tiles'

function board(rows: number, cols: number, tiles: Array<[number, number, number]>) {
  const b = createEmptyBoard(rows, cols)
  for (const [r, c, level] of tiles) {
    b[r][c] = createTile(level, r, c)
  }
  return b
}

describe('moveLine - LEFT', () => {
  test('merges two equal tiles', () => {
    const b = board(1, 4, [[0, 1, 1], [0, 3, 1]])
    const { newBoard, moved, mergesCount } = applySwipe(b, 'LEFT')
    expect(moved).toBe(true)
    expect(mergesCount).toBe(1)
    expect(newBoard[0][0]?.level).toBe(2)
    expect(newBoard[0][1]).toBeNull()
  })

  test('does not merge different tiles', () => {
    const b = board(1, 4, [[0, 0, 1], [0, 1, 2]])
    const { newBoard, moved } = applySwipe(b, 'LEFT')
    expect(moved).toBe(false)
    expect(newBoard[0][0]?.level).toBe(1)
    expect(newBoard[0][1]?.level).toBe(2)
  })

  test('merges only one pair per turn', () => {
    const b = board(1, 4, [[0, 0, 1], [0, 1, 1], [0, 2, 1], [0, 3, 1]])
    const { newBoard, mergesCount } = applySwipe(b, 'LEFT')
    expect(mergesCount).toBe(2)
    expect(newBoard[0][0]?.level).toBe(2)
    expect(newBoard[0][1]?.level).toBe(2)
  })
})

describe('moveLine - RIGHT', () => {
  test('merges to the right', () => {
    const b = board(1, 4, [[0, 0, 1], [0, 2, 1]])
    const { newBoard, moved } = applySwipe(b, 'RIGHT')
    expect(moved).toBe(true)
    expect(newBoard[0][3]?.level).toBe(2)
  })
})

describe('moveLine - UP', () => {
  test('merges upward', () => {
    const b = board(4, 1, [[1, 0, 1], [3, 0, 1]])
    const { newBoard, moved } = applySwipe(b, 'UP')
    expect(moved).toBe(true)
    expect(newBoard[0][0]?.level).toBe(2)
  })
})

describe('moveLine - DOWN', () => {
  test('merges downward', () => {
    const b = board(4, 1, [[0, 0, 1], [2, 0, 1]])
    const { newBoard, moved } = applySwipe(b, 'DOWN')
    expect(moved).toBe(true)
    expect(newBoard[3][0]?.level).toBe(2)
  })
})

describe('isGameOver', () => {
  test('returns false when board has empty cells', () => {
    const b = board(2, 2, [[0, 0, 1], [0, 1, 2]])
    expect(isGameOver(b)).toBe(false)
  })

  test('returns false when merges are possible', () => {
    const b = board(2, 2, [[0, 0, 1], [0, 1, 1], [1, 0, 2], [1, 1, 3]])
    expect(isGameOver(b)).toBe(false)
  })

  test('returns true when board is full and no merges possible', () => {
    const b = board(2, 2, [[0, 0, 1], [0, 1, 2], [1, 0, 3], [1, 1, 4]])
    expect(isGameOver(b)).toBe(true)
  })
})
