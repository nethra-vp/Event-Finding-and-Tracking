import { NextResponse } from 'next/server'
import { searchTicketmaster } from '@/lib/ticketmaster'

const demoEvents = [
  { id: 'jazz-under-stars', title: 'Jazz Under the Stars', date: '2025-06-14', time: '19:30:00', venue: 'The Rooftop at Pier 17', city: 'New York', url: null, image: null },
  { id: 'night-market', title: 'Sunset Night Market', date: '2025-06-15', time: '17:00:00', venue: 'Industry City Courtyard', city: 'Brooklyn', url: null, image: null },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const keyword = searchParams.get('keyword')?.trim() || undefined
  const city = searchParams.get('city')?.trim() || undefined
  const postalCode = searchParams.get('postalCode')?.trim() || undefined

  if (keyword && keyword.length > 100 || city && city.length > 80 || postalCode && postalCode.length > 20) {
    return NextResponse.json({ error: { code: 'INVALID_QUERY', message: 'Search filters are too long.' } }, { status: 400 })
  }

  if (!process.env.TICKETMASTER_API_KEY) {
    return NextResponse.json({ data: demoEvents, meta: { source: 'demo-fallback', count: demoEvents.length } })
  }

  try {
    const events = await searchTicketmaster({ keyword, city, postalCode })
    return NextResponse.json({ data: events, meta: { source: 'ticketmaster', count: events.length } })
  } catch {
    return NextResponse.json({ data: demoEvents, meta: { source: 'demo-fallback', count: demoEvents.length } })
  }
}