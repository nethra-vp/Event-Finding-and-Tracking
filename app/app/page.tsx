'use client'

import { useState } from 'react'
import { useEffect } from 'react'
import {
  ArrowUp,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Compass,
  ExternalLink,
  Flame,
  MapPin,
  MoreHorizontal,
  Send,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react'

type Event = {
  id: string
  title: string
  category: string
  date: string
  day: string
  time: string
  venue: string
  accent: string
  image: string
  friends: number
  interested: boolean
  url: string | null
}

type Message = {
  id: number
  role: 'assistant' | 'user'
  text: string
  eventIds?: string[]
  events?: SearchEvent[]
}

type SearchEvent = {
  id: string
  title: string
  date: string | null
  time: string | null
  venue: string | null
  city: string | null
  image: string | null
  url: string | null
}

const initialMessages: Message[] = [
  { id: 1, role: 'assistant', text: 'Good morning, Maya. What are we making room for this week?' },
  { id: 2, role: 'user', text: 'Find me something fun this weekend. Maybe live music or a good market?' },
  { id: 3, role: 'assistant', text: 'Ask me about live music, markets, food, or anything happening nearby.' },
]

function EventMiniCard({ event, onInterested, onInvite }: { event: Event; onInterested: (id: string) => void; onInvite: (id: string) => void }) {
  return (
    <article className="event-mini-card">
      <div className="event-art" style={{ background: event.image.startsWith('http') ? `url(${event.image}) center / cover` : event.image }}>
        <span className="event-category">{event.category}</span>
        <button className="icon-button art-menu" aria-label={`More options for ${event.title}`}><MoreHorizontal size={16} /></button>
        <div className="art-sun" />
      </div>
      <div className="event-mini-body">
        <div className="event-title-row"><h3>{event.title}</h3><span className="event-day">{event.day}<strong>{event.date.replace('Jun ', '')}</strong></span></div>
        <p className="event-meta"><Clock3 size={13} /> {event.time}<span className="meta-dot" /><MapPin size={13} /> {event.venue}</p>
        <div className="event-footer"><span className="friend-count"><Users size={14} /> {event.friends} friends going</span><div className="event-actions"><button className="icon-button" onClick={() => onInvite(event.id)} aria-label={`Share ${event.title}`}><Share2 size={14} /></button><button className={event.interested ? 'interested-button selected' : 'interested-button'} onClick={() => onInterested(event.id)}>{event.interested ? <Check size={14} /> : <Sparkles size={14} />} Interested</button></div></div>
      </div>
    </article>
  )
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([])
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [activeNav, setActiveNav] = useState('Discover')
  const [location, setLocation] = useState('Brooklyn, NY')
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [rsvpIds, setRsvpIds] = useState<string[]>([])
  const [inviteUrl, setInviteUrl] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')

  useEffect(() => {
    const city = location.split(',')[0]
    fetch(`/api/v1/events/search?city=${encodeURIComponent(city)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Event search failed')
        return response.json() as Promise<{ data?: SearchEvent[] }>
      })
      .then((result) => {
        const liveEvents = result.data?.filter((event) => event.date && event.title).slice(0, 3).map((event) => {
          const eventDate = new Date(`${event.date}T12:00:00`)
          return {
            id: event.id,
            title: event.title,
            category: 'LOCAL EVENT',
            date: eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            day: eventDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
            time: event.time?.slice(0, 5) ?? 'Time TBA',
            venue: event.venue ?? event.city ?? 'Nearby venue',
            accent: '#75a996',
            image: event.image ?? 'linear-gradient(135deg, #173d43 0%, #2d7c78 55%, #f1bd72 100%)',
            friends: 0,
            interested: false,
            url: event.url,
          }
        })
        if (liveEvents?.length) setEvents(liveEvents)
      })
      .catch(() => undefined)
  }, [location])

  useEffect(() => {
    fetch('/api/v1/me/rsvps')
      .then(async (response) => response.ok ? response.json() as Promise<{ data?: Array<{ eventId: string; status: string }> }> : { data: [] })
      .then((result) => setRsvpIds((result.data ?? []).filter((rsvp) => rsvp.status === 'going').map((rsvp) => rsvp.eventId)))
      .catch(() => setRsvpIds([]))
  }, [])

  const toggleInterested = async (id: string) => {
    const currentEvent = events.find((event) => event.id === id)
    if (!currentEvent) return
    const nextInterested = !currentEvent.interested
    setEvents((current) => current.map((event) => event.id === id ? { ...event, interested: nextInterested } : event))
    const response = await fetch(`/api/v1/events/${encodeURIComponent(id)}/rsvp`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: nextInterested ? 'interested' : 'cancelled' }) })
    if (!response.ok) setEvents((current) => current.map((event) => event.id === id ? { ...event, interested: !nextInterested } : event))
  }

  const createInvite = async (eventId: string) => {
    const response = await fetch('/api/v1/invites', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ eventId }) })
    const result = await response.json() as { data?: { url?: string }; error?: { message?: string } }
    if (response.ok && result.data?.url) {
      setInviteUrl(result.data.url)
      setInviteMessage('Invite link copied')
      await navigator.clipboard?.writeText(result.data.url)
    } else setInviteMessage(result.error?.message ?? 'Sign in to create an invite.')
  }

  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1)
  const calendarCells = Array.from({ length: 42 }, (_, index) => new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index + 1 - monthStart.getDay()))
  const eventDates = new Set(events.map((event) => event.date))

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text || isSending) return

    setIsSending(true)
    setMessages((current) => [...current, { id: Date.now(), role: 'user', text }, { id: Date.now() + 1, role: 'assistant', text: 'I’m on it. I’ll tune the search to your weekend and keep an eye out for plans your circle will actually want to join.' }])
    setDraft('')

    try {
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: text, city: location.split(',')[0] }),
      })
      if (!response.ok) throw new Error('Chat request failed')
      const result = await response.json() as { data?: { message?: string; eventIds?: string[]; events?: SearchEvent[] } }
      const assistantMessage = result.data?.message
      if (assistantMessage) {
        setMessages((current) => [...current.slice(0, -1), { id: Date.now(), role: 'assistant', text: assistantMessage, eventIds: result.data?.eventIds, events: result.data?.events }])
      }
    } catch {
      // The optimistic assistant reply keeps the composer useful during local API setup.
    } finally {
      setIsSending(false)
    }
  }

  return (
    <main className="app-frame">
      <aside className="sidebar">
        <div className="brand-mark"><span>e</span><div><strong>eventide</strong><small>find your next thing</small></div></div>
        <nav className="main-nav" aria-label="Main navigation">{[{ label: 'Discover', icon: Compass }, { label: 'My plans', icon: CalendarDays }, { label: 'Chat', icon: Sparkles }].map(({ label, icon: Icon }) => <button key={label} className={activeNav === label ? 'nav-item active' : 'nav-item'} onClick={() => setActiveNav(label)}><Icon size={18} strokeWidth={activeNav === label ? 2.3 : 1.8} /> {label}{label === 'My plans' && <span className="nav-count">{rsvpIds.length}</span>}</button>)}</nav>
        <div className="sidebar-bottom"><div className="mini-profile"><div className="avatar">MC</div><div><strong>Maya Chen</strong><span>Brooklyn, NY</span></div><ChevronDown size={15} /></div><button className="settings-link"><span>◌</span> Settings</button></div>
      </aside>

      <section className="workspace">
        <header className="top-header"><div className="location-picker"><MapPin size={17} /><button onClick={() => setLocation(location === 'Brooklyn, NY' ? 'New York City' : 'Brooklyn, NY')}>{location}<ChevronDown size={14} /></button></div><div className="header-actions"><button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><span /></button><div className="avatar avatar-small">MC</div></div></header>
        {activeNav === 'My plans' ? <section className="plans-dashboard"><div className="discover-heading"><div><span className="section-kicker">YOUR RSVP DASHBOARD</span><h2>Plans worth<br /><em>keeping.</em></h2></div><span className="plan-count">{rsvpIds.length} confirmed</span></div><div className="plans-list">{events.filter((event) => rsvpIds.includes(event.id)).map((event) => <article className="plan-row" key={event.id}><div><span>{event.day} · {event.date}</span><h3>{event.title}</h3><p><Clock3 size={13} /> {event.time} · <MapPin size={13} /> {event.venue}</p></div><button onClick={() => createInvite(event.id)}><Share2 size={15} /> Invite</button></article>)}{rsvpIds.length === 0 && <div className="plans-empty"><CalendarDays size={24} /><strong>No confirmed events yet</strong><span>Mark an event as Interested or Going to build your plans.</span><button onClick={() => setActiveNav('Discover')}>Explore events</button></div>}</div></section> : <div className="content-grid">
          <section className="chat-column">
            <div className="section-heading"><div><span className="section-kicker"><span className="live-dot" /> YOUR EVENT SIDEKICK</span><h1>Make a plan<br /><em>worth showing up for.</em></h1></div><button className="icon-button" aria-label="More chat options"><MoreHorizontal size={20} /></button></div>
            <div className="chat-panel">
              <div className="chat-status"><span className="assistant-orb"><Sparkles size={16} /></span><div><strong>eventide assistant</strong><span>always looking around</span></div><span className="online-status"><span /> live</span></div>
              <div className="message-list" aria-live="polite">{messages.map((message) => <div key={message.id} className={message.role === 'user' ? 'message-row user-message' : 'message-row'}>{message.role === 'assistant' && <span className="message-avatar"><Sparkles size={13} /></span>}<div className="message-content"><p>{message.text}</p>{message.events?.length ? <div className="chat-event-results">{message.events.map((event) => <a key={event.id} className="chat-event-result" href={event.url ?? `/api/v1/events/${event.id}`} target="_blank" rel="noreferrer"><span><strong>{event.title}</strong><small>{event.date ?? 'Date TBA'} · {event.venue ?? event.city ?? 'Venue TBA'}</small></span><ExternalLink size={13} /></a>)}</div> : message.eventIds && <div className="message-event-links"><span><Flame size={13} /> live matches</span><button onClick={() => setActiveNav('Discover')}>View all <ArrowUp size={13} /></button></div>}</div></div>)}</div>
              <form className="composer" onSubmit={sendMessage}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={isSending ? 'Looking around...' : 'Ask me to find something...'} aria-label="Ask eventide" disabled={isSending} /><button className="send-button" type="submit" aria-label="Send message" disabled={isSending}><Send size={16} /></button></form>
              <div className="prompt-chips"><button onClick={() => setDraft('What is happening this Friday?')}>What’s happening Friday?</button><button onClick={() => setDraft('Find a low-key dinner plan')}>Low-key dinner plans</button></div>
            </div>
            <div className="quick-stats"><div><strong>{events.length}</strong><span>events nearby</span></div><div><strong>{rsvpIds.length}</strong><span>active plans</span></div><div><strong>{events.reduce((total, event) => total + event.friends, 0)}</strong><span>friends attending</span></div></div>
          </section>
          <section className="discover-column">
            <div className="discover-heading"><div><span className="section-kicker">CURATED FOR YOU</span><h2>Good things<br /><em>are happening.</em></h2></div><button className="text-button">See all <ArrowUp size={14} /></button></div>
            <div className="calendar-strip"><div className="calendar-title"><CalendarDays size={16} /><strong>{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong><div className="calendar-controls"><button aria-label="Previous month" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>‹</button><button aria-label="Next month" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>›</button></div></div><div className="calendar-weekdays">{['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{calendarCells.map((day) => { const dateLabel = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); const inMonth = day.getMonth() === calendarMonth.getMonth(); return <button key={day.toISOString()} className={`calendar-day ${inMonth ? '' : 'muted'} ${eventDates.has(dateLabel) ? 'has-event' : ''}`}><span>{day.getDate()}</span>{eventDates.has(dateLabel) && <i />}</button> })}</div></div>
            <div className="event-list">{events.map((event) => <EventMiniCard key={event.id} event={event} onInterested={toggleInterested} onInvite={createInvite} />)}</div>
            <div className="invite-banner"><div className="invite-icon"><Users size={21} /></div><div><strong>{inviteMessage || 'Good plans are better together.'}</strong><span>{inviteUrl || 'Share an event with your friends.'}</span></div><button onClick={() => events[0] && createInvite(events[0].id)} aria-label="Share an invite"><ExternalLink size={17} /></button></div>
          </section>
        </div>}
      </section>
    </main>
  )
}