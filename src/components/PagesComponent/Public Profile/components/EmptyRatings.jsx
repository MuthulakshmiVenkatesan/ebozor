import React from 'react'
import Image from 'next/image'
import noratings from '../../../../../public/assets/img/noratings.png'

const EmptyRatings = () => {
    return (
        <div className="flex flex-col items-center justify-center py-[20px]">
            <div className="text-center flex flex-col items-center justify-center gap-[20px]">
                <Image src={noratings} alt="no ratings" width={120} height={120} className="w-[120px] h-[120px] object-contain" />
                <p className="text-center text-[22px] font-[Inter-Bold] leading-[34px] text-[#23262A] w-[250px] max-sm:w-full">
                    You don't have any ratings
                </p>
            </div>
        </div>
    )
}

export default EmptyRatings