'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import tick from '../../../../../public/assets/img/icons/check.svg'
import paymentimg from '../../../../../public/assets/img/payment.jpeg'

export default function PaymentSuccessPage({ onContinue }) {
    return (
        <div className='w-full bg-[#cccccc]'>
            <div className="mx-auto p-[40px_0px_96px] w-[620px] max-sm:w-full overflow-hidden">
                <div className="relative bg-[#10B910] py-[40px] text-center">
                    <h3 className="text-[20px] mb-[20px] font-[Inter-SemiBold] text-white">Payment Successful</h3>
                    <div className="w-fit absolute bottom-[-26px] left-0 right-0 mx-auto flex border-3 border-[#10B910] bg-white rounded-full p-[10px]">
                        <Image src={tick} alt='success' width={40} height={40} className='w-[40px] h-[40px]' />
                    </div>
                </div>

                <div className="pb-[22px] pt-[44px] text-center bg-white ">
                    <p className="mb-[8px] text-[22px] leading-[1.1] font-[Inter-Regular] text-[#666666]">
                        Your payment was completed successfully
                    </p>
                    <p className="mx-auto mb-[50px] max-sm:w-full text-[16px] leading-[1.35] font-[Inter-Regular] text-[#666666]">
                        Thank you for booking your inspection with Ebozor. Our team will contact you soon with the next steps.
                        {' '}
                        <Link href="/" className="cursor-pointer text-[#00a364] font-[Inter-Regular] text-[16px]">
                            Go to home.
                        </Link>
                    </p>

                    <button
                        type="button"
                        onClick={onContinue}
                        className="cursor-pointer rounded-[6px] bg-[#10B910] p-[8px_50px] text-[14px] shadow-[rgba(0,0,0,0.2)_0px_3px_1px_-2px,rgba(0,0,0,0.14)_0px_2px_2px_0px,rgba(0,0,0,0.12)_0px_1px_5px_0px] font-[Inter-SemiBold] text-white"
                    >
                        Continue
                    </button>

                    <div className="mt-[50px] flex items-center justify-center gap-[12px] text-[16px] text-[#8F8F8F]">
                        <Image src={paymentimg} alt='paymentimg' width={200} height={30} className='w-[200px] h-[30px]' />
                    </div>
                </div>
            </div>
        </div>
    )
}
