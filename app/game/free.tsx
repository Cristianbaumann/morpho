import { useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
} from 'react-native'
import {
  PanGestureHandler, PanGestureHandlerGestureEvent, State,
} from 'react-native-gesture-handler'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Board } from '../../src/components/Board/Board'
import { useGameStore } from '../../src/store/gameStore'
import { Direction } from '../../src/engine/tiles'

const SWIPE_THRESHOLD = 30

export default function FreeModeScreen() {
  const { board, score, bestScore, isGameOver, startFreeGame, swipe, undo, resetGame } =
    useGameStore()

  useEffect(() => {
    startFreeGame()
  }, [])

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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Menu</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Free Mode</Text>
        <View style={styles.scores}>
          <ScoreBox label="SCORE" value={score} />
          <ScoreBox label="BEST" value={bestScore} />
        </View>
      </View>

      <PanGestureHandler onHandlerStateChange={handleGesture}>
        <View>
          <Board board={board} />
        </View>
      </PanGestureHandler>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={undo}>
          <Text style={styles.btnText}>↩ Undo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={resetGame}>
          <Text style={styles.btnText}>↺ New Game</Text>
        </TouchableOpacity>
      </View>

      <Modal transparent visible={isGameOver} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Game Over</Text>
            <Text style={styles.modalScore}>Score: {score}</Text>
            {score >= bestScore && score > 0 && (
              <Text style={styles.newRecord}>🏆 New Record!</Text>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtn} onPress={resetGame}>
                <Text style={styles.modalBtnText}>Play Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => router.back()}
              >
                <Text style={styles.modalBtnText}>Menu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

function ScoreBox({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.scoreBox}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <Text style={styles.scoreValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8ef', paddingTop: 56, alignItems: 'center', paddingHorizontal: 12 },
  header: { width: '100%', marginBottom: 12 },
  backBtn: { padding: 4, marginBottom: 8 },
  backText: { fontSize: 15, color: '#776e65', fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '900', color: '#776e65', marginBottom: 8 },
  scores: { flexDirection: 'row', gap: 8 },
  scoreBox: { backgroundColor: '#bbada0', borderRadius: 6, padding: 10, minWidth: 72, alignItems: 'center' },
  scoreLabel: { fontSize: 10, fontWeight: '700', color: '#eee4da', letterSpacing: 1 },
  scoreValue: { fontSize: 18, fontWeight: '700', color: '#f9f6f2' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn: { backgroundColor: '#8f7a66', borderRadius: 8, paddingHorizontal: 22, paddingVertical: 11 },
  btnText: { color: '#f9f6f2', fontWeight: '700', fontSize: 14 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: '#faf8ef', borderRadius: 16, padding: 32, alignItems: 'center', gap: 14, width: 280 },
  modalTitle: { fontSize: 32, fontWeight: '900', color: '#776e65' },
  modalScore: { fontSize: 20, color: '#776e65' },
  newRecord: { fontSize: 16, color: '#f65e3b', fontWeight: '700' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalBtn: { backgroundColor: '#f65e3b', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 },
  modalBtnSecondary: { backgroundColor: '#8f7a66' },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
