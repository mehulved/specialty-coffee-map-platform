'use client'

import { useMemo, useState } from 'react'
import { Coffee, LogOut, MapPin, Search, Shield, SlidersHorizontal, Star, UserRound, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { GoogleMapPanel } from '@/components/google-map-panel'
import { authClient } from '@/lib/auth-client'

const cafes = [
  { name: 'Subko Coffee', area: 'Bandra West, Mumbai', rating: 4.7, roast: 'Light roast', lat: 19.0596, lng: 72.8295, note: 'Single-origin espresso and thoughtful Indian coffees.' },
  { name: 'Blue Tokai Coffee Roasters', area: 'Saket, New Delhi', rating: 4.5, roast: 'Seasonal', lat: 28.5295, lng: 77.2168, note: 'A reliable neighborhood stop with a rotating brew menu.' },
  { name: 'Savorworks Roasters', area: 'Shahpur Jat, New Delhi', rating: 4.8, roast: 'Experimental', lat: 28.5375, lng: 77.2067, note: 'Micro-lot coffees, careful pour overs, and a calm room.' },
  { name: 'Third Wave Coffee', area: 'Indiranagar, Bengaluru', rating: 4.4, roast: 'All day', lat: 12.9784, lng: 77.6408, note: 'Bright, accessible specialty coffee for everyday drinking.' },
  { name: 'Kapi Kottai', area: 'Besant Nagar, Chennai', rating: 4.8, roast: 'South Indian', lat: 13.0005, lng: 80.2668, note: 'Beautifully roasted Indian beans and slow coffee rituals.' },
]

export default function Page() {
  const { data: session, isPending } = authClient.useSession()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(cafes[0])
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackNote, setFeedbackNote] = useState('')
  const [savedFeedback, setSavedFeedback] = useState<Record<string, { rating: number; note: string }>>({})
  const filtered = useMemo(() => cafes.filter((cafe) => `${cafe.name} ${cafe.area}`.toLowerCase().includes(query.toLowerCase())), [query])
  const currentFeedback = savedFeedback[selected.name]
  const addCafeHref = session?.user ? '/add-cafe' : '/sign-in'

  function saveFeedback() {
    if (!feedbackRating && !feedbackNote.trim()) return
    setSavedFeedback((previous) => ({ ...previous, [selected.name]: { rating: feedbackRating || currentFeedback?.rating || selected.rating, note: feedbackNote.trim() || currentFeedback?.note || '' } }))
    setShowFeedback(false)
    setFeedbackRating(0)
    setFeedbackNote('')
  }

  return (
    <main className="cafe-paper min-h-screen bg-[#f4efe7] text-[#171513]">
      <header className="flex h-20 items-center justify-between border-b border-[#171513] bg-[#171513] px-6 text-[#fffdf8] lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="kaapi home">
          <span className="flex size-10 items-center justify-center rounded-full bg-[#e2542f] text-[#fffdf8]"><Coffee data-icon="inline-start" /></span>
          <span><span className="block font-serif text-xl font-semibold tracking-tight">kaapi</span><span className="block text-[10px] font-medium uppercase tracking-[0.24em] text-[#c7bfb5]">India coffee atlas</span></span>
        </Link>
        <nav className="flex items-center gap-3 text-sm text-[#687068]"><span className="hidden sm:inline">Explore</span>{isPending ? <span className="rounded-full border border-[#d7d9d2] px-4 py-2 text-[#8a9189]">Checking session…</span> : session?.user ? <><Link href="/add-cafe" className="flex items-center gap-2 rounded-full border border-[#d7d9d2] bg-white px-4 py-2 font-medium text-[#314337] hover:bg-[#f0f1ec]"><Plus data-icon="inline-start" /> Add cafe</Link><Link href="/admin" className="flex items-center gap-2 rounded-full border border-[#d7d9d2] bg-white px-4 py-2 font-medium text-[#314337] hover:bg-[#f0f1ec]"><Shield data-icon="inline-start" /> Admin</Link><button onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => window.location.reload() } })} className="flex items-center gap-2 rounded-full border border-[#d7d9d2] bg-white px-4 py-2 font-medium text-[#314337] hover:bg-[#f0f1ec]"><LogOut data-icon="inline-start" /> Sign out</button></> : <Link href="/sign-in" className="flex items-center gap-2 rounded-full border border-[#d7d9d2] bg-white px-4 py-2 font-medium text-[#314337] hover:bg-[#f0f1ec]"><UserRound data-icon="inline-start" /> Sign in</Link>}</nav>
      </header>
      <section className="border-b border-[#171513] bg-[#171513] px-6 py-12 text-[#fffdf8] lg:px-10">
        <div className="mx-auto max-w-[1440px]"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#f28c58]">A living guide to better coffee</p><h1 className="max-w-3xl font-serif text-4xl leading-[1.02] tracking-tight sm:text-7xl">Find your next <em className="text-[#f28c58]">good cup.</em></h1><p className="mt-4 max-w-xl text-base leading-7 text-[#c7bfb5]">A curated map of specialty cafes, roasters, and the people making Indian coffee worth travelling for.</p></div>
      </section>
      <section className="mx-auto grid max-w-[1440px] gap-5 px-4 py-5 lg:grid-cols-[360px_1fr] lg:px-6">
        <aside className="flex min-h-[600px] flex-col rounded-2xl border border-[#deded7] bg-[#fbfaf7] p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a9189]">Explore the atlas</p><h2 className="mt-1 font-serif text-2xl">{filtered.length} places to start</h2></div><button className="rounded-lg border border-[#deded7] p-2 text-[#687068] hover:bg-[#f0f1ec]" aria-label="Filter cafes"><SlidersHorizontal data-icon="inline-start" /></button></div>
          <label className="mb-4 flex items-center gap-2 rounded-xl border border-[#deded7] bg-white px-3 py-2.5"><Search className="text-[#8a9189]" aria-hidden="true" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search city or cafe" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9ba19a]" /></label>
          <div className="flex flex-col gap-2 overflow-auto">{filtered.map((cafe) => <button key={cafe.name} onClick={() => setSelected(cafe)} className={`rounded-xl border p-3 text-left transition ${selected.name === cafe.name ? 'border-[#b46d45] bg-[#fff8f0]' : 'border-transparent hover:border-[#deded7] hover:bg-white'}`}><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{cafe.name}</h3><p className="mt-1 flex items-center gap-1 text-xs text-[#7c847c]"><MapPin className="size-3.5" />{cafe.area}</p></div><span className="flex items-center gap-1 text-sm font-semibold text-[#9a603e]"><Star className="size-3.5 fill-current" />{cafe.rating}</span></div><p className="mt-3 text-xs leading-5 text-[#6d756e]">{cafe.note}</p></button>)}</div>
          <Link href={addCafeHref} className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-[#1f3b2c] px-4 py-3 text-sm font-semibold text-white hover:bg-[#294b38]"><Plus className="size-4" /> Add a cafe</Link>
          <button onClick={() => { setFeedbackRating(currentFeedback?.rating ?? 0); setFeedbackNote(currentFeedback?.note ?? ''); setShowFeedback(true) }} className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-[#d7d9d2] bg-white px-4 py-3 text-sm font-semibold text-[#314337] hover:bg-[#f0f1ec]"><Star className="size-4" /> Add notes or rating</button>
        </aside>
        <GoogleMapPanel cafes={cafes} selected={selected} onSelect={setSelected} />
      </section>
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#20221f]/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowFeedback(false) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="feedback-title" className="w-full max-w-md rounded-2xl border border-[#deded7] bg-[#fbfaf7] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a9189]">Your field notes</p><h2 id="feedback-title" className="mt-1 font-serif text-2xl">{selected.name}</h2><p className="mt-1 text-sm text-[#687068]">{selected.area}</p></div><button onClick={() => setShowFeedback(false)} aria-label="Close feedback" className="rounded-lg p-2 text-[#687068] hover:bg-[#f0f1ec]"><X /></button></div>
            <div className="mt-6"><p className="text-sm font-semibold text-[#314337]">Your rating</p><div className="mt-2 flex gap-2" aria-label="Choose a rating from one to five stars">{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" onClick={() => setFeedbackRating(rating)} aria-label={`${rating} stars`} className="rounded-md p-1"><Star className={`size-7 ${rating <= feedbackRating ? 'fill-[#b46d45] text-[#b46d45]' : 'text-[#c4c8c0]'}`} /></button>)}</div></div>
            <label className="mt-5 block text-sm font-semibold text-[#314337]">Notes<textarea value={feedbackNote} onChange={(event) => setFeedbackNote(event.target.value)} placeholder="What should another coffee person know?" rows={4} className="mt-2 w-full resize-none rounded-xl border border-[#d7d9d2] bg-white p-3 text-sm outline-none focus:border-[#b46d45]" /></label>
            <div className="mt-5 flex justify-end gap-2"><button onClick={() => setShowFeedback(false)} className="rounded-xl border border-[#d7d9d2] px-4 py-2.5 text-sm font-semibold text-[#687068]">Cancel</button><button onClick={saveFeedback} disabled={!feedbackRating && !feedbackNote.trim()} className="rounded-xl bg-[#1f3b2c] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Save notes</button></div>
          </section>
        </div>
      )}
      <footer className="mx-auto flex max-w-[1440px] items-center justify-between px-6 pb-8 pt-2 text-xs text-[#8a9189]"><span>Curated with care for coffee people.</span><span>Suggest a place · About</span></footer>
    </main>
  )
}
