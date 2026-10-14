'use client'

import { useEffect, useRef, useState } from 'react'
import { RightArrowIcon, TickIcon } from '@/components/CustomFile/icons'
import { appendGetItemFiltersToSearchParams, serializeHeroApiCategoryFilters } from '@/utils/getItemFilterParams'

const SCROLL_BODY =
    'min-h-0 flex-1 overflow-y-auto [scrollbar-color:#888888_#EEEEEE] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#EEEEEE] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#888888]'

export const AMENITIES_COL1 = [
    { id: 'maids_room', label: "Maids Room" },
    { id: 'central_ac', label: 'Central A/C & Heating' },
    { id: 'balcony', label: 'Balcony' },
    { id: 'private_pool', label: 'Private Pool' },
    { id: 'private_jacuzzi', label: 'Private Jacuzzi' },
    { id: 'shared_spa', label: 'Shared Spa' },
    { id: 'security', label: 'Security' },
    { id: 'storage', label: 'Storage Areas' },
    { id: 'bbq', label: 'Barbeque Area' },
    { id: 'waste_disposal', label: 'Waste Disposal' },
]

export const AMENITIES_COL2 = [
    { id: 'study', label: 'Study' },
    { id: 'concierge', label: 'Concierge Service' },
    { id: 'private_garden', label: 'Private Garden' },
    { id: 'private_gym', label: 'Private Gym' },
    { id: 'shared_pool', label: 'Shared Pool' },
    { id: 'shared_gym', label: 'Shared Gym' },
    { id: 'maid_service', label: 'Maid Service' },
    { id: 'cleaning', label: 'Cleaning Services' },
    { id: 'lobby', label: 'Lobby in Building' },
]

export function buildAmenitiesInitial() {
    const o = {}
        ;[...AMENITIES_COL1, ...AMENITIES_COL2].forEach((a) => {
            o[a.id] = false
        })
    return o
}

export const INITIAL_MORE_FILTERS = {
    listedBy: { agent: false, landlord: false, developer: false },
    baths: 'any',
    areaMin: '',
    areaMax: '',
    agency: '',
    furnishing: 'all',
    amenities: {},
    adsVideo: false,
    ads360: false,
    rentPaid: { yearly: false, monthly: false, quarterly: false, biYearly: false },
    keyword: '',
    /** Values from GET get-category-filters `filters` (keyed by filter name). */
    apiCategoryFilters: {},
}

const BATH_OPTIONS = [
    { value: 'any', label: 'Any Bathrooms' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5+' },
]

const FURNISHING_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'furnished', label: 'Furnished' },
    { value: 'unfurnished', label: 'Unfurnished' },
    { value: 'semi', label: 'Semi-furnished' },
]

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

function Section({ title, children, className = '' }) {
    return (
        <div className={`border-b border-[#8f8f8f] p-[16px_16px] last:border-b-0 ${className}`}>
            {title ? <h4 className="mb-[10px] text-[16px] font-[Inter-Medium] text-[#000]">{title}</h4> : null}
            {children}
        </div>
    )
}

