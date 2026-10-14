'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { LocationIcon, SearchIcon, TickIcon, CloseIcon } from '@/components/CustomFile/icons'
import { isDynamicButtonOptionSelected } from '@/utils/getItemFilterParams'
import Api from '@/api/AxiosInterceptors'
import { categoryApi, categorySubdataApi } from '@/utils/api'
import target from '../../../../../public/assets/img/icons/target.svg'
import info from '../../../../../public/assets/img/icons/info.svg'
import rangebg from '../../../../../public/assets/img/rangebg.svg'
import Image from 'next/image'

const USAGE_OPTIONS = ['Never Used', 'Used Once', 'Light Usage', 'Normal Usage', 'Heavy Usage']
const CONDITION_OPTIONS = ['Flawless', 'Excellent', 'Good', 'Average', 'Poor']
const ADS_POSTED_OPTIONS = [
    'Today',
    'Within 3 days',
    'Within 1 week',
    'Within 2 weeks',
    'Within 1 month',
    'Within 3 months',
    'Within 6 months',
]
const AGE_OPTIONS = [
    'Brand New',
    '0-1 month',
    '1-6 months',
    '6-12 months',
    '1-2 years',
    '2-5 years',
    '5+ years',
]
const WARRANTY_OPTIONS = ['Yes', 'No', 'Does not apply']
const CATEGORY_GROUPS = [
    {
        label: 'All in Auto Services',
        items: ['Air Condition & Electrical Repairing', 'Body Detailing', 'Car Repair', 'Car Service'],
    },
]

const MOBILE_MODEL_SUGGESTIONS = ['iPhone 13', 'iPhone 14', 'Samsung S22', 'Samsung S23', 'Redmi Note 12', 'Oppo A78']
const MOBILE_COLOR_SUGGESTIONS = [
    { label: 'Beige', color: '#E9DDC1' },
    { label: 'Black', color: '#111827' },
    { label: 'Blue', color: '#1D4ED8' },
    { label: 'Brown', color: '#A16207' },
]
const FURNITURE_STYLE_OPTIONS = ['Americana', 'Art Deco', 'Asian', 'Casual', 'Classic', 'Contemporary', 'Modern']
const FURNITURE_FINISH_TYPE_OPTIONS = ['Ash', 'Beech', 'Brass', 'Bronze', 'Brushed', 'Chrome', 'Matte']
const FURNITURE_MATERIAL_TYPE_OPTIONS = ['Alloy Steel', 'Carbon Fibre', 'Engineered Wood', 'Metal', 'Oak', 'Plastic', 'Solid Wood']
const FURNITURE_MOUNTING_TYPE_OPTIONS = ['Ceiling Mount', 'Door Mount', 'Floor Mount', 'Tabletop Mount', 'Wall Mount', 'Freestanding']
const FURNITURE_SPECIAL_FEATURE_OPTIONS = [
    'Adjustable Angle',
    'Adjustable Feet',
    'Adjustable Height',
    'Adjustable Leg',
    'Adjustable Shelf',
    'Foldable',
    'Space Saving',
]
const FURNITURE_NUMBER_OF_DOORS_OPTIONS = ['0', '1', '2', '3', '4', '5+']
const FURNITURE_DOOR_STYLE_OPTIONS = ['Flat Panel', 'Raised Panel', 'Shaker', 'Shutter', 'Slab', 'Louvered']
const MOBILE_FORM_FACTOR_OPTIONS = ['Bar', 'Foldable Case', 'Foldable Screen', 'Slate', 'Slide']
const MOBILE_STORAGE_OPTIONS = ['16 GB', '32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB']
const MOBILE_VERSION_OPTIONS = ['US', 'UAE', 'UK', 'Japan', 'HK', 'India', 'Global']
const MOBILE_ACCOMPANIMENTS_OPTIONS = ['Box', 'Charger', 'Headset', 'Wireless charger']
const MOBILE_SCREEN_SIZE_OPTIONS = ['>3.9 in', '3.9 in', '4 to 4.4 in', '4.5 to 4.9 in', '5 to 5.4 in', '5.5 to 5.9 in', '6+ in']
const MOBILE_BATTERY_HEALTH_OPTIONS = ['Below 85%', 'Above 85%']
const MOBILE_YES_NO_OPTIONS = ['Yes', 'No']
const MOBILE_DAMAGE_DETAILS_OPTIONS = [
    'Cracked or Broken Screen',
    'Unable to Turn On',
    'Audio Not Working',
    'Not Charging',
    'Network/Connectivity Issues',
    'Camera Not Working',
]
const MOBILE_RAM_OPTIONS = ['1 GB or less', '2 GB', '3 GB', '4 GB', '6 GB', '8 GB', '12 GB']

function Chip({ active, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`cursor-pointer rounded-full border px-[14px] py-[8px] text-[14px] leading-[18px] ${active
                    ? 'border-[#3A88EF] bg-[rgb(242,247,254)] font-[Inter-SemiBold] text-[#23262A]'
                    : 'border-[rgba(143,143,143,0.45)] bg-white font-[Inter-Regular] text-[#23262A]'
                }`}
        >
            {children}
        </button>
    )
}

const LISTING_API_KEYWORD_SUGGESTIONS = [
    'laptop',
    'sofa',
    'iPhone',
    'camera',
    'bicycle',
    'monitor',
    'headphones',
    'gaming',
    'tablet',
    'watch',
]

function listingApiFilterKey(item) {
    return `cf_${item.category_id}_${item.sort_order}`
}

function pickApiFilterOptions(def) {
    const vObj = Array.isArray(def?.values_obj) ? def.values_obj : []
    if (vObj.length) return vObj.map((x) => String(x?.option_value || x?.value || x?.name || '')).filter(Boolean)
    const v = Array.isArray(def?.values) ? def.values : []
    return v.map((x) => String(x || '')).filter(Boolean)
}

function parseDropdownApiListPayload(res) {
    let payload = res?.data?.data ?? res?.data
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        const inner = payload.roles ?? payload.job_roles ?? payload.items ?? payload.list ?? payload.records
        if (Array.isArray(inner)) payload = inner
    }
    if (!Array.isArray(payload)) return []
    return payload
        .map((row) => {
            if (typeof row === 'string') return String(row).trim()
            const label = row?.name ?? row?.title ?? row?.label ?? row?.role_name ?? row?.job_role
            return String(label ?? '').trim()
        })
        .filter(Boolean)
}

