'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import tick from '../../../../../public/assets/img/icons/check.svg'
import paymentimg from '../../../../../public/assets/img/payment.jpeg'

export default function PostAdPaymentSuccessPage({ isCarsCategory = false }) {
    return (
        <div className="w-full bg-[#cccccc]">
            <div className="mx-auto w-[620px] max-sm:w-full overflow-hidden p-[40px_0px_96px]">
                <div className="relative bg-[#10B910] py-[40px] text-center">
                    <h3 className="mb-[20px] text-[20px] font-[Inter-SemiBold] text-white">Payment Successful</h3>
                    <div className="absolute bottom-[-26px] left-0 right-0 mx-auto flex w-fit rounded-full border-3 border-[#10B910] bg-white p-[10px]">
                        <Image src={tick} alt="success" width={40} height={40} className="h-[40px] w-[40px]" />
                    </div>
                </div>

                <div className="bg-white pb-[22px] pt-[44px] text-center">
                    <p className="mb-[10px] text-[22px] font-[Inter-Regular] leading-[1.1] text-[#666666]">
                        Thank you for post your ad
                    </p>
                    {isCarsCategory ? (
                        <p className="mx-auto mb-[18px] max-sm:w-full text-[16px] font-[Inter-Regular] leading-[1.35] text-[#666666]">
                            Your post will be approved within few days.
                        </p>
                    ) : null}

                    <p className="mx-auto mb-[40px] max-sm:w-full text-[16px] font-[Inter-Regular] leading-[1.35] text-[#666666]">
                        <Link href="/" className="cursor-pointer text-[16px] font-[Inter-Regular] text-[#00a364]">
                            Go to home.
                        </Link>
                    </p>

                    <div className="mt-[40px] flex items-center justify-center gap-[12px] text-[16px] text-[#8F8F8F]">
                        <Image src={paymentimg} alt="paymentimg" width={200} height={30} className="h-[30px] w-[200px]" />
                    </div>
                </div>
            </div>
        </div>
    )
}

