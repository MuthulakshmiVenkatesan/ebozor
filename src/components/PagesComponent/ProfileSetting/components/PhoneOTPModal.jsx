'use client'

import React, { useCallback, useEffect } from 'react'
import Image from 'next/image'
import { CloseIcon } from '@/components/CustomFile/icons'
import otpmobile from '../../../../../public/assets/img/icons/otpmobile.svg'

function formatCountdown(totalSeconds) {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} seconds`
}

export default function PhoneOTPModal({
    open,
    onClose,
    phoneDisplay = '',
    otpCode = '',
    onOtpChange,
    secondsLeft = 0,
    canResend = false,
    onResend,
    onVerify,
    showLoader = false,
    resendOtpLoader = false,
}) {
    const handleClose = useCallback(() => {
        onClose?.()
    }, [onClose])

    useEffect(() => {
        if (!open) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prev
        }
    }, [open])

    useEffect(() => {
        if (!open) return
        const onKey = (e) => {
            if (e.key === 'Escape') handleClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, handleClose])

    if (!open) return null

    const otpReady = otpCode.replace(/\D/g, '').length >= 4

    return (
        <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/45 p-[16px]" role="dialog" aria-modal="true" aria-labelledby="update-password-title">
            <button type="button" className="absolute inset-0 cursor-default" aria-label="Close dialog overlay" onClick={handleClose} />
            <div
                className="relative z-[1] flex max-h-[min(640px,90vh)] w-[450px] max-sm:w-full flex-col overflow-hidden rounded-[10px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex shrink-0 items-center justify-end p-[24px]">
                    <button type="button" onClick={handleClose} className="cursor-pointer p-[6px]" aria-label="Close">
                        <CloseIcon className="h-[14px] w-[14px]" fill="#9CA3AF" fillOpacity="1" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-[24px] pb-[20px] pt-[4px]">
                        <div className='px-[40px] max-sm:px-0'>
                            <div className="mx-auto mb-[20px] mt-[8px] flex justify-center">
                                <div className="">
                                    <Image src={otpmobile} alt="otpmobile" width={64} height={64} className="w-[64px] h-[64px]" />
                                </div>
                            </div>
                            <h2 id="update-password-title" className="mb-[26px] text-center text-[22px] font-[Inter-Bold] leading-snug text-[#23262A]">
                                An OTP is on the way
                            </h2>
                            <div className="mb-[26px] flex flex-col items-center justify-center gap-[6px]">
                                <p className="text-center text-[14px] font-[Inter-Regular] leading-[1.5] text-[#4B5563]">We sent a verification code to</p>
                                <p className="text-center text-[14px] font-[Inter-Bold] text-[#DC0000]">{phoneDisplay}</p>
                                <p className="text-center text-[14px] font-[Inter-Regular] text-[#4B5563]">Please enter it below:</p>
                            </div>

                            <input
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                placeholder="Enter your verification code."
                                value={otpCode}
                                onChange={(e) => onOtpChange?.(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                className="mb-[14px] h-[48px] w-full rounded-[8px] border border-[rgba(143,143,143,0.45)] px-[14px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#9CA3AF] focus:border-[#23262A] flex items-center justify-center text-center"
                            />

                            <p className="mb-[14px] text-center text-[14px] font-[Inter-Regular] text-[#23262A]">{formatCountdown(secondsLeft)}</p>

                            <div className="mb-[18px] flex flex-col items-center justify-center gap-[20px]">
                                {resendOtpLoader ? (
                                    <p className="font-[Inter-Medium] text-[#9CA3AF]">Sending...</p>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={!canResend}
                                        onClick={() => {
                                            if (!canResend) return
                                            onResend?.()
                                        }}
                                        className={`font-[Inter-Medium] ${canResend ? 'cursor-pointer text-[#23262A] ' : 'cursor-not-allowed text-[#9CA3AF]'}`}
                                    >
                                        Resend code
                                    </button>
                                )}
                                <button
                                    type="button"
                                    disabled={!canResend}
                                    className={`font-[Inter-Medium] ${canResend ? 'cursor-pointer text-[#23262A] ' : 'cursor-not-allowed text-[#9CA3AF]'}`}
                                >
                                    Receive a phone call instead
                                </button>
                            </div>

                            <button
                                type="button"
                                disabled={!otpReady || showLoader}
                                onClick={() => {
                                    if (!otpReady || showLoader) return
                                    onVerify?.()
                                }}
                                className={`mb-[16px] w-full rounded-[8px] py-[10px] text-[14px] font-[Inter-SemiBold] ${otpReady && !showLoader ? 'cursor-pointer bg-[#23262A] text-white hover:bg-[#1a1d21]' : 'cursor-not-allowed bg-[#E5E7EB] text-[#9CA3AF]'
                                    }`}
                            >
                                {showLoader ? 'Verifying...' : 'Verify'}
                            </button>

                            <button type="button"  className="w-full cursor-pointer text-center text-[14px] font-[Inter-SemiBold] text-[#3a88ef]">
                                Contact Customer Support
                            </button>
                        </div>
                </div>
            </div>
        </div >
    )
}
