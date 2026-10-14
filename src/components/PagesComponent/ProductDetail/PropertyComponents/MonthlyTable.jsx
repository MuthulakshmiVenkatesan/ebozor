/* eslint-disable react/prop-types */
'use client'

import { Fragment, useState } from 'react'
import { DownArrowIcon } from '@/components/CustomFile/icons'
function formatAED(n) {
  return Number(n || 0).toLocaleString('en-US')
}

export default function MonthlyTable({ rows }) {
  const [expandedYears, setExpandedYears] = useState([])

  const toggleYear = (year) => {
    setExpandedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    )
  }

  return (
    <div className="h-[430px] max-sm:h-[200px] overflow-auto rounded-[6px] hide_scrollbar">
      <table className="w-full">
        <thead className="sticky top-0 z-[2] bg-white">
          <tr className="">
            <th className="px-[8px] py-[10px] text-left text-[16px] font-[Inter-SemiBold] text-[#23262A]">Period</th>
            <th className="px-[8px] py-[10px] text-right text-[16px] font-[Inter-SemiBold] text-[#23262A]">Principal (AED)</th>
            <th className="px-[8px] py-[10px] text-right text-[16px] font-[Inter-SemiBold] text-[#23262A]">Interest (AED)</th>
            <th className="px-[8px] py-[10px] text-right text-[16px] font-[Inter-SemiBold] text-[#23262A]">Remaining (AED)</th>
          </tr>
        </thead>
        <tbody>
          {(rows || []).map((yearRow) => {
            const isOpen = expandedYears.includes(yearRow.year)
            return (
              <Fragment key={yearRow.year}>
                <tr className="border-b border-[rgba(143,143,143,0.2)]">
                  <td className="px-[8px] py-[10px]">
                    <button
                      type="button"
                      onClick={() => toggleYear(yearRow.year)}
                      className="cursor-pointer inline-flex items-center gap-[8px] text-[14px] font-[Inter-SemiBold] text-[#2F80ED]"
                    >
                      {yearRow.year}
                      <DownArrowIcon className={`w-[20px] h-[20px] cursor-pointer ${isOpen ? 'rotate-180' : ''}`} stroke='#1270ec' />
                    </button>
                  </td>
                  <td className="px-[8px] py-[10px] text-right text-[14px] font-[Inter-Regular] text-[#23262A]">
                    {formatAED(yearRow.principal)}
                  </td>
                  <td className="px-[8px] py-[10px] text-right text-[14px] font-[Inter-Regular] text-[#23262A]">
                    {formatAED(yearRow.interest)}
                  </td>
                  <td className="px-[8px] py-[10px] text-right text-[14px] font-[Inter-Regular] text-[#23262A]">
                    {formatAED(yearRow.remaining)}
                  </td>
                </tr>
                {isOpen
                  ? yearRow.months.map((m) => (
                      <tr key={`${yearRow.year}-${m.month}`} className="border-b border-[rgba(143,143,143,0.12)]">
                        <td className="px-[8px] py-[8px] text-[14px] font-[Inter-Regular] text-[#23262A]">{m.month}</td>
                        <td className="px-[8px] py-[8px] text-right text-[14px] font-[Inter-Regular] text-[#23262A]">
                          {formatAED(m.principal)}
                        </td>
                        <td className="px-[8px] py-[8px] text-right text-[14px] font-[Inter-Regular] text-[#23262A]">
                          {formatAED(m.interest)}
                        </td>
                        <td className="px-[8px] py-[8px] text-right text-[14px] font-[Inter-Regular] text-[#23262A]">
                          {formatAED(m.remaining)}
                        </td>
                      </tr>
                    ))
                  : null}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
