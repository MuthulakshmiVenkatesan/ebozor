/* eslint-disable react/prop-types */
'use client'

import Image from 'next/image'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import infoIc from '../../../../../public/assets/img/icons/info.svg'
import { TickIcon } from '@/components/CustomFile/icons'

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

function parsePositiveNumber(raw) {
    if (raw === undefined || raw === null || raw === '') return null
    if (typeof raw === 'number' && !Number.isNaN(raw) && raw > 0) return raw
    const n = Number(String(raw).replace(/[^\d.]/g, ''))
    return !Number.isNaN(n) && n > 0 ? n : null
}

function formatPriceAmount(n, currencySymbol) {
    if (n == null || Number.isNaN(n)) return '—'
    return `${currencySymbol} ${Number(n).toLocaleString('en-US')}`
}

function formatKmLine(rawNum, rawString, periodLabel, fallbackNum) {
    const str = String(rawString || '').trim()
    if (str) return str
    const n = parsePositiveNumber(rawNum)
    if (n == null) return '—'
    return `${Number(n).toLocaleString('en-US')} km/${periodLabel}`
}

function formatExtraKmLine(currencySymbol, raw) {
    const n = parsePositiveNumber(raw)
    if (n == null) return '—'
    return `${currencySymbol} ${n} for each additional km`
}



function RentTierCard({ title, priceDisplay, kmLine, extraKmLine }) {
    return (
        <div className="flex min-w-0 flex-1 flex-col rounded-[4px] bg-[#23262a0a] p-[8px] ">
            <h4 className="mb-[4px] text-[14px] font-[Inter-Bold] uppercase text-[#a3a6aa]">{title}</h4>
            <p className="mb-[4px] text-[18px] font-[Inter-Bold] leading-tight text-[#23262a]">{priceDisplay}</p>
            <p className="mb-[4px] text-[12px] font-[Inter-Regular] leading-snug text-[#666b72]">{kmLine}</p>
            <p className="mb-[4px] text-[12px] font-[Inter-Regular] leading-snug text-[#666b72]">{extraKmLine}</p>
        </div>
    )
}

function buildPricingModel(item, currencySymbol) {
    const dailyAmount =
        parsePositiveNumber(
            firstTruthy(
                item.daily_rent,
                item.rent_daily,
                item.price_per_day,
                item.daily_price,
                customFieldValue(item, 'Daily Rent', 'Daily rent', 'Rent per day')
            )
        )

    const weeklyAmount =
        parsePositiveNumber(
            firstTruthy(
                item.weekly_rent,
                item.rent_weekly,
                item.price_per_week,
                item.weekly_price,
                customFieldValue(item, 'Weekly Rent', 'Weekly rent')
            )
        )

    const monthlyAmount =
        parsePositiveNumber(
            firstTruthy(
                item.monthly_rent,
                item.rent_monthly,
                item.price_per_month,
                item.monthly_price,
                customFieldValue(item, 'Monthly Rent', 'Monthly rent')
            )
        )

    const extraKmRaw = firstTruthy(
        item.extra_km_charge,
        item.additional_km_price,
        item.per_km_charge,
        customFieldValue(item, 'Additional Km Charge', 'Extra km charge', 'Additional km', 'Per km')
    )

    const dailyKmLine = formatKmLine(
        firstTruthy(item.daily_km_limit, item.km_per_day, item.daily_mileage_limit),
        customFieldValue(item, 'Km per day', 'Daily km limit', 'Daily mileage'),
        'day',
        null
    )
    const weeklyKmLine = formatKmLine(
        firstTruthy(item.weekly_km_limit, item.km_per_week),
        customFieldValue(item, 'Km per week', 'Weekly km limit'),
        'week',
        null
    )
    const monthlyKmLine = formatKmLine(
        firstTruthy(item.monthly_km_limit, item.km_per_month),
        customFieldValue(item, 'Km per month', 'Monthly km limit'),
        'month',
        null
    )

    const minDays =
        parsePositiveNumber(
            firstTruthy(
                item.minimum_rental_days,
                item.min_rental_days,
                customFieldValue(item, 'Minimum Rental', 'Minimum rental days')
            )
        )

    const basicInsuranceLabel = firstTruthy(
        item.rental_basic_insurance_label,
        customFieldValue(item, 'Basic Insurance', 'Rental insurance note')
    )
    const insuranceLine = basicInsuranceLabel || '—'

    return {
        tiers: [
            {
                id: 'daily',
                title: 'Daily rent',
                price: formatPriceAmount(dailyAmount, currencySymbol),
                km: dailyKmLine,
                extra: formatExtraKmLine(currencySymbol, extraKmRaw),
            },
            {
                id: 'weekly',
                title: 'Weekly rent',
                price: formatPriceAmount(weeklyAmount, currencySymbol),
                km: weeklyKmLine,
                extra: formatExtraKmLine(currencySymbol, extraKmRaw),
            },
            {
                id: 'monthly',
                title: 'Monthly rent',
                price: formatPriceAmount(monthlyAmount, currencySymbol),
                km: monthlyKmLine,
                extra: formatExtraKmLine(currencySymbol, extraKmRaw),
            },
        ],
        minDays,
        insuranceLine,
    }
}

export default function MotorsRentalPricingSection({ productData = {} }) {
    const item = productData || {}
    const currencySymbol = useSelector((state) => state?.Settings?.data?.data?.currency_symbol ?? 'AED')

    const model = useMemo(() => buildPricingModel(item, currencySymbol), [item, currencySymbol])

    return (
        <div className="">
            <div className="flex flex-col gap-[14px] sm:flex-row sm:gap-[16px] mb-[20px]">
                {model.tiers.map((t) => (
                    <RentTierCard
                        key={t.id}
                        title={t.title}
                        priceDisplay={t.price}
                        kmLine={t.km}
                        extraKmLine={t.extra}
                    />
                ))}
            </div>

            <div className="flex gap-[16px] ">
                {model.minDays != null ? (
                    <div className="flex min-w-0 items-center gap-[4px] ">
                        <div className="flex shrink-0 items-center justify-center rounded-full">
                            <Image src={infoIc} alt="" width={16} height={16} className="h-[16px] w-[16px] object-contain " />
                        </div>
                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                            Minimum {model.minDays} day{model.minDays === 1 ? '' : 's'} rental
                        </p>
                    </div>
                ) : null}
                {model.minDays != null && model.insuranceLine !== '—' ? (
                    <div className='bg-[rgba(143,143,143,0.35)] w-[1px] h-[20px]'></div>
                ) : null}
                {model.insuranceLine !== '—' ? (
                    <div className="flex min-w-0 items-center gap-[4px]">
                        <TickIcon fill="green" className='h-[24px] w-[24px]' />
                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{model.insuranceLine}</p>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
