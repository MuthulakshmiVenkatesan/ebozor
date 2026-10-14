/* eslint-disable react/prop-types */
'use client'

import { useState } from 'react'
import Image from 'next/image'
import tick from '../../../../../public/assets/img/icons/tick.svg'

const INTRO =
    'You are eligible to rent a car across the emirates provided you have the below mentioned documents valid with you:'

const FOOTNOTE =
    'Visitors from the GCC, US, UK, Canada, Europe and certain other countries can drive with their home country driving license, without the need of an IDP.'

const RESIDENTS_ITEMS = [
    { id: 'dl', title: 'UAE Driving License' },
    {
        id: 'eid',
        title: 'Emirates ID',
        sub: '(Residential Visa may be acceptable)',
    },
]

const TOURIST_ITEMS = [
    { id: 'passport', title: 'Passport' },
    { id: 'visa', title: 'Visit Visa' },
    { id: 'home_dl', title: 'Home Country Driving License' },
    { id: 'idp', title: 'International Driving Permit (IDP)' },
]

function customFieldValue(productData, ...names) {
    const fields = productData?.custom_fields
    if (!Array.isArray(fields)) return ''
    const lower = names.map((n) => String(n || '').toLowerCase())
    const row = fields.find((f) => lower.includes(String(f?.name || '').toLowerCase()))
    if (!row) return ''
    const v = row?.custom_field_value?.value ?? row?.value
    if (Array.isArray(v)) return v.filter(Boolean).join('\n') || ''
    return v != null && v !== '' ? String(v) : ''
}

function parseDocList(raw, fallback) {
    if (!raw) return fallback
    if (Array.isArray(raw)) {
        const rows = raw.map((x) => String(x || '').trim()).filter(Boolean)
        return rows.length ? rows.map((t, idx) => ({ id: `${idx}`, title: t })) : fallback
    }
    const text = String(raw).trim()
    if (!text) return fallback
    const parts = text
        .split(/\r?\n|,|;/g)
        .map((s) => s.trim())
        .filter(Boolean)
    return parts.length ? parts.map((t, idx) => ({ id: `${idx}`, title: t })) : fallback
}

function DocumentRow({ title, sub }) {
    return (
        <div className="flex items-center gap-[12px] border-b border-[rgba(143,143,143,0.28)] py-[16px]">
            <Image src={tick} alt="tick" width={16} height={16} className="h-[16px] w-[16px] object-contain" />
            <div className="min-w-0 flex flex-col gap-[4px]">
                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{title}</p>
                {sub ? (
                    <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{sub}</p>
                ) : null}
            </div>
        </div>
    )
}

export default function MotorsRentalDocumentsSection({ productData = {} }) {
    const [tab, setTab] = useState('residents')

    const introText = customFieldValue(productData, 'Documents Required Intro', 'Documents intro') || INTRO
    const footnoteText = customFieldValue(productData, 'Documents Required Footnote', 'Documents footnote') || FOOTNOTE
    const residentsOverride = customFieldValue(productData, 'Documents for Residents', 'Residents documents')
    const touristsOverride = customFieldValue(productData, 'Documents for Tourists', 'Tourists documents')

    const residentsItems = parseDocList(residentsOverride, RESIDENTS_ITEMS)
    const touristItems = parseDocList(touristsOverride, TOURIST_ITEMS)
    const items = tab === 'residents' ? residentsItems : touristItems

    return (
        <div className="border-b border-[rgba(143,143,143,0.35)] py-[30px]">
            <h2 className="text-[24px] font-[Inter-Bold] text-[#23262a] mb-[24px]">Documents Required</h2>
            <p className="text-[14px] font-[Inter-Regular] leading-[24px] text-[#23262A]">
                {introText}
            </p>

            <div className="mt-[24px] flex flex-wrap gap-[8px] ">
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'residents'}
                    onClick={() => setTab('residents')}
                    className={`-mb-px cursor-pointer border-b-[3px] p-[8px_14px] text-[14px] transition-colors ${
                        tab === 'residents'
                            ? 'border-[#DC0000] font-[Inter-SemiBold] text-[#23262A]'
                            : 'border-transparent font-[Inter-Regular] text-[#8F8F8F]'
                    }`}
                >
                    UAE Residents
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'tourists'}
                    onClick={() => setTab('tourists')}
                    className={`-mb-px ml-[20px] cursor-pointer border-b-[3px] p-[8px_14px] text-left text-[14px] transition-colors max-sm:ml-[12px] ${
                        tab === 'tourists'
                            ? 'border-[#DC0000] font-[Inter-SemiBold] text-[#23262A]'
                            : 'border-transparent font-[Inter-Regular] text-[#8F8F8F]'
                    }`}
                >
                    Tourists visiting the UAE
                </button>
            </div>

            <div className="mt-[4px]" role="tabpanel">
                {items.map((row) => (
                    <DocumentRow key={row.id} title={row.title} sub={row.sub} />
                ))}
            </div>

            <p className="mt-[24px] text-[14px] font-[Inter-Regular] leading-[24px] text-[#23262A]">
                {footnoteText}
            </p>
        </div>
    )
}
