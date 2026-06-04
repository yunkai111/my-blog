import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

const MIME_MAP = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
}

export async function GET(_request, { params }) {
  const { filename } = await params

  // Prevent path traversal
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const filePath = join(UPLOAD_DIR, filename)

  try {
    const s = await stat(filePath)
    if (!s.isFile()) {
      return new NextResponse('Not Found', { status: 404 })
    }

    const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()
    const contentType = MIME_MAP[ext] || 'application/octet-stream'

    const stream = createReadStream(filePath)
    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(s.size),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse('Not Found', { status: 404 })
  }
}
