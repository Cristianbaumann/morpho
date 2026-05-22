import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { usePlayerStore } from '../src/store/playerStore'

export default function RootLayout() {
  const load = usePlayerStore((s) => s.load)
  const checkLifeRecharge = usePlayerStore((s) => s.checkLifeRecharge)

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const interval = setInterval(checkLifeRecharge, 60_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  )
}
