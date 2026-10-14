'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import phoneicon from '../../../../public/assets/img/icons/phoneicon.svg'

export default function FooterCallModal({
    open,
    onClose,
    heading = 'Call us to get in touch',
    timingText = '9:00 AM to 6:00 PM, Monday to Friday',
    phoneNumber = '800-38249953 (ebozor)',
    email = 'customersupport@ebozor.com',
}) {
    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-[400] flex items-center justify-center bg-[rgba(17,24,39,0.52)] px-[16px]"
            onClick={onClose}
        >
            <div
                className="max-sm:w-full max-w-[400px] rounded-[6px] bg-white text-center shadow-[0_24px_60px_rgba(0,0,0,0.28)] p-[40px_24px_18px]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-[24px] flex justify-center">
                    <Image src={phoneicon} alt="phone" width={42} height={42} className="h-[42px] w-[42px]" />
                </div>

                <h3 className="mb-[8px] text-[20px] font-[Inter-Bold] leading-[1.15] text-[#23262A]">
                    {heading}
                </h3>
                <p className="mb-[12px] text-[14px] font-[Inter-Regular] text-[#23262A]">
                    {timingText}
                </p>

                <Link
                    href={`tel:${String(phoneNumber).replace(/[^0-9+]/g, '')}`}
                    className="mx-auto mb-[10px] inline-flex items-center justify-center rounded-[6px] bg-[#DC0000] p-[14px_24px] text-[14px] font-[Inter-SemiBold] leading-none text-white transition "
                >
                    {phoneNumber}
                </Link>

                <p className="text-[14px] font-[Inter-Regular] leading-[1.2] text-[#23262A] ">
                    Or email us at{' '}
                    <Link href={`mailto:${email}`} className="font-[Inter-SemiBold] text-[#3a88ef] hover:underline">
                        {email}
                    </Link>
                </p>
            </div>
        </div>
    )
}
