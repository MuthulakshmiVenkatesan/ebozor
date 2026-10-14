/* eslint-disable react/prop-types */
'use client'

import { useEffect } from 'react'
import { CloseIcon, PaginationNextIcon, PaginationPrevIcon } from '@/components/CustomFile/icons'
import Image from 'next/image'

export default function NewProjectFloorPlanModal({ isOpen, images, activeIndex, onClose, onPrev, onNext }) {
    useEffect(() => {
        if (!isOpen) return undefined
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.()
            if (e.key === 'ArrowLeft') onPrev?.()
            if (e.key === 'ArrowRight') onNext?.()
        }
        window.addEventListener('keydown', handleKeyDown)

        return () => {
            document.body.style.overflow = prevOverflow
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, onClose, onPrev, onNext])

    if (!isOpen) return null

    const canPrev = activeIndex > 0
    const canNext = activeIndex < images.length - 1
    const activeImage = images[activeIndex] || images[0] || ''

    return (
        <div className="fixed inset-0 z-[999] bg-black">
            <div className="flex h-full w-full flex-col text-white">
                <div className="mb-[12px] flex items-center justify-between bg-[#000] p-[18px_20px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer flex items-center gap-[12px]"
                    >
                        <CloseIcon className="w-[12px] h-[12px]" fill="#fff" fillOpacity="1" />
                        <p className="text-[14px] font-[Inter-Regular] text-[#fff]">Close</p>
                    </button>

                    <p className="mx-auto text-[14px] font-[Inter-SemiBold] text-white">Floor Plan</p>
                </div>

                <div className="flex flex-1 flex-col items-center justify-center px-4 pb-[22px] pt-[12px]">
                    <div className="relative w-full max-w-[980px] overflow-hidden">
                        {activeImage ? (
                            <Image src={activeImage} alt="Floor plan" width={980} height={400} className="mx-auto h-[400px] w-[980px] object-contain" />
                        ) : (
                            <div className="mx-auto flex h-[400px] w-[980px] items-center justify-center rounded-[8px] bg-[#111]">
                                <p className="text-[14px] font-[Inter-Regular] text-[rgba(255,255,255,0.7)]">No floor plan image available</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-[18px] flex items-center justify-center gap-[16px] rtl:flex-row-reverse">
                        <button
                            type="button"
                            onClick={onPrev}
                            disabled={!canPrev}
                            className="cursor-pointer flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#1f2933] text-white disabled:opacity-40"
                            aria-label="Previous floor plan"
                        >
                            <PaginationPrevIcon className="h-[12px] w-[12px]" stroke="#fff" />
                        </button>
                        <p className="text-[14px] font-[Inter-Regular] text-[rgba(255,255,255,0.6)]">
                            Showing {images.length ? activeIndex + 1 : 0} of {images.length}
                        </p>
                        <button
                            type="button"
                            onClick={onNext}
                            disabled={!canNext}
                            className="cursor-pointer flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#1f2933] text-white disabled:opacity-40"
                            aria-label="Next floor plan"
                        >
                            <PaginationNextIcon className="h-[12px] w-[12px]" stroke="#fff" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
