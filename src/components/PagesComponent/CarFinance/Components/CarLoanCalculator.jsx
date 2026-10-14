/* eslint-disable react/prop-types */
'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import client1 from '../../../../../public/assets/img/client.png'

function firstTruthy(...vals) {
    for (const v of vals) {
        if (v !== undefined && v !== null && v !== '') return v
    }
    return ''
}

function parseListingCarPrice(item) {
    const raw = firstTruthy(item?.price, item?.amount, item?.sale_price, item?.final_price)
    const n = Number(String(raw).replace(/[^\d.]/g, ''))
    if (Number.isNaN(n) || n <= 0) return 571500
    return Math.round(n)
}

function formatAedAmount(n) {
    const v = Math.round(Number(n) || 0)
    return v.toLocaleString('en-US')
}

function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n))
}

/**
 * Monthly payment (amortizing loan). annualRatePercent is e.g. 2.79 for 2.79% p.a.
 */
function computeLoanSchedule(carPrice, downPayment, annualRatePercent, years) {
    const principal = Math.max(0, carPrice - downPayment)
    const n = Math.max(1, Math.round(years * 12))
    const r = annualRatePercent / 100 / 12

    if (principal <= 0) {
        return { monthlyPayment: 0, totalInterest: 0, totalPaid: 0, principal: 0 }
    }

    let monthlyPayment
    if (r <= 0) {
        monthlyPayment = principal / n
    } else {
        const pow = (1 + r) ** n
        monthlyPayment = (principal * r * pow) / (pow - 1)
    }

    const totalPaid = monthlyPayment * n
    const totalInterest = Math.max(0, totalPaid - principal)

    return {
        monthlyPayment,
        totalInterest,
        totalPaid,
        principal,
    }
}

function FinanceRangeSlider({ min, max, step, value, onChange, ariaLabel }) {
    const pct = max === min ? 0 : ((Number(value) - min) / (max - min)) * 100
    const sliderP = `${Math.min(100, Math.max(0, pct))}%`

    return (
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label={ariaLabel}
            style={{ '--slider-p': sliderP }}
            className="h-[22px] w-full cursor-pointer appearance-none bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F2937]/25 focus-visible:ring-offset-2 [&::-moz-range-track]:h-[5px] [&::-moz-range-track]:rounded-full [&::-moz-range-track]:border-0 [&::-moz-range-track]:bg-[#D1D5DB] [&::-moz-range-progress]:h-[5px] [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:border-0 [&::-moz-range-progress]:bg-[#1F2937] [&::-moz-range-thumb]:box-border [&::-moz-range-thumb]:h-[22px] [&::-moz-range-thumb]:w-[22px] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#1F2937] [&::-moz-range-thumb]:shadow-[0_2px_6px_rgba(15,23,42,0.12),0_1px_2px_rgba(15,23,42,0.08)] [&::-webkit-slider-runnable-track]:h-[5px] [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[linear-gradient(90deg,#1F2937_0%,#1F2937_var(--slider-p),#D1D5DB_var(--slider-p),#D1D5DB_100%)] [&::-webkit-slider-thumb]:-mt-[8.5px] [&::-webkit-slider-thumb]:h-[22px] [&::-webkit-slider-thumb]:w-[22px] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-[#1F2937] [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(15,23,42,0.12),0_1px_2px_rgba(15,23,42,0.08)]"
        />
    )
}

