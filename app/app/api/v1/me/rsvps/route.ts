import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign in to view your plans.' } }, { status: 401 })

  try {
    const database = await getDatabase()
    const rsvps = await database.collection('rsvps').find({ userId }).sort({ updatedAt: -1 }).toArray()
    return NextResponse.json({ data: rsvps.map(({ _id, userId: _, ...rsvp }) => rsvp) })
  } catch {
    return NextResponse.json({ error: { code: 'DATABASE_UNAVAILABLE', message: 'Plans are unavailable.' } }, { status: 503 })
  }
}