export const DEFAULT_PLACES_COUNTRY_LABEL = 'United Arab Emirates'
export const DEFAULT_PLACES_COUNTRY_ISO = 'ae'

/** Google Places `componentRestrictions.country` — ISO 3166-1 alpha-2 (lowercase). */
export const COUNTRY_NAME_TO_GOOGLE_ISO = {
    afghanistan: 'af',
    albania: 'al',
    algeria: 'dz',
    'american samoa': 'as',
    andorra: 'ad',
    angola: 'ao',
    anguilla: 'ai',
    argentina: 'ar',
    armenia: 'am',
    australia: 'au',
    austria: 'at',
    bahrain: 'bh',
    bangladesh: 'bd',
    belgium: 'be',
    brazil: 'br',
    canada: 'ca',
    china: 'cn',
    egypt: 'eg',
    france: 'fr',
    germany: 'de',
    india: 'in',
    indonesia: 'id',
    iraq: 'iq',
    ireland: 'ie',
    italy: 'it',
    jordan: 'jo',
    kuwait: 'kw',
    lebanon: 'lb',
    malaysia: 'my',
    nepal: 'np',
    netherlands: 'nl',
    'new zealand': 'nz',
    oman: 'om',
    pakistan: 'pk',
    philippines: 'ph',
    qatar: 'qa',
    'saudi arabia': 'sa',
    singapore: 'sg',
    'south africa': 'za',
    spain: 'es',
    'sri lanka': 'lk',
    sweden: 'se',
    switzerland: 'ch',
    thailand: 'th',
    turkey: 'tr',
    'united arab emirates': 'ae',
    uae: 'ae',
    emirates: 'ae',
    'united kingdom': 'gb',
    uk: 'gb',
    'great britain': 'gb',
    'united states': 'us',
    usa: 'us',
    'united states of america': 'us',
}

const COUNTRY_MATCH_ALIASES = {
    'united arab emirates': ['united arab emirates', 'uae', 'emirates'],
    india: ['india'],
    pakistan: ['pakistan'],
    'saudi arabia': ['saudi arabia', 'ksa'],
    'united kingdom': ['united kingdom', 'uk'],
    'united states': ['united states', 'usa', 'u.s.a'],
}

export function isAllCitiesLabel(label) {
    return /^all cities/i.test(String(label || '').trim())
}

export function resolvePlacesCountryLabel({ urlCountry, reduxCountry } = {}) {
    const label = String(urlCountry || reduxCountry || '').trim()
    return label || DEFAULT_PLACES_COUNTRY_LABEL
}

export function resolveGoogleCountryIso(countryLabel) {
    const raw = String(countryLabel || '').trim()
    if (!raw) return DEFAULT_PLACES_COUNTRY_ISO
    if (/^[a-z]{2}$/i.test(raw)) return raw.toLowerCase()
    return COUNTRY_NAME_TO_GOOGLE_ISO[raw.toLowerCase()] || ''
}

export function buildGooglePlacesComponentRestrictions(countryLabel) {
    const iso = resolveGoogleCountryIso(countryLabel)
    return iso ? { country: iso } : undefined
}

export function buildPlacesAutocompleteInput(query, cityLabel, countryLabel) {
    const q = String(query || '').trim()
    const city = isAllCitiesLabel(cityLabel) ? '' : String(cityLabel || '').trim()
    const country = String(countryLabel || '').trim() || DEFAULT_PLACES_COUNTRY_LABEL
    if (!q && !city) return ''
    if (city) {
        if (!q) return `${city}, ${country}`
        return `${q}, ${city}, ${country}`
    }
    return `${q}, ${country}`
}

/** Neighborhood field: bias by city; country comes from `componentRestrictions`. */
export function buildNeighborhoodAutocompleteInput(query, cityLabel, countryLabel) {
    const q = String(query || '').trim()
    const city = isAllCitiesLabel(cityLabel) ? '' : String(cityLabel || '').trim()
    const country = String(countryLabel || '').trim() || DEFAULT_PLACES_COUNTRY_LABEL
    if (!q) return city ? `${city}, ${country}` : ''
    if (city) return `${q}, ${city}`
    return `${q}, ${country}`
}

export function mapNeighborhoodPlacePrediction(item) {
    const name = item.structured_formatting?.main_text || item.description || ''
    let subtitle = item.structured_formatting?.secondary_text || ''
    if (!subtitle && item.description) {
        const parts = String(item.description)
            .split(',')
            .map((part) => part.trim())
            .filter(Boolean)
        if (parts.length > 1) {
            subtitle = parts.slice(1).join(', ')
        }
    }
    return {
        id: item.place_id || item.description,
        name,
        subtitle,
        description: item.description || '',
        type: item.types?.[0] || '',
    }
}

function getCountryMatchTerms(countryLabel) {
    const key = String(countryLabel || '').trim().toLowerCase()
    if (!key) return COUNTRY_MATCH_ALIASES['united arab emirates']
    return COUNTRY_MATCH_ALIASES[key] || [key]
}

function predictionHaystack(prediction) {
    return [
        prediction?.description,
        prediction?.structured_formatting?.secondary_text,
        prediction?.structured_formatting?.main_text,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
}

export function predictionMatchesLocationScope(prediction, cityLabel, countryLabel) {
    if (!isAllCitiesLabel(cityLabel)) {
        const city = String(cityLabel || '')
            .trim()
            .toLowerCase()
        if (!city) return true
        return predictionHaystack(prediction).includes(city)
    }

    const terms = getCountryMatchTerms(countryLabel)
    const haystack = predictionHaystack(prediction)
    return terms.some((term) => haystack.includes(term))
}

