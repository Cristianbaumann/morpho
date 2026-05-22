import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native'
import { router } from 'expo-router'
import { usePlayerStore } from '../../src/store/playerStore'

const TOTAL_LEVELS = 10

function StarDisplay({ stars, max = 3 }: { stars: number; max?: number }) {
  return (
    <Text style={{ fontSize: 12 }}>
      {Array.from({ length: max }, (_, i) => (i < stars ? '⭐' : '☆')).join('')}
    </Text>
  )
}

export default function LevelSelectScreen() {
  const { maxUnlockedLevel, levelProgress, lives } = usePlayerStore()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Levels</Text>
        <Text style={styles.lives}>❤️ {lives}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {Array.from({ length: TOTAL_LEVELS }, (_, i) => {
          const id = i + 1
          const unlocked = id <= maxUnlockedLevel
          const progress = levelProgress[id]
          const stars = progress?.stars ?? 0

          return (
            <Pressable
              key={id}
              style={[styles.levelCard, !unlocked && styles.levelLocked]}
              onPress={() => {
                if (!unlocked) return
                if (lives <= 0) {
                  alert('No lives left! Wait 30 minutes for a recharge.')
                  return
                }
                router.push(`/game/${id}`)
              }}
            >
              {unlocked ? (
                <>
                  <Text style={styles.levelNum}>{id}</Text>
                  <StarDisplay stars={stars} />
                  {progress && (
                    <Text style={styles.bestScore}>{progress.bestScore}</Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.levelNum}>{id}</Text>
                  <Text style={{ fontSize: 20 }}>🔒</Text>
                </>
              )}
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8ef' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#faf8ef',
  },
  backBtn: { padding: 8 },
  backText: { fontSize: 16, color: '#776e65', fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '900', color: '#776e65' },
  lives: { fontSize: 16, fontWeight: '700', color: '#776e65' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
    justifyContent: 'center',
  },
  levelCard: {
    width: 80,
    height: 80,
    backgroundColor: '#bbada0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  levelLocked: {
    backgroundColor: '#d3cdc8',
  },
  levelNum: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f9f6f2',
  },
  bestScore: {
    fontSize: 10,
    color: '#eee4da',
    fontWeight: '600',
  },
})
