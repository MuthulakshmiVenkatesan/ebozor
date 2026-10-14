'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DownArrowIcon, LocationIcon, SearchIcon, RightArrowIcon } from '@/components/CustomFile/icons'
import { useDispatch, useSelector } from 'react-redux'
import MotorsProductsFiltersPanel from './MotorsProductsFiltersPanel'
import PropertyProductsFiltersPanel from './PropertyProductsFiltersPanel'
import JobsProductsFiltersPanel from './JobsProductsFiltersPanel'
import ClassifiedProductsFiltersPanel from './ClassifiedProductsFiltersPanel'
import { categoryApi, getCitiesApi } from '@/utils/api'
import { setCityData } from '@/redux/reuducer/locationSlice'
import { loadGoogleMaps } from '@/utils'
import {
    buildGooglePlacesComponentRestrictions,
    buildNeighborhoodAutocompleteInput,
    buildPlacesAutocompleteInput,
    isAllCitiesLabel,
    mapNeighborhoodPlacePrediction,
    predictionMatchesLocationScope,
    resolvePlacesCountryLabel,
} from '@/utils/placesCountry'

import {
    appendGetItemFiltersToSearchParams,
    isDynamicButtonOptionSelected,
    mergeProductsPanelStaticFilters,
    parseClassifiedProductsPanelFromSearchParams,
    parsePropertyBedsChipLabelFromSearchParams,
    parsePropertyProductsPanelFromSearchParams,
    PROPERTY_BEDROOMS_FILTER_URL_KEY,
    serializeGetItemFilterValue,
    serializePropertyBedroomsChipToFilterValue,
} from '@/utils/getItemFilterParams'

const UAE_CITIES_BASE = [{ id: 'all', label: 'All Cities(UAE)' }]
const SPECS_OPTIONS_ALL = ['GCC', 'American', 'Canadian', 'European', 'Japanese', 'Korean', 'Chinese', 'Other']
const SPECS_COLLAPSED_VISIBLE = 5
const YEAR_DEFAULT_FROM = '1920'
const YEAR_DEFAULT_UP_TO = '2027'
const PROPERTY_TYPE_MENU = {
    Residential: ['All in Residential', 'Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Residential Building'],
    Commercial: ['All in Commercial', 'Office', 'Industrial', 'Retail', 'Staff Accomm', 'Shop'],
    'Rooms For Rent': ['All Rooms', 'Partition', 'Shared Room', 'Private Room', 'Master Room'],
    'Monthly Short Term': ['Monthly Apartment', 'Monthly Villa', 'Monthly Hotel Apartment', 'Monthly Studio'],
    'Daily Short Term': ['Daily Apartment', 'Daily Villa', 'Daily Hotel Apartment', 'Daily Studio'],
}
const PURPOSE_API_SLUG = {
    Rent: 'property-for-rent',
    Buy: 'property-for-sale',
}
const PURPOSE_ITEM_LABEL = {
    Rent: 'property-for-rent',
    Buy: 'property-for-sale',
}

/** Header / products URL: `segment=new_projects` + `slug` (parent) + `category_slug` (leaf). */
function isNewProjectsPropertyListingFromParams(searchParams) {
    const seg = String(searchParams?.get('segment') || '')
        .toLowerCase()
        .trim()
    if (seg === 'new_projects') return true
    const item = String(searchParams?.get('item') || '').toLowerCase()
    return item.includes('new project')
}

/**
 * Slug sent to get-category-tree-by-slug and get-category-filters for property listings.
 * New projects: use URL `slug` (parent) only — not `category_slug` (leaf).
 */
function resolvePropertyFiltersApiSlug(searchParams, propertyPurpose) {
    if (isNewProjectsPropertyListingFromParams(searchParams)) {
        const parent = searchParams.get('slug')?.trim() || ''
        return parent || PURPOSE_API_SLUG[propertyPurpose]
    }
    const sub = searchParams.get('category_slug')?.trim() || ''
    const legacy = searchParams.get('slug')?.trim() || ''
    return sub || legacy || PURPOSE_API_SLUG[propertyPurpose]
}

/** Main-bar filter lift: only when `segment=new_projects` (strict). */
function isNewProjectsSegmentStrict(searchParams) {
    return String(searchParams?.get('segment') || '').toLowerCase().trim() === 'new_projects'
}

function npFilterKey(def) {
    if (!def) return ''
    return `cf_${def.category_id}_${def.sort_order}`
}

function normalizeNpApiFilterName(name) {
    return String(name || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
}

function matchNewProjectsMainBarBedroomsFilter(def) {
    const n = normalizeNpApiFilterName(def?.name)
    return n === 'beds' || n === 'bedrooms'
}

function matchNewProjectsProjectCompletionFilter(def) {
    const n = normalizeNpApiFilterName(def?.name)
    return n.includes('project completion')
}

function matchNewProjectsPreHandoverPaymentFilter(def) {
    const n = normalizeNpApiFilterName(def?.name)
    return n.includes('pre-handover payment') || n.includes('pre handover payment')
}

function isNewProjectsMainBarApiFilter(def) {
    return (
        matchNewProjectsMainBarBedroomsFilter(def) ||
        matchNewProjectsProjectCompletionFilter(def) ||
        matchNewProjectsPreHandoverPaymentFilter(def)
    )
}

function summaryLabelForNewProjectsMainBarFilter(def, searchParams, propertyApiFilters) {
    if (!def) return 'Any'
    const k = npFilterKey(def)
    const hy = parsePropertyProductsPanelFromSearchParams(searchParams, propertyApiFilters)
    const v = hy.dynamicFilters?.[k]
    if (def.type === 'min-max') {
        const mm = v && typeof v === 'object' && !Array.isArray(v) ? v : { min: '', max: '' }
        const min = String(mm.min ?? '').trim()
        const max = String(mm.max ?? '').trim()
        if (!min && !max) return 'Any'
        return `${min || '0'} - ${max || 'Any'}`
    }
    if (def.multiselect) {
        const arr = Array.isArray(v) ? v : v != null && v !== '' ? [v] : []
        if (!arr.length) return 'Any'
        const joined = arr.map(String).join(', ')
        return joined.length > 28 ? `${joined.slice(0, 28)}…` : joined
    }
    if (v == null || v === '') return 'Any'
    return String(v)
}

function previewNewProjectsMainBarDraft(def, draftVal) {
    if (!def) return 'Any'
    if (def.type === 'min-max') {
        const mm =
            draftVal && typeof draftVal === 'object' && !Array.isArray(draftVal) ? draftVal : { min: '', max: '' }
        const min = String(mm.min ?? '').trim()
        const max = String(mm.max ?? '').trim()
        if (!min && !max) return 'Any'
        return `${min || '0'} - ${max || 'Any'}`
    }
    if (def.multiselect) {
        const arr = Array.isArray(draftVal) ? draftVal : draftVal != null && draftVal !== '' ? [draftVal] : []
        if (!arr.length) return 'Any'
        const joined = arr.map(String).join(', ')
        return joined.length > 28 ? `${joined.slice(0, 28)}…` : joined
    }
    if (draftVal == null || draftVal === '') return 'Any'
    return String(draftVal)
}

function toCategorySlug(v = '') {
    return String(v)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

function categoryTreeDisplayName(node) {
    return String(node?.translated_name || node?.name || '').trim()
}

/** Resolve leaf category id from property type tree (get-category-tree-by-slug) → main filter labels. */
function findPropertyGroupAndTypeByCategoryId(children, categoryId) {
    if (!categoryId || !Array.isArray(children)) return null
    const idStr = String(categoryId).trim()
    for (const group of children) {
        const groupName = categoryTreeDisplayName(group)
        const nested = Array.isArray(group?.children) ? group.children : []
        for (const leaf of nested) {
            const lid = String(leaf?.category_id ?? leaf?.id ?? '').trim()
            if (lid === idStr) {
                const typeName = categoryTreeDisplayName(leaf)
                if (typeName && groupName) return { groupName, typeName }
            }
        }
    }
    return null
}

function findGroupNameForPropertyTypeLabel(children, typeName) {
    if (!typeName || !Array.isArray(children)) return null
    const t = String(typeName).trim()
    for (const group of children) {
        const nested = Array.isArray(group?.children) ? group.children : []
        for (const leaf of nested) {
            if (categoryTreeDisplayName(leaf) === t) {
                return categoryTreeDisplayName(group) || null
            }
        }
    }
    return null
}

/**
 * get-category-tree-by-slug body: { data: [ { children: [ groups… ] } ] }
 * Legacy get-category-filters-shaped: { data: { categories: [ { children } ] } }
 */
function parsePropertyTypeTreeChildren(res) {
    const body = res?.data
    if (!body) return []
    const d = body.data
    if (Array.isArray(d) && d[0]?.children?.length) return d[0].children
    if (d && typeof d === 'object' && !Array.isArray(d)) {
        const cat = d.categories?.[0]
        if (Array.isArray(cat?.children) && cat.children.length) return cat.children
        if (Array.isArray(d.children) && d.children.length) return d.children
    }
    return []
}

function buildTypeMenuFromChildren(children = []) {
    const out = {}
    const asItem = (label, slug) => ({
        label,
        slug: String(slug || '').trim() || toCategorySlug(label),
    })
    children.forEach((child) => {
        const groupLabel = categoryTreeDisplayName(child)
        if (!groupLabel) return
        const nested = Array.isArray(child?.children) ? child.children : []
        if (nested.length) {
            out[groupLabel] = nested
                .map((node) => asItem(categoryTreeDisplayName(node), node?.slug))
                .filter((x) => x.label)
            return
        }
        const n = groupLabel.toLowerCase()
        if (n.includes('residential')) {
            out[groupLabel] = [
                'All in Residential',
                'Apartment',
                'Villa',
                'Townhouse',
                'Penthouse',
                'Residential Building',
            ].map((label) => asItem(label))
            return
        }
        if (n.includes('commercial')) {
            out[groupLabel] = ['All in Commercial', 'Office', 'Industrial', 'Retail', 'Staff Accomm', 'Shop'].map((label) =>
                asItem(label)
            )
            return
        }
        if (n.includes('room')) {
            out[groupLabel] = ['All Rooms', 'Partition', 'Shared Room', 'Private Room', 'Master Room'].map((label) =>
                asItem(label)
            )
            return
        }
        out[groupLabel] = [asItem(`All in ${groupLabel}`)]
    })
    return out
}

const PROPERTY_TYPE_MENU_ITEMS = Object.fromEntries(
    Object.entries(PROPERTY_TYPE_MENU).map(([g, items]) => [
        g,
        items.map((label) => ({ label, slug: toCategorySlug(label) })),
    ])
)

function findPropertyTypeSlugInMenu(menu, label) {
    if (!label || !menu) return toCategorySlug(label)
    const t = String(label).trim()
    for (const items of Object.values(menu)) {
        const hit = items.find((i) => i.label === t)
        if (hit?.slug) return hit.slug
    }
    return toCategorySlug(label)
}
const PROPERTY_BED_OPTIONS = ['Studio', '1', '2', '3', '4', '5', '6', '7', '8+']

/** Listing verticals: same filter bar UI; get-category-filters slug matches `mode`. */
const VERTICAL_LISTING_BAR_MODES = ['classified', 'furniture', 'mobile', 'community']
function isVerticalListingBarMode(m) {
    return VERTICAL_LISTING_BAR_MODES.includes(m)
}

/** Query keys kept when applying the property side panel (besides panel output). */
const PROPERTY_LISTING_PRESERVE_KEYS = ['minPrice', 'maxPrice', 'city', 'area']

function preservePropertyListingParams(from, to) {
    if (!from || !to) return
    PROPERTY_LISTING_PRESERVE_KEYS.forEach((k) => {
        const v = from.get(k)
        if (v != null && String(v).trim() !== '') to.set(k, v)
    })
    const br = from.get(PROPERTY_BEDROOMS_FILTER_URL_KEY)
    if (br != null && String(br).trim() !== '') to.set(PROPERTY_BEDROOMS_FILTER_URL_KEY, br)
    else to.delete(PROPERTY_BEDROOMS_FILTER_URL_KEY)
}

function syncPropertyPriceInSearchParams(qs, fromDraftTrimmed, upToDraftTrimmed) {
    qs.delete('minPrice')
    qs.delete('maxPrice')
    if (fromDraftTrimmed) qs.set('minPrice', fromDraftTrimmed)
    if (upToDraftTrimmed) qs.set('maxPrice', upToDraftTrimmed)
}

function syncPropertyBedsInSearchParams(qs, bedsLabel) {
    qs.delete('minBeds')
    qs.delete('maxBeds')
    qs.delete(PROPERTY_BEDROOMS_FILTER_URL_KEY)
    const val = serializePropertyBedroomsChipToFilterValue(bedsLabel)
    if (val != null) qs.set(PROPERTY_BEDROOMS_FILTER_URL_KEY, val)
}

function countAppliedGetItemFilters(
    searchParams,
    {
        includeKeyword = false,
        includeMediaFlags = false,
        extraKeys = [],
        excludeFilterNames = [],
        excludeFilterKeys = [],
    } = {}
) {
    if (!searchParams || typeof searchParams.forEach !== 'function') return 0
    const excludedNames = new Set((Array.isArray(excludeFilterNames) ? excludeFilterNames : []).map((x) => String(x || '').trim().toLowerCase()).filter(Boolean))
    const excludedKeys = new Set((Array.isArray(excludeFilterKeys) ? excludeFilterKeys : []).map((x) => String(x || '').trim()).filter(Boolean))
    let n = 0
    searchParams.forEach((v, k) => {
        if (!k.startsWith('filters[')) return
        if (excludedKeys.has(k)) return
        const name = k.match(/^filters\[(.*)\]$/)?.[1] || ''
        if (excludedNames.has(String(name).trim().toLowerCase())) return
        if (String(v).trim() !== '') n += 1
    })
    if (includeKeyword) {
        const kw = String(searchParams.get('search') || searchParams.get('keyword') || '').trim()
        if (kw) n += 1
    }
    if (includeMediaFlags) {
        if (searchParams.get('hasVideo') === '1') n += 1
        if (searchParams.get('has360') === '1') n += 1
    }
    ;(Array.isArray(extraKeys) ? extraKeys : []).forEach((k) => {
        const v = searchParams.get(k)
        if (v != null && String(v).trim() !== '') n += 1
    })
    return n
}

function filtersSelectedSummaryLabel(count, fallback) {
    if (count <= 0) return fallback
    return count === 1 ? '1 filter selected' : `${count} filters selected`
}

function normalizeForUrlFilterMatch(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
}

function toUrlFilterValue(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]+/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
}

function toPlaceTypeLabel(type) {
    if (!type) return 'Place'
    return String(type)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (s) => s.toUpperCase())
}
const JOBS_SALARY_OPTIONS = [
    'Negotiable',
    'Less than 2,000',
    '2,000 - 3,999',
    '4,000 - 5,999',
    '6,000 - 7,999',
    '8,000 - 11,999',
    '12,000 - 19,999',
]
const JOBS_EXPERIENCE_OPTIONS = [
    '0-1 Years',
    '1-2 Years',
    '2-5 Years',
    '5-10 Years',
    '10-15 Years',
    '15+ Years',
]
const JOBS_KEYWORD_SUGGESTIONS = [
    'driver',
    'sales',
    'accountant',
    'driver light vehicle',
    'jobs',
    'customer service',
    'light vehicle driver',
]
const CLASSIFIED_KEYWORD_SUGGESTIONS = [
    'driver',
    'sales',
    'accountant',
    'driver light vehicle',
    'jobs',
    'customer service',
    'light vehicle driver',
]
function mapPlacePrediction(item) {
    return {
        id: item.place_id || item.description,
        name: item.structured_formatting?.main_text || item.description || '',
        subtitle: item.structured_formatting?.secondary_text || '',
        description: item.description || '',
        type: toPlaceTypeLabel(item.types?.[0]),
    }
}

