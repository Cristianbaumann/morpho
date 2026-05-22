import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Tile } from '../../engine/tiles'
import { TILE_COLORS, STATE_BORDER_COLORS } from '../../constants/tileConfig'

interface Props {
  tile: Tile
  size: number
}

export function TileView({ tile, size }: Props) {
  const colors = TILE_COLORS[tile.level] ?? { bg: '#3c3a32', text: '#f9f6f2' }
  const borderColor = STATE_BORDER_COLORS[tile.state]

  const label =
    tile.state === 'FROZEN' ? `❄ ${tile.level}` :
    tile.state === 'BURNING' ? `🔥 ${tile.level}` :
    tile.state === 'GOLDEN' ? `⭐ ${tile.level}` :
    tile.state === 'ELECTRIC' ? `⚡ ${tile.level}` :
    tile.state === 'INFECTED' ? `🦠 ${tile.level}` :
    tile.state === 'FRAGILE' ? `💎 ${tile.level}` :
    tile.state === 'CHAINED' ? `⛓ ${tile.level}` :
    tile.state === 'CHEST' ? `🎁 ${tile.level}` :
    String(tile.level)

  const fontSize = size < 50 ? 14 : size < 64 ? 18 : 22

  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: size * 0.12,
          backgroundColor: colors.bg,
          borderWidth: borderColor ? 3 : 0,
          borderColor: borderColor ?? 'transparent',
        },
      ]}
    >
      <Text style={[styles.label, { color: colors.text, fontSize }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
  },
})
