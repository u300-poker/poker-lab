'use client'

export interface SavedHand {
  id: string
  savedAt: string
  imageFileName: string
  hand_id: string
  blinds: string
  hero_cards: string[]
  board_cards: string[]
  severity: 'critical' | 'warning' | 'good'
  headline: string
  mistake_summary: string
  ev_comparison?: any
}

const KEY = 'pokerlab_history'

export function loadHistory(): SavedHand[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveHand(result: any, fileName: string): SavedHand {
  const hand: SavedHand = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    imageFileName: fileName,
    hand_id: result.hand_id ?? 'unknown',
    blinds: result.blinds ?? '',
    hero_cards: result.hero_cards ?? [],
    board_cards: result.board_cards ?? [],
    severity: result.severity ?? 'warning',
    headline: result.headline ?? '',
    mistake_summary: result.mistake_summary ?? '',
    ev_comparison: result.ev_comparison,
  }
  const history = loadHistory()
  history.unshift(hand)
  localStorage.setItem(KEY, JSON.stringify(history.slice(0, 200)))
  return hand
}

export function clearHistory() {
  localStorage.removeItem(KEY)
}

export function summarizeHistory(history: SavedHand[]) {
  const total = history.length
  if (total === 0) return null

  const counts = { critical: 0, warning: 0, good: 0 }
  for (const h of history) counts[h.severity]++

  const goodRate = Math.round((counts.good / total) * 100)
  const criticalRate = Math.round((counts.critical / total) * 100)

  return { total, counts, goodRate, criticalRate }
}
