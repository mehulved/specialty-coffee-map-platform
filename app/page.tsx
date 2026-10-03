'use client'

import useSWR from 'swr'
import { useMemo, useState } from 'react'
import { Coffee, Heart, LogOut, MapPin, Search, Shield, SlidersHorizontal, Star, UserRound, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { GoogleMapPanel } from '@/components/google-map-panel'
import { authClient } from '@/lib/auth-client'
import { getCafeFeedback, saveCafeFeedback, toggleFavoriteLocation } from '@/app/actions/ratings'
import { submitLocationFlag } from '@/app/actions/submissions'

const fetcher = (url: string) => fetch(url).then((response) => response.json())

const cafes = [
  { id: 'seed-subko-coffee', name: 'Subko Coffee', tags: ['Cafe'], area: 'Bandra West, Mumbai', aliases: ['Bombay', 'Thane', 'Navi Mumbai', 'Mumbai Metropolitan Region', 'MMR'], rating: 4.7, roast: 'Light roast', lat: 19.0596, lng: 72.8295, note: 'Single-origin espresso and thoughtful Indian coffees.' },
  { id: 'seed-blue-tokai', name: 'Blue Tokai Coffee Roasters', tags: ['Cafe', 'Roastery'], area: 'Saket, New Delhi', aliases: ['Delhi', 'Dilli', 'NCR', 'Delhi NCR', 'Gurugram', 'Gurgaon', 'Noida', 'Ghaziabad', 'Faridabad'], rating: 4.5, roast: 'Seasonal', lat: 28.5295, lng: 77.2168, note: 'A reliable neighborhood stop with a rotating brew menu.' },
  { id: 'seed-savorworks', name: 'Savorworks Roasters', tags: ['Roastery'], area: 'Shahpur Jat, New Delhi', aliases: ['Delhi', 'Dilli', 'NCR', 'Delhi NCR', 'Gurugram', 'Gurgaon', 'Noida', 'Ghaziabad', 'Faridabad'], rating: 4.8, roast: 'Experimental', lat: 28.5375, lng: 77.2067, note: 'Micro-lot coffees, careful pour overs, and a calm room.' },
  { id: 'seed-third-wave', name: 'Third Wave Coffee', tags: ['Cafe'], area: 'Indiranagar, Bengaluru', aliases: ['Bangalore', 'Koramangala', 'HSR Layout', 'Whitefield', 'Jayanagar'], rating: 4.4, roast: 'All day', lat: 12.9784, lng: 77.6408, note: 'Bright, accessible specialty coffee for everyday drinking.' },
  { id: 'seed-kapi-kottai', name: 'Kapi Kottai', tags: ['Roastery'], area: 'Besant Nagar, Chennai', aliases: ['Madras'], rating: 4.8, roast: 'South Indian', lat: 13.0005, lng: 80.2668, note: 'Beautifully roasted Indian beans and slow coffee rituals.' },
]

export default function Page() {
  const { data: session } = authClient.useSession()
  const { data: approvedLocations = [] } = useSWR('/api/locations', fetcher)
  const { data: favoriteIds = [], mutate: mutateFavorites } = useSWR<string[]>(session?.user ? '/api/favorites' : null, fetcher)
  const allCafes = useMemo(() => {
    const managedByName = new Map(approvedLocations.map((location: typeof cafes[number]) => [location.name.toLowerCase(), location]))
    const curated = cafes.map((cafe) => managedByName.get(cafe.name.toLowerCase()) ? { ...cafe, ...managedByName.get(cafe.name.toLowerCase()) } : cafe)
    const curatedNames = new Set(cafes.map((cafe) => cafe.name.toLowerCase()))
    return [...curated, ...approvedLocations.filter((location: typeof cafes[number]) => !curatedNames.has(location.name.toLowerCase()))]
  }, [approvedLocations])
  const [query, setQuery] = useState('')
  const popularLists = [
    { label: 'Bengaluru', search: 'Bangalore', detail: 'Indiranagar · Koramangala · HSR' },
    { label: 'Delhi NCR', search: 'NCR', detail: 'Delhi · Gurugram · Noida' },
    { label: 'Mumbai', search: 'Mumbai', detail: 'Bandra · Thane · Navi Mumbai' },
    { label: 'Goa', search: 'Goa', detail: 'North Goa · South Goa' },
  ]
  const [selected, setSelected] = useState(cafes[0])
  const [showFeedback, setShowFeedback] = useState(false)
  const [showFlag, setShowFlag] = useState(false)
  const [flagReason, setFlagReason] = useState<'temporarily_closed' | 'permanently_closed' | 'reopened'>('temporarily_closed')
  const [flagDetails, setFlagDetails] = useState('')
  const [flagSent, setFlagSent] = useState(false)
  const [favoriteError, setFavoriteError] = useState('')
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackNote, setFeedbackNote] = useState('')
  const [savedFeedback, setSavedFeedback] = useState<Record<string, { rating: number; note: string; average: number; count: number }>>({})
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return allCafes
    return allCafes.filter((cafe) => `${cafe.name} ${cafe.area} ${(cafe.aliases ?? []).join(' ')} ${cafe.tags.join(' ')}`.toLowerCase().includes(search))
  }, [allCafes, query])
  const selectedViewport = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (normalized === 'mumbai' || normalized === 'bombay') return { center: { lat: 19.12, lng: 72.95 }, zoom: 10 }
    if (normalized === 'ncr' || normalized === 'delhi' || normalized === 'dilli') return { center: { lat: 28.55, lng: 77.25 }, zoom: 10 }
    if (normalized === 'bangalore' || normalized === 'bengaluru') return { center: { lat: 12.98, lng: 77.62 }, zoom: 11 }
    if (normalized === 'goa') return { center: { lat: 15.4, lng: 73.95 }, zoom: 9 }
    return undefined
  }, [query])
  const currentFeedback = savedFeedback[selected.name]
  const addCafeHref = session?.user ? '/add-cafe' : '/sign-in'

  async function openFeedback() {
    try {
      const result = await getCafeFeedback(selected.name)
      if (result.mine) setSavedFeedback((previous) => ({ ...previous, [selected.name]: { rating: result.mine.rating, note: result.mine.notes, average: result.average, count: result.count } }))
      setFeedbackRating(result.mine?.rating ?? 0)
      setFeedbackNote(result.mine?.notes ?? '')
      setShowFeedback(true)
    } catch {
      setShowFeedback(true)
    }
  }

  async function toggleFavorite(cafe: (typeof allCafes)[number]) {
    if (!session?.user) {
      window.location.href = '/sign-in'
      return
    }
    try {
      setFavoriteError('')
      await toggleFavoriteLocation(cafe.id ?? cafe.name)
      await mutateFavorites()
    } catch {
      setFavoriteError('Sign in to save favourites.')
    }
  }

  async function submitFlag() {
    try {
      await submitLocationFlag({ locationId: selected.id ?? selected.name, reason: flagReason, details: flagDetails })
      setFlagSent(true); setFlagDetails('')
    } catch { window.alert('Please sign in to report a location status.') }
  }

  async function saveFeedback() {
    if (!feedbackRating) return
    try {
      const result = await saveCafeFeedback({ cafeName: selected.name, rating: feedbackRating, notes: feedbackNote })
      setSavedFeedback((previous) => ({ ...previous, [selected.name]: { rating: feedbackRating, note: feedbackNote.trim(), average: result.average, count: result.count } }))
      setShowFeedback(false)
      setFeedbackRating(0)
      setFeedbackNote('')
    } catch {
      window.alert('We could not save your rating. Please sign in and try again.')
    }
  }

  return (
    <main className="cafe-paper min-h-screen bg-[#f4efe7] text-[#171513]">
      <header className="flex h-20 items-center justify-between border-b border-[#171513] bg-[#171513] px-6 text-[#fffdf8] lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="kaapi home">
          <span className="flex size-10 items-center justify-center rounded-full bg-[#e2542f] text-[#fffdf8]"><Coffee data-icon="inline-start" /></span>
          <span><span className="block font-serif text-xl font-semibold tracking-tight">kaapi</span><span className="block text-[10px] font-medium uppercase tracking-[0.24em] text-[#c7bfb5]">India coffee atlas</span></span>
        </Link>
        <nav className="flex items-center gap-3 text-sm text-[#687068]">{session?.user ? <><Link href="/add-cafe" className="flex items-center gap-2 rounded-full border border-[#d7d9d2] bg-white px-4 py-2 font-medium text-[#314337] hover:bg-[#f0f1ec]"><Plus data-icon="inline-start" /> Add location</Link><Link href="/admin" className="flex items-center gap-2 rounded-full border border-[#d7d9d2] bg-white px-4 py-2 font-medium text-[#314337] hover:bg-[#f0f1ec]"><Shield data-icon="inline-start" /> Admin</Link><button onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => window.location.reload() } })} className="flex items-center gap-2 rounded-full border border-[#d7d9d2] bg-white px-4 py-2 font-medium text-[#314337] hover:bg-[#f0f1ec]"><LogOut data-icon="inline-start" /> Sign out</button></> : <Link href="/sign-in" className="flex items-center gap-2 rounded-full border border-[#d7d9d2] bg-white px-4 py-2 font-medium text-[#314337] hover:bg-[#f0f1ec]"><UserRound data-icon="inline-start" /> Sign in</Link>}</nav>
      </header>
      <section className="border-b border-[#171513] bg-[#171513] px-6 py-12 text-[#fffdf8] lg:px-10">
        <div className="mx-auto max-w-[1440px]"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#f28c58]">A living guide to better coffee</p><h1 className="max-w-3xl font-serif text-4xl leading-[1.02] tracking-tight sm:text-7xl">Find your next <em className="text-[#f28c58]">good cup.</em></h1><p className="mt-4 max-w-xl text-base leading-7 text-[#c7bfb5]">A curated map of specialty cafes, roasters, and the people making Indian coffee worth travelling for.</p></div>
      </section>
      <section className="mx-auto grid max-w-[1600px] gap-4 px-3 py-3 sm:px-4 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-5 lg:px-6 lg:py-5">
        <aside className="atlas-shortlist rounded-2xl border border-[#deded7] bg-[#fbfaf7] p-4 shadow-sm lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:p-5">
          <div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b46d45]">The shortlist</p><h2 className="mt-1 font-serif text-3xl leading-none">{filtered.length} places</h2></div><button className="rounded-full border border-[#deded7] p-2 text-[#687068] hover:bg-[#f0f1ec]" aria-label="Filter cafes"><SlidersHorizontal data-icon="inline-start" /></button></div>
          <label className="mt-4 flex items-center gap-2 rounded-full border border-[#deded7] bg-white px-4 py-3"><Search className="size-4 text-[#8a9189]" aria-hidden="true" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by city, cafe, or tag" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9ba19a]" /></label>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1"><button onClick={() => setQuery('')} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${!query ? 'bg-[#1f3b2c] text-white' : 'border border-[#deded7] bg-white text-[#687068]'}`}>All places</button>{popularLists.map((list) => <button key={list.label} onClick={() => setQuery(list.search)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${query.toLowerCase() === list.search.toLowerCase() ? 'border-[#e2542f] bg-[#fff0e9] text-[#b64d2d]' : 'border-[#deded7] bg-white text-[#687068] hover:border-[#e6c7ae]'}`}>{list.label}</button>)}</div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">{filtered.map((cafe) => <div key={cafe.name} role="button" tabIndex={0} onClick={() => setSelected(cafe)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelected(cafe) }} aria-current={selected.name === cafe.name ? 'true' : undefined} className={`rounded-xl border p-3 text-left transition ${selected.name === cafe.name ? 'border-2 border-[#e2542f] bg-[#fff0e9] shadow-[0_0_0_3px_rgba(226,84,47,0.12)]' : 'border-transparent hover:border-[#deded7] hover:bg-white'}`}><div className="flex items-center justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-1.5"><h3 className="truncate text-sm font-semibold">{cafe.name}</h3>{cafe.tags.map((tag) => <span key={tag} className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${tag === 'Cafe' ? 'border-[#efb9a3] bg-[#fff0e9] text-[#b64d2d]' : 'border-[#b9c9e8] bg-[#edf3ff] text-[#4167a5]'}`}>{tag}</span>)}</div><p className="mt-1 flex items-center gap-1 truncate text-[11px] text-[#7c847c]"><MapPin className="size-3" />{cafe.area}</p>{cafe.availabilityStatus && cafe.availabilityStatus !== 'open' && <span className={`mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-semibold ${cafe.availabilityStatus === 'permanently_closed' ? 'bg-[#f7d8d3] text-[#9d3f34]' : 'bg-[#fff0c7] text-[#8a6211]'}`}>{cafe.availabilityStatus === 'permanently_closed' ? 'Permanently closed' : 'Temporarily closed'}</span>}</div><div className="flex shrink-0 items-center gap-2"><span className="flex items-center gap-1 text-xs font-semibold text-[#9a603e]"><Star className="size-3 fill-current" />{savedFeedback[cafe.name]?.average?.toFixed(1) ?? cafe.rating}</span><button type="button" onClick={(event) => { event.stopPropagation(); void toggleFavorite(cafe) }} aria-label={favoriteIds.includes(cafe.id ?? cafe.name) ? `Remove ${cafe.name} from favourites` : `Save ${cafe.name} to favourites`} className="rounded-full p-1.5 text-[#b46d45] hover:bg-white"><Heart className={`size-4 ${favoriteIds.includes(cafe.id ?? cafe.name) ? 'fill-current' : ''}`} /></button></div></div></div>)}</div>
          {favoriteError && <p role="status" className="mt-3 text-xs text-[#b64d2d]">{favoriteError}</p>}<div className="mt-4 grid grid-cols-2 gap-2"><button onClick={openFeedback} className="flex items-center justify-center gap-2 rounded-full border border-[#d7d9d2] bg-white px-3 py-2.5 text-sm font-semibold text-[#314337] hover:bg-[#f0f1ec]"><Star className="size-4" /> Rate</button><button onClick={() => { setFlagSent(false); setShowFlag(true) }} className="rounded-full border border-[#d7d9d2] bg-white px-3 py-2.5 text-sm font-semibold text-[#687068] hover:bg-[#f0f1ec]">Report status</button></div>
        </aside>
        <GoogleMapPanel cafes={allCafes} selected={selected} viewport={selectedViewport} onSelect={setSelected} />
      </section>
      {showFlag && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#20221f]/45 p-4"><section role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-[#deded7] bg-[#fbfaf7] p-6 shadow-2xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b46d45]">Community update</p><h2 className="mt-1 font-serif text-2xl">Report {selected.name}</h2>{flagSent ? <><p className="mt-3 text-sm text-[#687068]">Thanks. Your report is staged for admin approval.</p><button onClick={() => setShowFlag(false)} className="mt-5 rounded-xl bg-[#1f3b2c] px-4 py-2.5 text-sm font-semibold text-white">Done</button></> : <><label className="mt-5 block text-sm font-semibold">What changed?<select value={flagReason} onChange={(event) => setFlagReason(event.target.value as typeof flagReason)} className="mt-2 w-full rounded-xl border border-[#d7d9d2] bg-white p-3 text-sm"><option value="temporarily_closed">Temporarily closed</option><option value="permanently_closed">Permanently closed</option><option value="reopened">Open again</option></select></label><textarea value={flagDetails} onChange={(event) => setFlagDetails(event.target.value)} placeholder="Add context (optional)" rows={3} className="mt-3 w-full rounded-xl border border-[#d7d9d2] bg-white p-3 text-sm" /><div className="mt-4 flex justify-end gap-2"><button onClick={() => setShowFlag(false)} className="rounded-xl border border-[#d7d9d2] px-4 py-2.5 text-sm">Cancel</button><button onClick={submitFlag} className="rounded-xl bg-[#1f3b2c] px-4 py-2.5 text-sm font-semibold text-white">Submit report</button></div></>}</section></div>}
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#20221f]/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowFeedback(false) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="feedback-title" className="w-full max-w-md rounded-2xl border border-[#deded7] bg-[#fbfaf7] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a9189]">Your field notes</p><h2 id="feedback-title" className="mt-1 font-serif text-2xl">{selected.name}</h2><p className="mt-1 text-sm text-[#687068]">{selected.area}</p></div><button onClick={() => setShowFeedback(false)} aria-label="Close feedback" className="rounded-lg p-2 text-[#687068] hover:bg-[#f0f1ec]"><X /></button></div>
            <div className="mt-6"><p className="text-sm font-semibold text-[#314337]">Your rating</p><div className="mt-2 flex gap-2" aria-label="Choose a rating from one to five stars">{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" onClick={() => setFeedbackRating(rating)} aria-label={`${rating} stars`} className="rounded-md p-1"><Star className={`size-7 ${rating <= feedbackRating ? 'fill-[#b46d45] text-[#b46d45]' : 'text-[#c4c8c0]'}`} /></button>)}</div></div>
            <label className="mt-5 block text-sm font-semibold text-[#314337]">Notes<textarea value={feedbackNote} onChange={(event) => setFeedbackNote(event.target.value)} placeholder="What should another coffee person know?" rows={4} className="mt-2 w-full resize-none rounded-xl border border-[#d7d9d2] bg-white p-3 text-sm outline-none focus:border-[#b46d45]" /></label>
            <div className="mt-5 flex justify-end gap-2"><button onClick={() => setShowFeedback(false)} className="rounded-xl border border-[#d7d9d2] px-4 py-2.5 text-sm font-semibold text-[#687068]">Cancel</button><button onClick={saveFeedback} disabled={!feedbackRating} className="rounded-xl bg-[#1f3b2c] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Save rating</button></div>
          </section>
        </div>
      )}
      <footer className="mx-auto flex max-w-[1440px] items-center justify-between px-6 pb-8 pt-2 text-xs text-[#8a9189]"><span>Curated with care for coffee people.</span><span>Suggest a place · About</span></footer>
    </main>
  )
}
