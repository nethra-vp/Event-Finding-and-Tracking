import { NextResponse } from 'next/server'
import { searchTicketmaster, type NormalizedEvent } from '@/lib/ticketmaster'

type ChatRequest = {
  message?: unknown
  city?: unknown
}

export async function POST(request: Request) {
  let body: ChatRequest

  try {
    body = await request.json() as ChatRequest
  } catch {
    return NextResponse.json({ error: { code: 'INVALID_JSON', message: 'Send a valid JSON body.' } }, { status: 400 })
  }

  if (typeof body.message !== 'string' || body.message.trim().length < 2 || body.message.length > 500) {
    return NextResponse.json({ error: { code: 'INVALID_MESSAGE', message: 'Message must be between 2 and 500 characters.' } }, { status: 400 })
  }

  const message = body.message.trim()
  const city = typeof body.city === 'string' ? body.city.trim().slice(0, 80) : undefined
  const wantsPlans = /plan|rsvp|interested|going/i.test(message)
  const keyword = message.replace(/\b(find|show me|search for|look for|events?|near me)\b/gi, '').trim() || message
  let events: NormalizedEvent[] = []
  try {
    events = await searchTicketmaster({ keyword, city, size: 5 })
  } catch {
    events = []
  }
  const response = events.length
    ? wantsPlans
      ? `I found ${events.length} live options nearby. I’ll keep the RSVP step explicit so nothing gets added without your say-so.`
      : `I found ${events.length} live options that fit the mood. Open any result below to see the full event details.`
    : 'I couldn’t find live matches for that request yet. Try adding a city, date, artist, venue, or event type.'

  return NextResponse.json({
    data: {
      message: response,
      events,
      eventIds: events.map((event) => event.id),
      intent: wantsPlans ? 'plan_management' : 'event_search',
      query: message,
    },
    meta: { source: process.env.TICKETMASTER_API_KEY ? 'ticketmaster' : 'unconfigured', matches: events.length },
  })
}