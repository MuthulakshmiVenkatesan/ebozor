'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useSelector } from 'react-redux'
import { RightArrowIcon } from '@/components/CustomFile/icons'
import getverifiedcard from '../../../../public/assets/img/getverifiedcard.png'
import quickverification from '../../../../public/assets/img/icons/quickverification.svg'
import encrypted from '../../../../public/assets/img/icons/encrypted.svg'
import EmiratesIdModal from './EmiratesIdModal'
import SafetyFirstModal from './SafetyFirstModal'
import { getVerificationFiledsApi, sendVerificationReqApi } from '@/utils/api'
import { userSignUpData } from '@/redux/reuducer/authSlice'
import toast from 'react-hot-toast'

const normalizeName = (value = '') => String(value).trim().toLowerCase()

const matchesPhoneField = (name) => normalizeName(name) === 'phone number'
const matchesFrontIdField = (name) => {
    const n = normalizeName(name)
    return n.includes('id front') || n === 'id proof' || n === 'id'
}
const matchesBackIdField = (name) => {
    const n = normalizeName(name)
    return n.includes('id back') || n === 'id proof' || n === 'id'
}
const matchesFaceField = (name) => {
    const n = normalizeName(name)
    return n.includes('face clip') || n.includes('face verification') || n === 'face'
}
const GetVerifiedModal = ({
    isOpen,
    onClose,
    onMaybeLater,
    onGetVerified,
    onVerifiedSuccess,
    onVerificationSubmitted,
    nextModalType = 'safety',
}) => {
    const isSafetyFlow = nextModalType === 'safety'
    const userData = useSelector(userSignUpData)
    const [isEmiratesIdModalOpen, setIsEmiratesIdModalOpen] = useState(false)
    const [isSafetyFirstModalOpen, setIsSafetyFirstModalOpen] = useState(false)
    const [fields, setFields] = useState([])
    const [isFieldsLoading, setIsFieldsLoading] = useState(false)
    const [verificationPayload, setVerificationPayload] = useState({
        phone: '',
        front: null,
        back: null,
        face: null,
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const isPhoneVerified = useMemo(() => {
        const mobile = String(userData?.mobile || '').trim()
        return Number(userData?.mobile_verify) === 1 && mobile.length > 0
    }, [userData?.mobile, userData?.mobile_verify])

    useEffect(() => {
        if (!isOpen) {
            setIsEmiratesIdModalOpen(false)
            setIsSafetyFirstModalOpen(false)
            return
        }
        const loadFields = async () => {
            try {
                setIsFieldsLoading(true)
                const res = await getVerificationFiledsApi.getVerificationFileds()
                const rows = Array.isArray(res?.data?.data) ? res.data.data : []
                setFields(rows)
            } catch {
                setFields([])
            } finally {
                setIsFieldsLoading(false)
            }
        }
        loadFields()
    }, [isOpen])

    const mappedFieldIds = useMemo(() => {
        let phoneId = null
        let frontId = null
        let backId = null
        let faceId = null
        for (const field of fields) {
            const id = Number(field?.id)
            if (!id) continue
            const name = field?.name || ''
            if (phoneId == null && matchesPhoneField(name)) phoneId = id
            if (frontId == null && matchesFrontIdField(name)) frontId = id
            if (backId == null && matchesBackIdField(name)) backId = id
            if (faceId == null && matchesFaceField(name)) faceId = id
        }
        return { phoneId, frontId, backId, faceId }
    }, [fields])

    const submitVerificationRequest = async (overrides = {}) => {
        const mergedPayload = {
            ...verificationPayload,
            ...overrides,
        }
        const details = {}
        const { phoneId, frontId, backId, faceId } = mappedFieldIds
        if (phoneId && mergedPayload.phone) details[phoneId] = mergedPayload.phone
        if (frontId && mergedPayload.front) details[frontId] = mergedPayload.front
        if (backId && mergedPayload.back) details[backId] = mergedPayload.back
        if (faceId && mergedPayload.face) details[faceId] = mergedPayload.face

        if (Object.keys(details).length === 0) {
            toast.error('No verification data to submit')
            return false
        }

        try {
            setIsSubmitting(true)
            const res = await sendVerificationReqApi.sendVerificationReq({ Details: details })
            if (res?.data?.error === false) {
                toast.success(res?.data?.message || 'Verification request submitted successfully')
                return true
            }
            toast.error(res?.data?.message || 'Failed to submit verification request')
            return false
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to submit verification request')
            return false
        } finally {
            setIsSubmitting(false)
        }
    }

    const openVerificationFlow = () => {
        if (isFieldsLoading) return
        if (isSafetyFlow && !isPhoneVerified) {
            setIsSafetyFirstModalOpen(true)
            return
        }
        if (isPhoneVerified && userData?.mobile) {
            setVerificationPayload((prev) => ({
                ...prev,
                phone: String(userData.mobile).replace(/\s+/g, ''),
            }))
        }
        setIsEmiratesIdModalOpen(true)
    }

    const handleEmiratesIdClose = () => {
        setIsEmiratesIdModalOpen(false)
        onClose?.()
    }

    const handleVerificationSubmitted = async (payloadOverrides) => {
        const ok = await submitVerificationRequest(payloadOverrides)
        if (!ok) return false
        onVerificationSubmitted?.()
        onVerifiedSuccess?.()
        return true
    }

    if (!isOpen) return null
    return (
        <>
            {isOpen && !isEmiratesIdModalOpen && !isSafetyFirstModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 p-[16px] max-sm:p-[8px]">
                    <div className="max-sm:w-full w-[500px] overflow-hidden rounded-[8px] bg-white shadow-[0_12px_28px_rgba(0,0,0,0.24)]">
                        <div className="max-h-[88vh] overflow-y-auto p-[16px_16px_0px] max-sm:max-h-[80vh]">
                            <div className="mb-[12px] flex justify-center">
                                <Image
                                    src={getverifiedcard}
                                    alt="Get verified"
                                    className="h-[160px] w-auto object-contain"
                                    priority
                                />
                            </div>

                            <div className="text-center border-b border-[rgba(35,38,42,0.18)] pb-[14px]">
                                <h2 className="mb-[6px] text-[22px] font-[Inter-Bold] text-[#23262A]">
                                    Get verified on Ebozor!
                                </h2>
                                <div className='flex items-center gap-[10px] justify-center'>
                                    <p className="text-[16px] font-[Inter-Regular] text-[#2f3337]">
                                        Build Trust
                                    </p>
                                    <div className='p-[2px] rounded-full bg-[#23262A]'></div>
                                    <p className="text-[16px] font-[Inter-Regular] text-[#2f3337]">
                                        Gain Visibility
                                    </p>
                                    <div className='p-[2px] rounded-full bg-[#23262A]'></div>
                                    <p className="text-[16px] font-[Inter-Regular] text-[#2f3337]">
                                        Unlock Rewards
                                    </p>
                                </div>
                            </div>

                            <div className="px-[8px] pb-[14px]">
                                <div className="flex flex-col gap-[24px] py-[20px] ">
                                    <div className="flex items-center gap-[16px]">
                                        <div className="flex h-[55px] w-[55px] shrink-0 items-center justify-center rounded-[8px] bg-[#f2f7fe]">
                                            <Image src={quickverification} alt="Quick and simple" className="w-auto h-auto object-contain" />
                                        </div>
                                        <div>
                                            <h4 className="text-[14px] font-[Inter-Bold] text-[#23262A]">Quick &amp; Simple</h4>
                                            <p className="text-[14px] font-[Inter-Regular] leading-[1.35] text-[#23262A]">
                                                It only takes a few minutes
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-[16px]">
                                        <div className="flex h-[55px] w-[55px] shrink-0 items-center justify-center rounded-[8px] bg-[#f2f7fe]">
                                            <Image src={encrypted} alt="Secure" className="w-auto h-auto object-contain" />
                                        </div>
                                        <div>
                                            <h4 className="text-[14px] font-[Inter-Bold] text-[#23262A]">Secure</h4>
                                            <p className="text-[14px] font-[Inter-Regular] leading-[1.35] text-[#23262A]">
                                                Your ID information stays private
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => onGetVerified?.('learn_more')}
                                    className="mt-[14px] text-[16px] font-[Inter-Regular] text-[#3a88ef]"
                                >
                                    Learn more of verification on Ebozor
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-[10px] border-t border-[rgba(35,38,42,0.18)] bg-white mx-[16px] p-[14px_16px]">
                            <button
                                type="button"
                                onClick={() => {
                                    onMaybeLater?.()
                                    onClose?.()
                                }}
                                className="cursor-pointer rounded-[6px] border border-[rgba(35,38,42,0.35)] bg-white p-[8px_24px] text-[14px] font-[Inter-Medium] text-[#23262A]"
                            >
                                Later
                            </button>
                            <button
                                type="button"
                                onClick={openVerificationFlow}
                                disabled={isFieldsLoading}
                                className="cursor-pointer rounded-[6px] bg-[#23262A] p-[8px_24px] flex items-center disabled:opacity-50"
                            >
                                <p className='text-[14px] font-[Inter-SemiBold] text-white'>{isFieldsLoading ? 'Loading...' : 'Get Verified'}</p>
                                <RightArrowIcon className='w-[24px] h-[24px] text-white rtl:rotate-180' stroke='#fff' />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <EmiratesIdModal
                isOpen={isEmiratesIdModalOpen}
                onClose={handleEmiratesIdClose}
                onTakePhoto={(side) => onGetVerified?.('take_photo', side)}
                onConfirmPhoto={(imageDataUrl, side) =>
                    onGetVerified?.(side === 'back' ? 'confirm_back' : 'confirm_front', imageDataUrl)
                }
                onConfirmPhotoFile={(file, side) => {
                    if (!file) return
                    if (side === 'front') {
                        setVerificationPayload((prev) => ({ ...prev, front: file }))
                    } else {
                        setVerificationPayload((prev) => ({ ...prev, back: file }))
                    }
                }}
                onFaceClipRecorded={(file) => {
                    if (!file) return
                    setVerificationPayload((prev) => ({ ...prev, face: file }))
                }}
                onVerificationSubmitted={handleVerificationSubmitted}
            />
            {isSafetyFlow && (
                <SafetyFirstModal
                    isOpen={isSafetyFirstModalOpen}
                    onClose={() => setIsSafetyFirstModalOpen(false)}
                    onSubmit={(payload) => {
                        onGetVerified?.(payload)
                        if (payload?.stage === 'otp_verified') {
                            setVerificationPayload((prev) => ({
                                ...prev,
                                phone: `${payload?.countryCode || ''}${payload?.phoneNumber || ''}`.replace(/\s+/g, ''),
                            }))
                            setIsSafetyFirstModalOpen(false)
                            setIsEmiratesIdModalOpen(true)
                        }
                    }}
                />
            )}
        </>
    )
}

export default GetVerifiedModal
