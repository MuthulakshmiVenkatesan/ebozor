/**
 * Canonical site origin and share links from env (NEXT_PUBLIC_*).
 * Set NEXT_PUBLIC_WEB_URL in .env to your public site root, e.g. https://example.com
 */

function readEnv(key) {
    if (typeof process === 'undefined') return ''
    const v = process.env[key]
    return v != null ? String(v).trim() : ''
}

/** Site origin with no trailing slash. */
export function getPublicWebUrl() {
    return readEnv('NEXT_PUBLIC_WEB_URL').replace(/\/+$/, '')
}

/**
 * Absolute URL: `NEXT_PUBLIC_WEB_URL` + path (path should start with `/`, may include `?query`).
 * If WEB_URL is unset, returns the path only (relative).
 */
export function absoluteUrl(path) {
    if (path == null || path === '') return getPublicWebUrl() || ''
    const p = String(path).startsWith('/') ? String(path) : `/${path}`
    const origin = getPublicWebUrl()
    if (!origin) return p
    return `${origin}${p}`
}

export function getSharePathFavourites() {
    return readEnv('NEXT_PUBLIC_SHARE_PATH_FAVOURITES') || '/favourites'
}

export function getSharePathMysearch() {
    return readEnv('NEXT_PUBLIC_SHARE_PATH_MYSEARCH') || '/mysearch'
}

export function getDefaultFavouritesShareUrl() {
    return absoluteUrl(getSharePathFavourites())
}

export function getDefaultMysearchShareUrl() {
    return absoluteUrl(getSharePathMysearch())
}

export function getShareFacebookHashtag() {
    return readEnv('NEXT_PUBLIC_SHARE_FACEBOOK_HASHTAG')
}

export function getShareEmailSubjectViewList() {
    return readEnv('NEXT_PUBLIC_SHARE_EMAIL_SUBJECT_VIEW_LIST') || 'View my list'
}

export function getShareDefaultListTitle() {
    return readEnv('NEXT_PUBLIC_SHARE_DEFAULT_LIST_TITLE') || 'My Saved Search'
}

function shareEndpointBase(envKey, fallback) {
    const raw = readEnv(envKey) || fallback
    return String(raw).split('?')[0].replace(/\/+$/, '')
}

/** Facebook sharer: `NEXT_PUBLIC_SHARE_FACEBOOK_SHARER_URL` (path only, no `?u=`). */
export function buildFacebookSharerUrl(urlToShare) {
    const base = shareEndpointBase(
        'NEXT_PUBLIC_SHARE_FACEBOOK_SHARER_URL',
        'https://www.facebook.com/sharer/sharer.php'
    )
    return `${base}?u=${encodeURIComponent(urlToShare)}`
}

/** X/Twitter intent: `NEXT_PUBLIC_SHARE_TWITTER_INTENT_URL` (path only). */
export function buildTwitterIntentShareUrl(urlToShare) {
    const base = shareEndpointBase(
        'NEXT_PUBLIC_SHARE_TWITTER_INTENT_URL',
        'https://twitter.com/intent/tweet'
    )
    return `${base}?url=${encodeURIComponent(urlToShare)}`
}
