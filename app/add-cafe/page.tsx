'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, Coffee, MapPin, Search, Send } from 'lucide-react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { authClient } from '@/lib/auth-client'

type PlaceSelection = {
  name: string
  address: string
  lat: number
  lng: number
}

export default function AddCafePage() {
  const { data: session, isPending } = authClient.useSession()
  const mapRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const mapInstance = useRef<any>(null)
  const pin = useRef<any>(null)
  const [submitted, setSubmitted] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [place, setPlace] = useState<PlaceSelection | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState('Cafe')

  useEffect(() => {
    if (!session?.user || !mapRef.current || !searchRef.current) return
    let cancelled = false

    async function loadLocationPicker() {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) { setMapError(true); return }
      try {
        setOptions({ key: apiKey, v: 'weekly' })
        const { Map } = await importLibrary('maps') as any
        const { AdvancedMarkerElement } = await importLibrary('marker') as any
        const { Autocomplete } = await importLibrary('places') as any
        if (cancelled || !mapRef.current || !searchRef.current) return
        const map = new Map(mapRef.current, { center: { lat: 22.5, lng: 79.5 }, zoom: 5, mapId: 'kaapi-location-picker', streetViewControl: false, mapTypeControl: false, fullscreenControl: false, gestureHandling: 'greedy' })
        mapInstance.current = map
        const autocomplete = new Autocomplete(searchRef.current, { fields: ['name', 'formatted_address', 'geometry'], componentRestrictions: { country: 'in' } })
        autocomplete.addListener('place_changed', () => {
          const result = autocomplete.getPlace()
          const location = result.geometry?.location
          if (!location) return
          const selection = { name: result.name ?? '', address: result.formatted_address ?? '', lat: location.lat(), lng: location.lng() }
          setPlace(selection)
          setName(result.name ?? '')
          map.panTo({ lat: selection.lat, lng: selection.lng })
          map.setZoom(16)
          if (pin.current) pin.current.map = null
          pin.current = new AdvancedMarkerElement({ map, position: { lat: selection.lat, lng: selection.lng }, title: selection.name })
        })
        map.addListener('click', (event: any) => {
          if (!event.latLng) return
          const selection = { name: name || 'Pinned location', address: 'Pinned on map', lat: event.latLng.lat(), lng: event.latLng.lng() }
          setPlace(selection)
          if (pin.current) pin.current.map = null
          pin.current = new AdvancedMarkerElement({ map, position: { lat: selection.lat, lng: selection.lng }, title: selection.name })
        })
      } catch (error) {
        console.error('[v0] Location picker failed to load:', error)
        setMapError(true)
      }
    }

    loadLocationPicker()
    return () => { cancelled = true; if (pin.current) pin.current.map = null }
  }, [session?.user])

  if (isPending) return <main className="flex min-h-screen items-center justify-center bg-[#f4efe7] text-sm text-[#687068]">Checking session…</main>
  if (!session?.user) return <main className="flex min-h-screen items-center justify-center bg-[#f4efe7] p-6"><div className="rounded-2xl border border-[#deded7] bg-[#fffdf8] p-8 text-center"><h1 className="font-serif text-3xl">Sign in to suggest a location</h1><p className="mt-2 text-sm text-[#687068]">Anyone with an account can submit a place for review.</p><Link href="/sign-in" className="mt-6 inline-block rounded-xl bg-[#e2542f] px-4 py-3 text-sm font-semibold text-white">Sign in</Link></div></main>

  return <main className="min-h-screen bg-[#eee8dc] p-6 text-[#171513] lg:p-10"><div className="mx-auto max-w-5xl"><Link href="/" className="flex items-center gap-3 text-[#171513]"><span className="flex size-10 items-center justify-center rounded-full bg-[#e2542f] text-white"><Coffee /></span><span className="font-serif text-xl font-semibold">kaapi</span></Link><Link href="/" className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-[#685f58]"><ArrowLeft className="size-4" /> Back to atlas</Link><div className="mt-5 rounded-2xl border-2 border-[#171513] bg-[#fffdf8] p-6 shadow-[8px_8px_0_#c7d98b] sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e2542f]">Community submission</p><h1 className="mt-2 font-serif text-4xl">Add a location</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#685f58]">Search Google Maps, choose the right place, or drop a pin. Then add the details that help the community understand it.</p>{submitted ? <div className="mt-8 rounded-xl border border-[#a8c486] bg-[#eef6df] p-5"><Check className="text-[#54733a]" /><h2 className="mt-2 font-semibold text-[#314337]">Submission staged for review</h2><p className="mt-1 text-sm text-[#687068]">Thank you. A kaapi moderator will review this location before publication.</p><Link href="/" className="mt-4 inline-block text-sm font-semibold text-[#e2542f]">Return to atlas</Link></div> : <form className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.15fr]" onSubmit={(event) => { event.preventDefault(); if (place && name.trim()) setSubmitted(true) }}><div className="flex flex-col gap-5"><label className="flex flex-col gap-2 text-sm font-semibold">Search Google Maps<div className="relative"><Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-[#8a8178]" /><input ref={searchRef} placeholder="Search the place by name" className="w-full rounded-xl border border-[#cfc5b7] bg-[#f7f1e8] py-3 pl-10 pr-3 font-normal outline-none focus:border-[#e2542f]" /></div></label><div className="rounded-xl border border-[#cfc5b7] bg-[#f7f1e8] p-4 text-sm"><div className="flex items-center gap-2 font-semibold"><MapPin className="size-4 text-[#e2542f]" /> {place ? 'Location selected' : 'Choose a place or drop a pin'}</div><p className="mt-2 text-xs leading-5 text-[#685f58]">{place ? `${place.name}${place.address !== 'Pinned on map' ? ` · ${place.address}` : ' · Pinned on map'}` : 'Search above, select a Google Maps result, or click anywhere on the map.'}</p></div><label className="flex flex-col gap-2 text-sm font-semibold">Location name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Subko Coffee" className="rounded-xl border border-[#cfc5b7] bg-white px-3 py-3 font-normal outline-none focus:border-[#e2542f]" /></label><fieldset className="flex flex-col gap-3"><legend className="text-sm font-semibold">What kind of place is it?</legend><div className="grid gap-3 sm:grid-cols-3"><label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#efb9a3] bg-[#fff0e9] p-3 text-sm"><input required type="radio" name="type" value="Cafe" checked={type === 'Cafe'} onChange={() => setType('Cafe')} /> Cafe</label><label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#b9c9e8] bg-[#edf3ff] p-3 text-sm"><input type="radio" name="type" value="Roastery" checked={type === 'Roastery'} onChange={() => setType('Roastery')} /> Roastery</label><label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#d8c68d] bg-[#fff8d9] p-3 text-sm"><input type="radio" name="type" value="Cafe · Roastery" checked={type === 'Cafe · Roastery'} onChange={() => setType('Cafe · Roastery')} /> Both</label></div></fieldset><label className="flex flex-col gap-2 text-sm font-semibold">Notes<textarea name="notes" placeholder="What makes this place worth visiting?" rows={4} className="resize-none rounded-xl border border-[#cfc5b7] bg-white p-3 font-normal outline-none focus:border-[#e2542f]" /></label><button disabled={!place || !name.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e2542f] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"><Send className="size-4" /> Submit for review</button></div><div className="relative min-h-[420px] overflow-hidden rounded-2xl border-2 border-[#171513] bg-[#d9d5cc]"><div ref={mapRef} className="absolute inset-0" aria-label="Select a location on Google Maps" />{mapError && <div className="absolute inset-0 flex items-center justify-center bg-[#e8e1d7] p-6 text-center"><div><MapPin className="mx-auto mb-2 text-[#e2542f]" /><p className="text-sm font-semibold">Map unavailable</p><p className="mt-1 text-xs text-[#685f58]">Search and map selection need the Google Maps API enabled.</p></div></div>}<div className="pointer-events-none absolute left-4 top-4 rounded-full bg-[#fffdf8]/95 px-3 py-2 text-xs font-semibold shadow-lg">Click map to drop a pin</div></div></form>}</div></div></main>
}