export default function MainFilterPage({ mode = 'motors', sourceMode = '' }) {
    const router = useRouter()
    const pathname = usePathname() || '/products'
    const searchParams = useSearchParams()
    const { isLoaded: isGoogleMapsLoaded } = loadGoogleMaps()
    const searchParamsKey = searchParams?.toString?.() ?? ''
    const isRecruiterContext =
        mode === 'recruiter' ||
        String(sourceMode || '')
            .toLowerCase()
            .includes('recruiter') ||
        String(searchParams?.get('recruiter') || '').trim() === '1'
    const dispatch = useDispatch()
    const cityData = useSelector((state) => state?.Location?.cityData)
    const wrapRef = useRef(null)
    const [openKey, setOpenKey] = useState(null)
    const [city, setCity] = useState('All Cities(UAE)')
    const [cityDraft, setCityDraft] = useState('All Cities(UAE)')
    const [makeModel, setMakeModel] = useState('')
    const [makeModelOpen, setMakeModelOpen] = useState(false)
    const [makeModelSuggestions, setMakeModelSuggestions] = useState([])
    const [makeModelSuggestionsLoading, setMakeModelSuggestionsLoading] = useState(false)
    const makeModelFetchIdRef = useRef(0)
    /** Trimmed query string for which `makeModelSuggestions` was last loaded (motors make/model API). */
    const makeModelLastLoadedQueryRef = useRef(null)
    const makeModelTrimRef = useRef('')
    const [priceFromApplied, setPriceFromApplied] = useState('')
    const [priceUpToApplied, setPriceUpToApplied] = useState('')
    const [priceFromDraft, setPriceFromDraft] = useState('')
    const [priceUpToDraft, setPriceUpToDraft] = useState('')
    const [yearFromApplied, setYearFromApplied] = useState('')
    const [yearUpToApplied, setYearUpToApplied] = useState('')
    const [yearFromDraft, setYearFromDraft] = useState('')
    const [yearUpToDraft, setYearUpToDraft] = useState('')
    const [yearOptionsApplied, setYearOptionsApplied] = useState([])
    const [yearOptionsDraft, setYearOptionsDraft] = useState([])
    const [regionalSpecsApplied, setRegionalSpecsApplied] = useState([])
    const [regionalSpecsDraft, setRegionalSpecsDraft] = useState([])
    const [specsListExpanded, setSpecsListExpanded] = useState(false)
    const [filterKeywords, setFilterKeywords] = useState('')
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [propertyPurpose, setPropertyPurpose] = useState('Rent')
    const [propertyTypeGroup, setPropertyTypeGroup] = useState('Residential')
    const [propertyType, setPropertyType] = useState('All in Residential')
    const [propertyPrice, setPropertyPrice] = useState('Any')
    const [propertyPriceFromDraft, setPropertyPriceFromDraft] = useState('')
    const [propertyPriceUpToDraft, setPropertyPriceUpToDraft] = useState('')
    const [propertyBeds, setPropertyBeds] = useState('Any')
    const [propertyBedsDraft, setPropertyBedsDraft] = useState('')
    const [propertyBedsExpanded, setPropertyBedsExpanded] = useState(false)
    const [propertyLocation, setPropertyLocation] = useState('')
    const [propertyLocationOpen, setPropertyLocationOpen] = useState(false)
    const [propertyLocationSuggestions, setPropertyLocationSuggestions] = useState([])
    const [propertyLocationSuggestionsLoading, setPropertyLocationSuggestionsLoading] = useState(false)
    const propertyLocationFetchIdRef = useRef(0)
    const [jobsKeyword, setJobsKeyword] = useState('')
    const [jobsKeywordSuggestions, setJobsKeywordSuggestions] = useState([])
    const [jobsKeywordSuggestionsLoading, setJobsKeywordSuggestionsLoading] = useState(false)
    const jobsKeywordFetchIdRef = useRef(0)
    const jobsKeywordLastLoadedKeyRef = useRef(null)
    const jobsKeywordTrimRef = useRef('')
    const [jobsSalary, setJobsSalary] = useState('Select')
    const [jobsSalaryDraft, setJobsSalaryDraft] = useState('')
    const [jobsSalaryExpanded, setJobsSalaryExpanded] = useState(false)
    const [jobsExperience, setJobsExperience] = useState('Select')
    const [jobsExperienceDraft, setJobsExperienceDraft] = useState('')
    const [jobsExperienceExpanded, setJobsExperienceExpanded] = useState(false)
    const [jobsEducation, setJobsEducation] = useState('Select')
    const [jobsEducationDraft, setJobsEducationDraft] = useState('')
    const [jobsEducationExpanded, setJobsEducationExpanded] = useState(false)
    const [jobsCity, setJobsCity] = useState('All Cities(UAE)')
    const [jobsCityDraft, setJobsCityDraft] = useState('All Cities(UAE)')
    const [jobsKeywordOpen, setJobsKeywordOpen] = useState(false)
    const [classifiedCity, setClassifiedCity] = useState('All Cities(UAE)')
    const [classifiedCityDraft, setClassifiedCityDraft] = useState('All Cities(UAE)')
    const [classifiedKeyword, setClassifiedKeyword] = useState('')
    const [classifiedKeywordOpen, setClassifiedKeywordOpen] = useState(false)
    const [classifiedNeighborhood, setClassifiedNeighborhood] = useState('')
    const [classifiedNeighborhoodOpen, setClassifiedNeighborhoodOpen] = useState(false)
    const [classifiedNeighborhoodSuggestions, setClassifiedNeighborhoodSuggestions] = useState([])
    const [classifiedNeighborhoodSuggestionsLoading, setClassifiedNeighborhoodSuggestionsLoading] =
        useState(false)
    const classifiedNeighborhoodFetchIdRef = useRef(0)
    const [classifiedPriceFromApplied, setClassifiedPriceFromApplied] = useState('')
    const [classifiedPriceUpToApplied, setClassifiedPriceUpToApplied] = useState('')
    const [classifiedPriceFromDraft, setClassifiedPriceFromDraft] = useState('')
    const [classifiedPriceUpToDraft, setClassifiedPriceUpToDraft] = useState('')
    const [propertyApiChildren, setPropertyApiChildren] = useState([])
    const [propertyApiFilters, setPropertyApiFilters] = useState([])
    /** Draft values for `segment=new_projects` main-bar API filters (keyed by `cf_*`). */
    const [npMainBarDrafts, setNpMainBarDrafts] = useState({})
    const [verticalListingApiFilters, setVerticalListingApiFilters] = useState([])
    const [verticalListingSelectedCategoryId, setVerticalListingSelectedCategoryId] = useState(null)
    const [motorsApiFilters, setMotorsApiFilters] = useState([])
    const [jobsApiFilters, setJobsApiFilters] = useState([])
    const [jobsSalaryOptions, setJobsSalaryOptions] = useState(JOBS_SALARY_OPTIONS)
    const [jobsExperienceOptions, setJobsExperienceOptions] = useState(JOBS_EXPERIENCE_OPTIONS)
    const [cities, setCities] = useState(UAE_CITIES_BASE)
    const cityCurrentPageRef = useRef(0)
    const cityLastPageRef = useRef(1)
    const isCitiesLoadingRef = useRef(false)
    const requestedCityPagesRef = useRef(new Set())
    
    useEffect(() => {
        const onDown = (e) => {
            if (!wrapRef.current?.contains(e.target)) {
                setOpenKey(null)
                setFiltersOpen(false)
                setMakeModelOpen(false)
                setPropertyLocationOpen(false)
                setJobsKeywordOpen(false)
                setClassifiedKeywordOpen(false)
                setClassifiedNeighborhoodOpen(false)
            }
        }
        document.addEventListener('mousedown', onDown)
        return () => document.removeEventListener('mousedown', onDown)
    }, [])

    const jobsKeywordItems = useMemo(() => {
        const q = String(jobsKeyword || '').trim().toLowerCase()
        const base = Array.isArray(JOBS_KEYWORD_SUGGESTIONS) ? JOBS_KEYWORD_SUGGESTIONS : []
        if (!q) {
            return base.slice(0, 8).map((x) => ({
                id: `kw-${String(x)}`,
                label: String(x || '').trim(),
                source: 'local',
            }))
        }
        const api = Array.isArray(jobsKeywordSuggestions) ? jobsKeywordSuggestions : []
        return api.slice(0, 12).map((x, idx) => ({
            id: x?.id ?? x?.slug ?? `${x?.label || 'kw'}-${idx}`,
            label: String(x?.label || '').trim(),
            slug: x?.slug,
            source: 'api',
        }))
    }, [jobsKeyword, jobsKeywordSuggestions])

    const classifiedKeywordItems = useMemo(() => {
        const q = String(classifiedKeyword || '').trim().toLowerCase()
        const base = Array.isArray(CLASSIFIED_KEYWORD_SUGGESTIONS) ? CLASSIFIED_KEYWORD_SUGGESTIONS : []
        if (!q) return base.slice(0, 8)
        return base.filter((x) => String(x).toLowerCase().includes(q)).slice(0, 12)
    }, [classifiedKeyword])

    const classifiedNeighborhoodQuery = classifiedNeighborhood.trim().toLowerCase()

    const placesCountryLabel = useMemo(
        () =>
            resolvePlacesCountryLabel({
                urlCountry: searchParams?.get('country'),
                reduxCountry: cityData?.country,
            }),
        [searchParamsKey, searchParams, cityData?.country]
    )

    const placesCountryRestrictions = useMemo(
        () => buildGooglePlacesComponentRestrictions(placesCountryLabel),
        [placesCountryLabel]
    )

    const recruiterEducationFilterNames = useMemo(
        () =>
            (jobsApiFilters || [])
                .map((f) => String(f?.name || '').trim())
                .filter((name) => name && name.toLowerCase().includes('education')),
        [jobsApiFilters]
    )
    const recruiterEducationFilterDef = useMemo(
        () =>
            (jobsApiFilters || []).find((f) =>
                recruiterEducationFilterNames.includes(String(f?.name || '').trim())
            ) || null,
        [jobsApiFilters, recruiterEducationFilterNames]
    )
    const recruiterEducationOptions = useMemo(() => {
        const vals = Array.isArray(recruiterEducationFilterDef?.values)
            ? recruiterEducationFilterDef.values
            : []
        return vals.map((v) => String(v || '').trim()).filter(Boolean)
    }, [recruiterEducationFilterDef])

    const loadCities = useCallback(async (page = null) => {
        const pageKey = page == null ? 'initial' : String(page)
        if (isCitiesLoadingRef.current) return
        if (page != null && requestedCityPagesRef.current.has(pageKey)) return
        if (page != null && page > 1 && page > cityLastPageRef.current) return
        try {
            if (page != null) requestedCityPagesRef.current.add(pageKey)
            isCitiesLoadingRef.current = true
            const res = await getCitiesApi.getCities(page == null ? {} : { page })
            const rows = res?.data?.data?.data || []
            const current = Number(res?.data?.data?.current_page || page || 1)
            const last = Number(res?.data?.data?.last_page || current || 1)
            cityCurrentPageRef.current = page == null ? 0 : current
            cityLastPageRef.current = last
            const mapped = Array.isArray(rows)
                ? rows
                      .map((c) => ({
                          id: c?.id ?? c?.name,
                          label: c?.name || '',
                      }))
                      .filter((x) => x.label)
                : []
            setCities((prev) => {
                if (page == null || page === 1) return [...UAE_CITIES_BASE, ...mapped]
                const existing = new Set(prev.map((x) => String(x.id)))
                const merged = [...prev]
                mapped.forEach((item) => {
                    if (!existing.has(String(item.id))) {
                        merged.push(item)
                        existing.add(String(item.id))
                    }
                })
                return merged
            })
        } catch (error) {
            if (page != null) requestedCityPagesRef.current.delete(pageKey)
            console.error('Error fetching cities data:', error)
        } finally {
            isCitiesLoadingRef.current = false
        }
    }, [])

    useEffect(() => {
        loadCities()
    }, [loadCities])

    const handleCityListScroll = useCallback(
        (e) => {
            if (isCitiesLoadingRef.current) return
            const el = e.currentTarget
            const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24
            if (!nearBottom) return
            const nextPage = cityCurrentPageRef.current + 1
            if (nextPage > cityLastPageRef.current) return
            loadCities(nextPage)
        },
        [loadCities]
    )

    const applySelectedCity = useCallback(
        (value, setApplied, options = {}) => {
            setApplied(value)
            const isAll = value === 'All Cities(UAE)'
            dispatch(
                setCityData({
                    data: {
                        ...(cityData || {}),
                        city: isAll ? '' : value,
                    },
                })
            )
            const qs = new URLSearchParams(searchParams.toString())
            if (isAll) qs.delete('city')
            else qs.set('city', value)
            if (options.clearArea) {
                qs.delete('area')
                setClassifiedNeighborhood('')
            }
            const country = String(cityData?.country || '').trim()
            if (country) qs.set('country', country)
            qs.set('page', '1')
            const nextUrl = qs.toString() ? `${pathname}?${qs.toString()}` : pathname
            router.replace(nextUrl)
            router.refresh()
        },
        [cityData, dispatch, pathname, router, searchParams]
    )

    /** URL `city` wins over Redux so breadcrumb / deep links pre-select the filter bar. */
    useEffect(() => {
        const urlCity = String(searchParams?.get('city') || '').trim()
        const urlArea = String(searchParams?.get('area') || '').trim()
        const urlBuilding = String(searchParams?.get('building') || '').trim()
        const urlState = String(searchParams?.get('state') || '').trim()

        // Location pills write city/area/building/state; show the most specific one in the Location field.
        setPropertyLocation(urlBuilding || urlArea || urlCity || urlState)

        if (urlCity) {
            setCity(urlCity)
            setCityDraft(urlCity)
            setJobsCity(urlCity)
            setJobsCityDraft(urlCity)
            setClassifiedCity(urlCity)
            setClassifiedCityDraft(urlCity)
            if (String(cityData?.city || '').trim() !== urlCity) {
                dispatch(
                    setCityData({
                        data: {
                            ...(cityData || {}),
                            city: urlCity,
                        },
                    })
                )
            }
            return
        }

        const stored = String(cityData?.city || '').trim()
        const next = stored || 'All Cities(UAE)'
        setCity(next)
        setCityDraft(next)
        setJobsCity(next)
        setJobsCityDraft(next)
        setClassifiedCity(next)
        setClassifiedCityDraft(next)
    }, [searchParamsKey, searchParams, cityData?.city, cityData, dispatch])

    /** Header / location modal: Redux city/country changed → reset neighborhood and sync listing URL. */
    useEffect(() => {
        if (!isVerticalListingBarMode(mode)) return

        const reduxCity = String(cityData?.city || '').trim()
        const reduxCountry = String(cityData?.country || '').trim()
        const urlCity = String(searchParams?.get('city') || '').trim()
        const urlCountry = String(searchParams?.get('country') || '').trim()
        const urlArea = String(searchParams?.get('area') || '').trim()

        if (urlCity && !reduxCity) return

        const cityDiffers = reduxCity !== urlCity
        const countryDiffers = reduxCountry !== urlCountry
        const hasStaleArea = Boolean(urlArea) && (cityDiffers || countryDiffers)

        if (!cityDiffers && !countryDiffers && !hasStaleArea) return

        setClassifiedNeighborhood('')

        const displayCity = reduxCity || 'All Cities(UAE)'
        setClassifiedCity(displayCity)
        setClassifiedCityDraft(displayCity)

        const qs = new URLSearchParams(searchParams.toString())
        qs.delete('area')
        qs.set('page', '1')
        if (reduxCity) qs.set('city', reduxCity)
        else qs.delete('city')
        if (reduxCountry) qs.set('country', reduxCountry)
        else qs.delete('country')

        const next = qs.toString() ? `${pathname}?${qs.toString()}` : pathname
        router.replace(next, { scroll: false })
        router.refresh()
    }, [
        mode,
        cityData?.city,
        cityData?.country,
        searchParamsKey,
        searchParams,
        pathname,
        router,
    ])

    useEffect(() => {
        const trimmedQuery = propertyLocation.trim()
        if (!propertyLocationOpen || !trimmedQuery) {
            setPropertyLocationSuggestions([])
            setPropertyLocationSuggestionsLoading(false)
            return
        }
        if (!isGoogleMapsLoaded || !window?.google?.maps?.places?.AutocompleteService) {
            setPropertyLocationSuggestions([])
            setPropertyLocationSuggestionsLoading(false)
            return
        }

        const fetchId = propertyLocationFetchIdRef.current + 1
        propertyLocationFetchIdRef.current = fetchId
        setPropertyLocationSuggestionsLoading(true)

        const timer = setTimeout(() => {
            const service = new window.google.maps.places.AutocompleteService()
            const request = {
                input: buildPlacesAutocompleteInput(trimmedQuery, '', placesCountryLabel),
            }
            if (placesCountryRestrictions) {
                request.componentRestrictions = placesCountryRestrictions
            }
            service.getPlacePredictions(
                request,
                (predictions, status) => {
                    if (propertyLocationFetchIdRef.current !== fetchId) return
                    const ok = status === window.google.maps.places.PlacesServiceStatus.OK
                    if (!ok || !Array.isArray(predictions)) {
                        setPropertyLocationSuggestions([])
                        setPropertyLocationSuggestionsLoading(false)
                        return
                    }
                    setPropertyLocationSuggestions(
                        predictions.map((item) => ({
                            id: item.place_id || item.description,
                            name: item.structured_formatting?.main_text || item.description || '',
                            subtitle: item.structured_formatting?.secondary_text || '',
                            type: toPlaceTypeLabel(item.types?.[0]),
                        }))
                    )
                    setPropertyLocationSuggestionsLoading(false)
                }
            )
        }, 250)

        return () => clearTimeout(timer)
    }, [
        isGoogleMapsLoaded,
        propertyLocation,
        propertyLocationOpen,
        placesCountryLabel,
        placesCountryRestrictions,
    ])

    const neighborhoodCityLabel = useMemo(() => {
        const urlCity = String(searchParams?.get('city') || '').trim()
        if (urlCity) return urlCity
        if (isAllCitiesLabel(classifiedCity)) return classifiedCity
        return String(classifiedCity || '').trim() || 'All Cities(UAE)'
    }, [searchParamsKey, searchParams, classifiedCity])

    useEffect(() => {
        if (!isVerticalListingBarMode(mode)) return undefined
        const trimmedQuery = classifiedNeighborhood.trim()
        const selectedCity = neighborhoodCityLabel

        if (!classifiedNeighborhoodOpen) {
            setClassifiedNeighborhoodSuggestions([])
            setClassifiedNeighborhoodSuggestionsLoading(false)
            return undefined
        }

        if (!trimmedQuery) {
            setClassifiedNeighborhoodSuggestions([])
            setClassifiedNeighborhoodSuggestionsLoading(false)
            return undefined
        }

        if (!isGoogleMapsLoaded || !window?.google?.maps?.places?.AutocompleteService) {
            setClassifiedNeighborhoodSuggestions([])
            setClassifiedNeighborhoodSuggestionsLoading(false)
            return undefined
        }

        const fetchId = classifiedNeighborhoodFetchIdRef.current + 1
        classifiedNeighborhoodFetchIdRef.current = fetchId
        setClassifiedNeighborhoodSuggestionsLoading(true)

        const timer = setTimeout(() => {
            const service = new window.google.maps.places.AutocompleteService()
            const input = buildNeighborhoodAutocompleteInput(
                trimmedQuery,
                selectedCity,
                placesCountryLabel
            )
            const request = { input }
            if (placesCountryRestrictions) {
                request.componentRestrictions = placesCountryRestrictions
            }
            service.getPlacePredictions(
                request,
                (predictions, status) => {
                    if (classifiedNeighborhoodFetchIdRef.current !== fetchId) return
                    const PlacesStatus = window.google.maps.places.PlacesServiceStatus
                    if (status !== PlacesStatus.OK || !Array.isArray(predictions)) {
                        setClassifiedNeighborhoodSuggestions([])
                        setClassifiedNeighborhoodSuggestionsLoading(false)
                        return
                    }
                    const mapped = predictions.map((item) => {
                        const row = mapNeighborhoodPlacePrediction(item)
                        return {
                            ...row,
                            type: toPlaceTypeLabel(row.type),
                        }
                    })
                    setClassifiedNeighborhoodSuggestions(mapped)
                    setClassifiedNeighborhoodSuggestionsLoading(false)
                }
            )
        }, 250)

        return () => clearTimeout(timer)
    }, [
        mode,
        isGoogleMapsLoaded,
        classifiedNeighborhood,
        classifiedNeighborhoodOpen,
        neighborhoodCityLabel,
        placesCountryLabel,
        placesCountryRestrictions,
    ])

    const filteredClassifiedNeighborhoodSuggestions = useMemo(() => {
        return Array.isArray(classifiedNeighborhoodSuggestions)
            ? classifiedNeighborhoodSuggestions
            : []
    }, [classifiedNeighborhoodSuggestions])

    const priceSummary =
        !priceFromApplied && !priceUpToApplied
            ? null
            : [priceFromApplied || '0', priceUpToApplied || 'Any'].join(' – ')

    const yearSummary =
        yearOptionsApplied.length > 0
            ? yearOptionsApplied.join(', ')
            : !yearFromApplied && !yearUpToApplied
              ? null
              : `${yearFromApplied} – ${yearUpToApplied}`

    const specsSummary =
        regionalSpecsApplied.length > 0 ? regionalSpecsApplied.join(', ') : null

    const toggleSpecDraft = (label) => {
        setRegionalSpecsDraft((prev) =>
            prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
        )
    }
    const toggleYearOptionDraft = (label) => {
        setYearOptionsDraft((prev) =>
            prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
        )
    }
    const motorsYearOptions = useMemo(() => {
        const y = (motorsApiFilters || []).find(
            (f) => String(f?.name || '').trim().toLowerCase() === 'year'
        )
        return Array.isArray(y?.values) ? y.values.map(String).filter(Boolean) : []
    }, [motorsApiFilters])
    const motorsRegionalSpecsOptions = useMemo(() => {
        const s = (motorsApiFilters || []).find(
            (f) => String(f?.name || '').trim().toLowerCase() === 'regional specs'
        )
        return Array.isArray(s?.values) ? s.values.map(String).filter(Boolean) : []
    }, [motorsApiFilters])
    const motorsYearFilterDef = useMemo(
        () =>
            (motorsApiFilters || []).find(
                (f) => String(f?.name || '').trim().toLowerCase() === 'year'
            ) || null,
        [motorsApiFilters]
    )
    const motorsSpecsFilterDef = useMemo(
        () =>
            (motorsApiFilters || []).find(
                (f) => String(f?.name || '').trim().toLowerCase() === 'regional specs'
            ) || null,
        [motorsApiFilters]
    )
    const specsOptionsToShow = motorsRegionalSpecsOptions.length
        ? motorsRegionalSpecsOptions
        : SPECS_OPTIONS_ALL
    const locationQuery = propertyLocation.trim().toLowerCase()
    const filteredPropertyLocations = propertyLocationSuggestions

    const renderHighlight = (text, query) => {
        if (!query) return text
        const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const parts = text.split(new RegExp(`(${safe})`, 'ig'))
        return parts.map((part, idx) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <span key={`${part}-${idx}`} className="underline underline-offset-[2px]">
                    {part}
                </span>
            ) : (
                <span key={`${part}-${idx}`}>{part}</span>
            )
        )
    }
    const classifiedPriceSummary =
        !classifiedPriceFromApplied && !classifiedPriceUpToApplied
            ? 'Select'
            : `${classifiedPriceFromApplied || '0'} - ${classifiedPriceUpToApplied || 'Any'}`

    const propertyTypeMenu = useMemo(() => {
        const dynamic = buildTypeMenuFromChildren(propertyApiChildren)
        return Object.keys(dynamic).length ? dynamic : PROPERTY_TYPE_MENU_ITEMS
    }, [propertyApiChildren])
    const propertyTypeGroups = useMemo(
        () =>
            propertyApiChildren.length
                ? propertyApiChildren.map((child) => categoryTreeDisplayName(child)).filter(Boolean)
                : Object.keys(propertyTypeMenu),
        [propertyApiChildren, propertyTypeMenu],
    )

    const segmentIsNewProjects = useMemo(
        () => isNewProjectsSegmentStrict(searchParams),
        [searchParamsKey, searchParams],
    )
    const newProjectsMainBarBedroomsDef = useMemo(() => {
        if (!segmentIsNewProjects || !Array.isArray(propertyApiFilters)) return null
        return propertyApiFilters.find((f) => matchNewProjectsMainBarBedroomsFilter(f)) || null
    }, [segmentIsNewProjects, propertyApiFilters])
    const newProjectsMainBarCompletionDef = useMemo(() => {
        if (!segmentIsNewProjects || !Array.isArray(propertyApiFilters)) return null
        const bed = newProjectsMainBarBedroomsDef
        return (
            propertyApiFilters.find(
                (f) => matchNewProjectsProjectCompletionFilter(f) && f !== bed
            ) || null
        )
    }, [segmentIsNewProjects, propertyApiFilters, newProjectsMainBarBedroomsDef])
    const newProjectsMainBarPreHandoverDef = useMemo(() => {
        if (!segmentIsNewProjects || !Array.isArray(propertyApiFilters)) return null
        const bed = newProjectsMainBarBedroomsDef
        const c = newProjectsMainBarCompletionDef
        return (
            propertyApiFilters.find(
                (f) => matchNewProjectsPreHandoverPaymentFilter(f) && f !== bed && f !== c
            ) || null
        )
    }, [
        segmentIsNewProjects,
        propertyApiFilters,
        newProjectsMainBarBedroomsDef,
        newProjectsMainBarCompletionDef,
    ])
    const newProjectsMainBarFilterNamesForSummary = useMemo(() => {
        if (!segmentIsNewProjects) return []
        return [newProjectsMainBarBedroomsDef, newProjectsMainBarCompletionDef, newProjectsMainBarPreHandoverDef]
            .filter(Boolean)
            .map((d) => String(d.name || '').trim())
            .filter(Boolean)
    }, [
        segmentIsNewProjects,
        newProjectsMainBarBedroomsDef,
        newProjectsMainBarCompletionDef,
        newProjectsMainBarPreHandoverDef,
    ])

    const propertyFiltersHydration = useMemo(
        () =>
            mode === 'property'
                ? parsePropertyProductsPanelFromSearchParams(searchParams, propertyApiFilters)
                : null,
        [mode, searchParamsKey, searchParams, propertyApiFilters]
    )

    const verticalListingFiltersHydration = useMemo(
        () =>
            isVerticalListingBarMode(mode)
                ? parseClassifiedProductsPanelFromSearchParams(searchParams, verticalListingApiFilters)
                : null,
        [mode, searchParamsKey, searchParams, verticalListingApiFilters]
    )

    /** Leaf category the user selected in the header (URL or get-category-filters slug). */
    const effectiveVerticalListingCategoryId = useMemo(() => {
        const raw = searchParams?.get('category_id')?.trim()
        if (raw) {
            const n = Number(raw)
            if (Number.isFinite(n)) return n
        }
        const fromFiltersApi = verticalListingSelectedCategoryId
        if (fromFiltersApi != null && fromFiltersApi !== '') {
            const n = Number(fromFiltersApi)
            if (Number.isFinite(n)) return n
        }
        return null
    }, [searchParamsKey, searchParams, verticalListingSelectedCategoryId])

    const motorsFiltersHydration = useMemo(
        () =>
            mode === 'motors'
                ? parseClassifiedProductsPanelFromSearchParams(searchParams, motorsApiFilters)
                : null,
        [mode, searchParamsKey, searchParams, motorsApiFilters]
    )

    const buildMotorsMakeModelSearchHref = useCallback(
        (row) => {
            const qs = new URLSearchParams(searchParams.toString())
            qs.set('page', '1')
            const display =
                String(row?.merged_name ?? '').trim() || String(row?.make_name ?? '').trim()
            if (display) {
                qs.set('make_model', display)
            } else {
                qs.delete('make_model')
            }
            qs.delete('search')
            qs.delete('keyword')
            const mk = row?.make_id
            if (mk != null && String(mk).trim() !== '') {
                qs.set('make_id', String(mk))
            } else {
                qs.delete('make_id')
            }
            const md = row?.model_id
            if (md != null && String(md).trim() !== '') {
                qs.set('model_id', String(md))
            } else {
                qs.delete('model_id')
            }
            const next = qs.toString()
            return next ? `${pathname}?${next}` : pathname
        },
        [pathname, searchParams, searchParamsKey]
    )

    const verticalListingSideFilterSummary = useMemo(() => {
        if (!isVerticalListingBarMode(mode)) return 'Keywords, category filters…'
        const n = countAppliedGetItemFilters(searchParams, {
            includeMediaFlags: true,
        })
        return filtersSelectedSummaryLabel(n, 'Keywords, category filters…')
    }, [mode, searchParamsKey, searchParams])

    const jobsSideFilterSummary = useMemo(() => {
        if (mode !== 'jobs' && mode !== 'recruiter') return 'Education, Employment T...'
        const n = countAppliedGetItemFilters(searchParams, {
            includeMediaFlags: true,
            extraKeys: [
                'employment_type',
                ...(!isRecruiterContext ? ['education'] : []),
            ],
            excludeFilterNames: [
                'Expected Salary',
                'Monthly Salary',
                'Salary',
                'Work Experience',
                'Minimum Work Experience',
                'Experience',
                ...(isRecruiterContext ? recruiterEducationFilterNames : []),
            ],
        })
        return filtersSelectedSummaryLabel(n, 'Education, Employment T...')
    }, [mode, searchParamsKey, searchParams, recruiterEducationFilterNames, isRecruiterContext])

    const propertySideFilterSummary = useMemo(() => {
        if (mode !== 'property') return 'Baths, Area / Size (sqft...)'
        const n = countAppliedGetItemFilters(searchParams, {
            includeKeyword: true,
            includeMediaFlags: true,
            extraKeys: ['agency'],
            excludeFilterKeys: [PROPERTY_BEDROOMS_FILTER_URL_KEY],
            excludeFilterNames: newProjectsMainBarFilterNamesForSummary,
        })
        return filtersSelectedSummaryLabel(n, 'Baths, Area / Size (sqft...)')
    }, [mode, searchParamsKey, searchParams, newProjectsMainBarFilterNamesForSummary])

    const motorsSideFilterSummary = useMemo(() => {
        if (mode !== 'motors') return 'Keywords, Seller Typ...'
        const yearFilterName = String(motorsYearFilterDef?.name || 'Year').trim()
        const specsFilterName = String(motorsSpecsFilterDef?.name || 'Regional Specs').trim()
        const n = countAppliedGetItemFilters(searchParams, {
            includeMediaFlags: true,
            excludeFilterNames: [yearFilterName, specsFilterName],
        })
        return filtersSelectedSummaryLabel(n, 'Keywords, Seller Typ...')
    }, [mode, searchParamsKey, searchParams, motorsYearFilterDef, motorsSpecsFilterDef])

    const seedNpMainBarDraftForDef = useCallback(
        (def) => {
            if (!def) return
            const k = npFilterKey(def)
            const hy = parsePropertyProductsPanelFromSearchParams(searchParams, propertyApiFilters)
            const cur = hy.dynamicFilters?.[k]
            let init
            if (def.type === 'min-max') {
                init =
                    cur && typeof cur === 'object' && !Array.isArray(cur)
                        ? {
                              min: String(cur.min ?? '').replace(/\D/g, ''),
                              max: String(cur.max ?? '').replace(/\D/g, ''),
                          }
                        : { min: '', max: '' }
            } else if (def.multiselect) {
                init = Array.isArray(cur) ? [...cur] : cur != null && cur !== '' ? [cur] : []
            } else {
                init = cur ?? ''
            }
            setNpMainBarDrafts((p) => ({ ...p, [k]: init }))
        },
        [searchParams, propertyApiFilters, searchParamsKey],
    )

    const applyNewProjectsMainBarApiFilter = useCallback(
        (def) => {
            if (!def) return
            const k = npFilterKey(def)
            const v = npMainBarDrafts[k]
            const qs = new URLSearchParams(searchParams.toString())
            const name = String(def.name || '').trim()
            const type = def.type === 'min-max' ? 'min-max' : 'button'
            const ser = serializeGetItemFilterValue(name, type, Boolean(def.multiselect), v)
            if (ser == null) qs.delete(`filters[${name}]`)
            else qs.set(`filters[${name}]`, ser)
            qs.set('page', '1')
            const next = qs.toString()
            router.replace(next ? `${pathname}?${next}` : pathname)
            router.refresh()
            setOpenKey(null)
        },
        [npMainBarDrafts, pathname, router, searchParams],
    )

    useEffect(() => {
        if (mode !== 'property' && mode !== 'motors') return
        const kw = searchParams.get('search') || searchParams.get('keyword') || ''
        setFilterKeywords(kw)
    }, [mode, searchParamsKey, searchParams])

    useEffect(() => {
        if (mode !== 'property') return
        if (!propertyTypeGroups.length) return
        if (!propertyTypeGroups.includes(propertyTypeGroup)) {
            setPropertyTypeGroup(propertyTypeGroups[0])
        }
    }, [mode, propertyTypeGroups, propertyTypeGroup])

    useEffect(() => {
        if (mode !== 'property') return
        if (isNewProjectsSegmentStrict(searchParams)) {
            setPropertyPurpose('Buy')
            setOpenKey((k) => (k === 'property-purpose' ? null : k))
            const purpose = (searchParams.get('purpose') || '').toLowerCase()
            if (purpose !== 'sale' && purpose !== 'buy') {
                const qs = new URLSearchParams(searchParams.toString())
                qs.set('purpose', 'sale')
                qs.set('page', '1')
                const next = qs.toString()
                router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
            }
        } else {
            const purpose = (searchParams.get('purpose') || '').toLowerCase()
            if (purpose === 'rent') setPropertyPurpose('Rent')
            if (purpose === 'sale' || purpose === 'buy') setPropertyPurpose('Buy')
        }

        const pt = searchParams.get('propertyType')?.trim()
        const categoryId = searchParams.get('category_id')?.trim()

        if (pt) {
            setPropertyType(pt)
            const groupFromApi = findGroupNameForPropertyTypeLabel(propertyApiChildren, pt)
            if (groupFromApi) {
                setPropertyTypeGroup(groupFromApi)
            } else {
                setPropertyTypeGroup(
                    Object.entries(propertyTypeMenu).find(([, items]) => items.some((i) => i.label === pt))?.[0] ||
                        Object.keys(propertyTypeMenu)[0] ||
                        'Residential'
                )
            }
            return
        }

        if (categoryId && propertyApiChildren.length) {
            const resolved = findPropertyGroupAndTypeByCategoryId(propertyApiChildren, categoryId)
            if (resolved?.typeName && resolved?.groupName) {
                setPropertyType(resolved.typeName)
                setPropertyTypeGroup(resolved.groupName)
            }
        }
    }, [mode, searchParams, propertyTypeMenu, propertyApiChildren, pathname, router])

    useEffect(() => {
        if (mode !== 'property') return
        const minP = searchParams.get('minPrice')?.trim() ?? ''
        const maxP = searchParams.get('maxPrice')?.trim() ?? ''
        if (!minP && !maxP) {
            setPropertyPrice('Any')
        } else {
            setPropertyPrice(`${minP || '0'} - ${maxP || 'Any'}`)
        }
        setPropertyBeds(parsePropertyBedsChipLabelFromSearchParams(searchParams, PROPERTY_BED_OPTIONS))
    }, [mode, searchParamsKey, searchParams])

    useEffect(() => {
        if (mode !== 'property') return
        const category_slug = resolvePropertyFiltersApiSlug(searchParams, propertyPurpose)
        if (!category_slug) return
        let cancelled = false
        categoryApi
            .getCategoryTreeBySlug({ category_slug })
            .then((res) => {
                if (cancelled) return
                setPropertyApiChildren(parsePropertyTypeTreeChildren(res))
            })
            .catch(() => {
                if (cancelled) return
                setPropertyApiChildren([])
            })
        return () => {
            cancelled = true
        }
    }, [mode, propertyPurpose, searchParamsKey, searchParams])

    useEffect(() => {
        if (mode !== 'property') return
        const slug = resolvePropertyFiltersApiSlug(searchParams, propertyPurpose)
        if (!slug) return
        let cancelled = false
        categoryApi.getCategoryFilters({ slug }).then((res) => {
            if (cancelled) return
            const cat = res?.data?.data?.categories?.[0]
            setPropertyApiFilters(cat?.filters || [])
        }).catch(() => {
            if (cancelled) return
            setPropertyApiFilters([])
        })
        return () => {
            cancelled = true
        }
    }, [mode, propertyPurpose, searchParamsKey, searchParams])

    useEffect(() => {
        if (!isVerticalListingBarMode(mode)) return
        const selectedSubcategorySlug =
            searchParams.get('category_slug')?.trim() ||
            searchParams.get('slug')?.trim() ||
            ''
        const slug = selectedSubcategorySlug || mode
        let cancelled = false
        categoryApi
            .getCategoryFilters({ slug })
            .then((res) => {
                if (cancelled) return
                const cat = res?.data?.data?.categories?.[0]
                setVerticalListingApiFilters(cat?.filters || [])
                setVerticalListingSelectedCategoryId(cat?.category_id ?? null)
            })
            .catch(() => {
                if (cancelled) return
                setVerticalListingApiFilters([])
                setVerticalListingSelectedCategoryId(null)
            })
        return () => {
            cancelled = true
        }
    }, [mode, searchParamsKey, searchParams])

    useEffect(() => {
        if (mode !== 'motors') return
        const selectedSubcategorySlug =
            searchParams.get('category_slug')?.trim() ||
            searchParams.get('slug')?.trim() ||
            ''
        const slug = selectedSubcategorySlug || 'motors'
        let cancelled = false
        categoryApi
            .getCategoryFilters({ slug })
            .then((res) => {
                if (cancelled) return
                const cat = res?.data?.data?.categories?.[0]
                setMotorsApiFilters(cat?.filters || [])
            })
            .catch(() => {
                if (cancelled) return
                setMotorsApiFilters([])
            })
        return () => {
            cancelled = true
        }
    }, [mode, searchParamsKey, searchParams])

    useEffect(() => {
        if (mode !== 'jobs' && mode !== 'recruiter') return
        const selected =
            searchParams.get('category_slug')?.trim() ||
            searchParams.get('slug')?.trim() ||
            ''
        const slug = selected || 'jobs'
        let cancelled = false
        categoryApi
            .getCategoryFilters({ slug })
            .then((res) => {
                if (cancelled) return
                const cat = res?.data?.data?.categories?.[0]
                const filters = cat?.filters || []
                setJobsApiFilters(filters)
                const salaryDef = (filters || []).find((f) => {
                    const n = String(f?.name || '').trim().toLowerCase()
                    return n === 'expected salary' || n === 'monthly salary' || n.includes('salary')
                })
                const expDef = (filters || []).find((f) => {
                    const n = String(f?.name || '').trim().toLowerCase()
                    return n === 'work experience' || n === 'minimum work experience' || n.includes('experience')
                })
                const salaryVals = Array.isArray(salaryDef?.values) ? salaryDef.values : []
                const expVals = Array.isArray(expDef?.values) ? expDef.values : []
                setJobsSalaryOptions(salaryVals.length ? salaryVals : JOBS_SALARY_OPTIONS)
                setJobsExperienceOptions(expVals.length ? expVals : JOBS_EXPERIENCE_OPTIONS)
            })
            .catch(() => {
                if (cancelled) return
                setJobsApiFilters([])
                setJobsSalaryOptions(JOBS_SALARY_OPTIONS)
                setJobsExperienceOptions(JOBS_EXPERIENCE_OPTIONS)
            })
        return () => {
            cancelled = true
        }
    }, [mode, searchParamsKey, searchParams])

    useEffect(() => {
        if (!isRecruiterContext) return
        if (!recruiterEducationFilterDef || recruiterEducationOptions.length === 0) {
            setJobsEducation('Select')
            setJobsEducationDraft('')
            return
        }
        if (jobsEducation !== 'Select' && !recruiterEducationOptions.includes(jobsEducation)) {
            setJobsEducation('Select')
        }
        if (jobsEducationDraft && !recruiterEducationOptions.includes(jobsEducationDraft)) {
            setJobsEducationDraft('')
        }
    }, [isRecruiterContext, recruiterEducationFilterDef, recruiterEducationOptions, jobsEducation, jobsEducationDraft])

    useEffect(() => {
        if (!isRecruiterContext) return
        if (!recruiterEducationFilterDef || recruiterEducationOptions.length === 0) return
        const fromUrl = String(searchParams.get('education') || '').trim()
        if (!fromUrl) return
        const needle = normalizeForUrlFilterMatch(fromUrl)
        const matched = recruiterEducationOptions.find((opt) => normalizeForUrlFilterMatch(opt) === needle)
        if (!matched) return
        setJobsEducation(matched)
        setJobsEducationDraft(matched)
    }, [isRecruiterContext, recruiterEducationFilterDef, recruiterEducationOptions, searchParamsKey, searchParams])

    const motorsMakeModelFromUrl = (searchParams.get('make_model') || '').trim()

    useEffect(() => {
        if (mode !== 'motors') return
        setMakeModel(motorsMakeModelFromUrl)
    }, [mode, motorsMakeModelFromUrl])

    useEffect(() => {
        if (mode !== 'motors') {
            setMakeModelSuggestions([])
            makeModelLastLoadedQueryRef.current = null
        }
    }, [mode])

    useEffect(() => {
        if (mode !== 'motors' || !makeModelOpen) return undefined
        const q = makeModel.trim()
        makeModelTrimRef.current = q
        if (!q) {
            setMakeModelSuggestionsLoading(false)
            return undefined
        }
        if (q === makeModelLastLoadedQueryRef.current) {
            setMakeModelSuggestionsLoading(false)
            return undefined
        }
        const timer = setTimeout(() => {
            const reqId = ++makeModelFetchIdRef.current
            if (q !== makeModelLastLoadedQueryRef.current) {
                setMakeModelSuggestions([])
            }
            setMakeModelSuggestionsLoading(true)
            categoryApi
                .searchCarMakeModel({ q })
                .then((res) => {
                    if (makeModelFetchIdRef.current !== reqId) return
                    if (makeModelTrimRef.current !== q) return
                    const list = res?.data?.data?.makes_model
                    const arr = Array.isArray(list) ? list : []
                    setMakeModelSuggestions(arr)
                    makeModelLastLoadedQueryRef.current = q
                })
                .catch(() => {
                    if (makeModelFetchIdRef.current !== reqId) return
                    setMakeModelSuggestions([])
                    makeModelLastLoadedQueryRef.current = null
                })
                .finally(() => {
                    if (makeModelFetchIdRef.current !== reqId) return
                    setMakeModelSuggestionsLoading(false)
                })
        }, 350)
        return () => clearTimeout(timer)
    }, [mode, makeModelOpen, makeModel])

    useEffect(() => {
        if (mode !== 'jobs' && mode !== 'recruiter') {
            setJobsKeywordSuggestions([])
            setJobsKeywordSuggestionsLoading(false)
            jobsKeywordLastLoadedKeyRef.current = null
        }
    }, [mode])

    useEffect(() => {
        if ((mode !== 'jobs' && mode !== 'recruiter') || !jobsKeywordOpen) return undefined

        const q = String(jobsKeyword || '').trim()
        jobsKeywordTrimRef.current = q

        if (!q) {
            setJobsKeywordSuggestions([])
            setJobsKeywordSuggestionsLoading(false)
            jobsKeywordLastLoadedKeyRef.current = null
            return undefined
        }

        const key = q.toLowerCase()
        if (key === jobsKeywordLastLoadedKeyRef.current) {
            setJobsKeywordSuggestionsLoading(false)
            return undefined
        }

        const timer = setTimeout(() => {
            const reqId = ++jobsKeywordFetchIdRef.current
            if (key !== jobsKeywordLastLoadedKeyRef.current) setJobsKeywordSuggestions([])
            setJobsKeywordSuggestionsLoading(true)

            categoryApi
                .searchJobSuggestion({ text: q })
                .then((res) => {
                    if (jobsKeywordFetchIdRef.current !== reqId) return
                    if (jobsKeywordTrimRef.current !== q) return

                    const rows = res?.data?.data
                    const arr = Array.isArray(rows) ? rows : []
                    const mapped = arr
                        .map((x) => ({
                            id: x?.id ?? x?.name,
                            label: String(x?.translated_name || x?.name || '').trim(),
                            source: 'api',
                        }))
                        .filter((x) => x.label)

                    setJobsKeywordSuggestions(mapped)
                    jobsKeywordLastLoadedKeyRef.current = key
                })
                .catch(() => {
                    if (jobsKeywordFetchIdRef.current !== reqId) return
                    setJobsKeywordSuggestions([])
                    jobsKeywordLastLoadedKeyRef.current = null
                })
                .finally(() => {
                    if (jobsKeywordFetchIdRef.current !== reqId) return
                    setJobsKeywordSuggestionsLoading(false)
                })
        }, 350)

        return () => clearTimeout(timer)
    }, [mode, jobsKeywordOpen, jobsKeyword])

    useEffect(() => {
        if (!isVerticalListingBarMode(mode)) return
        const kw =
            searchParams.get('search')?.trim() || searchParams.get('keyword')?.trim() || ''
        setClassifiedKeyword(kw)
        const minP = searchParams.get('minPrice')?.trim() ?? ''
        const maxP = searchParams.get('maxPrice')?.trim() ?? ''
        setClassifiedPriceFromApplied(minP)
        setClassifiedPriceUpToApplied(maxP)
        const area = searchParams.get('area')?.trim() || ''
        setClassifiedNeighborhood(area)
    }, [mode, searchParamsKey, searchParams])

    // Classified, furniture, mobile, community: shared vertical listing filter bar
    if (isVerticalListingBarMode(mode)) {
        return (
            <div ref={wrapRef} className="w-full">
                <div className="hide_scrollbar">
                    <div className="flex w-full min-w-0 gap-2 items-stretch rounded-[16px] border border-[rgba(143,143,143,0.22)] bg-white p-[6px] shadow-[0_2px_14px_rgba(0,0,0,0.06)] max-sm:flex-col max-sm:items-stretch ">
                        <div className="relative min-w-[150px] border-e border-[rgba(143,143,143,0.22)] max-sm:border-r-0 max-sm:border-b">
                            <button
                                type="button"
                                className={`flex w-full flex-col justify-center p-[10px] text-left rtl:text-right cursor-pointer ${openKey === 'classified-city' ? 'bg-[#F0F0F0]' : ''}`}
                                onClick={() => {
                                    setFiltersOpen(false)
                                    setClassifiedKeywordOpen(false)
                                    setClassifiedNeighborhoodOpen(false)
                                    setOpenKey((k) => {
                                        if (k === 'classified-city') return null
                                        setClassifiedCityDraft(classifiedCity)
                                        return 'classified-city'
                                    })
                                }}
                            >
                                <h4 className="mb-[4px] text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000]">City</h4>
                                <div className="flex items-center justify-between gap-[6px]">
                                    <p className="truncate text-[14px] font-[Inter-Regular] leading-[18px] text-[#000]">{classifiedCity}</p>
                                    <DownArrowIcon className={`h-[20px] w-[20px] transition-transform ${openKey === 'classified-city' ? 'rotate-180' : ''}`} stroke="#000" />
                                </div>
                            </button>
                            {openKey === 'classified-city' ? (
                                <div
                                    className="absolute left-0 rtl:right-0 rtl:left-auto top-[calc(100%+8px)] z-[95] w-[330px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] max-sm:w-full"
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <div onScroll={handleCityListScroll} className="flex max-h-[220px] flex-wrap gap-[10px] overflow-y-auto p-[14px]">
                                        {cities.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => setClassifiedCityDraft(item.label)}
                                                className={`cursor-pointer rounded-full border p-[8px_14px] text-[14px] leading-[18px] ${
                                                    classifiedCityDraft === item.label
                                                        ? 'border-[#3A88EF] bg-[rgb(242,247,254)] font-[Inter-SemiBold] text-[#23262A]'
                                                        : 'border-[rgba(143,143,143,0.45)] bg-white font-[Inter-Regular] text-[#23262A]'
                                                }`}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="border-t border-[rgba(143,143,143,0.2)] p-[14px]">
                                        <button
                                            type="button"
                                            className="w-full cursor-pointer rounded-[6px] bg-[#23262A] py-[14px] text-center text-[14px] font-[Inter-Medium] text-white"
                                            onClick={() => {
                                                applySelectedCity(classifiedCityDraft, setClassifiedCity, {
                                                    clearArea: true,
                                                })
                                                setClassifiedNeighborhoodOpen(false)
                                                setOpenKey(null)
                                            }}
                                        >
                                            Apply Filters
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="relative flex min-w-[300px] flex-1 items-center justify-between gap-[10px] border-e border-[rgba(143,143,143,0.22)] p-[10px] max-sm:border-r-0 max-sm:border-b max-sm:min-w-full">
                            <div className="min-w-0 flex-1">
                                <h4 className="mb-[4px] text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000]">Keyword</h4>
                                <input
                                    type="text"
                                    value={classifiedKeyword}
                                    onChange={(e) => {
                                        setClassifiedKeyword(e.target.value)
                                        setClassifiedKeywordOpen(true)
                                        setClassifiedNeighborhoodOpen(false)
                                        setOpenKey(null)
                                        setFiltersOpen(false)
                                    }}
                                    onFocus={() => {
                                        setClassifiedKeywordOpen(true)
                                        setClassifiedNeighborhoodOpen(false)
                                        setOpenKey(null)
                                        setFiltersOpen(false)
                                    }}
                                    placeholder="Search anything in classifieds..."
                                    className="w-full border-none bg-transparent p-0 text-[14px] font-[Inter-Regular] leading-[18px] text-[#23262A] outline-none placeholder:text-[#8F8F8F]"
                                />
                            </div>
                            <SearchIcon className="h-[20px] w-[20px] shrink-0" stroke="#000" />
                            {classifiedKeywordOpen ? (
                                <div
                                    className="absolute left-0 top-[calc(100%+8px)] z-[95] w-[420px] overflow-hidden rounded-[8px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]"
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <div className="max-h-[300px] overflow-y-auto [scrollbar-width:thin]">
                                        {classifiedKeywordItems.map((item) => (
                                            <button
                                                key={item}
                                                type="button"
                                                className="flex w-full items-center gap-[10px] border-b border-[rgba(143,143,143,0.2)] px-[14px] py-[10px] text-left rtl:text-right last:border-b-0 hover:bg-[#F7F7F7]"
                                                onClick={() => {
                                                    setClassifiedKeyword(item)
                                                    setClassifiedKeywordOpen(false)
                                                }}
                                            >
                                                <SearchIcon className="h-[16px] w-[16px] shrink-0" stroke="#8F8F8F" />
                                                <span className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">{item}</span>
                                            </button>
                                        ))}
                                        {classifiedKeywordItems.length === 0 ? (
                                            <p className="px-[14px] py-[12px] text-[13px] font-[Inter-Regular] text-[#8F8F8F]">No keywords found</p>
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="relative min-w-[180px] flex-1 border-e border-[rgba(143,143,143,0.22)] p-[10px] max-sm:border-r-0 max-sm:border-b max-sm:min-w-full">
                            <div className="flex items-center justify-between gap-[8px]">
                                <div className="min-w-0 flex-1">
                                    <h4 className="mb-[4px] text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000]">Neighborhood</h4>
                                    <input
                                        type="text"
                                        value={classifiedNeighborhood}
                                        onChange={(e) => {
                                            setClassifiedNeighborhood(e.target.value)
                                            setClassifiedNeighborhoodOpen(true)
                                            setClassifiedKeywordOpen(false)
                                            setOpenKey(null)
                                            setFiltersOpen(false)
                                        }}
                                        onFocus={() => {
                                            setClassifiedNeighborhoodOpen(true)
                                            setClassifiedKeywordOpen(false)
                                            setOpenKey(null)
                                            setFiltersOpen(false)
                                        }}
                                        placeholder="Enter location"
                                        className="w-full border-none bg-transparent p-0 text-[14px] font-[Inter-Regular] leading-[18px] text-[#23262A] outline-none placeholder:text-[#8F8F8F]"
                                    />
                                </div>
                                <LocationIcon className="h-[20px] w-[20px] shrink-0" stroke="#000" />
                            </div>
                            {classifiedNeighborhoodOpen ? (
                                <div
                                    className="absolute left-0 top-[calc(100%+8px)] z-[95] w-[320px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] max-sm:w-full"
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <div className="max-h-[260px] overflow-y-auto [scrollbar-width:thin]">
                                        {filteredClassifiedNeighborhoodSuggestions.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                className="flex w-full cursor-pointer items-start justify-between gap-[10px] border-b border-[rgba(143,143,143,0.2)] px-[14px] py-[10px] text-left rtl:text-right last:border-b-0 hover:bg-[#F7F7F7]"
                                                onClick={() => {
                                                    const selectedArea = String(item.name || '').trim()
                                                    setClassifiedNeighborhood(selectedArea)
                                                    setClassifiedNeighborhoodOpen(false)
                                                    const qs = new URLSearchParams(searchParams.toString())
                                                    if (selectedArea) qs.set('area', selectedArea)
                                                    else qs.delete('area')
                                                    if (placesCountryLabel) qs.set('country', placesCountryLabel)
                                                    qs.set('page', '1')
                                                    const nextUrl = qs.toString()
                                                        ? `${pathname}?${qs.toString()}`
                                                        : pathname
                                                    router.replace(nextUrl)
                                                    router.refresh()
                                                }}
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-[14px] font-[Inter-Regular] text-[#23262A]">
                                                        {renderHighlight(item.name, classifiedNeighborhoodQuery)}
                                                    </p>
                                                    {item.subtitle ? (
                                                        <p className="truncate pt-[2px] text-[12px] font-[Inter-Regular] text-[#666]">
                                                            {item.subtitle}
                                                        </p>
                                                    ) : null}
                                                </div>
                                                {item.type ? (
                                                    <p className="shrink-0 pt-[4px] text-[12px] font-[Inter-Regular] text-[#666]">
                                                        {item.type}
                                                    </p>
                                                ) : null}
                                            </button>
                                        ))}
                                        {classifiedNeighborhoodSuggestionsLoading ? (
                                            <p className="px-[14px] py-[12px] text-[13px] font-[Inter-Regular] text-[#8F8F8F]">
                                                Loading locations...
                                            </p>
                                        ) : null}
                                        {!classifiedNeighborhoodSuggestionsLoading &&
                                        classifiedNeighborhood.trim() &&
                                        filteredClassifiedNeighborhoodSuggestions.length === 0 ? (
                                            <p className="px-[14px] py-[12px] text-[13px] font-[Inter-Regular] text-[#8F8F8F]">
                                                No locations found
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="relative min-w-[170px] flex-1 border-e border-[rgba(143,143,143,0.22)] max-sm:border-r-0 max-sm:border-b">
                            <button
                                type="button"
                                className={`flex w-full items-center justify-between gap-[8px] p-[10px] text-left rtl:text-right cursor-pointer ${openKey === 'classified-price' ? 'bg-[#F0F0F0]' : ''}`}
                                onClick={() => {
                                    setFiltersOpen(false)
                                    setClassifiedKeywordOpen(false)
                                    setClassifiedNeighborhoodOpen(false)
                                    setOpenKey((k) => {
                                        if (k === 'classified-price') return null
                                        setClassifiedPriceFromDraft(classifiedPriceFromApplied || '0')
                                        setClassifiedPriceUpToDraft(classifiedPriceUpToApplied || 'Any')
                                        return 'classified-price'
                                    })
                                }}
                            >
                                <div className="min-w-0">
                                    <h4 className="mb-[4px] text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000]">Price (AED)</h4>
                                    <p className="truncate text-[14px] font-[Inter-Regular] leading-[18px] text-[#8F8F8F]">{classifiedPriceSummary}</p>
                                </div>
                                <DownArrowIcon className={`h-[20px] w-[20px] shrink-0 transition-transform ${openKey === 'classified-price' ? 'rotate-180' : ''}`} stroke="#000" />
                            </button>
                            {openKey === 'classified-price' ? (
                                <div
                                    className="absolute right-0 top-[calc(100%+8px)] z-[95] w-[340px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] max-sm:w-full"
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <div className="grid grid-cols-2 gap-[14px] border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                                        <div>
                                            <p className="mb-[6px] text-[14px] font-[Inter-Regular] text-[#666]">From</p>
                                            <input
                                                type="text"
                                                value={classifiedPriceFromDraft}
                                                onChange={(e) => setClassifiedPriceFromDraft(e.target.value)}
                                                placeholder="0"
                                                className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white px-[12px] py-[11px] text-[14px] text-[#23262A] outline-none placeholder:text-[#8F8F8F]"
                                            />
                                        </div>
                                        <div>
                                            <p className="mb-[6px] text-[14px] font-[Inter-Regular] text-[#666]">Up to</p>
                                            <input
                                                type="text"
                                                value={classifiedPriceUpToDraft}
                                                onChange={(e) => setClassifiedPriceUpToDraft(e.target.value)}
                                                placeholder="Any"
                                                className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white px-[12px] py-[11px] text-[14px] text-[#23262A] outline-none placeholder:text-[#8F8F8F]"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-stretch gap-[10px] p-[14px]">
                                        <button
                                            type="button"
                                            className="cursor-pointer rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white p-[12px_24px] text-[14px] font-[Inter-SemiBold] text-[#667085]"
                                            onClick={() => {
                                                setClassifiedPriceFromApplied('')
                                                setClassifiedPriceUpToApplied('')
                                                setClassifiedPriceFromDraft('')
                                                setClassifiedPriceUpToDraft('')
                                                const qs = new URLSearchParams(searchParams.toString())
                                                qs.delete('minPrice')
                                                qs.delete('maxPrice')
                                                const nextUrl = qs.toString() ? `${pathname}?${qs.toString()}` : pathname
                                                router.replace(nextUrl)
                                                router.refresh()
                                            }}
                                        >
                                            Clear
                                        </button>
                                        <button
                                            type="button"
                                            className="flex-1 cursor-pointer rounded-[6px] bg-[#23262A] py-[12px] text-center text-[14px] font-[Inter-Medium] text-white"
                                            onClick={() => {
                                                const from = classifiedPriceFromDraft.trim()
                                                const to = classifiedPriceUpToDraft.trim()
                                                setClassifiedPriceFromApplied(from)
                                                setClassifiedPriceUpToApplied(to)
                                                setOpenKey(null)
                                                const qs = new URLSearchParams(searchParams.toString())
                                                qs.delete('minPrice')
                                                qs.delete('maxPrice')
                                                if (from) qs.set('minPrice', from)
                                                if (to && to.toLowerCase() !== 'any') qs.set('maxPrice', to)
                                                const nextUrl = qs.toString() ? `${pathname}?${qs.toString()}` : pathname
                                                router.replace(nextUrl)
                                                router.refresh()
                                            }}
                                        >
                                            Apply Filters
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="relative flex min-w-[180px] flex-1 items-center justify-between gap-2 p-[10px] ">
                            <button
                                type="button"
                                className={`text-left rtl:text-right flex w-full items-center justify-between gap-2 cursor-pointer ${filtersOpen ? '' : ''}`}
                                onClick={() => {
                                    setOpenKey(null)
                                    setClassifiedKeywordOpen(false)
                                    setClassifiedNeighborhoodOpen(false)
                                    setFiltersOpen((v) => !v)
                                }}
                            >
                                <div>
                                    <h4 className="mb-[4px] text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000]">Filters</h4>
                                    <p className="truncate text-[14px] font-[Inter-Regular] leading-[18px] text-[#8F8F8F]">
                                        {verticalListingSideFilterSummary}
                                    </p>
                                </div>
                                <DownArrowIcon className={`h-[20px] w-[20px] transition-transform ${filtersOpen ? 'rotate-180' : ''}`} stroke="#000" />
                            </button>
                            <ClassifiedProductsFiltersPanel
                                open={filtersOpen}
                                onClose={() => setFiltersOpen(false)}
                                listingApiMode={isVerticalListingBarMode(mode)}
                                apiFilters={verticalListingApiFilters}
                                selectedCategoryId={effectiveVerticalListingCategoryId}
                                hydration={verticalListingFiltersHydration}
                                onApply={
                                    isVerticalListingBarMode(mode)
                                        ? (payload) => {
                                              const { keywords, dynamicFilters, adsWithVideo, adsWith360 } =
                                                  payload || {}
                                              const kw = String(keywords ?? '').trim()
                                              setClassifiedKeyword(kw)
                                              const qs = new URLSearchParams(searchParams.toString())
                                              const existingFiltersByName = {}
                                              const filterKeys = []
                                              qs.forEach((value, key) => {
                                                  if (!key.startsWith('filters[')) return
                                                  filterKeys.push(key)
                                                  const m = key.match(/^filters\[(.*)\]$/)
                                                  const filterName = m?.[1] ? String(m[1]).trim() : ''
                                                  if (!filterName) return
                                                  existingFiltersByName[filterName] = String(value ?? '')
                                              })
                                              filterKeys.forEach((k) => qs.delete(k))
                                              if (kw) {
                                                  qs.set('search', kw)
                                                  qs.set('keyword', kw)
                                              } else {
                                                  qs.delete('search')
                                                  qs.delete('keyword')
                                              }
                                              if (adsWithVideo) qs.set('hasVideo', '1')
                                              else qs.delete('hasVideo')
                                              if (adsWith360) qs.set('has360', '1')
                                              else qs.delete('has360')
                                              const filters = {}
                                              const allowedDynKeys = new Set(
                                                  (verticalListingApiFilters || []).map(
                                                      (f) => `cf_${f?.category_id}_${f?.sort_order}`
                                                  )
                                              )
                                              const panelFilterNames = new Set(
                                                  (verticalListingApiFilters || [])
                                                      .map((f) => String(f?.name || '').trim())
                                                      .filter(Boolean)
                                              )
                                              const sanitizedDynamic = {}
                                              if (dynamicFilters && typeof dynamicFilters === 'object') {
                                                  for (const k of Object.keys(dynamicFilters)) {
                                                      if (allowedDynKeys.has(k))
                                                          sanitizedDynamic[k] = dynamicFilters[k]
                                                  }
                                              }
                                              for (const def of verticalListingApiFilters || []) {
                                                  if (!def || String(def.name || '').trim() === '') continue
                                                  const dynKey = `cf_${def.category_id}_${def.sort_order}`
                                                  if (!allowedDynKeys.has(dynKey)) continue
                                                  const name = String(def.name).trim()
                                                  const raw = sanitizedDynamic[dynKey]
                                                  const type = def.type === 'min-max' ? 'min-max' : 'button'
                                                  const multiselect = Boolean(def.multiselect)
                                                  const ser = serializeGetItemFilterValue(
                                                      name,
                                                      type,
                                                      multiselect,
                                                      raw
                                                  )
                                                  if (ser == null) delete filters[name]
                                                  else filters[name] = ser
                                              }
                                              Object.entries(existingFiltersByName).forEach(([name, value]) => {
                                                  if (panelFilterNames.has(name)) return
                                                  if (value) filters[name] = value
                                              })
                                              appendGetItemFiltersToSearchParams(qs, filters)
                                              const nextUrl = qs.toString()
                                                  ? `${pathname}?${qs.toString()}`
                                                  : pathname
                                              router.replace(nextUrl)
                                              router.refresh()
                                          }
                                        : () => {}
                                }
                                currentMode={sourceMode}
                            />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (mode === 'jobs' || mode === 'recruiter') {
        return (
            <div ref={wrapRef} className="w-full">
                <div className="hide_scrollbar">
                    <div className="flex w-full min-w-max items-stretch rounded-[16px] border border-[rgba(143,143,143,0.22)] bg-white p-[6px] shadow-[0_2px_14px_rgba(0,0,0,0.06)] max-sm:flex-col max-sm:items-stretch">
                        <div className="relative min-w-[150px] border-e border-[rgba(143,143,143,0.22)] max-sm:border-r-0 max-sm:border-b max-sm:min-w-full">
                            <button
                                type="button"
                                className={`flex w-full flex-col justify-center p-[10px] text-left rtl:text-right cursor-pointer ${openKey === 'jobs-city' ? 'bg-[#F0F0F0]' : ''}`}
                                onClick={() => {
                                    setFiltersOpen(false)
                                    setJobsKeywordOpen(false)
                                    setOpenKey((k) => {
                                        if (k === 'jobs-city') return null
                                        setJobsCityDraft(jobsCity)
                                        return 'jobs-city'
                                    })
                                }}
                            >
                                <h4 className="mb-[4px] text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000]">City</h4>
                                <div className="flex items-center justify-between gap-[6px]">
                                    <p className="truncate text-[14px] font-[Inter-Regular] leading-[18px] text-[#000]">{jobsCity}</p>
                                    <DownArrowIcon className={`h-[20px] w-[20px] transition-transform ${openKey === 'jobs-city' ? 'rotate-180' : ''}`} stroke="#000" />
                                </div>
                            </button>
                            {openKey === 'jobs-city' ? (
                                <div
                                    className="absolute left-0 rtl:right-0 rtl:left-auto top-[calc(100%+8px)] z-[95] w-[340px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] max-sm:w-full"
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <div onScroll={handleCityListScroll} className="flex max-h-[220px] flex-wrap gap-[10px] overflow-y-auto p-[14px]">
                                        {cities.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => setJobsCityDraft(item.label)}
                                                className={`cursor-pointer rounded-full border p-[8px_14px] text-[14px] leading-[18px] ${
                                                    jobsCityDraft === item.label
                                                        ? 'border-[#3A88EF] bg-[rgb(242,247,254)] font-[Inter-SemiBold] text-[#23262A]'
                                                        : 'border-[rgba(143,143,143,0.45)] bg-white font-[Inter-Regular] text-[#23262A]'
                                                }`}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="border-t border-[rgba(143,143,143,0.2)] p-[14px]">
                                        <button
                                            type="button"
                                            className="w-full cursor-pointer rounded-[6px] bg-[#23262A] py-[14px] text-center text-[14px] font-[Inter-Medium] text-white"
                                            onClick={() => {
                                                applySelectedCity(jobsCityDraft, setJobsCity)
                                                setOpenKey(null)
                                            }}
                                        >
                                            Apply Filters
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="relative flex min-w-[360px] flex-1 items-center justify-between gap-[10px] border-e border-[rgba(143,143,143,0.22)] p-[10px] max-sm:border-r-0 max-sm:border-b max-sm:min-w-full">
                            <div className="min-w-0 flex-1">
                                <h4 className="mb-[4px] text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000]">Keyword</h4>
                                <input
                                    type="text"
                                    value={jobsKeyword}
                                    onChange={(e) => {
                                        setJobsKeyword(e.target.value)
                                        setJobsKeywordOpen(true)
                                        setOpenKey(null)
                                        setFiltersOpen(false)
                                    }}
                                    onFocus={() => {
                                        setJobsKeywordOpen(true)
                                        setOpenKey(null)
                                        setFiltersOpen(false)
                                    }}
                                    placeholder="Search for skills, company or title"
                                    className="w-full border-none bg-transparent p-0 text-[14px] font-[Inter-Regular] leading-[18px] text-[#23262A] outline-none placeholder:text-[#8F8F8F]"
                                />
                            </div>
                            <SearchIcon className="h-[20px] w-[20px] shrink-0" stroke="#000" />
                            {jobsKeywordOpen ? (
                                <div
                                    className="absolute left-0 top-[calc(100%+8px)] z-[95] w-[420px] overflow-hidden rounded-[8px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] max-sm:w-full"
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <div className="max-h-[300px] overflow-y-auto [scrollbar-width:thin]">
                                        {jobsKeywordSuggestionsLoading ? (
                                            <p className="px-[14px] py-[12px] text-[13px] font-[Inter-Regular] text-[#8F8F8F]">
                                                Loading...
                                            </p>
                                        ) : null}
                                        {jobsKeywordItems.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                className="flex w-full items-center gap-[10px] border-b border-[rgba(143,143,143,0.2)] px-[14px] py-[10px] text-left rtl:text-right last:border-b-0 hover:bg-[#F7F7F7]"
                                                onClick={() => {
                                                    const selectedKeyword = String(item?.label || '').trim()
                                                    setJobsKeyword(selectedKeyword)
                                                    setJobsKeywordOpen(false)
                                                    const qs = new URLSearchParams(searchParams.toString())
                                                    if (selectedKeyword) qs.set('search', selectedKeyword)
                                                    else qs.delete('search')
                                                    const nextUrl = qs.toString() ? `${pathname}?${qs.toString()}` : pathname
                                                    router.replace(nextUrl)
                                                    router.refresh()
                                                }}
                                            >
                                                <SearchIcon className="h-[16px] w-[16px] shrink-0" stroke="#8F8F8F" />
                                                <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">{item.label}</p>
                                            </button>
                                        ))}
                                        {!jobsKeywordSuggestionsLoading && jobsKeywordItems.length === 0 ? (
                                            <p className="px-[14px] py-[12px] text-[13px] font-[Inter-Regular] text-[#8F8F8F]">No keywords found</p>
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="relative min-w-[130px] flex-1 border-e border-[rgba(143,143,143,0.22)] max-sm:border-r-0 max-sm:border-b max-sm:min-w-full">
                            <button
                                type="button"
                                className={`flex w-full items-center justify-between gap-[6px] p-[10px] text-left rtl:text-right cursor-pointer ${openKey === 'jobs-salary' ? 'bg-[#F0F0F0]' : ''}`}
                                onClick={() => {
                                    setFiltersOpen(false)
                                    setJobsKeywordOpen(false)
                                    setOpenKey((k) => {
                                        if (k === 'jobs-salary') return null
                                        setJobsSalaryExpanded(false)
                                        setJobsSalaryDraft(jobsSalary === 'Select' ? '' : jobsSalary)
                                        return 'jobs-salary'
                                    })
                                }}
                            >
                                <div>
                                    <h4 className="mb-[4px] text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000]">
                                        {isRecruiterContext ? 'Desired Salary' : 'Salary'}
                                    </h4>
                                    <p className="truncate text-[14px] font-[Inter-Regular] leading-[18px] text-[#8F8F8F]">{jobsSalary}</p>
                                </div>
                                <DownArrowIcon className={`h-[20px] w-[20px] shrink-0 transition-transform ${openKey === 'jobs-salary' ? 'rotate-180' : ''}`} stroke="#000" />
                            </button>
                            {openKey === 'jobs-salary' ? (
                                <div
                                    className="absolute left-0 top-[calc(100%+8px)] z-[95] w-[360px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] max-sm:w-full"
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <div className="flex flex-wrap gap-[10px] p-[14px]">
                                        {(jobsSalaryExpanded ? jobsSalaryOptions : jobsSalaryOptions.slice(0, 5)).map((item) => (
                                            <button
                                                key={item}
                                                type="button"
                                                onClick={() => setJobsSalaryDraft(item)}
                                                className={`cursor-pointer rounded-full border px-[14px] py-[8px] text-[14px] ${
                                                    jobsSalaryDraft === item
                                                        ? 'border-[#3A88EF] bg-[rgb(242,247,254)] font-[Inter-SemiBold] text-[#23262A]'
                                                        : 'border-[rgba(143,143,143,0.45)] bg-white font-[Inter-Regular] text-[#23262A]'
                                                }`}
                                            >
                                                {item}
                                            </button>
                                        ))}
                                        {jobsSalaryOptions.length > 5 ? (
                                            <button
                                                type="button"
                                                onClick={() => setJobsSalaryExpanded((v) => !v)}
                                                className="cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] px-[14px] py-[8px] text-[14px] font-[Inter-SemiBold] text-[#3A88EF]"
                                            >
                                                {jobsSalaryExpanded ? 'View Less' : 'View More'}
                                            </button>
                                        ) : null}
                                    </div>
                                    <div className="flex items-stretch gap-[10px] border-t border-[rgba(143,143,143,0.2)] p-[14px]">
                                        <button
                                            type="button"
                                            className="cursor-pointer rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white p-[14px_22px] text-center text-[14px] font-[Inter-SemiBold] text-[#666]"
                                            onClick={() => {
                                                setJobsSalaryDraft('')
                                                const qs = new URLSearchParams(searchParams.toString())
                                                qs.delete('filters[Expected Salary]')
                                                qs.delete('filters[Monthly Salary]')
                                                qs.delete('filters[Salary]')
                                                const next = qs.toString()
                                                router.replace(next ? `${pathname}?${next}` : pathname)
                                            }}
                                        >
                                            Clear
                                        </button>
                                        <button
                                            type="button"
                                            className="flex-1 cursor-pointer rounded-[6px] bg-[#23262A] py-[14px] text-center text-[14px] font-[Inter-Medium] text-white"
                                            onClick={() => {
                                                setJobsSalary(jobsSalaryDraft || 'Select')
                                                const qs = new URLSearchParams(searchParams.toString())
                                                qs.delete('filters[Expected Salary]')
                                                qs.delete('filters[Monthly Salary]')
                                                qs.delete('filters[Salary]')
                                                const def = (jobsApiFilters || []).find((f) => {
                                                    const n = String(f?.name || '').trim().toLowerCase()
                                                    return n === 'expected salary' || n === 'monthly salary' || n.includes('salary')
                                                })
                                                if (def && jobsSalaryDraft) {
                                                    const filters = {}
                                                    const ser = serializeGetItemFilterValue(
                                                        def.name,
                                                        def.type === 'min-max' ? 'min-max' : 'button',
                                                        Boolean(def.multiselect),
                                                        jobsSalaryDraft
                                                    )
                                                    if (ser != null) filters[def.name] = ser
                                                    appendGetItemFiltersToSearchParams(qs, filters)
                                                }
                                                const next = qs.toString()
                                                router.replace(next ? `${pathname}?${next}` : pathname)
                                                setOpenKey(null)
                                            }}
                                        >
                                            Apply Filters
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="relative min-w-[130px] flex-1 border-e border-[rgba(143,143,143,0.22)] max-sm:border-r-0 max-sm:border-b max-sm:min-w-full">
                            <button
                                type="button"
                                className={`flex w-full items-center justify-between gap-[6px] p-[10px] text-left rtl:text-right cursor-pointer ${openKey === 'jobs-experience' ? 'bg-[#F0F0F0]' : ''}`}
                                onClick={() => {
                                    setFiltersOpen(false)
                                    setJobsKeywordOpen(false)
                                    setOpenKey((k) => {
                                        if (k === 'jobs-experience') return null
                                        setJobsExperienceExpanded(false)
                                        setJobsExperienceDraft(jobsExperience === 'Select' ? '' : jobsExperience)
                                        return 'jobs-experience'
                                    })
                                }}
                            >
                                <div>
                                    <h4 className="mb-[4px] text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000]">Experience</h4>
                                    <p className="truncate text-[14px] font-[Inter-Regular] leading-[18px] text-[#8F8F8F]">{jobsExperience}</p>
                                </div>
                                <DownArrowIcon className={`h-[20px] w-[20px] shrink-0 transition-transform ${openKey === 'jobs-experience' ? 'rotate-180' : ''}`} stroke="#000" />
                            </button>
                            {openKey === 'jobs-experience' ? (
                                <div
                                    className="absolute left-0 top-[calc(100%+8px)] z-[95] w-[360px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] max-sm:w-full"
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <div className="flex flex-wrap gap-[10px] p-[14px]">
                                        {(jobsExperienceExpanded ? jobsExperienceOptions : jobsExperienceOptions.slice(0, 5)).map((item) => (
                                            <button
                                                key={item}
                                                type="button"
                                                onClick={() => setJobsExperienceDraft(item)}
                                                className={`cursor-pointer rounded-full border px-[14px] py-[8px] text-[14px] ${
                                                    jobsExperienceDraft === item
                                                        ? 'border-[#3A88EF] bg-[rgb(242,247,254)] font-[Inter-SemiBold] text-[#23262A]'
                                                        : 'border-[rgba(143,143,143,0.45)] bg-white font-[Inter-Regular] text-[#23262A]'
                                                }`}
                                            >
                                                {item}
                                            </button>
                                        ))}
                                        {jobsExperienceOptions.length > 5 ? (
                                            <button
                                                type="button"
                                                onClick={() => setJobsExperienceExpanded((v) => !v)}
                                                className="cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] px-[14px] py-[8px] text-[14px] font-[Inter-SemiBold] text-[#3A88EF]"
                                            >
                                                {jobsExperienceExpanded ? 'View Less' : 'View More'}
                                            </button>
                                        ) : null}
                                    </div>
                                    <div className="flex items-stretch gap-[10px] border-t border-[rgba(143,143,143,0.2)] p-[14px]">
                                        <button
                                            type="button"
                                            className="cursor-pointer rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white p-[14px_22px] text-center text-[14px] font-[Inter-SemiBold] text-[#666]"
                                            onClick={() => {
                                                setJobsExperienceDraft('')
                                                const qs = new URLSearchParams(searchParams.toString())
                                                qs.delete('filters[Work Experience]')
                                                qs.delete('filters[Minimum Work Experience]')
                                                qs.delete('filters[Experience]')
                                                const next = qs.toString()
                                                router.replace(next ? `${pathname}?${next}` : pathname)
                                            }}
                                        >
                                            Clear
                                        </button>
                                        <button
                                            type="button"
                                            className="flex-1 cursor-pointer rounded-[6px] bg-[#23262A] py-[14px] text-center text-[14px] font-[Inter-Medium] text-white"
                                            onClick={() => {
                                                setJobsExperience(jobsExperienceDraft || 'Select')
                                                const qs = new URLSearchParams(searchParams.toString())
                                                qs.delete('filters[Work Experience]')
                                                qs.delete('filters[Minimum Work Experience]')
                                                qs.delete('filters[Experience]')
                                                const def = (jobsApiFilters || []).find((f) => {
                                                    const n = String(f?.name || '').trim().toLowerCase()
                                                    return (
                                                        n === 'work experience' ||
                                                        n === 'minimum work experience' ||
                                                        n.includes('experience')
                                                    )
                                                })
                                                if (def && jobsExperienceDraft) {
                                                    const filters = {}
                                                    const ser = serializeGetItemFilterValue(
                                                        def.name,
                                                        def.type === 'min-max' ? 'min-max' : 'button',
                                                        Boolean(def.multiselect),
                                                        jobsExperienceDraft
                                                    )
                                                    if (ser != null) filters[def.name] = ser
                                                    appendGetItemFiltersToSearchParams(qs, filters)
                                                }
                                                const next = qs.toString()
                                                router.replace(next ? `${pathname}?${next}` : pathname)
                                                setOpenKey(null)
                                            }}
                                        >
                                            Apply Filters
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {isRecruiterContext && recruiterEducationFilterDef && recruiterEducationOptions.length > 0 ? (
                            <div className="relative min-w-[130px] flex-1 border-r border-[rgba(143,143,143,0.22)] max-sm:border-r-0 max-sm:border-b max-sm:min-w-full">
                                <button
                                    type="button"
                                    className={`flex w-full items-center justify-between gap-[6px] p-[10px] text-left rtl:text-right cursor-pointer ${openKey === 'jobs-education' ? 'bg-[#F0F0F0]' : ''}`}
                                    onClick={() => {
                                        setFiltersOpen(false)
                                        setJobsKeywordOpen(false)
                                        setOpenKey((k) => {
                                            if (k === 'jobs-education') return null
                                            setJobsEducationExpanded(false)
                                            setJobsEducationDraft(jobsEducation === 'Select' ? '' : jobsEducation)
                                            return 'jobs-education'
                                        })
                                    }}
                                >
                                    <div>
                                        <h4 className="mb-[4px] text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000]">Education</h4>
                                        <p className="truncate text-[14px] font-[Inter-Regular] leading-[18px] text-[#8F8F8F]">{jobsEducation}</p>
                                    </div>
                                    <DownArrowIcon className={`h-[20px] w-[20px] shrink-0 transition-transform ${openKey === 'jobs-education' ? 'rotate-180' : ''}`} stroke="#000" />
                                </button>
                                {openKey === 'jobs-education' ? (
                                    <div
                                        className="absolute left-0 top-[calc(100%+8px)] z-[95] w-[360px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] max-sm:w-full"
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex flex-wrap gap-[10px] p-[14px]">
                                            {(jobsEducationExpanded
                                                ? recruiterEducationOptions
                                                : recruiterEducationOptions.slice(0, 5)
                                            ).map((item) => (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    onClick={() => setJobsEducationDraft(item)}
                                                    className={`cursor-pointer rounded-full border px-[14px] py-[8px] text-[14px] ${
                                                        jobsEducationDraft === item
                                                            ? 'border-[#3A88EF] bg-[rgb(242,247,254)] font-[Inter-SemiBold] text-[#23262A]'
                                                            : 'border-[rgba(143,143,143,0.45)] bg-white font-[Inter-Regular] text-[#23262A]'
                                                    }`}
                                                >
                                                    {item}
                                                </button>
                                            ))}
                                            {recruiterEducationOptions.length > 5 ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setJobsEducationExpanded((v) => !v)}
                                                    className="cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] px-[14px] py-[8px] text-[14px] font-[Inter-SemiBold] text-[#3A88EF]"
                                                >
                                                    {jobsEducationExpanded ? 'View Less' : 'View More'}
                                                </button>
                                            ) : null}
                                        </div>
                                        <div className="flex items-stretch gap-[10px] border-t border-[rgba(143,143,143,0.2)] p-[14px]">
                                            <button
                                                type="button"
                                                className="cursor-pointer rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white p-[14px_22px] text-center text-[14px] font-[Inter-SemiBold] text-[#666]"
                                                onClick={() => {
                                                    setJobsEducationDraft('')
                                                    const qs = new URLSearchParams(searchParams.toString())
                                                    recruiterEducationFilterNames.forEach((name) => {
                                                        qs.delete(`filters[${name}]`)
                                                    })
                                                    qs.delete('education')
                                                    const next = qs.toString()
                                                    router.replace(next ? `${pathname}?${next}` : pathname)
                                                }}
                                            >
                                                Clear
                                            </button>
                                            <button
                                                type="button"
                                                className="flex-1 cursor-pointer rounded-[6px] bg-[#23262A] py-[14px] text-center text-[14px] font-[Inter-Medium] text-white"
                                                onClick={() => {
                                                    setJobsEducation(jobsEducationDraft || 'Select')
                                                    const qs = new URLSearchParams(searchParams.toString())
                                                    recruiterEducationFilterNames.forEach((name) => {
                                                        qs.delete(`filters[${name}]`)
                                                    })
                                                    if (recruiterEducationFilterDef && jobsEducationDraft) {
                                                        const filters = {}
                                                        const ser = serializeGetItemFilterValue(
                                                            recruiterEducationFilterDef.name,
                                                            recruiterEducationFilterDef.type === 'min-max' ? 'min-max' : 'button',
                                                            Boolean(recruiterEducationFilterDef.multiselect),
                                                            jobsEducationDraft
                                                        )
                                                        if (ser != null) filters[recruiterEducationFilterDef.name] = ser
                                                        appendGetItemFiltersToSearchParams(qs, filters)
                                                    }
                                                    if (jobsEducationDraft) qs.set('education', toUrlFilterValue(jobsEducationDraft))
                                                    else qs.delete('education')
                                                    const next = qs.toString()
                                                    router.replace(next ? `${pathname}?${next}` : pathname)
                                                    setOpenKey(null)
                                                }}
                                            >
                                                Apply Filters
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

                        <div className="relative flex min-w-[220px] flex-1 items-center justify-between gap-2 p-[10px]">
                            <button
                                type="button"
                                className={`text-left rtl:text-right flex w-full items-center justify-between gap-2 cursor-pointer ${filtersOpen ? '' : ''}`}
                                onClick={() => {
                                    setOpenKey(null)
                                    setJobsKeywordOpen(false)
                                    setFiltersOpen((v) => !v)
                                }}
                            >
                                <div>
                                    <h4 className="mb-[4px] text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000]">Filters</h4>
                                    <p className="w-[155px] truncate text-[14px] font-[Inter-Regular] leading-[18px] text-[#8F8F8F]">
                                        {jobsSideFilterSummary}
                                    </p>
                                </div>
                                <DownArrowIcon className={`h-[20px] w-[20px] transition-transform ${filtersOpen ? 'rotate-180' : ''}`} stroke="#000" />
                            </button>
                            <JobsProductsFiltersPanel
                                open={filtersOpen}
                                onClose={() => setFiltersOpen(false)}
                                apiFilters={jobsApiFilters}
                                hideEducation={isRecruiterContext}
                                onApply={(payload) => {
                                    const { dynamicFilters, category_slug: panelCategorySlug } = payload || {}
                                    const qs = new URLSearchParams(searchParams.toString())
                                    const existingFiltersByName = {}
                                    const filterKeys = []
                                    qs.forEach((value, key) => {
                                        if (!key.startsWith('filters[')) return
                                        filterKeys.push(key)
                                        const m = key.match(/^filters\[(.*)\]$/)
                                        const filterName = m?.[1] ? String(m[1]).trim() : ''
                                        if (!filterName) return
                                        existingFiltersByName[filterName] = String(value ?? '')
                                    })
                                    filterKeys.forEach((k) => qs.delete(k))

                                    if (Object.prototype.hasOwnProperty.call(payload || {}, 'category_slug')) {
                                        if (panelCategorySlug) qs.set('category_slug', String(panelCategorySlug))
                                        else qs.delete('category_slug')
                                    }

                                    const filters = {}
                                    const defs = Array.isArray(jobsApiFilters) ? jobsApiFilters : []
                                    const byName = new Map(defs.map((d) => [String(d?.name || '').trim(), d]))
                                    const providedNames = new Set()

                                    if (dynamicFilters && typeof dynamicFilters === 'object') {
                                        for (const name of Object.keys(dynamicFilters)) {
                                            const cleanName = String(name || '').trim()
                                            providedNames.add(cleanName)
                                            const def = byName.get(cleanName)
                                            if (!def) continue
                                            const ser = serializeGetItemFilterValue(
                                                cleanName,
                                                def.type === 'min-max' ? 'min-max' : 'button',
                                                Boolean(def.multiselect),
                                                dynamicFilters[name]
                                            )
                                            if (ser != null) filters[cleanName] = ser
                                        }
                                    }

                                    const employmentDef = defs.find((f) =>
                                        String(f?.name || '').trim().toLowerCase().includes('employment')
                                    )
                                    const educationDef = defs.find((f) =>
                                        String(f?.name || '').trim().toLowerCase().includes('education')
                                    )
                                    const pickSingle = (raw) => {
                                        if (Array.isArray(raw)) return String(raw[0] ?? '').trim()
                                        return String(raw ?? '').trim()
                                    }
                                    if (employmentDef?.name && dynamicFilters && typeof dynamicFilters === 'object') {
                                        const selected = pickSingle(dynamicFilters[employmentDef.name])
                                        if (selected) qs.set('employment_type', toUrlFilterValue(selected))
                                        else qs.delete('employment_type')
                                    }
                                    if (!isRecruiterContext && educationDef?.name && dynamicFilters && typeof dynamicFilters === 'object') {
                                        const selected = pickSingle(dynamicFilters[educationDef.name])
                                        if (selected) qs.set('education', toUrlFilterValue(selected))
                                        else qs.delete('education')
                                    }

                                    // Keep salary/experience filters selected from chips when applying "More Filters".
                                    Object.entries(existingFiltersByName).forEach(([name, value]) => {
                                        const n = name.toLowerCase()
                                        const recruiterEducationSet = new Set(
                                            recruiterEducationFilterNames.map((x) => String(x).toLowerCase())
                                        )
                                        const isSalaryOrExperience =
                                            n === 'expected salary' ||
                                            n === 'monthly salary' ||
                                            n === 'salary' ||
                                            n === 'work experience' ||
                                            n === 'minimum work experience' ||
                                            n === 'experience'
                                        const isRecruiterEducation =
                                            isRecruiterContext && recruiterEducationSet.has(n)
                                        if (!isSalaryOrExperience && !isRecruiterEducation) return
                                        if (providedNames.has(name)) return
                                        if (value) filters[name] = value
                                    })

                                    appendGetItemFiltersToSearchParams(qs, filters)
                                    const nextUrl = qs.toString() ? `${pathname}?${qs.toString()}` : pathname
                                    router.replace(nextUrl)
                                    router.refresh()
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (mode === 'property') {
        return (
            <div ref={wrapRef} className="w-full">
                <div className="hide_scrollbar min-w-0">
                    <div className="flex w-full min-w-0 flex-nowrap items-stretch rounded-[16px] border border-[rgba(143,143,143,0.22)] bg-white p-[6px] shadow-[0_2px_14px_rgba(0,0,0,0.06)] max-sm:flex-col max-sm:flex-wrap max-sm:items-stretch">
                        {!segmentIsNewProjects ? (
                            <div className="relative min-w-[112px] shrink-0 border-e border-[rgba(143,143,143,0.22)] max-sm:border-r-0 max-sm:border-b max-sm:min-w-full">
                                <button
                                    type="button"
                                    className={`flex w-full min-w-[112px] justify-between items-center p-[10px] text-left rtl:text-right cursor-pointer ${openKey === 'property-purpose' ? 'bg-[#F0F0F0]' : ''}`}
                                    onClick={() => {
                                        setFiltersOpen(false)
                                        setOpenKey((k) => (k === 'property-purpose' ? null : 'property-purpose'))
                                    }}
                                >
                                    <div>
                                        <h4 className="mb-[4px] text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000]">Purpose</h4>
                                        <p className="truncate text-[14px] font-[Inter-Regular] leading-[18px] text-[#000]">{propertyPurpose}</p>
                                    </div>
                                    <div>
                                        <DownArrowIcon className="w-[20px] h-[20px]" stroke="#000" />
                                    </div>
                                </button>
                                {openKey === 'property-purpose' ? (
                                    <div
                                        className="absolute left-0 rtl:right-0 rtl:left-auto top-[calc(100%+8px)] z-[95] w-[260px] overflow-hidden rounded-[10px] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] "
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            type="button"
                                            className={`block w-full cursor-pointer border-b border-[rgba(143,143,143,0.16)] px-[16px] py-[14px] text-left rtl:text-right text-[14px] ${propertyPurpose === 'Rent' ? 'font-[Inter-SemiBold] text-[#23262A]' : 'font-[Inter-Regular] text-[#23262A]'} hover:bg-[#F5F5F5]`}
                                            onClick={() => {
                                                setPropertyPurpose('Rent')
                                                setOpenKey(null)
                                            }}
                                        >
                                            Rent
                                        </button>
                                        <button
                                            type="button"
                                            className={`block w-full cursor-pointer px-[16px] py-[14px] text-left rtl:text-right text-[14px] ${propertyPurpose === 'Buy' ? 'font-[Inter-SemiBold] text-[#23262A]' : 'font-[Inter-Regular] text-[#23262A]'} hover:bg-[#F5F5F5]`}
                                            onClick={() => {
                                                setPropertyPurpose('Buy')
                                                setOpenKey(null)
                                            }}
                                        >
                                            Buy
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

                        <div className="relative flex min-h-0 min-w-0 max-w-[min(100%,380px)] flex-[1_1_240px] basis-[min(100%,380px)] items-center justify-between gap-[6px] border-e border-[rgba(143,143,143,0.22)] p-[10px] max-sm:max-w-none max-sm:basis-auto max-sm:border-r-0 max-sm:border-b max-sm:min-w-full">
                            <div className="min-w-0 flex-1">
                                <h4 className="mb-[4px] text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000]">Location</h4>
                                <input
                                    type="text"
                                    value={propertyLocation}
                                    onChange={(e) => {
                                        setPropertyLocation(e.target.value)
                                        setPropertyLocationOpen(true)
                                        setOpenKey(null)
                                        setFiltersOpen(false)
                                    }}
                                    onFocus={() => {
                                        setPropertyLocationOpen(true)
                                        setOpenKey(null)
                                        setFiltersOpen(false)
                                    }}
                                    placeholder="Enter location"
                                    className="w-full truncate border-none bg-transparent text-[14px] font-[Inter-Regular] leading-[18px] text-[#23262A] outline-none placeholder:text-[#8F8F8F]"
                                />
                            </div>
                            <LocationIcon className="h-[20px] w-[20px] shrink-0" />
                            {propertyLocationOpen ? (
                                <div
                                    className="absolute left-0 rtl:right-0 rtl:left-auto top-[calc(100%+8px)] z-[95] w-[360px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]"
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <div className="max-h-[320px] overflow-y-auto">
                                        {filteredPropertyLocations.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                className="flex w-full cursor-pointer items-start justify-between gap-[10px] border-b border-[rgba(143,143,143,0.2)] px-[14px] py-[10px] text-left rtl:text-right last:border-b-0 hover:bg-[#F7F7F7]"
                                                onClick={() => {
                                                    const selectedCity = String(item.name || '').trim()
                                                    const subtitleParts = String(item.subtitle || '')
                                                        .split(',')
                                                        .map((part) => part.trim())
                                                        .filter(Boolean)
                                                    const selectedCountry = subtitleParts.length
                                                        ? subtitleParts[subtitleParts.length - 1]
                                                        : ''
                                                    setPropertyLocation(item.name)
                                                    setPropertyLocationOpen(false)
                                                    const qs = new URLSearchParams(searchParams.toString())
                                                    if (selectedCity) qs.set('city', selectedCity)
                                                    else qs.delete('city')
                                                    if (selectedCountry) qs.set('country', selectedCountry)
                                                    else qs.delete('country')
                                                    qs.set('page', '1')
                                                    const nextUrl = qs.toString() ? `${pathname}?${qs.toString()}` : pathname
                                                    router.replace(nextUrl)
                                                    router.refresh()
                                                }}
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-[14px] font-[Inter-Regular] text-[#23262A]">
                                                        {renderHighlight(item.name, locationQuery)}
                                                    </p>
                                                    <p className="truncate pt-[2px] text-[12px] font-[Inter-Regular] text-[#666]">
                                                        {item.subtitle}
                                                    </p>
                                                </div>
                                                <p className="shrink-0 pt-[4px] text-[12px] font-[Inter-Regular] text-[#666]">{item.type}</p>
                                            </button>
                                        ))}
                                        {propertyLocationSuggestionsLoading ? (
                                            <p className="px-[14px] py-[12px] text-[13px] font-[Inter-Regular] text-[#8F8F8F]">Loading locations...</p>
                                        ) : null}
                                        {!propertyLocationSuggestionsLoading && filteredPropertyLocations.length === 0 ? (
                                            <p className="px-[14px] py-[12px] text-[13px] font-[Inter-Regular] text-[#8F8F8F]">No locations found</p>
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="relative w-max min-w-[200px] shrink-0 border-e border-[rgba(143,143,143,0.22)] max-sm:w-full max-sm:border-r-0 max-sm:border-b max-sm:min-w-full">
                            <button
                                type="button"
                                className={`flex w-full min-w-[200px] items-center justify-between gap-[6px] p-[10px] text-left rtl:text-right cursor-pointer ${openKey === 'property-type' ? 'bg-[#F0F0F0]' : ''}`}
                                onClick={() => {
                                    setFiltersOpen(false)
                                    setOpenKey((k) => (k === 'property-type' ? null : 'property-type'))
                                }}
                            >
                                <div className="min-w-0 text-left rtl:text-right">
                                    <h4 className="mb-[4px] whitespace-nowrap text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000]">Property Type</h4>
                                    <p className="truncate text-[14px] font-[Inter-Regular] leading-[18px] text-[#000]">{propertyType}</p>
                                </div>
                                <DownArrowIcon className={`h-[20px] w-[20px] shrink-0 transition-transform ${openKey === 'property-type' ? 'rotate-180' : ''}`} stroke="#000" />
                            </button>
                            {openKey === 'property-type' ? (
                                <div
                                    className="absolute left-0 top-[calc(100%+8px)] z-[95] w-[430px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] max-sm:w-full"
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <div className="grid grid-cols-[180px_1fr] max-sm:grid-cols-1">
                                        <div className="border-r border-[rgba(143,143,143,0.2)] bg-[#F5F5F5]">
                                            {propertyTypeGroups.map((group) => (
                                                <button
                                                    key={group}
                                                    type="button"
                                                    onMouseEnter={() => setPropertyTypeGroup(group)}
                                                    onClick={() => setPropertyTypeGroup(group)}
                                                    className={`cursor-pointer flex w-full items-center justify-between px-[14px] py-[12px] text-left rtl:text-right text-[14px] ${propertyTypeGroup === group ? '' : ''} hover:bg-white`}
                                                >
                                                    <p className={`truncate text-[14px] leading-[18px] text-[#000] ${propertyTypeGroup === group ? 'font-[Inter-SemiBold]' : 'font-[Inter-Regular]'}`}>{group}</p>
                                                    <RightArrowIcon className="w-[20px] h-[20px]" stroke="#000" />
                                                </button>
                                            ))}
                                        </div>
                                        <div className="max-h-[280px] overflow-y-auto bg-white">
                                            {(propertyTypeMenu[propertyTypeGroup] || []).map((item) => (
                                                <Link
                                                    key={`${item.slug}-${item.label}`}
                                                    href={`/products?mode=property&item=${encodeURIComponent(PURPOSE_ITEM_LABEL[propertyPurpose] || 'property-for-rent')}&purpose=${propertyPurpose === 'Buy' ? 'sale' : 'rent'}&propertyType=${encodeURIComponent(item.label)}&category_slug=${encodeURIComponent(item.slug)}`}
                                                    onClick={() => {
                                                        setPropertyType(item.label)
                                                    }}
                                                    className={`block w-full px-[16px] py-[11px] text-left rtl:text-right text-[14px] ${propertyType === item.label ? 'font-[Inter-SemiBold] text-[#23262A] bg-[#F5F5F5]' : 'font-[Inter-Regular] text-[#23262A]'} hover:bg-[#F5F5F5]`}
                                                >
                                                    {item.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {!segmentIsNewProjects ? (
                            <div className="relative w-max min-w-[170px] shrink-0 border-e border-[rgba(143,143,143,0.22)] max-sm:w-full max-sm:border-r-0 max-sm:border-b max-sm:min-w-full">
                                <button
                                    type="button"
                                    className={`flex w-full min-w-[170px] items-center justify-between gap-[6px] p-[10px] text-left rtl:text-right cursor-pointer ${openKey === 'property-price' ? 'bg-[#F0F0F0]' : ''}`}
                                    onClick={() => {
                                        setFiltersOpen(false)
                                        setOpenKey((k) => {
                                            if (k === 'property-price') return null
                                            if (propertyPrice === 'Any') {
                                                setPropertyPriceFromDraft('')
                                                setPropertyPriceUpToDraft('')
                                            } else {
                                                const [from = '', up = ''] = propertyPrice.split(' - ')
                                                setPropertyPriceFromDraft(from === '0' ? '' : from)
                                                setPropertyPriceUpToDraft(up === 'Any' ? '' : up)
                                            }
                                            return 'property-price'
                                        })
                                    }}
                                >
                                    <div className="min-w-0">
                                        <h4 className="mb-[4px] text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000]">Price Range</h4>
                                        <p className="truncate text-[14px] font-[Inter-Regular] leading-[18px] text-[#8F8F8F]">{propertyPrice}</p>
                                    </div>
                                    <DownArrowIcon className={`h-[20px] w-[20px] shrink-0 transition-transform ${openKey === 'property-price' ? 'rotate-180' : ''}`} stroke="#000" />
                                </button>
                                {openKey === 'property-price' ? (
                                    <div
                                        className="absolute left-0 top-[calc(100%+8px)] z-[95] w-[360px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] max-sm:w-full"
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        <div className="grid grid-cols-2 gap-[12px] p-[14px]">
                                            <div>
                                                <label className="mb-[6px] block text-[12px] font-[Inter-Regular] leading-[14px] text-[#666]">
                                                    From
                                                </label>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={propertyPriceFromDraft}
                                                    onChange={(e) => setPropertyPriceFromDraft(e.target.value.replace(/[^\d]/g, ''))}
                                                    placeholder="0"
                                                    className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[14px_10px] text-[14px] font-[Inter-Regular] text-[#000] outline-none placeholder:text-[#8F8F8F]"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-[6px] block text-[12px] font-[Inter-Regular] leading-[14px] text-[#666]">
                                                    Up to
                                                </label>
                                                <input
                                                    type="text"
                                                    value={propertyPriceUpToDraft}
                                                    onChange={(e) => setPropertyPriceUpToDraft(e.target.value.replace(/[^\d]/g, ''))}
                                                    placeholder="Any"
                                                    className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[14px_10px] text-[14px] font-[Inter-Regular] text-[#000] outline-none placeholder:text-[#8F8F8F]"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-stretch gap-[10px] border-t border-[rgba(143,143,143,0.2)] p-[14px]">
                                            <button
                                                type="button"
                                                className="cursor-pointer rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white p-[14px_22px] text-center text-[14px] font-[Inter-SemiBold] text-[#666]"
                                                onClick={() => {
                                                    setPropertyPriceFromDraft('')
                                                    setPropertyPriceUpToDraft('')
                                                }}
                                            >
                                                Clear
                                            </button>
                                            <button
                                                type="button"
                                                className="flex-1 cursor-pointer rounded-[6px] bg-[#23262A] py-[14px] text-center text-[14px] font-[Inter-Medium] text-white"
                                                onClick={() => {
                                                    const ft = propertyPriceFromDraft.trim()
                                                    const ut = propertyPriceUpToDraft.trim()
                                                    const qs = new URLSearchParams(searchParams.toString())
                                                    if (!ft && !ut) {
                                                        setPropertyPrice('Any')
                                                        syncPropertyPriceInSearchParams(qs, '', '')
                                                    } else {
                                                        const from = ft || '0'
                                                        const up = ut || 'Any'
                                                        setPropertyPrice(`${from} - ${up}`)
                                                        syncPropertyPriceInSearchParams(qs, ft, ut)
                                                    }
                                                    const next = qs.toString()
                                                    router.replace(next ? `${pathname}?${next}` : pathname)
                                                    setOpenKey(null)
                                                }}
                                            >
                                                Apply Filters
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

                        {segmentIsNewProjects
                            ? [
                                  { def: newProjectsMainBarBedroomsDef, openId: 'np-beds-api' },
                                  { def: newProjectsMainBarCompletionDef, openId: 'np-completion-api' },
                                  { def: newProjectsMainBarPreHandoverDef, openId: 'np-prehandover-api' },
                              ]
                                  .filter((x) => x.def)
                                  .map(({ def: npDef, openId }) => {
                                      const fk = npFilterKey(npDef)
                                      const draftVal = npMainBarDrafts[fk]
                                      const urlSummary = summaryLabelForNewProjectsMainBarFilter(
                                          npDef,
                                          searchParams,
                                          propertyApiFilters,
                                      )
                                      const isOpen = openKey === openId
                                      const line = isOpen
                                          ? previewNewProjectsMainBarDraft(npDef, draftVal)
                                          : urlSummary
                                      return (
                                          <div
                                              key={openId}
                                              className="relative w-max min-w-[120px] max-w-[min(100vw-32px,320px)] shrink-0 border-e border-[rgba(143,143,143,0.22)] max-sm:w-full max-sm:max-w-none max-sm:border-r-0 max-sm:border-b max-sm:min-w-full"
                                          >
                                              <button
                                                  type="button"
                                                  className={`flex w-full items-start justify-between gap-[8px] p-[10px] text-left rtl:text-right cursor-pointer ${
                                                      isOpen ? 'bg-[#F0F0F0]' : ''
                                                  }`}
                                                  onClick={() => {
                                                      setFiltersOpen(false)
                                                      seedNpMainBarDraftForDef(npDef)
                                                      setOpenKey((k) => (k === openId ? null : openId))
                                                  }}
                                              >
                                                  <div className="min-w-0 flex-1 text-left rtl:text-right">
                                                      <h4 className="mb-[4px] whitespace-nowrap text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000]">
                                                          {npDef.name}
                                                      </h4>
                                                      <p className="truncate text-[14px] font-[Inter-Regular] leading-[18px] text-[#8F8F8F]">
                                                          {line}
                                                      </p>
                                                  </div>
                                                  <DownArrowIcon
                                                      className={`h-[20px] w-[20px] shrink-0 transition-transform ${
                                                          isOpen ? 'rotate-180' : ''
                                                      }`}
                                                      stroke="#000"
                                                  />
                                              </button>
                                              {isOpen ? (
                                                  <div
                                                      className="absolute left-0 top-[calc(100%+8px)] z-[95] w-[min(100vw-24px,360px)] max-h-[min(70vh,440px)] overflow-y-auto overflow-x-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] max-sm:w-full"
                                                      onMouseDown={(e) => e.stopPropagation()}
                                                  >
                                                      {npDef.type === 'min-max' ? (
                                                          <div className="grid grid-cols-2 gap-[12px] p-[14px]">
                                                              <div>
                                                                  <label className="mb-[6px] block text-[12px] font-[Inter-Regular] leading-[14px] text-[#666]">
                                                                      From
                                                                  </label>
                                                                  <input
                                                                      type="text"
                                                                      inputMode="numeric"
                                                                      value={String(
                                                                          (draftVal &&
                                                                          typeof draftVal === 'object' &&
                                                                          !Array.isArray(draftVal)
                                                                              ? draftVal.min
                                                                              : '') ?? '',
                                                                      )}
                                                                      onChange={(e) => {
                                                                          const raw = e.target.value.replace(
                                                                              /\D/g,
                                                                              '',
                                                                          )
                                                                          setNpMainBarDrafts((prev) => {
                                                                              const prevMm =
                                                                                  prev[fk] &&
                                                                                  typeof prev[fk] === 'object' &&
                                                                                  !Array.isArray(prev[fk])
                                                                                      ? prev[fk]
                                                                                      : { min: '', max: '' }
                                                                              return {
                                                                                  ...prev,
                                                                                  [fk]: { ...prevMm, min: raw },
                                                                              }
                                                                          })
                                                                      }}
                                                                      placeholder="0"
                                                                      className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[14px_10px] text-[14px] font-[Inter-Regular] text-[#000] outline-none placeholder:text-[#8F8F8F]"
                                                                  />
                                                              </div>
                                                              <div>
                                                                  <label className="mb-[6px] block text-[12px] font-[Inter-Regular] leading-[14px] text-[#666]">
                                                                      Up to
                                                                  </label>
                                                                  <input
                                                                      type="text"
                                                                      inputMode="numeric"
                                                                      value={String(
                                                                          (draftVal &&
                                                                          typeof draftVal === 'object' &&
                                                                          !Array.isArray(draftVal)
                                                                              ? draftVal.max
                                                                              : '') ?? '',
                                                                      )}
                                                                      onChange={(e) => {
                                                                          const raw = e.target.value.replace(
                                                                              /\D/g,
                                                                              '',
                                                                          )
                                                                          setNpMainBarDrafts((prev) => {
                                                                              const prevMm =
                                                                                  prev[fk] &&
                                                                                  typeof prev[fk] === 'object' &&
                                                                                  !Array.isArray(prev[fk])
                                                                                      ? prev[fk]
                                                                                      : { min: '', max: '' }
                                                                              return {
                                                                                  ...prev,
                                                                                  [fk]: { ...prevMm, max: raw },
                                                                              }
                                                                          })
                                                                      }}
                                                                      placeholder="Any"
                                                                      className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[14px_10px] text-[14px] font-[Inter-Regular] text-[#000] outline-none placeholder:text-[#8F8F8F]"
                                                                  />
                                                              </div>
                                                          </div>
                                                      ) : Array.isArray(npDef.values) && npDef.values.length ? (
                                                          <div className="flex flex-wrap gap-[8px] p-[14px]">
                                                              {npDef.values.map((v) => (
                                                                  <button
                                                                      key={String(v)}
                                                                      type="button"
                                                                      onClick={() => {
                                                                          setNpMainBarDrafts((prev) => {
                                                                              const cur = prev[fk]
                                                                              if (npDef.multiselect) {
                                                                                  const arr = Array.isArray(cur)
                                                                                      ? [...cur]
                                                                                      : cur != null && cur !== ''
                                                                                        ? [cur]
                                                                                        : []
                                                                                  const on =
                                                                                      isDynamicButtonOptionSelected(
                                                                                          npDef.name,
                                                                                          true,
                                                                                          arr,
                                                                                          v,
                                                                                      )
                                                                                  return {
                                                                                      ...prev,
                                                                                      [fk]: on
                                                                                          ? arr.filter(
                                                                                                (x) =>
                                                                                                    !isDynamicButtonOptionSelected(
                                                                                                        npDef.name,
                                                                                                        true,
                                                                                                        [x],
                                                                                                        v,
                                                                                                    ),
                                                                                            )
                                                                                          : [...arr, v],
                                                                                  }
                                                                              }
                                                                              const on = isDynamicButtonOptionSelected(
                                                                                  npDef.name,
                                                                                  false,
                                                                                  cur,
                                                                                  v,
                                                                              )
                                                                              return { ...prev, [fk]: on ? '' : v }
                                                                          })
                                                                      }}
                                                                      className={`cursor-pointer rounded-full border px-[16px] py-[8px] text-[14px] leading-[18px] ${
                                                                          isDynamicButtonOptionSelected(
                                                                              npDef.name,
                                                                              Boolean(npDef.multiselect),
                                                                              draftVal,
                                                                              v,
                                                                          )
                                                                              ? 'border-[#3A88EF] bg-[rgba(58,136,239,0.1)] text-[#23262A] font-[Inter-SemiBold]'
                                                                              : 'border-[rgba(143,143,143,0.45)] bg-white text-[#23262A] font-[Inter-Regular]'
                                                                      }`}
                                                                  >
                                                                      {v}
                                                                  </button>
                                                              ))}
                                                          </div>
                                                      ) : (
                                                          <p className="p-[14px] text-[13px] font-[Inter-Regular] text-[#8F8F8F]">
                                                              No options for this filter.
                                                          </p>
                                                      )}
                                                      <div className="flex items-stretch gap-[10px] border-t border-[rgba(143,143,143,0.2)] p-[14px]">
                                                          <button
                                                              type="button"
                                                              className="cursor-pointer rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white p-[14px_22px] text-center text-[14px] font-[Inter-SemiBold] text-[#666]"
                                                              onClick={() => {
                                                                  if (npDef.type === 'min-max') {
                                                                      setNpMainBarDrafts((p) => ({
                                                                          ...p,
                                                                          [fk]: { min: '', max: '' },
                                                                      }))
                                                                  } else if (npDef.multiselect) {
                                                                      setNpMainBarDrafts((p) => ({ ...p, [fk]: [] }))
                                                                  } else {
                                                                      setNpMainBarDrafts((p) => ({ ...p, [fk]: '' }))
                                                                  }
                                                              }}
                                                          >
                                                              Clear
                                                          </button>
                                                          <button
                                                              type="button"
                                                              className="flex-1 cursor-pointer rounded-[6px] bg-[#23262A] py-[14px] text-center text-[14px] font-[Inter-Medium] text-white"
                                                              onClick={() => applyNewProjectsMainBarApiFilter(npDef)}
                                                          >
                                                              Apply Filters
                                                          </button>
                                                      </div>
                                                  </div>
                                              ) : null}
                                          </div>
                                      )
                                  })
                            : null}

                        {!segmentIsNewProjects || !newProjectsMainBarBedroomsDef ? (
                            <div className="relative min-w-[120px] shrink-0 border-e border-[rgba(143,143,143,0.22)] max-sm:border-r-0 max-sm:border-b max-sm:min-w-full">
                                <button
                                    type="button"
                                    className={`flex w-full items-center justify-between gap-[6px] p-[10px] text-left  rtl:text-right cursor-pointer ${openKey === 'property-beds' ? 'bg-[#F0F0F0]' : ''}`}
                                    onClick={() => {
                                        setFiltersOpen(false)
                                        setPropertyBedsExpanded(false)
                                        setPropertyBedsDraft(propertyBeds === 'Any' ? '' : propertyBeds)
                                        setOpenKey((k) => (k === 'property-beds' ? null : 'property-beds'))
                                    }}
                                >
                                    <div className="min-w-0">
                                        <h4 className="mb-[4px] text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000]">Beds</h4>
                                        <p className="truncate text-[14px] font-[Inter-Regular] leading-[18px] text-[#8F8F8F]">{propertyBeds}</p>
                                    </div>
                                    <DownArrowIcon className={`h-[20px] w-[20px] shrink-0 transition-transform ${openKey === 'property-beds' ? 'rotate-180' : ''}`} stroke="#000" />
                                </button>
                                {openKey === 'property-beds' ? (
                                    <div
                                        className="absolute left-0 top-[calc(100%+8px)] z-[95] w-[340px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] max-sm:w-full"
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex flex-wrap gap-[8px] p-[14px]">
                                            {(propertyBedsExpanded ? PROPERTY_BED_OPTIONS : PROPERTY_BED_OPTIONS.slice(0, 8)).map((bed) => (
                                                <button
                                                    key={bed}
                                                    type="button"
                                                    onClick={() => setPropertyBedsDraft(bed)}
                                                    className={`cursor-pointer rounded-full border px-[16px] py-[8px] text-[14px] leading-[18px] ${propertyBedsDraft === bed
                                                        ? 'border-[#3A88EF] bg-[rgba(58,136,239,0.1)] text-[#23262A] font-[Inter-SemiBold]'
                                                        : 'border-[rgba(143,143,143,0.45)] bg-white text-[#23262A] font-[Inter-Regular]'
                                                        }`}
                                                >
                                                    {bed}
                                                </button>
                                            ))}
                                            {PROPERTY_BED_OPTIONS.length > 8 ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setPropertyBedsExpanded((v) => !v)}
                                                    className="cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] px-[16px] py-[8px] text-[14px] font-[Inter-SemiBold] text-[#3A88EF]"
                                                >
                                                    {propertyBedsExpanded ? 'View Less' : 'View More'}
                                                </button>
                                            ) : null}
                                        </div>
                                        <div className="flex items-stretch gap-[10px] border-t border-[rgba(143,143,143,0.2)] p-[14px]">
                                            <button
                                                type="button"
                                                className="cursor-pointer rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white p-[14px_22px] text-center text-[14px] font-[Inter-SemiBold] text-[#666]"
                                                onClick={() => setPropertyBedsDraft('')}
                                            >
                                                Clear
                                            </button>
                                            <button
                                                type="button"
                                                className="flex-1 cursor-pointer rounded-[6px] bg-[#23262A] py-[14px] text-center text-[14px] font-[Inter-Medium] text-white"
                                                onClick={() => {
                                                    const settled = propertyBedsDraft || 'Any'
                                                    setPropertyBeds(settled)
                                                    const qs = new URLSearchParams(searchParams.toString())
                                                    syncPropertyBedsInSearchParams(qs, settled)
                                                    const next = qs.toString()
                                                    router.replace(next ? `${pathname}?${next}` : pathname)
                                                    setOpenKey(null)
                                                }}
                                            >
                                                Apply Filters
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

                        <div className="relative flex min-w-[220px] max-w-[min(100vw-24px,380px)] shrink-0 items-center justify-between gap-2 p-[10px] max-sm:max-w-none max-sm:min-w-full">
                            <button
                                type="button"
                                className={`flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 text-left rtl:text-right ${filtersOpen ? '' : ''}`}
                                onClick={() => {
                                    setOpenKey(null)
                                    setFiltersOpen((v) => !v)
                                }}
                            >
                                <div className="min-w-0 flex-1 pr-[6px] text-left rtl:text-right">
                                    <h4 className="mb-[4px] text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000]">Filters</h4>
                                    <p className="line-clamp-2 break-words text-[14px] font-[Inter-Regular] leading-[18px] text-[#8F8F8F]">
                                        {propertySideFilterSummary}
                                    </p>
                                </div>
                                <DownArrowIcon className={`w-[20px] h-[20px] transition-transform ${filtersOpen ? 'rotate-180' : ''}`} stroke="#000" />
                            </button>
                            <PropertyProductsFiltersPanel
                                open={filtersOpen}
                                onClose={() => setFiltersOpen(false)}
                                purpose={propertyPurpose === 'Buy' ? 'sale' : 'rent'}
                                apiFilters={propertyApiFilters}
                                hideStaticSections={segmentIsNewProjects}
                                hideApiFilterWhen={(item) =>
                                    segmentIsNewProjects && isNewProjectsMainBarApiFilter(item)
                                }
                                initialAgency={searchParams?.get('agency') || ''}
                                hydration={propertyFiltersHydration}
                                onApply={(payload) => {
                                    const {
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
                                    } = payload || {}
                                    setFilterKeywords(keywords)
                                    const pt = realEstateType?.[0]
                                    const agencyTrimmed = agency?.trim()
                                    const newProjListing = isNewProjectsPropertyListingFromParams(searchParams)
                                    const qs = new URLSearchParams()
                                    qs.set('mode', 'property')
                                    if (newProjListing) {
                                        const seg = searchParams.get('segment')?.trim()
                                        if (seg) qs.set('segment', seg)
                                        const itemFromUrl = searchParams.get('item')?.trim()
                                        if (itemFromUrl) qs.set('item', itemFromUrl)
                                        qs.set('purpose', searchParams.get('purpose')?.trim() || 'sale')
                                        const parentSlug = searchParams.get('slug')?.trim()
                                        if (parentSlug) qs.set('slug', parentSlug)
                                    } else {
                                        qs.set('item', PURPOSE_ITEM_LABEL[propertyPurpose] || 'property-for-rent')
                                        qs.set('purpose', propertyPurpose === 'Buy' ? 'sale' : 'rent')
                                    }
                                    if (pt) {
                                        setPropertyTypeGroup(
                                            Object.entries(propertyTypeMenu).find(([, items]) =>
                                                items.some((i) => i.label === pt)
                                            )?.[0] || 'Residential'
                                        )
                                        setPropertyType(pt)
                                        qs.set('propertyType', pt)
                                        qs.set('category_slug', findPropertyTypeSlugInMenu(propertyTypeMenu, pt))
                                        if (newProjListing) {
                                            const parentSlug = searchParams.get('slug')?.trim()
                                            if (parentSlug) qs.set('slug', parentSlug)
                                            const seg = searchParams.get('segment')?.trim()
                                            if (seg) qs.set('segment', seg)
                                        }
                                    } else {
                                        const ptExisting = searchParams.get('propertyType')?.trim()
                                        const cid = searchParams.get('category_id')?.trim()
                                        const cslug = searchParams.get('category_slug')?.trim()
                                        if (ptExisting) qs.set('propertyType', ptExisting)
                                        if (cid) qs.set('category_id', cid)
                                        if (cslug) qs.set('category_slug', cslug)
                                        if (newProjListing) {
                                            const parentSlug = searchParams.get('slug')?.trim()
                                            if (parentSlug) qs.set('slug', parentSlug)
                                            const seg = searchParams.get('segment')?.trim()
                                            if (seg) qs.set('segment', seg)
                                        }
                                        if (!ptExisting && !cid) {
                                            setPropertyType('All in Residential')
                                            setPropertyTypeGroup('Residential')
                                        }
                                    }

                                    if (agencyTrimmed) qs.set('agency', agencyTrimmed)
                                    if (keywords?.trim()) {
                                        qs.set('keyword', keywords.trim())
                                        qs.set('search', keywords.trim())
                                    }
                                    if (adsWithVideo) qs.set('hasVideo', '1')
                                    if (adsWith360) qs.set('has360', '1')

                                    const filters = {}
                                    const hasApiAmenitiesFilter = (propertyApiFilters || []).some(
                                        (f) => String(f?.name || '').trim().toLowerCase() === 'amenities'
                                    )
                                    mergeProductsPanelStaticFilters(filters, {
                                        bath,
                                        sizeFrom,
                                        sizeTo,
                                        amenities: hasApiAmenitiesFilter ? [] : amenities,
                                        listedBy,
                                        rentPaid,
                                    })
                                    const allowedDynKeys = new Set(
                                        (propertyApiFilters || []).map(
                                            (f) => `cf_${f?.category_id}_${f?.sort_order}`
                                        )
                                    )
                                    const sanitizedDynamic = {}
                                    if (dynamicFilters && typeof dynamicFilters === 'object') {
                                        for (const k of Object.keys(dynamicFilters)) {
                                            if (allowedDynKeys.has(k)) sanitizedDynamic[k] = dynamicFilters[k]
                                        }
                                    }
                                    for (const def of propertyApiFilters || []) {
                                        if (!def || String(def.name || '').trim() === '') continue
                                        const dynKey = `cf_${def.category_id}_${def.sort_order}`
                                        if (!allowedDynKeys.has(dynKey)) continue
                                        const name = String(def.name).trim()
                                        const raw = sanitizedDynamic[dynKey]
                                        const type = def.type === 'min-max' ? 'min-max' : 'button'
                                        const multiselect = Boolean(def.multiselect)
                                        const ser = serializeGetItemFilterValue(name, type, multiselect, raw)
                                        if (ser == null) delete filters[name]
                                        else filters[name] = ser
                                    }
                                    appendGetItemFiltersToSearchParams(qs, filters)
                                    preservePropertyListingParams(searchParams, qs)

                                    const nextUrl = qs.toString() ? `${pathname}?${qs.toString()}` : pathname
                                    router.replace(nextUrl)
                                    router.refresh()
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div ref={wrapRef} className="w-full">
            <div className="hide_scrollbar">
                <div className="flex w-full min-w-0 gap-2 rounded-[16px] border border-[rgba(143,143,143,0.22)] bg-white p-[6px] shadow-[0_2px_14px_rgba(0,0,0,0.06)] max-sm:flex-col max-sm:items-stretch hide_scrollbar product_filter">
                    {/* City */}
                    <div className="relative flex flex-1 min-w-[120px] max-sm:min-w-0 max-sm:flex-[1_1_45%] p-[10px] border-e border-[rgba(143,143,143,0.22)] max-sm:border-r-0 max-sm:border-b">
                        <button
                            type="button"
                            className={`text-left rtl:text-right flex min-w-0 items-center justify-between gap-2 cursor-pointer w-full max-sm:rounded-l-[14px] sm:rounded-l-[14px] ${openKey === 'city' ? '' : ''}`}
                            onClick={() => {
                                setFiltersOpen(false)
                                setOpenKey((k) => {
                                    if (k === 'city') return null
                                    setCityDraft(city)
                                    return 'city'
                                })
                            }}
                        >
                            <div className='min-w-0 flex-1'>
                                <h4 className="text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000 mb-[4px]">City</h4>
                                <p className="truncate text-[14px] leading-[18px] font-[Inter-Regular] text-[#000]">
                                    {city}
                                </p>
                            </div>
                            <div className="shrink-0">
                                <DownArrowIcon className="w-[20px] h-[20px]" stroke="#000" />
                            </div>
                        </button>
                        {openKey === 'city' ? (
                            <div
                                className="absolute start-0 top-[calc(100%+8px)] z-[90] w-[min(100vw-32px,340px)] rounded-[10px] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] max-sm:left-0 max-sm:right-auto"
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <div onScroll={handleCityListScroll} className="flex max-h-[220px] flex-wrap gap-[10px] overflow-y-auto p-[14px] ">
                                    {cities.map((c) => {
                                        const selected = cityDraft === c.label
                                        return (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => setCityDraft(c.label)}
                                                className={`cursor-pointer rounded-full border p-[8px_14px] text-[14px] text-[#000] leading-[18px] transition-colors ${selected
                                                    ? 'border-[#3A88EF] bg-[#] font-[Inter-SemiBold] bg-[rgb(242,247,254)]'
                                                    : 'border-[rgba(143,143,143,0.45)] bg-white font-[Inter-Regular] hover:border-[#8F8F8F]'
                                                    }`}
                                            >
                                                {c.label}
                                            </button>
                                        )
                                    })}
                                </div>
                                <div className="mt-[14px] border-t border-[rgba(143,143,143,0.2)] p-[14px]">
                                    <button
                                        type="button"
                                        className="w-full cursor-pointer rounded-[6px] bg-[#23262A] py-[16px] text-center text-[14px] font-[Inter-Medium] text-white"
                                        onClick={() => {
                                            applySelectedCity(cityDraft, setCity)
                                            setOpenKey(null)
                                        }}
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>


                    {/* Make and model */}
                    <div className={`text-left rtl:text-right relative flex justify-center flex-col gap-[4px] flex-[1.35] min-w-[180px] max-sm:min-w-0 max-sm:flex-[1_1_55%] p-[10px] border-e border-[rgba(143,143,143,0.22)] max-sm:border-r-0 max-sm:border-b`}>
                        <h4 className="text-left rtl:text-right text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000]">Make And Model</h4>
                        <input
                            type="text"
                            value={makeModel}
                            onChange={(e) => {
                                setMakeModel(e.target.value)
                                setMakeModelOpen(true)
                                setOpenKey(null)
                                setFiltersOpen(false)
                            }}
                            onFocus={() => {
                                setMakeModelOpen(true)
                                setOpenKey(null)
                                setFiltersOpen(false)
                            }}
                            placeholder="Search Make, Model, or Trim"
                            className="w-full border-0 bg-transparent p-0 text-[13px] font-[Inter-Regular] leading-[18px] text-[#23262A] placeholder:text-[#8F8F8F] focus:outline-none focus:ring-0"
                        />
                        {makeModelOpen ? (
                            <div
                                className="absolute left-0 right-0 top-[calc(100%+8px)] z-[90] overflow-hidden rounded-[6px] border border-[rgba(143,143,143,0.3)] bg-white shadow-[0_10px_24px_rgba(0,0,0,0.18)] w-[min(100vw-32px,440px)]"
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <div className="p-[12px_14px]">
                                    <h4 className="text-[14px] font-[Inter-SemiBold] text-[#000]">Popular Searches</h4>
                                </div>
                                <div className="max-h-[min(45vh,320px)] overflow-y-auto overflow-x-hidden [scrollbar-width:thin]">
                                    {makeModelSuggestionsLoading ? (
                                        <div className="border-b border-[rgba(143,143,143,0.2)] p-[10px_14px] text-[14px] font-[Inter-Regular] text-[#8F8F8F] last:border-b-0">
                                            Searching…
                                        </div>
                                    ) : null}
                                    {!makeModelSuggestionsLoading &&
                                    !makeModel.trim() &&
                                    makeModelSuggestions.length === 0 ? (
                                        <div className="border-b border-[rgba(143,143,143,0.2)] p-[10px_14px] text-[13px] font-[Inter-Regular] text-[#8F8F8F] last:border-b-0">
                                            Type to search makes and models
                                        </div>
                                    ) : null}
                                    {!makeModelSuggestionsLoading &&
                                    makeModel.trim() &&
                                    makeModelSuggestions.length === 0 ? (
                                        <div className="border-b border-[rgba(143,143,143,0.2)] p-[10px_14px] text-[13px] font-[Inter-Regular] text-[#8F8F8F] last:border-b-0">
                                            No results found
                                        </div>
                                    ) : null}
                                    {makeModelSuggestions.map((item, idx) => {
                                        const label =
                                            String(item?.merged_name ?? '').trim() ||
                                            String(item?.make_name ?? '').trim()
                                        const href = buildMotorsMakeModelSearchHref(item)
                                        return (
                                            <Link
                                                key={`${item?.make_id}-${item?.model_id ?? 'm'}-${idx}`}
                                                href={href}
                                                prefetch={false}
                                                className="flex w-full cursor-pointer items-center justify-between gap-[10px] border-b border-[rgba(143,143,143,0.2)] p-[10px_14px] text-left rtl:text-right last:border-b-0 hover:bg-[#F7F7F7]"
                                                onClick={() => {
                                                    setMakeModel(label)
                                                    setMakeModelOpen(false)
                                                }}
                                            >
                                                <h4 className="truncate text-[14px] font-[Inter-Regular] text-[#000]">
                                                    {label}
                                                </h4>
                                                <p className="shrink-0 text-[14px] font-[Inter-Regular] text-[#666]">
                                                    {item?.item_count ?? 0} Ads
                                                </p>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        ) : null}
                    </div>


                    {/* Price range */}
                    <div className="relative flex flex-1 min-w-[120px] max-sm:hidden p-[10px] border-e border-[rgba(143,143,143,0.22)] max-sm:border-r-0 max-sm:border-b">
                        <button
                            type="button"
                            className={`text-left rtl:text-right flex items-center justify-between gap-2 cursor-pointer w-full ${openKey === 'price' ? '' : ''}`}
                            onClick={() => {
                                setFiltersOpen(false)
                                setOpenKey((k) => {
                                    if (k === 'price') return null
                                    setPriceFromDraft(priceFromApplied)
                                    setPriceUpToDraft(priceUpToApplied)
                                    return 'price'
                                })
                            }}
                        >
                            <div>
                                <h4 className="text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000 mb-[4px]">Price Range</h4>
                                <p
                                    className={`truncate text-[14px] leading-[18px] font-[Inter-Regular] text-[#000] ${priceSummary ? '' : ''}`}
                                >
                                    {priceSummary || 'Select'}
                                </p>
                            </div>
                            <div>
                                <DownArrowIcon className="w-[20px] h-[20px]" stroke="#000" />
                            </div>
                        </button>
                        {openKey === 'price' ? (
                            <div
                                className="absolute left-0 top-[calc(100%+8px)] z-[90] w-[min(100vw-32px,360px)] rounded-[10px] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]"
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <div className="grid grid-cols-2 gap-[12px] p-[14px]">
                                    <div>
                                        <label className="mb-[6px] block text-[12px] font-[Inter-Regular] leading-[14px] text-[#666]">
                                            From
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={priceFromDraft}
                                            onChange={(e) => setPriceFromDraft(e.target.value.replace(/[^\d]/g, ''))}
                                            placeholder="0"
                                            className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[14px_10px] text-[14px] font-[Inter-Regular] text-[#000] outline-none placeholder:text-[#8F8F8F]"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-[6px] block text-[12px] font-[Inter-Regular] leading-[14px] text-[#666]">
                                            Up to
                                        </label>
                                        <input
                                            type="text"
                                            value={priceUpToDraft}
                                            onChange={(e) => setPriceUpToDraft(e.target.value)}
                                            placeholder="Any"
                                            className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[14px_10px] text-[14px] font-[Inter-Regular] text-[#000] outline-none placeholder:text-[#8F8F8F]"
                                        />
                                    </div>
                                </div>
                                <div className="mt-[10px] flex items-stretch gap-[10px] border-t border-[rgba(143,143,143,0.2)] p-[14px]">
                                    <button
                                        type="button"
                                        className="cursor-pointer rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white p-[14px_22px] text-center text-[14px] font-[Inter-SemiBold] text-[#666]"
                                        onClick={() => {
                                            setPriceFromDraft('')
                                            setPriceUpToDraft('')
                                        }}
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        className="flex-1 cursor-pointer rounded-[6px] bg-[#23262A] py-[14px] text-center text-[14px] font-[Inter-Medium] text-white "
                                        onClick={() => {
                                            setPriceFromApplied(priceFromDraft.trim())
                                            setPriceUpToApplied(priceUpToDraft.trim())
                                            const qs = new URLSearchParams(searchParams.toString())
                                            qs.delete('minPrice')
                                            qs.delete('maxPrice')
                                            if (priceFromDraft.trim()) qs.set('minPrice', priceFromDraft.trim())
                                            if (priceUpToDraft.trim()) qs.set('maxPrice', priceUpToDraft.trim())
                                            qs.set('page', '1')
                                            const nextUrl = qs.toString() ? `${pathname}?${qs.toString()}` : pathname
                                            router.replace(nextUrl)
                                            router.refresh()
                                            setOpenKey(null)
                                        }}
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>


                    {/* Year */}
                    <div className="relative flex flex-1 min-w-[100px] p-[10px] border-e border-[rgba(143,143,143,0.22)] max-sm:border-r-0 max-sm:border-b">
                        <button
                            type="button"
                            className={`text-left rtl:text-right flex items-center justify-between gap-2 cursor-pointer w-full ${openKey === 'year' ? '' : ''}`}
                            onClick={() => {
                                setFiltersOpen(false)
                                setOpenKey((k) => {
                                    if (k === 'year') return null
                                    if (motorsYearOptions.length) {
                                        setYearOptionsDraft([...yearOptionsApplied])
                                    } else if (yearFromApplied || yearUpToApplied) {
                                        setYearFromDraft(yearFromApplied)
                                        setYearUpToDraft(yearUpToApplied)
                                    } else {
                                        setYearFromDraft(YEAR_DEFAULT_FROM)
                                        setYearUpToDraft(YEAR_DEFAULT_UP_TO)
                                    }
                                    return 'year'
                                })
                            }}
                        >
                            <div>
                                <h4 className="text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000 mb-[4px]">Year</h4>
                                <p className="truncate text-[14px] font-[Inter-Regular] leading-[18px] text-[#000]">
                                    {yearSummary || 'Select'}
                                </p>
                            </div>
                            <div>
                                <DownArrowIcon className="w-[20px] h-[20px]" stroke="#000" />
                            </div>
                        </button>
                        {openKey === 'year' ? (
                            <div
                                className="absolute left-0 top-[calc(100%+8px)] z-[90] w-[min(100vw-32px,360px)] rounded-[10px] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]"
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                {motorsYearOptions.length ? (
                                    <div className="flex flex-wrap gap-[8px] p-[14px]">
                                        {(specsListExpanded ? motorsYearOptions : motorsYearOptions.slice(0, SPECS_COLLAPSED_VISIBLE)).map((y) => {
                                            const selected = yearOptionsDraft.includes(y)
                                            return (
                                                <button
                                                    key={y}
                                                    type="button"
                                                    onClick={() => toggleYearOptionDraft(y)}
                                                    className={`cursor-pointer rounded-full border p-[8px_14px] text-[14px] leading-[18px] transition-colors ${
                                                        selected
                                                            ? 'border-[#3A88EF] bg-[#EDF4FF] font-[Inter-SemiBold] text-[#23262A]'
                                                            : 'border-[rgba(143,143,143,0.45)] bg-white font-[Inter-Regular] text-[#23262A] hover:border-[#8F8F8F]'
                                                    }`}
                                                >
                                                    {y}
                                                </button>
                                            )
                                        })}
                                        {!specsListExpanded && motorsYearOptions.length > SPECS_COLLAPSED_VISIBLE ? (
                                            <button
                                                type="button"
                                                onClick={() => setSpecsListExpanded(true)}
                                                className="cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] bg-white px-[14px] py-[8px] text-[14px] font-[Inter-SemiBold] leading-[18px] text-[#3A88EF] hover:bg-[#F5F5F5]"
                                            >
                                                View More
                                            </button>
                                        ) : null}
                                        {specsListExpanded && motorsYearOptions.length > SPECS_COLLAPSED_VISIBLE ? (
                                            <button
                                                type="button"
                                                onClick={() => setSpecsListExpanded(false)}
                                                className="cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] bg-white px-[14px] py-[8px] text-[14px] font-[Inter-SemiBold] leading-[18px] text-[#3A88EF] hover:bg-[#F5F5F5]"
                                            >
                                                View Less
                                            </button>
                                        ) : null}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-[12px] p-[14px]">
                                        <div>
                                            <label className="mb-[6px] block text-[12px] font-[Inter-Regular] leading-[14px] text-[#666]">
                                                From
                                            </label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={4}
                                                value={yearFromDraft}
                                                onChange={(e) => setYearFromDraft(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                placeholder={YEAR_DEFAULT_FROM}
                                                className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[14px_10px] text-[14px] font-[Inter-Regular] text-[#000] outline-none placeholder:text-[#8F8F8F]"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-[6px] block text-[12px] font-[Inter-Regular] leading-[14px] text-[#666]">
                                                Up to
                                            </label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={4}
                                                value={yearUpToDraft}
                                                onChange={(e) => setYearUpToDraft(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                placeholder={YEAR_DEFAULT_UP_TO}
                                                className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[14px_10px] text-[14px] font-[Inter-Regular] text-[#000] outline-none placeholder:text-[#8F8F8F]"
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="mt-[10px] flex items-stretch gap-[10px] border-t border-[rgba(143,143,143,0.2)] p-[14px]">
                                    <button
                                        type="button"
                                        className="flex-1 cursor-pointer rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white p-[14px_22px] text-center text-[14px] font-[Inter-SemiBold] text-[#666]"
                                        onClick={() => {
                                            if (motorsYearOptions.length) {
                                                setYearOptionsDraft([])
                                            } else {
                                                setYearFromDraft('')
                                                setYearUpToDraft('')
                                            }
                                        }}
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        className="flex-[1.15] cursor-pointer rounded-[6px] bg-[#23262A] py-[14px] text-center text-[14px] font-[Inter-Medium] text-white hover:bg-[#000]"
                                        onClick={() => {
                                            if (motorsYearOptions.length) {
                                                setYearOptionsApplied(yearOptionsDraft)
                                                setYearFromApplied('')
                                                setYearUpToApplied('')
                                                const qs = new URLSearchParams(searchParams.toString())
                                                const yearFilterName = String(motorsYearFilterDef?.name || 'Year').trim()
                                                const yearFilterKey = `filters[${yearFilterName}]`
                                                qs.delete(yearFilterKey)
                                                const yearSer = serializeGetItemFilterValue(
                                                    yearFilterName,
                                                    'button',
                                                    Boolean(motorsYearFilterDef?.multiselect ?? true),
                                                    yearOptionsDraft
                                                )
                                                if (yearSer != null) qs.set(yearFilterKey, yearSer)
                                                qs.set('page', '1')
                                                const nextUrl = qs.toString() ? `${pathname}?${qs.toString()}` : pathname
                                                router.replace(nextUrl)
                                                router.refresh()
                                            } else {
                                                setYearFromApplied(yearFromDraft.trim())
                                                setYearUpToApplied(yearUpToDraft.trim())
                                                setYearOptionsApplied([])
                                                const qs = new URLSearchParams(searchParams.toString())
                                                const yearFilterName = String(motorsYearFilterDef?.name || 'Year').trim()
                                                const yearFilterKey = `filters[${yearFilterName}]`
                                                qs.delete(yearFilterKey)
                                                const yearSer = serializeGetItemFilterValue(
                                                    yearFilterName,
                                                    'min-max',
                                                    false,
                                                    { min: yearFromDraft.trim(), max: yearUpToDraft.trim() }
                                                )
                                                if (yearSer != null) qs.set(yearFilterKey, yearSer)
                                                qs.set('page', '1')
                                                const nextUrl = qs.toString() ? `${pathname}?${qs.toString()}` : pathname
                                                router.replace(nextUrl)
                                                router.refresh()
                                            }
                                            setOpenKey(null)
                                        }}
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>


                    {/* Regional specs */}
                    <div className="relative flex flex-1 min-w-[120px] p-[10px] border-e border-[rgba(143,143,143,0.22)] max-sm:border-r-0 max-sm:border-b">
                        <button
                            type="button"
                            className={`text-left rtl:text-right flex items-center justify-between gap-2 cursor-pointer w-full ${openKey === 'specs' ? '' : ''}`}
                            onClick={() => {
                                setFiltersOpen(false)
                                setOpenKey((k) => {
                                    if (k === 'specs') return null
                                    setRegionalSpecsDraft([...regionalSpecsApplied])
                                    setSpecsListExpanded(false)
                                    return 'specs'
                                })
                            }}
                        >
                            <div>
                                <h4 className="text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000 mb-[4px]">Regional Specs</h4>
                                <p className="truncate text-[14px] font-[Inter-Regular] leading-[18px] text-[#000]">
                                    {specsSummary || 'Select'}
                                </p>
                            </div>
                            <div>
                                <DownArrowIcon className="w-[20px] h-[20px]" stroke="#000" />
                            </div>
                        </button>
                        {openKey === 'specs' ? (
                            <div
                                className="absolute left-0 top-[calc(100%+8px)] z-[90] w-[min(100vw-32px,400px)] rounded-[12px] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]"
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <div className="flex flex-wrap gap-[8px] p-[14px]">
                                    {(specsListExpanded
                                        ? specsOptionsToShow
                                        : specsOptionsToShow.slice(0, SPECS_COLLAPSED_VISIBLE)
                                    ).map((s) => {
                                        const selected = regionalSpecsDraft.includes(s)
                                        return (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => toggleSpecDraft(s)}
                                                className={`cursor-pointer rounded-full border p-[8px_14px] text-[14px] leading-[18px] transition-colors ${selected
                                                    ? 'border-[#3A88EF] bg-[#EDF4FF] font-[Inter-SemiBold] text-[#23262A]'
                                                    : 'border-[rgba(143,143,143,0.45)] bg-white font-[Inter-Regular] text-[#23262A] hover:border-[#8F8F8F]'
                                                    }`}
                                            >
                                                {s}
                                            </button>
                                        )
                                    })}
                                    {!specsListExpanded && specsOptionsToShow.length > SPECS_COLLAPSED_VISIBLE ? (
                                        <button
                                            type="button"
                                            onClick={() => setSpecsListExpanded(true)}
                                            className="cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] bg-white px-[14px] py-[8px] text-[14px] font-[Inter-SemiBold] leading-[18px] text-[#3A88EF] hover:bg-[#F5F5F5]"
                                        >
                                            View More
                                        </button>
                                    ) : null}
                                    {specsListExpanded && specsOptionsToShow.length > SPECS_COLLAPSED_VISIBLE ? (
                                        <button
                                            type="button"
                                            onClick={() => setSpecsListExpanded(false)}
                                            className="cursor-pointer rounded-full border border-[rgba(143,143,143,0.45)] bg-white px-[14px] py-[8px] text-[14px] font-[Inter-SemiBold] leading-[18px] text-[#3A88EF] hover:bg-[#F5F5F5]"
                                        >
                                            View Less
                                        </button>
                                    ) : null}
                                </div>
                                <div className="mt-[10px] flex items-stretch gap-[10px] border-t border-[rgba(143,143,143,0.2)] p-[14px]">
                                    <button
                                        type="button"
                                        className="cursor-pointer rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white p-[14px_22px] text-center text-[14px] font-[Inter-SemiBold] text-[#666] hover:bg-[#F5F5F5]"
                                        onClick={() => setRegionalSpecsDraft('')}
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        className="flex-[2.2] cursor-pointer rounded-[6px] bg-[#23262A] py-[14px] text-center text-[14px] font-[Inter-Medium] text-white hover:bg-[#000]"
                                        onClick={() => {
                                            setRegionalSpecsApplied(regionalSpecsDraft)
                                            const qs = new URLSearchParams(searchParams.toString())
                                            const specsFilterName = String(motorsSpecsFilterDef?.name || 'Regional Specs').trim()
                                            const specsFilterKey = `filters[${specsFilterName}]`
                                            qs.delete(specsFilterKey)
                                            const specsSer = serializeGetItemFilterValue(
                                                specsFilterName,
                                                'button',
                                                Boolean(motorsSpecsFilterDef?.multiselect ?? true),
                                                regionalSpecsDraft
                                            )
                                            if (specsSer != null) qs.set(specsFilterKey, specsSer)
                                            qs.set('page', '1')
                                            const nextUrl = qs.toString() ? `${pathname}?${qs.toString()}` : pathname
                                            router.replace(nextUrl)
                                            router.refresh()
                                            setOpenKey(null)
                                        }}
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>


                    {/* Filters (keywords + more) */}
                    <div className="relative flex flex-1 min-w-[120px] p-[10px]">
                        <button
                            type="button"
                            className={`text-left rtl:text-right flex items-center justify-between gap-2 cursor-pointer w-full ${filtersOpen ? '' : ''}`}
                            onClick={() => {
                                setOpenKey(null)
                                setFiltersOpen((v) => !v)
                            }}
                        >
                            <div>
                                <h4 className="text-[12px] font-[Inter-SemiBold] leading-[16px] text-[#000 mb-[4px]">Filters</h4>
                                <p className="truncate text-[14px] font-[Inter-Regular] leading-[18px] text-[#000] w-[120px]">
                                    {motorsSideFilterSummary}
                                </p>
                            </div>
                            <div>
                                <DownArrowIcon className="w-[20px] h-[20px]" stroke="#000" />
                            </div>
                        </button>
                        <MotorsProductsFiltersPanel
                            open={filtersOpen}
                            initialKeywords={filterKeywords}
                            onClose={() => setFiltersOpen(false)}
                            apiFilters={motorsApiFilters}
                            hydration={motorsFiltersHydration}
                            onApply={({ keywords, dynamicFilters, adsWithVideo, adsWith360 }) => {
                                const kw = String(keywords ?? '').trim()
                                setFilterKeywords(kw)
                                const qs = new URLSearchParams(searchParams.toString())
                                const existingFiltersByName = {}
                                const filterKeys = []
                                qs.forEach((value, key) => {
                                    if (!key.startsWith('filters[')) return
                                    filterKeys.push(key)
                                    const m = key.match(/^filters\[(.*)\]$/)
                                    const filterName = m?.[1] ? String(m[1]).trim() : ''
                                    if (!filterName) return
                                    existingFiltersByName[filterName] = String(value ?? '')
                                })
                                filterKeys.forEach((k) => qs.delete(k))
                                if (kw) {
                                    qs.set('search', kw)
                                    qs.set('keyword', kw)
                                } else {
                                    qs.delete('search')
                                    qs.delete('keyword')
                                }
                                if (adsWithVideo) qs.set('hasVideo', '1')
                                else qs.delete('hasVideo')
                                if (adsWith360) qs.set('has360', '1')
                                else qs.delete('has360')

                                const filters = {}
                                const allowedDynKeys = new Set(
                                    (motorsApiFilters || []).map((f) => `cf_${f?.category_id}_${f?.sort_order}`)
                                )
                                const panelFilterNames = new Set(
                                    (motorsApiFilters || [])
                                        .map((f) => String(f?.name || '').trim())
                                        .filter(Boolean)
                                )
                                const sanitizedDynamic = {}
                                if (dynamicFilters && typeof dynamicFilters === 'object') {
                                    for (const k of Object.keys(dynamicFilters)) {
                                        if (allowedDynKeys.has(k)) sanitizedDynamic[k] = dynamicFilters[k]
                                    }
                                }
                                for (const def of motorsApiFilters || []) {
                                    if (!def || String(def.name || '').trim() === '') continue
                                    const dynKey = `cf_${def.category_id}_${def.sort_order}`
                                    if (!allowedDynKeys.has(dynKey)) continue
                                    const name = String(def.name).trim()
                                    const raw = sanitizedDynamic[dynKey]
                                    const type =
                                        def.type === 'min-max' || def.type === 'number'
                                            ? 'min-max'
                                            : 'button'
                                    const multiselect = Boolean(def.multiselect)
                                    const ser = serializeGetItemFilterValue(name, type, multiselect, raw)
                                    if (ser == null) delete filters[name]
                                    else filters[name] = ser
                                }
                                Object.entries(existingFiltersByName).forEach(([name, value]) => {
                                    if (panelFilterNames.has(name)) return
                                    if (value) filters[name] = value
                                })
                                appendGetItemFiltersToSearchParams(qs, filters)
                                const nextUrl = qs.toString() ? `${pathname}?${qs.toString()}` : pathname
                                router.replace(nextUrl)
                                router.refresh()
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
