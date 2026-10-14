'use client'

import React from 'react'
import Image from 'next/image'
import { RightArrowIcon , HomeIcon } from '@/components/CustomFile/icons'

/**
 * Second step: heading, breadcrumb (home > parent), bordered rows with chevron (ebozor-style).
 */
const PlaceAdSubcategoryStep = ({ parentLabel = 'Motors', items, onBackToMain, onSelect }) => {
    return (
        <div className="w-full mx-auto">
            <div className="mx-auto w-[480px] max-sm:w-full py-[36px] max-sm:p-[20px_15px]">
                <div className="mb-[24px] text-center">
                    <h4 className="text-[22px] font-[Inter-Bold] text-[#23262A] mb-[8px]">
                        Now choose the right category for your ad:
                    </h4>
                </div>

                <div className="mb-[12px] flex items-center gap-[6px]">
                    <button type="button" onClick={onBackToMain} className="cursor-pointer">
                    <HomeIcon className="w-[24px] h-[24px]" />
                    </button>
                    <RightArrowIcon className="w-[14px] h-[14px]" />
                    <h4 className="font-[Inter-SemiBold] text-[#23262A] text-[14px] leading-[20px]">{parentLabel}</h4>
                </div>

                <div className="">
                    {items.map((row, index) => (
                        <button
                            key={row.key}
                            type="button"
                            onClick={() => onSelect(row)}
                            className="cursor-pointer flex w-full items-center justify-between border-b border-[rgba(143,143,143,0.2)] py-[16px]"
                        >
                            <h4 className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">
                                {row.label}
                            </h4>
                            <RightArrowIcon className="w-[18px] h-[18px] rtl:rotate-180" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default PlaceAdSubcategoryStep
