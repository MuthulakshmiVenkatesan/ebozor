/**
 * Promotion badge — get-item fields:
 * badge_label, badge_color, promotion_tag_key
 */

function normalizeBoolean(...vals) {
    for (const v of vals) {
        if (v === true) return true
        if (typeof v === 'string') {
            const s = v.trim().toLowerCase()
            if (s === '1' || s === 'true' || s === 'yes') return true
        }
        if (typeof v === 'number' && v === 1) return true
    }
    return false
}

function inferVariant(promotionTagKey, label) {
    const key = String(promotionTagKey || '')
        .trim()
        .toLowerCase()
        .replace(/-/g, '_')
    if (key === 'premium') return 'premium'
    if (key === 'featured') return 'featured'
    if (key === 'standard') return 'standard'
    const l = String(label || '').trim().toLowerCase()
    if (l.includes('premium')) return 'premium'
    if (l.includes('featured')) return 'featured'
    if (l === 'standard' || l.includes('standard')) return 'standard'
    return 'default'
}

function isStandardPromotion(promotionTagKey, label) {
    return inferVariant(promotionTagKey, label) === 'standard'
}

/** WCAG-ish contrast: pick dark or light text on solid backgrounds; gradients → white text. */
function pickBadgeTextColor(backgroundCss) {
    const s = String(backgroundCss || '').trim().toLowerCase()
    if (s.includes('gradient')) return '#ffffff'

    let r = 99
    let g = 99
    let b = 99

    const hexMatch = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s)
    if (hexMatch) {
        let h = hexMatch[1]
        if (h.length === 3) h = [...h].map((c) => c + c).join('')
        r = parseInt(h.slice(0, 2), 16)
        g = parseInt(h.slice(2, 4), 16)
        b = parseInt(h.slice(4, 6), 16)
    } else {
        const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(s)
        if (rgb) {
            r = Number(rgb[1])
            g = Number(rgb[2])
            b = Number(rgb[3])
        }
    }

    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    return lum > 0.58 ? '#17191C' : '#ffffff'
}

const PILL_BASE = 'rounded-[6px] p-[3px_5px] text-[10px] font-[Inter-Bold] uppercase shrink-0'

/**
 * @param {Record<string, unknown>} item
 * @returns {{ label: string, variant: string, promotionTagKey: string|null, badgeColor: string|null }}
 */
export function getProductPromotionBadge(item) {
    const raw =
        (typeof item?.badge_label === 'string' && item.badge_label.trim()) ||
        (typeof item?.badgeLabel === 'string' && item.badgeLabel.trim()) ||
        (typeof item?.tag_label === 'string' && item.tag_label.trim()) ||
        ''

    const promotionKeyRaw =
        (typeof item?.promotion_tag_key === 'string' && item.promotion_tag_key.trim()) ||
        (typeof item?.promotionTagKey === 'string' && item.promotionTagKey.trim()) ||
        ''

    const badgeColor =
        (typeof item?.badge_color === 'string' && item.badge_color.trim()) ||
        (typeof item?.badgeColor === 'string' && item.badgeColor.trim()) ||
        null

    if (raw) {
        const variant = inferVariant(promotionKeyRaw, raw)
        if (variant === 'standard') {
            return { label: '', variant: 'standard', promotionTagKey: 'standard', badgeColor: null }
        }
        const promotionTagKey = promotionKeyRaw
            ? promotionKeyRaw.trim().toLowerCase().replace(/-/g, '_')
            : variant !== 'default'
              ? variant
              : null
        return { label: raw, variant, promotionTagKey, badgeColor }
    }

    const isPremium = normalizeBoolean(item?.is_premium, item?.premium, item?.isPremium, item?.show_only_to_premium)
    const isFeatured = normalizeBoolean(item?.is_feature, item?.featured, item?.isFeatured, item?.is_featured)
    if (isPremium) return { label: 'Premium', variant: 'premium', promotionTagKey: 'premium', badgeColor }
    if (isFeatured) return { label: 'Featured', variant: 'featured', promotionTagKey: 'featured', badgeColor }
    if (isStandardPromotion(promotionKeyRaw, raw)) {
        return { label: '', variant: 'standard', promotionTagKey: 'standard', badgeColor: null }
    }
    return { label: '', variant: 'default', promotionTagKey: null, badgeColor }
}

