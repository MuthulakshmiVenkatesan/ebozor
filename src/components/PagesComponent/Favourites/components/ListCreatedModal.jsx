/* eslint-disable react/prop-types */
'use client'

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'
import postads from '../../../../../public/assets/img/postads.png'

const ListCreatedModal = ({ open, onClose, onSelectAds, onInvite }) => {
    const dialogRef = useRef(null)

    useEffect(() => {
        if (!open) return
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [open, onClose])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-[16px]"
            onMouseDown={(e) => {
                if (dialogRef.current && !dialogRef.current.contains(e.target)) onClose?.()
            }}
        >
            <div
                ref={dialogRef}
                className="max-sm:w-full w-[440px] bg-white rounded-[14px] shadow-[0_20px_50px_rgba(0,0,0,0.25)] overflow-hidden"
                onMouseDown={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="border-b border-[rgba(143,143,143,0.24)] p-[20px] flex flex-col items-center text-center">
                    <div className="relative">
                        <Image
                            src={postads}
                            alt=""
                            width={80}
                            height={70}
                            className="w-[80px] h-[70px] object-contain"
                        />
                    </div>
                    <h3 className="text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
                        Your list <span className='font-[Inter-SemiBold] text-[#000]'>prop</span> is created
                    </h3>
                </div>

                <div className="max-sm:h-[60vh] p-[30px_40px] overflow-y-auto">
                    <div className="mb-[24px] bg-[rgba(143,143,143,0.24)] rounded-[5px] p-[20px] flex gap-[20px] items-center">
                        <div className="w-[66px] h-[66px] bg-[rgba(143,143,143,0.24)] rounded-[5px]" />
                        <div className="flex flex-col justify-between flex-1 gap-[30px]">
                            <div className="h-[10px] bg-[rgba(143,143,143,0.24)] rounded-[5px] w-[90%] h-[14px] " />
                            <div className="h-[10px] bg-[rgba(143,143,143,0.24)] rounded-[5px] w-[60%] h-[14px]" />
                        </div>
                    </div>

                    <p className="mb-[26px] text-[14px] font-[Inter-Regular] text-[#000000BF] leading-[24px]">
                        your list is empty, you can move ads from your default favorites list
                    </p>

                    <button
                        type="button"
                        onClick={() => onSelectAds?.()}
                        className="p-[10px] w-full rounded-[6px] border border-[rgba(0,0,0,0.70)] text-[14px] font-[Inter-Regular] text-[#000000B2] cursor-pointer"
                    >
                        Select Ads From  All Favorites
                    </button>

                    <div className='mt-[24px] border-t border-[rgba(143,143,143,0.24)] pt-[24px]'>
                        <p className="mb-[14px] text-[14px] font-[Inter-Regular] text-[#000000BF]">
                            You can share and invite friends to collaborate or view your list
                        </p>

                        <button
                            type="button"
                            onClick={() => onInvite?.()}
                            className="text-[14px] font-[Inter-Medium] text-[#3A88EF] cursor-pointer"
                        >
                            Invite collaborators on this list
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ListCreatedModal

