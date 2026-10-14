/* eslint-disable react/prop-types */
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import favourites from '../../../../../public/assets/img/favourites.png'
import { TickIcon, PlusIcon } from '@/components/CustomFile/icons'

const MoveAdToAnotherListModal = ({
    open,
    onClose,
    onConfirm,
    onNewList,
    lists = [],
    currentListIndex = 0,
}) => {
    const dialogRef = useRef(null)
    const [selectedIndexes, setSelectedIndexes] = useState([])

    useEffect(() => {
        if (!open) return
        setSelectedIndexes([])
    }, [open])

    useEffect(() => {
        if (!open) return
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [open, onClose])

    const currentList = lists?.[currentListIndex]
    const availableLists = useMemo(
        () => lists.filter((_, idx) => idx !== currentListIndex),
        [lists, currentListIndex]
    )

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-[12px]"
            onMouseDown={(e) => {
                if (dialogRef.current && !dialogRef.current.contains(e.target)) onClose?.()
            }}
        >
            <div
                ref={dialogRef}
                className="max-sm:w-full w-[500px] bg-white rounded-[10px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
                onMouseDown={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="p-[20px] border-b border-[rgba(143,143,143,0.24)]">
                    <h3 className="text-[18px] font-[Inter-SemiBold] text-[#000]">
                        Move ad to another list
                    </h3>
                </div>

                <div className="max-h-[62vh] overflow-y-auto p-[20px]">
                    <div className="flex items-start justify-between gap-[12px] mb-[18px]">
                        <div className="flex items-center gap-[12px]">
                            <Image src={favourites} alt="" width={68} height={68} className="w-[68px] h-[68px] rounded-[8px] object-cover" />
                            <div>
                                <div className="flex items-center gap-[8px] mb-[4px]">
                                    {currentList?.isDefault ? (
                                        <span className="text-[10px] font-[Inter-Medium] text-[#fff] bg-[#3A88EF] p-[2px_8px] rounded-full">
                                            Default
                                        </span>
                                    ) : null}
                                </div>
                                <h4 className="text-[16px] font-[Inter-SemiBold] text-[#000]">
                                    {currentList?.name || 'All Favorites'}
                                </h4>
                                <p className="text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
                                    {currentList?.count || 0} Saved
                                </p>
                            </div>
                        </div>
                        <div className="w-[32px] h-[32px] rounded-full bg-[#FDE6E6] border border-[#F4C0C0] flex items-center justify-center text-[#DC0000] text-[18px]">
                            ❤
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-[14px]">
                        <h4 className="text-[16px] font-[Inter-SemiBold] text-[#000]">
                            Select a list
                        </h4>
                        <button
                            type="button"
                            onClick={() => onNewList?.()}
                            className="flex items-center gap-[10px] cursor-pointer"
                        >

                            <PlusIcon className='w-[24px] h-[24px]' />
                            <p className="text-[16px] font-[Inter-SemiBold] text-[#000]">
                                New List
                            </p>
                        </button>
                    </div>

                    <div className="flex flex-col gap-[14px]">
                        {availableLists.map((list, idx) => {
                            const isSelected = selectedIndexes.includes(idx)
                            return (
                                <button
                                    key={`${list.name}-${idx}`}
                                    type="button"
                                    onClick={() => {
                                        setSelectedIndexes((prev) =>
                                            prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
                                        )
                                    }}
                                    className="w-full flex items-center justify-between gap-[12px] rounded-[12px] p-[10px] hover:bg-[#F8F8F8] cursor-pointer"
                                >
                                    <div className="flex items-center gap-[14px] text-left">
                                        <Image src={favourites} alt="" width={68} height={68} className="w-[68px] h-[68px] rounded-[8px] object-cover" />
                                        <div className='flex flex-col gap-[4px]'>
                                            <h5 className="text-[16px] font-[Inter-SemiBold] text-[#000]">
                                                {list.name}
                                            </h5>
                                            <p className="text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
                                                {list.count || 0} Saved Ads
                                            </p>
                                            <p className="text-[14px] font-[Inter-Regular] text-[#000]">
                                                Private
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`w-[16px] h-[16px] rounded-full flex items-center justify-center ${
                                            isSelected
                                                ? 'bg-[#23262A] text-white'
                                                : 'bg-[#8F8F8F] text-[#fff]'
                                        }`}
                                    >
                                        {isSelected ? <TickIcon className='w-[12px] h-[12px]' /> : <PlusIcon className='w-[12px] h-[12px]' />}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="p-[16px_20px] border-t border-[rgba(143,143,143,0.24)] flex items-center justify-end gap-[12px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-[10px_20px] rounded-[6px] border border-[#8F8F8F] text-[14px] font-[Inter-Regular] text-[#000000BF] cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={selectedIndexes.length === 0}
                        onClick={() => {
                            if (selectedIndexes.length === 0) return
                            onConfirm?.(selectedIndexes.map((idx) => availableLists[idx]), selectedIndexes)
                            onClose?.()
                        }}
                        className="p-[10px_20px] rounded-[6px] bg-[#000] text-[14px] font-[Inter-SemiBold] text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    )
}

export default MoveAdToAnotherListModal
