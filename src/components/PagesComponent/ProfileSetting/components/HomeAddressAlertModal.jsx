'use client'

import React from 'react'

export default function HomeAddressAlertModal({ open, onChangeLabel, onProceed }) {
    if (!open) return null

    return (
        <div className="absolute inset-0 z-[220] flex items-center justify-center bg-black/45 p-[12px]">
            <div className="max-sm:w-full w-[600px] rounded-[8px] bg-white p-[24px]">
                <p className="mb-[14px] text-[18px] font-[Inter-SemiBold] text-[#23262A]">Alert</p>
                <p className="text-[14px] font-[Inter-Regular] leading-[1.5] text-[#23262A]">
                    You have already saved an address as <span className="font-[Inter-SemiBold]">Home</span>. This will update the address for{' '}
                    <span className="font-[Inter-SemiBold]">Home</span>, do you want to proceed?
                </p>
                <div className="mt-[16px] flex items-center justify-end gap-[36px]">
                    <button
                        type="button"
                        onClick={onChangeLabel}
                        className="cursor-pointer text-[14px] font-[Inter-SemiBold] text-[#DC0000]"
                    >
                        Change Label
                    </button>
                    <button
                        type="button"
                        onClick={onProceed}
                        className="cursor-pointer text-[14px] font-[Inter-SemiBold] text-[#DC0000]"
                    >
                        Proceed
                    </button>
                </div>
            </div>
        </div>
    )
}