function AedField({ value, onChange, ariaLabel }) {
    const [draft, setDraft] = useState(() => formatAedAmount(value))

    useEffect(() => {
        setDraft(formatAedAmount(value))
    }, [value])

    return (
        <div className="flex items-center overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.35)] bg-white p-[16px_14px] gap-[10px] justify-between">
            <span className="text-[14px] font-[Inter-Regular] text-[#999999]">AED</span>
            <input
                type="text"
                inputMode="numeric"
                aria-label={ariaLabel}
                value={draft}
                onChange={(e) => {
                    const t = e.target.value.replace(/[^\d,]/g, '')
                    setDraft(t)
                }}
                onBlur={() => {
                    const n = Number(String(draft).replace(/,/g, ''))
                    if (!Number.isNaN(n) && n >= 0) onChange(Math.round(n))
                    else setDraft(formatAedAmount(value))
                }}
                className="border-0 bg-transparent text-[14px] font-[Inter-SemiBold] text-[#23262A] outline-none focus:ring-0 w-[60px] max-sm:w-full"
            />
        </div>
    )
}

/**
 * Car finance calculator — inputs + summary card (matches listing-page reference UI).
 */
export default function CarLoanCalculator({
    productData,
    financeProviderName = 'Alba Cars',
    onGetCarFinanceClick,
}) {
    const listingPrice = useMemo(() => parseListingCarPrice(productData || {}), [productData])

   

    const [carPrice, setCarPrice] = useState(listingPrice)
    const [downPercent, setDownPercent] = useState(20)
    const [interestRate, setInterestRate] = useState(2.79)
    const [years, setYears] = useState(5)

    useEffect(() => {
        setCarPrice(listingPrice)
    }, [listingPrice])

    const minPrice = 25000
    const maxPrice = Math.max(2000000, Math.ceil(listingPrice / 50000) * 50000)

    const minLoan = 1000
    const maxDown = Math.max(0, carPrice - minLoan)
    const maxDownPercent = carPrice > 0 ? Math.min(95, (maxDown / carPrice) * 100) : 0

    const downAmount = useMemo(() => {
        const raw = Math.round((carPrice * downPercent) / 100)
        return clamp(raw, 0, maxDown)
    }, [carPrice, downPercent, maxDown])
    const [downAmountDraft, setDownAmountDraft] = useState(() => formatAedAmount(0))

    const effectiveDownPercent = carPrice > 0 ? (downAmount / carPrice) * 100 : 0

    useEffect(() => {
        setDownPercent((prev) => (prev > maxDownPercent ? Math.max(0, Math.floor(maxDownPercent)) : prev))
    }, [maxDownPercent])

    useEffect(() => {
        setDownAmountDraft(formatAedAmount(downAmount))
    }, [downAmount])

    const schedule = useMemo(
        () => computeLoanSchedule(carPrice, downAmount, interestRate, years),
        [carPrice, downAmount, interestRate, years]
    )


    return (
        <div className="py-[60px]">
            <div className="text-center mb-[40px]">
                <h2 className="mb-[14px] text-[28px] leading-[1.2] text-[#23262A] font-[Inter-Bold] ">
                    Monthly Car Loan Calculator
                </h2>
                <p className="text-[16px] leading-[26px] text-[#23262A] font-[Inter-Regular]">
                    Estimate your monthly payments using ebozor's car loan calculator.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-[28px] max-sm:grid-cols-1 w-[70%] mx-auto max-sm:w-full">
                <div className="flex min-w-0 flex-col gap-[14px]">
                    <div>
                        <div className="flex items-center justify-between">
                            <label className="block text-[14px] font-[Inter-SemiBold] text-[#23262A]">Car Price</label>
                            <AedField value={carPrice} onChange={(n) => setCarPrice(clamp(n, minPrice, maxPrice))} ariaLabel="Car price" />
                        </div>

                        <div className="mt-[8px]">
                            <FinanceRangeSlider
                                min={minPrice}
                                max={maxPrice}
                                step={1000}
                                value={clamp(carPrice, minPrice, maxPrice)}
                                onChange={setCarPrice}
                                ariaLabel="Adjust car price"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex flex-wrap items-center justify-between gap-x-[16px] gap-y-[10px]">
                            <label className="block shrink-0 text-[14px] font-[Inter-SemiBold] text-[#23262A]">
                                Down Payment
                            </label>
                            <div className="flex items-stretch overflow-hidden rounded-[8px] border border-[rgba(143,143,143,0.35)] bg-white  ">
                                <div className="flex flex-1 items-center justify-between gap-[10px] px-[14px] py-[16px]">
                                    <span className="shrink-0 text-[14px] font-[Inter-Regular] uppercase text-[#999999]">
                                        AED
                                    </span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        aria-label="Down payment amount"
                                        value={downAmountDraft}
                                        onChange={(e) => {
                                            const t = e.target.value.replace(/[^\d,]/g, '')
                                            setDownAmountDraft(t)
                                        }}
                                        onBlur={() => {
                                            const n = Number(String(downAmountDraft).replace(/,/g, ''))
                                            if (!Number.isNaN(n) && n >= 0) {
                                                const clampedAmount = clamp(Math.round(n), 0, maxDown)
                                                const nextPct = carPrice > 0 ? (clampedAmount / carPrice) * 100 : 0
                                                setDownPercent(clamp(nextPct, 0, maxDownPercent))
                                                return
                                            }
                                            setDownAmountDraft(formatAedAmount(downAmount))
                                        }}
                                        className="min-w-0 w-[100px] truncate border-0 bg-transparent text-right text-[14px] font-[Inter-SemiBold] tabular-nums text-[#23262A] outline-none focus:ring-0"
                                    />
                                </div>
                                <div className="flex w-[76px] shrink-0 items-center justify-end gap-[4px] border-l border-[rgba(143,143,143,0.35)] px-[14px] py-[16px]">
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        aria-label="Down payment percent"
                                        value={String(Math.round(downPercent))}
                                        onChange={(e) => {
                                            const n = Number(String(e.target.value).replace(/[^\d.]/g, ''))
                                            if (!Number.isNaN(n)) setDownPercent(clamp(n, 0, maxDownPercent))
                                        }}
                                        className="min-w-0 w-full border-0 bg-transparent text-right text-[14px] font-[Inter-SemiBold] text-[#23262A] outline-none focus:ring-0"
                                    />
                                    <span className="shrink-0 text-[14px] font-[Inter-Regular] text-[#999999]">%</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-[8px]">
                            <FinanceRangeSlider
                                min={0}
                                max={Math.max(0, Math.round(maxDownPercent))}
                                step={1}
                                value={clamp(Math.round(downPercent), 0, Math.max(0, Math.round(maxDownPercent)))}
                                onChange={(pct) => setDownPercent(clamp(pct, 0, maxDownPercent))}
                                ariaLabel="Adjust down payment percent"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between">
                            <label className="block text-[14px] font-[Inter-SemiBold] text-[#23262A]">
                                Interest Rate
                            </label>
                            <div className="flex items-center overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.35)] bg-white  p-[16px_14px] ">
                                <input
                                    type="number"
                                    min={0}
                                    max={20}
                                    step={0.01}
                                    aria-label="Interest rate percent"
                                    value={interestRate}
                                    onChange={(e) => {
                                        const n = Number(e.target.value)
                                        if (!Number.isNaN(n)) setInterestRate(clamp(n, 0, 20))
                                    }}
                                    className="min-w-0 flex-1 border-0 bg-transparent text-[14px] font-[Inter-SemiBold] text-[#23262A] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                                <span className="text-[14px] font-[Inter-Regular] text-[#999999]">%</span>
                            </div>
                        </div>
                        <div className="mt-[8px]">
                            <FinanceRangeSlider
                                min={0}
                                max={15}
                                step={0.05}
                                value={clamp(interestRate, 0, 15)}
                                onChange={setInterestRate}
                                ariaLabel="Adjust interest rate"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-start gap-[10px] justify-between flex-col">
                            <label className="block text-[14px] font-[Inter-SemiBold] text-[#23262A]">Loan Period</label>
                            <div className="flex flex-wrap gap-[10px]">
                                {[1, 2, 3, 4, 5].map((y) => (
                                    <button
                                        key={y}
                                        type="button"
                                        onClick={() => setYears(y)}
                                        className={`cursor-pointer w-[60px] h-[40px] max-sm:w-[40px] max-sm:h-[40px] rounded-[10px] border px-[16px] text-[14px] font-[Inter-SemiBold] transition-colors ${years === y
                                            ? 'border-[#23262A] text-[#23262A]'
                                            : 'border-[rgba(143,143,143,0.35)] text-[#23262A] '
                                            }`}
                                    >
                                        {y}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col rounded-[12px] bg-[#f5f9fe] shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.02),0px_3px_8px_rgba(0,0,0,0.02),0px_1px_10px_rgba(0,0,0,0.04)] p-[22px]">
                    <div className="mb-[40px] text-center">
                        <p className="text-[14px] font-[Inter-Medium] text-[#23262A] mb-[10px]">Monthly Payment</p>
                        <p className="text-[28px] font-[Inter-SemiBold] leading-[34px] text-[#23262A]">
                            AED {formatAedAmount(Math.round(schedule.monthlyPayment))}
                        </p>
                    </div>

                    <div className="flex flex-col gap-[14px]">
                        <div className="flex justify-between gap-[12px] ">
                            <h4 className="font-[Inter-Regular] text-[#23262A] text-[14px]">Car Price</h4>
                            <p className="font-[Inter-SemiBold] text-[#23262A] text-[14px]">AED {formatAedAmount(carPrice)}</p>
                        </div>
                        <div className="flex justify-between gap-[12px] ">
                            <h4 className="font-[Inter-Regular] text-[#23262A] text-[14px]">Down Payment</h4>
                            <span className="font-[Inter-SemiBold] text-[#23262A] text-[14px]">
                                AED {formatAedAmount(downAmount)} / {effectiveDownPercent.toFixed(0)}%
                            </span>
                        </div>
                        <div className="flex justify-between gap-[12px] ">
                            <h4 className="font-[Inter-Regular] text-[#23262A] text-[14px]">Total Loan Amount</h4>
                            <p className="font-[Inter-SemiBold] text-[#23262A] text-[14px]">
                                AED {formatAedAmount(schedule.principal)}
                            </p>
                        </div>
                        <div className="flex justify-between gap-[12px] ">
                            <h4 className="font-[Inter-Regular] text-[#23262A] text-[14px]">Loan Period</h4>
                            <p className="font-[Inter-SemiBold] text-[#23262A]">{years} Years</p>
                        </div>
                        <div className="flex justify-between gap-[12px] ">
                            <h4 className="font-[Inter-Regular] text-[#23262A] text-[14px]">Total interest</h4>
                            <p className="font-[Inter-SemiBold] text-[#23262A]">
                                AED {formatAedAmount(Math.round(schedule.totalInterest))}
                            </p>
                        </div>
                    </div>

                    <div className="mt-[18px] flex items-center gap-[12px] rounded-[12px] bg-white p-[12px_14px]">
                        <div
                            className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[6px] border border-[rgba(143,143,143,0.35)] "
                            aria-hidden
                        >
                            <Image src={client1} alt="client" width={40} height={40} className="object-cover w-full h-full" />
                        </div>
                        <div className="flex flex-col gap-[6px]">
                            <h4 className="text-[14px] font-[Inter-Regular] leading-[18px] text-[#23262A]">
                                Car Finance provided by
                            </h4>
                            <h3 className="text-[18px] font-[Inter-SemiBold] leading-[18px] text-[#23262A]">{financeProviderName}</h3>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onGetCarFinanceClick}
                        className="mt-[18px] w-full cursor-pointer rounded-[10px] bg-[#23262A] py-[10px] text-center text-[14px] font-[Inter-SemiBold] text-white"
                    >
                        Get Car Finance
                    </button>
                </div>
            </div>

        
        </div>
    )
}
