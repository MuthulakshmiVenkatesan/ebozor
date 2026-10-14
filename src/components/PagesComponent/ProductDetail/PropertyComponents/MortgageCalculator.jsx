/* eslint-disable react/prop-types */
'use client'

import { useState } from 'react'
import { RightArrowIcon } from '@/components/parts/icons'
import PaymentModal from './PaymentModal'

const RESIDENCY_OPTIONS = [
    { id: 'national', label: 'National', downPercent: 25 },
    { id: 'resident', label: 'Resident', downPercent: 30 },
    { id: 'non-resident', label: 'Non-Resident', downPercent: 40 },
]

function formatAED(n) {
    return Number(n || 0).toLocaleString('en-US')
}

function calcMonthlyPayment(principal, annualRate, years) {
    const r = annualRate / 12
    const n = years * 12
    if (r <= 0 || n <= 0) return principal / Math.max(n, 1)
    const top = principal * r * Math.pow(1 + r, n)
    const bottom = Math.pow(1 + r, n) - 1
    return bottom === 0 ? 0 : top / bottom
}

function toNumber(value, fallback = 0) {
    const n = Number(value)
    return Number.isNaN(n) ? fallback : n
}

export default function MortgageCalculator({ productData }) {
    const basePriceRaw = Number(
        productData?.price ||
        productData?.amount ||
        productData?.sale_price ||
        productData?.price_value ||
        5100000
    )
    const initialPrice = Number.isNaN(basePriceRaw) || basePriceRaw <= 0 ? 5100000 : basePriceRaw

    const defaultResidency = 'national'
    const defaultDownPercent = RESIDENCY_OPTIONS.find((x) => x.id === defaultResidency)?.downPercent ?? 25

    const [selectedResidency, setSelectedResidency] = useState(defaultResidency)
    const [propertyPrice, setPropertyPrice] = useState(initialPrice)
    const [downPaymentPercent, setDownPaymentPercent] = useState(defaultDownPercent)
    const [downPaymentAmount, setDownPaymentAmount] = useState(Math.round((initialPrice * defaultDownPercent) / 100))
    const [loanYears, setLoanYears] = useState(25)
    const [interestRate, setInterestRate] = useState(3.75)
    const [isBreakdownOpen, setIsBreakdownOpen] = useState(false)

    const principal = Math.max(0, propertyPrice - downPaymentAmount)
    const annualRate = Math.max(0, interestRate) / 100
    const monthlyPayment = Math.round(calcMonthlyPayment(principal, annualRate, Math.max(1, loanYears)))

    const onResidencyChange = (residencyId) => {
        setSelectedResidency(residencyId)
        const hit = RESIDENCY_OPTIONS.find((x) => x.id === residencyId) || RESIDENCY_OPTIONS[1]
        const pct = Math.min(100, Math.max(0, hit.downPercent))
        setDownPaymentPercent(pct)
        setDownPaymentAmount(Math.round((propertyPrice * pct) / 100))
    }

    const onPropertyPriceChange = (value) => {
        const nextPrice = Math.max(0, toNumber(value, 0))
        setPropertyPrice(nextPrice)
        const safePct = Math.min(100, Math.max(0, toNumber(downPaymentPercent, 0)))
        setDownPaymentAmount(Math.round((nextPrice * safePct) / 100))
    }

    const onDownPaymentAmountChange = (value) => {
        const nextAmount = Math.min(propertyPrice, Math.max(0, toNumber(value, 0)))
        setDownPaymentAmount(nextAmount)
        if (propertyPrice > 0) {
            const pct = (nextAmount / propertyPrice) * 100
            setDownPaymentPercent(Number(pct.toFixed(2)))
        } else {
            setDownPaymentPercent(0)
        }
    }

    const onDownPaymentPercentChange = (value) => {
        const nextPercent = Math.min(100, Math.max(0, toNumber(value, 0)))
        setDownPaymentPercent(nextPercent)
        setDownPaymentAmount(Math.round((propertyPrice * nextPercent) / 100))
    }

    return (
        <div className="border-b border-[rgba(143,143,143,0.35)] py-[40px]">
            <h2 className="mb-[24px] text-[22px] font-[Inter-Bold] text-[#23262A]">Mortgage Calculator</h2>
            <div className="grid grid-cols-2 gap-[14px] mb-[24px] max-md:grid-cols-1 ">
                <div>
                    <div className='mb-[30px]'>
                        <p className="mb-[6px] text-[14px] font-[Inter-Regular] text-[#666b72]">UAE Residency Status</p>
                        <div className="flex gap-[8px]">
                            {RESIDENCY_OPTIONS.map((option) => {
                                const activeBtn = option.id === selectedResidency
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => onResidencyChange(option.id)}
                                        className={`w-full cursor-pointer rounded-[6px] border p-[6px_10px] text-[14px] ${activeBtn
                                            ? 'border-[#3A88EF] bg-[#EAF3FE] font-[Inter-SemiBold] text-[#3d7cd0]'
                                            : 'border-[rgba(143,143,143,0.35)] bg-white font-[Inter-Regular] text-[#23262A]'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                    <div className='flex flex-col gap-[18px]'>
                        <div className="relative mb-[12px] rounded-[8px] border border-[rgba(143,143,143,0.35)] p-[16px]">
                            <p className="absolute left-[10px] top-[-10px] bg-white px-[4px] text-[14px] font-[Inter-Regular] text-[#666b72]">Property Price</p>
                            <div className="flex items-center gap-[8px]">
                                <span className="text-[14px] font-[Inter-Regular] text-[#8F8F8F]">AED</span>
                                <input
                                    type="number"
                                    value={propertyPrice}
                                    onChange={(e) => onPropertyPriceChange(e.target.value)}
                                    className="w-full bg-transparent text-[14px] font-[Inter-Medium] text-[#23262A] outline-none"
                                />
                            </div>
                        </div>

                        <div className="relative mb-[12px] rounded-[8px] border border-[rgba(143,143,143,0.35)] p-[16px]">
                            <p className="absolute left-[10px] top-[-10px] bg-white px-[4px] text-[14px] font-[Inter-Regular] text-[#666b72]">Down Payment</p>
                            <div className="flex items-center justify-between gap-[10px]">
                                <div className="flex items-center gap-[8px] ">
                                    <span className="text-[14px] font-[Inter-Regular] text-[#8F8F8F]">AED</span>
                                    <input
                                        type="number"
                                        value={downPaymentAmount}
                                        onChange={(e) => onDownPaymentAmountChange(e.target.value)}
                                        className="w-full bg-transparent text-[14px] font-[Inter-Medium] text-[#23262A] outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-[6px] border-l border-[rgba(143,143,143,0.35)] ">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={downPaymentPercent}
                                        onChange={(e) => onDownPaymentPercentChange(e.target.value)}
                                        className="w-[60px] bg-transparent text-right text-[14px] font-[Inter-Medium] text-[#23262A] outline-none"
                                    />
                                    <span className="text-[14px] font-[Inter-Regular] text-[#8F8F8F]">%</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-[120px_1fr] gap-[8px]">
                            <div className="relative rounded-[8px] border border-[rgba(143,143,143,0.35)] p-[16px]">
                                <p className="absolute left-[10px] top-[-10px] bg-white px-[4px] text-[14px] font-[Inter-Regular] text-[#666b72]">Loan Term</p>
                                <div className="flex items-center justify-between gap-[8px]">
                                    <input
                                        type="number"
                                        value={loanYears}
                                        min={1}
                                        onChange={(e) => setLoanYears(Math.max(1, toNumber(e.target.value, 1)))}
                                        className="w-[40px] bg-transparent text-[14px] font-[Inter-Medium] text-[#23262A] outline-none"
                                    />
                                    <p className="text-[14px] font-[Inter-Regular] text-[#8F8F8F]">Years</p>
                                </div>
                            </div>
                            <div className="relative rounded-[8px] border border-[rgba(143,143,143,0.35)] p-[16px]">
                                <p className="absolute left-[10px] top-[-10px] bg-white px-[4px] text-[14px] font-[Inter-Regular] text-[#666b72]">Interest Rate</p>
                                <div className="flex items-center justify-between gap-[8px]">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={interestRate}
                                        min={0}
                                        onChange={(e) => setInterestRate(Math.max(0, toNumber(e.target.value, 0)))}
                                        className="w-[84px] bg-transparent text-[14px] font-[Inter-Medium] text-[#23262A] outline-none"
                                    />
                                    <p className=" text-[14px] font-[Inter-Regular] text-[#8F8F8F]">%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-[8px] bg-[#f3f8fe] p-[32px]">
                    <div className="flex h-full gap-[12px] flex-col items-center justify-center">
                        <p className="text-[18px] font-[Inter-Regular] text-[#23262A]">Monthly Payment</p>
                        <h3 className="text-[22px] font-[Inter-SemiBold] text-[#23262A]">AED {formatAED(monthlyPayment)}</h3>
                        <button
                            type="button"
                            className="w-full cursor-pointer rounded-[8px] bg-[#17191c] py-[12px] text-[14px] font-[Inter-SemiBold] text-white"
                        >
                            Get Pre-Approved
                        </button>
                        <p className="text-[12px] font-[Inter-Regular] text-[#23262A]">
                            Powered by <span className="font-[Inter-Bold]">PRYPCO</span>
                        </p>
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={() => setIsBreakdownOpen(true)}
                className="inline-flex cursor-pointer items-center gap-[2px]"
            >
                <p className="text-[14px] font-[Inter-SemiBold] text-[#3A88EF]">View Monthly Payment Breakdown</p>
                <RightArrowIcon className="w-[24px] h-[24px]" stroke="#3A88EF" />
            </button>
            <PaymentModal
                open={isBreakdownOpen}
                onClose={() => setIsBreakdownOpen(false)}
                principal={principal}
                annualRate={annualRate}
                loanYears={loanYears}
            />
        </div>
    )
}
