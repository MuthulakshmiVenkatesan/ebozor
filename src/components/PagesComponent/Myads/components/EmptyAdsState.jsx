'use client'

import React from 'react'
import Image from 'next/image'
import empty from '../../../../../public/assets/img/icons/empty.svg'

const EmptyAdsState = ({ title, buttonText = 'Post ad now', onButtonClick }) => {
    return (
        <div className="w-full flex flex-col items-center justify-center py-[60px]">
            <div className="w-[100px] h-[100px] flex items-center justify-center">
                <Image src={empty} alt="empty ads" width={100} height={100} className="w-[100px] h-[100px] object-contain" />
            </div>
            <h4 className="text-[22px] font-[Inter-Bold] text-[#000] text-center mt-[8px]">
                {title}
            </h4>
            <button
                type="button"
                onClick={onButtonClick}
                className="mt-[22px] p-[12px] w-[320px] max-sm:w-full rounded-[8px] bg-[#DC0000] text-white text-[16px] font-[Inter-SemiBold] cursor-pointer"
            >
                {buttonText}
            </button>
        </div>
    )
}

export default EmptyAdsState

