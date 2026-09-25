import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { auth } from '@/lib/auth'

const allowedStatuses = new Set(['interested', 'going', 'cancelled'])

type RsvpRequest = { status?: unknown }

export async function PUT(request: Request, context: { params: Promise<{ eventId: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign in to manage plans.' } }, { status: 401 })

  const { eventId } = await context.params
  if (!eventId || eventId.length > 200) return NextResponse.json({ error: { code: 'INVALID_EVENT', message: 'Event id is invalid.' } }, { status: 400 })

  let body: RsvpRequest
  try {
    body = await request.json() as RsvpRequest
  } catch {
    return NextResponse.json({ error: { code: 'INVALID_JSON', message: 'Send a valid JSON body.' } }, { status: 400 })
  }

  if (typeof body.status !== 'string' || !allowedStatuses.has(body.status)) {
    return NextResponse.json({ error: { code: 'INVALID_STATUS', message: 'Status must be interested, going, or cancelled.' } }, { status: 400 })
  }

  try {
    const database = await getDatabase()
    const rsvps = database.collection('rsvps')
    await rsvps.createIndex({ userId: 1, eventId: 1 }, { unique: true })

    if (body.status === 'cancelled') {
      await rsvps.deleteOne({ userId, eventId })
    } else {
      await rsvps.updateOne(
        { userId, eventId },
        { $set: { userId, eventId, status: body.status, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true },
      )
    }

    return NextResponse.json({ data: { eventId, status: body.status } })
  } catch {
    return NextResponse.json({ error: { code: 'DATABASE_UNAVAILABLE', message: 'RSVP service is unavailable.' } }, { status: 503 })
  }
}