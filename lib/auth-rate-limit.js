import 'server-only'
import { clearRateLimit, hitRateLimit } from '@/lib/rate-limit'

const LOGIN_WINDOW_MS = 15 * 60 * 1000
const LOGIN_LIMIT = 5

export function checkLoginRateLimit({ ip, username }) {
  const normalizedUsername = username.trim().toLowerCase()
  const key = `login:${ip}:${normalizedUsername}`
  const result = hitRateLimit(key, {
    limit: LOGIN_LIMIT,
    windowMs: LOGIN_WINDOW_MS,
  })

  return {
    ...result,
    key,
  }
}

export function clearLoginRateLimit(key) {
  clearRateLimit(key)
}
