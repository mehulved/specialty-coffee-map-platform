'use client'

import { useEffect, useRef, useState } from 'react'
import { Coffee, MapPin } from 'lucide-react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

type Cafe = {
  name: string
  area: string
  rating: number
  tags: string[]
  roast: string
  lat: number
  lng: number
  note: string
}

type MapViewport = { center: { lat: number; lng: number }; zoom: number }

type GoogleMapPanelProps = {
  cafes: Cafe[]
  selected: Cafe
  viewport?: MapViewport
  onSelect: (cafe: Cafe) => void
}

export function GoogleMapPanel({ cafes, selected, viewport, onSelect }: GoogleMapPanelProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markers = useRef<any[]>([])
  const [mapError, setMapError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadMap() {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey || !mapRef.current) {
        setMapError(true)
        return
      }

      try {
        setOptions({ key: apiKey, v: 'weekly' })
        const { Map } = await importLibrary('maps') as any
        const { AdvancedMarkerElement } = await importLibrary('marker') as any
        if (cancelled || !mapRef.current) return

        const map = new Map(mapRef.current, {
          center: viewport?.center ?? { lat: 22.5, lng: 79.5 },
          zoom: viewport?.zoom ?? 5,
          mapId: 'kaapi-atlas',
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
        })
        mapInstance.current = map

        markers.current = cafes.map((cafe) => {
          const marker = new AdvancedMarkerElement({
            map,
            position: { lat: cafe.lat, lng: cafe.lng },
            title: cafe.name,
          })
          marker.addListener('click', () => onSelect(cafe))
          return marker
        })
        map.panTo(viewport?.center ?? { lat: selected.lat, lng: selected.lng })
        map.setZoom(viewport?.zoom ?? 16)
      } catch (error) {
        console.error('[v0] Google Maps failed to load:', error)
        setMapError(true)
      }
    }

    loadMap()
    return () => {
      cancelled = true
      markers.current.forEach((marker) => { marker.map = null })
      markers.current = []
    }
  }, [cafes, onSelect, viewport])

  useEffect(() => {
    if (!mapInstance.current) return
    const target = viewport?.center ?? { lat: selected.lat, lng: selected.lng }
    mapInstance.current.panTo(target)
    window.setTimeout(() => mapInstance.current?.setZoom(viewport?.zoom ?? 16), 0)
  }, [selected, viewport])

  return (
    <div className="relative min-h-[350px] overflow-hidden rounded-2xl border border-[#deded7] bg-[#e6e5de] shadow-sm sm:min-h-[420px] lg:min-h-[calc(100vh-9rem)]">
      <div ref={mapRef} className="absolute inset-0" aria-label="Interactive map of specialty coffee cafes in India" />
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#e6e5de] p-6 text-center">
          <div className="max-w-sm rounded-2xl border border-[#deded7] bg-[#fbfaf7] p-6 shadow-xl">
            <MapPin className="mx-auto mb-3 text-[#b46d45]" />
            <h3 className="font-serif text-xl">Map unavailable</h3>
            <p className="mt-2 text-sm leading-6 text-[#687068]">Google Maps could not load. Check that this key has Maps JavaScript API enabled and allows this preview origin.</p>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-2xl border border-white/70 bg-[#fbfaf7]/95 p-4 shadow-xl backdrop-blur sm:bottom-5 sm:left-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a9189]">Selected place</p>
        <h3 className="mt-1 font-serif text-xl">{selected.name}</h3>
        <p className="mt-1 text-xs text-[#687068]">{selected.area}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#9a603e]">{selected.tags.map((tag) => <span key={tag} className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${tag === 'Cafe' ? 'border-[#efb9a3] bg-[#fff0e9] text-[#b64d2d]' : 'border-[#b9c9e8] bg-[#edf3ff] text-[#4167a5]'}`}>{tag}</span>)}<span className="flex items-center gap-1"><Coffee className="size-3.5" /> {selected.rating} community rating</span><span className="text-[#b9beb7]">·</span> {selected.roast}</div>
      </div>
    </div>
  )
}

export default GoogleMapPanel
