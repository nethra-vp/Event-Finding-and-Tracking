import { createHash, randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'

export async function POST(request: Request) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign in to invite friends.' } }, { status: 401 })

  let body: { eventId?: unknown }
  try {
    body = await request.json() as typeof body
  } catch {
    return NextResponse.json({ error: { code: 'INVALID_JSON', message: 'Send a valid JSON body.' } }, { status: 400 })
  }
  if (typeof body.eventId !== 'string' || !body.eventId.trim() || body.eventId.length > 200) {
    return NextResponse.json({ error: { code: 'INVALID_EVENT', message: 'Event id is required.' } }, { status: 400 })
  }

  try {
    const database = await getDatabase()
    const token = randomBytes(24).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')
    await database.collection('invites').createIndex({ tokenHash: 1 }, { unique: true })
    await database.collection('invites').insertOne({ tokenHash, eventId: body.eventId.trim(), creatorId: userId, clickCount: 0, createdAt: new Date() })
    return NextResponse.json({ data: { url: `${new URL(request.url).origin}/invite/${token}` } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: { code: 'DATABASE_UNAVAILABLE', message: 'Invite creation is unavailable.' } }, { status: 503 })
  }
}