import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator,
} from 'react-native'
import {
  PanGestureHandler, PanGestureHandlerGestureEvent, State,
} from 'react-native-gesture-handler'
import { router, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Board } from '../../src/components/Board/Board'
import { ObjectiveBar } from '../../src/components/UI/ObjectiveBar'
import { useGameStore } from '../../src/store/gameStore'
import { usePlayerStore } from '../../src/store/playerStore'
import { getLevel } from '../../src/engine/levelGenerator'
import { Direction } from '../../src/engine/tiles'
import { starsToCoins } from '../../src/engine/levelSystem'

const SWIPE_THRESHOLD = 30

export default function LevelScreen() {
  const { levelId } = useLocalSearchParams<{ levelId: string }>()
  const id = parseInt(levelId ?? '1', 10)

  const {
    board, score, isGameOver, isLevelComplete,
    currentLevel, turnCount, objectiveProgress, levelStars,
    startLevel, swipe, undo, resetGame,
  } = useGameStore()

  const { lives, spendLife, saveLevelResult } = usePlayerStore()
  const [lifeLost, setLifeLost] = useState(false)
  const [rewardClaimed, setRewardClaimed] = useState(false)

  useEffect(() => {
    const level = getLevel(id)
    startLevel(level)
    setLifeLost(false)
    setRewardClaimed(false)
  }, [id])

  useEffect(() => {
    if (isGameOver && !lifeLost) {
      spendLife()
      setLifeLost(true)
    }
  }, [isGameOver])

  useEffect(() => {
    if (isLevelComplete && levelStars && !rewardClaimed) {
      const coins = starsToCoins(levelStars)
      saveLevelResult(id, levelStars, score, coins)
      setRewardClaimed(true)
    }
  }, [isLevelComplete])

  function handleGesture(e: PanGestureHandlerGestureEvent) {
    const { translationX, translationY, state } = e.nativeEvent
    if (state !== State.END) return
    const absX = Math.abs(translationX)
    const absY = Math.abs(translationY)
    if (Math.max(absX, absY) < SWIPE_THRESHOLD) return
    const dir: Direction = absX > absY
      ? (translationX > 0 ? 'RIGHT' : 'LEFT')
      : (translationY > 0 ? 'DOWN' : 'UP')
    swipe(dir)
  }

  if (!currentLevel) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#776e65" />
      </View>
    )
  }

  const starStr = levelStars
    ? Array.from({ length: 3 }, (_, i) => (i < levelStars ? '⭐' : '☆')).join('')
    : ''

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Levels</Text>
        </TouchableOpacity>
        <Text style={styles.levelTitle}>
          Level {id}{currentLevel.isMilestone ? ' 🏆' : ''}
        </Text>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
      </View>

      {objectiveProgress && (
        <ObjectiveBar
          objective={currentLevel.objective}
          progress={objectiveProgress}
          turnCount={turnCount}
          parTurns={currentLevel.parTurns}
        />
      )}

      <PanGestureHandler onHandlerStateChange={handleGesture}>
        <View style={styles.boardWrapper}>
          <Board board={board} />
        </View>
      </PanGestureHandler>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={undo}>
          <Text style={styles.btnText}>↩ Undo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={resetGame}>
          <Text style={styles.btnText}>↺ Restart</Text>
        </TouchableOpacity>
      </View>

      {/* Game Over Modal */}
      <Modal transparent visible={isGameOver} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>💀 Failed</Text>
            <Text style={styles.modalScore}>Score: {score}</Text>
            <Text style={styles.livesText}>❤️ {lives} lives remaining</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => {
                  setLifeLost(false)
                  resetGame()
                }}
              >
                <Text style={styles.modalBtnText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => router.back()}
              >
                <Text style={styles.modalBtnText}>Levels</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Level Complete Modal */}
      <Modal transparent visible={isLevelComplete} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>✨ Complete!</Text>
            <Text style={styles.stars}>{starStr}</Text>
            <Text style={styles.modalScore}>Score: {score}</Text>
            {levelStars && (
              <Text style={styles.coinsEarned}>+{starsToCoins(levelStars)} 🪙</Text>
            )}
            <View style={styles.modalButtons}>
              {id < 10 && (
                <TouchableOpacity
                  style={styles.modalBtn}
                  onPress={() => router.replace(`/game/${id + 1}`)}
                >
                  <Text style={styles.modalBtnText}>Next Level →</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => router.back()}
              >
                <Text style={styles.modalBtnText}>Levels</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#faf8ef' },
  container: { flex: 1, backgroundColor: '#faf8ef', paddingTop: 56, alignItems: 'center', paddingHorizontal: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  backBtn: { padding: 4 },
  backText: { fontSize: 14, color: '#776e65', fontWeight: '600' },
  levelTitle: { fontSize: 20, fontWeight: '900', color: '#776e65' },
  scoreBox: { backgroundColor: '#bbada0', borderRadius: 6, padding: 8, minWidth: 64, alignItems: 'center' },
  scoreLabel: { fontSize: 9, fontWeight: '700', color: '#eee4da', letterSpacing: 1 },
  scoreValue: { fontSize: 16, fontWeight: '700', color: '#f9f6f2' },
  boardWrapper: { marginTop: 8 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  btn: { backgroundColor: '#8f7a66', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  btnText: { color: '#f9f6f2', fontWeight: '700', fontSize: 13 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: '#faf8ef', borderRadius: 16, padding: 32, alignItems: 'center', gap: 10, width: 290 },
  modalTitle: { fontSize: 30, fontWeight: '900', color: '#776e65' },
  stars: { fontSize: 28, letterSpacing: 4 },
  modalScore: { fontSize: 18, color: '#776e65' },
  coinsEarned: { fontSize: 18, color: '#edcf72', fontWeight: '700' },
  livesText: { fontSize: 15, color: '#a09488' },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' },
  modalBtn: { backgroundColor: '#f65e3b', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12 },
  modalBtnSecondary: { backgroundColor: '#8f7a66' },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
})
