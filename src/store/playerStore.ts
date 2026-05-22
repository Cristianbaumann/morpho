import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

const MAX_LIVES = 5
const LIFE_RECHARGE_MS = 30 * 60 * 1000

export type LevelSave = {
  stars: number
  bestScore: number
}

interface PlayerState {
  lives: number
  coins: number
  maxUnlockedLevel: number
  levelProgress: Record<number, LevelSave>
  lastLifeRechargeTime: number
  loaded: boolean

  load: () => Promise<void>
  save: () => Promise<void>
  spendLife: () => boolean
  addLife: (count?: number) => void
  addCoins: (amount: number) => void
  spendCoins: (amount: number) => boolean
  saveLevelResult: (levelId: number, stars: number, score: number, coinsEarned: number) => void
  checkLifeRecharge: () => void
}

const STORAGE_KEY = 'morpho_player'

export const usePlayerStore = create<PlayerState>((set, get) => ({
  lives: MAX_LIVES,
  coins: 0,
  maxUnlockedLevel: 1,
  levelProgress: {},
  lastLifeRechargeTime: Date.now(),
  loaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        set({ ...data, loaded: true })
        get().checkLifeRecharge()
      } else {
        set({ loaded: true })
      }
    } catch {
      set({ loaded: true })
    }
  },

  save: async () => {
    const { lives, coins, maxUnlockedLevel, levelProgress, lastLifeRechargeTime } = get()
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ lives, coins, maxUnlockedLevel, levelProgress, lastLifeRechargeTime })
      )
    } catch {}
  },

  checkLifeRecharge: () => {
    const { lives, lastLifeRechargeTime } = get()
    if (lives >= MAX_LIVES) return

    const now = Date.now()
    const elapsed = now - lastLifeRechargeTime
    const livesToAdd = Math.min(MAX_LIVES - lives, Math.floor(elapsed / LIFE_RECHARGE_MS))

    if (livesToAdd > 0) {
      const newLives = Math.min(MAX_LIVES, lives + livesToAdd)
      const newRechargeTime = lastLifeRechargeTime + livesToAdd * LIFE_RECHARGE_MS
      set({ lives: newLives, lastLifeRechargeTime: newRechargeTime })
      get().save()
    }
  },

  spendLife: () => {
    const { lives } = get()
    if (lives <= 0) return false
    const wasAtMax = lives === MAX_LIVES
    set({ lives: lives - 1, lastLifeRechargeTime: wasAtMax ? Date.now() : get().lastLifeRechargeTime })
    get().save()
    return true
  },

  addLife: (count = 1) => {
    const { lives } = get()
    set({ lives: Math.min(MAX_LIVES, lives + count) })
    get().save()
  },

  addCoins: (amount) => {
    set((s) => ({ coins: s.coins + amount }))
    get().save()
  },

  spendCoins: (amount) => {
    const { coins } = get()
    if (coins < amount) return false
    set({ coins: coins - amount })
    get().save()
    return true
  },

  saveLevelResult: (levelId, stars, score, coinsEarned) => {
    const { levelProgress, maxUnlockedLevel } = get()
    const prev = levelProgress[levelId]
    const newProgress: LevelSave = {
      stars: Math.max(prev?.stars ?? 0, stars),
      bestScore: Math.max(prev?.bestScore ?? 0, score),
    }
    set({
      levelProgress: { ...levelProgress, [levelId]: newProgress },
      maxUnlockedLevel: Math.max(maxUnlockedLevel, levelId + 1),
      coins: get().coins + coinsEarned,
    })
    get().save()
  },
}))
