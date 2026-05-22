import { LevelConfig } from '../levelSystem'

export const HANDCRAFTED_LEVELS: LevelConfig[] = [
  {
    id: 1,
    boardRows: 6,
    boardCols: 4,
    objective: { type: 'REACH_TILE', targetLevel: 2 },
    parTurns: 4,
    initialTiles: [],
  },
  {
    id: 2,
    boardRows: 6,
    boardCols: 4,
    objective: { type: 'REACH_TILE', targetLevel: 3 },
    parTurns: 8,
    initialTiles: [
      { row: 0, col: 0, level: 1 },
      { row: 5, col: 3, level: 1 },
    ],
  },
  {
    id: 3,
    boardRows: 6,
    boardCols: 4,
    objective: { type: 'TOTAL_MERGES', count: 3 },
    parTurns: 10,
    initialTiles: [
      { row: 1, col: 1, level: 1 },
      { row: 1, col: 2, level: 1 },
    ],
  },
  {
    id: 4,
    boardRows: 6,
    boardCols: 4,
    objective: { type: 'REACH_TILE', targetLevel: 4 },
    parTurns: 14,
    initialTiles: [
      { row: 0, col: 0, level: 2 },
      { row: 5, col: 3, level: 1 },
      { row: 2, col: 2, level: 1 },
    ],
  },
  {
    id: 5,
    boardRows: 6,
    boardCols: 4,
    objective: { type: 'SCORE', targetScore: 200 },
    parTurns: 12,
    initialTiles: [
      { row: 0, col: 0, level: 1 },
      { row: 0, col: 1, level: 2 },
      { row: 5, col: 2, level: 1 },
    ],
  },
  {
    id: 6,
    boardRows: 6,
    boardCols: 4,
    objective: { type: 'CHAIN_MERGES', chainLength: 2 },
    parTurns: 10,
    initialTiles: [
      { row: 0, col: 0, level: 1 },
      { row: 0, col: 2, level: 1 },
      { row: 3, col: 1, level: 2 },
      { row: 3, col: 2, level: 2 },
    ],
  },
  {
    id: 7,
    boardRows: 6,
    boardCols: 4,
    objective: { type: 'TOTAL_MERGES', count: 5 },
    parTurns: 15,
    initialTiles: [
      { row: 0, col: 0, level: 1 },
      { row: 0, col: 3, level: 1 },
      { row: 5, col: 0, level: 2 },
      { row: 5, col: 3, level: 2 },
    ],
  },
  {
    id: 8,
    boardRows: 6,
    boardCols: 4,
    objective: { type: 'REACH_TILE', targetLevel: 5 },
    parTurns: 18,
    initialTiles: [
      { row: 0, col: 0, level: 3 },
      { row: 0, col: 2, level: 2 },
      { row: 5, col: 1, level: 2 },
      { row: 5, col: 3, level: 1 },
    ],
  },
  {
    id: 9,
    boardRows: 6,
    boardCols: 4,
    objective: { type: 'SURVIVE_TURNS', turns: 15 },
    parTurns: 15,
    initialTiles: [
      { row: 2, col: 1, level: 1 },
      { row: 2, col: 2, level: 2 },
      { row: 3, col: 1, level: 3 },
    ],
  },
  {
    id: 10,
    boardRows: 6,
    boardCols: 4,
    objective: { type: 'REACH_TILE', targetLevel: 6 },
    parTurns: 22,
    isMilestone: true,
    initialTiles: [
      { row: 0, col: 0, level: 4 },
      { row: 0, col: 3, level: 3 },
      { row: 5, col: 0, level: 2 },
      { row: 5, col: 3, level: 2 },
      { row: 2, col: 1, level: 1 },
    ],
  },
]

export function getHandcraftedLevel(id: number): LevelConfig | undefined {
  return HANDCRAFTED_LEVELS.find((l) => l.id === id)
}
