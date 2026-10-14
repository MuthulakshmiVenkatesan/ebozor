'use client'

import React from 'react'

const DEFAULT_PLACEHOLDER = 'e.g. 1 Bedroom available in Al-Barsha'

export default function CategorySearch({ value, onChange, onSubmit, placeholder = DEFAULT_PLACEHOLDER }) {
    return (
        <div className="mx-auto w-[480px] max-sm:w-full py-[36px] max-sm:p-[20px_15px]">
            <div className="mb-[24px] text-center w-[400px] mx-auto max-sm:w-full">
                <h2 className="text-[22px] font-[Inter-Bold] text-[#23262A] mb-[8px]">
                    Enter a short title to describe your listing
                </h2>
                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                    Make your title informative and attractive.
                </p>
            </div>
            <div>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="mb-[20px] w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[18px] text-[14px] outline-none font-[Inter-Regular] placeholder:text-[#8F8F8F] text-[#23262A]"
                />
                <button
                    type="button"
                    onClick={onSubmit}
                    className="p-[12px] w-full cursor-pointer rounded-[6px] bg-[#DC0000] text-[14px] font-[Inter-Medium] text-white"
                >
                    Let&apos;s Go
                </button>
            </div>
        </div>
    )
}
