'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import HeroMoreFilters, {
    appendMoreFiltersToSearchParams,
    buildAmenitiesInitial,
    INITIAL_MORE_FILTERS,
} from './PropertyHeroMoreFilters'
import { categoryFiltersApi } from '@/utils/api'
import { useCategoryBanner } from '@/hooks/useCategoryBanner'
import { PROPERTY_BEDROOMS_FILTER_URL_KEY, serializeBedroomsFilterForUrl } from '@/utils/getItemFilterParams'
import { loadGoogleMaps } from '@/utils'
import propertybg from '../../../../../public/assets/img/propertybg.png'
import homebanner from '../../../../../public/assets/img/homebanner.png'
import { RightArrowIcon } from '@/components/CustomFile/icons'
import bannercenter from '../../../../../public/assets/bannercenter.png'
import bannercenter2 from '../../../../../public/assets/bannercenter2.png'
import newprojectbanner from "../../../../../public/assets/img/newprojectbanner.png";

const PROPERTY_PARENT_CATEGORY_ID = 3

const RESIDENTIAL_TYPE_OPTIONS = [
    { value: 'all_residential', label: 'All in Residential' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'villa', label: 'Villa' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'penthouse', label: 'Penthouse' },
    { value: 'hotel_apartment', label: 'Hotel Apartment' },
    { value: 'residential_building', label: 'Residential Building' },
    { value: 'villa_compound', label: 'Villa Compound' },
]

const COMMERCIAL_TYPE_OPTIONS = [
    { value: 'all_commercial', label: 'All in Commercial' },
    { value: 'office', label: 'Office' },
    { value: 'retail', label: 'Retail' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'labour_camp', label: 'Labour Camp' },
    { value: 'commercial_floor', label: 'Commercial Floor' },
    { value: 'commercial_building', label: 'Commercial Building' },
]

const PURPOSE_OPTIONS = [
    { id: 'sale', label: 'Sale' },
    { id: 'rent', label: 'Rent' },
    { id: 'offplan', label: 'Offplan' },
    { id: 'newprojects', label: 'New Projects' },
]

const PROPERTY_TABS = [
    { id: 'residential', label: 'Residential' },
    { id: 'commercial', label: 'Commercial' },
    { id: 'rooms', label: 'Rooms' },
    { id: 'monthly', label: 'Monthly Short Term' },
    { id: 'daily', label: 'Daily Short Term' },
]

const LISTING_SLUG_BY_PURPOSE = {
    rent: 'property-for-rent',
    sale: 'property-for-sale',
}

/** Maps GET get-category-filters payload to hero tabs + property-type options. */
function normalizeHeroCategoryPayload(apiData) {
    const root = apiData?.categories?.[0]
    if (!root?.children?.length) return null
    const tabs = root.children.map((c) => ({
        id: String(c.category_id),
        label: c.name,
        hideBeds: c.name === 'Commercial' || c.name === 'Rooms For Rent',
        typeOptions: (c.children || []).map((ch) => ({
            value: String(ch.category_id),
            label: ch.name,
        })),
    }))
    if (tabs.some((t) => !t.typeOptions.length)) return null
    return {
        tabs,
        filters: Array.isArray(root.filters) ? root.filters : [],
        rootCategoryId: root.category_id,
    }
}

const ROOM_TYPE_OPTIONS = [
    { value: 'any', label: 'All' },
    { value: 'room', label: 'Room' },
    { value: 'short_stay', label: 'Short stay' },
]

function toPlaceTypeLabel(type) {
    if (!type) return 'Place'
    return String(type)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (s) => s.toUpperCase())
}

