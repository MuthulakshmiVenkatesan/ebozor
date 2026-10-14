/**
 * WhatsApp click-to-chat URLs (public endpoints). Override via NEXT_PUBLIC_* env vars.
 */

const DEFAULT_SEND_BASE = 'https://api.whatsapp.com/send'
const DEFAULT_WA_ME_BASE = 'https://wa.me'

function readEnv(key) {
    if (typeof process === 'undefined') return ''
    const v = process.env[key]
    return v != null ? String(v).trim() : ''
}

/** Base path for `api.whatsapp.com/send` style links (no trailing slash). */
export function getWhatsAppSendBaseUrl() {
    return (readEnv('NEXT_PUBLIC_WHATSAPP_SEND_BASE_URL') || DEFAULT_SEND_BASE).replace(/\/+$/, '')
}

/** Base for `wa.me` short links (no trailing slash). */
export function getWhatsAppWaMeBaseUrl() {
    return (readEnv('NEXT_PUBLIC_WHATSAPP_WA_ME_BASE_URL') || DEFAULT_WA_ME_BASE).replace(/\/+$/, '')
}

/**
 * Opens Meta’s send page (Web / app choice on desktop, app on mobile).
 * @param {string} phoneDigits E.164-style digits only, no leading +
 * @param {string} [message] Optional pre-filled message
 */
export function buildWhatsAppSendUrl(phoneDigits, message) {
    if (!phoneDigits) return ''
    const digits = String(phoneDigits).replace(/\D/g, '')
    if (!digits) return ''
    const params = new URLSearchParams({ phone: digits })
    const text = message != null ? String(message).trim() : ''
    if (text) params.set('text', text)
    return `${getWhatsAppSendBaseUrl()}/?${params.toString()}`
}

/**
 * `wa.me/<phone>?text=...` — phone may include formatting; digits are extracted.
 */
export function buildWhatsAppMeUrl(phone, message) {
    const raw = phone != null ? String(phone).trim() : ''
    if (!raw) return ''
    const digits = raw.replace(/\D/g, '')
    if (!digits) return ''
    const path = `${getWhatsAppWaMeBaseUrl()}/${digits}`
    const text = message != null ? String(message).trim() : ''
    if (text) return `${path}?text=${encodeURIComponent(text)}`
    return path
}

/** `wa.me/?text=...` when no destination number is fixed (user picks chat). */
export function buildWhatsAppMeTextShareUrl(plainText) {
    const t = plainText != null ? String(plainText) : ''
    return `${getWhatsAppWaMeBaseUrl()}/?text=${encodeURIComponent(t)}`
}
