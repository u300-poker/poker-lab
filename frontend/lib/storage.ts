'use client'

export interface SavedDecision {
  street: 'preflop' | 'flop' | 'turn' | 'river' | string
  hero_action: string
  severity: 'critical' | 'warning' | 'good'
  key_concept: string
}

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
  decisions?: SavedDecision[]
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
    decisions: (result.decisions ?? []).map((d: any) => ({
      street: d.street ?? 'unknown',
      hero_action: d.hero_action ?? '',
      severity: d.severity ?? 'warning',
      key_concept: d.key_concept ?? '',
    })),
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

export function byStreet(history: SavedHand[]) {
  const streets = ['preflop', 'flop', 'turn', 'river']
  const result: Record<string, { critical: number; warning: number; good: number }> = {}
  for (const s of streets) result[s] = { critical: 0, warning: 0, good: 0 }

  for (const hand of history) {
    for (const d of hand.decisions ?? []) {
      const street = streets.includes(d.street) ? d.street : null
      if (!street) continue
      result[street][d.severity]++
    }
  }
  return streets.map(s => ({ street: s, ...result[s] }))
}

export function byAction(history: SavedHand[]) {
  const counts: Record<string, { critical: number; warning: number; good: number }> = {}

  for (const hand of history) {
    for (const d of hand.decisions ?? []) {
      const action = d.hero_action || 'Unknown'
      if (!counts[action]) counts[action] = { critical: 0, warning: 0, good: 0 }
      counts[action][d.severity]++
    }
  }
  return Object.entries(counts).map(([action, c]) => ({ action, ...c }))
}

export function byKeyword(history: SavedHand[]) {
  const counts: Record<string, number> = {}

  for (const hand of history) {
    for (const d of hand.decisions ?? []) {
      if (!d.key_concept) continue
      counts[d.key_concept] = (counts[d.key_concept] ?? 0) + 1
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([concept, count]) => ({ concept, count }))
}
