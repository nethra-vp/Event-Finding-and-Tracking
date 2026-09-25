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
}

type Message = {
  id: number
  role: 'assistant' | 'user'
  text: string
  eventIds?: string[]
}

type SearchEvent = {
  id: string
  title: string
  date: string | null
  time: string | null
  venue: string | null
  city: string | null
  image: string | null
}

const initialEvents: Event[] = [
  {
    id: 'jazz-under-stars', title: 'Jazz Under the Stars', category: 'LIVE MUSIC', date: 'Jun 14', day: 'SAT', time: '7:30 PM', venue: 'The Rooftop at Pier 17', accent: '#f39b6d', image: 'linear-gradient(135deg, #5d2b40 0%, #c56b56 52%, #f7c486 100%)', friends: 3, interested: true,
  },
  {
    id: 'night-market', title: 'Sunset Night Market', category: 'FOOD & DRINK', date: 'Jun 15', day: 'SUN', time: '5:00 PM', venue: 'Industry City Courtyard', accent: '#75a996', image: 'linear-gradient(135deg, #173d43 0%, #2d7c78 55%, #f1bd72 100%)', friends: 8, interested: false,
  },
  {
    id: 'indie-film-night', title: 'Indie Film Night', category: 'FILM', date: 'Jun 18', day: 'WED', time: '8:00 PM', venue: 'Nitehawk Cinema', accent: '#9a83c4', image: 'linear-gradient(135deg, #282052 0%, #6e4b88 58%, #e9a56b 100%)', friends: 2, interested: false,
  },
]

const initialMessages: Message[] = [
  { id: 1, role: 'assistant', text: 'Good morning, Maya. What are we making room for this week?' },
  { id: 2, role: 'user', text: 'Find me something fun this weekend. Maybe live music or a good market?' },
  { id: 3, role: 'assistant', text: 'I found a few that feel like your kind of Saturday. The rooftop jazz set has 3 people in your circle already, and the night market is shaping up nicely.', eventIds: ['jazz-under-stars', 'night-market'] },
]

const days = [
  { day: 'MON', date: '09', muted: true }, { day: 'TUE', date: '10', muted: true }, { day: 'WED', date: '11', muted: true }, { day: 'THU', date: '12', muted: true }, { day: 'FRI', date: '13', muted: false }, { day: 'SAT', date: '14', muted: false, active: true }, { day: 'SUN', date: '15', muted: false },
]

function EventMiniCard({ event, onInterested }: { event: Event; onInterested: (id: string) => void }) {
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
        <div className="event-footer"><span className="friend-count"><Users size={14} /> {event.friends} friends going</span><button className={event.interested ? 'interested-button selected' : 'interested-button'} onClick={() => onInterested(event.id)}>{event.interested ? <Check size={14} /> : <Sparkles size={14} />} Interested</button></div>
      </div>
    </article>
  )
}

