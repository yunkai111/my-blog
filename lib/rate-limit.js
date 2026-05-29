import 'server-only'

const buckets = new Map()

function now() {
  return Date.now()
}

function getWindowBucket(key, windowMs) {
  const current = buckets.get(key)
  const currentTime = now()

  if (!current || current.resetAt <= currentTime) {
    const next = {
      count: 0,
      resetAt: currentTime + windowMs,
    }
    buckets.set(key, next)
    return next
  }

  return current
}

export function hitRateLimit(key, { limit, windowMs }) {
  const bucket = getWindowBucket(key, windowMs)
  bucket.count += 1

  return {
    limited: bucket.count > limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now()) / 1000)),
  }
}

export function clearRateLimit(key) {
  buckets.delete(key)
}
