/* eslint-disable react/prop-types */
'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import infoicon from '../../../../../public/assets/img/icons/info.svg'

function pickString(...vals) {
    for (const v of vals) {
        if (v != null && String(v).trim() !== '') return String(v).trim()
    }
    return ''
}

function extractCustomFieldValue(productData, fieldName) {
    const rows = Array.isArray(productData?.custom_fields) ? productData.custom_fields : []
    const found = rows.find(
        (row) => String(row?.name || '').trim().toLowerCase() === String(fieldName || '').trim().toLowerCase()
    )
    const v = found?.custom_field_value?.value ?? found?.value
    if (Array.isArray(v)) {
        const first = v.find((x) => x != null && String(x).trim() !== '')
        return first != null ? String(first).trim() : ''
    }
    return v != null ? String(v).trim() : ''
}


const DEMO_MILESTONES = [
    { label: 'Down Payment', percent: '10%', highlight: true },
    { label: 'Pre Handover', payment: 'Payment', percent: '40%', highlight: false, showInfo: true },
    { label: 'On Handover', percent: '50%', highlight: true },
]

function normalizeMilestone(raw, index) {
    const label = pickString(raw.label, raw.milestone, raw.title, raw.name, `Step ${index + 1}`)
    const percent = pickString(raw.percent, raw.percentage, raw.to_be_paid, raw.amount_label)
    const pct = percent || (raw.value != null ? `${raw.value}%` : '—')
    const highlight = Boolean(raw.highlight ?? raw.filled ?? raw.emphasized)
    const showInfo = Boolean(raw.showInfo ?? raw.info ?? raw.has_info)
    const payment = Boolean(raw.payment ?? raw.payment_label ?? raw.payment_amount)
    return { label, percent: pct, highlight, showInfo, payment }
}

function getMilestonesFromProduct(productData) {
    const raw =
        productData.payment_plan_milestones ||
        productData.paymentPlanMilestones ||
        productData.payment_plan ||
        productData.paymentPlan ||
        productData.milestones
    if (Array.isArray(raw) && raw.length) {
        return raw.map((m, i) => normalizeMilestone(m, i))
    }
    const downPayment = extractCustomFieldValue(productData, 'Down Payment')
    const preHandover = extractCustomFieldValue(productData, 'Pre Handover')
    const onHandover = extractCustomFieldValue(productData, 'On Handover')
    if (downPayment || preHandover || onHandover) {
        return [
            { label: 'Down Payment', percent: downPayment || '—', highlight: true },
            { label: 'Pre Handover', payment: 'Payment', percent: preHandover || '—', highlight: false, showInfo: true },
            { label: 'On Handover', percent: onHandover || '—', highlight: true },
        ].map((m, i) => normalizeMilestone(m, i))
    }
    return DEMO_MILESTONES.map((m, i) => normalizeMilestone(m, i))
}

export default function NewProjectPaymentPlan({ productData = {} }) {
    const milestones = useMemo(() => getMilestonesFromProduct(productData), [productData])

    if (!milestones.length) return null

    return (
        <div className="w-full border-b border-[rgba(143,143,143,0.35)] bg-white py-10 md:py-12">
            <div className="mb-[24px]">
                <h2 className="text-[24px] font-[Inter-Bold] text-[#23262A]">
                    Payment Plan
                </h2>
            </div>

            <div className="flex gap-3 sm:gap-4">
                <div className="w-6 shrink-0 sm:w-7" aria-hidden />
                <div className="mb-[14px] grid grid-cols-2 w-full justify-between gap-4 p-[0px_16px]">
                    <h4 className='text-[14px] font-[Inter-SemiBold] text-[#23262A] '>Milestone</h4>
                    <h4 className="text-[14px] font-[Inter-SemiBold] text-[#23262A]  shrink-0">To Be Paid</h4>
                </div>
            </div>

            <div className="flex flex-col gap-0">
                {milestones.map((item, index) => (
                    <div
                        key={`${item.label}-${index}`}
                        className="flex items-stretch gap-[10px]"
                    >
                        <div className="relative mt-[18px] flex w-6 shrink-0 flex-col items-center sm:w-7">
                            <div className="z-[1] flex w-[25px] h-[25px] shrink-0 items-center justify-center rounded-full bg-[#89b8f633]">
                                <span className="h-[12.5px] w-[12.5px] rounded-full bg-[#89B8F6]" />
                            </div>
                            {index < milestones.length - 1 ? (
                                <div className="relative [&:after]:content-[''] [&:after]:absolute [&:after]:top-0 [&:after]:left-[-2px] [&:after]:w-[2px] [&:after]:h-[48px] [&:after]:bg-[#89b8f64d]" aria-hidden />
                            ) : null}
                        </div>

                        <div
                            className={`min-w-0 flex-1 p-[18px] ${item.highlight
                                ? 'rounded-[8px] bg-[#F5F9FE] '
                                : ''
                                }`}
                        >
                            <div className="grid grid-cols-2 w-full items-start justify-between gap-4">
                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                    <h4 className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">
                                        {item.label}
                                    </h4>
                                    <div className="flex items-center gap-[8px]">
                                        {item.payment ? <div className="p-[2px] bg-[#23262A] rounded-full"></div> : null}
                                        {item.payment ? <h4 className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">Payment</h4> : null}
                                        {item.showInfo ? <Image src={infoicon} alt="Info" width={18} height={18} /> : null}
                                    </div>
                                </div>
                                <p className="shrink-0  text-[14px] font-[Inter-Regular] text-[#23262A]">
                                    {item.percent}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
