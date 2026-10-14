/* eslint-disable react/prop-types */
'use client'
import { CloseIcon } from '@/components/CustomFile/icons'
export default function Verified({
    open,
    onClose,
    title = 'Verified',
}) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[rgba(17,24,39,0.45)] px-[16px]">
            <div className="w-[400px] max-sm:w-full rounded-[8px] bg-white p-[22px_24px] shadow-[0_20px_40px_rgba(0,0,0,0.2)]">
                <div className="mb-[12px] flex items-center justify-between gap-[8px]">
                    <h3 className="text-[18px] font-[Inter-SemiBold] text-[#23262A]">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer "
                        aria-label="Close"
                    >
                        <CloseIcon className="w-[16px] h-[16px]" fill="#8f8f8f" />
                    </button>
                </div>
                <p className="text-[14px] leading-[24px] font-[Inter-Regular] text-[#23262A]">
                    Ads with a <span className="font-[Inter-SemiBold]">'Verified'</span> badge are validated by ebozor's quality control team to ensure accuracy.
                </p>
            </div>
        </div>
    )
}
