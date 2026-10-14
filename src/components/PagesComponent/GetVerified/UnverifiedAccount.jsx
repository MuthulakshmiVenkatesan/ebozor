'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import verifiedbadge from '../../../../public/assets/img/icons/verifiedbadge.svg'
import GetVerifiedModal from './GetVerifiedModal'
import LoginModal from '@/components/Auth/LoginModal'
import { isLogin } from '@/utils'

const UnverifiedAccount = ({ onVerifiedSuccess, showVerifiedBadge = true }) => {
    const [isVerifiedModalOpen, setIsVerifiedModalOpen] = useState(false)
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
    const [isMailSentOpen, setIsMailSentOpen] = useState(false)

    const openSentMailModal = () => {
        setIsLoginModalOpen(false)
        setIsMailSentOpen(true)
    }

    const handleGetStarted = () => {
        if (!isLogin()) {
            setIsLoginModalOpen(true)
            return
        }
        setIsVerifiedModalOpen(true)
    }

    return (
        <>
            <div className={`h-full ${showVerifiedBadge ? 'mb-[10px]' : 'mb-[0px]'}`}>
                <div
                    className={`w-full h-full bg-[rgba(58,136,239,0.14)] rounded-[10px] py-[2px] px-[16px] flex items-center justify-between gap-[16px] ${
                        showVerifiedBadge
                            ? 'max-sm:flex-col max-sm:items-start max-sm:py-[16px]'
                            : 'flex-wrap py-[12px]'
                    }`}
                >
                    <div className="flex items-center gap-[12px] min-w-0">
                        <div className="flex shrink-0 items-center justify-center">
                            <Image src={verifiedbadge} alt="verified badge" className={` ${showVerifiedBadge ? 'w-[80px] h-[80px]' : 'w-[72px] h-[72px]'}`} />
                        </div>
                        <div className={`flex gap-[10px] min-w-0 ${showVerifiedBadge ? 'items-center flex-wrap' : 'flex-col items-start gap-[4px]'}`}>
                            <p className={`font-[Inter-SemiBold] text-[rgba(0,0,0,0.8)] ${showVerifiedBadge ? 'text-[14px]' : 'text-[16px]'}`}>
                                Got a verified badge yet?
                            </p>
                            <div className='flex items-center gap-[10px] flex-wrap'>
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
                        onClick={handleGetStarted}
                        className="p-[6px_30px] rounded-[8px] bg-[#FFF] text-[#000000CC] text-[14px] font-[Inter-SemiBold] cursor-pointer whitespace-nowrap border border-[rgba(143,143,143,0.22)] shrink-0"
                    >
                        Get Started
                    </button>
                </div>
            </div>

            <GetVerifiedModal
                isOpen={isVerifiedModalOpen}
                onClose={() => setIsVerifiedModalOpen(false)}
                onMaybeLater={() => setIsVerifiedModalOpen(false)}
                nextModalType="safety"
                onVerificationSubmitted={onVerifiedSuccess}
                onVerifiedSuccess={() => {
                    onVerifiedSuccess?.()
                    setIsVerifiedModalOpen(false)
                }}
            />

            <LoginModal
                IsLoginModalOpen={isLoginModalOpen}
                setIsLoginModalOpen={setIsLoginModalOpen}
                setIsRegisterModalOpen={setIsRegisterModalOpen}
                IsMailSentOpen={isMailSentOpen}
                setIsMailSentOpen={setIsMailSentOpen}
                IsRegisterModalOpen={isRegisterModalOpen}
                openSentMailModal={openSentMailModal}
            />
        </>
    )
}

export default UnverifiedAccount