function getDropdownApiEndpointKey(def) {
    const v = Array.isArray(def?.values) ? def.values : []
    const raw = v[0]
    return String(raw ?? '')
        .trim()
        .replace(/^api\//, '')
        .split('?')[0]
}

function isCategorySubdataEndpoint(endpoint) {
    const marker = String(endpoint || '')
        .trim()
        .toLowerCase()
        .replace(/-/g, '_')
    return marker === 'category_subdata' || marker === 'category_models'
}

function parseCategoryIdFromTreeResponse(res) {
    const rows = res?.data?.data
    const first = Array.isArray(rows) ? rows[0] : null
    const id = first?.category_id ?? first?.id
    const n = Number(id)
    return Number.isFinite(n) ? n : null
}

/** Classified listing: API-driven filters (same idea as PropertyProductsFiltersPanel). Separate component so hooks stay valid. */
function ClassifiedListingApiPanel({
    open,
    onClose,
    onApply,
    apiFilters = [],
    hydration = null,
    selectedCategoryId = null,
}) {
    const searchParams = useSearchParams()
    const [keywords, setKeywords] = useState('')
    const [keywordsOpen, setKeywordsOpen] = useState(false)
    const keywordsWrapRef = useRef(null)
    const [dynamicFilters, setDynamicFilters] = useState({})
    const [dropdownApiOptionsByKey, setDropdownApiOptionsByKey] = useState({})
    const [dropdownApiLoading, setDropdownApiLoading] = useState(false)

    const dropdownApiDefs = useMemo(
        () =>
            (Array.isArray(apiFilters) ? apiFilters : []).filter(
                (f) => String(f?.type || '').trim().toLowerCase() === 'dropdown_api'
            ),
        [apiFilters]
    )

    const categorySlugFromUrl = useMemo(
        () =>
            searchParams?.get('category_slug')?.trim() ||
            searchParams?.get('slug')?.trim() ||
            '',
        [searchParams]
    )

    const [resolvedCategoryIdFromSlug, setResolvedCategoryIdFromSlug] = useState(null)

    const effectiveCategoryId = useMemo(() => {
        const rawUrlId = searchParams?.get('category_id')?.trim()
        if (rawUrlId) {
            const n = Number(rawUrlId)
            if (Number.isFinite(n)) return n
        }
        if (selectedCategoryId != null && selectedCategoryId !== '') {
            const n = Number(selectedCategoryId)
            if (Number.isFinite(n)) return n
        }
        if (resolvedCategoryIdFromSlug != null) return resolvedCategoryIdFromSlug
        return null
    }, [searchParams, selectedCategoryId, resolvedCategoryIdFromSlug])

    useEffect(() => {
        const rawUrlId = searchParams?.get('category_id')?.trim()
        if (rawUrlId || selectedCategoryId != null || !categorySlugFromUrl) {
            setResolvedCategoryIdFromSlug(null)
            return undefined
        }

        let cancelled = false
        categoryApi
            .getCategoryTreeBySlug({ category_slug: categorySlugFromUrl })
            .then((res) => {
                if (!cancelled) setResolvedCategoryIdFromSlug(parseCategoryIdFromTreeResponse(res))
            })
            .catch(() => {
                if (!cancelled) setResolvedCategoryIdFromSlug(null)
            })

        return () => {
            cancelled = true
        }
    }, [searchParams, selectedCategoryId, categorySlugFromUrl])

    useEffect(() => {
        if (!open) return
        setKeywordsOpen(false)
    }, [open])

    useEffect(() => {
        if (!open || !hydration) return
        setKeywords(hydration.keywords || '')
        const fromUrl =
            hydration.dynamicFilters && typeof hydration.dynamicFilters === 'object'
                ? hydration.dynamicFilters
                : {}
        setDynamicFilters(() => {
            const next = {}
            if (Array.isArray(apiFilters) && apiFilters.length) {
                for (const f of apiFilters) {
                    const key = listingApiFilterKey(f)
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
    }, [open, hydration, apiFilters])

    useEffect(() => {
        if (open) return
        if (!apiFilters?.length) return
        setDynamicFilters((prev) => {
            const allowed = new Set(apiFilters.map((f) => listingApiFilterKey(f)))
            const next = {}
            for (const k of Object.keys(prev)) {
                if (allowed.has(k)) next[k] = prev[k]
            }
            apiFilters.forEach((f) => {
                const k = listingApiFilterKey(f)
                if (next[k] !== undefined) return
                if (f.type === 'min-max') next[k] = { min: '', max: '' }
                else if (f.multiselect) next[k] = []
                else next[k] = ''
            })
            return next
        })
    }, [apiFilters, open])

    useEffect(() => {
        if (!open || !dropdownApiDefs.length) {
            if (!open) {
                setDropdownApiOptionsByKey({})
                setDropdownApiLoading(false)
            }
            return undefined
        }

        if (effectiveCategoryId == null) {
            setDropdownApiOptionsByKey({})
            setDropdownApiLoading(false)
            return undefined
        }

        let cancelled = false
        setDropdownApiLoading(true)

        ;(async () => {
            try {
                const pairs = await Promise.all(
                    dropdownApiDefs.map(async (def) => {
                        const key = listingApiFilterKey(def)
                        const endpoint = getDropdownApiEndpointKey(def)
                        const categoryId = effectiveCategoryId
                        if (!endpoint || categoryId == null) return [key, []]

                        if (isCategorySubdataEndpoint(endpoint)) {
                            const res = await categorySubdataApi.getByCategoryId({ category_id: categoryId })
                            return [key, parseDropdownApiListPayload(res)]
                        }

                        const res = await Api.get(endpoint, {
                            params: { category_id: categoryId },
                            headers: { Accept: 'application/json' },
                        })
                        return [key, parseDropdownApiListPayload(res)]
                    })
                )
                if (cancelled) return
                const next = {}
                for (const [key, opts] of pairs) {
                    if (key) next[key] = Array.isArray(opts) ? opts : []
                }
                setDropdownApiOptionsByKey(next)
            } catch {
                if (!cancelled) setDropdownApiOptionsByKey({})
            } finally {
                if (!cancelled) setDropdownApiLoading(false)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [open, dropdownApiDefs, effectiveCategoryId])

    const handleListingClear = () => {
        setKeywords('')
        setKeywordsOpen(false)
        setDynamicFilters({})
    }

    const keywordQuery = keywords.trim().toLowerCase()
    const filteredListingKeywordSuggestions = keywordQuery
        ? LISTING_API_KEYWORD_SUGGESTIONS.filter((x) => x.toLowerCase().includes(keywordQuery))
        : LISTING_API_KEYWORD_SUGGESTIONS.slice(0, 6)

    useEffect(() => {
        if (!open) return
        if (!keywordsOpen) return
        const onDown = (e) => {
            if (!keywordsWrapRef.current?.contains(e.target)) setKeywordsOpen(false)
        }
        document.addEventListener('mousedown', onDown)
        return () => document.removeEventListener('mousedown', onDown)
    }, [open, keywordsOpen])

    if (!open) return null

    return (
        <div
            className="absolute right-0 rtl:left-0 rtl:right-auto top-[calc(100%+8px)] z-[95] flex max-h-[min(85vh,680px)] w-[min(100vw-20px,460px)] flex-col overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] max-sm:right-0 max-sm:w-full"
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
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
                            placeholder="E.g. brand, model, or listing details"
                            className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[12px_10px] text-[14px] text-[#23262A] outline-none placeholder:text-[#A9B1BB]"
                        />
                        {keywordsOpen ? (
                            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[140] max-h-[280px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
                                <div className="max-h-[280px] overflow-y-auto [scrollbar-width:thin]">
                                    {filteredListingKeywordSuggestions.length ? (
                                        filteredListingKeywordSuggestions.map((item) => (
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

                {apiFilters.map((item) => {
                    const k = listingApiFilterKey(item)
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
                    if (item.type === 'dropdown' || item.type === 'dropdown_api') {
                        const options =
                            item.type === 'dropdown_api'
                                ? dropdownApiOptionsByKey[k] || []
                                : pickApiFilterOptions(item)
                        const busy = item.type === 'dropdown_api' && dropdownApiLoading

                        if (item.multiselect) {
                            return (
                                <div key={k} className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                                    <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">{item.name}</h4>
                                    {busy ? (
                                        <p className="text-[13px] font-[Inter-Regular] text-[#8F8F8F]">Loading…</p>
                                    ) : options.length === 0 ? (
                                        <p className="text-[13px] font-[Inter-Regular] text-[#8F8F8F]">No options available.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-[8px]">
                                            {options.map((v) => (
                                                <Chip
                                                    key={v}
                                                    active={isDynamicButtonOptionSelected(item.name, true, value, v)}
                                                    onClick={() => {
                                                        setDynamicFilters((prev) => {
                                                            const arr = Array.isArray(prev[k]) ? [...prev[k]] : []
                                                            const on = isDynamicButtonOptionSelected(item.name, true, arr, v)
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
                                                    }}
                                                >
                                                    {v}
                                                </Chip>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        }

                        return (
                            <div key={k} className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                                <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">{item.name}</h4>
                                {busy ? (
                                    <p className="text-[13px] font-[Inter-Regular] text-[#8F8F8F]">Loading…</p>
                                ) : (
                                    <select
                                        className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white p-[12px_10px] text-[14px] text-[#23262A] outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        disabled={busy}
                                        value={value != null && value !== '' ? String(value) : ''}
                                        onChange={(e) => {
                                            setDynamicFilters((prev) => ({
                                                ...prev,
                                                [k]: e.target.value,
                                            }))
                                        }}
                                    >
                                        <option value="">Any</option>
                                        {options.map((opt) => (
                                            <option key={opt} value={opt}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )
                    }
                    return null
                })}
            </div>

            <div className="shrink-0 border-t border-[rgba(143,143,143,0.2)] p-[12px_16px]">
                <div className="flex items-stretch gap-[10px]">
                    <button
                        type="button"
                        className="cursor-pointer rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white p-[12px_26px] text-[14px] font-[Inter-SemiBold] text-[#23262A]"
                        onClick={handleListingClear}
                    >
                        Clear
                    </button>
                    <button
                        type="button"
                        className="flex-1 cursor-pointer rounded-[6px] bg-[#23262A] py-[12px] text-[14px] font-[Inter-Medium] text-white"
                        onClick={() => {
                            onApply?.({
                                keywords,
                                dynamicFilters,
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

export default function ClassifiedProductsFiltersPanel({
    open,
    onClose,
    onApply,
    currentMode = '',
    listingApiMode = false,
    apiFilters = [],
    hydration = null,
    selectedCategoryId = null,
}) {
    const [category, setCategory] = useState('')
    const [subCategory, setSubCategory] = useState('')
    const [usage, setUsage] = useState([])
    const [condition, setCondition] = useState([])
    const [age, setAge] = useState([])
    const [ageExpanded, setAgeExpanded] = useState(false)
    const [warranty, setWarranty] = useState([])
    const [style, setStyle] = useState([])
    const [styleExpanded, setStyleExpanded] = useState(false)
    const [colorSearch, setColorSearch] = useState('')
    const [finishType, setFinishType] = useState([])
    const [finishTypeExpanded, setFinishTypeExpanded] = useState(false)
    const [materialType, setMaterialType] = useState([])
    const [materialTypeExpanded, setMaterialTypeExpanded] = useState(false)
    const [mountingType, setMountingType] = useState([])
    const [mountingTypeExpanded, setMountingTypeExpanded] = useState(false)
    const [specialFeatures, setSpecialFeatures] = useState([])
    const [specialFeaturesExpanded, setSpecialFeaturesExpanded] = useState(false)
    const [numberOfDoors, setNumberOfDoors] = useState([])
    const [numberOfDoorsExpanded, setNumberOfDoorsExpanded] = useState(false)
    const [doorStyle, setDoorStyle] = useState([])
    const [doorStyleExpanded, setDoorStyleExpanded] = useState(false)
    const [mobileModelSearch, setMobileModelSearch] = useState('')
    const [mobileColorSearch, setMobileColorSearch] = useState('')
    const [categoryOpen, setCategoryOpen] = useState(false)
    const [subCategoryOpen, setSubCategoryOpen] = useState(false)
    const [mobileModelOpen, setMobileModelOpen] = useState(false)
    const [mobileColorOpen, setMobileColorOpen] = useState(false)
    const [mobileFormFactor, setMobileFormFactor] = useState([])
    const [mobileStorage, setMobileStorage] = useState([])
    const [mobileStorageExpanded, setMobileStorageExpanded] = useState(false)
    const [mobileVersion, setMobileVersion] = useState([])
    const [mobileVersionExpanded, setMobileVersionExpanded] = useState(false)
    const [mobileAccompaniments, setMobileAccompaniments] = useState([])
    const [mobileScreenSize, setMobileScreenSize] = useState([])
    const [mobileScreenSizeExpanded, setMobileScreenSizeExpanded] = useState(false)
    const [mobileBatteryHealth, setMobileBatteryHealth] = useState([])
    const [mobileCarrierLock, setMobileCarrierLock] = useState([])
    const [mobileDamagesOnDevice, setMobileDamagesOnDevice] = useState([])
    const [mobileDamageDetails, setMobileDamageDetails] = useState([])
    const [mobileDamageDetailsExpanded, setMobileDamageDetailsExpanded] = useState(false)
    const [mobileRam, setMobileRam] = useState([])
    const [mobileRamExpanded, setMobileRamExpanded] = useState(false)
    const [adsPosted, setAdsPosted] = useState([])
    const [adsPostedExpanded, setAdsPostedExpanded] = useState(false)
    const [nearbyActive, setNearbyActive] = useState(false)
    const [nearbyKm, setNearbyKm] = useState(50)

    const visibleAdsPosted = useMemo(
        () => (adsPostedExpanded ? ADS_POSTED_OPTIONS : ADS_POSTED_OPTIONS.slice(0, 5)),
        [adsPostedExpanded]
    )
    const visibleAge = useMemo(
        () => (ageExpanded ? AGE_OPTIONS : AGE_OPTIONS.slice(0, 5)),
        [ageExpanded]
    )
    const visibleStyle = useMemo(
        () => (styleExpanded ? FURNITURE_STYLE_OPTIONS : FURNITURE_STYLE_OPTIONS.slice(0, 5)),
        [styleExpanded]
    )
    const visibleFinishType = useMemo(
        () => (finishTypeExpanded ? FURNITURE_FINISH_TYPE_OPTIONS : FURNITURE_FINISH_TYPE_OPTIONS.slice(0, 5)),
        [finishTypeExpanded]
    )
    const visibleMaterialType = useMemo(
        () => (materialTypeExpanded ? FURNITURE_MATERIAL_TYPE_OPTIONS : FURNITURE_MATERIAL_TYPE_OPTIONS.slice(0, 5)),
        [materialTypeExpanded]
    )
    const visibleMountingType = useMemo(
        () => (mountingTypeExpanded ? FURNITURE_MOUNTING_TYPE_OPTIONS : FURNITURE_MOUNTING_TYPE_OPTIONS.slice(0, 5)),
        [mountingTypeExpanded]
    )
    const visibleSpecialFeatures = useMemo(
        () => (specialFeaturesExpanded ? FURNITURE_SPECIAL_FEATURE_OPTIONS : FURNITURE_SPECIAL_FEATURE_OPTIONS.slice(0, 5)),
        [specialFeaturesExpanded]
    )
    const visibleNumberOfDoors = useMemo(
        () => (numberOfDoorsExpanded ? FURNITURE_NUMBER_OF_DOORS_OPTIONS : FURNITURE_NUMBER_OF_DOORS_OPTIONS.slice(0, 5)),
        [numberOfDoorsExpanded]
    )
    const visibleDoorStyle = useMemo(
        () => (doorStyleExpanded ? FURNITURE_DOOR_STYLE_OPTIONS : FURNITURE_DOOR_STYLE_OPTIONS.slice(0, 5)),
        [doorStyleExpanded]
    )
    const visibleMobileStorage = useMemo(
        () => (mobileStorageExpanded ? MOBILE_STORAGE_OPTIONS : MOBILE_STORAGE_OPTIONS.slice(0, 5)),
        [mobileStorageExpanded]
    )
    const visibleMobileVersion = useMemo(
        () => (mobileVersionExpanded ? MOBILE_VERSION_OPTIONS : MOBILE_VERSION_OPTIONS.slice(0, 5)),
        [mobileVersionExpanded]
    )
    const visibleMobileScreenSize = useMemo(
        () => (mobileScreenSizeExpanded ? MOBILE_SCREEN_SIZE_OPTIONS : MOBILE_SCREEN_SIZE_OPTIONS.slice(0, 5)),
        [mobileScreenSizeExpanded]
    )
    const visibleMobileDamageDetails = useMemo(
        () => (mobileDamageDetailsExpanded ? MOBILE_DAMAGE_DETAILS_OPTIONS : MOBILE_DAMAGE_DETAILS_OPTIONS.slice(0, 5)),
        [mobileDamageDetailsExpanded]
    )
    const visibleMobileRam = useMemo(
        () => (mobileRamExpanded ? MOBILE_RAM_OPTIONS : MOBILE_RAM_OPTIONS.slice(0, 5)),
        [mobileRamExpanded]
    )

    if (!open) return null

    if (listingApiMode) {
        return (
            <ClassifiedListingApiPanel
                open={open}
                onClose={onClose}
                onApply={onApply}
                apiFilters={apiFilters}
                hydration={hydration}
                selectedCategoryId={selectedCategoryId}
            />
        )
    }

    const toggleMulti = (value, state, setter) => {
        setter(state.includes(value) ? state.filter((x) => x !== value) : [...state, value])
    }

    const handleClear = () => {
        setCategory('')
        setSubCategory('')
        setUsage([])
        setCondition([])
        setAge([])
        setAgeExpanded(false)
        setWarranty([])
        setStyle([])
        setStyleExpanded(false)
        setColorSearch('')
        setFinishType([])
        setFinishTypeExpanded(false)
        setMaterialType([])
        setMaterialTypeExpanded(false)
        setMountingType([])
        setMountingTypeExpanded(false)
        setSpecialFeatures([])
        setSpecialFeaturesExpanded(false)
        setNumberOfDoors([])
        setNumberOfDoorsExpanded(false)
        setDoorStyle([])
        setDoorStyleExpanded(false)
        setMobileModelSearch('')
        setMobileColorSearch('')
        setMobileFormFactor([])
        setMobileStorage([])
        setMobileStorageExpanded(false)
        setMobileVersion([])
        setMobileVersionExpanded(false)
        setMobileAccompaniments([])
        setMobileScreenSize([])
        setMobileScreenSizeExpanded(false)
        setMobileBatteryHealth([])
        setMobileCarrierLock([])
        setMobileDamagesOnDevice([])
        setMobileDamageDetails([])
        setMobileDamageDetailsExpanded(false)
        setMobileRam([])
        setMobileRamExpanded(false)
        setAdsPosted([])
        setAdsPostedExpanded(false)
        setNearbyActive(false)
        setNearbyKm(50)
        setCategoryOpen(false)
        setSubCategoryOpen(false)
        setMobileModelOpen(false)
        setMobileColorOpen(false)
    }

    const nearbyPct = ((nearbyKm - 1) / (50 - 1)) * 100
    const isFurnitureMode = currentMode.includes('furniture')
    const isMobileMode = currentMode.includes('mobile')
    const isCommunityMode = currentMode.includes('community')

    const categoryQuery = category.trim().toLowerCase()
    const filteredCategoryGroups = categoryQuery
        ? CATEGORY_GROUPS.filter(
            (g) =>
                g.label.toLowerCase().includes(categoryQuery) ||
                g.items.some((x) => x.toLowerCase().includes(categoryQuery))
        )
        : CATEGORY_GROUPS

    const selectedCategoryGroup = CATEGORY_GROUPS.find((g) => g.label === category) || null
    const subCategoryQuery = subCategory.trim().toLowerCase()
    const subCategoryItemsBase = selectedCategoryGroup ? selectedCategoryGroup.items : CATEGORY_GROUPS.flatMap((g) => g.items)
    const filteredSubCategoryItems = subCategoryQuery
        ? subCategoryItemsBase.filter((x) => x.toLowerCase().includes(subCategoryQuery))
        : subCategoryItemsBase

    const mobileModelQuery = mobileModelSearch.trim().toLowerCase()
    const filteredMobileModels = mobileModelQuery
        ? MOBILE_MODEL_SUGGESTIONS.filter((x) => x.toLowerCase().includes(mobileModelQuery))
        : MOBILE_MODEL_SUGGESTIONS

    const mobileColorQuery = mobileColorSearch.trim().toLowerCase()
    const filteredMobileColors = mobileColorQuery
        ? MOBILE_COLOR_SUGGESTIONS.filter((x) => x.label.toLowerCase().includes(mobileColorQuery))
        : MOBILE_COLOR_SUGGESTIONS

    if (isCommunityMode) {
        return (
            <div
                className="absolute right-0 top-[calc(100%+8px)] z-[95] flex max-h-[min(85vh,680px)] w-[min(100vw-20px,430px)] flex-col overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
                    <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                        <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Category</h4>
                        <div className="relative">
                            <SearchIcon className="absolute left-[10px] top-1/2 h-[20px] w-[20px] -translate-y-1/2" stroke="#9CA3AF" />
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => {
                                    setCategory(e.target.value)
                                    setCategoryOpen(true)
                                }}
                                onFocus={() => setCategoryOpen(true)}
                                placeholder="Search"
                                className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[12px_10px_12px_40px] text-[14px] text-[#23262A] outline-none placeholder:text-[#A9B1BB]"
                            />
                            {categoryOpen && categoryQuery ? (
                                <div className="absolute left-0 top-[calc(100%+8px)] z-[120] w-full max-h-[280px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
                                    <div className="max-h-[280px] overflow-y-auto [scrollbar-width:thin]">
                                        {filteredCategoryGroups.length > 0 ? (
                                            filteredCategoryGroups.map((group) => (
                                                <div key={group.label} className="py-[6px]">
                                                    <button
                                                        type="button"
                                                        className="block w-full px-[14px] py-[10px] text-left text-[14px] font-[Inter-SemiBold] text-[#23262A] hover:bg-[#F5F5F5]"
                                                        onClick={() => {
                                                            setCategory(group.label)
                                                            setCategoryOpen(false)
                                                        }}
                                                    >
                                                        {group.label}
                                                    </button>
                                                    {group.items
                                                        .filter((x) => x.toLowerCase().includes(categoryQuery))
                                                        .map((item) => (
                                                            <button
                                                                key={item}
                                                                type="button"
                                                                className="block w-full px-[14px] py-[10px] pl-[28px] text-left text-[14px] font-[Inter-Regular] text-[#23262A] hover:bg-[#F5F5F5]"
                                                                onClick={() => {
                                                                    setCategory(item)
                                                                    setCategoryOpen(false)
                                                                }}
                                                            >
                                                                {item}
                                                            </button>
                                                        ))}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="px-[14px] py-[12px] text-[13px] font-[Inter-Regular] text-[#8F8F8F]">
                                                No results
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                        <div className="mb-[12px] flex items-center gap-[6px]">
                            <h4 className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">Nearby Listings</h4>
                            <Image src={info} alt="info" width={18} height={18} />
                        </div>
                        {!nearbyActive ? (
                            <button
                                type="button"
                                className="flex cursor-pointer items-center justify-center gap-[8px] rounded-full border border-[rgba(143,143,143,0.45)] bg-white px-[16px] py-[10px] text-[14px] font-[Inter-Regular] text-[#23262A]"
                                onClick={() => setNearbyActive(true)}
                            >
                                <Image src={target} alt="target" width={18} height={18} />
                                Detect current location
                            </button>
                        ) : (
                            <div className="space-y-[14px]">
                                <div className="inline-flex max-w-full items-center gap-[8px] rounded-full border border-[#B8C9F0] bg-[#EBF2FF] p-[8px_12px]">
                                    <LocationIcon className="h-[18px] w-[18px] shrink-0" stroke="#23262A" />
                                    <p className="truncate text-[14px] font-[Inter-SemiBold] text-[#23262A]">Current location</p>
                                    <button
                                        type="button"
                                        aria-label="Remove location"
                                        className="ml-[4px] flex h-[20px] w-[20px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#3D3D3D] text-white hover:bg-[#2A2A2A]"
                                        onClick={() => {
                                            setNearbyActive(false)
                                            setNearbyKm(50)
                                        }}
                                    >
                                        <span className="text-[14px] font-[Inter-Medium] leading-none">×</span>
                                    </button>
                                </div>

                                <div
                                    className="relative overflow-hidden p-[20px_0px] bg-[rgba(58,136,239,0.04)] rounded-[8px]"
                                    style={{
                                        backgroundImage: `url(${rangebg.src})`,
                                        backgroundSize: 'cover',
                                        backgroundRepeat: 'no-repeat',
                                    }}
                                >
                                    <div className="pointer-events-none absolute left-[18px] right-[18px] top-[10px]">
                                        <div
                                            className="absolute top-0 -translate-x-1/2 transition-[left] duration-75 ease-out"
                                            style={{ left: `calc(11px + (100% - 22px) * ${nearbyPct / 100})` }}
                                        >
                                            <div className="relative rounded-[100px] bg-[#666b72] p-[0px] w-[50px] h-[20px] text-center text-[12px] font-[Inter-SemiBold] text-white shadow-sm">
                                                {nearbyKm} KM
                                                <span
                                                    className="absolute left-1/2 top-full -translate-x-1/2 border-[6px] border-transparent border-t-[#666b72]"
                                                    aria-hidden
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-[10px]">
                                        <div className="relative z-[1] top-[18px]">
                                            <div className="pointer-events-none absolute left-[11px] right-[11px] top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#C5CAD3]" />
                                            <div
                                                className="pointer-events-none absolute left-[11px] top-1/2 h-[6px] max-w-[calc(100%-22px)] -translate-y-1/2 rounded-l-full bg-[#444444]"
                                                style={{ width: `calc((100% - 22px) * ${nearbyPct / 100})` }}
                                            />
                                            <input
                                                type="range"
                                                min={1}
                                                max={50}
                                                value={nearbyKm}
                                                onChange={(e) => setNearbyKm(Number(e.target.value))}
                                                className="relative m-0 h-[28px] w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-[6px] [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-[2] [&::-webkit-slider-thumb]:mt-[-8px] [&::-webkit-slider-thumb]:h-[22px] [&::-webkit-slider-thumb]:w-[22px] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-[#444444] [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-track]:h-[3px] [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:h-[22px] [&::-moz-range-thumb]:w-[22px] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#444444]"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between px-[20px] mt-[12px]">
                                        <p className="text-[12px] font-[Inter-Regular] text-[#000]">1 KM</p>
                                        <p className="text-[12px] font-[Inter-Regular] text-[#000]">50 KM</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-[12px] justify-betweem sm:flex-row sm:items-end sm:justify-between">
                                    <p className="text-[12px] leading-[16px] text-[#8f8f8f]">
                                        If you have moved location, please ensure to update for accurate results
                                    </p>
                                    <button
                                        type="button"
                                        className="flex shrink-0 cursor-pointer items-center gap-[6px] self-start sm:self-auto"
                                        onClick={() => {
                                            if (typeof navigator !== 'undefined' && navigator.geolocation) {
                                                navigator.geolocation.getCurrentPosition(() => { }, () => { })
                                            }
                                        }}
                                    >
                                        <Image src={target} alt="target" width={18} height={18} />
                                        <span className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">Update Location</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
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
                                onApply?.({})
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

    return (
        <div
            className="absolute right-0 top-[calc(100%+8px)] z-[95] flex max-h-[min(85vh,680px)] w-[min(100vw-20px,430px)] flex-col overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]"
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
                <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                    <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Category</h4>
                    <div className="relative">
                        <SearchIcon className="absolute left-[10px] top-1/2 h-[20px] w-[20px] -translate-y-1/2" stroke="#9CA3AF" />
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => {
                                setCategory(e.target.value)
                                setCategoryOpen(true)
                                setSubCategoryOpen(false)
                            }}
                            onFocus={() => setCategoryOpen(true)}
                            className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[12px_10px_12px_40px] text-[14px] text-[#23262A] outline-none placeholder:text-[#A9B1BB]"
                        />
                        {categoryOpen && categoryQuery ? (
                            <div className="absolute left-0 top-[calc(100%+8px)] z-[120] w-full max-h-[280px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
                                <div className="max-h-[280px] overflow-y-auto [scrollbar-width:thin]">
                                    {filteredCategoryGroups.length > 0 ? (
                                        filteredCategoryGroups.map((group) => (
                                            <div key={group.label} className="py-[6px]">
                                                <button
                                                    type="button"
                                                    className="block w-full px-[14px] py-[10px] text-left text-[14px] font-[Inter-SemiBold] text-[#23262A] hover:bg-[#F5F5F5]"
                                                    onClick={() => {
                                                        setCategory(group.label)
                                                        setCategoryOpen(false)
                                                        setSubCategory('')
                                                        setSubCategoryOpen(false)
                                                    }}
                                                >
                                                    {group.label}
                                                </button>
                                                {(group.label.toLowerCase().includes(categoryQuery) ? group.items : group.items.filter((x) => x.toLowerCase().includes(categoryQuery))).map((item) => (
                                                        <button
                                                            key={item}
                                                            type="button"
                                                            className="block w-full px-[14px] py-[10px] pl-[28px] text-left text-[14px] font-[Inter-Regular] text-[#23262A] hover:bg-[#F5F5F5]"
                                                            onClick={() => {
                                                                setCategory(group.label)
                                                                setSubCategory(item)
                                                                setCategoryOpen(false)
                                                                setSubCategoryOpen(false)
                                                            }}
                                                        >
                                                            {item}
                                                        </button>
                                                    ))}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="px-[14px] py-[12px] text-[13px] font-[Inter-Regular] text-[#8F8F8F]">
                                            No results
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                    <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Sub Category</h4>
                    <div className="relative">
                        <SearchIcon className="absolute left-[10px] top-1/2 h-[20px] w-[20px] -translate-y-1/2" stroke="#9CA3AF" />
                        <input
                            type="text"
                            value={subCategory}
                            onChange={(e) => {
                                setSubCategory(e.target.value)
                                setSubCategoryOpen(true)
                            }}
                            onFocus={() => setSubCategoryOpen(true)}
                            placeholder="Search"
                            className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[12px_10px_12px_40px] text-[14px] text-[#23262A] outline-none placeholder:text-[#A9B1BB]"
                        />
                        {subCategoryOpen && subCategoryQuery ? (
                            <div className="absolute left-0 top-[calc(100%+8px)] z-[120] w-full max-h-[280px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
                                <div className="max-h-[280px] overflow-y-auto [scrollbar-width:thin]">
                                    {filteredSubCategoryItems.length > 0 ? (
                                        filteredSubCategoryItems.map((item) => (
                                            <button
                                                key={item}
                                                type="button"
                                                className="block w-full px-[14px] py-[10px] text-left text-[14px] font-[Inter-Regular] text-[#23262A] hover:bg-[#F5F5F5]"
                                                onClick={() => {
                                                    setSubCategory(item)
                                                    setSubCategoryOpen(false)
                                                }}
                                            >
                                                {item}
                                            </button>
                                        ))
                                    ) : (
                                        <p className="px-[14px] py-[12px] text-[13px] font-[Inter-Regular] text-[#8F8F8F]">
                                            No results
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                    <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Usage</h4>
                    <div className="flex flex-wrap gap-[10px]">
                        {USAGE_OPTIONS.map((item) => (
                            <Chip key={item} active={usage.includes(item)} onClick={() => toggleMulti(item, usage, setUsage)}>
                                {item}
                            </Chip>
                        ))}
                    </div>
                </div>

                <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                    <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Condition</h4>
                    <div className="flex flex-wrap gap-[10px]">
                        {CONDITION_OPTIONS.map((item) => (
                            <Chip key={item} active={condition.includes(item)} onClick={() => toggleMulti(item, condition, setCondition)}>
                                {item}
                            </Chip>
                        ))}
                    </div>
                </div>
                {isFurnitureMode ? (
                    <>
                        <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                            <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Style</h4>
                            <div className="flex flex-wrap gap-[10px]">
                                {visibleStyle.map((item) => (
                                    <Chip key={item} active={style.includes(item)} onClick={() => toggleMulti(item, style, setStyle)}>
                                        {item}
                                    </Chip>
                                ))}
                                {FURNITURE_STYLE_OPTIONS.length > 5 ? (
                                    <button
                                        type="button"
                                        onClick={() => setStyleExpanded((v) => !v)}
                                        className="cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] px-[14px] py-[8px] text-[14px] font-[Inter-SemiBold] text-[#3A88EF]"
                                    >
                                        {styleExpanded ? 'View Less' : 'View More'}
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                            <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Finish Type</h4>
                            <div className="flex flex-wrap gap-[10px]">
                                {visibleFinishType.map((item) => (
                                    <Chip key={item} active={finishType.includes(item)} onClick={() => toggleMulti(item, finishType, setFinishType)}>
                                        {item}
                                    </Chip>
                                ))}
                                {FURNITURE_FINISH_TYPE_OPTIONS.length > 5 ? (
                                    <button
                                        type="button"
                                        onClick={() => setFinishTypeExpanded((v) => !v)}
                                        className="cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] px-[14px] py-[8px] text-[14px] font-[Inter-SemiBold] text-[#3A88EF]"
                                    >
                                        {finishTypeExpanded ? 'View Less' : 'View More'}
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                            <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Material Type</h4>
                            <div className="flex flex-wrap gap-[10px]">
                                {visibleMaterialType.map((item) => (
                                    <Chip key={item} active={materialType.includes(item)} onClick={() => toggleMulti(item, materialType, setMaterialType)}>
                                        {item}
                                    </Chip>
                                ))}
                                {FURNITURE_MATERIAL_TYPE_OPTIONS.length > 5 ? (
                                    <button
                                        type="button"
                                        onClick={() => setMaterialTypeExpanded((v) => !v)}
                                        className="cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] px-[14px] py-[8px] text-[14px] font-[Inter-SemiBold] text-[#3A88EF]"
                                    >
                                        {materialTypeExpanded ? 'View Less' : 'View More'}
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                            <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Mounting Type</h4>
                            <div className="flex flex-wrap gap-[10px]">
                                {visibleMountingType.map((item) => (
                                    <Chip key={item} active={mountingType.includes(item)} onClick={() => toggleMulti(item, mountingType, setMountingType)}>
                                        {item}
                                    </Chip>
                                ))}
                                {FURNITURE_MOUNTING_TYPE_OPTIONS.length > 5 ? (
                                    <button
                                        type="button"
                                        onClick={() => setMountingTypeExpanded((v) => !v)}
                                        className="cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] px-[14px] py-[8px] text-[14px] font-[Inter-SemiBold] text-[#3A88EF]"
                                    >
                                        {mountingTypeExpanded ? 'View Less' : 'View More'}
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                            <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Special Features</h4>
                            <div className="flex flex-wrap gap-[10px]">
                                {visibleSpecialFeatures.map((item) => (
                                    <Chip
                                        key={item}
                                        active={specialFeatures.includes(item)}
                                        onClick={() => toggleMulti(item, specialFeatures, setSpecialFeatures)}
                                    >
                                        {item}
                                    </Chip>
                                ))}
                                {FURNITURE_SPECIAL_FEATURE_OPTIONS.length > 5 ? (
                                    <button
                                        type="button"
                                        onClick={() => setSpecialFeaturesExpanded((v) => !v)}
                                        className="cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] px-[14px] py-[8px] text-[14px] font-[Inter-SemiBold] text-[#3A88EF]"
                                    >
                                        {specialFeaturesExpanded ? 'View Less' : 'View More'}
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                            <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Number Of Doors</h4>
                            <div className="flex flex-wrap gap-[10px]">
                                {visibleNumberOfDoors.map((item) => (
                                    <Chip
                                        key={item}
                                        active={numberOfDoors.includes(item)}
                                        onClick={() => toggleMulti(item, numberOfDoors, setNumberOfDoors)}
                                    >
                                        {item}
                                    </Chip>
                                ))}
                                {FURNITURE_NUMBER_OF_DOORS_OPTIONS.length > 5 ? (
                                    <button
                                        type="button"
                                        onClick={() => setNumberOfDoorsExpanded((v) => !v)}
                                        className="cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] px-[14px] py-[8px] text-[14px] font-[Inter-SemiBold] text-[#3A88EF]"
                                    >
                                        {numberOfDoorsExpanded ? 'View Less' : 'View More'}
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                            <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Door Style</h4>
                            <div className="flex flex-wrap gap-[10px]">
                                {visibleDoorStyle.map((item) => (
                                    <Chip key={item} active={doorStyle.includes(item)} onClick={() => toggleMulti(item, doorStyle, setDoorStyle)}>
                                        {item}
                                    </Chip>
                                ))}
                                {FURNITURE_DOOR_STYLE_OPTIONS.length > 5 ? (
                                    <button
                                        type="button"
                                        onClick={() => setDoorStyleExpanded((v) => !v)}
                                        className="cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] px-[14px] py-[8px] text-[14px] font-[Inter-SemiBold] text-[#3A88EF]"
                                    >
                                        {doorStyleExpanded ? 'View Less' : 'View More'}
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </>
                ) : null}
                {isMobileMode ? (
                    <>
                        <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                            <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Model</h4>
                            <div className="relative">
                                <SearchIcon className="absolute left-[10px] top-1/2 h-[20px] w-[20px] -translate-y-1/2" stroke="#9CA3AF" />
                                <input
                                    type="text"
                                    value={mobileModelSearch}
                                    onChange={(e) => {
                                        setMobileModelSearch(e.target.value)
                                        setMobileModelOpen(true)
                                    }}
                                    onFocus={() => setMobileModelOpen(true)}
                                    placeholder="Search"
                                    className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[12px_10px_12px_40px] text-[14px] text-[#23262A] outline-none placeholder:text-[#A9B1BB]"
                                />
                                {mobileModelOpen && mobileModelQuery ? (
                                    <div className="absolute left-0 top-[calc(100%+8px)] z-[140] w-full max-h-[280px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
                                        <div className="max-h-[280px] overflow-y-auto [scrollbar-width:thin]">
                                            {filteredMobileModels.length > 0 ? (
                                                filteredMobileModels.map((m) => (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        className="flex w-full items-center gap-[10px] px-[14px] py-[10px] text-left text-[14px] font-[Inter-Regular] text-[#23262A] hover:bg-[#F5F5F5]"
                                                        onClick={() => {
                                                            setMobileModelSearch(m)
                                                            setMobileModelOpen(false)
                                                        }}
                                                    >
                                                        <SearchIcon className="h-[16px] w-[16px] shrink-0" stroke="#8F8F8F" />
                                                        {m}
                                                    </button>
                                                ))
                                            ) : (
                                                <p className="px-[14px] py-[12px] text-[13px] font-[Inter-Regular] text-[#8F8F8F]">
                                                    No results
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                            <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Color</h4>
                            <div className="relative">
                                <SearchIcon className="absolute left-[10px] top-1/2 h-[20px] w-[20px] -translate-y-1/2" stroke="#9CA3AF" />
                                <input
                                    type="text"
                                    value={mobileColorSearch}
                                    onChange={(e) => {
                                        setMobileColorSearch(e.target.value)
                                        setMobileColorOpen(true)
                                    }}
                                    onFocus={() => setMobileColorOpen(true)}
                                    placeholder="Search"
                                    className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[12px_10px_12px_40px] text-[14px] text-[#23262A] outline-none placeholder:text-[#A9B1BB]"
                                />
                                {mobileColorOpen && mobileColorQuery ? (
                                    <div className="absolute left-0 top-[calc(100%+8px)] z-[140] w-full max-h-[280px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
                                        <div className="max-h-[280px] overflow-y-auto [scrollbar-width:thin]">
                                            {filteredMobileColors.length > 0 ? (
                                                filteredMobileColors.map((c) => (
                                                    <button
                                                        key={c.label}
                                                        type="button"
                                                        className="flex w-full items-center gap-[10px] px-[14px] py-[10px] text-left text-[14px] font-[Inter-Regular] text-[#23262A] hover:bg-[#F5F5F5]"
                                                        onClick={() => {
                                                            setMobileColorSearch(c.label)
                                                            setMobileColorOpen(false)
                                                        }}
                                                    >
                                                        <span
                                                            className="h-[12px] w-[12px] rounded-full"
                                                            style={{ backgroundColor: c.color }}
                                                        />
                                                        {c.label}
                                                    </button>
                                                ))
                                            ) : (
                                                <p className="px-[14px] py-[12px] text-[13px] font-[Inter-Regular] text-[#8F8F8F]">
                                                    No results
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                            <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Form Factor</h4>
                            <div className="flex flex-wrap gap-[10px]">
                                {MOBILE_FORM_FACTOR_OPTIONS.map((item) => (
                                    <Chip
                                        key={item}
                                        active={mobileFormFactor.includes(item)}
                                        onClick={() => toggleMulti(item, mobileFormFactor, setMobileFormFactor)}
                                    >
                                        {item}
                                    </Chip>
                                ))}
                            </div>
                        </div>

                        <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                            <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Storage Capacity</h4>
                            <div className="flex flex-wrap gap-[10px]">
                                {visibleMobileStorage.map((item) => (
                                    <Chip key={item} active={mobileStorage.includes(item)} onClick={() => toggleMulti(item, mobileStorage, setMobileStorage)}>
                                        {item}
                                    </Chip>
                                ))}
                                {MOBILE_STORAGE_OPTIONS.length > 5 ? (
                                    <button
                                        type="button"
                                        onClick={() => setMobileStorageExpanded((v) => !v)}
                                        className="cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] px-[14px] py-[8px] text-[14px] font-[Inter-SemiBold] text-[#3A88EF]"
                                    >
                                        {mobileStorageExpanded ? 'View Less' : 'View More'}
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                            <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Version</h4>
                            <div className="flex flex-wrap gap-[10px]">
                                {visibleMobileVersion.map((item) => (
                                    <Chip key={item} active={mobileVersion.includes(item)} onClick={() => toggleMulti(item, mobileVersion, setMobileVersion)}>
                                        {item}
                                    </Chip>
                                ))}
                                {MOBILE_VERSION_OPTIONS.length > 5 ? (
                                    <button
                                        type="button"
                                        onClick={() => setMobileVersionExpanded((v) => !v)}
                                        className="cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] px-[14px] py-[8px] text-[14px] font-[Inter-SemiBold] text-[#3A88EF]"
                                    >
                                        {mobileVersionExpanded ? 'View Less' : 'View More'}
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                            <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Accompaniments</h4>
                            <div className="flex flex-wrap gap-[10px]">
                                {MOBILE_ACCOMPANIMENTS_OPTIONS.map((item) => (
                                    <Chip
                                        key={item}
                                        active={mobileAccompaniments.includes(item)}
                                        onClick={() => toggleMulti(item, mobileAccompaniments, setMobileAccompaniments)}
                                    >
                                        {item}
                                    </Chip>
                                ))}
                            </div>
                        </div>

                        <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                            <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Screen Size</h4>
                            <div className="flex flex-wrap gap-[10px]">
                                {visibleMobileScreenSize.map((item) => (
                                    <Chip key={item} active={mobileScreenSize.includes(item)} onClick={() => toggleMulti(item, mobileScreenSize, setMobileScreenSize)}>
                                        {item}
                                    </Chip>
                                ))}
                                {MOBILE_SCREEN_SIZE_OPTIONS.length > 5 ? (
                                    <button
                                        type="button"
                                        onClick={() => setMobileScreenSizeExpanded((v) => !v)}
                                        className="cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] px-[14px] py-[8px] text-[14px] font-[Inter-SemiBold] text-[#3A88EF]"
                                    >
                                        {mobileScreenSizeExpanded ? 'View Less' : 'View More'}
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                            <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Percentage Of Battery Health</h4>
                            <div className="flex flex-wrap gap-[10px]">
                                {MOBILE_BATTERY_HEALTH_OPTIONS.map((item) => (
                                    <Chip
                                        key={item}
                                        active={mobileBatteryHealth.includes(item)}
                                        onClick={() => toggleMulti(item, mobileBatteryHealth, setMobileBatteryHealth)}
                                    >
                                        {item}
                                    </Chip>
                                ))}
                            </div>
                        </div>

                        <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                            <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Carrier Lock</h4>
                            <div className="flex flex-wrap gap-[10px]">
                                {MOBILE_YES_NO_OPTIONS.map((item) => (
                                    <Chip key={item} active={mobileCarrierLock.includes(item)} onClick={() => toggleMulti(item, mobileCarrierLock, setMobileCarrierLock)}>
                                        {item}
                                    </Chip>
                                ))}
                            </div>
                        </div>

                        <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                            <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Damages On Device</h4>
                            <div className="flex flex-wrap gap-[10px]">
                                {MOBILE_YES_NO_OPTIONS.map((item) => (
                                    <Chip
                                        key={item}
                                        active={mobileDamagesOnDevice.includes(item)}
                                        onClick={() => toggleMulti(item, mobileDamagesOnDevice, setMobileDamagesOnDevice)}
                                    >
                                        {item}
                                    </Chip>
                                ))}
                            </div>
                        </div>

                        <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                            <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Damage Details</h4>
                            <div className="flex flex-wrap gap-[10px]">
                                {visibleMobileDamageDetails.map((item) => (
                                    <Chip
                                        key={item}
                                        active={mobileDamageDetails.includes(item)}
                                        onClick={() => toggleMulti(item, mobileDamageDetails, setMobileDamageDetails)}
                                    >
                                        {item}
                                    </Chip>
                                ))}
                                {MOBILE_DAMAGE_DETAILS_OPTIONS.length > 5 ? (
                                    <button
                                        type="button"
                                        onClick={() => setMobileDamageDetailsExpanded((v) => !v)}
                                        className="cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] px-[14px] py-[8px] text-[14px] font-[Inter-SemiBold] text-[#3A88EF]"
                                    >
                                        {mobileDamageDetailsExpanded ? 'View Less' : 'View More'}
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                            <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Memory (RAM)</h4>
                            <div className="flex flex-wrap gap-[10px]">
                                {visibleMobileRam.map((item) => (
                                    <Chip key={item} active={mobileRam.includes(item)} onClick={() => toggleMulti(item, mobileRam, setMobileRam)}>
                                        {item}
                                    </Chip>
                                ))}
                                {MOBILE_RAM_OPTIONS.length > 5 ? (
                                    <button
                                        type="button"
                                        onClick={() => setMobileRamExpanded((v) => !v)}
                                        className="cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] px-[14px] py-[8px] text-[14px] font-[Inter-SemiBold] text-[#3A88EF]"
                                    >
                                        {mobileRamExpanded ? 'View Less' : 'View More'}
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </>
                ) : null}

                <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                    <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Age</h4>
                    <div className="flex flex-wrap gap-[10px]">
                        {visibleAge.map((item) => (
                            <Chip key={item} active={age.includes(item)} onClick={() => toggleMulti(item, age, setAge)}>
                                {item}
                            </Chip>
                        ))}
                        {AGE_OPTIONS.length > 5 ? (
                            <button
                                type="button"
                                onClick={() => setAgeExpanded((v) => !v)}
                                className="cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] px-[14px] py-[8px] text-[14px] font-[Inter-SemiBold] text-[#3A88EF]"
                            >
                                {ageExpanded ? 'View Less' : 'View More'}
                            </button>
                        ) : null}
                    </div>
                </div>

                <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                    <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Warranty</h4>
                    <div className="flex flex-wrap gap-[10px]">
                        {WARRANTY_OPTIONS.map((item) => (
                            <Chip
                                key={item}
                                active={warranty.includes(item)}
                                onClick={() => toggleMulti(item, warranty, setWarranty)}
                            >
                                {item}
                            </Chip>
                        ))}
                    </div>
                </div>

                <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                    <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Ads Posted</h4>
                    <div className="flex flex-wrap gap-[10px]">
                        {visibleAdsPosted.map((item) => (
                            <Chip key={item} active={adsPosted.includes(item)} onClick={() => toggleMulti(item, adsPosted, setAdsPosted)}>
                                {item}
                            </Chip>
                        ))}
                        {ADS_POSTED_OPTIONS.length > 5 ? (
                            <button
                                type="button"
                                onClick={() => setAdsPostedExpanded((v) => !v)}
                                className="cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] px-[14px] py-[8px] text-[14px] font-[Inter-SemiBold] text-[#3A88EF]"
                            >
                                {adsPostedExpanded ? 'View Less' : 'View More'}
                            </button>
                        ) : null}
                    </div>
                </div>

                <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                    <div className="mb-[12px] flex items-center gap-[6px]">
                        <h4 className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">Nearby Listings</h4>
                        <Image src={info} alt="info" width={18} height={18} />
                    </div>
                    {!nearbyActive ? (
                        <button
                            type="button"
                            className="flex cursor-pointer items-center justify-center gap-[8px] rounded-full border border-[rgba(143,143,143,0.45)] bg-white px-[16px] py-[10px] text-[14px] font-[Inter-Regular] text-[#23262A]"
                            onClick={() => setNearbyActive(true)}
                        >
                            <Image src={target} alt="target" width={18} height={18} />
                            Detect current location
                        </button>
                    ) : (
                        <div className="space-y-[14px]">
                            <div className="inline-flex max-w-full items-center gap-[8px] rounded-full border border-[#B8C9F0] bg-[#EBF2FF] p-[8px_12px]">
                                <LocationIcon className="h-[18px] w-[18px] shrink-0" stroke="#23262A" />
                                <p className="truncate text-[14px] font-[Inter-SemiBold] text-[#23262A]">Current location</p>
                                <button
                                    type="button"
                                    aria-label="Remove location"
                                    className="ml-[4px] flex h-[20px] w-[20px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#3D3D3D] text-white hover:bg-[#2A2A2A]"
                                    onClick={() => {
                                        setNearbyActive(false)
                                        setNearbyKm(50)
                                    }}
                                >
                                    <CloseIcon className="w-[10px] h-[10px]" fill="#fff" />
                                </button>
                            </div>

                            <div
                                className="relative overflow-hidden p-[20px_0px] bg-[rgba(58,136,239,0.04)] rounded-[8px]"
                                style={{
                                    backgroundImage: `url(${rangebg.src})`,
                                    backgroundSize: 'cover',
                                    backgroundRepeat: 'no-repeat',
                                }}
                            >
                                <div className="pointer-events-none absolute left-[18px] right-[18px] top-[10px]">
                                    <div
                                        className="absolute top-0 -translate-x-1/2 transition-[left] duration-75 ease-out"
                                        style={{ left: `calc(11px + (100% - 22px) * ${nearbyPct / 100})` }}
                                    >
                                        <div className="relative rounded-[100px] bg-[#666b72] p-[0px] w-[50px] h-[20px] text-center text-[12px] font-[Inter-SemiBold] text-white shadow-sm">
                                            {nearbyKm} KM
                                            <span
                                                className="absolute left-1/2 top-full -translate-x-1/2 border-[6px] border-transparent border-t-[#666b72]"
                                                aria-hidden
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="px-[10px]">
                                    <div className="relative z-[1] top-[18px]">
                                        <div
                                            className="pointer-events-none absolute left-[11px] right-[11px] top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#C5CAD3]"
                                            aria-hidden
                                        />
                                        <div
                                            className="pointer-events-none absolute left-[11px] top-1/2 h-[6px] max-w-[calc(100%-22px)] -translate-y-1/2 rounded-l-full bg-[#444444]"
                                            style={{ width: `calc((100% - 22px) * ${nearbyPct / 100})` }}
                                            aria-hidden
                                        />
                                        <input
                                            type="range"
                                            min={1}
                                            max={50}
                                            value={nearbyKm}
                                            onChange={(e) => setNearbyKm(Number(e.target.value))}
                                            className="relative m-0 h-[28px] w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-[6px] [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-[2] [&::-webkit-slider-thumb]:mt-[-8px] [&::-webkit-slider-thumb]:h-[22px] [&::-webkit-slider-thumb]:w-[22px] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-[#444444] [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-track]:h-[3px] [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:h-[22px] [&::-moz-range-thumb]:w-[22px] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#444444]"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between px-[20px] mt-[12px]">
                                    <p className="text-[12px] font-[Inter-Regular] text-[#000]">1 KM</p>
                                    <p className="text-[12px] font-[Inter-Regular] text-[#000]">50 KM</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-[12px] justify-betweem sm:flex-row sm:items-end sm:justify-between">
                                <p className="text-[12px] leading-[16px] text-[#8f8f8f]">
                                    If you have moved location, please ensure to update for accurate results
                                </p>
                                <button
                                    type="button"
                                    className="flex shrink-0 cursor-pointer items-center gap-[6px] self-start sm:self-auto"
                                    onClick={() => {
                                        if (typeof navigator !== 'undefined' && navigator.geolocation) {
                                            navigator.geolocation.getCurrentPosition(() => { }, () => { })
                                        }
                                    }}
                                >
                                    <Image src={target} alt="target" width={18} height={18} />
                                    <span className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">Update Location</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
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
                            onApply?.({})
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
