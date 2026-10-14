'use client'
import React from 'react'
import Image from 'next/image'
import { RightArrowIcon , HomeIcon } from '@/components/CustomFile/icons'
import { t } from '@/utils'

/** Motors category picker step for Ad Listing. */
const MotorsCategories = ({ categories, onSelect }) => {
  if (!Array.isArray(categories) || categories.length === 0) return null

  return (
    <div className="w-full mx-auto">
      <div className="max-w-[550px] mx-auto px-[16px] py-[30px]">
        <div className="mb-[24px] text-center">
          <h4 className="text-[22px] font-[Inter-Bold] text-[#23262A] mb-[8px]">
            {t('chooseRightCategoryForAd') || 'Now choose the right category for your ad:'}
          </h4>
        </div>

        <div className="mb-[12px] flex items-center gap-[6px]">
          <HomeIcon className="w-[24px] h-[24px]" />
          <RightArrowIcon className="w-[14px] h-[14px]" />
          <h4 className="font-[Inter-SemiBold] text-[#23262A] text-[14px] leading-[20px]">Motors</h4>
        </div>

        <div className="">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect?.(cat)}
              className="cursor-pointer flex w-full items-center justify-between border-b border-[rgba(143,143,143,0.2)] py-[16px]"
            >
              <h4 className="text-[16px] font-[Inter-SemiBold] text-[#23262A]">
                {cat.translated_name || cat.name}
              </h4>
              <RightArrowIcon className="w-[18px] h-[18px] rtl:rotate-180" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MotorsCategories

