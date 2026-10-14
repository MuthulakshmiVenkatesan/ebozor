import toast from 'react-hot-toast'
import { t } from '@/utils'

/** API `is_required`: 1 / true → required. */
export function normalizeCustomFieldRequired(raw) {
    const v = raw?.is_required ?? raw?.required
    return v === true || v === 1 || v === '1'
}

/** Positive numeric min/max length from API, else null. */
export function normalizeCustomFieldLength(v) {
    if (v == null || v === '') return null
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * Validate filled text/number custom values against min_length / max_length.
 * Empty values are skipped (required checks happen separately).
 */
export function validateCustomFieldTextLength({ name, value, minLength, maxLength, asDigits = false }) {
    const s = String(value ?? '').trim()
    if (!s) return true
    const unit = asDigits ? t('digitLong') || 'digit long' : t('charactersLong') || 'characters long'
    if (minLength && s.length < minLength) {
        toast.error(`${name} ${t('mustBeAtleast') || 'must be atleast'} ${minLength} ${unit}`)
        return false
    }
    if (maxLength && s.length > maxLength) {
        toast.error(`${name} ${t('mustBeAtMost') || 'must be at most'} ${maxLength} ${unit}`)
        return false
    }
    return true
}

export function isTextualCustomFieldType(type) {
    return type === 'text' || type === 'textbox' || type === 'number'
}
