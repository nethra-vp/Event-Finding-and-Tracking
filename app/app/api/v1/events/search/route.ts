import { NextResponse } from 'next/server'
import { searchTicketmaster } from '@/lib/ticketmaster'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const keyword = searchParams.get('keyword')?.trim() || undefined
  const city = searchParams.get('city')?.trim() || undefined
  const postalCode = searchParams.get('postalCode')?.trim() || undefined

  if (keyword && keyword.length > 100 || city && city.length > 80 || postalCode && postalCode.length > 20) {
    return NextResponse.json({ error: { code: 'INVALID_QUERY', message: 'Search filters are too long.' } }, { status: 400 })
  }

  if (!process.env.TICKETMASTER_API_KEY) {
    return NextResponse.json({ data: [], meta: { source: 'unconfigured', count: 0 } })
  }

  try {
    const events = await searchTicketmaster({ keyword, city, postalCode })
    return NextResponse.json({ data: events, meta: { source: 'ticketmaster', count: events.length } })
  } catch {
    return NextResponse.json({ data: [], meta: { source: 'provider-error', count: 0 } })
  }
}