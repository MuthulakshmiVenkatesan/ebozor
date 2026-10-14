'use client'

import { useEffect, useReducer, useRef, useState } from 'react'
import { SearchIcon, LocationIcon, DownArrowIcon, TickIcon } from '@/components/CustomFile/icons'
import { isDynamicButtonOptionSelected } from '@/utils/getItemFilterParams'

const COLLAPSE_COUNT = 5

const SELLER_TYPES = ['Owner', 'Dealer', 'Dealership/Certified Pre-Owned']
const EXPORT_STATUS = ['UAE (can be exported)', 'Export Only']
const ADS_POSTED = ['Today', 'Within 3 days', 'Within 1 week', 'Within 2 weeks', 'Within 1 month', 'Within 3 months']
const BODY_TYPES = [
    'SUV',
    'Coupe',
    'Sedan',
    'Crossover',
    'Hard Top Convertible',
    'Pick Up Truck',
    'Hatchback',
    'Soft Top Convertible',
    'Sports Car',
    'Van',
    'Wagon',
    'Utility Truck',
    'Other',
]
const SEAT_OPTIONS = ['2', '4', '5', '6', '7', '8', '9+']
const TRANSMISSION = ['Manual', 'Automatic']
const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric']
const HORSEPOWER = ['0 - 99 HP', '100 - 199 HP', '200 - 299 HP', '300 - 399 HP', '400 - 499 HP', '500+ HP']
const ENGINE_CC = ['0 - 499 cc', '500 - 999 cc', '1000 - 1499 cc', '1500 - 1999 cc', '2000+ cc']
const DOOR_OPTIONS = ['2', '3', '4', '5+']
const WARRANTY_OPTIONS = ['Yes', 'No', 'Does not apply']
const CYLINDER_OPTIONS = ['3', '4', '5', '6', '8', '10', '12', '16']
const STEERING_SIDE_OPTIONS = ['Left Hand', 'Right Hand']
const BADGES = ['First Owner', 'In Warranty', 'Dealer Warranty', 'Service History', 'No Accidents', 'GCC Specs']
const DRIVER_ASSIST = ['360 Camera', '4 Wheel Drive', 'Adaptive Brake Lights', 'Alarm / Anti-Theft System', 'All Wheel Drive', 'Blind Spot Monitor']
const COMFORT = ['Active Steering', 'Active Understeer Control (AUC)', 'Adaptive Suspension Package', 'Air Conditioning', 'Airbags', 'Cruise Control']
const ENTERTAINMENT = ['AM/FM Radio', 'Bluetooth', 'Touchscreen Display', 'Head-Up Display (HUD)', 'Navigation System', 'Apple CarPlay']
const EXTERIOR_FEAT = ['Alloy Pedals', 'Alloy Wheels', 'Auto Retractable Hardtop Roof', 'Body Kit', 'Daytime Running Lights (DRL)', 'Fog Lights']

const LOCATION_SUGGESTIONS = [
    { title: 'Dubai Marina', subtitle: 'Dubai' },
    { title: 'Dubai', subtitle: 'Dubai' },
    { title: 'Meydan', subtitle: 'Dubai' },
    { title: 'Majan', subtitle: 'Dubai' },
    { title: 'Meydan One', subtitle: 'Meydan, Dubai' },
    { title: 'Mohammed Bin Rashid City', subtitle: 'Dubai' },
]

const DEALER_NAME_SUGGESTIONS = [
    'HUAXIN LAI',
    'Eyadh Hussion Ismail',
    'Malmo Used Cars',
    'Benz Trading LLC',
    'City Motors',
]

const KEYWORD_SUGGESTIONS = [
    'driver',
    'sales',
    'accountant',
    'jobs',
    'customer service',
    'light vehicle driver',
    'driver light vehicle',
]

const EXTERIOR_COLORS = [
    { name: 'Bronze', hex: '#CD7F32' },
    { name: 'Maroon', hex: '#800020' },
    { name: 'Pink', hex: '#FFB6C1' },
    { name: 'Black', hex: '#1a1a1a' },
    { name: 'Blue', hex: '#4169E1' },
    { name: 'White', hex: '#F8F8F8' },
    { name: 'Silver', hex: '#C0C0C0' },
    { name: 'Red', hex: '#C41E3A' },
]
const INTERIOR_COLORS = [
    { name: 'Beige', hex: '#E8DCC4' },
    { name: 'Maroon', hex: '#800020' },
    { name: 'Pink', hex: '#FFB6C1' },
    { name: 'Black', hex: '#1a1a1a' },
    { name: 'Blue', hex: '#4169E1' },
    { name: 'Brown', hex: '#5C4033' },
    { name: 'Gray', hex: '#9CA3AF' },
]

const initialState = {
    keywords: '',
    inspectedOnly: false,
    sellerType: [],
    dealerName: '',
    location: '',
    exportStatus: [],
    adsPosted: [],
    bodyType: [],
    exteriorColor: [],
    interiorColor: [],
    seats: [],
    transmission: [],
    fuel: [],
    horsepower: [],
    engineCc: [],
    doors: [],
    warranty: [],
    cylinders: [],
    steeringSide: [],
    badges: [],
    driverAssist: [],
    comfort: [],
    entertainment: [],
    exteriorFeatures: [],
    other360: false,
    otherEnglish: false,
    otherYard: false,
    otherSoon: false,
    expanded: {
        bodyType: false,
        adsPosted: false,
        exteriorColor: false,
        interiorColor: false,
        seats: false,
        horsepower: false,
        engineCc: false,
        cylinders: false,
        badges: false,
        driverAssist: false,
        comfort: false,
        entertainment: false,
        exteriorFeatures: false,
    },
}

