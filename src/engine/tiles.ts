export type TileState =
  | 'NORMAL'
  | 'FROZEN'
  | 'BURNING'
  | 'CHAINED'
  | 'GOLDEN'
  | 'INFECTED'
  | 'ELECTRIC'
  | 'FRAGILE'
  | 'CHEST'

export type PowerType =
  | 'FREEZE'
  | 'SWAP'
  | 'BOMB'
  | 'MEGA_MERGE'
  | 'UNDO'
  | 'DEFROST'

export type Tile = {
  id: string
  level: number
  state: TileState
  stateData: {
    turnsLeft?: number
    pushesLeft?: number
    containsPower?: PowerType
  }
  position: { row: number; col: number }
  isNew: boolean
  isMerged: boolean
}

export type Direction = 'LEFT' | 'RIGHT' | 'UP' | 'DOWN'

export type Position = { row: number; col: number }

export type TurnState = {
  swipeDirection: Direction | null
  tilesMovedCount: number
  mergesCount: number
  chainLength: number
  pointsEarned: number
  newTilePosition: Position | null
  powerUsed: PowerType | null
}

let _idCounter = 0
export function createTileId(): string {
  return `tile_${++_idCounter}_${Date.now()}`
}

export function createTile(
  level: number,
  row: number,
  col: number,
  state: TileState = 'NORMAL',
  stateData: Tile['stateData'] = {}
): Tile {
  return {
    id: createTileId(),
    level,
    state,
    stateData,
    position: { row, col },
    isNew: true,
    isMerged: false,
  }
}
