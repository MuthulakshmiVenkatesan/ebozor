import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import bannertick from '../../../../../public/assets/img/icons/bannertick.svg'
import bannerlocation from '../../../../../public/assets/img/icons/bannerlocation.svg'
import bannercalendar from '../../../../../public/assets/img/icons/bannercalendar.svg'

const BookInspectionCard = () => {
    return (
        <div className="mb-[30px] rounded-[10px] border border-[#FAD5D5] bg-[linear-gradient(90deg,#FFEDEA_0%,#FFFFFF_100%)] p-[20px]">
            <div className="flex items-center justify-between gap-[16px] flex-wrap">
                <div className="flex flex-col gap-[14px]">
                    <h4 className="text-[18px] font-[Inter-Medium] text-[#000]">
                        Request Ebozor <span className='bg-[linear-gradient(90deg,#E00000_0%,#5A3333_100%)] bg-clip-text text-transparent'>Car Inspection</span>
                    </h4>
                    <p className="text-[16px] font-[Inter-Regular] text-[#000000CC] ">
                        Trusted by 10K+ car buyers, Ebozor is the UAE's go-to platform
                    </p>

                    <div className="flex items-center gap-[22px] flex-wrap">
                        <div className="flex items-center gap-[10px] border-r border-[#F5AAAA] pr-[20px]">
                            <div className="w-[40px] h-[40px] rounded-full bg-[#F5AAAA] flex items-center justify-center">
                                <Image src={bannertick} alt="bannertick" width={18} height={18} />
                            </div>
                            <div className="flex flex-col gap-[4px]">
                                <p className="text-[14px] font-[Inter-Regular] text-[#000] ">
                                    120 - 240
                                </p>
                                <p className="text-[14px] font-[Inter-Regular] text-[#000] ">
                                    Points Covered
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-[10px] border-r border-[#F5AAAA] pr-[20px]">
                            <div className="w-[40px] h-[40px] rounded-full bg-[#F5AAAA] flex items-center justify-center">
                                <Image src={bannerlocation} alt="bannertick" width={18} height={18} />
                            </div>
                            <div className="flex flex-col gap-[4px]">
                                <p className="text-[14px] font-[Inter-Regular] text-[#000] ">
                                    Inspect
                                </p>
                                <p className="text-[14px] font-[Inter-Regular] text-[#000] ">
                                    Anywhere!
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-[10px]">
                            <div className="w-[40px] h-[40px] rounded-full bg-[#F5AAAA] flex items-center justify-center">
                                <Image src={bannercalendar} alt="bannerlocation" width={18} height={18} />
                            </div>
                            <div className="flex flex-col gap-[4px]">
                                <p className="text-[14px] font-[Inter-Regular] text-[#000] ">
                                    Same Day
                                </p>
                                <p className="text-[14px] font-[Inter-Regular] text-[#000] ">
                                    Inspection
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <Link href="/inception" 
                    
                    className="w-[30%] flex items-center justify-center p-[8px_20px] rounded-[8px] bg-[#DC0000] text-white font-[Inter-SemiBold] text-[14px] cursor-pointer whitespace-nowrap"
                >
                    Book Inspection
                </Link>
            </div>
        </div>
  )
}

export default BookInspectionCard