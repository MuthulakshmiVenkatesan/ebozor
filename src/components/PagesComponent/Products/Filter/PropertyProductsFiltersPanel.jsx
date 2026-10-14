'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { SearchIcon, TickIcon } from '@/components/CustomFile/icons'
import {
    isDynamicButtonOptionSelected,
    PROPERTY_PANEL_AMENITY_LABELS,
} from '@/utils/getItemFilterParams'

// const BATH_OPTIONS = ['1', '2', '3', '4', '5', '6+']
/** Static chip list; hidden when category API already defines an "Amenities" filter (avoid double source of truth). */
const STATIC_AMENITY_CHIPS = PROPERTY_PANEL_AMENITY_LABELS

function amenityChipActive(selected, chip) {
    return selected.some((a) => String(a).toLowerCase() === String(chip).toLowerCase())
}

function toggleAmenityChip(chip, setAmenities) {
    setAmenities((prev) => {
        const c = String(chip).toLowerCase()
        const has = prev.some((a) => String(a).toLowerCase() === c)
        if (has) return prev.filter((a) => String(a).toLowerCase() !== c)
        return [...prev, chip]
    })
}
// const LISTED_BY = ['Agent', 'Landlord', 'Developer']
// const RENT_IS_PAID = ['Yearly', 'Monthly', 'Quarterly', 'Bi-Yearly']
const REAL_ESTATE_TYPE_OPTIONS = [
    'Apartment',
    'Villa',
    'Townhouse',
    'Penthouse',
    'Residential Building',
    'Office',
    'Shop',
    'Industrial',
]

const KEYWORD_SUGGESTIONS = [
    'Pool',
    'Security',
    'Balcony',
    'Parking',
    'Garden',
    'Near Metro',
    'Gated Community',
    'Landscaped',
]

const AGENCY_SUGGESTIONS = [
    'DAMAC Properties',
    'Emaar Properties',
    'Engel & Volkers',
    'Savills',
    'haus & haus',
    'Betterhomes',
    'Allsopp & Allsopp',
    'Keystone Properties',
]

function filterKey(item) {
    return `cf_${item.category_id}_${item.sort_order}`
}

function Chip({ active, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`cursor-pointer rounded-full border px-[14px] py-[8px] text-[14px] leading-[18px] ${
                active
                    ? 'border-[#3A88EF] bg-[rgba(58,136,239,0.1)] font-[Inter-SemiBold] text-[#23262A]'
                    : 'border-[rgba(143,143,143,0.45)] bg-white font-[Inter-Regular] text-[#23262A]'
            }`}
        >
            {children}
        </button>
    )
}