export default function Home() {
  const [events, setEvents] = useState(initialEvents)
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [activeNav, setActiveNav] = useState('Discover')
  const [location, setLocation] = useState('Brooklyn, NY')

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
          }
        })
        if (liveEvents?.length) setEvents(liveEvents)
      })
      .catch(() => undefined)
  }, [location])
  const toggleInterested = (id: string) => setEvents((current) => current.map((event) => event.id === id ? { ...event, interested: !event.interested } : event))

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
        body: JSON.stringify({ message: text }),
      })
      if (!response.ok) throw new Error('Chat request failed')
      const result = await response.json() as { data?: { message?: string; eventIds?: string[] } }
      const assistantMessage = result.data?.message
      if (assistantMessage) {
        setMessages((current) => [...current.slice(0, -1), { id: Date.now(), role: 'assistant', text: assistantMessage, eventIds: result.data?.eventIds }])
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
        <nav className="main-nav" aria-label="Main navigation">{[{ label: 'Discover', icon: Compass }, { label: 'My plans', icon: CalendarDays }, { label: 'Chat', icon: Sparkles }].map(({ label, icon: Icon }) => <button key={label} className={activeNav === label ? 'nav-item active' : 'nav-item'} onClick={() => setActiveNav(label)}><Icon size={18} strokeWidth={activeNav === label ? 2.3 : 1.8} /> {label}{label === 'My plans' && <span className="nav-count">4</span>}</button>)}</nav>
        <div className="sidebar-bottom"><div className="mini-profile"><div className="avatar">MC</div><div><strong>Maya Chen</strong><span>Brooklyn, NY</span></div><ChevronDown size={15} /></div><button className="settings-link"><span>◌</span> Settings</button></div>
      </aside>

      <section className="workspace">
        <header className="top-header"><div className="location-picker"><MapPin size={17} /><button onClick={() => setLocation(location === 'Brooklyn, NY' ? 'New York City' : 'Brooklyn, NY')}>{location}<ChevronDown size={14} /></button></div><div className="header-actions"><button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><span /></button><div className="avatar avatar-small">MC</div></div></header>
        <div className="content-grid">
          <section className="chat-column">
            <div className="section-heading"><div><span className="section-kicker"><span className="live-dot" /> YOUR EVENT SIDEKICK</span><h1>Make a plan<br /><em>worth showing up for.</em></h1></div><button className="icon-button" aria-label="More chat options"><MoreHorizontal size={20} /></button></div>
            <div className="chat-panel">
              <div className="chat-status"><span className="assistant-orb"><Sparkles size={16} /></span><div><strong>eventide assistant</strong><span>always looking around</span></div><span className="online-status"><span /> live</span></div>
              <div className="message-list" aria-live="polite">{messages.map((message) => <div key={message.id} className={message.role === 'user' ? 'message-row user-message' : 'message-row'}>{message.role === 'assistant' && <span className="message-avatar"><Sparkles size={13} /></span>}<div className="message-content"><p>{message.text}</p>{message.eventIds && <div className="message-event-links"><span><Flame size={13} /> 2 strong matches</span><button onClick={() => setActiveNav('Discover')}>View all <ArrowUp size={13} /></button></div>}</div></div>)}</div>
              <form className="composer" onSubmit={sendMessage}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={isSending ? 'Looking around...' : 'Ask me to find something...'} aria-label="Ask eventide" disabled={isSending} /><button className="send-button" type="submit" aria-label="Send message" disabled={isSending}><Send size={16} /></button></form>
              <div className="prompt-chips"><button onClick={() => setDraft('What is happening this Friday?')}>What’s happening Friday?</button><button onClick={() => setDraft('Find a low-key dinner plan')}>Low-key dinner plans</button></div>
            </div>
            <div className="quick-stats"><div><strong>12</strong><span>events nearby</span></div><div><strong>4</strong><span>active plans</span></div><div><strong>18</strong><span>friends exploring</span></div></div>
          </section>
          <section className="discover-column">
            <div className="discover-heading"><div><span className="section-kicker">CURATED FOR YOU</span><h2>Good things<br /><em>are happening.</em></h2></div><button className="text-button">See all <ArrowUp size={14} /></button></div>
            <div className="calendar-strip"><div className="calendar-title"><CalendarDays size={16} /><strong>June 2025</strong><button aria-label="Open calendar"><ChevronDown size={14} /></button></div><div className="days-row">{days.map((day) => <button key={day.date} className={`day-cell ${day.muted ? 'muted' : ''} ${day.active ? 'active' : ''}`}><span>{day.day}</span><strong>{day.date}</strong>{day.active && <i />}</button>)}</div></div>
            <div className="event-list">{events.map((event) => <EventMiniCard key={event.id} event={event} onInterested={toggleInterested} />)}</div>
            <div className="invite-banner"><div className="invite-icon"><Users size={21} /></div><div><strong>Good plans are better together.</strong><span>Invite a friend to something you’re eyeing.</span></div><button aria-label="Share an invite"><ExternalLink size={17} /></button></div>
          </section>
        </div>
      </section>
    </main>
  )
}