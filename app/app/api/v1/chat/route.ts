import { NextResponse } from 'next/server'

const eventMatches = [
  { id: 'jazz-under-stars', title: 'Jazz Under the Stars' },
  { id: 'night-market', title: 'Sunset Night Market' },
]

type ChatRequest = {
  message?: unknown
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
  const wantsPlans = /plan|rsvp|interested|going/i.test(message)
  const response = wantsPlans
    ? 'I can help shape that plan. I found a couple of nearby options, and I’ll keep the RSVP step explicit so nothing gets added without your say-so.'
    : 'I found a couple of nearby options that fit the mood. I’ll keep the search tuned to your location and this weekend.'

  return NextResponse.json({
    data: {
      message: response,
      eventIds: eventMatches.map((event) => event.id),
      intent: wantsPlans ? 'plan_management' : 'event_search',
      query: message,
    },
    meta: { source: 'demo-provider', matches: eventMatches.length },
  })
}