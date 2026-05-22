import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Tile } from '../../engine/tiles'
import { TILE_COLORS, STATE_BORDER_COLORS } from '../../constants/tileConfig'

interface Props {
  tile: Tile
  size: number
}

const STATE_ICONS: Record<string, string> = {
  FROZEN: '❄',
  BURNING: '🔥',
  CHAINED: '⛓',
  GOLDEN: '⭐',
  INFECTED: '🦠',
  ELECTRIC: '⚡',
  FRAGILE: '💎',
  CHEST: '🎁',
}

export function TileView({ tile, size }: Props) {
  const colors = TILE_COLORS[tile.level] ?? { bg: '#3c3a32', text: '#f9f6f2' }
  const borderColor = STATE_BORDER_COLORS[tile.state]
  const icon = STATE_ICONS[tile.state]
  const fontSize = size < 50 ? 14 : size < 64 ? 18 : 22
  const iconSize = size < 50 ? 10 : 12

  // Counter badge for FRAGILE, INFECTED, CHAINED
  let badge: string | null = null
  if (tile.state === 'FRAGILE' && tile.stateData.turnsLeft !== undefined) {
    badge = String(tile.stateData.turnsLeft)
  } else if (tile.state === 'INFECTED' && tile.stateData.turnsLeft !== undefined) {
    badge = String(tile.stateData.turnsLeft)
  } else if (tile.state === 'CHAINED' && tile.stateData.pushesLeft !== undefined) {
    badge = String(tile.stateData.pushesLeft)
  }

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
      {icon && (
        <Text style={[styles.icon, { fontSize: iconSize }]}>{icon}</Text>
      )}
      <Text style={[styles.label, { color: colors.text, fontSize }]}>
        {tile.level}
      </Text>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    top: 3,
    left: 4,
  },
  label: {
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    bottom: 3,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '700',
  },
})
