/**
 * Build query params for GET get-item / get-items using backend shape:
 *   filters[Amenities]=["Private Pool","Balcony"]
 *   filters[Bathrooms]=4
 *   filters[Bedrooms]=3  (exact, like Bathrooms) or {"min":"1","max":"3"} for ranges
 *   filters[Is it furnished?]=furnished
 */

/** URL query key for bedrooms (same pattern as filters[Bathrooms]). */
export const PROPERTY_BEDROOMS_FILTER_URL_KEY = 'filters[Bedrooms]'

/**
 * Hero min/max bedroom values ('any', '0', '1', …) → single filter param value.
 * Exact min===max → plain string (e.g. "4"). Otherwise JSON { min, max } like Size(Sqft).
 */
export function serializeBedroomsFilterForUrl(bedsMin, bedsMax) {
    const min = bedsMin === 'any' || bedsMin == null ? '' : String(bedsMin).trim()
    const max = bedsMax === 'any' || bedsMax == null ? '' : String(bedsMax).trim()
    if (!min && !max) return null
    if (min && max && min === max) return min
    return JSON.stringify({ min, max })
}

/** Products filter bar chips: Studio | 1 … | 8+ */
export function serializePropertyBedroomsChipToFilterValue(bedsLabel) {
    if (!bedsLabel || bedsLabel === 'Any') return null
    if (bedsLabel === 'Studio') return '0'
    if (bedsLabel === '8+') return JSON.stringify({ min: '8', max: '' })
    return String(bedsLabel).trim()
}

/**
 * Read filters[Bedrooms] from the URL → chip label for the property filter bar.
 * @param {string[]} bedChipOptions e.g. ['Studio','1',…,'8+']
 */
export function parsePropertyBedsChipLabelFromSearchParams(searchParams, bedChipOptions) {
    const raw = searchParams?.get(PROPERTY_BEDROOMS_FILTER_URL_KEY)?.trim() ?? ''
    if (!raw) return 'Any'
    const j = tryParseJson(raw)
    if (j && typeof j === 'object' && !Array.isArray(j)) {
        const min = String(j.min ?? '').trim()
        const max = String(j.max ?? '').trim()
        if (min === '8' && !max) return '8+'
        if (min && min === max) {
            if (min === '0') return 'Studio'
            if (bedChipOptions.includes(min)) return min
        }
        return 'Any'
    }
    if (raw === '0') return 'Studio'
    if (bedChipOptions.includes(raw)) return raw
    return 'Any'
}

export function furnishValueToApi(s) {
    const l = String(s || '').toLowerCase()
    if (l.includes('un')) return 'unfurnished'
    return 'furnished'
}

