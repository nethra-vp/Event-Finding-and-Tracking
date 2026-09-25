import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params
  if (!/^[a-f0-9]{48}$/.test(token)) return NextResponse.json({ error: { code: 'INVALID_INVITE', message: 'Invite link is invalid.' } }, { status: 404 })

  try {
    const database = await getDatabase()
    const tokenHash = createHash('sha256').update(token).digest('hex')
    const invite = await database.collection('invites').findOneAndUpdate({ tokenHash }, { $inc: { clickCount: 1 }, $set: { lastClickedAt: new Date() } }, { returnDocument: 'after' })
    if (!invite) return NextResponse.json({ error: { code: 'INVITE_NOT_FOUND', message: 'Invite link is no longer available.' } }, { status: 404 })
    return NextResponse.json({ data: { eventId: invite.eventId, clickCount: invite.clickCount } })
  } catch {
    return NextResponse.json({ error: { code: 'DATABASE_UNAVAILABLE', message: 'Invite tracking is unavailable.' } }, { status: 503 })
  }
}