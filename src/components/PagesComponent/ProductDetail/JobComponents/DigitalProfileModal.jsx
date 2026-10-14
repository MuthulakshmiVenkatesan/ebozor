/* eslint-disable react/prop-types */
'use client'

import { useEffect } from 'react'
import { CloseIcon, MicIcon, VideoIcon, PlusIcon } from '@/components/CustomFile/icons'

/**
 * “Digital Profile” — audio / video introduction rows; Add opens Introductions flow from parent.
 */
export default function DigitalProfileModal({ open, onClose, onAddAudio, onAddVideo }) {
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
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-[16px]" role="dialog" aria-modal="true" aria-labelledby="digital-profile-title">
            <button
                type="button"
                className="absolute inset-0 z-0 bg-black/45"
                onClick={onClose}
                aria-label="Close dialog"
            />
            <div
                className="relative z-[1] flex w-full max-w-[480px] flex-col overflow-hidden rounded-[12px] bg-white shadow-[0px_8px_24px_rgba(0,0,0,0.12)]"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex shrink-0 items-center justify-between border-b border-[rgba(143,143,143,0.25)] px-[20px] py-[18px]">
                    <h2 id="digital-profile-title" className="text-[18px] font-[Inter-SemiBold] text-[#23262A]">
                        Digital Profile
                    </h2>
                    <button type="button" onClick={onClose} className="flex cursor-pointer items-center justify-center p-[4px]" aria-label="Close">
                        <CloseIcon className="h-[10px] w-[10px]" fill="#23262A" />
                    </button>
                </header>

                <div className="p-[20px]">
                    <p className="text-[14px] font-[Inter-Regular] leading-snug text-[#000]">
                        Add your audio and video introduction to grab potential employers attention.
                    </p>

                    <div className="divide-y divide-[rgba(143,143,143,0.25)]">
                        <button
                            type="button"
                            onClick={() => onAddAudio?.()}
                            className="py-[16px] flex w-full cursor-pointer items-center gap-[14px] text-left transition-colors justify-between"
                        >
                            <div className="flex items-center gap-[10px]">
                                <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[6px] bg-[#f7f7f8]">
                                    <MicIcon className="h-[22px] w-[22px]" />
                                </div>
                                <p className="text-[14px] font-[Inter-Regular] text-[#666]">Add Your Audio Introduction</p>
                            </div>
                            <div className="flex items-center gap-[10px] cursor-pointer">
                                <PlusIcon className="h-[14px] w-[14px]" fill="#23262A" />
                                <p className="text-[14px] font-[Inter-SemiBold] text-[#23262a]">Add</p>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => onAddVideo?.()}
                            className="py-[16px] flex w-full cursor-pointer items-center gap-[14px] text-left transition-colors justify-between"
                        >
                            <div className="flex items-center gap-[10px]">
                                <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[6px] bg-[#f7f7f8]">
                                    <VideoIcon className="h-[22px] w-[22px]" />
                                </div>
                                <p className="text-[14px] font-[Inter-Regular] text-[#666]">Add Your Video Introduction</p>
                            </div>
                            <div className="flex items-center gap-[10px] cursor-pointer">
                                <PlusIcon className="h-[14px] w-[14px]" fill="#23262A" />
                                <p className="text-[14px] font-[Inter-SemiBold] text-[#23262a]">Add</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
