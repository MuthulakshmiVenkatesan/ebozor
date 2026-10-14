'use client'

import React, { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

const REFERENCE = '9467949'

const PACKAGE_DETAILS = {
    Quick: {
        net: '404.00',
        vatLabel: '5% VAT',
        vat: '20.20',
        total: 424.2,
    },
    Super: {
        net: '989.00',
        vatLabel: '5% VAT',
        vat: '49.45',
        total: 1038.45,
    },
    Pro: {
        net: '1,889.00',
        vatLabel: '5% VAT',
        vat: '94.45',
        total: 1983.45,
    },
}

const DEFAULT_KEY = 'Super'

function formatTotal(amount) {
    const n = Number(amount)
    if (Number.isNaN(n)) return `AED ${amount}`
    return `AED ${n.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function Row({ label, value, valueClassName = '' }) {
    return (
        <div className="flex items-center justify-between p-[16px]">
            <h4 className="text-[14px] font-[Inter-Regular] text-[#23262A]">{label}</h4>
            <h4 className={`text-[14px] font-[Inter-Regular] text-[#23262A] ${valueClassName}`}>{value}</h4>
        </div>
    )
}

export default function PaymentSummary() {
    const searchParams = useSearchParams()
    const packageKey = useMemo(() => {
        const raw = searchParams.get('package') || ''
        const name = decodeURIComponent(raw).trim()
        if (name && PACKAGE_DETAILS[name]) return name
        return DEFAULT_KEY
    }, [searchParams])

    const details = PACKAGE_DETAILS[packageKey] || PACKAGE_DETAILS[DEFAULT_KEY]
    const totalFormatted = formatTotal(details.total)

    return (
        <div className="">
            <div className="mx-auto w-full max-w-[480px] rounded-[6px] border border-[#b6b8b980] bg-white p-[16px]">
                <header className="border-b border-[rgba(143,143,143,0.35)] pb-[20px] text-center">
                    <h1 className="text-[24px] font-[Inter-Bold] text-[#23262A] mb-[4px]">Payment Summary</h1>
                    <p className="text-[14px] font-[Inter-SemiBold] text-[#666666]">
                        Reference: {REFERENCE}
                    </p>
                </header>

                <div className="border-b border-[rgba(143,143,143,0.35)] p-[16px_24px]">
                    <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{packageKey}</p>
                </div>

                <Row label="Net Amount" value={details.net} />
                <Row label={details.vatLabel} value={details.vat} />
                <div className="border-b border-[rgba(143,143,143,0.35)]" />
                <Row label="Total Amount" value={totalFormatted} valueClassName="font-[Inter-Bold]" />
                <div className="border-b border-[rgba(143,143,143,0.35)]" />

                <div className="py-[14px] text-center border-b border-[rgba(143,143,143,0.35)]">
                    <p className="text-[16px] font-[Inter-SemiBold] text-[#4d4d4d] mb-[4px]">You will be charged</p>
                    <p className="text-[20px] font-[Inter-SemiBold] text-[#23262A]">{totalFormatted}</p>
                </div>

                <button
                    type="button"
                    className="mt-[20px] w-full cursor-pointer rounded-[6px] bg-[#DC0000] py-[12px] text-[14px] font-[Inter-SemiBold] text-white transition"
                >
                    Pay - {totalFormatted}
                </button>
            </div>
        </div>
    )
}
