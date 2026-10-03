'use client'

import { useMemo, useState } from 'react'
import { Coffee, MapPin, Search, SlidersHorizontal, Star, UserRound, Plus, Compass } from 'lucide-react'
import Link from 'next/link'

const cafes = [
  { name: 'Subko Coffee', area: 'Bandra West, Mumbai', rating: 4.7, roast: 'Light roast', lat: 19.0596, lng: 72.8295, note: 'Single-origin espresso and thoughtful Indian coffees.' },
  { name: 'Blue Tokai Coffee Roasters', area: 'Saket, New Delhi', rating: 4.5, roast: 'Seasonal', lat: 28.5295, lng: 77.2168, note: 'A reliable neighborhood stop with a rotating brew menu.' },
  { name: 'Savorworks Roasters', area: 'Shahpur Jat, New Delhi', rating: 4.8, roast: 'Experimental', lat: 28.5375, lng: 77.2067, note: 'Micro-lot coffees, careful pour overs, and a calm room.' },
  { name: 'Third Wave Coffee', area: 'Indiranagar, Bengaluru', rating: 4.4, roast: 'All day', lat: 12.9784, lng: 77.6408, note: 'Bright, accessible specialty coffee for everyday drinking.' },
  { name: 'Kapi Kottai', area: 'Besant Nagar, Chennai', rating: 4.8, roast: 'South Indian', lat: 13.0005, lng: 80.2668, note: 'Beautifully roasted Indian beans and slow coffee rituals.' },
]

export default function Page() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(cafes[0])
  const filtered = useMemo(() => cafes.filter((cafe) => `${cafe.name} ${cafe.area}`.toLowerCase().includes(query.toLowerCase())), [query])

  return (
    <main className="min-h-screen bg-[#f7f6f2] text-[#20221f]">
      <header className="flex h-20 items-center justify-between border-b border-[#deded7] bg-[#fbfaf7] px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="Sūtra home">
          <span className="flex size-10 items-center justify-center rounded-full bg-[#1f3b2c] text-[#f5e9d0]"><Coffee data-icon="inline-start" /></span>
          <span><span className="block font-serif text-xl font-semibold tracking-tight">Sūtra</span><span className="block text-[10px] font-medium uppercase tracking-[0.24em] text-[#778077]">India coffee atlas</span></span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-[#687068]"><span className="hidden sm:inline">Explore</span><Link href="/sign-in" className="flex items-center gap-2 rounded-full border border-[#d7d9d2] bg-white px-4 py-2 font-medium text-[#314337] hover:bg-[#f0f1ec]"><UserRound data-icon="inline-start" /> Sign in</Link></nav>
      </header>
      <section className="border-b border-[#deded7] bg-[#fbfaf7] px-6 py-10 lg:px-10">
        <div className="mx-auto max-w-[1440px]"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#b46d45]">A living guide to better coffee</p><h1 className="max-w-3xl font-serif text-4xl leading-[1.08] tracking-tight sm:text-6xl">Find your next <em className="text-[#b46d45]">good cup.</em></h1><p className="mt-4 max-w-xl text-base leading-7 text-[#687068]">A curated map of specialty cafes, roasters, and the people making Indian coffee worth travelling for.</p></div>
      </section>
      <section className="mx-auto grid max-w-[1440px] gap-5 px-4 py-5 lg:grid-cols-[360px_1fr] lg:px-6">
        <aside className="flex min-h-[600px] flex-col rounded-2xl border border-[#deded7] bg-[#fbfaf7] p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a9189]">Explore the atlas</p><h2 className="mt-1 font-serif text-2xl">{filtered.length} places to start</h2></div><button className="rounded-lg border border-[#deded7] p-2 text-[#687068] hover:bg-[#f0f1ec]" aria-label="Filter cafes"><SlidersHorizontal data-icon="inline-start" /></button></div>
          <label className="mb-4 flex items-center gap-2 rounded-xl border border-[#deded7] bg-white px-3 py-2.5"><Search className="text-[#8a9189]" aria-hidden="true" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search city or cafe" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9ba19a]" /></label>
          <div className="flex flex-col gap-2 overflow-auto">{filtered.map((cafe) => <button key={cafe.name} onClick={() => setSelected(cafe)} className={`rounded-xl border p-3 text-left transition ${selected.name === cafe.name ? 'border-[#b46d45] bg-[#fff8f0]' : 'border-transparent hover:border-[#deded7] hover:bg-white'}`}><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{cafe.name}</h3><p className="mt-1 flex items-center gap-1 text-xs text-[#7c847c]"><MapPin className="size-3.5" />{cafe.area}</p></div><span className="flex items-center gap-1 text-sm font-semibold text-[#9a603e]"><Star className="size-3.5 fill-current" />{cafe.rating}</span></div><p className="mt-3 text-xs leading-5 text-[#6d756e]">{cafe.note}</p><span className="mt-2 inline-block rounded-full bg-[#e9eee6] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#4d6a54]">{cafe.roast}</span></button>)}</div>
          <Link href="/sign-in" className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-[#1f3b2c] px-4 py-3 text-sm font-semibold text-white hover:bg-[#294b38]"><Plus className="size-4" /> Add a cafe</Link>
        </aside>
        <div className="relative min-h-[600px] overflow-hidden rounded-2xl border border-[#deded7] bg-[#e6e5de] shadow-sm"><div className="absolute inset-0 opacity-50" style={{backgroundImage: 'linear-gradient(#cfd1c8 1px, transparent 1px), linear-gradient(90deg, #cfd1c8 1px, transparent 1px)', backgroundSize: '48px 48px'}} /><div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#f2f0e8cc,transparent_68%)]" /><div className="absolute left-[44%] top-[36%] flex flex-col items-center"><span className="mb-2 rounded-full bg-[#1f3b2c] px-3 py-1 text-xs font-semibold text-white shadow-lg">India</span><Compass className="size-6 text-[#b8bbb2]" /></div>{cafes.map((cafe, index) => <button key={cafe.name} onClick={() => setSelected(cafe)} className={`absolute flex size-10 items-center justify-center rounded-full border-4 border-white shadow-lg transition hover:scale-110 ${selected.name === cafe.name ? 'bg-[#b46d45] ring-4 ring-[#b46d4533]' : 'bg-[#315740]'}`} style={{left: `${22 + index * 14}%`, top: `${22 + (index % 3) * 18}%`}} aria-label={`Show ${cafe.name}`}><Coffee className="size-4 text-white" /></button>)}<div className="absolute bottom-5 left-5 max-w-xs rounded-xl border border-white/70 bg-[#fbfaf7]/95 p-4 shadow-xl backdrop-blur"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a9189]">Selected place</p><h3 className="mt-1 font-serif text-xl">{selected.name}</h3><p className="mt-1 text-xs text-[#687068]">{selected.area}</p><div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#9a603e]"><Star className="size-3.5 fill-current" /> {selected.rating} community rating <span className="text-[#b9beb7]">·</span> {selected.roast}</div></div><div className="absolute right-5 top-5 rounded-xl border border-white/70 bg-[#fbfaf7]/90 px-3 py-2 text-xs text-[#687068] shadow-sm backdrop-blur">Map preview · connect Google Maps to explore</div></div>
      </section>
      <footer className="mx-auto flex max-w-[1440px] items-center justify-between px-6 pb-8 pt-2 text-xs text-[#8a9189]"><span>Curated with care for coffee people.</span><span>Suggest a place · About</span></footer>
    </main>
  )
}
