import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native'
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler'
import { Board } from '../components/Board/Board'
import { useGameStore } from '../store/gameStore'
import { Direction } from '../engine/tiles'

const SWIPE_THRESHOLD = 30

export function GameScreen() {
  const { board, score, bestScore, isGameOver, startGame, swipe, undo, resetGame } =
    useGameStore()

  useEffect(() => {
    startGame()
  }, [])

  const lastDirection = useRef<Direction | null>(null)

  function handleGesture(event: PanGestureHandlerGestureEvent) {
    const { translationX, translationY, state } = event.nativeEvent

    if (state !== State.END) return

    const absX = Math.abs(translationX)
    const absY = Math.abs(translationY)

    if (Math.max(absX, absY) < SWIPE_THRESHOLD) return

    let dir: Direction
    if (absX > absY) {
      dir = translationX > 0 ? 'RIGHT' : 'LEFT'
    } else {
      dir = translationY > 0 ? 'DOWN' : 'UP'
    }

    swipe(dir)
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Morpho</Text>
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

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.btn} onPress={undo}>
            <Text style={styles.btnText}>UNDO</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={resetGame}>
            <Text style={styles.btnText}>NEW GAME</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal transparent visible={isGameOver} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Game Over</Text>
            <Text style={styles.modalScore}>Score: {score}</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={resetGame}>
              <Text style={styles.modalBtnText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
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
  root: { flex: 1, backgroundColor: '#faf8ef' },
  container: { flex: 1, alignItems: 'center', paddingTop: 60, paddingHorizontal: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 },
  title: { fontSize: 40, fontWeight: '900', color: '#776e65' },
  scores: { flexDirection: 'row', gap: 8 },
  scoreBox: { backgroundColor: '#bbada0', borderRadius: 6, padding: 10, minWidth: 72, alignItems: 'center' },
  scoreLabel: { fontSize: 11, fontWeight: '700', color: '#eee4da', letterSpacing: 1 },
  scoreValue: { fontSize: 18, fontWeight: '700', color: '#f9f6f2' },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn: { backgroundColor: '#8f7a66', borderRadius: 6, paddingHorizontal: 20, paddingVertical: 10 },
  btnText: { color: '#f9f6f2', fontWeight: '700', fontSize: 13 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: '#faf8ef', borderRadius: 12, padding: 32, alignItems: 'center', gap: 16 },
  modalTitle: { fontSize: 32, fontWeight: '900', color: '#776e65' },
  modalScore: { fontSize: 20, color: '#776e65' },
  modalBtn: { backgroundColor: '#8f7a66', borderRadius: 8, paddingHorizontal: 32, paddingVertical: 12 },
  modalBtnText: { color: '#f9f6f2', fontWeight: '700', fontSize: 16 },
})