function BodyTypeCarIcon({ active = false }) {
    return (
        <svg width="30" height="18" viewBox="0 0 30 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path
                d="M5.2 10.2L7.6 5.8C7.96 5.1 8.68 4.66 9.46 4.66H18.2C18.94 4.66 19.64 5.06 20.02 5.7L22.42 9.84H24.24C25.22 9.84 26 10.62 26 11.58V12.9C26 13.38 25.62 13.74 25.18 13.74H24.5C24.34 15.02 23.24 16 21.92 16C20.6 16 19.5 15.02 19.34 13.74H10.66C10.5 15.02 9.4 16 8.08 16C6.76 16 5.66 15.02 5.5 13.74H4.82C4.36 13.74 4 13.36 4 12.9V11.54C4 10.8 4.54 10.2 5.2 10.2Z"
                fill={active ? '#F4C20D' : 'white'}
                stroke="#23262A"
                strokeWidth="1.2"
                strokeLinejoin="round"
            />
            <circle cx="8.08" cy="13.16" r="1.52" fill="#23262A" />
            <circle cx="21.92" cy="13.16" r="1.52" fill="#23262A" />
            <path d="M9.7 6.3H17.86C18.26 6.3 18.64 6.52 18.84 6.86L20.22 9.22H8.14L9.7 6.3Z" stroke="#23262A" strokeWidth="1.1" />
        </svg>
    )
}

function reducer(state, action) {
    switch (action.type) {
        case 'setStr':
            return { ...state, [action.key]: action.val }
        case 'toggleBool':
            return { ...state, [action.key]: !state[action.key] }
        case 'toggleMulti': {
            const arr = state[action.key]
            const has = arr.includes(action.val)
            return { ...state, [action.key]: has ? arr.filter((x) => x !== action.val) : [...arr, action.val] }
        }
        case 'toggleExpand':
            return {
                ...state,
                expanded: { ...state.expanded, [action.key]: !state.expanded[action.key] },
            }
        case 'reset':
            return {
                ...initialState,
                expanded: { ...initialState.expanded },
            }
        default:
            return state
    }
}

function SectionTitle({ children }) {
    return <h4 className="mb-[10px] text-[14px] font-[Inter-SemiBold] text-[#000]">{children}</h4>
}


function Pill({
    children,
    selected,
    onClick,
    className = '',
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`cursor-pointer rounded-full border px-[14px] py-[8px] text-[#000] text-left text-[14px] leading-[18px] transition-colors ${selected
                ? 'border-[#3A88EF] bg-[rgba(58,136,239,0.1)] font-[Inter-SemiBold] '
                : 'border-[rgba(143,143,143,0.45)] bg-white font-[Inter-Regular] '
                } ${className}`}
        >
            {children}
        </button>
    )
}

function ChipRow({ items, selectedKey, state, dispatch, expandedKey, collapseAt = COLLAPSE_COUNT }) {
    const expanded = state.expanded[expandedKey]
    const show = expanded ? items : items.slice(0, collapseAt)
    const hasMore = items.length > collapseAt
    return (
        <div className="flex flex-wrap gap-[8px]">
            {show.map((item) => (
                <Pill
                    key={item}
                    selected={state[selectedKey].includes(item)}
                    onClick={() => dispatch({ type: 'toggleMulti', key: selectedKey, val: item })}
                >
                    {item}
                </Pill>
            ))}
            {hasMore ? (
                <button
                    type="button"
                    onClick={() => dispatch({ type: 'toggleExpand', key: expandedKey })}
                    className="border border-[rgba(143,143,143,0.45)] bg-white rounded-[100px] p-[6px_14px] cursor-pointer flex items-center gap-[4px] text-[14px] text-[#3A88EF] font-[Inter-SemiBold]"
                >
                    {expanded ? 'View Less' : 'View More'}
                </button>
            ) : null}
        </div>
    )
}

function listingApiFilterKey(item) {
    return `cf_${item.category_id}_${item.sort_order}`
}

function isRangeLikeFilterType(type) {
    return type === 'min-max' || type === 'number'
}

