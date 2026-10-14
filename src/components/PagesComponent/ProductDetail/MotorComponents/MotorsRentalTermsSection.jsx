/* eslint-disable react/prop-types */
'use client'

import Image from 'next/image'
import { useMemo } from 'react'
import first from '../../../../../public/assets/img/rental/1.svg'
import second from '../../../../../public/assets/img/rental/2.svg'
import third from '../../../../../public/assets/img/rental/3.svg'
import fourth from '../../../../../public/assets/img/rental/4.svg'
import fifth from '../../../../../public/assets/img/rental/5.svg'

function firstTruthy(...vals) {
    for (const v of vals) {
        if (v !== undefined && v !== null && v !== '') return v
    }
    return ''
}

function customFieldValue(productData, ...names) {
    const fields = productData?.custom_fields
    if (!Array.isArray(fields)) return ''
    const lower = names.map((n) => n.toLowerCase())
    const row = fields.find((f) => lower.includes(String(f?.name || '').toLowerCase()))
    if (!row) return ''
    const v = row?.custom_field_value?.value ?? row?.value
    if (Array.isArray(v)) return v.filter(Boolean).join(', ') || ''
    return v != null && v !== '' ? String(v) : ''
}

function variantForDisplayText(text) {
    const t = String(text || '').toLowerCase().trim()
    if (t.includes('not required')) return 'neutral'
    if (t === 'free' || /\bfree\b/.test(t)) return 'neutral'
    if (t === 'included' || (t.includes('included') && !t.includes('not included'))) return 'positive'
    if (t === 'yes' && !t.includes('not')) return 'neutral'
    return 'neutral'
}


function RentalTermCell({ iconUrl, label, value, variant }) {
    const valueClass =
        variant === 'positive'
            ? 'text-[14px] font-[Inter-SemiBold] text-[#1DAD18]'
            : 'text-[14px] font-[Inter-SemiBold] text-[#23262A]'
    return (
        <div className="flex gap-[14px]">
            <div className="mt-[2px] shrink-0 text-[#23262A]">
                <Image src={iconUrl} alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
            </div>
            <div className="min-w-0">
                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{label}</p>
                <p className={`mt-[4px] leading-snug ${valueClass}`}>{value}</p>
            </div>
        </div>
    )
}

function buildRentalTerms(item) {
    const securityRaw = firstTruthy(
        item.security_deposit,
        item.security_deposit_required,
        customFieldValue(item, 'Security deposit', 'Security Deposit')
    )
    let securityText = '—'
    let securityVariant = 'neutral'
    if (securityRaw === false || securityRaw === 0) {
        securityText = 'Not Required'
        securityVariant = 'neutral'
    } else if (securityRaw === true || securityRaw === 1) {
        securityText = 'Required'
        securityVariant = 'neutral'
    } else if (securityRaw !== '' && securityRaw != null) {
        const s = String(securityRaw).trim()
        securityText = s
        securityVariant = variantForDisplayText(s)
    }

    const basicRaw = firstTruthy(
        item.basic_insurance,
        item.basic_insurance_included,
        customFieldValue(item, 'Basic Insurance', 'Basic insurance')
    )
    const basicText =
        basicRaw !== '' && basicRaw != null ? String(basicRaw).trim() : '—'
    const basicVariant = variantForDisplayText(basicText)

    const fullRaw = firstTruthy(
        item.full_insurance,
        item.full_insurance_terms,
        customFieldValue(item, 'Full Insurance', 'Full insurance')
    )
    const fullText =
        fullRaw !== '' && fullRaw != null ? String(fullRaw).trim() : '—'
    const fullVariant = variantForDisplayText(fullText)

    const minDaysRaw = firstTruthy(
        item.minimum_rental_days,
        item.min_rental_days,
        item.minimum_rental_period,
        customFieldValue(item, 'Minimum Rental', 'Minimum rental', 'Min rental')
    )
    let minRentalText = '—'
    if (minDaysRaw !== '' && minDaysRaw != null) {
        const n = typeof minDaysRaw === 'number' ? minDaysRaw : Number(String(minDaysRaw).replace(/\D/g, ''))
        if (!Number.isNaN(n) && n > 0) {
            minRentalText = `${n} day${n === 1 ? '' : 's'}`
        } else {
            minRentalText = String(minDaysRaw).trim()
        }
    }

    const ageRaw = firstTruthy(
        item.minimum_driver_age,
        item.min_driver_age,
        item.min_age,
        customFieldValue(item, "Minimum Driver's Age", "Minimum Driver’s Age", 'Minimum driver age', 'Min driver age')
    )
    let ageText = '—'
    if (ageRaw !== '' && ageRaw != null) {
        const n = typeof ageRaw === 'number' ? ageRaw : Number(String(ageRaw).replace(/\D/g, ''))
        if (!Number.isNaN(n) && n > 0) {
            ageText = `${n} years`
        } else {
            ageText = String(ageRaw).trim()
        }
    }

    const deliveryRaw = firstTruthy(
        item.delivery_pickup,
        item.delivery_and_pickup,
        item.free_delivery_pickup,
        customFieldValue(item, 'Delivery and Pickup', 'Delivery', 'Pickup')
    )
    let deliveryText = '—'
    let deliveryVariant = 'neutral'
    if (deliveryRaw !== '' && deliveryRaw != null) {
        deliveryText = String(deliveryRaw).trim()
        deliveryVariant = variantForDisplayText(deliveryText)
    }

    return [
        {
            id: 'security_deposit',
            iconUrl: first,
            label: 'Security deposit',
            value: securityText,
            variant: securityVariant,
        },
        {
            id: 'basic_insurance',
            iconUrl: second,
            label: 'Basic Insurance',
            value: basicText,
            variant: basicVariant,
        },
        {
            id: 'full_insurance',
            iconUrl: second,
            label: 'Full Insurance',
            value: fullText,
            variant: fullVariant,
        },
        {
            id: 'minimum_rental',
            iconUrl: third,
            label: 'Minimum Rental',
            value: minRentalText,
            variant: 'neutral',
        },
        {
            id: 'min_age',
            iconUrl: fourth,
            label: "Minimum Driver's Age",
            value: ageText,
            variant: 'neutral',
        },
        {
            id: 'delivery',
            iconUrl: fifth,
            label: 'Delivery and Pickup',
            value: deliveryText,
            variant: deliveryVariant,
        },
    ]
}

export default function MotorsRentalTermsSection({ productData = {} }) {
    const rows = useMemo(() => buildRentalTerms(productData || {}), [productData])

    return (
        <div className="border-b border-[rgba(143,143,143,0.35)] py-[30px]">
            <h2 className="mb-[24px] text-[24px] font-[Inter-Bold] text-[#23262a]">Rental Terms</h2>
            <div className="grid grid-cols-1 gap-x-[36px] gap-y-[28px] sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((row) => (
                    <RentalTermCell
                        key={row.id}
                        iconUrl={row.iconUrl}
                        label={row.label}
                        value={row.value}
                        variant={row.variant}
                    />
                ))}
            </div>
        </div>
    )
}