export default function PropertyProductsFiltersPanel({
    open,
    onClose,
    onApply,
    initialAgency = '',
    apiFilters = [],
    /** When set, opening the panel applies URL / hero `filters[...]` state to form fields */
    hydration = null,
    /** If true, skip rendering this API filter row (e.g. shown in main bar for new projects). */
    hideApiFilterWhen,
    /** Hide hardcoded static sections (new projects only). */
    hideStaticSections = false,
}) {
    const [bath, setBath] = useState('')
    const [sizeFrom, setSizeFrom] = useState('')
    const [sizeTo, setSizeTo] = useState('')
    const [amenities, setAmenities] = useState([])
    const [keywords, setKeywords] = useState('')
    const [keywordsOpen, setKeywordsOpen] = useState(false)
    const keywordsWrapRef = useRef(null)
    const [agencyOpen, setAgencyOpen] = useState(false)
    const agencyWrapRef = useRef(null)
    const [listedBy, setListedBy] = useState([])
    const [agency, setAgency] = useState('')
    const [rentPaid, setRentPaid] = useState([])
    const [adsWithVideo, setAdsWithVideo] = useState(false)
    const [adsWith360, setAdsWith360] = useState(false)
    const [realEstateType, setRealEstateType] = useState([])
    const [realEstateTypeExpanded, setRealEstateTypeExpanded] = useState(false)
    const [dynamicFilters, setDynamicFilters] = useState({})

    useEffect(() => {
        if (!open) return
        setKeywordsOpen(false)
        setRealEstateTypeExpanded(false)
        setAgency(initialAgency || '')
        setAgencyOpen(false)
    }, [open, initialAgency])

    useEffect(() => {
        if (!open || !hydration) return
        setBath(hydration.bath || '')
        setSizeFrom(hydration.sizeFrom || '')
        setSizeTo(hydration.sizeTo || '')
        setAmenities(Array.isArray(hydration.amenities) ? [...hydration.amenities] : [])
        setKeywords(hydration.keywords || '')
        setListedBy(Array.isArray(hydration.listedBy) ? [...hydration.listedBy] : [])
        setRentPaid(Array.isArray(hydration.rentPaid) ? [...hydration.rentPaid] : [])
        setAgency(hydration.agency || initialAgency || '')
        setAdsWithVideo(Boolean(hydration.adsWithVideo))
        setAdsWith360(Boolean(hydration.adsWith360))
        // Rebuild from URL — do not merge into previous state or cleared keys stay stuck forever.
        const fromUrl =
            hydration.dynamicFilters && typeof hydration.dynamicFilters === 'object'
                ? hydration.dynamicFilters
                : {}
        setDynamicFilters(() => {
            const next = {}
            if (Array.isArray(apiFilters) && apiFilters.length) {
                for (const f of apiFilters) {
                    const key = filterKey(f)
                    if (fromUrl[key] !== undefined) {
                        next[key] = fromUrl[key]
                    } else if (f.type === 'min-max') {
                        next[key] = { min: '', max: '' }
                    } else if (f.multiselect) {
                        next[key] = []
                    } else {
                        next[key] = ''
                    }
                }
            } else {
                Object.assign(next, fromUrl)
            }
            return next
        })
    }, [open, hydration, initialAgency, apiFilters])

    useEffect(() => {
        if (open) return
        if (!apiFilters?.length) return
        setDynamicFilters((prev) => {
            const allowed = new Set(apiFilters.map((f) => filterKey(f)))
            const next = {}
            for (const k of Object.keys(prev)) {
                if (allowed.has(k)) next[k] = prev[k]
            }
            apiFilters.forEach((f) => {
                const k = filterKey(f)
                if (next[k] !== undefined) return
                if (f.type === 'min-max') next[k] = { min: '', max: '' }
                else if (f.multiselect) next[k] = []
                else next[k] = ''
            })
            return next
        })
    }, [apiFilters, open])

    const visibleRealEstateTypes = useMemo(
        () => (realEstateTypeExpanded ? REAL_ESTATE_TYPE_OPTIONS : REAL_ESTATE_TYPE_OPTIONS.slice(0, 5)),
        [realEstateTypeExpanded]
    )

    const hasApiAmenitiesFilter = useMemo(
        () =>
            (apiFilters || []).some(
                (f) => String(f?.name || '').trim().toLowerCase() === 'amenities'
            ),
        [apiFilters]
    )

    const toggleMulti = (value, state, setter) => {
        setter(state.includes(value) ? state.filter((x) => x !== value) : [...state, value])
    }

    const handleClear = () => {
        setBath('')
        setSizeFrom('')
        setSizeTo('')
        setAmenities([])
        setKeywords('')
        setRealEstateType([])
        setListedBy([])
        setAgency('')
        setRentPaid([])
        setAdsWithVideo(false)
        setAdsWith360(false)
        setKeywordsOpen(false)
        setAgencyOpen(false)
        setRealEstateTypeExpanded(false)
        setDynamicFilters({})
    }

    const keywordQuery = keywords.trim().toLowerCase()
    const filteredKeywordSuggestions = keywordQuery
        ? KEYWORD_SUGGESTIONS.filter((x) => x.toLowerCase().includes(keywordQuery))
        : KEYWORD_SUGGESTIONS.slice(0, 6)

    const agencyQuery = agency.trim().toLowerCase()
    const filteredAgencySuggestions = agencyQuery
        ? AGENCY_SUGGESTIONS.filter((x) => x.toLowerCase().includes(agencyQuery))
        : AGENCY_SUGGESTIONS.slice(0, 6)

    useEffect(() => {
        if (!open) return
        if (!keywordsOpen) return
        const onDown = (e) => {
            if (!keywordsWrapRef.current?.contains(e.target)) setKeywordsOpen(false)
        }
        document.addEventListener('mousedown', onDown)
        return () => document.removeEventListener('mousedown', onDown)
    }, [open, keywordsOpen, keywordsWrapRef])

    useEffect(() => {
        if (!open) return
        if (!agencyOpen) return
        const onDown = (e) => {
            if (!agencyWrapRef.current?.contains(e.target)) setAgencyOpen(false)
        }
        document.addEventListener('mousedown', onDown)
        return () => document.removeEventListener('mousedown', onDown)
    }, [open, agencyOpen])

    if (!open) return null

    return (
        <div
            className="absolute right-0 rtl:left-0 rtl:right-auto top-[calc(100%+8px)] z-[95] flex max-h-[min(85vh,680px)] w-[min(100vw-20px,460px)] flex-col overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] max-sm:w-full max-sm:right-0"
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
                {/* <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                    <h4 className="mb-[14px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Baths</h4>
                    <div className="flex flex-wrap gap-[8px]">
                        {BATH_OPTIONS.map((item) => (
                            <Chip key={item} active={bath === item} onClick={() => setBath(item)}>
                                {item}
                            </Chip>
                        ))}
                    </div>
                </div> */}

                {/* <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                    <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Area / Size (Sqft)</h4>
                    <div className="grid grid-cols-2 gap-[12px]">
                        <div>
                            <label className="mb-[6px] block text-[12px] text-[#666]">From</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={sizeFrom}
                                onChange={(e) => setSizeFrom(e.target.value.replace(/[^\d]/g, ''))}
                                placeholder="0"
                                className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[12px_10px] text-[14px] text-[#23262A] outline-none placeholder:text-[#8F8F8F]"
                            />
                        </div>
                        <div>
                            <label className="mb-[6px] block text-[12px] text-[#666]">Up to</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={sizeTo}
                                onChange={(e) => setSizeTo(e.target.value.replace(/[^\d]/g, ''))}
                                placeholder="Any"
                                className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[12px_10px] text-[14px] text-[#23262A] outline-none placeholder:text-[#8F8F8F]"
                            />
                        </div>
                    </div>
                </div> */}

                {!hideStaticSections && STATIC_AMENITY_CHIPS.length > 0 && !hasApiAmenitiesFilter ? (
                    <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                        <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Amenities</h4>
                        <div className="flex flex-wrap gap-[8px]">
                            {STATIC_AMENITY_CHIPS.map((item) => (
                                <Chip
                                    key={item}
                                    active={amenityChipActive(amenities, item)}
                                    onClick={() => toggleAmenityChip(item, setAmenities)}
                                >
                                    {item}
                                </Chip>
                            ))}
                        </div>
                    </div>
                ) : null}

                {!hideStaticSections ? (
                    <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                        <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Keywords</h4>
                        <div ref={keywordsWrapRef} className="relative">
                            <input
                                type="text"
                                value={keywords}
                                onChange={(e) => {
                                    setKeywords(e.target.value)
                                    setKeywordsOpen(true)
                                }}
                                onFocus={() => setKeywordsOpen(true)}
                                placeholder="E.g. Pool, Security, Ref ID Number"
                                className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[12px_10px] text-[14px] text-[#23262A] outline-none placeholder:text-[#A9B1BB]"
                            />
                            {keywordsOpen ? (
                                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[140] max-h-[280px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
                                    <div className="max-h-[280px] overflow-y-auto [scrollbar-width:thin]">
                                        {filteredKeywordSuggestions.length ? (
                                            filteredKeywordSuggestions.map((item) => (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    className="block w-full px-[14px] py-[10px] text-left text-[14px] font-[Inter-Regular] text-[#23262A] hover:bg-[#F5F5F5]"
                                                    onClick={() => {
                                                        setKeywords(item)
                                                        setKeywordsOpen(false)
                                                    }}
                                                >
                                                    {item}
                                                </button>
                                            ))
                                        ) : (
                                            <p className="px-[14px] py-[12px] text-[13px] font-[Inter-Regular] text-[#8F8F8F]">
                                                No keywords found
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {!hideStaticSections ? (
                    <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                        <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Real Estate Type</h4>
                        <div className="flex flex-wrap gap-[8px]">
                            {visibleRealEstateTypes.map((item) => (
                                <Chip
                                    key={item}
                                    active={realEstateType.includes(item)}
                                    onClick={() => {
                                        setRealEstateType((prev) =>
                                            prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
                                        )
                                    }}
                                >
                                    {item}
                                </Chip>
                            ))}
                            {REAL_ESTATE_TYPE_OPTIONS.length > 5 ? (
                                <button
                                    type="button"
                                    onClick={() => setRealEstateTypeExpanded((v) => !v)}
                                    className="cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] px-[14px] py-[8px] text-[14px] font-[Inter-SemiBold] text-[#3A88EF]"
                                >
                                    {realEstateTypeExpanded ? 'View Less' : 'View More'}
                                </button>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {apiFilters.map((item) => {
                    if (typeof hideApiFilterWhen === 'function' && hideApiFilterWhen(item)) return null
                    const k = filterKey(item)
                    const value = dynamicFilters[k]
                    if (item.type === 'min-max') {
                        const mm = value && typeof value === 'object' ? value : { min: '', max: '' }
                        return (
                            <div key={k} className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                                <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">{item.name}</h4>
                                <div className="grid grid-cols-2 gap-[12px]">
                                    <div>
                                        <label className="mb-[6px] block text-[12px] text-[#666]">From</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={mm.min}
                                            onChange={(e) =>
                                                setDynamicFilters((prev) => ({
                                                    ...prev,
                                                    [k]: { ...mm, min: e.target.value.replace(/[^\d]/g, '') },
                                                }))
                                            }
                                            placeholder="0"
                                            className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[12px_10px] text-[14px] text-[#23262A] outline-none placeholder:text-[#8F8F8F]"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-[6px] block text-[12px] text-[#666]">Up to</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={mm.max}
                                            onChange={(e) =>
                                                setDynamicFilters((prev) => ({
                                                    ...prev,
                                                    [k]: { ...mm, max: e.target.value.replace(/[^\d]/g, '') },
                                                }))
                                            }
                                            placeholder="Any"
                                            className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[12px_10px] text-[14px] text-[#23262A] outline-none placeholder:text-[#8F8F8F]"
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    }
                    if (item.type === 'button' && Array.isArray(item.values)) {
                        return (
                            <div key={k} className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                                <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">{item.name}</h4>
                                <div className="flex flex-wrap gap-[8px]">
                                    {item.values.map((v) => (
                                        <Chip
                                            key={v}
                                            active={isDynamicButtonOptionSelected(
                                                item.name,
                                                item.multiselect,
                                                value,
                                                v
                                            )}
                                            onClick={() => {
                                                if (item.multiselect) {
                                                    setDynamicFilters((prev) => {
                                                        const arr = Array.isArray(prev[k]) ? [...prev[k]] : []
                                                        const on = isDynamicButtonOptionSelected(
                                                            item.name,
                                                            true,
                                                            arr,
                                                            v
                                                        )
                                                        return {
                                                            ...prev,
                                                            [k]: on
                                                                ? arr.filter(
                                                                      (x) =>
                                                                          !isDynamicButtonOptionSelected(
                                                                              item.name,
                                                                              true,
                                                                              [x],
                                                                              v
                                                                          )
                                                                  )
                                                                : [...arr, v],
                                                        }
                                                    })
                                                } else {
                                                    setDynamicFilters((prev) => ({
                                                        ...prev,
                                                        [k]: isDynamicButtonOptionSelected(
                                                            item.name,
                                                            false,
                                                            prev[k],
                                                            v
                                                        )
                                                            ? ''
                                                            : v,
                                                    }))
                                                }
                                            }}
                                        >
                                            {v}
                                        </Chip>
                                    ))}
                                </div>
                            </div>
                        )
                    }
                    return null
                })}

                {/* <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                    <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Listed By</h4>
                    <div className="flex flex-wrap gap-[8px]">
                        {LISTED_BY.map((item) => (
                            <Chip
                                key={item}
                                active={listedBy.includes(item)}
                                onClick={() => toggleMulti(item, listedBy, setListedBy)}
                            >
                                {item}
                            </Chip>
                        ))}
                    </div>
                </div> */}

                {!hideStaticSections ? (
                    <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                        <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Real Estate Agencies</h4>
                        <div ref={agencyWrapRef} className="relative">
                            <input
                                type="text"
                                value={agency}
                                onChange={(e) => {
                                    setAgency(e.target.value)
                                    setAgencyOpen(true)
                                }}
                                onFocus={() => setAgencyOpen(true)}
                                placeholder="E.g. DAMAC Properties"
                                className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[12px_10px] text-[14px] text-[#23262A] outline-none placeholder:text-[#A9B1BB]"
                            />
                            {agencyOpen ? (
                                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[140] max-h-[280px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
                                    <div className="max-h-[280px] overflow-y-auto [scrollbar-width:thin]">
                                        {filteredAgencySuggestions.length ? (
                                            filteredAgencySuggestions.map((item) => (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    className="block w-full px-[14px] py-[10px] text-left text-[14px] font-[Inter-Regular] text-[#23262A] hover:bg-[#F5F5F5]"
                                                    onClick={() => {
                                                        setAgency(item)
                                                        setAgencyOpen(false)
                                                    }}
                                                >
                                                    {item}
                                                </button>
                                            ))
                                        ) : (
                                            <p className="px-[14px] py-[12px] text-[13px] font-[Inter-Regular] text-[#8F8F8F]">
                                                No agencies found
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {/* <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                    <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Rent Is Paid</h4>
                    <div className="flex flex-wrap gap-[8px]">
                        {RENT_IS_PAID.map((item) => (
                            <Chip
                                key={item}
                                active={rentPaid.includes(item)}
                                onClick={() => toggleMulti(item, rentPaid, setRentPaid)}
                            >
                                {item}
                            </Chip>
                        ))}
                    </div>
                </div> */}

                {!hideStaticSections ? (
                    <div className="p-[16px]">
                        <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Other Filters</h4>
                        <label className="relative cursor-pointer mb-[10px] flex items-center gap-[10px] text-[14px] text-[#23262A]">
                            <input
                                type="checkbox"
                                checked={adsWithVideo}
                                onChange={() => setAdsWithVideo((v) => !v)}
                                className="h-[22px] w-[22px] rounded border border-[rgba(143,143,143,0.5)] appearance-none checked:bg-[#fff] checked:border-[#DC0000] cursor-pointer"
                            />
                            {adsWithVideo ? (
                                <TickIcon className="w-[24px] h-[22px] absolute left-[-1px] rtl:right-[-1px] rtl:l" fill="#DC0000" />
                            ) : null}
                            <p className="text-[14px] font-[Inter-Regular] text-[#000]">Ads with Video</p>
                        </label>
                        <label className="relative cursor-pointer flex items-center gap-[10px] text-[14px] text-[#23262A]">
                            <input
                                type="checkbox"
                                checked={adsWith360}
                                onChange={() => setAdsWith360((v) => !v)}
                                className="h-[22px] w-[22px] rounded border border-[rgba(143,143,143,0.5)] appearance-none checked:bg-[#fff] checked:border-[#DC0000] cursor-pointer"
                            />
                            {adsWith360 ? (
                                <TickIcon className="w-[24px] h-[22px] absolute left-[-1px] rtl:right-[-1px] rtl:left-auto" fill="#DC0000" />
                            ) : null}
                            <p className="text-[14px] font-[Inter-Regular] text-[#000]">Ads with 360 Tour</p>
                        </label>
                    </div>
                ) : null}
            </div>

            <div className="shrink-0 border-t border-[rgba(143,143,143,0.2)] p-[12px_16px]">
                <div className="flex items-stretch gap-[10px]">
                    <button
                        type="button"
                        className="cursor-pointer rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white p-[12px_26px] text-[14px] font-[Inter-SemiBold] text-[#23262A]"
                        onClick={handleClear}
                    >
                        Clear
                    </button>
                    <button
                        type="button"
                        className="flex-1 cursor-pointer rounded-[6px] bg-[#23262A] py-[12px] text-[14px] font-[Inter-Medium] text-white"
                        onClick={() => {
                            onApply?.({
                                keywords,
                                realEstateType,
                                agency,
                                dynamicFilters,
                                bath,
                                sizeFrom,
                                sizeTo,
                                amenities,
                                listedBy,
                                rentPaid,
                                adsWithVideo,
                                adsWith360,
                            })
                            onClose?.()
                        }}
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    )
}

