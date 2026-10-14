const UAE_EMIRATE_NAMES = [
    'Dubai',
    'Abu Dhabi',
    'Sharjah',
    'Ajman',
    'Umm Al Quwain',
    'Ras Al Khaimah',
    'Fujairah',
]

const COUNTRY_DROP_NAMES = [
    'united arab emirates',
    'uae',
    'u.a.e',
    'u.a.e.',
]

const BUILDING_NAME_RE =
    /\b(tower|towers|building|bldg|residence|residences|plaza|palace|heights|court|apartments?|villas?)\b/i

function normalizeName(value) {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .replace(/^emirate of\s+/i, '')
        .trim()
}

function normalizeKey(value) {
    return normalizeName(value).toLowerCase()
}

function looksCombined(value) {
    const text = String(value || '')
    return /\s[-–]\s/.test(text) || text.split(',').length >= 3
}

export function looksLikeBuildingName(value) {
    return BUILDING_NAME_RE.test(String(value || ''))
}

function isPlusCode(value) {
    return /^[A-Z0-9]{2,8}\+[A-Z0-9]{2,3}$/i.test(String(value || '').trim())
}

function dropKeys(known = {}) {
    const keys = new Set(COUNTRY_DROP_NAMES)
    ;['country', 'state', 'city'].forEach((key) => {
        const val = normalizeKey(known[key])
        if (val) keys.add(val)
    })
    UAE_EMIRATE_NAMES.forEach((em) => keys.add(em.toLowerCase()))
    return keys
}

/**
 * "U Bora Towers - Business Bay - Dubai - United Arab Emirates"
 * → { building: "U Bora Towers", area: "Business Bay" }
 */
export function splitLocationLine(text, known = {}) {
    const raw = normalizeName(text)
    if (!raw) return { building: '', area: '' }

    const parts = raw
        .split(/\s*[-–,]\s+/)
        .map((part) => normalizeName(part))
        .filter(Boolean)

    const skip = dropKeys(known)
    const kept = parts.filter((part) => !skip.has(normalizeKey(part)) && !isPlusCode(part))

    if (kept.length >= 2) {
        return { building: kept[0], area: kept[kept.length - 1] }
    }
    if (kept.length === 1) {
        return looksLikeBuildingName(kept[0])
            ? { building: kept[0], area: '' }
            : { building: '', area: kept[0] }
    }
    return { building: '', area: '' }
}

function getComponent(addressComponents, types) {
    const list = Array.isArray(types) ? types : [types]
    const comp = (addressComponents || []).find((item) => list.some((type) => item.types?.includes(type)))
    return comp ? comp.long_name : ''
}

export function parseAddressComponents(result) {
    const addressComponents = result?.address_components || []
    const city =
        getComponent(addressComponents, ['locality', 'postal_town']) ||
        getComponent(addressComponents, 'administrative_area_level_2')
    const state = getComponent(addressComponents, 'administrative_area_level_1')
    const country = getComponent(addressComponents, 'country')
    const area = getComponent(addressComponents, [
        'neighborhood',
        'sublocality_level_1',
        'sublocality',
        'sublocality_level_2',
    ])
    let building = getComponent(addressComponents, ['premise', 'subpremise'])
    if (!building) {
        const poi = (addressComponents || []).find(
            (item) =>
                (item.types?.includes('establishment') || item.types?.includes('point_of_interest')) &&
                normalizeKey(item.long_name) !== normalizeKey(city) &&
                normalizeKey(item.long_name) !== normalizeKey(area)
        )
        building = poi ? poi.long_name : ''
    }
    return {
        city: city || '',
        state: state || '',
        country: country || '',
        area: area || '',
        building: building || '',
        formattedAddress: result?.formatted_address || '',
    }
}

function pickReverseGeocodeResult(results = []) {
    const list = Array.isArray(results) ? results : []
    return list.find((result) => Array.isArray(result?.types) && !result.types.includes('plus_code')) || list[0] || null
}

/**
 * Reverse-geocode map coordinates with the already-loaded Google Maps JS Geocoder
 * (same API used by place autocomplete selection in the ad posting forms).
 */
export function reverseGeocodeLatLng(lat, lng) {
    return new Promise((resolve) => {
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            resolve(null)
            return
        }
        if (typeof window === 'undefined' || !window.google?.maps?.Geocoder) {
            resolve(null)
            return
        }
        const geocoder = new window.google.maps.Geocoder()
        geocoder.geocode({ location: { lat, lng } }, (results = [], status) => {
            if (status !== 'OK' || !results.length) {
                resolve(null)
                return
            }
            const top = pickReverseGeocodeResult(results)
            resolve(top ? fieldsFromPlaceSelection(top) : null)
        })
    })
}

export function applyReverseGeocodePartsToLocationFields(parts, { setLocationQuery, setStreetQuery } = {}) {
    if (!parts) return
    const locationText = String(parts.area || '').trim() || String(parts.city || '').trim() || String(parts.formattedAddress || '').trim()
    if (locationText && !isPlusCode(locationText)) setLocationQuery?.(locationText)
    const building = String(parts.building || '').trim()
    if (building && !isPlusCode(building)) setStreetQuery?.(building)
}

let mapGeocodeSeq = 0

export function fillLocationFieldsFromMapCoords({ lat, lng, setPosition, setLocationQuery, setStreetQuery }) {
    const seq = ++mapGeocodeSeq
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setPosition?.({ lat, lng })
    }
    return reverseGeocodeLatLng(lat, lng).then((parts) => {
        if (seq !== mapGeocodeSeq) return parts
        applyReverseGeocodePartsToLocationFields(parts, { setLocationQuery, setStreetQuery })
        return parts
    })
}

export function fieldsFromPlaceSelection(result, prediction = {}) {
    const mainText = normalizeName(prediction?.structured_formatting?.main_text)
    const description = normalizeName(prediction?.description || result?.formatted_address)
    const parsed = parseAddressComponents(result)
    const split = splitLocationLine(description, parsed)

    const building =
        parsed.building ||
        split.building ||
        (looksLikeBuildingName(mainText) ? mainText : '')
    let area = parsed.area || split.area || ''
    if (!area && mainText && normalizeKey(mainText) !== normalizeKey(building)) {
        area = mainText
    }
    if (area && building && normalizeKey(area) === normalizeKey(building)) {
        area = parsed.area || split.area || ''
    }

    return {
        area,
        building,
        city: parsed.city,
        state: parsed.state,
        country: parsed.country,
        formattedAddress: parsed.formattedAddress || description,
    }
}

export function resolveAreaAndBuilding({
    locationQuery = '',
    streetQuery = '',
    country = '',
    state = '',
    city = '',
    address = '',
} = {}) {
    const known = { country, state, city }
    let area = normalizeName(locationQuery)
    let building = normalizeName(streetQuery)
    if (isPlusCode(area)) area = ''
    if (isPlusCode(building)) building = ''

    if (looksCombined(area) || (!building && looksCombined(address))) {
        const split = splitLocationLine(looksCombined(area) ? area : address, known)
        if (split.area) area = split.area
        if (!building && split.building) building = split.building
    } else if (!area && address) {
        const split = splitLocationLine(address, known)
        if (split.area) area = split.area
        if (!building && split.building) building = split.building
    }

    if (looksCombined(building)) {
        const split = splitLocationLine(building, known)
        if (split.building) building = split.building
        if (!area && split.area) area = split.area
    }

    if (area && building && normalizeKey(area) === normalizeKey(building)) {
        if (looksLikeBuildingName(building)) area = ''
        else building = ''
    }

    return { area, building }
}

export { UAE_EMIRATE_NAMES }
