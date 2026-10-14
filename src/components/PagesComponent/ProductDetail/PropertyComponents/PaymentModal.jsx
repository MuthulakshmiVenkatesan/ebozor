/* eslint-disable react/prop-types */
'use client'

import { useMemo, useState } from 'react'
import MonthlyTable from './MonthlyTable'
import AmortisationGraph from './AmortisationGraph'
import { GraphIcon, CalendarIcon } from '@/components/parts/icons'
import { CloseIcon } from '@/components/CustomFile/icons'



function calcMonthlyPayment(principal, annualRate, years) {
  const r = annualRate / 12
  const n = years * 12
  if (r <= 0 || n <= 0) return principal / Math.max(n, 1)
  const top = principal * r * Math.pow(1 + r, n)
  const bottom = Math.pow(1 + r, n) - 1
  return bottom === 0 ? 0 : top / bottom
}

function buildAmortisation(principal, annualRate, loanYears) {
  const totalMonths = Math.max(1, Math.round(Math.max(1, loanYears) * 12))
  const monthlyRate = annualRate / 12
  const emi = calcMonthlyPayment(principal, annualRate, Math.max(1, loanYears))
  const start = new Date()
  let remaining = principal
  const yearly = []
  let currentYear = null
  let yearBucket = null

  for (let month = 1; month <= totalMonths; month += 1) {
    const interest = remaining * monthlyRate
    const principalPart = Math.max(0, emi - interest)
    remaining = Math.max(0, remaining - principalPart)
    const d = new Date(start)
    d.setMonth(start.getMonth() + month)
    const year = d.getFullYear()
    const monthName = d.toLocaleDateString('en-GB', { month: 'long' })

    if (currentYear !== year) {
      currentYear = year
      yearBucket = { year, principal: 0, interest: 0, remaining: 0, months: [] }
      yearly.push(yearBucket)
    }

    yearBucket.principal += principalPart
    yearBucket.interest += interest
    yearBucket.remaining = remaining
    yearBucket.months.push({
      month: monthName,
      principal: Math.round(principalPart),
      interest: Math.round(interest),
      remaining: Math.round(remaining),
    })
  }

  return {
    yearlyRows: yearly.map((y) => ({
      ...y,
      principal: Math.round(y.principal),
      interest: Math.round(y.interest),
      remaining: Math.round(y.remaining),
    })),
    chartPoints: yearly.map((y) => ({
      label: String(y.year),
      date: new Date(`${y.year}-12-01`),
      principalPaid: Math.round(
        yearly
          .filter((item) => item.year <= y.year)
          .reduce((sum, item) => sum + item.principal, 0)
      ),
      interestPaid: Math.round(
        yearly
          .filter((item) => item.year <= y.year)
          .reduce((sum, item) => sum + item.interest, 0)
      ),
      remaining: Math.round(y.remaining),
    })),
  }
}

export default function PaymentModal({ open, onClose, principal, annualRate, loanYears }) {
  const [activeTab, setActiveTab] = useState('amortisation')
  const [selectedPointIndex, setSelectedPointIndex] = useState(0)

  const { yearlyRows, chartPoints } = useMemo(
    () => buildAmortisation(principal, annualRate, loanYears),
    [principal, annualRate, loanYears]
  )

  const safePointIndex = Math.min(selectedPointIndex, Math.max(0, chartPoints.length - 1))
  const monthlyPayment = Math.round(calcMonthlyPayment(principal, annualRate, Math.max(1, loanYears)))

  function formatAED(n) {
    return Number(n || 0).toLocaleString('en-US')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-[16px]">
      <div className="relative max-md:w-full w-[85vw] overflow-hidden rounded-[10px] bg-white shadow-[0_30px_60px_rgba(2,6,23,0.25)]">
        <button type="button" onClick={onClose} className="cursor-pointer absolute right-[26px] top-[26px] " aria-label="Close">
          <CloseIcon className="w-[18px] h-[18px]" fill='#8f8f8f' />
        </button>
        <div className="grid grid-cols-[260px_1fr] max-sm:grid-cols-1">
          <div className="border-r border-[rgba(143,143,143,0.25)] bg-[#F8FAFC] p-[16px]">
            <button
              type="button"
              onClick={() => setActiveTab('amortisation')}
              className={`cursor-pointer mb-[8px] flex w-full items-center gap-[8px] border-r-[2px] px-[10px] py-[10px] text-left ${activeTab === 'amortisation' ? 'border-r-[#1270ec] text-[#1270ec]' : 'border-r-transparent text-[#23262A]'}`}
            >
              <div className='w-[24px] h-[24px] flex items-center justify-center' fill={activeTab === 'amortisation' ? '#1270ec' : '#3a3f47'}><GraphIcon className="text-[16px]" fill={activeTab === 'amortisation' ? '#1270ec' : '#3a3f47'} /></div>
              <p className="text-[16px] font-[Inter-SemiBold]">Amortisation</p>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('monthly')}
              className={`cursor-pointer flex w-full items-center gap-[8px] border-r-[2px] px-[10px] py-[10px] text-left ${activeTab === 'monthly' ? 'border-r-[#1270ec] text-[#1270ec]' : 'border-r-transparent text-[#23262A]'}`}
            >
              <div className='w-[24px] h-[24px] flex items-center justify-center' fill={activeTab === 'monthly' ? '#1270ec' : '#3a3f47'}><CalendarIcon className="text-[16px]" fill={activeTab === 'monthly' ? '#1270ec' : '#3a3f47'} /></div>
              <p className="text-[16px] font-[Inter-SemiBold]">Monthly Breakdown</p>
            </button>
          </div>
          <div className="p-[22px]">
            {/* <div className="mb-[16px] grid grid-cols-2 gap-[10px] rounded-[8px] border border-[rgba(143,143,143,0.2)] p-[12px] md:grid-cols-4">
              <div>
                <p className="text-[12px] font-[Inter-Regular] text-[#6B7280]">Loan Amount</p>
                <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">AED {formatAED(principal)}</p>
              </div>
              <div>
                <p className="text-[12px] font-[Inter-Regular] text-[#6B7280]">Interest Rate</p>
                <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">{(annualRate * 100).toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-[12px] font-[Inter-Regular] text-[#6B7280]">Loan Term</p>
                <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">{loanYears} Years</p>
              </div>
              <div>
                <p className="text-[12px] font-[Inter-Regular] text-[#6B7280]">Monthly Payment</p>
                <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">AED {formatAED(monthlyPayment)}</p>
              </div>
            </div> */}
            {activeTab === 'amortisation' ? (
              <>
                <AmortisationGraph
                  chartPoints={chartPoints}
                  selectedPointIndex={safePointIndex}
                  onPointChange={setSelectedPointIndex}
                />
              </>
            ) : (
              <>
                <div className='mb-[24px]'>
                  <h3 className="text-[18px] font-[Inter-SemiBold] text-[#23262A] mb-[8px]">Monthly Breakdown</h3>
                  <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">View your yearly and monthly payment breakdown.</p>
                </div>
                <MonthlyTable rows={yearlyRows} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
