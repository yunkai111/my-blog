import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(request) {
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next()
    }

    return NextResponse.next()
  },
  {
    pages: {
      signIn: '/admin/login',
    },
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname === '/admin/login') {
          return true
        }

        return Boolean(token)
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*'],
}
