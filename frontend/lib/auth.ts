'use client'

const KEY = 'pokerlab_user'

export interface DummyUser {
  name: string
  email: string
}

export function getUser(): DummyUser | null {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null')
  } catch {
    return null
  }
}

export function login(name: string, email: string): DummyUser {
  const user = { name, email }
  localStorage.setItem(KEY, JSON.stringify(user))
  return user
}

export function logout() {
  localStorage.removeItem(KEY)
}
