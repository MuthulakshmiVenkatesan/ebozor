'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { CloseIcon, CategoryIcon } from '@/components/CustomFile/icons'
import otpmobile from '../../../../public/assets/img/icons/otpmobile.svg'
import SuccessModal from './SuccessModal'

const VerifyOTPModal = ({
    isOpen,
    onClose,
    onBack,
    onVerify,
    onVerifiedSuccess,
    onResendCode,
    onCallInstead,
    onSupportClick,
    phoneNumber = '+971555555555',
    initialSeconds = 60,
}) => {
    const [otp, setOtp] = useState('')
    const [seconds, setSeconds] = useState(initialSeconds)
    const [isSuccessOpen, setIsSuccessOpen] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        setOtp('')
        setSeconds(initialSeconds)
        setIsSuccessOpen(false)
    }, [isOpen, initialSeconds])

    useEffect(() => {
        if (!isOpen || seconds <= 0) return
        const timer = setInterval(() => {
            setSeconds((prev) => prev - 1)
        }, 1000)
        return () => clearInterval(timer)
    }, [isOpen, seconds])

    if (!isOpen) return null

    const formattedSeconds = `01:${String(Math.max(seconds, 0)).padStart(2, '0')}`
    const isOtpValid = otp.trim().length >= 4
    const isTimerEnded = seconds <= 0

    return (
        <>
            {!isSuccessOpen && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/45 p-[16px]">
                    <div className="relative max-sm:w-full w-[440px] rounded-[8px] bg-white p-[24px] shadow-[0_12px_28px_rgba(0,0,0,0.24)]">
                        <div className="mb-[8px] flex items-center justify-between">
                            <button
                                type="button"
                                onClick={onBack}
                                className="text-[30px] leading-none text-[#8F8F8F]"
                                aria-label="Back"
                            >
                                <CategoryIcon className='w-[14px] h-[14px] rotate-180' stroke='#8f8f8f' fill='#8f8f8f' />
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-[30px] leading-none text-[#8F8F8F]"
                                aria-label="Close verify OTP modal"
                            >
                                <CloseIcon className='w-[14px] h-[14px]' stroke='#8f8f8f' fill='#8f8f8f' />
                            </button>
                        </div>
                        <div className='px-[60px]'>

                            <div className="mx-auto mb-[18px] flex w-full  justify-center">
                                <Image src={otpmobile} alt="OTP mobile" className="h-[64px] w-[64px] object-contain" priority />
                            </div>


                            <div className='mb-[24px]'>
                                <h2 className="text-center text-[22px] font-[Inter-Bold] text-[#23262A]">An OTP is on the way</h2>
                            </div>

                            <div className="text-center mb-[18px]">
                                <p className="text-[16px] font-[Inter-Regular] text-[#626465]">We sent a verification code to</p>
                                <p className="text-[16px] font-[Inter-Bold] text-[#DC0000]">{phoneNumber}</p>
                                <p className="text-[16px] font-[Inter-Regular] text-[#626465]">Please enter it below:</p>
                            </div>

                            <div className="mb-[10px]">
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="Enter your verification code."
                                    className="w-full rounded-[6px] border border-[rgba(35,38,42,0.35)] px-[14px] py-[12px] text-[14px] font-[Inter-Regular] text-[#23262A] placeholder:text-[#8f8f8f] outline-none text-center"
                                />
                            </div>

                            <div className='flex flex-col gap-[14px] mb-[12px]'>
                                {isTimerEnded ? (
                                    <>
                                        <p className="text-center text-[14px] font-[Inter-Regular] text-[#596171]">Didn&apos;t receive a code yet?</p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSeconds(initialSeconds)
                                                onResendCode?.()
                                            }}
                                            className="mx-auto cursor-pointer block text-[14px] font-[Inter-Bold] text-[#DC0000]"
                                        >
                                            Resend code
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-center text-[14px] font-[Inter-Regular] text-[#596171]">{formattedSeconds} seconds</p>
                                        <button
                                            type="button"
                                            className="mx-auto block text-[14px] font-[Inter-Bold] text-[#00000042] cursor-not-allowed"
                                            disabled
                                        >
                                            Resend code
                                        </button>
                                    </>
                                )}
                            </div>
                            <div className='mb-[24px]'>
                                <button
                                    type="button"
                                    disabled={!isOtpValid || isVerifying}
                                    onClick={async () => {
                                        if (!onVerify) return
                                        try {
                                            setIsVerifying(true)
                                            const ok = await onVerify(otp)
                                            if (!ok) return
                                            onVerifiedSuccess?.()
                                            setIsSuccessOpen(true)
                                        } finally {
                                            setIsVerifying(false)
                                        }
                                    }}
                                    className="cursor-pointer mx-auto block w-full rounded-[8px] px-[18px] py-[10px] text-[14px] font-[Inter-SemiBold] transition-colors disabled:cursor-not-allowed disabled:bg-[#0000001f] disabled:text-[#00000042] bg-[#DC0000] text-white"
                                >
                                    {isVerifying ? 'Verifying...' : 'Verify'}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => onSupportClick?.()}
                                className="mx-auto block text-[14px] font-[Inter-Bold] text-[#3a88ef]"
                            >
                                Contact Customer Support.
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <SuccessModal
                open={isSuccessOpen}
                onClose={() => {
                    setIsSuccessOpen(false)
                    onClose?.()
                }}
                title="Verification Successful!"
                message="Your phone number has been verified successfully."
            />
        </>
    )
}

export default VerifyOTPModal