function ChevronIcon({ open, className = '' }) {
    return (
        <svg
            className={`h-4 w-4 shrink-0 text-[#1a1a1a] transition-transform duration-200 ${open ? 'rotate-180' : ''} ${className}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M6 9l6 6 6-6" />
        </svg>
    )
}

/**
 * Custom property-type dropdown (Residential / Commercial tabs) — matches bordered list + scrollbar design.
 */
function HeroPropertyTypeSelect({ value, onChange, options, className = '' }) {
    const [open, setOpen] = useState(false)
    const rootRef = useRef(null)

    useEffect(() => {
        if (!open) return
        const onDoc = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
        }
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', onDoc)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onDoc)
            document.removeEventListener('keydown', onKey)
        }
    }, [open])

    const selected = options.find((o) => o.value === value) ?? options[0]

    return (
        <div ref={rootRef} className={`relative min-w-0 ${className}`}>
            <label className="text-[12px] font-[Inter-Medium] leading-tight text-white/95">
                Property Type
            </label>
            <button
                type="button"
                id="property-hero-property-type"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls="property-hero-property-type-listbox"
                onClick={() => setOpen((v) => !v)}
                className={`bg-[#fff] rounded-[6px] flex w-full cursor-pointer items-center justify-between p-[14px_10px]
                    }`}
            >
                <p className="truncate text-[14px] text-[#000] font-[Inter-Regular]">{selected?.label}</p>
                <div open={open}>
                    <RightArrowIcon className="w-[18px] h-[18px] rotate-90" />
                </div>
            </button>
            {open ? (
                <ul
                    id="property-hero-property-type-listbox"
                    role="listbox"
                    aria-labelledby="property-hero-property-type"
                    className="absolute mt-[10px] left-0 right-0 top-full z-[60] max-h-[220px] overflow-y-auto rounded-[6px] border border-t-0 border-[#1a1a1a] bg-white [scrollbar-color:#888888_#EEEEEE] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#EEEEEE] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#888888] [&::-webkit-scrollbar-thumb]:hover:bg-[#666666]"
                >
                    {options.map((opt) => {
                        const isSelected = opt.value === value
                        return (
                            <li key={opt.value} role="presentation" className="border-b border-[#EEEEEE] last:border-b-0">
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    className={`cursor-pointer flex w-full p-[10px_10px] text-left text-[12px] text-[#000000] transition-colors hover:bg-[#f7f7f7] ${isSelected ? 'font-[Inter-SemiBold]' : 'font-[Inter-Regular]'
                                        }`}
                                    onClick={() => {
                                        onChange(opt.value)
                                        setOpen(false)
                                    }}
                                >
                                    {opt.label}
                                </button>
                            </li>
                        )
                    })}
                </ul>
            ) : null}
        </div>
    )
}

const MIN_BEDROOM_OPTIONS = [
    { value: 'any', label: 'Any' },
    { value: '0', label: 'Studio' },
    ...Array.from({ length: 12 }, (_, i) => {
        const n = i + 1
        return { value: String(n), label: n === 1 ? '1 Bedroom' : `${n} Bedrooms` }
    }),
]

const MAX_BEDROOM_OPTIONS = [
    { value: 'any', label: 'Any' },
    { value: '0', label: 'Studio' },
    ...Array.from({ length: 11 }, (_, i) => {
        const n = i + 1
        return { value: String(n), label: n === 1 ? '1 Bedroom' : `${n} Bedrooms` }
    }),
    { value: '12', label: '12+ Bedrooms' },
]

const BEDS_LIST_SCROLL =
    'max-h-[220px] overflow-y-auto [scrollbar-color:#888888_#EEEEEE] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#EEEEEE] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#888888] [&::-webkit-scrollbar-thumb]:hover:bg-[#666666]'

function bedsLabelForValue(value, which) {
    const list = which === 'max' ? MAX_BEDROOM_OPTIONS : MIN_BEDROOM_OPTIONS
    return list.find((o) => o.value === value)?.label ?? 'Any'
}

/** Short segment for main Beds chip: "1 to 2", "Studio to 3", "Up to 12+", etc. */
function bedsCompactPart(value, role) {
    if (value === 'any') return null
    if (value === '0') return 'Studio'
    if (value === '12' && role === 'max') return '12+'
    const n = Number(value)
    if (Number.isNaN(n)) return value
    return String(n)
}

function formatBedsTriggerLabel(minVal, maxVal) {
    if (minVal === 'any' && maxVal === 'any') return 'Any'
    const a = bedsCompactPart(minVal, 'min')
    const b = bedsCompactPart(maxVal, 'max')
    if (minVal === 'any' && b != null) return `Up to ${b}`
    if (maxVal === 'any' && a != null) return `${a}+`
    if (a != null && b != null) return `${a} to ${b}`
    return 'Any'
}

function formatPriceTriggerLabel(minStr, maxStr) {
    const min = minStr?.trim() ?? ''
    const max = maxStr?.trim() ?? ''
    if (!min && !max) return 'Any'
    const fmt = (v) => {
        const n = Number(v.replace(/,/g, ''))
        if (Number.isNaN(n)) return v
        return n.toLocaleString('en-AE')
    }
    if (min && max) return `AED ${fmt(min)} – ${fmt(max)}`
    if (min) return `From AED ${fmt(min)}`
    return `Up to AED ${fmt(max)}`
}

/**
 * Price range: trigger + popover with Min / Max inputs (design reference).
 */
function HeroPriceRangePopover({ priceMin, priceMax, onPriceMinChange, onPriceMaxChange, className = '' }) {
    const [open, setOpen] = useState(false)
    const rootRef = useRef(null)

    useEffect(() => {
        if (!open) return
        const onDoc = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
        }
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', onDoc)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onDoc)
            document.removeEventListener('keydown', onKey)
        }
    }, [open])

    const triggerLabel = formatPriceTriggerLabel(priceMin, priceMax)

    return (
        <div ref={rootRef} className={`relative min-w-0 ${className}`}>
            <button
                type="button"
                id="property-hero-price-range"
                aria-expanded={open}
                aria-controls="property-hero-price-popover"
                onClick={() => setOpen((v) => !v)}
                className={`bg-[#fff] rounded-[6px] flex w-full cursor-pointer items-center justify-between p-[14px_10px]
                    }`}
            >
                <p className="truncate text-[14px] text-[#000] font-[Inter-Regular]">{triggerLabel}</p>
                <div open={open}>
                    <RightArrowIcon className="w-[18px] h-[18px] rotate-90" />
                </div>
            </button>
            {open ? (
                <div
                    id="property-hero-price-popover"
                    role="dialog"
                    aria-labelledby="property-hero-price-range"
                    className="mt-[4px] absolute left-0 top-full z-[60] w-[min(calc(100vw-2rem),400px)] min-w-[300px] rounded-[8px] border border-[#1a1a1a] bg-white p-4 shadow-[0_12px_32px_rgba(0,0,0,0.18)] sm:min-w-[300px]"
                >
                    <div className="flex items-center gap-[10px]">
                        <div className="min-w-0 flex-1">
                            <label
                                htmlFor="property-price-min"
                                className="mb-1 block text-[12px] font-[Inter-SemiBold] text-[#000]"
                            >
                                Min
                            </label>
                            <input
                                id="property-price-min"
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                value={priceMin}
                                onChange={(e) => onPriceMinChange(e.target.value.replace(/[^\d,]/g, ''))}
                                onWheel={(e) => e.currentTarget.blur()}
                                className="p-[14px_10px] w-full rounded-[6px] border border-[rgba(143,143,143,0.4)] bg-white text-[12px] font-[Inter-Regular] text-[#000] outline-none transition-colors shadow-none placeholder:text-[#8f8f8f]"
                            />
                        </div>
                        <span
                            className="mt-[16px] shrink-0 text-[14px] font-[Inter-Regular] text-[#000]"
                            aria-hidden
                        >
                            -
                        </span>
                        <div className="min-w-0 flex-1">
                            <label
                                htmlFor="property-price-max"
                                className="mb-1 block text-[12px] font-[Inter-SemiBold] text-[#000]"
                            >
                                Max
                            </label>
                            <input
                                id="property-price-max"
                                type="text"
                                inputMode="numeric"
                                placeholder="Any"
                                value={priceMax}
                                onChange={(e) => onPriceMaxChange(e.target.value.replace(/[^\d,]/g, ''))}
                                onWheel={(e) => e.currentTarget.blur()}
                                className="p-[14px_10px] w-full rounded-[6px] border border-[rgba(143,143,143,0.4)] bg-white text-[12px] font-[Inter-Regular] text-[#000] outline-none transition-colors shadow-none placeholder:text-[#8f8f8f]"
                            />
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

/**
 * Single bedroom field: custom list (not native select) — chevron up when open, scroll + dividers.
 */
function HeroBedsInlineSelect({ id, value, onChange, options, open, onToggleOpen, listboxId }) {
    const rootRef = useRef(null)
    const selected = options.find((o) => o.value === value) ?? options[0]

    useEffect(() => {
        if (!open) return
        const onDoc = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) onToggleOpen(false)
        }
        const onKey = (e) => {
            if (e.key === 'Escape') onToggleOpen(false)
        }
        document.addEventListener('mousedown', onDoc)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onDoc)
            document.removeEventListener('keydown', onKey)
        }
    }, [open, onToggleOpen])

    return (
        <div ref={rootRef} className="relative min-w-0 w-full">
            <button
                type="button"
                id={id}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listboxId}
                onClick={() => onToggleOpen(!open)}
                className={`border border-[rgba(143,143,143,0.4)] bg-[#fff] rounded-[6px] flex w-full cursor-pointer items-center justify-between p-[14px_10px]
                    }`}
            >
                <p className="truncate text-[14px] text-[#000] font-[Inter-Regular]">{selected?.label}</p>
                <div open={open}>
                    <RightArrowIcon className="w-[18px] h-[18px] rotate-90" />
                </div>
            </button>
            {open ? (
                <ul
                    id={listboxId}
                    role="listbox"
                    aria-labelledby={id}
                    className={`rounded-[8px] mt-[10px] absolute left-0 top-full z-[70] min-w-[calc(100%+10px)] w-max max-w-[min(100vw-2rem,240px)] rounded-b-[8px] border border-[#1a1a1a] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.14)] ${BEDS_LIST_SCROLL}`}
                >
                    {options.map((opt) => {
                        const isSelected = opt.value === value
                        return (
                            <li key={opt.value} role="presentation" className="border-b border-[#EEEEEE] last:border-b-0">
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    className={`flex w-full px-3 py-2.5 text-left text-[13px] text-[#000000] transition-colors hover:bg-[#f7f7f7] ${isSelected ? 'font-[Inter-SemiBold]' : 'font-[Inter-Regular]'
                                        }`}
                                    onClick={() => {
                                        onChange(opt.value)
                                        onToggleOpen(false)
                                    }}
                                >
                                    {opt.label}
                                </button>
                            </li>
                        )
                    })}
                </ul>
            ) : null}
        </div>
    )
}