function InlineSelect({ value, onChange, options, ariaLabel }) {
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

    const selected = options.find((o) => o.value === value)?.label || options[0]?.label || ''

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={ariaLabel}
                onClick={() => setOpen((v) => !v)}
                className={`bg-[#fff] rounded-[6px] flex w-full cursor-pointer items-center justify-between p-[14px_10px] border border-[rgba(143,143,143,0.4)]
                }`}
            >
                <p className="truncate text-[14px] text-[#000] font-[Inter-Regular]">
                    {selected}
                </p>
                <div open={open}>
                    <RightArrowIcon className="w-[18px] h-[18px] rotate-90" />
                </div>
            </button>

            {open ? (
                <div className="absolute left-0 top-[44px] z-[100] w-full rounded-[6px] border border-[#8f8f8f] bg-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] overflow-hidden">
                    <ul role="listbox" aria-label={ariaLabel} className="max-h-[220px] overflow-y-auto">
                        {options.map((o, idx) => (
                            <li key={o.value}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange(o.value)
                                        setOpen(false)
                                    }}
                                    className={`cursor-pointer w-full p-[12px_10px] border-b border-[#e5e5e5] text-left text-[14px] text-[#000] hover:bg-[#F5F5F5] ${idx !== options.length - 1 ? 'font-[Inter-Regular]' : 'font-[Inter-Medium]'
                                        }`}
                                >
                                    {o.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    )
}


function ApiCategoryFilterSections({ definitions, value, onChange }) {
    const acf = value.apiCategoryFilters || {}
    const setAcf = (name, nextVal) =>
        onChange((prev) => ({
            ...prev,
            apiCategoryFilters: { ...(prev.apiCategoryFilters || {}), [name]: nextVal },
        }))

    const toggleButtonValue = (name, val, multiselect) => {
        const prevVal = acf[name]
        if (multiselect) {
            const arr = Array.isArray(prevVal) ? [...prevVal] : []
            const i = arr.indexOf(val)
            if (i >= 0) arr.splice(i, 1)
            else arr.push(val)
            setAcf(name, arr)
        } else {
            setAcf(name, prevVal === val ? '' : val)
        }
    }

    const sorted = [...definitions]
        .filter((f) => f && Number(f.is_active) === 1)
        .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))

    return sorted.map((f) => {
        if (f.type === 'min-max') {
            const mm = acf[f.name] && typeof acf[f.name] === 'object' ? acf[f.name] : { min: '', max: '' }
            return (
                <Section key={`${f.category_id}-${f.name}`} title={f.name}>
                    <div className="flex items-end gap-2">
                        <div className="min-w-0 flex-1">
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Min"
                                value={mm.min ?? ''}
                                onChange={(e) =>
                                    setAcf(f.name, {
                                        ...mm,
                                        min: e.target.value.replace(/[^\d]/g, ''),
                                    })
                                }
                                className="p-[14px_10px] w-full rounded-[6px] border border-[#8f8f8f] bg-white text-[14px] font-[Inter-Regular] text-[#000] outline-none placeholder:text-[#8f8f8f]"
                            />
                        </div>
                        <span className="shrink-0 pb-2 text-[15px] text-[#666666]" aria-hidden>
                            -
                        </span>
                        <div className="min-w-0 flex-1">
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Max"
                                value={mm.max ?? ''}
                                onChange={(e) =>
                                    setAcf(f.name, {
                                        ...mm,
                                        max: e.target.value.replace(/[^\d]/g, ''),
                                    })
                                }
                                className="p-[14px_10px] w-full rounded-[6px] border border-[#8f8f8f] bg-white text-[14px] font-[Inter-Regular] text-[#000] outline-none placeholder:text-[#8f8f8f]"
                            />
                        </div>
                    </div>
                </Section>
            )
        }

        if (f.type === 'button' && Array.isArray(f.values)) {
            return (
                <Section key={`${f.category_id}-${f.name}`} title={f.name}>
                    <div className="grid grid-cols-2 gap-2">
                        {f.values.map((label) => {
                            const multi = Boolean(f.multiselect)
                            const selected = multi
                                ? Array.isArray(acf[f.name]) && acf[f.name].includes(label)
                                : acf[f.name] === label
                            return (
                                <label
                                    key={label}
                                    className="relative flex cursor-pointer items-center gap-[6px]"
                                >
                                    <input
                                        type={multi ? 'checkbox' : 'radio'}
                                        name={multi ? undefined : `api-filter-${f.name}`}
                                        className="h-[22px] w-[22px] cursor-pointer appearance-none rounded border border-[#000] checked:border-[#DC0000] checked:bg-[#fff]"
                                        checked={selected}
                                        onChange={() => toggleButtonValue(f.name, label, multi)}
                                    />
                                    {selected ? (
                                        <TickIcon
                                            className="absolute left-[-1px] h-[22px] w-[24px]"
                                            fill="#DC0000"
                                        />
                                    ) : null}
                                    <p className="text-[14px] font-[Inter-Regular] text-[#000]">{label}</p>
                                </label>
                            )
                        })}
                    </div>
                </Section>
            )
        }

        return null
    })
}

export default function HeroMoreFilters({ value, onChange, purpose, categoryFilterDefinitions }) {
    const [open, setOpen] = useState(false)
    const rootRef = useRef(null)

    const set = (patch) => onChange((prev) => ({ ...prev, ...patch }))

    const activeApiDefs = categoryFilterDefinitions?.length
        ? categoryFilterDefinitions.filter((f) => f && Number(f.is_active) === 1)
        : []
    const apiFilterNames = new Set(activeApiDefs.map((f) => f.name))
    const hideFurnishing = apiFilterNames.has('Is it furnished?')
    const hideAmenities = apiFilterNames.has('Amenities')
    const hideRentPaidStatic = apiFilterNames.has('Rent is paid')
    const hideBaths = apiFilterNames.has('Bathrooms')
    const hideArea = apiFilterNames.has('Size(Sqft)')
    const hideListedBy = apiFilterNames.has('Listed By')

    const setListedBy = (key, checked) =>
        onChange((prev) => ({
            ...prev,
            listedBy: { ...prev.listedBy, [key]: checked },
        }))

    const setRentPaid = (key, checked) =>
        onChange((prev) => ({
            ...prev,
            rentPaid: { ...prev.rentPaid, [key]: checked },
        }))

    const toggleAmenity = (id) =>
        onChange((prev) => ({
            ...prev,
            amenities: { ...prev.amenities, [id]: !prev.amenities[id] },
        }))

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

    const inputClass =
        'h-[40px] w-full rounded-[6px] border border-[#c5c5c5] bg-white px-3 text-[13px] font-[Inter-Regular] text-[#1a1a1a] outline-none placeholder:text-[#999] focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]/25'

    const selectClass = `${inputClass} cursor-pointer appearance-none bg-[length:14px] bg-[right_12px_center] bg-no-repeat pr-10`
    const selectChevronStyle = {
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' stroke='%231a1a1a' stroke-width='2'%3E%3Cpath d='M4 6l3 3 3-3'/%3E%3C/svg%3E")`,
    }

    return (
        <div ref={rootRef} className="relative min-w-0 w-full lg:max-w-[120px]">
            <span className="mb-1 block text-[11px] font-[Inter-Medium] leading-tight text-white/95">More</span>
            <button
                type="button"
                aria-expanded={open}
                aria-controls="property-hero-more-panel"
                onClick={() => setOpen((v) => !v)}
                className={`bg-[#fff] rounded-[6px] flex w-full cursor-pointer items-center justify-between p-[14px_10px]
                }`}
            >
                <p className="truncate text-[14px] text-[#000] font-[Inter-Regular]">More</p>
                <div >
                    <RightArrowIcon className="w-[18px] h-[18px] rotate-90" />
                </div>
            </button>
            {open ? (
                <div
                    id="property-hero-more-panel"
                    role="dialog"
                    aria-label="More filters"
                    className="mt-[10px] absolute right-0 top-[calc(100%-1px)] z-[9999] isolate flex max-h-[min(72vh,640px)] w-[min(calc(100vw-1.5rem),400px)] flex-col overflow-hidden rounded-[8px] border border-[#1a1a1a] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.2)] sm:w-[400px]"
                >
                    <div className={SCROLL_BODY}>

                        {activeApiDefs.length ? (
                            <ApiCategoryFilterSections
                                definitions={activeApiDefs}
                                value={value}
                                onChange={onChange}
                            />
                        ) : null}

                        {!hideFurnishing ? (
                        <Section title="Furnishing Status">
                            <InlineSelect
                                value={value.furnishing}
                                onChange={(next) => set({ furnishing: next })}
                                options={FURNISHING_OPTIONS}
                                ariaLabel="Furnishing Status"
                            />
                        </Section>
                        ) : null}

                        {!hideAmenities ? (
                        <Section title="Amenities">
                            <div className="flex gap-6">
                                <div className="flex min-w-0 flex-1 flex-col gap-2">
                                    {AMENITIES_COL1.map((a) => (
                                        <label
                                            key={a.id}
                                            className="relative flex items-center cursor-pointer gap-[6px]"                                        >
                                            <input
                                                type="checkbox"
                                                className="w-[22px] h-[22px] appearance-none border border-[#000] rounded 
                                         checked:bg-[#fff] checked:border-[#DC0000] cursor-pointer"
                                                checked={value.amenities[a.id]}
                                                onChange={() => toggleAmenity(a.id)}
                                            />
                                            {value.amenities[a.id] ? (
                                                <TickIcon className="w-[24px] h-[22px] absolute left-[-1px]" fill="#DC0000" />
                                            ) : null}
                                            <p className="text-[14px] font-[Inter-Regular] text-[#000]">{a.label}</p>
                                        </label>
                                    ))}
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col gap-2">
                                    {AMENITIES_COL2.map((a) => (
                                        <label
                                            key={a.id}
                                            className="relative flex items-center cursor-pointer gap-[6px]"
                                        >
                                            <input
                                                type="checkbox"
                                                className="w-[22px] h-[22px] appearance-none border border-[#000] rounded 
                                         checked:bg-[#fff] checked:border-[#DC0000] cursor-pointer"
                                                checked={Boolean(value.amenities[a.id])}
                                                onChange={() => toggleAmenity(a.id)}
                                            />
                                            {Boolean(value.amenities[a.id]) ? (
                                                <TickIcon className="w-[24px] h-[22px] absolute left-[-1px]" fill="#DC0000" />
                                            ) : null}
                                            <p className="text-[14px] font-[Inter-Regular] text-[#000]">{a.label}</p>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </Section>
                        ) : null}

                        {purpose === 'rent' && !hideRentPaidStatic ? (
                            <Section title="Rent is Paid">
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { key: 'yearly', label: 'Yearly' },
                                        { key: 'monthly', label: 'Monthly' },
                                        { key: 'quarterly', label: 'Quarterly' },
                                        { key: 'biYearly', label: 'Bi-Yearly' },
                                    ].map(({ key, label }) => (
                                        <label
                                            key={key}
                                            className="relative flex items-center cursor-pointer gap-[6px]"
                                        >
                                            <input
                                                type="checkbox"
                                                className="w-[22px] h-[22px] appearance-none border border-[#000] rounded 
                                         checked:bg-[#fff] checked:border-[#DC0000] cursor-pointer"
                                                checked={Boolean(value.rentPaid[key])}
                                                onChange={(e) => setRentPaid(key, e.target.checked)}
                                            />
                                            {value.rentPaid[key] ? (
                                                <TickIcon className="w-[24px] h-[22px] absolute left-[-1px]" fill="#DC0000" />
                                            ) : null}
                                            <p className="text-[14px] font-[Inter-Regular] text-[#000]">{label}</p>
                                        </label>
                                    ))}
                                </div>
                            </Section>
                        ) : null}

                        <Section title="Keyword Search">
                            <input
                                type="text"
                                placeholder="E.g. Pool, Security, Ref ID Number"
                                value={value.keyword}
                                onChange={(e) => set({ keyword: e.target.value })}
                                className="p-[14px_10px] w-full rounded-[6px] border border-[#8f8f8f] bg-white text-[14px] font-[Inter-Regular] text-[#000] outline-none placeholder:text-[#8f8f8f]"
                            />
                        </Section>

                        {!hideListedBy ? (
                        <Section title="Listed By">
                            <div className="grid grid-cols-2 gap-2">
                                <label className="relative flex items-center cursor-pointer gap-[6px]">
                                    <input
                                        type="checkbox"
                                        className="w-[22px] h-[22px] appearance-none border border-[#000] rounded 
                                         checked:bg-[#fff] checked:border-[#DC0000] cursor-pointer"
                                        checked={Boolean(value.listedBy.agent)}
                                        onChange={(e) => setListedBy('agent', e.target.checked)}
                                    />
                                    {value.listedBy.agent ? (
                                        <TickIcon className="w-[24px] h-[22px] absolute left-[-1px]" fill="#DC0000" />
                                    ) : null}
                                    <p className="text-[14px] font-[Inter-Regular] text-[#000]">Agent</p>
                                </label>
                                <label className="relative flex items-center cursor-pointer gap-[6px]">
                                    <input
                                        type="checkbox"
                                        className="w-[22px] h-[22px] appearance-none border border-[#000] rounded 
                                         checked:bg-[#fff] checked:border-[#DC0000] cursor-pointer"
                                        checked={Boolean(value.listedBy.landlord)}
                                        onChange={(e) => setListedBy('landlord', e.target.checked)}
                                    />
                                    {value.listedBy.landlord ? (
                                        <TickIcon className="w-[24px] h-[22px] absolute left-[-1px]" fill="#DC0000" />
                                    ) : null}
                                    <p className="text-[14px] font-[Inter-Regular] text-[#000]">Landlord</p>
                                </label>
                                <label className="relative flex items-center cursor-pointer gap-[6px]">
                                    <input
                                        type="checkbox"
                                        className="w-[22px] h-[22px] appearance-none border border-[#000] rounded 
                                         checked:bg-[#fff] checked:border-[#DC0000] cursor-pointer"
                                        checked={Boolean(value.listedBy.developer)}
                                        onChange={(e) => setListedBy('developer', e.target.checked)}
                                    />
                                    {value.listedBy.developer ? (
                                        <TickIcon className="w-[24px] h-[22px] absolute left-[-1px]" fill="#DC0000" />
                                    ) : null}
                                    <p className="text-[14px] font-[Inter-Regular] text-[#000]">Developer</p>
                                </label>
                            </div>
                        </Section>
                        ) : null}

                        {!hideBaths ? (
                        <Section title="Baths">
                            <InlineSelect
                                value={value.baths}
                                onChange={(next) => set({ baths: next })}
                                options={BATH_OPTIONS}
                                ariaLabel="Baths"
                            />
                        </Section>
                        ) : null}

                        {!hideArea ? (
                        <Section title="Area / Size (sqft)">
                            <div className="flex items-end gap-2">
                                <div className="min-w-0 flex-1">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Min"
                                        value={value.areaMin}
                                        onChange={(e) => set({ areaMin: e.target.value.replace(/[^\d]/g, '') })}
                                        className="p-[14px_10px] w-full rounded-[6px] border border-[#8f8f8f] bg-white text-[14px] font-[Inter-Regular] text-[#000] outline-none placeholder:text-[#8f8f8f]"
                                    />
                                </div>
                                <span className="shrink-0 pb-2 text-[15px] text-[#666666]" aria-hidden>
                                    -
                                </span>
                                <div className="min-w-0 flex-1">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Max"
                                        value={value.areaMax}
                                        onChange={(e) => set({ areaMax: e.target.value.replace(/[^\d]/g, '') })}
                                        className="p-[14px_10px] w-full rounded-[6px] border border-[#8f8f8f] bg-white text-[14px] font-[Inter-Regular] text-[#000] outline-none placeholder:text-[#8f8f8f]"
                                    />
                                </div>
                            </div>
                        </Section>
                        ) : null}

                        <Section title="Real Estate Agencies">
                            <input
                                type="text"
                                placeholder="E.g. DAMAC Properties"
                                value={value.agency}
                                onChange={(e) => set({ agency: e.target.value })}
                                className="p-[14px_10px] w-full rounded-[6px] border border-[#8f8f8f] bg-white text-[14px] font-[Inter-Regular] text-[#000] outline-none placeholder:text-[#8f8f8f]"
                            />
                        </Section>

                        <Section title="Ads with Video">
                            <label className="relative flex items-center cursor-pointer gap-[6px]">
                                <input
                                    type="checkbox"
                                    className="w-[22px] h-[22px] appearance-none border border-[#000] rounded 
                                         checked:bg-[#000] checked:border-[#DC0000] cursor-pointer"
                                    checked={Boolean(value.adsVideo)}
                                    onChange={(e) => set({ adsVideo: e.target.checked })}
                                />
                                {Boolean(value.adsVideo) ? (
                                    <TickIcon className="w-[24px] h-[22px] absolute left-[-1px]" fill="#DC0000" />
                                ) : null}
                                <p className="text-[14px] font-[Inter-Regular] text-[#000]">Ads with Video</p>
                            </label>

                        </Section>

                        <Section title="Ads with 360 Tour">
                            <label className="relative flex items-center cursor-pointer gap-[6px]">
                                <input
                                    type="checkbox"
                                    className="w-[22px] h-[22px] appearance-none border border-[#000] rounded 
                                         checked:bg-[#000] checked:border-[#DC0000] cursor-pointer"
                                    checked={Boolean(value.ads360)}
                                    onChange={(e) => set({ ads360: e.target.checked })}
                                />
                                {Boolean(value.ads360) ? (
                                    <TickIcon className="w-[24px] h-[22px] absolute left-[-1px]" fill="#DC0000" />
                                ) : null}
                                <p className="text-[14px] font-[Inter-Regular] text-[#000]">Ads with 360 Tour</p>
                            </label>
                        </Section>

                    </div>

                    <div className="shrink-0 border-t border-[#EEEEEE] bg-white p-4">
                        <button
                            type="submit"
                            className="h-[46px] w-full rounded-[8px] bg-[#DC0000] text-[14px] font-[Inter-SemiBold] text-white shadow-md transition-colors hover:bg-[#c40000]"
                        >
                            Search
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export function appendMoreFiltersToSearchParams(params, more) {
    const filters = {}

    if (more.baths && more.baths !== 'any') {
        filters['Bathrooms'] = String(more.baths).trim()
    }

    const minSq = (more.areaMin || '').trim()
    const maxSq = (more.areaMax || '').trim()
    if (minSq || maxSq) {
        filters['Size(Sqft)'] = JSON.stringify({ min: minSq, max: maxSq })
    }

    if (more.furnishing && more.furnishing !== 'all') {
        if (more.furnishing === 'semi') {
            filters['Is it furnished?'] = JSON.stringify(['Semi-furnished'])
        } else if (more.furnishing === 'unfurnished') {
            filters['Is it furnished?'] = 'unfurnished'
        } else {
            filters['Is it furnished?'] = 'furnished'
        }
    }

    const amenityLabels = [...AMENITIES_COL1, ...AMENITIES_COL2]
        .filter((a) => more.amenities?.[a.id])
        .map((a) => a.label)
    if (amenityLabels.length) {
        filters['Amenities'] = JSON.stringify(amenityLabels)
    }

    const listedLabels = []
    if (more.listedBy?.agent) listedLabels.push('Agent')
    if (more.listedBy?.landlord) listedLabels.push('Landlord')
    if (more.listedBy?.developer) listedLabels.push('Developer')
    if (listedLabels.length) {
        filters['Listed By'] = JSON.stringify(listedLabels)
    }

    const rentLabels = []
    if (more.rentPaid?.yearly) rentLabels.push('Yearly')
    if (more.rentPaid?.monthly) rentLabels.push('Monthly')
    if (more.rentPaid?.quarterly) rentLabels.push('Quarterly')
    if (more.rentPaid?.biYearly) rentLabels.push('Bi-Yearly')
    if (rentLabels.length) {
        filters['Rent is paid'] = JSON.stringify(rentLabels)
    }

    const acfSerialized = serializeHeroApiCategoryFilters(more.apiCategoryFilters)
    Object.assign(filters, acfSerialized)

    appendGetItemFiltersToSearchParams(params, filters)

    if (more.adsVideo) params.set('hasVideo', '1')
    if (more.ads360) params.set('has360', '1')

    if (more.agency.trim()) params.set('agency', more.agency.trim())
    if (more.keyword.trim()) {
        params.set('keyword', more.keyword.trim())
        params.set('search', more.keyword.trim())
    }
}