import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import unverifiedbg from '../../../../public/assets/img/icons/unverifiedbg.png'
import user from '../../../../public/assets/img/user.jpeg'
import question from '../../../../public/assets/img/icons/question.png'
import tickmark from '../../../../public/assets/img/icons/tickmark.png'
import GetVerifiedModal from './GetVerifiedModal'
import { getVerificationStatusApi } from '@/utils/api'
import { useSelector } from 'react-redux'

const VerifiedAccount = ({ onVerificationSubmitted, showTickBadge = true }) => {
    const [isGetVerifiedModalOpen, setIsGetVerifiedModalOpen] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState('')
    const isUserLoggedIn = useSelector((state) => !!state?.UserSignup?.data?.token)

    useEffect(() => {
        const fetchVerificationStatus = async () => {
            if (!isUserLoggedIn) {
                setVerificationStatus('')
                return
            }
            try {
                const res = await getVerificationStatusApi.getVerificationStatus()
                if (res?.data?.error === true) {
                    setVerificationStatus('')
                    return
                }
                const status = String(res?.data?.data?.status || '').trim().toLowerCase()
                setVerificationStatus(status)
            } catch {
                setVerificationStatus('')
            }
        }
        fetchVerificationStatus()
    }, [isUserLoggedIn])

    const shouldHideSection = verificationStatus === 'approved' || verificationStatus === 'approve'
    const ctaText = verificationStatus === 'pending' ? 'Resubmit' : 'Get Verified'

    if (shouldHideSection) return null

    return (
        <>
            <div className={`relative overflow-hidden rounded-[10px]  bg-[rgba(58,136,239,0.14)] ${showTickBadge ? 'p-[0px] pr-[16px]  max-sm:p-[16px]' : 'p-[16px]'}`}>
                <div className="max-sm:flex-wrap flex items-center justify-between gap-[12px]">
                    <div className={`flex items-center justify-center ${showTickBadge ? '' : 'relative w-[110px]'}`}>
                        <div className={` ${showTickBadge ? 'relative' : 'absolute top-[-16px]'}`}>
                            <div className="">
                                <Image
                                    src={unverifiedbg}
                                    alt="not verified"
                                    className={` ${showTickBadge ? 'w-[108px] h-full' : 'w-[156px] h-[88px]'}`}
                                />
                            </div>
                        </div>
                        <div className="relative z-[1] cursor-pointer">
                            <Image
                                src={user}
                                alt="user"
                                className="w-[56px] h-[56px] rounded-[100px] border-[2px] border-[#fff] object-cover"
                            />
                            <div className="absolute bottom-[-12px] right-[-10px]">
                                <Image
                                    src={question}
                                    alt="question"
                                    className="w-[50px] h-[50px]"
                                />
                            </div>
                        </div>
                    </div>
                    <div className={`flex items-center  max-sm:flex-wrap ${showTickBadge ? 'flex-row gap-[10px]' : 'flex-col items-start'}`}>
                        <h5 className="text-[16px] font-[Inter-SemiBold] text-[#3a3f47]">
                            Verify your account
                        </h5>
                        <div className="flex items-center gap-[10px]">
                            {showTickBadge ? (
                                <Image src={tickmark} alt="tickmark" className="w-[50px] h-[50px]" />
                            ) : null}
                            <p className={` text-[14px] font-[Inter-Regular] text-[#3a3f47] ${showTickBadge ? 'w-[180px] max-sm:w-full' : ''}`}>
                                Get more visibility, Enhance your credibility
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="p-[6px_14px] rounded-[8px] bg-white text-[14px] font-[Inter-SemiBold] text-[#000000CC] cursor-pointer"
                        onClick={() => setIsGetVerifiedModalOpen(true)}
                    >
                        {ctaText}
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

export default VerifiedAccount