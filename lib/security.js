import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { hitRateLimit } from '@/lib/rate-limit'

function normalizeHost(value) {
  return value?.trim().toLowerCase() ?? ''
}

function stripWww(host) {
  return host.startsWith('www.') ? host.slice(4) : host
}

function hostsMatch(a, b) {
  const na = normalizeHost(a)
  const nb = normalizeHost(b)
  return na === nb || stripWww(na) === stripWww(nb)
}

export function getClientIp(request) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  return 'unknown'
}

export async function getCurrentHost() {
  const requestHeaders = await headers()
  return normalizeHost(requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host'))
}

export function ensureSameOrigin(request) {
  const method = request.method.toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return null
  }

  const origin = request.headers.get('origin')
  const host = normalizeHost(request.headers.get('x-forwarded-host') ?? request.headers.get('host'))

  if (!origin || !host) {
    return NextResponse.json({ error: '请求来源无效。' }, { status: 403 })
  }

  try {
    const originUrl = new URL(origin)
    if (!hostsMatch(originUrl.host, host)) {
      return NextResponse.json({ error: '请求来源无效。' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: '请求来源无效。' }, { status: 403 })
  }

  return null
}

export function enforceRateLimit(request, key, options) {
  const ip = getClientIp(request)
  const result = hitRateLimit(`${key}:${ip}`, options)

  if (!result.limited) {
    return null
  }

  return NextResponse.json(
    { error: '请求过于频繁，请稍后再试。' },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSeconds),
      },
    }
  )
}