/** Matches category filter `name` used for furnished serialization (spacing/case tolerant). */
export function isFurnishedQuestionFilterName(filterName) {
    const n = String(filterName || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
    return n === 'is it furnished?'
}

/**
 * @param {string} filterName
 * @param {'button'|'min-max'} type
 * @param {boolean} multiselect
 * @param {unknown} raw
 * @returns {string|null}
 */
export function serializeGetItemFilterValue(filterName, type, multiselect, raw) {
    if (raw == null) return null

    if (type === 'min-max') {
        const mm = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : { min: '', max: '' }
        const min = String(mm.min ?? '').trim()
        const max = String(mm.max ?? '').trim()
        if (!min && !max) return null
        return JSON.stringify({ min, max })
    }

    if (type !== 'button' && type !== 'dropdown' && type !== 'dropdown_api') return null

    if (multiselect) {
        const arr = Array.isArray(raw) ? raw.filter((x) => x != null && String(x).trim() !== '') : raw ? [raw] : []
        if (!arr.length) return null
        if (isFurnishedQuestionFilterName(filterName)) {
            if (arr.length === 1) return furnishValueToApi(arr[0])
            return JSON.stringify(arr.map(furnishValueToApi))
        }
        return JSON.stringify(arr)
    }

    const s = typeof raw === 'string' ? raw.trim() : raw != null ? String(raw).trim() : ''
    if (!s) return null
    if (isFurnishedQuestionFilterName(filterName)) return furnishValueToApi(s)
    return s
}

/**
 * @param {URLSearchParams} params
 * @param {Record<string, string>} filtersByName — values already serialized (strings)
 */
export function appendGetItemFiltersToSearchParams(params, filtersByName) {
    if (!filtersByName || typeof filtersByName !== 'object') return
    Object.entries(filtersByName).forEach(([name, val]) => {
        if (val == null || val === '') return
        params.set(`filters[${name}]`, val)
    })
}

/** @returns {Record<string, string>} e.g. { 'filters[Amenities]': '[...]' } */
export function collectFilterParamsFromSearchParams(searchParams) {
    const out = {}
    if (!searchParams || typeof searchParams.forEach !== 'function') return out
    searchParams.forEach((value, key) => {
        if (typeof key === 'string' && key.startsWith('filters[')) {
            out[key] = value
        }
    })
    return out
}

/** Panel / hero: merge API filter defs + dynamic state keyed cf_* */
export function buildFiltersRecordFromApiDynamicState(apiFilterDefs, dynamicState) {
    const rec = {}
    if (!Array.isArray(apiFilterDefs) || !dynamicState || typeof dynamicState !== 'object') return rec
    for (const def of apiFilterDefs) {
        if (!def || String(def.name || '').trim() === '') continue
        const k = `cf_${def.category_id}_${def.sort_order}`
        const raw = dynamicState[k]
        const type = def.type === 'min-max' ? 'min-max' : 'button'
        const multiselect = Boolean(def.multiselect)
        const ser = serializeGetItemFilterValue(def.name, type, multiselect, raw)
        if (ser != null) rec[def.name] = ser
    }
    return rec
}

export function serializeHeroApiCategoryFilters(apiCategoryFilters) {
    const rec = {}
    if (!apiCategoryFilters || typeof apiCategoryFilters !== 'object') return rec
    for (const [name, val] of Object.entries(apiCategoryFilters)) {
        if (!name) continue
        if (val == null) continue
        if (Array.isArray(val)) {
            if (!val.length) continue
            if (isFurnishedQuestionFilterName(name)) {
                rec[name] = val.length === 1 ? furnishValueToApi(val[0]) : JSON.stringify(val.map(furnishValueToApi))
            } else {
                rec[name] = JSON.stringify(val)
            }
            continue
        }
        if (val && typeof val === 'object' && ('min' in val || 'max' in val)) {
            const min = String(val.min ?? '').trim()
            const max = String(val.max ?? '').trim()
            if (!min && !max) continue
            rec[name] = JSON.stringify({ min, max })
            continue
        }
        if (typeof val === 'string') {
            if (val.trim() === '') continue
            rec[name] = isFurnishedQuestionFilterName(name) ? furnishValueToApi(val) : val.trim()
        }
    }
    return rec
}

/** Products sidebar panel: non-API (chip) sections → same filters[...] shape */
export function mergeProductsPanelStaticFilters(rec, panel = {}) {
    if (!rec || typeof rec !== 'object') return
    const {
        bath,
        sizeFrom,
        sizeTo,
        amenities,
        listedBy,
        rentPaid,
    } = panel
    if (bath != null && String(bath).trim() !== '') {
        rec['Bathrooms'] = String(bath).trim()
    }
    const minSq = String(sizeFrom ?? '').trim()
    const maxSq = String(sizeTo ?? '').trim()
    if (minSq || maxSq) {
        rec['Size(Sqft)'] = JSON.stringify({ min: minSq, max: maxSq })
    }
    if (Array.isArray(amenities) && amenities.length) {
        rec['Amenities'] = JSON.stringify(amenities)
    }
    if (Array.isArray(listedBy) && listedBy.length) {
        rec['Listed By'] = JSON.stringify(listedBy)
    }
    if (Array.isArray(rentPaid) && rentPaid.length) {
        rec['Rent is paid'] = JSON.stringify(rentPaid)
    }
}

/** Labels shown in PropertyProductsFiltersPanel amenities chips (subset of hero amenity labels). */
export const PROPERTY_PANEL_AMENITY_LABELS = [
    'Maids Room',
    'Study',
    'Central A/C & Heating',
    'Concierge Service',
    'Balcony',
    'Private Garden',
    'Private Pool',
]

function filterParamValue(collected, displayName) {
    return collected[`filters[${displayName}]`] ?? ''
}

function tryParseJson(raw) {
    if (raw == null || String(raw).trim() === '') return null
    try {
        return JSON.parse(String(raw))
    } catch {
        return null
    }
}

/**
 * URL / API stored value → exact label from `filter.values[]` so chips match (furnished: furnished ↔ Furnished).
 * @param {string} filterName
 * @param {string} raw filters[...] value from URL
 * @param {boolean} multiselect
 * @param {string[]|undefined} optionValues API `values` array
 */
export function normalizeUrlRawToDynamicButtonState(filterName, raw, multiselect, optionValues = []) {
    const opts = Array.isArray(optionValues) ? optionValues : []
    const furnished = isFurnishedQuestionFilterName(filterName)

    if (multiselect) {
        const parsed = tryParseJson(raw)
        const list = Array.isArray(parsed)
            ? parsed.map((x) => String(x))
            : typeof raw === 'string' && raw.trim() !== ''
              ? [raw.trim()]
              : []
        if (!opts.length) return list
        if (furnished) {
            return list.map((item) => {
                const t = furnishValueToApi(item)
                const m = opts.find((o) => furnishValueToApi(o) === t)
                return m != null ? m : item
            })
        }
        return list.map((item) => {
            const m = opts.find((o) => String(o).toLowerCase() === String(item).toLowerCase())
            return m != null ? m : item
        })
    }

    let s =
        typeof raw === 'string'
            ? raw.trim()
            : raw != null
              ? String(raw).trim()
              : ''
    const p = tryParseJson(raw)
    if (typeof p === 'string' && p.trim()) s = p.trim()
    if (!s) return ''
    if (!opts.length) return s
    if (furnished) {
        const t = furnishValueToApi(s)
        const m = opts.find((o) => furnishValueToApi(o) === t)
        return m != null ? m : s
    }
    const m = opts.find((o) => String(o).toLowerCase() === s.toLowerCase())
    return m != null ? m : s
}

/**
 * Whether `optionValue` is selected in panel state (handles furnished normalization & case-insensitive labels).
 */
export function isDynamicButtonOptionSelected(filterName, multiselect, storedValue, optionValue) {
    const furnished = isFurnishedQuestionFilterName(filterName)
    if (multiselect) {
        const arr = Array.isArray(storedValue)
            ? storedValue
            : storedValue != null && storedValue !== ''
              ? [storedValue]
              : []
        if (!arr.length) return false
        if (furnished) {
            const target = furnishValueToApi(optionValue)
            return arr.some((x) => furnishValueToApi(x) === target)
        }
        const opt = String(optionValue).toLowerCase()
        return arr.some((x) => String(x).toLowerCase() === opt)
    }
    if (storedValue == null || storedValue === '') return false
    if (furnished) {
        return furnishValueToApi(storedValue) === furnishValueToApi(optionValue)
    }
    return String(storedValue).toLowerCase() === String(optionValue).toLowerCase()
}

/**
 * @param {Record<string, string>} collected from collectFilterParamsFromSearchParams
 * @param {Array<{ name?: string, category_id?: number|string, sort_order?: number|string, type?: string, multiselect?: boolean, values?: string[] }>} apiFilters
 */
function buildDynamicFiltersStateFromCollected(collected, apiFilters = []) {
    const dynamicFilters = {}
    if (!Array.isArray(apiFilters)) return dynamicFilters
    for (const f of apiFilters) {
        if (!f || String(f.name || '').trim() === '') continue
        const raw = filterParamValue(collected, f.name)
        if (raw === '' || raw == null) continue
        const k = `cf_${f.category_id}_${f.sort_order}`
        if (f.type === 'min-max') {
            const mm = tryParseJson(raw)
            if (mm && typeof mm === 'object' && !Array.isArray(mm)) {
                dynamicFilters[k] = {
                    min: String(mm.min ?? '').replace(/\D/g, ''),
                    max: String(mm.max ?? '').replace(/\D/g, ''),
                }
            }
        } else if (f.type === 'button' || f.type === 'dropdown' || f.type === 'dropdown_api') {
            const optionVals = Array.isArray(f.values) ? f.values : []
            if (f.multiselect) {
                const normalized = normalizeUrlRawToDynamicButtonState(f.name, raw, true, optionVals)
                if (Array.isArray(normalized) && normalized.length) {
                    dynamicFilters[k] = normalized
                }
            } else {
                const normalized = normalizeUrlRawToDynamicButtonState(f.name, raw, false, optionVals)
                if (normalized !== '') {
                    dynamicFilters[k] = normalized
                }
            }
        }
    }
    return dynamicFilters
}

/**
 * Reverse hero / URL `filters[...]` params into PropertyProductsFiltersPanel state.
 *
 * @param {URLSearchParams | null | undefined} searchParams
 * @param {Array<{ name?: string, category_id?: number|string, sort_order?: number|string, type?: string, multiselect?: boolean }>} apiFilters
 */
export function parsePropertyProductsPanelFromSearchParams(searchParams, apiFilters = []) {
    const collected = collectFilterParamsFromSearchParams(searchParams)

    const bath = String(filterParamValue(collected, 'Bathrooms') || '').trim()

    let sizeFrom = ''
    let sizeTo = ''
    const sizeRaw = filterParamValue(collected, 'Size(Sqft)')
    const sizeObj = tryParseJson(sizeRaw)
    if (sizeObj && typeof sizeObj === 'object' && !Array.isArray(sizeObj)) {
        sizeFrom = String(sizeObj.min ?? '').replace(/\D/g, '')
        sizeTo = String(sizeObj.max ?? '').replace(/\D/g, '')
    }

    const amenityParsed = tryParseJson(filterParamValue(collected, 'Amenities'))
    const amenities = Array.isArray(amenityParsed) ? amenityParsed.map(String) : []

    const listedParsed = tryParseJson(filterParamValue(collected, 'Listed By'))
    const listedBy = Array.isArray(listedParsed) ? listedParsed.map(String) : []

    const rentParsed = tryParseJson(filterParamValue(collected, 'Rent is paid'))
    const rentPaid = Array.isArray(rentParsed) ? rentParsed.map(String) : []

    const keywords =
        String(searchParams?.get?.('search') || searchParams?.get?.('keyword') || '').trim()

    const adsWithVideo = searchParams?.get?.('hasVideo') === '1'
    const adsWith360 = searchParams?.get?.('has360') === '1'
    const agency = String(searchParams?.get?.('agency') || '').trim()

    const dynamicFilters = buildDynamicFiltersStateFromCollected(collected, apiFilters)

    return {
        bath,
        sizeFrom,
        sizeTo,
        amenities,
        keywords,
        listedBy,
        rentPaid,
        agency,
        adsWithVideo,
        adsWith360,
        dynamicFilters,
    }
}

/**
 * Reverse URL into vertical listing side panel state (classified, furniture, mobile, community):
 * keywords, dynamic category filters, video flags.
 *
 * @param {URLSearchParams | null | undefined} searchParams
 * @param {Array<{ name?: string, category_id?: number|string, sort_order?: number|string, type?: string, multiselect?: boolean, values?: string[] }>} apiFilters
 */
export function parseClassifiedProductsPanelFromSearchParams(searchParams, apiFilters = []) {
    const collected = collectFilterParamsFromSearchParams(searchParams)
    const keywords =
        String(searchParams?.get?.('search') || searchParams?.get?.('keyword') || '').trim()
    const adsWithVideo = searchParams?.get?.('hasVideo') === '1'
    const adsWith360 = searchParams?.get?.('has360') === '1'
    return {
        keywords,
        adsWithVideo,
        adsWith360,
        dynamicFilters: buildDynamicFiltersStateFromCollected(collected, apiFilters),
    }
}
