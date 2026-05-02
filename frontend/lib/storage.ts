'use client'

const DB_NAME = 'pokerlab'
const STORE_NAME = 'hands'

let db: IDBDatabase | null = null

async function initDB(): Promise<IDBDatabase> {
  if (db) return db
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
      store.createIndex('savedAt', 'savedAt', { unique: false })
    }
    req.onsuccess = () => {
      db = req.result
      resolve(db)
    }
    req.onerror = () => reject(req.error)
  })
}

export interface SavedPlayer {
  position: string
  stack?: number
  is_hero: boolean
}

export interface SavedAction {
  player: string
  action_type: string
  amount?: number
}

export interface SavedDecision {
  street: 'preflop' | 'flop' | 'turn' | 'river' | string
  hero_action: string
  amount?: number
  severity: 'critical' | 'warning' | 'good'
  headline?: string
  mistake_summary?: string
  why_bad?: string[]
  what_to_do?: string
  key_concept?: string
  ev_comparison?: any
}

export interface SavedHand {
  id: string
  savedAt: string
  imageFileName: string
  imageData?: string
  hand_id: string
  blinds: string
  pot_size?: number
  hero_cards: string[]
  board_cards: string[]
  players?: SavedPlayer[]
  actions?: SavedAction[]
  winner?: string
  winning_pot?: number
  severity: 'critical' | 'warning' | 'good'
  headline: string
  mistake_summary: string
  why_bad?: string[]
  what_to_do?: string
  key_concept?: string
  detail?: string
  ev_comparison?: any
  street_equities?: any[]
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

export async function saveHand(result: any, fileName: string, imageFile?: File): Promise<SavedHand> {
  let imageData: string | undefined

  if (imageFile) {
    imageData = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(imageFile)
    })
  }

  const hand: SavedHand = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    imageFileName: fileName,
    imageData,
    hand_id: result.hand_id ?? 'unknown',
    blinds: result.blinds ?? '',
    pot_size: result.pot_size,
    hero_cards: result.hero_cards ?? [],
    board_cards: result.board_cards ?? [],
    players: result.players,
    actions: result.actions,
    winner: result.winner,
    winning_pot: result.winning_pot,
    severity: result.severity ?? 'warning',
    headline: result.headline ?? '',
    mistake_summary: result.mistake_summary ?? '',
    why_bad: result.why_bad,
    what_to_do: result.what_to_do,
    key_concept: result.key_concept,
    detail: result.detail,
    ev_comparison: result.ev_comparison,
    street_equities: result.street_equities,
    decisions: (result.decisions ?? []).map((d: any) => ({
      street: d.street ?? 'unknown',
      hero_action: d.hero_action ?? '',
      amount: d.amount,
      severity: d.severity ?? 'warning',
      headline: d.headline,
      mistake_summary: d.mistake_summary,
      why_bad: d.why_bad,
      what_to_do: d.what_to_do,
      key_concept: d.key_concept,
      ev_comparison: d.ev_comparison,
    })),
  }

  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORE_NAME], 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.add(hand)
    req.onsuccess = () => {
      const history = loadHistory()
      history.unshift(hand)
      localStorage.setItem(KEY, JSON.stringify(history.slice(0, 200)))
      resolve(hand)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function getHand(id: string): Promise<SavedHand | null> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORE_NAME], 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(id)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

export function clearHistory() {
  localStorage.removeItem(KEY)
}

export function importHistory(hands: SavedHand[]) {
  const existing = loadHistory()
  const existingIds = new Set(existing.map(h => h.id))
  const newHands = hands.filter(h => !existingIds.has(h.id))
  const merged = [...newHands, ...existing]
  localStorage.setItem(KEY, JSON.stringify(merged.slice(0, 200)))
  return newHands.length
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