function HeroSimpleTypeSelect({ value, onChange, options, className = '' }) {
    const [open, setOpen] = useState(false)
    const rootRef = useRef(null)
    const selected = options.find((o) => o.value === value) ?? options[0]

    useEffect(() => {
        if (!open) return
        const onDoc = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
        }
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', onDoc)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onDoc)
            document.removeEventListener('keydown', onKey)
        }
    }, [open])

    return (
        <div ref={rootRef} className={`relative min-w-0 w-full ${className}`}>
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="bg-[#fff] rounded-[6px] flex h-[48px] w-full cursor-pointer items-center justify-between p-[14px_10px]"
            >
                <p className="truncate text-[14px] text-[#000] font-[Inter-Regular]">{selected?.label}</p>
                <RightArrowIcon className={`w-[18px] h-[18px] transition-transform ${open ? '-rotate-90' : 'rotate-90'}`} />
            </button>
            {open ? (
                <ul
                    role="listbox"
                    className="absolute left-0 top-[calc(100%+10px)] z-[80] w-full rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white shadow-[0_8px_16px_rgba(0,0,0,0.12)] overflow-hidden"
                >
                    {options.map((opt) => {
                        const isSelected = opt.value === value
                        return (
                            <li key={opt.value} role="presentation" className="border-b border-[#EEEEEE] last:border-b-0">
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    className={`flex w-full px-3 py-2.5 text-left text-[13px] text-[#000000] transition-colors hover:bg-[#f7f7f7] ${isSelected ? 'font-[Inter-SemiBold]' : 'font-[Inter-Regular]'
                                        }`}
                                    onClick={() => {
                                        onChange(opt.value)
                                        setOpen(false)
                                    }}
                                >
                                    {opt.label}
                                </button>
                            </li>
                        )
                    })}
                </ul>
            ) : null}
        </div>
    )
}

