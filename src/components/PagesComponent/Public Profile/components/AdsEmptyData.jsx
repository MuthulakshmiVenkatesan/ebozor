import React from 'react'
import Image from 'next/image'
import emptyIllustration from '../../../../../public/assets/img/icons/empty.svg'
import { useRouter } from 'next/navigation'
    
const AdsEmptyData = () => {
    const router = useRouter()
    return (
        <div className="flex flex-col items-center justify-center py-[20px]">
            <div className="mb-[28px] flex justify-center">
                <Image src={emptyIllustration} alt="" width={115} height={115} className="h-auto w-[110px]" priority />
            </div>
            <h4 className="mb-[14px] text-center text-[22px] font-[Inter-Bold] leading-[34px] text-[#23262A] w-[250px] max-sm:w-full">You don&apos;t have any ads that are live</h4>
            <button
                type="button"
                onClick={() => router.push('/placeyourad')}
                className="cursor-pointer rounded-[8px] bg-[#DC0000] w-[24%] max-sm:w-full py-[12px] text-[14px] font-[Inter-Regular] text-white transition-colors hover:bg-[#b80000]"
            >
                Post Ad Now
            </button>
        </div>
    )
}

export default AdsEmptyData