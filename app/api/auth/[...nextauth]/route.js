import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ensureSameOrigin } from '@/lib/security'

const handler = NextAuth(authOptions)

export async function GET(request, context) {
  return handler(request, context)
}

export async function POST(request, context) {
  const originError = ensureSameOrigin(request)
  if (originError) {
    return originError
  }

  return handler(request, context)
}
