import {
  computeObjectiveProgress,
  calculateStars,
  starsToCoins,
  getArc,
} from '../levelSystem'
import { createEmptyBoard } from '../board'
import { createTile } from '../tiles'

function boardWith(tiles: Array<[number, number, number]>) {
  const b = createEmptyBoard(4, 4)
  for (const [r, c, level] of tiles) b[r][c] = createTile(level, r, c)
  return b
}

describe('getArc', () => {
  test('returns correct arcs', () => {
    expect(getArc(1)).toBe(1)
    expect(getArc(30)).toBe(1)
    expect(getArc(31)).toBe(2)
    expect(getArc(60)).toBe(2)
    expect(getArc(100)).toBe(3)
    expect(getArc(300)).toBe(7)
  })
})

describe('computeObjectiveProgress - REACH_TILE', () => {
  test('not completed when max tile below target', () => {
    const b = boardWith([[0, 0, 3], [1, 1, 2]])
    const p = computeObjectiveProgress({ type: 'REACH_TILE', targetLevel: 5 }, b, 0, 0, 0, 0, 0)
    expect(p.completed).toBe(false)
    expect(p.current).toBe(3)
  })

  test('completed when tile reaches target', () => {
    const b = boardWith([[0, 0, 5]])
    const p = computeObjectiveProgress({ type: 'REACH_TILE', targetLevel: 5 }, b, 0, 0, 0, 0, 0)
    expect(p.completed).toBe(true)
  })
})

describe('computeObjectiveProgress - TOTAL_MERGES', () => {
  test('tracks merges correctly', () => {
    const b = createEmptyBoard(4, 4)
    const p = computeObjectiveProgress({ type: 'TOTAL_MERGES', count: 5 }, b, 0, 3, 0, 0, 0)
    expect(p.current).toBe(3)
    expect(p.completed).toBe(false)
  })

  test('completes when count reached', () => {
    const b = createEmptyBoard(4, 4)
    const p = computeObjectiveProgress({ type: 'TOTAL_MERGES', count: 5 }, b, 0, 5, 0, 0, 0)
    expect(p.completed).toBe(true)
  })
})

describe('computeObjectiveProgress - SCORE', () => {
  test('completes when score reached', () => {
    const b = createEmptyBoard(4, 4)
    const p = computeObjectiveProgress({ type: 'SCORE', targetScore: 200 }, b, 250, 0, 0, 0, 0)
    expect(p.completed).toBe(true)
  })
})

describe('calculateStars', () => {
  test('3 stars: completed, no powers, under par', () => {
    expect(calculateStars(true, false, 10, 15)).toBe(3)
  })
  test('2 stars: completed, no powers, over par', () => {
    expect(calculateStars(true, false, 20, 15)).toBe(2)
  })
  test('1 star: completed with powers', () => {
    expect(calculateStars(true, true, 10, 15)).toBe(1)
  })
})

describe('starsToCoins', () => {
  test('correct coin rewards', () => {
    expect(starsToCoins(1)).toBe(10)
    expect(starsToCoins(2)).toBe(20)
    expect(starsToCoins(3)).toBe(40)
  })
})
