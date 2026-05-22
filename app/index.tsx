import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { usePlayerStore } from '../src/store/playerStore'

export default function MenuScreen() {
  const { lives, coins, loaded } = usePlayerStore()

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Text style={styles.title}>Morpho</Text>
      <Text style={styles.tagline}>Merge. Evolve. Morpho.</Text>

      <View style={styles.stats}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>❤️ Lives</Text>
          <Text style={styles.statValue}>{loaded ? lives : '—'}/5</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>🪙 Coins</Text>
          <Text style={styles.statValue}>{loaded ? coins : '—'}</Text>
        </View>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={() => router.push('/game/levels')}
        >
          <Text style={styles.btnPrimaryText}>📋 Level Mode</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => router.push('/game/free')}
        >
          <Text style={styles.btnSecondaryText}>♾️ Free Mode</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>v0.1.0 — Week 2</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8ef',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 56,
    fontWeight: '900',
    color: '#776e65',
    letterSpacing: -2,
  },
  tagline: {
    fontSize: 16,
    color: '#a09488',
    marginBottom: 40,
    fontStyle: 'italic',
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 48,
  },
  statBox: {
    backgroundColor: '#bbada0',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    minWidth: 100,
  },
  statLabel: {
    fontSize: 12,
    color: '#eee4da',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f9f6f2',
    marginTop: 2,
  },
  buttons: {
    width: '100%',
    gap: 14,
  },
  btn: {
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: '#f65e3b',
  },
  btnPrimaryText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  btnSecondary: {
    backgroundColor: '#8f7a66',
  },
  btnSecondaryText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f9f6f2',
  },
  version: {
    position: 'absolute',
    bottom: 24,
    fontSize: 12,
    color: '#ccc0b3',
  },
})