/**
 * Beds: trigger + popover with Minimum / Maximum bedroom dropdowns.
 */
function bedSortValue(v) {
    if (v === 'any') return NaN
    return Number(v)
}

function HeroBedsPopover({ bedsMin, bedsMax, onBedsMinChange, onBedsMaxChange, className = '' }) {
    const [open, setOpen] = useState(false)
    const [minListOpen, setMinListOpen] = useState(false)
    const [maxListOpen, setMaxListOpen] = useState(false)
    const rootRef = useRef(null)

    const handleMinChange = (v) => {
        onBedsMinChange(v)
        const ni = bedSortValue(v)
        const nx = bedSortValue(bedsMax)
        if (!Number.isNaN(ni) && !Number.isNaN(nx) && ni > nx) onBedsMaxChange(v)
    }

    const handleMaxChange = (v) => {
        onBedsMaxChange(v)
        const ni = bedSortValue(bedsMin)
        const nx = bedSortValue(v)
        if (!Number.isNaN(ni) && !Number.isNaN(nx) && nx < ni) onBedsMinChange(v)
    }

    useEffect(() => {
        if (!open) return
        const onDoc = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
        }
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', onDoc)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onDoc)
            document.removeEventListener('keydown', onKey)
        }
    }, [open])

    useEffect(() => {
        if (!open) {
            setMinListOpen(false)
            setMaxListOpen(false)
        }
    }, [open])

    const triggerLabel = formatBedsTriggerLabel(bedsMin, bedsMax)

    return (
        <div ref={rootRef} className={`relative min-w-0 ${className}`}>
            <button
                type="button"
                id="property-hero-beds"
                aria-expanded={open}
                aria-controls="property-hero-beds-popover"
                onClick={() => setOpen((v) => !v)}
                className={`border border-[rgba(143,143,143,0.4)] bg-[#fff] rounded-[6px] flex w-full cursor-pointer items-center justify-between p-[14px_10px]
                    }`}
            >
                <p className="truncate text-[14px] text-[#000] font-[Inter-Regular]">{triggerLabel}</p>
                <div open={open}>
                    <RightArrowIcon className="w-[18px] h-[18px] rotate-90" />
                </div>
            </button>
            {open ? (
                <div
                    id="property-hero-beds-popover"
                    role="dialog"
                    aria-labelledby="property-hero-beds"
                    className="mt-[4px] absolute left-0 top-full z-[60] w-[min(calc(100vw-2rem),400px)] min-w-[300px] rounded-[8px] border border-[#1a1a1a] bg-white p-4 shadow-[0_12px_32px_rgba(0,0,0,0.18)] sm:min-w-[320px]"
                >
                    <div className="flex items-center gap-[10px]">
                        <div className="min-w-0 flex-1">
                            <label
                                htmlFor="property-beds-min"
                                className="mb-1 block text-[12px] font-[Inter-SemiBold] text-[#000]"
                            >
                                Minimum Bedrooms
                            </label>
                            <HeroBedsInlineSelect
                                id="property-beds-min"
                                listboxId="property-beds-min-listbox"
                                value={bedsMin}
                                onChange={handleMinChange}
                                options={MIN_BEDROOM_OPTIONS}
                                open={minListOpen}
                                onToggleOpen={(next) => {
                                    if (next) setMaxListOpen(false)
                                    setMinListOpen(next)
                                }}
                            />
                        </div>
                        <span
                            className="mt-[16px] shrink-0 text-[14px] font-[Inter-Regular] text-[#000]"
                            aria-hidden
                        >
                            —
                        </span>
                        <div className="min-w-0 flex-1">
                            <label
                                htmlFor="property-beds-max"
                                className="mb-1 block text-[12px] font-[Inter-SemiBold] text-[#000]"
                            >
                                Maximum Bedrooms
                            </label>
                            <HeroBedsInlineSelect
                                id="property-beds-max"
                                listboxId="property-beds-max-listbox"
                                value={bedsMax}
                                onChange={handleMaxChange}
                                options={MAX_BEDROOM_OPTIONS}
                                open={maxListOpen}
                                onToggleOpen={(next) => {
                                    if (next) setMinListOpen(false)
                                    setMaxListOpen(next)
                                }}
                            />
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

const PropertyHeroSearch = ({ purpose: controlledPurpose, onPurposeChange } = {}) => {
    const router = useRouter()
    const { isLoaded: isGoogleMapsLoaded } = loadGoogleMaps()
    const { heroBackground, heroTitle, bannersLoading } = useCategoryBanner(
        PROPERTY_PARENT_CATEGORY_ID,
        {
            fallbackImage: propertybg,
            fallbackTitle: 'Everyone is on ebozor',
        }
    )
    const [uncontrolledPurpose, setUncontrolledPurpose] = useState('rent')
    const purpose = controlledPurpose !== undefined ? controlledPurpose : uncontrolledPurpose
    const setPurpose = onPurposeChange || setUncontrolledPurpose
    const [propertyTab, setPropertyTab] = useState('residential')
    const [city, setCity] = useState('')
    const [location, setLocation] = useState('')
    const [locationCountry, setLocationCountry] = useState('')
    const [propertyType, setPropertyType] = useState('all_residential')
    const [priceMin, setPriceMin] = useState('')
    const [priceMax, setPriceMax] = useState('')
    const [bedsMin, setBedsMin] = useState('any')
    const [bedsMax, setBedsMax] = useState('any')
    const [locationDropdownOpen, setLocationDropdownOpen] = useState(false)
    const locationDropdownRef = useRef(null)
    const [locationSuggestions, setLocationSuggestions] = useState([])
    const [locationSuggestionsLoading, setLocationSuggestionsLoading] = useState(false)
    const locationFetchIdRef = useRef(0)
    const [categoryHeroData, setCategoryHeroData] = useState(null)
    const [moreFilters, setMoreFilters] = useState(() => ({
        ...INITIAL_MORE_FILTERS,
        amenities: buildAmenitiesInitial(),
    }))

    const useApiCategories = purpose === 'rent' || purpose === 'sale'

    useEffect(() => {
        const query = location.trim()
        if (!locationDropdownOpen || !query) {
            setLocationSuggestions([])
            setLocationSuggestionsLoading(false)
            return
        }
        if (!isGoogleMapsLoaded || !window?.google?.maps?.places?.AutocompleteService) {
            setLocationSuggestions([])
            setLocationSuggestionsLoading(false)
            return
        }

        const fetchId = locationFetchIdRef.current + 1
        locationFetchIdRef.current = fetchId
        setLocationSuggestionsLoading(true)

        const timer = setTimeout(() => {
            const service = new window.google.maps.places.AutocompleteService()
            service.getPlacePredictions(
                {
                    input: query,
                    componentRestrictions: { country: 'ae' },
                },
                (predictions, status) => {
                    if (locationFetchIdRef.current !== fetchId) return
                    const ok = status === window.google.maps.places.PlacesServiceStatus.OK
                    if (!ok || !Array.isArray(predictions)) {
                        setLocationSuggestions([])
                        setLocationSuggestionsLoading(false)
                        return
                    }
                    setLocationSuggestions(
                        predictions.map((item) => ({
                            id: item.place_id || item.description,
                            name: item.structured_formatting?.main_text || item.description || '',
                            subtitle: item.structured_formatting?.secondary_text || '',
                            type: toPlaceTypeLabel(item.types?.[0]),
                        }))
                    )
                    setLocationSuggestionsLoading(false)
                }
            )
        }, 250)

        return () => clearTimeout(timer)
    }, [isGoogleMapsLoaded, location, locationDropdownOpen])

    useEffect(() => {
        if (!useApiCategories) {
            setCategoryHeroData(null)
            return
        }
        let cancelled = false
        const slug = LISTING_SLUG_BY_PURPOSE[purpose]
        categoryFiltersApi
            .getCategoryFilters({ slug })
            .then((res) => {
                if (cancelled) return
                const payload = res?.data?.data ?? res?.data
                setCategoryHeroData(normalizeHeroCategoryPayload(payload))
            })
            .catch(() => {
                if (!cancelled) setCategoryHeroData(null)
            })
        return () => {
            cancelled = true
        }
    }, [purpose, useApiCategories])

    useEffect(() => {
        setMoreFilters((prev) => ({ ...prev, apiCategoryFilters: {} }))
    }, [purpose])

    useEffect(() => {
        if (!categoryHeroData?.tabs?.length) return
        const tabIds = new Set(categoryHeroData.tabs.map((t) => t.id))
        if (!tabIds.has(propertyTab)) {
            const t0 = categoryHeroData.tabs[0]
            setPropertyTab(t0.id)
            setPropertyType(t0.typeOptions[0]?.value ?? '')
            return
        }
        const tab = categoryHeroData.tabs.find((t) => t.id === propertyTab)
        const typeOk = tab?.typeOptions?.some((o) => o.value === propertyType)
        if (!typeOk && tab?.typeOptions?.[0]) setPropertyType(tab.typeOptions[0].value)
    }, [categoryHeroData, propertyTab, propertyType])

    useEffect(() => {
        if (categoryHeroData) return
        if (propertyTab === 'residential') setPropertyType('all_residential')
        else if (propertyTab === 'commercial') setPropertyType('all_commercial')
        else setPropertyType('any')
    }, [propertyTab, categoryHeroData])

    useEffect(() => {
        const onDocMouseDown = (e) => {
            if (!locationDropdownRef.current) return
            if (locationDropdownRef.current.contains(e.target)) return
            setLocationDropdownOpen(false)
        }
        document.addEventListener('mousedown', onDocMouseDown)
        return () => document.removeEventListener('mousedown', onDocMouseDown)
    }, [])

    const resetFilters = useCallback(() => {
        setPurpose('rent')
        setPropertyTab('residential')
        setCity('')
        setLocation('')
        setLocationCountry('')
        setPropertyType('all_residential')
        setPriceMin('')
        setPriceMax('')
        setBedsMin('any')
        setBedsMax('any')
        setMoreFilters({ ...INITIAL_MORE_FILTERS, amenities: buildAmenitiesInitial() })
    }, [setPurpose])

    const handleSearch = (e) => {
        e.preventDefault()
        const params = new URLSearchParams()
        params.set('mode', 'property')
        params.set('purpose', purpose)
        params.set('item', LISTING_SLUG_BY_PURPOSE[purpose] || 'property-for-rent')
        if (categoryHeroData && useApiCategories) {
            params.set('category_id', propertyType)
            params.set('category_slug', LISTING_SLUG_BY_PURPOSE[purpose])
            const tab = categoryHeroData.tabs.find((t) => String(t.id) === String(propertyTab))
            const opt = tab?.typeOptions?.find((o) => String(o.value) === String(propertyType))
            if (opt?.label) {
                params.set('propertyType', opt.label)
            }
        } else {
            params.set('propertyTab', propertyTab)
            if (
                propertyType &&
                propertyType !== 'any' &&
                propertyType !== 'all_residential' &&
                propertyType !== 'all_commercial'
            ) {
                params.set('propertyType', propertyType)
            }
        }
        if (city) params.set('city', city)
        if (locationCountry) params.set('country', locationCountry)
        if (location.trim()) params.set('area', location.trim())
        const minP = priceMin.replace(/,/g, '').trim()
        const maxP = priceMax.replace(/,/g, '').trim()
        if (minP) params.set('minPrice', minP)
        if (maxP) params.set('maxPrice', maxP)
        params.delete('minBeds')
        params.delete('maxBeds')
        const bedsFilter = serializeBedroomsFilterForUrl(bedsMin, bedsMax)
        if (bedsFilter != null) params.set(PROPERTY_BEDROOMS_FILTER_URL_KEY, bedsFilter)
        else params.delete(PROPERTY_BEDROOMS_FILTER_URL_KEY)
        appendMoreFiltersToSearchParams(params, moreFilters)
        router.push(`/products?${params.toString()}`)
    }

    return (
        <div className="flex flex-col gap-[20px] mb-[50px]">
            <div className="py-[20px] w-full h-[320px] rounded-[10px] overflow-visible " style={{
                ...(heroBackground && !bannersLoading ? {
                    backgroundImage: `url(${heroBackground})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                } : {}),
            }}>
                <div className="">
                    {bannersLoading ? (
                        <span className="block text-center mx-auto mb-[14px] h-[28px] w-[min(100%,320px)] animate-pulse rounded-[6px] bg-[rgba(255,255,255,0.35)]" />
                    ) : (
                        <h1 className="text-shadow-[0_2px_4px_rgba(0,0,0,0.5)] text-center text-[24px] font-[Inter-Bold] text-[#fff] mb-[14px]">
                            {heroTitle}
                        </h1>
                    )}

                    <div className="mx-auto mb-7 flex w-[366px] justify-center rounded-full bg-[rgb(43,45,46)] p-[4px] max-sm:w-full max-sm:overflow-x-auto max-sm:whitespace-nowrap max-sm:flex-nowrap hide_scrollbar">
                        {PURPOSE_OPTIONS.map((opt) => {
                            const active = purpose === opt.id
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setPurpose(opt.id)}
                                    className={`cursor-pointer p-[6px_20px] max-sm:p-[6px_10px] text-[14px] font-[Inter-Medium] rounded-full ${active
                                        ? 'bg-white text-[#DC0000] '
                                        : 'text-white/95 '
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            )
                        })}
                    </div>

                    <div className="mx-auto">
                        <div className="flex flex-wrap justify-center gap-[10px] max-sm:flex-nowrap max-sm:justify-start max-sm:overflow-x-auto max-sm:w-full max-sm:pb-[2px] hide_scrollbar">
                            {(categoryHeroData?.tabs ?? PROPERTY_TABS).map((tab) => {
                                const active = propertyTab === tab.id
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setPropertyTab(tab.id)}
                                        className={`max-sm:truncate cursor-pointer rounded-t-[4px]  p-[14px_16px] text-left text-[12px] font-[Inter-Regular] ${active
                                            ? 'text-white bg-[rgb(43,45,46)] '
                                            : 'relative z-[2] bg-[#fff] text-[rgb(43,45,46)]'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                )
                            })}
                        </div>

                        <form
                            onSubmit={handleSearch}
                            className="relative z-[60] mx-[30px] rounded-b-[6px] rounded-tr-[6px] bg-[rgb(43,45,46)] p-[10px]"
                        >
                            <div className="flex gap-[10px] items-end max-sm:overflow-x-auto hide_scrollbar max-sm:w-[64vw] max-sm:whitespace-nowrap">
                                <div ref={locationDropdownRef} className="w-full min-w-0 flex-[3_1_360px] max-sm:flex-none">
                                    <div className="mb-1">
                                        <label className="text-left text-[12px] font-[Inter-Medium] text-white/95">Location</label>
                                    </div>
                                    <div className="relative">
                                        <input
                                            id="property-hero-location"
                                            type="text"
                                            value={location}
                                            onChange={(e) => {
                                                setLocation(e.target.value)
                                                setLocationDropdownOpen(true)
                                            }}
                                            onFocus={() => setLocationDropdownOpen(true)}
                                            placeholder="Enter Neighborhood or Building"
                                            className="p-[14px_10px] border-none outline-none shadow-none w-full rounded-[8px] border-0 bg-white text-[14px] font-[Inter-Regular] placeholder:text-[#8f8f8f]"
                                        />

                                        {locationDropdownOpen ? (
                                            <div className="absolute mt-[10px] left-0 right-0 top-full z-[60] max-h-[220px] overflow-y-auto rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white [scrollbar-color:#888888_#EEEEEE] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#EEEEEE] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#888888] [&::-webkit-scrollbar-thumb]:hover:bg-[#666666]">
                                                {locationSuggestions.map((item) => (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const selectedCity = String(item.name || '').trim()
                                                            const subtitleParts = String(item.subtitle || '')
                                                                .split(',')
                                                                .map((part) => part.trim())
                                                                .filter(Boolean)
                                                            const selectedCountry = subtitleParts.length
                                                                ? subtitleParts[subtitleParts.length - 1]
                                                                : ''
                                                            setLocation(selectedCity)
                                                            setCity(selectedCity)
                                                            setLocationCountry(selectedCountry)
                                                            setLocationDropdownOpen(false)
                                                        }}
                                                        className="w-full cursor-pointer p-[10px_10px] text-left text-[12px] text-[#000000] transition-colors hover:bg-[#f7f7f7]"
                                                    >
                                                        <p className="truncate text-[14px] font-[Inter-Regular] text-[#23262A]">{item.name}</p>
                                                        <p className="truncate pt-[2px] text-[12px] font-[Inter-Regular] text-[#666]">{item.subtitle}</p>
                                                    </button>
                                                ))}
                                                {locationSuggestionsLoading ? (
                                                    <p className="px-[10px] py-[10px] text-[12px] text-[#8F8F8F]">Loading...</p>
                                                ) : null}
                                                {!locationSuggestionsLoading && locationSuggestions.length === 0 ? (
                                                    <p className="px-[10px] py-[10px] text-[12px] text-[#8F8F8F]">No locations found</p>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                {categoryHeroData ? (
                                    <HeroPropertyTypeSelect
                                        value={propertyType}
                                        onChange={setPropertyType}
                                        options={
                                            categoryHeroData.tabs.find((t) => t.id === propertyTab)
                                                ?.typeOptions ?? []
                                        }
                                        className="w-full flex-[1_1_160px] max-sm:flex-none"
                                    />
                                ) : propertyTab === 'residential' ? (
                                    <HeroPropertyTypeSelect
                                        value={propertyType}
                                        onChange={setPropertyType}
                                        options={RESIDENTIAL_TYPE_OPTIONS}
                                        className="w-full flex-[1_1_160px]"
                                    />
                                ) : propertyTab === 'commercial' ? (
                                    <HeroPropertyTypeSelect
                                        value={propertyType}
                                        onChange={setPropertyType}
                                        options={COMMERCIAL_TYPE_OPTIONS}
                                        className="w-full max-sm:flex-none flex-[1_1_160px]"
                                    />
                                ) : (
                                    <HeroSimpleTypeSelect
                                        value={propertyType}
                                        onChange={setPropertyType}
                                        options={ROOM_TYPE_OPTIONS}
                                        className="flex-[1_1_160px]"
                                    />
                                )}

                                <div className="flex w-full min-w-0 flex-[1_1_140px] flex-col gap-1 max-sm:flex-none">
                                    <label className="text-[12px] font-[Inter-Medium] leading-tight text-white/95">
                                        Price Range
                                    </label>
                                    <HeroPriceRangePopover
                                        priceMin={priceMin}
                                        priceMax={priceMax}
                                        onPriceMinChange={setPriceMin}
                                        onPriceMaxChange={setPriceMax}
                                        className="w-full"
                                    />
                                </div>

                                {(categoryHeroData
                                    ? !categoryHeroData.tabs.find((t) => t.id === propertyTab)?.hideBeds
                                    : propertyTab !== 'commercial' && propertyTab !== 'rooms') ? (
                                    <div className="flex w-full min-w-0 flex-[1_1_120px] flex-col gap-1 max-sm:flex-none">
                                        <label className="text-[12px] font-[Inter-Medium] leading-tight text-white/95">
                                            Beds
                                        </label>
                                        <HeroBedsPopover
                                            bedsMin={bedsMin}
                                            bedsMax={bedsMax}
                                            onBedsMinChange={setBedsMin}
                                            onBedsMaxChange={setBedsMax}
                                            className="w-full"
                                        />
                                    </div>
                                ) : null}

                                <div className="flex w-full min-w-0 flex-[1_1_108px] lg:max-w-[120px] max-sm:flex-none">
                                    <HeroMoreFilters
                                        value={moreFilters}
                                        onChange={setMoreFilters}
                                        purpose={purpose}
                                        categoryFilterDefinitions={
                                            categoryHeroData?.filters?.length
                                                ? categoryHeroData.filters
                                                : undefined
                                        }
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="p-[14px_36px] shrink-0 rounded-[8px] bg-[#DC0000] text-[14px] font-[Inter-SemiBold] text-white "
                                >
                                    Search
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={resetFilters}
                                className="mt-[2px] cursor-pointer text-left text-[12px] font-[Inter-Regular] text-[#fff] "
                            >
                                Reset Filters
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <div className="max-sm:gap-[10px] max-sm:flex-wrap flex items-center justify-between pr-[32px] bg-[linear-gradient(110deg,_rgba(255,188,188,0.6),_rgba(252,227,180,0.6))] rounded-[6px] rtl:pl-[32px] rtl:pr-0">
            <div>
              <Image
                src={homebanner}
                alt="searchbar"
                width={213}
                height={96}
                className="w-[213px] h-[96px]"
              />
            </div>
            <div className="flex flex-col gap-[4px] items-center justify-center text-center">
              <h4 className="text-[18px] font-[Inter-SemiBold] text-[#000]">
                Looking to sell or rent your home?
              </h4>
              <p className="text-[14px] font-[Inter-Regular] text-[#000]">
                Get started with a free home valuation and expert advice.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={() =>
                  requireLogin(() => {
                    router.push("/placeyourad");
                  })
                }
                className="flex cursor-pointer items-center gap-[4px] bg-[#fff] p-[8px_24px] rounded-[8px]"
              >
                <p className="text-[14px] font-[Inter-SemiBold] text-[#000000CC]">
                  Get Started Now{" "}
                </p>
                <RightArrowIcon className="rtl:rotate-180" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-[14px] bg-[#EEF6FC] rounded-[6px] p-[16px]">
            <div>
              <Image
                src={newprojectbanner}
                alt="searchbar"
                className="w-[135px] h-[90px]"
              />
            </div>
            <div className="h-full flex flex-col gap-[6px] items-center justify-center">
              <h5 className="text-[16px] font-[Inter-SemiBold] text-[#000]">
                Introducing New Projects
              </h5>
              <p className="text-center text-[14px] font-[Inter-Regular] text-[#000]">
                Get Access to the Latest Property Development
              </p>
            </div>
            <Link href="/" className="flex items-center gap-[4px] bg-[#fff] rounded-[5px] p-[8px_24px] cursor-pointer">
              <p className="text-[14px] font-[Inter-SemiBold] text-[#000]">
                Explore Now
              </p>
              <RightArrowIcon className="rtl:rotate-180" />
            </Link>
            {/* <div >
              <div className="relative">
                <div>
                  <Image src={bannercenter2} alt="searchbar" className="max-sm:h-[150px]" />
                </div>
                <div className="h-full absolute top-0 left-0 right-0 flex flex-col gap-[6px] items-center justify-center">
                  <h5 className="text-[16px] font-[Inter-ExtraBold] text-[#fff]">Introducing New Projects</h5>
                  <p className="text-center text-[14px] font-[Inter-SemiBold] text-[#fff]">Get Access to the Latest Property Development</p>
                  <button className="flex items-center gap-[4px] bg-[#fff] rounded-[5px] p-[8px_16px]">
                    <p className="text-[12px] font-[Inter-SemiBold] text-[#DC0000CC] uppercase">Browse Now</p>
                    <RightArrowIcon />
                  </button>
                </div>
              </div>
            </div> */}
          </div>
        </div>
    )
}

export default PropertyHeroSearch