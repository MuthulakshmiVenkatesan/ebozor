/* eslint-disable react/prop-types */
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { PlusIcon, AdsTickIcon } from '@/components/CustomFile/icons'

const SelectAdsModal = ({
    open,
    onClose,
    onAddToList,
    isLoading = false,
    title = 'Select ads from all favorites',
    listTitle = 'All favorites',
    listBadge = 'Default',
    savedAdsCount = '3 Save Ads',
    items: itemsProp,
}) => {
    const dialogRef = useRef(null)
    const [selectedIds, setSelectedIds] = useState([])

    const demoItems = useMemo(
        () => [
            { id: 1, image: '/assets/img/car.png', price: 'AED 199,990', name: '0% Down Payment! Pa...' },
            { id: 2, image: '/assets/img/car.png', price: 'AED 199,990', name: '0% Down Payment! Pa...' },
            { id: 3, image: '/assets/img/car.png', price: 'AED 199,990', name: '0% Down Payment! Pa...' },
            { id: 4, image: '/assets/img/car.png', price: 'AED 199,990', name: '0% Down Payment! Pa...' },
        ],
        []
    )

    const items = Array.isArray(itemsProp) && itemsProp.length > 0 ? itemsProp : (isLoading ? [] : demoItems)

    useEffect(() => {
        if (!open) return
        setSelectedIds([])
    }, [open])

    useEffect(() => {
        if (!open) return
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [open, onClose])

    const toggle = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    }

    const canAdd = selectedIds.length > 0

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-[16px]"
            onMouseDown={(e) => {
                if (dialogRef.current && !dialogRef.current.contains(e.target)) onClose?.()
            }}
        >
            <div
                ref={dialogRef}
                className="max-sm:w-full w-[440px] bg-white rounded-[14px] shadow-[0_20px_50px_rgba(0,0,0,0.25)] overflow-hidden p-[20px] " 
                onMouseDown={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="pb-[20px] border-b border-[rgba(143,143,143,0.24)]">
                    <h3 className="text-[18px] font-[Inter-SemiBold] text-[#000]">{title}</h3>
                </div>

                <div className="mt-[20px]">
                    <div className="flex items-center justify-between mb-[16px]">
                        <div className="flex items-center gap-[8px]">
                            <h4 className="text-[14px] font-[Inter-SemiBold] text-[#000]">{listTitle}</h4>
                            {listBadge ? (
                                <span className="text-[10px] font-[Inter-Medium] text-[#fff] bg-[#3A88EF] p-[2px_8px] rounded-[9px]">
                                    {listBadge}
                                </span>
                            ) : null}
                        </div>
                        <p className="text-[12px] font-[Inter-Medium] text-[#8F8F8F]">{savedAdsCount}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-[20px]">
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, idx) => (
                                <div key={`skeleton-${idx}`} className="rounded-[10px] overflow-hidden border border-[rgba(143,143,143,0.20)]">
                                    <div className="w-full h-[130px] bg-[rgba(143,143,143,0.24)] animate-pulse" />
                                    <div className="p-[10px]">
                                        <div className="h-[14px] w-[70%] rounded-[4px] bg-[rgba(143,143,143,0.24)] animate-pulse" />
                                        <div className="h-[14px] w-[90%] rounded-[4px] bg-[rgba(143,143,143,0.24)] mt-[8px] animate-pulse" />
                                    </div>
                                </div>
                            ))
                        ) : items.map((it, idx) => {
                            const isSelected = selectedIds.includes(it.id)
                            return (
                                <button
                                    key={it.id ?? idx}
                                    type="button"
                                    onClick={() => toggle(it.id)}
                                    className={`relative text-left rounded-[10px] overflow-hidden cursor-pointer ${
                                        isSelected ? '' : ''
                                    }`}
                                >
                                    <div className="relative w-full h-[130px]">
                                        <Image
                                            src={it.image || '/assets/img/car.png'}
                                            alt=""
                                            fill
                                            className="object-cover"
                                        />
                                        {idx === 0 ? (
                                            <div className="absolute top-[8px] left-[8px] flex items-center justify-center z-[1]">
                                               <PlusIcon className='w-[24px] h-[24px]' />
                                            </div>
                                        ) : null}
                                        {isSelected ? (
                                            <div className="absolute top-[8px] left-[8px] flex items-center justify-center z-[2]">
                                                <AdsTickIcon className='w-[24px] h-[24px]' />
                                            </div>
                                        ) : null}
                                    </div>
                                    <div className="p-[10px]">
                                        <p className="text-[14px] font-[Inter-SemiBold] text-[#000]">{it.price}</p>
                                        <p className="text-[14px] font-[Inter-SemiBold] text-[#000] mt-[4px] truncate">
                                            {it.name}
                                        </p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="pt-[24px] border-t border-[rgba(143,143,143,0.24)] flex items-center justify-between">
                    <p className="text-[12px] font-[Inter-Regular] text-[#000000BF]">
                        {selectedIds.length}ad Selected
                    </p>
                    <div className="flex items-center gap-[10px]">
                        <button
                            type="button"
                            onClick={() => onClose?.()}
                            className="h-[34px] px-[16px] rounded-[8px] border border-black/20 text-[12px] font-[Inter-Medium] text-[#000] hover:bg-black/5 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={!canAdd || isLoading}
                            onClick={() => {
                                if (!canAdd) return
                                onAddToList?.(selectedIds)
                                onClose?.()
                            }}
                            className="h-[34px] px-[16px] rounded-[8px] bg-[#000] text-white text-[12px] font-[Inter-Medium] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Add To List
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SelectAdsModal

