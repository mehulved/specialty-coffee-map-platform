'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, Coffee, MapPin, Search, Send } from 'lucide-react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { authClient } from '@/lib/auth-client'
import { createCafeSubmission } from '@/app/actions/submissions'

type PlaceSelection = { name: string; address: string; lat: number; lng: number }

export default function AddCafePage() {
  const { data: session, isPending } = authClient.useSession()
  const mapRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const pin = useRef<any>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState<'approved' | 'pending'>('pending')
  const [mapError, setMapError] = useState(false)
  const [place, setPlace] = useState<PlaceSelection | null>(null)
  const [name, setName] = useState('')
  const [types, setTypes] = useState<string[]>(['Cafe'])
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  async function submitLocation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!place || !name.trim() || !types.length) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const result = await createCafeSubmission({ name, address: place.address, latitude: place.lat, longitude: place.lng, tags: types, details })
      setSubmissionStatus(result.status)
      setSubmitted(true)
    } catch {
      setSubmitError('We could not stage this location. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!session?.user || !mapRef.current || !searchRef.current) return
    let cancelled = false
    async function loadPicker() {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) return setMapError(true)
      try {
        setOptions({ key: apiKey, v: 'weekly' })
        const { Map } = await importLibrary('maps') as any
        const { AdvancedMarkerElement } = await importLibrary('marker') as any
        const { PlaceAutocompleteElement } = await importLibrary('places') as any
        if (cancelled || !mapRef.current || !searchRef.current) return
        const map = new Map(mapRef.current, { center: { lat: 22.5, lng: 79.5 }, zoom: 5, mapId: 'caffography-location-picker', streetViewControl: false, mapTypeControl: false, fullscreenControl: false, gestureHandling: 'greedy' })
        mapInstance.current = map
        const autocomplete = new PlaceAutocompleteElement({ includedRegionCodes: ['in'] })
        autocomplete.placeholder = 'Search the place by name'
        autocomplete.className = 'w-full min-h-12'
        autocomplete.style.colorScheme = 'light'
        autocomplete.setAttribute('aria-label', 'Search Google Maps')
        searchRef.current.replaceChildren(autocomplete)
        const select = (selection: PlaceSelection) => { setPlace(selection); setName(selection.name); map.panTo({ lat: selection.lat, lng: selection.lng }); map.setZoom(16); if (pin.current) pin.current.map = null; pin.current = new AdvancedMarkerElement({ map, position: { lat: selection.lat, lng: selection.lng }, title: selection.name }) }
        autocomplete.addEventListener('gmp-select', async (event: any) => { const prediction = event.placePrediction; if (!prediction) return; const selectedPlace = prediction.toPlace(); await selectedPlace.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] }); const location = selectedPlace.location; if (location) select({ name: selectedPlace.displayName ?? '', address: selectedPlace.formattedAddress ?? '', lat: location.lat(), lng: location.lng() }) })
        map.addListener('click', (event: any) => { if (event.latLng) select({ name: name || 'Pinned location', address: 'Pinned on map', lat: event.latLng.lat(), lng: event.latLng.lng() }) })
      } catch { setMapError(true) }
    }
    loadPicker()
    return () => { cancelled = true; if (pin.current) pin.current.map = null }
  }, [session?.user])

  if (isPending) return <main className="flex min-h-screen items-center justify-center bg-[#f4efe7] text-sm text-[#687068]">Checking session…</main>
  if (!session?.user) return <main className="flex min-h-screen items-center justify-center bg-[#f4efe7] p-6"><div className="rounded-2xl border border-[#deded7] bg-[#fffdf8] p-8 text-center"><h1 className="font-serif text-3xl">Sign in to suggest a location</h1><p className="mt-2 text-sm text-[#687068]">Anyone with an account can submit a place for review.</p><Link href="/sign-in" className="mt-6 inline-block rounded-xl bg-[#e2542f] px-4 py-3 text-sm font-semibold text-white">Sign in</Link></div></main>

  return <main className="min-h-screen bg-[#eee8dc] p-6 text-[#171513] lg:p-10"><div className="mx-auto max-w-5xl"><Link href="/" className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-full bg-[#e2542f] text-white"><Coffee /></span><span className="font-serif text-xl font-semibold">caffography</span></Link><Link href="/" className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-[#685f58]"><ArrowLeft className="size-4" /> Back to atlas</Link><div className="mt-5 rounded-2xl border-2 border-[#171513] bg-[#fffdf8] p-6 shadow-[8px_8px_0_#c7d98b] sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e2542f]">Community submission</p><h1 className="mt-2 font-serif text-4xl">Add a location</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#685f58]">Search Google Maps, drop a pin, then tell us what kind of place it is.</p>{submitted ? <div className="mt-8 rounded-xl border border-[#a8c486] bg-[#eef6df] p-5"><Check className="text-[#54733a]" /><h2 className="mt-2 font-semibold">{submissionStatus === 'approved' ? 'Location published' : 'Submission staged for review'}</h2><p className="mt-1 text-sm text-[#687068]">{submissionStatus === 'approved' ? 'Your admin submission is live in the atlas immediately.' : 'A caffography moderator will review this location before publication.'}</p><Link href="/" className="mt-4 inline-block text-sm font-semibold text-[#e2542f]">Return to atlas</Link></div> : <form className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.15fr]" onSubmit={submitLocation}><div className="flex flex-col gap-5"><label className="flex flex-col gap-2 text-sm font-semibold">Search Google Maps<div className="relative"><Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-[#8a8178]" /><div ref={searchRef} className="relative z-30 min-h-12 overflow-visible rounded-xl border border-[#cfc5b7] bg-[#f7f1e8] text-[#171513] font-normal focus-within:border-[#e2542f] [&>gmp-place-autocomplete]:block [&>gmp-place-autocomplete]:min-h-12 [&>gmp-place-autocomplete]:w-full" /></div></label><label className="flex flex-col gap-2 text-sm font-semibold">Location name<input required value={name} onChange={(event) => setName(event.target.value)} className="rounded-xl border border-[#cfc5b7] bg-[#f7f1e8] px-3 py-3 font-normal outline-none focus:border-[#e2542f]" /></label><fieldset><legend className="text-sm font-semibold">What kind of place is it?</legend><p className="mt-1 text-xs text-[#685f58]">Choose one or both.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#efb9a3] bg-[#fff0e9] p-3 text-sm font-semibold"><input type="checkbox" checked={types.includes('Cafe')} onChange={() => setTypes((current) => current.includes('Cafe') ? current.filter((item) => item !== 'Cafe') : [...current, 'Cafe'])} className="size-4 accent-[#e2542f]" /> Cafe</label><label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#b9c9e8] bg-[#edf3ff] p-3 text-sm font-semibold"><input type="checkbox" checked={types.includes('Roastery')} onChange={() => setTypes((current) => current.includes('Roastery') ? current.filter((item) => item !== 'Roastery') : [...current, 'Roastery'])} className="size-4 accent-[#4167a5]" /> Roastery</label></div></fieldset><label className="flex flex-col gap-2 text-sm font-semibold">Details<textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={4} placeholder="What should the community know?" className="resize-none rounded-xl border border-[#cfc5b7] bg-[#f7f1e8] px-3 py-3 font-normal outline-none focus:border-[#e2542f]" /></label><button disabled={!place || !name.trim() || !types.length} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#171513] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"><Send className="size-4" /> Submit for review</button></div><div><div ref={mapRef} className="min-h-[430px] overflow-hidden rounded-xl border-2 border-[#171513] bg-[#d9e4ef]" />{mapError && <p className="mt-2 text-xs text-[#b64d2d]">Google Maps could not load. You can still search again after refreshing.</p>}{place && <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#eef6df] p-3 text-sm"><MapPin className="mt-0.5 size-4 text-[#54733a]" /><div><strong>{place.name}</strong><p className="text-xs text-[#685f58]">{place.address}</p><p className="mt-1 text-xs text-[#54733a]">Pin selected</p></div></div>}</div></form>}</div></div></main>
}
