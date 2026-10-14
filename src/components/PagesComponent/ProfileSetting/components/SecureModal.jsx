'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import { CloseIcon, RightArrowIcon } from '@/components/CustomFile/icons'
import secureIcon from '../../../../../public/assets/img/icons/secure.svg'

export default function SecureModal({ open, onClose, onUpdatePassword }) {
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
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/45 p-[16px]" role="dialog" aria-modal="true" aria-labelledby="secure-modal-title">
            <button type="button" className="absolute inset-0 cursor-default" aria-label="Close dialog overlay" onClick={onClose} />
            <div
                className="relative z-[1] w-[520px] max-sm:w-full overflow-hidden rounded-[6px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                onMouseDown={(e) => e.stopPropagation()}
            >

                <div className="border-b border-[rgba(143,143,143,0.35)] p-[24px]">
                    <div className="flex items-start justify-between gap-[12px] border-b-[2px] border-[#f7f7f8] pb-[14px] mb-[20px]">
                        <div className="flex min-w-0 items-center gap-[12px]">
                            <div className="">
                                <Image src={secureIcon} alt="secure" width={18} height={18} className="w-[18px] h-[18px]" />
                            </div>
                            <h2 id="secure-modal-title" className="text-[18px] font-[Inter-SemiBold] leading-snug text-[#23262A]">
                                Secure your account
                            </h2>
                        </div>
                        <button type="button" onClick={onClose} className="shrink-0 cursor-pointer p-[4px]" aria-label="Close">
                            <CloseIcon className="h-[12px] w-[12px]" fill="#666" fillOpacity="1" />
                        </button>
                    </div>

                    <div className="">
                        <p className="text-left text-[14px] font-[Inter-Regular] leading-[1.55] text-[#23262A]">
                            If you don&apos;t recognize your device, protect your account by resetting your password. This will log you out of all other devices for added
                            security.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-[12px] px-[22px] py-[16px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-[6px] border border-[rgba(143,143,143,0.55)] bg-white p-[8px_14px] text-[14px] font-[Inter-SemiBold] text-[#23262A] transition-colors hover:bg-[#F9FAFB]"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onUpdatePassword?.()
                            onClose?.()
                        }}
                        className="inline-flex cursor-pointer items-center gap-[6px] rounded-[6px] bg-[#23262A] p-[8px_14px] text-[14px] font-[Inter-SemiBold] text-white transition-colors hover:bg-[#1a1d21]"
                    >
                        Update Password
                        <RightArrowIcon className="w-[22px] h-[22px] rtl:rotate-180" stroke="#fff" />
                    </button>
                </div>
            </div>
        </div>
    )
}
