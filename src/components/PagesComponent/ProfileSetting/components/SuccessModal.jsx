'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import { CloseIcon } from '@/components/CustomFile/icons'
import verifiedsuccess from '../../../../../public/assets/img/icons/verifiedsuccess.svg'

const DEFAULT_MESSAGE =
    'Your password has been reset and all other devices have been logged out from your Ebozor account.'

export default function SuccessModal({ open, onClose, title = 'Success!', message = DEFAULT_MESSAGE, titleId = 'success-modal-title' }) {
    useEffect(() => {
        if (!open) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prev
        }
    }, [open])

    useEffect(() => {
        if (!open) return
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[275] flex items-center justify-center bg-black/45 p-[16px]" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <button type="button" className="absolute inset-0 cursor-default" aria-label="Close dialog overlay" onClick={onClose} />
            <div
                className="relative z-[1] w-[440px] max-sm:w-full rounded-[6px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex shrink-0 items-center justify-end px-[16px] pb-[4px] pt-[12px]">
                    <button type="button" onClick={onClose} className="cursor-pointer p-[6px]" aria-label="Close">
                        <CloseIcon className="h-[12px] w-[12px]" fill="#9CA3AF" fillOpacity="1" />
                    </button>
                </div>

                <div className="px-[50px] py-[80px] text-center">
                    <div className="mx-auto mb-[24px] flex h-[64px] w-[64px] items-center justify-center rounded-[12px] bg-[#43bb3f1f]">
                        <Image src={verifiedsuccess} alt="tick" className="h-[26px] w-[26px]" width={26} height={26} />
                    </div>

                    <h2 id={titleId} className="mb-[20px] text-[22px] font-[Inter-Bold] leading-tight text-[#23262A]">
                        {title}
                    </h2>
                    <p className="mx-auto text-[14px] font-[Inter-Regular] leading-[1.55] text-[#23262A]">{message}</p>
                </div>
            </div>
        </div>
    )
}
