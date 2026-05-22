import React from 'react'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import { Board as BoardType } from '../../engine/board'
import { TileView } from './TileView'
import {
  CELL_GAP,
  BOARD_PADDING,
  MAX_CELL_SIZE,
  MIN_CELL_SIZE,
} from '../../constants/tileConfig'

interface Props {
  board: BoardType
}

export function Board({ board }: Props) {
  const { width } = useWindowDimensions()
  const cols = board[0]?.length ?? 5
  const rows = board.length

  let cellSize = Math.floor((width - BOARD_PADDING * 2 - CELL_GAP * (cols - 1)) / cols)
  cellSize = Math.min(cellSize, MAX_CELL_SIZE)
  if (cellSize < MIN_CELL_SIZE) cellSize = MIN_CELL_SIZE

  const boardWidth = cellSize * cols + CELL_GAP * (cols - 1) + BOARD_PADDING * 2
  const boardHeight = cellSize * rows + CELL_GAP * (rows - 1) + BOARD_PADDING * 2

  return (
    <View style={[styles.container, { width: boardWidth, height: boardHeight }]}>
      {board.map((row, r) =>
        row.map((cell, c) => (
          <View
            key={`${r}-${c}`}
            style={[
              styles.cell,
              {
                width: cellSize,
                height: cellSize,
                left: BOARD_PADDING + c * (cellSize + CELL_GAP),
                top: BOARD_PADDING + r * (cellSize + CELL_GAP),
                borderRadius: cellSize * 0.12,
              },
            ]}
          >
            {cell && <TileView tile={cell} size={cellSize} />}
          </View>
        ))
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#bbada0',
    borderRadius: 8,
    position: 'relative',
  },
  cell: {
    position: 'absolute',
    backgroundColor: 'rgba(238,228,218,0.35)',
  },
})
