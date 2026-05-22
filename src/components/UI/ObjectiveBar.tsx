import { View, Text, StyleSheet } from 'react-native'
import { LevelObjective, ObjectiveProgress, getObjectiveLabel } from '../../engine/levelSystem'

interface Props {
  objective: LevelObjective
  progress: ObjectiveProgress
  turnCount: number
  parTurns: number
}

export function ObjectiveBar({ objective, progress, turnCount, parTurns }: Props) {
  const pct = Math.min(1, progress.current / progress.target)

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.label}>{getObjectiveLabel(objective)}</Text>
        <Text style={styles.turns}>Turn {turnCount} / par {parTurns}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(pct * 100)}%` }]} />
      </View>
      <Text style={styles.progress}>
        {progress.current} / {progress.target}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 4,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#776e65',
    flex: 1,
  },
  turns: {
    fontSize: 12,
    color: '#a09488',
  },
  track: {
    height: 8,
    backgroundColor: '#d3cdc8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#f65e3b',
    borderRadius: 4,
  },
  progress: {
    fontSize: 11,
    color: '#a09488',
    textAlign: 'right',
  },
})
