/** Digits only (for local phone number part). */
export function sanitizePhoneDigits(raw, maxLength = 15) {
    const digits = String(raw ?? '').replace(/\D/g, '')
    return maxLength > 0 ? digits.slice(0, maxLength) : digits
}

/** Price: digits + optional single decimal point. */
export function sanitizeDecimalInput(raw) {
    let s = String(raw ?? '').replace(/[^\d.]/g, '')
    const firstDot = s.indexOf('.')
    if (firstDot !== -1) {
        s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '')
    }
    return s
}

/** Common dial codes used across Place Your Ad phone fields. */
export const PLACE_AD_COUNTRY_CODES = [
    '+971', '+966', '+974', '+973', '+968', '+965', '+962', '+961', '+20', '+91', '+92', '+94', '+880',
    '+1', '+44', '+49', '+33', '+39', '+34', '+31', '+32', '+41', '+43', '+46', '+47', '+45', '+48',
    '+90', '+7', '+86', '+81', '+82', '+65', '+60', '+62', '+63', '+66', '+84', '+61', '+64', '+27',
    '+234', '+254', '+233', '+212', '+213', '+216', '+218', '+249', '+251', '+255', '+256',
    '+351', '+353', '+358', '+420', '+421', '+36', '+40', '+380', '+375', '+994', '+995', '+998', '+993', '+992',
]

const COUNTRY_CODES_BY_LENGTH = [...PLACE_AD_COUNTRY_CODES].sort((a, b) => b.length - a.length)

/**
 * Split a stored contact value into country code + local digits.
 * Prefers the longest matching dial code from PLACE_AD_COUNTRY_CODES.
 */
export function splitPhoneWithCountryCode(value, fallbackCode = '+971') {
    const raw = String(value ?? '').trim()
    if (!raw) {
        return { countryCode: fallbackCode, localNumber: '' }
    }

    const withPlus = raw.startsWith('+') ? raw : `+${raw.replace(/\D/g, '')}`
    for (const code of COUNTRY_CODES_BY_LENGTH) {
        if (withPlus === code || withPlus.startsWith(code)) {
            return {
                countryCode: code,
                localNumber: sanitizePhoneDigits(withPlus.slice(code.length)),
            }
        }
    }

    return {
        countryCode: fallbackCode,
        localNumber: sanitizePhoneDigits(withPlus),
    }
}

export function joinPhoneWithCountryCode(countryCode, localNumber) {
    const code = String(countryCode || '+971').trim() || '+971'
    const local = sanitizePhoneDigits(localNumber)
    return `${code}${local}`
}

export function isPhoneBareCountryCode(value, fallbackCode = '+971') {
    const { countryCode, localNumber } = splitPhoneWithCountryCode(value, fallbackCode)
    return localNumber.length === 0 && (String(value ?? '').trim() === '' || String(value ?? '').trim() === countryCode)
}
