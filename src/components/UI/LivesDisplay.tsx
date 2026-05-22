import { View, Text, StyleSheet } from 'react-native'

interface Props {
  lives: number
  max?: number
}

export function LivesDisplay({ lives, max = 5 }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: max }, (_, i) => (
        <Text key={i} style={[styles.heart, i >= lives && styles.empty]}>
          ❤️
        </Text>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 2,
  },
  heart: {
    fontSize: 16,
  },
  empty: {
    opacity: 0.2,
  },
})
