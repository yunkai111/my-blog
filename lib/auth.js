import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { z } from 'zod'
import { checkLoginRateLimit, clearLoginRateLimit } from '@/lib/auth-rate-limit'
import { prisma } from '@/lib/prisma'
import { getClientIp } from '@/lib/security'

const credentialsSchema = z.object({
  username: z.string().trim().min(1).max(255),
  password: z.string().min(8).max(128),
})

export const authOptions = {
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 8,
  },
  pages: {
    signIn: '/admin/login',
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) {
          return null
        }

        const username = parsed.data.username.trim()
        const configuredName = process.env.ADMIN_NAME?.trim()
        const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
        if (!configuredName || !configuredEmail) {
          return null
        }

        if (username.toLowerCase() !== configuredName.toLowerCase()) {
          return null
        }

        const ip = getClientIp({
          headers: {
            get(name) {
              const key = name.toLowerCase()
              const value = request?.headers?.[key]
              return typeof value === 'string' ? value : null
            },
          },
        })

        const rateLimit = checkLoginRateLimit({ ip, username })
        if (rateLimit.limited) {
          throw new Error('登录过于频繁，请稍后再试。')
        }

        const user = await prisma.user.findUnique({ where: { email: configuredEmail } })
        if (!user) {
          return null
        }

        const isValid = await compare(parsed.data.password, user.passwordHash)
        if (!isValid) {
          return null
        }

        clearLoginRateLimit(rateLimit.key)

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub
        session.user.email = token.email
        session.user.name = token.name
      }
      return session
    },
  },
}

export function authHandler() {
  return NextAuth(authOptions)
}