export default function MotorsProductsFiltersPanel({
    open,
    initialKeywords,
    onClose,
    onApply,
    apiFilters = [],
    hydration = null,
}) {
    const [state, dispatch] = useReducer(reducer, initialState)
    const [dynamicFilters, setDynamicFilters] = useState({})
    const [dynamicExpanded, setDynamicExpanded] = useState({})
    const [adsWithVideo, setAdsWithVideo] = useState(false)
    const [adsWith360, setAdsWith360] = useState(false)
    const [locationOpen, setLocationOpen] = useState(false)
    const [dealerOpen, setDealerOpen] = useState(false)
    const [keywordsOpen, setKeywordsOpen] = useState(false)
    const locationWrapRef = useRef(null)
    const dealerWrapRef = useRef(null)
    const keywordsWrapRef = useRef(null)

    useEffect(() => {
        if (open) {
            dispatch({ type: 'setStr', key: 'keywords', val: initialKeywords || '' })
        }
    }, [open, initialKeywords])

    useEffect(() => {
        if (!open || !hydration) return
        setAdsWithVideo(Boolean(hydration.adsWithVideo))
        setAdsWith360(Boolean(hydration.adsWith360))
        const fromUrl =
            hydration.dynamicFilters && typeof hydration.dynamicFilters === 'object'
                ? hydration.dynamicFilters
                : {}
        const next = {}
        for (const f of apiFilters || []) {
            const k = listingApiFilterKey(f)
            if (fromUrl[k] !== undefined) {
                next[k] = fromUrl[k]
            } else if (isRangeLikeFilterType(f.type)) {
                next[k] = { min: '', max: '' }
            } else if (f.multiselect) {
                next[k] = []
            } else {
                next[k] = ''
            }
        }
        setDynamicFilters(next)
    }, [open, hydration, apiFilters])

    useEffect(() => {
        if (!open) return
        const onDown = (e) => {
            const t = e.target
            if (locationWrapRef.current && !locationWrapRef.current.contains(t)) setLocationOpen(false)
            if (dealerWrapRef.current && !dealerWrapRef.current.contains(t)) setDealerOpen(false)
            if (keywordsWrapRef.current && !keywordsWrapRef.current.contains(t)) setKeywordsOpen(false)
        }
        document.addEventListener('mousedown', onDown)
        return () => document.removeEventListener('mousedown', onDown)
    }, [open])

    if (!open) return null

    const handleClear = () => {
        dispatch({ type: 'reset' })
        setDynamicFilters({})
        setAdsWithVideo(false)
        setAdsWith360(false)
    }

    const handleApply = () => {
        onApply?.({
            keywords: state.keywords,
            dynamicFilters,
            adsWithVideo,
            adsWith360,
        })
        onClose?.()
    }

    const colorChip = (c, key) => {
        const selected = state[key].includes(c.name)
        return (
            <button
                key={c.name}
                type="button"
                onClick={() => dispatch({ type: 'toggleMulti', key, val: c.name })}
                className={`cursor-pointer flex p-[6px_14px] shrink-0 text-[#000] items-center gap-[8px] rounded-[100px] border text-[14px] font-[Inter-Regular] transition-colors ${selected
                    ? 'border-[#3A88EF] bg-[#EDF4FF] font-[Inter-SemiBold]'
                    : 'border-[rgba(143,143,143,0.45)] bg-white '
                    }`}
            >
                <span
                    className="w-[14px] h-[14px] shrink-0 rounded-full border border-[rgba(0,0,0,0.12)]"
                    style={{ backgroundColor: c.hex }}
                />
                <p className={`text-[14px] text-[#000] ${selected ? 'font-[Inter-SemiBold]' : 'font-[Inter-Regular]'}`}>{c.name}</p>
            </button>
        )
    }

    const renderColorRow = (colors, key, expKey) => {
        const expanded = state.expanded[expKey]
        const list = expanded ? colors : colors.slice(0, COLLAPSE_COUNT)
        const hasMore = colors.length > COLLAPSE_COUNT
        return (
            <div className="flex flex-wrap gap-[8px]">
                {list.map((c) => colorChip(c, key))}
                {hasMore ? (
                    <button
                        type="button"
                        onClick={() => dispatch({ type: 'toggleExpand', key: expKey })}
                        className="border border-[rgba(143,143,143,0.45)] bg-white rounded-[100px] p-[6px_14px] cursor-pointer flex items-center gap-[4px] text-[14px] text-[#3A88EF] font-[Inter-SemiBold]"
                    >
                        {expanded ? 'View Less' : 'View More'}
                    </button>
                ) : null}
            </div>
        )
    }

    const isColorFilterName = (name) => typeof name === 'string' && name.toLowerCase().includes('color')

    const isBodyTypeFilterName = (name) => {
        if (typeof name !== 'string') return false
        const n = name.trim().toLowerCase()
        return n === 'body type' || n === 'body type ' || n === 'body type*' || n.includes('body type')
    }

    const getApiOptions = (item) => {
        const vObj = Array.isArray(item?.values_obj) ? item.values_obj : []
        if (vObj.length) return vObj
        const v = Array.isArray(item?.values) ? item.values : []
        return v
    }

    const apiOptionToString = (opt) => {
        if (typeof opt === 'string') return opt
        if (opt && typeof opt === 'object') return String(opt.option_value ?? opt.value ?? opt.name ?? '')
        return ''
    }

    const apiOptionToImage = (opt) => {
        if (opt && typeof opt === 'object') return opt.image || opt.icon || ''
        return ''
    }

    const findColorHexByName = (name) => {
        const n = String(name || '').trim().toLowerCase()
        if (!n) return '#E5E7EB'
        const all = [...EXTERIOR_COLORS, ...INTERIOR_COLORS]
        const hit = all.find((c) => String(c?.name || '').trim().toLowerCase() === n)
        return hit?.hex || '#E5E7EB'
    }

    return (
        <div
            className="absolute left-[-250px] rtl:left-0 top-[calc(100%+8px)] z-[95] flex max-h-[min(85vh,540px)] w-[min(100vw-24px,440px)] flex-col rounded-[12px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.16)] max-sm:w-[min(100vw-16px,440px)] max-sm:left-0 max-sm:w-full"
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
                {/* Inspected */}
                <div className="border-b border-[rgba(143,143,143,0.22)] p-[20px]">
                    <div className="mb-[8px] flex flex-wrap items-center gap-2">
                        <h4 className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">ebozor inspected cars</h4>
                        <span className="rounded-full bg-[#DC0000] p-[2px_6px] text-[12px] font-[Inter-Bold] uppercase leading-4 text-white">
                            New
                        </span>
                    </div>
                    <label className="relative flex cursor-pointer items-center gap-[10px]">
                        <input
                            type="checkbox"
                            checked={state.inspectedOnly}
                            onChange={() => dispatch({ type: 'toggleBool', key: 'inspectedOnly' })}
                            className="w-[22px] h-[22px] appearance-none border-2 border-[rgba(143,143,143,0.5)] rounded 
                                         checked:bg-[#fff] checked:border-[#DC0000] cursor-pointer"
                        />
                        {state.inspectedOnly ? (
                            <TickIcon className="w-[24px] h-[22px] absolute left-[-1px] rtl:right-[-1px] rtl:left-auto" fill="#DC0000" />
                        ) : null}
                        <p className="text-[14px] font-[Inter-Regular] text-[#000]">Show inspected cars only</p>
                    </label>
                </div>


                <div className="border-b border-[rgba(143,143,143,0.22)] p-[20px]">
                    <SectionTitle>Keywords</SectionTitle>
                    <div
                        ref={keywordsWrapRef}
                        className="relative flex items-center gap-[10px] border border-[rgba(143,143,143,0.45)] rounded-[6px] p-[10px]"
                    >
                        <div className="">
                            <SearchIcon stroke="#8F8F8F" className="h-[28px] w-[28px]" />
                        </div>
                        <input
                            type="text"
                            value={state.keywords}
                            onChange={(e) => {
                                dispatch({ type: 'setStr', key: 'keywords', val: e.target.value })
                                setKeywordsOpen(true)
                            }}
                            onFocus={() => setKeywordsOpen(true)}
                            placeholder="Enter Keyword..."
                            className="w-full text-[13px] outline-none placeholder:text-[#8f8f8f] "
                        />
                        {keywordsOpen ? (
                            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[130] max-h-[260px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
                                <div className="max-h-[260px] overflow-y-auto [scrollbar-width:thin]">
                                    {(() => {
                                        const q = state.keywords.trim().toLowerCase()
                                        const items = q
                                            ? KEYWORD_SUGGESTIONS.filter((x) => x.toLowerCase().includes(q))
                                            : KEYWORD_SUGGESTIONS.slice(0, 6)
                                        return items.length ? (
                                            items.map((item) => (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    className="block w-full px-[14px] py-[12px] text-left text-[14px] font-[Inter-Regular] text-[#23262A] hover:bg-[#F5F5F5]"
                                                    onClick={() => {
                                                        dispatch({ type: 'setStr', key: 'keywords', val: item })
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
                                        )
                                    })()}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
                {(apiFilters || []).map((item) => {
                    const k = listingApiFilterKey(item)
                    const value = dynamicFilters[k]
                    if (isRangeLikeFilterType(item.type)) {
                        const mm = value && typeof value === 'object' ? value : { min: '', max: '' }
                        return (
                            <div key={k} className="border-b border-[rgba(143,143,143,0.22)] p-[20px]">
                                <SectionTitle>{item.name}</SectionTitle>
                                <div className="grid grid-cols-2 gap-[10px]">
                                    <input
                                        type="text"
                                        value={mm.min || ''}
                                        onChange={(e) =>
                                            setDynamicFilters((prev) => ({
                                                ...prev,
                                                [k]: { ...mm, min: e.target.value.replace(/\D/g, '') },
                                            }))
                                        }
                                        placeholder="From"
                                        className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[10px] text-[13px] outline-none"
                                    />
                                    <input
                                        type="text"
                                        value={mm.max || ''}
                                        onChange={(e) =>
                                            setDynamicFilters((prev) => ({
                                                ...prev,
                                                [k]: { ...mm, max: e.target.value.replace(/\D/g, '') },
                                            }))
                                        }
                                        placeholder="To"
                                        className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[10px] text-[13px] outline-none"
                                    />
                                </div>
                            </div>
                        )
                    }
                    const optionsRaw = getApiOptions(item)
                    const options = optionsRaw.map(apiOptionToString).filter(Boolean)
                    const expanded = Boolean(dynamicExpanded[k])
                    const list = expanded ? options : options.slice(0, COLLAPSE_COUNT)
                    const hasMore = options.length > COLLAPSE_COUNT

                    if (isBodyTypeFilterName(item.name)) {
                        const show = expanded ? optionsRaw : optionsRaw.slice(0, 6)
                        const hasMoreBody = optionsRaw.length > 6
                        return (
                            <div key={k} className="border-b border-[rgba(143,143,143,0.22)] p-[20px]">
                                <SectionTitle>{item.name}</SectionTitle>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {show.map((raw) => {
                                        const label = apiOptionToString(raw)
                                        const img = apiOptionToImage(raw)
                                        const selected = isDynamicButtonOptionSelected(
                                            item.name,
                                            Boolean(item.multiselect),
                                            dynamicFilters[k],
                                            label
                                        )
                                        return (
                                            <button
                                                key={`${k}-${label}`}
                                                type="button"
                                                onClick={() => {
                                                    setDynamicFilters((prev) => {
                                                        const cur = prev[k]
                                                        if (item.multiselect) {
                                                            const arr = Array.isArray(cur) ? cur : []
                                                            const has = arr.includes(label)
                                                            return { ...prev, [k]: has ? arr.filter((x) => x !== label) : [...arr, label] }
                                                        }
                                                        return { ...prev, [k]: cur === label ? '' : label }
                                                    })
                                                }}
                                                className={`flex cursor-pointer flex-col items-center justify-center gap-[6px] rounded-[8px] border p-[20px_14px] text-center text-[14px] leading-tight transition-colors ${selected
                                                    ? 'border-[#8EA3FF] bg-[#EEF2FF] font-[Inter-SemiBold] text-[#000]'
                                                    : 'border-[rgba(143,143,143,0.45)] bg-white font-[Inter-Regular] text-[#000] hover:border-[#8F8F8F]'
                                                    }`}
                                            >
                                                {label === 'Other' ? (
                                                    <div className="flex h-[20px] items-center justify-center text-[22px] leading-none text-[#23262A]">...</div>
                                                ) : img ? (
                                                    <img src={img} alt={label} className="h-[30px] w-[30px] object-contain" loading="lazy" />
                                                ) : (
                                                    <BodyTypeCarIcon active={selected} />
                                                )}
                                                <p className="text-[14px] leading-[18px] text-[#000] font-[Inter-Regular]">{label}</p>
                                            </button>
                                        )
                                    })}
                                </div>
                                {hasMoreBody ? (
                                    <div className="mt-[10px] flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => setDynamicExpanded((p) => ({ ...p, [k]: !p[k] }))}
                                            className="border border-[rgba(143,143,143,0.45)] bg-white rounded-[100px] px-[14px] py-[8px] cursor-pointer flex items-center gap-[4px] text-[14px] text-[#3A88EF] font-[Inter-Medium]"
                                        >
                                            {expanded ? 'View Less' : 'View More'}
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        )
                    }

                    if (isColorFilterName(item.name)) {
                        return (
                            <div key={k} className="border-b border-[rgba(143,143,143,0.22)] p-[20px]">
                                <SectionTitle>{item.name}</SectionTitle>
                                <div className="flex flex-wrap gap-[8px]">
                                    {list.map((name) => {
                                        const selected = isDynamicButtonOptionSelected(
                                            item.name,
                                            Boolean(item.multiselect),
                                            dynamicFilters[k],
                                            name
                                        )
                                        const hex = findColorHexByName(name)
                                        return (
                                            <button
                                                key={`${k}-${name}`}
                                                type="button"
                                                onClick={() => {
                                                    setDynamicFilters((prev) => {
                                                        const cur = prev[k]
                                                        if (item.multiselect) {
                                                            const arr = Array.isArray(cur) ? cur : []
                                                            const has = arr.includes(name)
                                                            return { ...prev, [k]: has ? arr.filter((x) => x !== name) : [...arr, name] }
                                                        }
                                                        return { ...prev, [k]: cur === name ? '' : name }
                                                    })
                                                }}
                                                className={`cursor-pointer flex p-[6px_14px] shrink-0 text-[#000] items-center gap-[8px] rounded-[100px] border text-[14px] font-[Inter-Regular] transition-colors ${selected
                                                    ? 'border-[#3A88EF] bg-[#EDF4FF] font-[Inter-SemiBold]'
                                                    : 'border-[rgba(143,143,143,0.45)] bg-white '
                                                    }`}
                                            >
                                                <span
                                                    className="w-[14px] h-[14px] shrink-0 rounded-full border border-[rgba(0,0,0,0.12)]"
                                                    style={{ backgroundColor: hex }}
                                                />
                                                <p className={`text-[14px] text-[#000] ${selected ? 'font-[Inter-SemiBold]' : 'font-[Inter-Regular]'}`}>{name}</p>
                                            </button>
                                        )
                                    })}
                                    {hasMore ? (
                                        <button
                                            type="button"
                                            onClick={() => setDynamicExpanded((p) => ({ ...p, [k]: !p[k] }))}
                                            className="border border-[rgba(143,143,143,0.45)] bg-white rounded-[100px] p-[6px_14px] cursor-pointer flex items-center gap-[4px] text-[14px] text-[#3A88EF] font-[Inter-SemiBold]"
                                        >
                                            {expanded ? 'View Less' : 'View More'}
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        )
                    }

                    return (
                        <div key={k} className="border-b border-[rgba(143,143,143,0.22)] p-[20px]">
                            <SectionTitle>{item.name}</SectionTitle>
                            <div className="flex flex-wrap gap-[8px]">
                                {options.map((opt) => (
                                    <Pill
                                        key={`${k}-${opt}`}
                                        selected={isDynamicButtonOptionSelected(
                                            item.name,
                                            Boolean(item.multiselect),
                                            dynamicFilters[k],
                                            opt
                                        )}
                                        onClick={() => {
                                            setDynamicFilters((prev) => {
                                                const cur = prev[k]
                                                if (item.multiselect) {
                                                    const arr = Array.isArray(cur) ? cur : []
                                                    const has = arr.includes(opt)
                                                    return { ...prev, [k]: has ? arr.filter((x) => x !== opt) : [...arr, opt] }
                                                }
                                                return { ...prev, [k]: cur === opt ? '' : opt }
                                            })
                                        }}
                                    >
                                        {opt}
                                    </Pill>
                                ))}
                            </div>
                        </div>
                    )
                })}

                <div className="p-[20px] border-b border-[rgba(143,143,143,0.22)]">
                    <SectionTitle>Other Filters</SectionTitle>
                    <div className="flex flex-col gap-3">
                        <label className="relative flex cursor-pointer items-center gap-[10px]">
                            <input
                                type="checkbox"
                                checked={adsWithVideo}
                                onChange={() => setAdsWithVideo((v) => !v)}
                                className="w-[22px] h-[22px] appearance-none border-2 border-[rgba(143,143,143,0.5)] rounded checked:bg-[#fff] checked:border-[#DC0000] cursor-pointer"
                            />
                            {adsWithVideo ? <TickIcon className="w-[24px] h-[22px] absolute left-[-1px] rtl:right-[-1px] rtl:left-auto" fill="#DC0000" /> : null}
                            <p className="text-[14px] font-[Inter-Regular] text-[#000]">Ads with Video</p>
                        </label>
                        <label className="relative flex cursor-pointer items-center gap-[10px]">
                            <input
                                type="checkbox"
                                checked={adsWith360}
                                onChange={() => setAdsWith360((v) => !v)}
                                className="w-[22px] h-[22px] appearance-none border-2 border-[rgba(143,143,143,0.5)] rounded checked:bg-[#fff] checked:border-[#DC0000] cursor-pointer"
                            />
                            {adsWith360 ? <TickIcon className="w-[24px] h-[22px] absolute left-[-1px] rtl:right-[-1px] rtl:left-auto" fill="#DC0000" /> : null}
                            <p className="text-[14px] font-[Inter-Regular] text-[#000]">Ads with 360 view</p>
                        </label>
                    </div>
                </div>


                <div className="border-b border-[rgba(143,143,143,0.22)] p-[20px]">
                    <SectionTitle>Seller Type</SectionTitle>
                    <div className="flex flex-wrap gap-[8px]">
                        {SELLER_TYPES.map((s) => (
                            <Pill
                                key={s}
                                selected={state.sellerType.includes(s)}
                                onClick={() => dispatch({ type: 'toggleMulti', key: 'sellerType', val: s })}
                            >
                                {s}
                            </Pill>
                        ))}
                    </div>
                </div>

                <div className="border-b border-[rgba(143,143,143,0.22)] p-[20px]">
                    <SectionTitle>Seats</SectionTitle>
                    <div className="flex flex-wrap items-center gap-[8px]">
                        {(state.expanded.seats ? SEAT_OPTIONS : SEAT_OPTIONS.slice(0, COLLAPSE_COUNT)).map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => dispatch({ type: 'toggleMulti', key: 'seats', val: n })}
                                className={`flex cursor-pointer w-[38px] h-[34px] shrink-0 items-center justify-center rounded-full border text-[13px] font-[Inter-Medium] transition-colors ${state.seats.includes(n)
                                    ? 'border-[#3A88EF] bg-[rgba(58,136,239,0.1)] text-[#000]'
                                    : 'border-[rgba(143,143,143,0.45)] bg-white text-[#000] hover:border-[#8F8F8F]'
                                    }`}
                            >
                                <p className="text-[14px] font-[Inter-Regular] text-[#000]">{n}</p>
                            </button>
                        ))}
                        {SEAT_OPTIONS.length > COLLAPSE_COUNT ? (
                            <button
                                type="button"
                                onClick={() => dispatch({ type: 'toggleExpand', key: 'seats' })}
                                className="border border-[rgba(143,143,143,0.45)] bg-white rounded-[100px] p-[6px_14px] cursor-pointer flex items-center gap-[4px] text-[14px] text-[#3A88EF] font-[Inter-SemiBold]"
                            >
                                {state.expanded.seats ? 'View Less' : 'View More'}
                            </button>
                        ) : null}
                    </div>
                </div>

                <div className="border-b border-[rgba(143,143,143,0.22)] p-[20px]">
                    <SectionTitle>Transmission Type</SectionTitle>
                    <div className="flex flex-wrap items-center gap-[8px]">
                        {TRANSMISSION.map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => dispatch({ type: 'toggleMulti', key: 'transmission', val: t })}
                                className={`flex cursor-pointer p-[6px_14px] shrink-0 items-center justify-center rounded-full border text-[13px] font-[Inter-Medium] transition-colors ${state.transmission.includes(t)
                                    ? 'border-[#3A88EF] bg-[rgba(58,136,239,0.1)] text-[#000]'
                                    : 'border-[rgba(143,143,143,0.45)] bg-white text-[#000] hover:border-[#8F8F8F]'
                                    }`}
                            >
                                <p className="text-[14px] font-[Inter-Regular] text-[#000]">{t}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="border-b border-[rgba(143,143,143,0.22)] p-[20px]"  >
                    <SectionTitle>Fuel Type</SectionTitle>
                    <div className="flex flex-wrap items-center gap-[8px]">
                        {FUEL_TYPES.map((f) => (
                            <button
                                key={f}
                                type="button"
                                onClick={() => dispatch({ type: 'toggleMulti', key: 'fuel', val: f })}
                                className={`flex cursor-pointer p-[6px_14px] shrink-0 items-center justify-center rounded-full border text-[13px] font-[Inter-Medium] transition-colors ${state.fuel.includes(f)
                                    ? 'border-[#3A88EF] bg-[rgba(58,136,239,0.1)] text-[#000]'
                                    : 'border-[rgba(143,143,143,0.45)] bg-white text-[#000] hover:border-[#8F8F8F]'
                                    }`}
                            >
                                <p className="text-[14px] font-[Inter-Regular] text-[#000]">{f}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="border-b border-[rgba(143,143,143,0.22)] p-[20px]" >
                    <SectionTitle>Badges</SectionTitle>
                    <ChipRow items={BADGES} selectedKey="badges" state={state} dispatch={dispatch} expandedKey="badges" />
                </div>


                <div className="border-b border-[rgba(143,143,143,0.22)] p-[20px]">
                    <SectionTitle>Dealer Name</SectionTitle>
                    <div ref={dealerWrapRef} className="relative flex items-center gap-[10px] border border-[rgba(143,143,143,0.45)] rounded-[6px] p-[10px]">
                        <div className="">
                            <SearchIcon stroke="#8F8F8F" className="h-[28px] w-[28px]" />
                        </div>
                        <input
                            type="text"
                            value={state.dealerName}
                            onChange={(e) => {
                                dispatch({ type: 'setStr', key: 'dealerName', val: e.target.value })
                                setDealerOpen(true)
                            }}
                            onFocus={() => setDealerOpen(true)}
                            placeholder="Search"
                            className="w-full text-[13px] outline-none placeholder:text-[#8f8f8f] "
                        />
                        {dealerOpen ? (
                            (() => {
                                const q = state.dealerName.trim().toLowerCase()
                                const items = q
                                    ? DEALER_NAME_SUGGESTIONS.filter((x) => x.toLowerCase().includes(q))
                                    : DEALER_NAME_SUGGESTIONS.slice(0, 5)
                                return (
                                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[120] max-h-[260px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
                                        <div className="max-h-[260px] overflow-y-auto [scrollbar-width:thin]">
                                            {items.length ? (
                                                items.map((item) => (
                                                    <button
                                                        key={item}
                                                        type="button"
                                                        className="block w-full px-[14px] py-[12px] text-left text-[14px] font-[Inter-Regular] text-[#23262A] hover:bg-[#F5F5F5]"
                                                        onClick={() => {
                                                            dispatch({ type: 'setStr', key: 'dealerName', val: item })
                                                            setDealerOpen(false)
                                                        }}
                                                    >
                                                        {item}
                                                    </button>
                                                ))
                                            ) : (
                                                <p className="px-[14px] py-[12px] text-[13px] font-[Inter-Regular] text-[#8F8F8F]">No dealers found</p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })()
                        ) : null}
                    </div>
                </div>

                <div className="border-b border-[rgba(143,143,143,0.22)] p-[20px]">
                    <SectionTitle>Export Status</SectionTitle>
                    <div className="flex flex-wrap gap-[8px]">
                        {EXPORT_STATUS.map((s) => (
                            <Pill
                                key={s}
                                selected={state.exportStatus.includes(s)}
                                onClick={() => dispatch({ type: 'toggleMulti', key: 'exportStatus', val: s })}
                            >
                                {s}
                            </Pill>
                        ))}
                    </div>
                </div>

                <div className="border-b border-[rgba(143,143,143,0.22)] p-[20px]" >
                    <SectionTitle>Horsepower</SectionTitle>
                    <ChipRow
                        items={HORSEPOWER}
                        selectedKey="horsepower"
                        state={state}
                        dispatch={dispatch}
                        expandedKey="horsepower"
                    />
                </div>

                <div className="border-b border-[rgba(143,143,143,0.22)] p-[20px]" >
                    <SectionTitle>Engine Capacity (Cc)</SectionTitle>
                    <ChipRow
                        items={ENGINE_CC}
                        selectedKey="engineCc"
                        state={state}
                        dispatch={dispatch}
                        expandedKey="engineCc"
                    />
                </div>

                <div className="border-b border-[rgba(143,143,143,0.22)] p-[20px]">
                    <SectionTitle>Doors</SectionTitle>
                    <div className="flex flex-wrap gap-[8px]">
                        {DOOR_OPTIONS.map((item) => (
                            <Pill
                                key={item}
                                selected={state.doors.includes(item)}
                                onClick={() => dispatch({ type: 'toggleMulti', key: 'doors', val: item })}
                            >
                                {item}
                            </Pill>
                        ))}
                    </div>
                </div>

                <div className="border-b border-[rgba(143,143,143,0.22)] p-[20px]">
                    <SectionTitle>Warranty</SectionTitle>
                    <div className="flex flex-wrap gap-[8px]">
                        {WARRANTY_OPTIONS.map((item) => (
                            <Pill
                                key={item}
                                selected={state.warranty.includes(item)}
                                onClick={() => dispatch({ type: 'toggleMulti', key: 'warranty', val: item })}
                            >
                                {item}
                            </Pill>
                        ))}
                    </div>
                </div>

                <div className="border-b border-[rgba(143,143,143,0.22)] p-[20px]">
                    <SectionTitle>Location</SectionTitle>
                    <div
                        ref={locationWrapRef}
                        className="relative justify-between flex items-center gap-[10px] border border-[rgba(143,143,143,0.45)] rounded-[6px] p-[10px] "
                    >
                        <input
                            type="text"
                            value={state.location}
                            onChange={(e) => {
                                dispatch({ type: 'setStr', key: 'location', val: e.target.value })
                                setLocationOpen(true)
                            }}
                            onFocus={() => setLocationOpen(true)}
                            placeholder="Enter location"
                            className="w-full text-[14px] text-[#000] font-[Inter-Regular] outline-none placeholder:text-[#8f8f8f] border-none "
                        />
                        <div>
                            <LocationIcon className="w-[28px] h-[28px]" />
                        </div>
                        {locationOpen ? (
                            (() => {
                                const q = state.location.trim().toLowerCase()
                                const items = q
                                    ? LOCATION_SUGGESTIONS.filter(
                                        (x) =>
                                            x.title.toLowerCase().includes(q) || x.subtitle.toLowerCase().includes(q)
                                    )
                                    : LOCATION_SUGGESTIONS.slice(0, 6)
                                return (
                                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[120] max-h-[260px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
                                        <div className="max-h-[260px] overflow-y-auto [scrollbar-width:thin]">
                                            {items.length ? (
                                                items.map((item) => (
                                                    <button
                                                        key={item.title}
                                                        type="button"
                                                        className="block w-full px-[14px] py-[12px] text-left hover:bg-[#F5F5F5]"
                                                        onClick={() => {
                                                            dispatch({ type: 'setStr', key: 'location', val: item.title })
                                                            setLocationOpen(false)
                                                        }}
                                                    >
                                                        <div className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">{item.title}</div>
                                                        <div className="text-[13px] font-[Inter-Regular] text-[#8F8F8F]">{item.subtitle}</div>
                                                    </button>
                                                ))
                                            ) : (
                                                <p className="px-[14px] py-[12px] text-[13px] font-[Inter-Regular] text-[#8F8F8F]">No locations found</p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })()
                        ) : null}
                    </div>
                </div>

                <div className="border-b border-[rgba(143,143,143,0.22)] p-[20px]">
                    <SectionTitle>Ads Posted</SectionTitle>
                    <ChipRow
                        items={ADS_POSTED}
                        selectedKey="adsPosted"
                        state={state}
                        dispatch={dispatch}
                        expandedKey="adsPosted"
                    />
                </div>

                <div className="border-b border-[rgba(143,143,143,0.22)] p-[20px]">
                    <SectionTitle>Number Of Cylinders</SectionTitle>
                    <ChipRow
                        items={CYLINDER_OPTIONS}
                        selectedKey="cylinders"
                        state={state}
                        dispatch={dispatch}
                        expandedKey="cylinders"
                    />
                </div>

                <div className="border-b border-[rgba(143,143,143,0.22)] p-[20px]">
                    <SectionTitle>Steering Side</SectionTitle>
                    <div className="flex flex-wrap gap-[8px]">
                        {STEERING_SIDE_OPTIONS.map((item) => (
                            <Pill
                                key={item}
                                selected={state.steeringSide.includes(item)}
                                onClick={() => dispatch({ type: 'toggleMulti', key: 'steeringSide', val: item })}
                            >
                                {item}
                            </Pill>
                        ))}
                    </div>
                </div>


                <div className="border-b border-[rgba(143,143,143,0.22)] p-[20px]" >
                    <SectionTitle>Driver Assistance & Safety</SectionTitle>
                    <ChipRow
                        items={DRIVER_ASSIST}
                        selectedKey="driverAssist"
                        state={state}
                        dispatch={dispatch}
                        expandedKey="driverAssist"
                    />
                </div>


                <div className="border-b border-[rgba(143,143,143,0.22)] p-[20px]" >
                    <SectionTitle>Comfort & Convenience</SectionTitle>
                    <ChipRow
                        items={COMFORT}
                        selectedKey="comfort"
                        state={state}
                        dispatch={dispatch}
                        expandedKey="comfort"
                    />
                </div>


                <div className="border-b border-[rgba(143,143,143,0.22)] p-[20px]" >
                    <SectionTitle>Entertainment & Technology</SectionTitle>
                    <ChipRow
                        items={ENTERTAINMENT}
                        selectedKey="entertainment"
                        state={state}
                        dispatch={dispatch}
                        expandedKey="entertainment"
                    />
                </div>


                <div className="border-b border-[rgba(143,143,143,0.22)] p-[20px]" >
                    <SectionTitle>Exterior</SectionTitle>
                    <ChipRow
                        items={EXTERIOR_FEAT}
                        selectedKey="exteriorFeatures"
                        state={state}
                        dispatch={dispatch}
                        expandedKey="exteriorFeatures"
                    />
                </div>

                <div className="p-[20px]" >
                    <SectionTitle>Other Filters</SectionTitle>
                    <div className="flex flex-col gap-3">
                        <label className="relative flex cursor-pointer items-center gap-[10px]">
                            <input
                                type="checkbox"
                                checked={state.other360}
                                onChange={() => dispatch({ type: 'toggleBool', key: 'other360' })}
                                className="w-[22px] h-[22px] appearance-none border-2 border-[rgba(143,143,143,0.5)] rounded 
                                         checked:bg-[#fff] checked:border-[#DC0000] cursor-pointer"
                            />
                            {state.other360 ? (
                                <TickIcon className="w-[24px] h-[22px] absolute left-[-1px] rtl:right-[-1px] rtl:left-auto" fill="#DC0000" />
                            ) : null}
                            <p className="text-[14px] font-[Inter-Regular] text-[#000]">Ads with 360 view</p>
                        </label>
                        <label className="relative flex cursor-pointer items-center gap-[10px]">
                            <input
                                type="checkbox"
                                checked={state.otherEnglish}
                                onChange={() => dispatch({ type: 'toggleBool', key: 'otherEnglish' })}
                                className="w-[22px] h-[22px] appearance-none border-2 border-[rgba(143,143,143,0.5)] rounded 
                                         checked:bg-[#fff] checked:border-[#DC0000] cursor-pointer"
                            />
                            {state.otherEnglish ? (
                                <TickIcon className="w-[24px] h-[22px] absolute left-[-1px] rtl:right-[-1px] rtl:left-auto" fill="#DC0000" />
                            ) : null}
                            <p className="text-[14px] font-[Inter-Regular] text-[#000]">Ads in English</p>
                        </label>
                        <label className="relative flex cursor-pointer items-center gap-[10px]">
                            <input
                                type="checkbox"
                                checked={state.otherYard}
                                onChange={() => dispatch({ type: 'toggleBool', key: 'otherYard' })}
                                className="w-[22px] h-[22px] appearance-none border-2 border-[rgba(143,143,143,0.5)] rounded 
                                         checked:bg-[#fff] checked:border-[#DC0000] cursor-pointer"
                            />
                            {state.otherYard ? (
                                <TickIcon className="w-[24px] h-[22px] absolute left-[-1px] rtl:right-[-1px] rtl:left-auto" fill="#DC0000" />
                            ) : null}
                            <p className="text-[14px] font-[Inter-Regular] text-[#000]">Yard Sale</p>
                        </label>
                        <label className="relative flex cursor-pointer items-center gap-[10px]">
                            <input
                                type="checkbox"
                                checked={state.otherSoon}
                                onChange={() => dispatch({ type: 'toggleBool', key: 'otherSoon' })}
                                className="w-[22px] h-[22px] appearance-none border-2 border-[rgba(143,143,143,0.5)] rounded 
                                         checked:bg-[#fff] checked:border-[#DC0000] cursor-pointer"
                            />
                            {state.otherSoon ? (
                                <TickIcon className="w-[24px] h-[22px] absolute left-[-1px] rtl:right-[-1px] rtl:left-auto" fill="#DC0000" />
                            ) : null}
                            <p className="text-[14px] font-[Inter-Regular] text-[#000]">Coming Soon Cars</p>
                        </label>
                    </div>
                </div>
            </div>

            <div className="shrink-0 bg-white p-[14px] border-t border-[rgba(143,143,143,0.22)] ">
                <div className="flex items-stretch gap-[10px]">
                    <button
                        type="button"
                        onClick={handleClear}
                        className="flex-1 cursor-pointer rounded-[8px] border border-[#23262A] bg-white py-[10px] text-center text-[14px] font-[Inter-SemiBold] text-[#23262A] hover:bg-[#F5F5F5]"
                    >
                        Clear
                    </button>
                    <button
                        type="button"
                        onClick={handleApply}
                        className="flex-[2.2] cursor-pointer rounded-[8px] bg-[#23262A] py-[10px] text-center text-[14px] font-[Inter-SemiBold] text-white hover:bg-[#000]"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    )
}
