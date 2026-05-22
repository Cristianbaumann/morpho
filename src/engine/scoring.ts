const BASE_POINTS: Record<number, number> = {
  1: 10,
  2: 20,
  3: 40,
  4: 80,
  5: 160,
  6: 320,
  7: 640,
  8: 1280,
  9: 2560,
  10: 5120,
  11: 10240,
  12: 20480,
  13: 40960,
  14: 81920,
  15: 163840,
  16: 327680,
  17: 655360,
  18: 1310720,
}

export function computePoints(level: number): number {
  return BASE_POINTS[level] ?? BASE_POINTS[18]
}

export function computeComboMultiplier(chainLength: number): number {
  return 1 + (chainLength - 1) * 0.5
}
