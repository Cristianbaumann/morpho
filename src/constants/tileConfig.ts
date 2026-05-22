export const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  1:  { bg: '#eee4da', text: '#776e65' },
  2:  { bg: '#ede0c8', text: '#776e65' },
  3:  { bg: '#f2b179', text: '#f9f6f2' },
  4:  { bg: '#f59563', text: '#f9f6f2' },
  5:  { bg: '#f67c5f', text: '#f9f6f2' },
  6:  { bg: '#f65e3b', text: '#f9f6f2' },
  7:  { bg: '#edcf72', text: '#f9f6f2' },
  8:  { bg: '#edcc61', text: '#f9f6f2' },
  9:  { bg: '#edc850', text: '#f9f6f2' },
  10: { bg: '#edc53f', text: '#f9f6f2' },
  11: { bg: '#edc22e', text: '#f9f6f2' },
  12: { bg: '#3c3a32', text: '#f9f6f2' },
  13: { bg: '#1a1a2e', text: '#f9f6f2' },
  14: { bg: '#16213e', text: '#f9f6f2' },
  15: { bg: '#0f3460', text: '#f9f6f2' },
  16: { bg: '#533483', text: '#f9f6f2' },
  17: { bg: '#6a1e4f', text: '#f9f6f2' },
  18: { bg: '#ff6b6b', text: '#f9f6f2' },
}

export const STATE_BORDER_COLORS: Record<string, string> = {
  FROZEN:   '#74b9ff',
  BURNING:  '#e17055',
  CHAINED:  '#636e72',
  GOLDEN:   '#fdcb6e',
  INFECTED: '#55efc4',
  ELECTRIC: '#0984e3',
  FRAGILE:  '#dfe6e9',
  CHEST:    '#ffeaa7',
}

export const CELL_GAP = 6
export const BOARD_PADDING = 12
export const MAX_CELL_SIZE = 72
export const MIN_CELL_SIZE = 44
