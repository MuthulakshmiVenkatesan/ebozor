'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import redcross from '../../../../../public/assets/img/icons/redcross.jpeg'
import paymentimg from '../../../../../public/assets/img/payment.jpeg'

export default function PaymentFailedPage({ onTryAgain }) {
    return (
        <div className='w-full bg-[#cccccc]'>
            <div className="mx-auto p-[40px_0px_96px] w-[620px] max-sm:w-full overflow-hidden">
                <div className="relative bg-[#ca2128] py-[40px] text-center">
                    <h3 className="text-[20px] mb-[20px] font-[Inter-SemiBold] text-white">Payment Failed</h3>
                    <div className="w-fit absolute bottom-[-26px] left-0  right-0 mx-auto flex border-3 border-[#ca2128] bg-white rounded-full p-[10px]">
                        <Image src={redcross} alt='redcross' width={40} height={40} className='w-[40px] h-[40px]' />
                    </div>
                </div>

                <div className="pb-[22px] pt-[44px] text-center bg-white ">
                    <p className="mb-[8px] text-[22px] leading-[1.1] font-[Inter-Regular] text-[#666666]">
                        Your payment didn&apos;t go through
                    </p>
                    <p className="mx-auto mb-[50px] max-sm:w-full text-[16px] leading-[1.35] font-[Inter-Regular] text-[#666666]">
                        If you experience any issues with your payment, please fill in the contact support form to be able of assisting you.{' '}
                        <Link href="/" className="cursor-pointer text-[#00a364] font-[Inter-Regular] text-[16px]">
                            Click here.
                        </Link>
                    </p>

                    <button
                        type="button"
                        onClick={onTryAgain}
                        className="cursor-pointer rounded-[6px] bg-[#ca2128] p-[8px_50px] text-[14px] shadow-[rgba(0,0,0,0.2)_0px_3px_1px_-2px,rgba(0,0,0,0.14)_0px_2px_2px_0px,rgba(0,0,0,0.12)_0px_1px_5px_0px] font-[Inter-SemiBold] text-white"
                    >
                        Try Again
                    </button>

                    <div className="mt-[50px] flex items-center justify-center gap-[12px] text-[16px] text-[#8F8F8F]">
                        <Image src={paymentimg} alt='paymentimg' width={200} height={30} className='w-[200px] h-[30px]' />
                    </div>
                </div>
            </div>
        </div>
    )
}

