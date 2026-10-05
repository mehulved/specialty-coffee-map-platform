'use client'

import useSWR from 'swr'
import { useEffect, useMemo, useState } from 'react'
import { Coffee, Heart, LogOut, MapPin, Search, Shield, Share2, Star, UserRound, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { GoogleMapPanel } from '@/components/google-map-panel'
import { authClient } from '@/lib/auth-client'
import { getCafeFeedback, saveCafeFeedback, toggleFavoriteLocation } from '@/app/actions/ratings'
import { submitLocationFlag, submitLocationUpdate } from '@/app/actions/submissions'

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
  const allCafes = useMemo(() => approvedLocations as typeof cafes, [approvedLocations])
  const [query, setQuery] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const popularLists = [
    { label: 'Bengaluru', search: 'Bangalore', detail: 'Indiranagar · Koramangala · HSR' },
    { label: 'Delhi NCR', search: 'NCR', detail: 'Delhi · Gurugram · Noida' },
    { label: 'Mumbai', search: 'Mumbai', detail: 'Bandra · Thane · Navi Mumbai' },
    { label: 'Goa', search: 'Goa', detail: 'North Goa · South Goa' },
    { label: 'Ahmedabad', search: 'Ahmedabad', detail: 'Navrangpura · Prahlad Nagar' },
    { label: 'Hyderabad', search: 'Hyderabad', detail: 'Jubilee Hills · Banjara Hills' },
    { label: 'Surat', search: 'Surat', detail: 'Adajan · Vesu · Citylight' },
  ]
  const [selected, setSelected] = useState(cafes[0])
  useEffect(() => {
    if (allCafes.length && !allCafes.some((cafe) => (cafe.id ?? `${cafe.name}-${cafe.lat}-${cafe.lng}`) === (selected.id ?? `${selected.name}-${selected.lat}-${selected.lng}`))) setSelected(allCafes[0])
  }, [allCafes, selected.id])
  const [showFeedback, setShowFeedback] = useState(false)
  const [showFlag, setShowFlag] = useState(false)
  const [showUpdate, setShowUpdate] = useState(false)
  const [updateDetails, setUpdateDetails] = useState('')
  const [updateSent, setUpdateSent] = useState<'approved' | 'pending' | false>(false)
  const [flagReason, setFlagReason] = useState<'temporarily_closed' | 'permanently_closed' | 'reopened'>('temporarily_closed')
  const [flagDetails, setFlagDetails] = useState('')
  const [flagSent, setFlagSent] = useState(false)
  const [favoriteError, setFavoriteError] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackNote, setFeedbackNote] = useState('')
  const [savedFeedback, setSavedFeedback] = useState<Record<string, { rating: number; note: string; average: number; count: number }>>({})
  const cityAliases: Record<string, string[]> = {
    bangalore: ['bangalore', 'bengaluru', 'indiranagar', 'koramangala', 'hsr'],
    bengaluru: ['bangalore', 'bengaluru', 'indiranagar', 'koramangala', 'hsr'],
    bombay: ['bombay', 'mumbai', 'thane', 'navi mumbai', 'bandra'],
    mumbai: ['bombay', 'mumbai', 'thane', 'navi mumbai', 'bandra'],
    delhi: ['delhi', 'dilli', 'ncr', 'noida', 'gurugram', 'gurgaon', 'faridabad', 'ghaziabad'],
    dilli: ['delhi', 'dilli', 'ncr', 'noida', 'gurugram', 'gurgaon', 'faridabad', 'ghaziabad'],
    ncr: ['delhi', 'dilli', 'ncr', 'noida', 'gurugram', 'gurgaon', 'faridabad', 'ghaziabad'],
  }
  const matchesCity = (cafe: (typeof allCafes)[number], search: string) => {
    const searchable = `${cafe.name} ${cafe.area} ${(cafe.aliases ?? []).join(' ')} ${cafe.tags.join(' ')}`.toLowerCase()
    return (cityAliases[search] ?? [search]).some((term) => searchable.includes(term))
  }
  const cityCounts = useMemo(() => Object.fromEntries(popularLists.map((list) => [list.search, allCafes.filter((cafe) => matchesCity(cafe, list.search.toLowerCase())).length])), [allCafes])
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()
    const cityAliases: Record<string, string[]> = {
      bangalore: ['bangalore', 'bengaluru', 'indiranagar', 'koramangala', 'hsr'],
      bengaluru: ['bangalore', 'bengaluru', 'indiranagar', 'koramangala', 'hsr'],
      bombay: ['bombay', 'mumbai', 'thane', 'navi mumbai', 'bandra'],
      mumbai: ['bombay', 'mumbai', 'thane', 'navi mumbai', 'bandra'],
      delhi: ['delhi', 'dilli', 'ncr', 'noida', 'gurugram', 'gurgaon', 'faridabad', 'ghaziabad'],
      dilli: ['delhi', 'dilli', 'ncr', 'noida', 'gurugram', 'gurgaon', 'faridabad', 'ghaziabad'],
      ncr: ['delhi', 'dilli', 'ncr', 'noida', 'gurugram', 'gurgaon', 'faridabad', 'ghaziabad'],
    }
    const matchesSearch = (cafe: (typeof allCafes)[number]) => {
      if (!search) return true
      const searchable = `${cafe.name} ${cafe.area} ${(cafe.aliases ?? []).join(' ')} ${cafe.tags.join(' ')}`.toLowerCase()
      return (cityAliases[search] ?? [search]).some((term) => searchable.includes(term))
    }
    return allCafes.filter((cafe) => matchesSearch(cafe) && (!favoritesOnly || favoriteIds.includes(cafe.id ?? cafe.name)))
  }, [allCafes, favoriteIds, favoritesOnly, query])
  const selectedViewport = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (normalized === 'mumbai' || normalized === 'bombay') return { center: { lat: 19.12, lng: 72.95 }, zoom: 10 }
    if (normalized === 'ncr' || normalized === 'delhi' || normalized === 'dilli') return { center: { lat: 28.55, lng: 77.25 }, zoom: 10 }
    if (normalized === 'bangalore' || normalized === 'bengaluru') return { center: { lat: 12.98, lng: 77.62 }, zoom: 11 }
    if (normalized === 'goa') return { center: { lat: 15.4, lng: 73.95 }, zoom: 9 }
    if (normalized === 'ahmedabad') return { center: { lat: 23.03, lng: 72.58 }, zoom: 11 }
    if (normalized === 'hyderabad') return { center: { lat: 17.42, lng: 78.45 }, zoom: 11 }
    if (normalized === 'surat') return { center: { lat: 21.17, lng: 72.83 }, zoom: 11 }
    return undefined
  }, [query])
  const currentFeedback = savedFeedback[selected.name]
  const addCafeHref = session?.user ? '/add-cafe' : '/sign-in'

  useEffect(() => {
    if (!allCafes.length || typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const sharedCity = params.get('city')
    const sharedLocation = params.get('location')
    const sharedFavorites = params.get('favorites') === '1'
    if (sharedCity) setQuery(sharedCity)
    if (sharedFavorites) setFavoritesOnly(true)
    if (sharedLocation) {
      const match = allCafes.find((cafe) => cafe.id === sharedLocation || `${cafe.name}-${cafe.lat}-${cafe.lng}` === sharedLocation)
      if (match) setSelected(match)
    }
  }, [allCafes])

  async function shareUrl(url: string, title: string) {
    try {
      if (navigator.share) await navigator.share({ title, url })
      else { await navigator.clipboard.writeText(url); setShareMessage('Link copied'); window.setTimeout(() => setShareMessage(''), 2200) }
    } catch { /* User dismissed native share sheet. */ }
  }

  function shareLocation(cafe: (typeof allCafes)[number]) {
    const url = new URL(window.location.href)
    url.search = ''
    url.searchParams.set('location', cafe.id ?? `${cafe.name}-${cafe.lat}-${cafe.lng}`)
    void shareUrl(url.toString(), `${cafe.name} · caffography`)
  }

  function shareCity(city: string) {
    const url = new URL(window.location.href)
    url.search = ''
    if (city !== 'favourites') url.searchParams.set('city', city)
    if (favoritesOnly) url.searchParams.set('favorites', '1')
    void shareUrl(url.toString(), `${city === 'favourites' ? 'Favourite places' : `${city} coffee guide`} · caffography`)
  }

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

  async function submitUpdate() {
    try {
      const result = await submitLocationUpdate({ locationId: selected.id ?? selected.name, details: updateDetails })
      setUpdateSent(result.status === 'approved' ? 'approved' : 'pending'); setUpdateDetails('')
    } catch { window.alert('Please sign in to add information.') }
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
      <header className="flex min-h-20 items-center justify-between gap-3 overflow-hidden border-b border-[#171513] bg-[#171513] px-4 text-[#fffdf8] sm:px-6 lg:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-2 sm:gap-3" aria-label="caffography home">
          <span className="flex size-10 items-center justify-center rounded-full bg-[#e2542f] text-[#fffdf8]"><Coffee data-icon="inline-start" /></span>
          <span><span className="block font-serif text-xl font-semibold tracking-tight">caffography</span><span className="block text-[10px] font-medium uppercase tracking-[0.24em] text-[#c7bfb5]">India coffee atlas</span></span>
        </Link>
        <nav className="flex min-w-0 max-w-[58vw] items-center justify-end gap-1.5 overflow-x-auto pb-0.5 text-sm text-[#687068] sm:max-w-none sm:gap-2">{session?.user ? <><Link href="/add-cafe" className="flex items-center gap-2 whitespace-nowrap rounded-full border border-[#d7d9d2] bg-white px-3 py-2 text-xs font-medium sm:px-4 sm:text-sm text-[#314337] hover:bg-[#f0f1ec]"><Plus data-icon="inline-start" /> Add location</Link><Link href="/admin" className="flex items-center gap-2 whitespace-nowrap rounded-full border border-[#d7d9d2] bg-white px-3 py-2 text-xs font-medium sm:px-4 sm:text-sm text-[#314337] hover:bg-[#f0f1ec]"><Shield data-icon="inline-start" /> Admin</Link><button onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => window.location.reload() } })} className="flex items-center gap-2 whitespace-nowrap rounded-full border border-[#d7d9d2] bg-white px-3 py-2 text-xs font-medium sm:px-4 sm:text-sm text-[#314337] hover:bg-[#f0f1ec]"><LogOut data-icon="inline-start" /> Sign out</button></> : <Link href="/sign-in" className="flex items-center gap-2 whitespace-nowrap rounded-full border border-[#d7d9d2] bg-white px-3 py-2 text-xs font-medium sm:px-4 sm:text-sm text-[#314337] hover:bg-[#f0f1ec]"><UserRound data-icon="inline-start" /> Sign in</Link>}</nav>
      </header>
      {shareMessage && <div role="status" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#1f3b2c] px-4 py-2 text-xs font-semibold text-white shadow-lg">{shareMessage}</div>}<section className="border-b border-[#171513] bg-[#171513] px-4 py-10 text-[#fffdf8] sm:px-6 sm:py-12 lg:px-10">
        <div className="mx-auto max-w-[1440px]"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#f28c58]">A living guide to better coffee</p><h1 className="max-w-3xl font-serif text-4xl leading-[1.02] tracking-tight sm:text-7xl">Find your next <em className="text-[#f28c58]">good cup.</em></h1><p className="mt-4 max-w-xl text-base leading-7 text-[#c7bfb5]">A curated map of specialty cafes, roasters, and the people making Indian coffee worth travelling for.</p></div>
      </section>
      <section className="mx-auto grid max-w-[1600px] gap-3 px-2 py-2 sm:gap-4 sm:px-4 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-5 lg:px-6 lg:py-5">
        <aside className="atlas-shortlist order-1 rounded-2xl border border-[#deded7] bg-[#fbfaf7] p-4 shadow-sm lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:p-5">
          <div className="flex flex-wrap items-end justify-between gap-2"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b46d45]">The shortlist</p><h2 className="mt-1 font-serif text-3xl leading-none">{filtered.length} places</h2></div>{favoritesOnly && <span className="flex items-center gap-1 rounded-full bg-[#fff0e9] px-2.5 py-1 text-xs font-semibold text-[#b64d2d]"><Heart className="size-3 fill-current" /> Saved</span>}</div>
          <label className="mt-4 flex items-center gap-2 rounded-full border border-[#deded7] bg-white px-4 py-3"><Search className="size-4 text-[#8a9189]" aria-hidden="true" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by city, cafe, or tag" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9ba19a]" /></label>
          <div className="mt-4"><div className="mb-2 flex items-center justify-between gap-2"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a9189]">Browse by city</p>{query && <button type="button" onClick={() => shareCity(query)} className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-[#687068] hover:bg-[#f0f1ec]"><Share2 className="size-3" /> Share city</button>}</div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3"><button onClick={() => setQuery('')} className={`min-h-10 rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${!query ? 'bg-[#1f3b2c] text-white' : 'border border-[#deded7] bg-white text-[#687068]'}`}>All cities</button>{popularLists.map((list) => <button key={list.label} onClick={() => setQuery(list.search)} className={`min-h-10 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${query.toLowerCase() === list.search.toLowerCase() ? 'border-[#e2542f] bg-[#fff0e9] text-[#b64d2d]' : 'border-[#deded7] bg-white text-[#687068] hover:border-[#e6c7ae]'}`}><span>{list.label}</span><span className="ml-1 rounded-full bg-[#f0f1ec] px-1.5 py-0.5 text-[10px] font-bold text-[#687068]">{cityCounts[list.search] ?? 0}</span></button>)}</div></div><div className="mt-3 flex items-center justify-between border-t border-[#eee9e1] pt-3"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a9189]">Your places</p><div className="flex items-center gap-2"><button onClick={() => { if (!session?.user) { window.location.href = '/sign-in'; return } setFavoritesOnly((value) => !value) }} aria-pressed={favoritesOnly} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${favoritesOnly ? 'bg-[#e2542f] text-white' : 'border border-[#deded7] bg-white text-[#687068] hover:border-[#e6c7ae]'}`}><Heart className={`size-3 ${favoritesOnly ? 'fill-current' : ''}`} /> Favourites</button>{favoritesOnly && <button type="button" onClick={() => shareCity(query || 'favourites')} aria-label="Share favourites" className="rounded-full border border-[#deded7] bg-white p-2 text-[#687068] hover:border-[#e6c7ae]"><Share2 className="size-3.5" /></button>}</div></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">{filtered.length === 0 ? <div className="rounded-xl border border-dashed border-[#c9cec5] p-5 text-sm text-[#687068]">{allCafes.length === 0 ? 'No approved places are available yet.' : favoritesOnly ? 'No favourites in this area yet.' : 'No places match your search.'}</div> : filtered.map((cafe) => <div key={cafe.id ?? `${cafe.name}-${cafe.lat}-${cafe.lng}`} role="button" tabIndex={0} onClick={() => setSelected(cafe)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelected(cafe) }} aria-current={selected.id === cafe.id ? 'true' : undefined} className={`rounded-xl border p-3 text-left transition ${selected.id === cafe.id ? 'border-2 border-[#e2542f] bg-[#fff0e9] shadow-[0_0_0_3px_rgba(226,84,47,0.12)]' : 'border-transparent hover:border-[#deded7] hover:bg-white'}`}><div className="flex items-center justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-1.5"><h3 className="truncate text-sm font-semibold">{cafe.name}</h3>{cafe.tags.map((tag) => <span key={tag} className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${tag === 'Cafe' ? 'border-[#efb9a3] bg-[#fff0e9] text-[#b64d2d]' : 'border-[#b9c9e8] bg-[#edf3ff] text-[#4167a5]'}`}>{tag}</span>)}</div><p className="mt-1 flex items-center gap-1 truncate text-[11px] text-[#7c847c]"><MapPin className="size-3" />{cafe.area}</p>{cafe.availabilityStatus && cafe.availabilityStatus !== 'open' && <span className={`mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-semibold ${cafe.availabilityStatus === 'permanently_closed' ? 'bg-[#f7d8d3] text-[#9d3f34]' : 'bg-[#fff0c7] text-[#8a6211]'}`}>{cafe.availabilityStatus === 'permanently_closed' ? 'Permanently closed' : 'Temporarily closed'}</span>}</div><div className="flex shrink-0 items-center gap-2"><span className="flex items-center gap-1 text-xs font-semibold text-[#9a603e]"><Star className="size-3 fill-current" />{savedFeedback[cafe.name]?.average?.toFixed(1) ?? cafe.rating}</span><button type="button" onClick={(event) => { event.stopPropagation(); void shareLocation(cafe) }} aria-label={`Share ${cafe.name}`} className="rounded-full p-1.5 text-[#687068] hover:bg-white"><Share2 className="size-4" /></button><button type="button" onClick={(event) => { event.stopPropagation(); void toggleFavorite(cafe) }} aria-label={favoriteIds.includes(cafe.id ?? cafe.name) ? `Remove ${cafe.name} from favourites` : `Save ${cafe.name} to favourites`} className="rounded-full p-1.5 text-[#b46d45] hover:bg-white"><Heart className={`size-4 ${favoriteIds.includes(cafe.id ?? cafe.name) ? 'fill-current' : ''}`} /></button></div></div></div>)}</div>
          {favoriteError && <p role="status" className="mt-3 text-xs text-[#b64d2d]">{favoriteError}</p>}<div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => { setUpdateSent(false); setShowUpdate(true) }} className="rounded-full border border-[#d7d9d2] bg-white px-3 py-2.5 text-sm font-semibold text-[#687068] hover:bg-[#f0f1ec]">Add information</button><button onClick={openFeedback} className="flex items-center justify-center gap-2 rounded-full border border-[#d7d9d2] bg-white px-3 py-2.5 text-sm font-semibold text-[#314337] hover:bg-[#f0f1ec]"><Star className="size-4" /> Rate</button><button onClick={() => { setFlagSent(false); setShowFlag(true) }} className="rounded-full border border-[#d7d9d2] bg-white px-3 py-2.5 text-sm font-semibold text-[#687068] hover:bg-[#f0f1ec]">Report status</button></div>
        </aside>
        <div className="order-2 lg:order-2"><GoogleMapPanel cafes={allCafes} selected={selected} viewport={selectedViewport} onSelect={setSelected} /></div>
      </section>
      {showUpdate && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#20221f]/45 p-4"><section role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-[#deded7] bg-[#fbfaf7] p-6 shadow-2xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b46d45]">Community contribution</p><h2 className="mt-1 font-serif text-2xl">Add information about {selected.name}</h2>{updateSent ? <><p className="mt-3 text-sm text-[#687068]">{updateSent === 'approved' ? 'Thanks. Your update was published immediately.' : 'Thanks. Your update is staged for admin approval.'}</p><button onClick={() => setShowUpdate(false)} className="mt-5 rounded-xl bg-[#1f3b2c] px-4 py-2.5 text-sm font-semibold text-white">Done</button></> : <><label className="mt-5 block text-sm font-semibold">What should people know?<textarea value={updateDetails} onChange={(event) => setUpdateDetails(event.target.value)} placeholder="Share hours, menu details, accessibility, seating, parking, or other useful context." rows={5} maxLength={2000} className="mt-2 w-full resize-none rounded-xl border border-[#d7d9d2] bg-white p-3 text-sm outline-none focus:border-[#b46d45]" /></label><div className="mt-4 flex justify-end gap-2"><button onClick={() => setShowUpdate(false)} className="rounded-xl border border-[#d7d9d2] px-4 py-2.5 text-sm">Cancel</button><button onClick={submitUpdate} disabled={!updateDetails.trim()} className="rounded-xl bg-[#1f3b2c] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Submit for review</button></div></>}</section></div>}
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
      <footer className="mx-auto flex max-w-[1440px] flex-col items-start gap-2 px-4 pb-6 pt-2 text-xs text-[#8a9189] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pb-8"><span>Curated with care for coffee people.</span><span>Suggest a place · About</span></footer>
    </main>
  )
}
