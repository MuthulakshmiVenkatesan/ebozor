/* eslint-disable react/prop-types */
'use client'

import { useState } from 'react'
import { DownArrowIcon, TickIcon } from '@/components/CustomFile/icons'

function FeatureCheckIcon() {
    return (
        <svg
            className="mt-[2px] h-[16px] w-[16px] shrink-0 text-[#22A06B]"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <path
                d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                fill="currentColor"
            />
        </svg>
    )
}

function ChevronIcon({ expanded }) {
    return (
        <svg
            className={`h-[20px] w-[20px] shrink-0 text-[#3a88ef] transition-transform ${expanded ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <path d="M7 10l5 5 5-5H7z" fill="currentColor" />
        </svg>
    )
}

export default function MotorsCarFeaturesSection({ groups }) {
    const [openIds, setOpenIds] = useState(() => new Set([groups[0]?.id].filter(Boolean)))

    if (!groups?.length) return null

    const toggle = (id) => {
        setOpenIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    return (
        <div className="border-b border-[rgba(143,143,143,0.35)] py-[30px]">
            <h2 className="mb-[4px] text-[24px] font-[Inter-Bold] text-[#23262a]">Features</h2>
            <div className="mt-[8px]">
                {groups.map((group) => {
                    const expanded = openIds.has(group.id)
                    const count = group.items.length
                    return (
                        <div key={group.id} className="border-b border-[rgba(143,143,143,0.25)] last:border-b-0  py-[14px] ">
                            <button
                                type="button"
                                onClick={() => toggle(group.id)}
                                className="flex w-full cursor-pointer items-center justify-between gap-[12px] text-left transition-colors "
                            >
                                <h4 className="text-[16px] font-[Inter-SemiBold] text-[#23262A]">{group.title}</h4>
                                <div className="flex shrink-0 items-center gap-[10px]">
                                    <p className="flex items-center justify-center rounded-[3px] bg-[#f7f7f8] p-[4px_8px] text-[18px] font-[Inter-SemiBold] text-[#23262A]">
                                        {count}
                                    </p>
                                    <DownArrowIcon className={`h-[30px] w-[30px] shrink-0 text-[#3a88ef] transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                </div>
                            </button>
                            {expanded ? (
                                <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-[24px] mt-[24px]">
                                    {group.items.map((label, idx) => (
                                        <div key={`${group.id}-${idx}-${label}`} className="flex items-start gap-[10px]">
                                            <TickIcon className="h-[20px] w-[20px] shrink-0" fill="#22A06B" />
                                            <p className="text-[16px] font-[Inter-Regular] leading-[20px] text-[#23262A]">
                                                {label}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
