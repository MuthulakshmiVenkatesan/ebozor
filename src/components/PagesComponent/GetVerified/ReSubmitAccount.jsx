'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import verifiedbadgegrey from '../../../../public/assets/img/icons/verifiedbadgegrey.svg'
import GetVerifiedModal from './GetVerifiedModal'

const ReSubmitAccount = ({ onResubmit, onVerificationSubmitted }) => {
    const [isGetVerifiedModalOpen, setIsGetVerifiedModalOpen] = useState(false)

    return (
        <>
            <div className="w-full rounded-[8px] bg-[linear-gradient(90deg,_rgb(243,248,255)_0%,_rgb(225,238,255)_100%)] p-[20px]">
                <div className="flex items-center justify-between gap-[14px] max-sm:flex-col max-sm:items-start">
                    <div className="flex min-w-0 items-center gap-[14px]">
                        <div className="relative shrink-0">
                            <Image src={verifiedbadgegrey} alt="resubmit account" className="w-auto h-auto object-contain" />
                        </div>

                        <div className="flex min-w-0 items-center gap-[10px] flex-wrap">
                            <h4 className="whitespace-nowrap text-[14px] font-[Inter-Bold] text-[#23262A]">
                                Resubmit your verification request
                            </h4>
                            <div className='flex items-center gap-[10px]'>
                                <p className="text-[12px] font-[Inter-Regular] text-[#8F8F8F]">
                                    Get more visibility
                                </p>
                                <div className='h-[16px] w-[1px] bg-[#8F8F8F] opacity-60'></div>
                                <p className="text-[12px] font-[Inter-Regular] text-[#8F8F8F]">
                                    Enhance your credibility
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            onResubmit?.()
                            setIsGetVerifiedModalOpen(true)
                        }}
                        className="rounded-[6px] border border-[rgba(143,143,143,0.22)] bg-white p-[6px_16px] text-[14px] font-[Inter-SemiBold] text-[#23262A] cursor-pointer"
                    >
                        Resubmit Request
                    </button>
                </div>
            </div>

            <GetVerifiedModal
                isOpen={isGetVerifiedModalOpen}
                onClose={() => setIsGetVerifiedModalOpen(false)}
                nextModalType="emirates"
                onGetVerified={() => { }}
                onVerificationSubmitted={onVerificationSubmitted}
            />
        </>
    )
}

export default ReSubmitAccount
