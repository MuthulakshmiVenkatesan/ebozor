export function getLangCode(lang) {
    if (!lang || typeof lang !== 'object') return 'en'
    return String(lang.language_code || lang.code || 'en').toLowerCase()
}

export function isRtlLanguage(lang) {
    if (!lang || typeof lang !== 'object') return false
    const rtl = lang.rtl
    if (rtl === true || rtl === 1 || rtl === '1') return true
    return getLangCode(lang) === 'ar'
}

export function applyDocumentDirection(lang, { fallbackCode } = {}) {
    if (typeof document === 'undefined') return

    const body = document.body
    const code = lang && typeof lang === 'object' && !isEmptyLang(lang)
        ? getLangCode(lang)
        : String(fallbackCode || 'en').toLowerCase()
    const isRtl = lang && typeof lang === 'object' && !isEmptyLang(lang)
        ? isRtlLanguage(lang)
        : code === 'ar'

    document.documentElement.dir = isRtl ? 'rtl' : 'ltr'
    document.documentElement.lang = code
    body?.classList.toggle('rtl', isRtl)
}

function isEmptyLang(lang) {
    return Object.keys(lang).length === 0
}
