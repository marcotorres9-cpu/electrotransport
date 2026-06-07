'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Navigation, Search, X, Clock, Loader2 } from 'lucide-react'

interface AddressSuggestion {
  displayName: string
  lat: number
  lng: number
  shortName: string
}

interface AddressSearchProps {
  label: string
  placeholder: string
  value: string
  onChange: (address: string, lat: number, lng: number) => void
  color?: 'green' | 'amber'
  autoFocus?: boolean
  onUseMyLocation?: () => void
  showMyLocation?: boolean
}

export default function AddressSearch({
  label,
  placeholder,
  value,
  onChange,
  color = 'green',
  autoFocus = false,
  onUseMyLocation,
  showMyLocation = false,
}: AddressSearchProps) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const colorClasses = color === 'green'
    ? {
        dot: 'bg-[#1DB954]',
        ring: 'border-[#1DB954]',
        focus: 'focus:border-[#1DB954]',
        text: 'text-[#1DB954]',
        iconBg: 'bg-[#1DB954]/10',
      }
    : {
        dot: 'bg-[#FFC145]',
        ring: 'border-[#FFC145]',
        focus: 'focus:border-[#FFC145]',
        text: 'text-[#FFC145]',
        iconBg: 'bg-[#FFC145]/10',
      }

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('et-recent-searches')
      if (saved) setRecentSearches(JSON.parse(saved))
    } catch {}
  }, [])

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Debounced search using Nominatim
  const searchAddress = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsSearching(true)
    try {
      // Focus on Quito/Ecuador area
      const bounds = '-0.5,-78.8,0.0,-78.3'
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ' Quito Ecuador')}&limit=5&bounded=0&viewbox=${bounds}&addressdetails=1&accept-language=es`
      )
      const data = await res.json()

      const results: AddressSuggestion[] = data.map((item: any) => ({
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        shortName: extractShortName(item),
      }))

      setSuggestions(results)
      setShowSuggestions(results.length > 0)
    } catch {
      // If search fails, try without bounds
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&accept-language=es`
        )
        const data = await res.json()

        const results: AddressSuggestion[] = data.map((item: any) => ({
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          shortName: extractShortName(item),
        }))

        setSuggestions(results)
        setShowSuggestions(results.length > 0)
      } catch {
        setSuggestions([])
      }
    } finally {
      setIsSearching(false)
    }
  }, [])

  function extractShortName(item: any): string {
    const addr = item.address || {}
    if (item.type === 'house' || item.type === 'building') {
      const parts = [addr.road, addr.suburb || addr.neighbourhood, addr.city || addr.town]
      return parts.filter(Boolean).slice(0, 2).join(', ')
    }
    if (addr.road) {
      return addr.road + (addr.house_number ? ' #' + addr.house_number : '')
    }
    if (addr.suburb || addr.neighbourhood) {
      return addr.suburb || addr.neighbourhood
    }
    return item.display_name.split(',').slice(0, 2).join(',').trim()
  }

  function handleInputChange(text: string) {
    setQuery(text)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (text.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchAddress(text)
    }, 400)
  }

  function selectSuggestion(suggestion: AddressSuggestion) {
    setQuery(suggestion.shortName)
    setShowSuggestions(false)
    onChange(suggestion.shortName, suggestion.lat, suggestion.lng)

    // Save to recent searches
    const updated = [suggestion.shortName, ...recentSearches.filter(s => s !== suggestion.shortName)].slice(0, 5)
    setRecentSearches(updated)
    try {
      localStorage.setItem('et-recent-searches', JSON.stringify(updated))
    } catch {}
  }

  function clearInput() {
    setQuery('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  return (
    <div className="relative">
      <div className={`flex items-center gap-3 bg-white border ${colorClasses.ring}/20 rounded-xl p-3 shadow-sm`}>
        {/* Color indicator dot */}
        <div className={`w-3 h-3 rounded-full ${colorClasses.dot} shrink-0`} />

        {/* Input */}
        <div className="flex-1">
          <p className={`text-[10px] font-semibold ${colorClasses.text} uppercase tracking-wide mb-0.5`}>{label}</p>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => query.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
            className="w-full text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
          />
        </div>

        {/* Loading or clear */}
        {isSearching ? (
          <Loader2 className="h-4 w-4 text-gray-400 animate-spin shrink-0" />
        ) : query ? (
          <button onClick={clearInput} className="text-gray-400 hover:text-gray-600 shrink-0">
            <X className="h-4 w-4" />
          </button>
        ) : (
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
        )}
      </div>

      {/* My Location button */}
      {showMyLocation && onUseMyLocation && (
        <button
          onClick={onUseMyLocation}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-gray-400 hover:text-[#3B82F6] transition-colors"
          style={{ display: query ? 'none' : 'block' }}
          title="Usar mi ubicación actual"
        >
          <Navigation className="h-4 w-4" />
        </button>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Loading */}
          {isSearching && (
            <div className="flex items-center gap-2 px-4 py-3 text-gray-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs">Buscando...</span>
            </div>
          )}

          {/* Suggestions */}
          {!isSearching && suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => selectSuggestion(suggestion)}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors border-b border-gray-100 last:border-b-0"
            >
              <MapPin className={`h-4 w-4 ${colorClasses.text} mt-0.5 shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{suggestion.shortName}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{suggestion.displayName}</p>
              </div>
            </button>
          ))}

          {/* Recent searches */}
          {!isSearching && suggestions.length === 0 && recentSearches.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-1">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Búsquedas recientes</p>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(search)
                    searchAddress(search)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
                >
                  <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <p className="text-sm text-gray-600 truncate">{search}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