/** Search / classified / jobs row chip */
export function promotionBadgePillAppearance(badge) {
    const bg = typeof badge?.badgeColor === 'string' ? badge.badgeColor.trim() : ''
    if (bg) {
        return {
            className: PILL_BASE,
            style: { background: bg, color: pickBadgeTextColor(bg) },
        }
    }

    const v = badge?.variant || 'default'
    if (v === 'premium') {
        return {
            className: `${PILL_BASE} bg-[linear-gradient(95.78deg,_rgb(255,189,61)_2.35%,_rgb(241,162,7)_95.78%)] text-white`,
            style: {},
        }
    }
    if (v === 'featured') {
        return {
            className: `${PILL_BASE} bg-[linear-gradient(94.47deg,_rgb(77,159,235)_2.35%,_rgb(18,112,236)_95.78%)] text-white`,
            style: {},
        }
    }
    return {
        className: `${PILL_BASE} bg-[linear-gradient(94.47deg,_rgb(107,114,128)_2.35%,_rgb(75,85,99)_95.78%)] text-white`,
        style: {},
    }
}

/** @deprecated prefer promotionBadgePillAppearance */
export function promotionBadgePillClassName(variant) {
    return promotionBadgePillAppearance({ variant }).className
}

/** Property card — keeps soft premium chip when no custom color */
export function promotionBadgePropertyAppearance(badge) {
    const bg = typeof badge?.badgeColor === 'string' ? badge.badgeColor.trim() : ''
    if (bg) {
        return {
            className: 'rounded-[6px] p-[3px_5px] text-[10px] font-[Inter-Bold] uppercase shrink-0',
            style: { background: bg, color: pickBadgeTextColor(bg) },
        }
    }

    const v = badge?.variant || 'default'
    if (v === 'premium') {
        return {
            className: 'rounded-[6px] bg-[#fff3e0] p-[3px_5px] text-[10px] font-[Inter-Bold] text-[#ffa726] uppercase shrink-0',
            style: {},
        }
    }
    if (v === 'featured') {
        return {
            className:
                'rounded-[6px] bg-[linear-gradient(94.47deg,_rgb(77,159,235)_2.35%,_rgb(18,112,236)_95.78%)] p-[3px_5px] text-[10px] font-[Inter-Bold] text-white uppercase shrink-0',
            style: {},
        }
    }
    return {
        className: 'rounded-[6px] bg-[#F3F4F6] p-[3px_5px] text-[10px] font-[Inter-Bold] text-[#4b5563] uppercase shrink-0',
        style: {},
    }
}

/** @deprecated prefer promotionBadgePropertyAppearance */
export function promotionBadgePropertyClassName(variant) {
    return promotionBadgePropertyAppearance({ variant }).className
}

const OVERLAY_BASE =
    'absolute right-[10px] top-[10px] z-[2] rounded-[6px] px-[8px] py-[3px] text-[10px] font-[Inter-Bold] uppercase'

/** New-project image overlay */
export function promotionBadgeOverlayAppearance(badge) {
    const bg = typeof badge?.badgeColor === 'string' ? badge.badgeColor.trim() : ''
    if (bg) {
        return {
            className: OVERLAY_BASE,
            style: { background: bg, color: pickBadgeTextColor(bg) },
        }
    }

    const v = badge?.variant || 'default'
    if (v === 'premium') {
        return {
            className: `${OVERLAY_BASE} bg-[linear-gradient(95.78deg,_rgb(255,189,61)_2.35%,_rgb(241,162,7)_95.78%)] text-white`,
            style: {},
        }
    }
    if (v === 'featured') {
        return {
            className: `${OVERLAY_BASE} bg-[linear-gradient(94.47deg,_rgb(77,159,235)_2.35%,_rgb(18,112,236)_95.78%)] text-white`,
            style: {},
        }
    }
    return {
        className: `${OVERLAY_BASE} bg-[linear-gradient(94.47deg,_rgb(107,114,128)_2.35%,_rgb(75,85,99)_95.78%)] text-white`,
        style: {},
    }
}

/** @deprecated prefer promotionBadgeOverlayAppearance */
export function promotionBadgeOverlayClassName(variant) {
    return promotionBadgeOverlayAppearance({ variant }).className
}

/**
 * Edit-listing: show plan/payment only when featured/premium addon expired
 * (or the listing is still unpaid). Active or never-promoted ads skip checkout.
 */
export function shouldShowPlanPaymentAfterEdit(item) {
    if (!item) return false
    const status = String(item.status || '')
        .toLowerCase()
        .trim()
    if (status === 'pending payment' || status === 'payment pending') return true

    const isPremium = normalizeBoolean(item?.is_premium, item?.premium, item?.isPremium)
    const isFeatured = normalizeBoolean(item?.is_feature, item?.featured, item?.isFeatured, item?.is_featured)
    if (isPremium || isFeatured) return false

    return normalizeBoolean(item?.is_promotion_expired)
}
