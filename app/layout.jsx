import { Providers } from '@/components/providers'
import './globals.css'

export const metadata = {
  title: 'Yunkai Blog',
  description: '一个逐步生长的个人博客。',
  icons: {
    icon: '/favicon.ico?v=2',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
