export type EventSearch = {
  keyword?: string
  city?: string
  postalCode?: string
  startDateTime?: string
  size?: number
}

export type NormalizedEvent = {
  id: string
  title: string
  date: string | null
  time: string | null
  venue: string | null
  city: string | null
  url: string | null
  image: string | null
}

type TicketmasterEvent = {
  id?: string
  name?: string
  url?: string
  dates?: { start?: { localDate?: string; localTime?: string } }
  _embedded?: { venues?: Array<{ name?: string; city?: { name?: string } }> }
  images?: Array<{ url?: string; width?: number }>
}

type TicketmasterResponse = { _embedded?: { events?: TicketmasterEvent[] } }

export async function searchTicketmaster(search: EventSearch): Promise<NormalizedEvent[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY
  if (!apiKey) return []

  const params = new URLSearchParams({ apikey: apiKey, size: String(Math.min(Math.max(search.size ?? 10, 1), 20)) })
  if (search.keyword) params.set('keyword', search.keyword.slice(0, 100))
  if (search.city) params.set('city', search.city.slice(0, 80))
  if (search.postalCode) params.set('postalCode', search.postalCode.slice(0, 20))
  if (search.startDateTime) params.set('startDateTime', search.startDateTime)

  const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`, {
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error(`Ticketmaster returned ${response.status}`)

  const payload = await response.json() as TicketmasterResponse
  return (payload._embedded?.events ?? []).flatMap((event) => {
    if (!event.id || !event.name) return []
    const venue = event._embedded?.venues?.[0]
    return [{
      id: event.id,
      title: event.name,
      date: event.dates?.start?.localDate ?? null,
      time: event.dates?.start?.localTime ?? null,
      venue: venue?.name ?? null,
      city: venue?.city?.name ?? null,
      url: event.url ?? null,
      image: event.images?.sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? null,
    }]
  })
}