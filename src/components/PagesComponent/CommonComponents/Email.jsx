/* eslint-disable react/prop-types */
'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { LocationIcon } from '@/components/CustomFile/icons'
import bed from '../../../../public/assets/img/icons/bed.svg'
import bath from '../../../../public/assets/img/icons/bath.svg'
import size from '../../../../public/assets/img/icons/size.svg'
import { CloseIcon } from '@/components/CustomFile/icons'
import { userSignUpData } from '@/redux/reuducer/authSlice'
import { getUserDetailApi, itemInquiryApi } from '@/utils/api'
export default function Email({
    open,
    onClose,
    image = '',
    price = '-',
    beds = '-',
    baths = '-',
    sqft = '-',
    location = '-',
    referenceCode = '-',
    itemId = '',
}) {
    const currentUser = useSelector(userSignUpData)
    const currentUserName = String(currentUser?.name || '').trim() || '-'
    const currentUserEmail = String(currentUser?.email || '').trim() || '-'
    const currentUserPhone = String(currentUser?.mobile || currentUser?.phone || '').trim() || '-'
    const currentUserId =
        currentUser?.id ??
        currentUser?.data?.id ??
        currentUser?.user?.id ??
        null
    const initialMessage = `Hi!\n\nI saw your ad with property reference number ${referenceCode || '-'} on ebozor. When is it available for viewing?\n\nThanks.`
    const [message, setMessage] = useState(initialMessage)
    const [name, setName] = useState(currentUserName)
    const [email, setEmail] = useState(currentUserEmail)
    const [phone, setPhone] = useState(currentUserPhone)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (!open) return
        setMessage(initialMessage)
        setName(currentUserName)
        setEmail(currentUserEmail)
        setPhone(currentUserPhone)
    }, [open, initialMessage, currentUserName, currentUserEmail, currentUserPhone])

    useEffect(() => {
        if (!open || !currentUserId) return
        let cancelled = false
        const parseApiPayload = (payload) => {
            if (typeof payload !== 'string') return payload || {}
            const debugAssetIndex = payload.indexOf("<link rel='stylesheet'")
            const scriptIndex = payload.indexOf('<script')
            const cutIndex = debugAssetIndex >= 0 ? debugAssetIndex : scriptIndex
            const jsonText = cutIndex >= 0 ? payload.slice(0, cutIndex) : payload
            try {
                return JSON.parse(jsonText)
            } catch {
                return {}
            }
        }
        const loadLatestUser = async () => {
            try {
                const response = await getUserDetailApi.getUserDetail({ user_id: currentUserId })
                const parsed = parseApiPayload(response?.data)
                const liveUser = parsed?.data && typeof parsed?.data === 'object' ? parsed.data : null
                if (cancelled || !liveUser) return
                setName(String(liveUser?.name || '').trim() || '-')
                setEmail(String(liveUser?.email || '').trim() || '-')
                setPhone(String(liveUser?.mobile || liveUser?.phone || '').trim() || '-')
            } catch {
                // keep Redux-derived fallback values already set above
            }
        }
        loadLatestUser()
        return () => {
            cancelled = true
        }
    }, [open, currentUserId])

    const handleSubmitInquiry = async () => {
        if (!itemId) {
            toast.error('Listing id is missing.')
            return
        }
        if (!String(name || '').trim() || !String(email || '').trim() || !String(message || '').trim()) {
            toast.error('Please fill name, email and message.')
            return
        }
        try {
            setIsSubmitting(true)
            const listingUrl = typeof window !== 'undefined' ? window.location.href : ''
            const response = await itemInquiryApi.sendItemInquiry({
                item_id: itemId,
                name: String(name).trim(),
                email: String(email).trim(),
                phone: String(phone || '').trim(),
                message: String(message).trim(),
                listing_url: listingUrl,
                reference_code: String(referenceCode || '').trim(),
            })

            const payload = response?.data
            const parsedPayload = typeof payload === 'string' ? (() => {
                try {
                    return JSON.parse(payload)
                } catch {
                    return null
                }
            })() : payload

            if (parsedPayload?.error === true) {
                throw new Error(parsedPayload?.message || 'Failed to send inquiry. Please try again.')
            }

            toast.success('Inquiry sent successfully.')
            onClose?.()
        } catch (error) {
            const msg =
                error?.response?.data?.message ||
                error?.message ||
                error?.response?.data?.error ||
                'Failed to send inquiry. Please try again.'
            toast.error(String(msg))
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[320] flex items-center justify-center bg-[rgba(15,23,42,0.55)] ">
            <div className="w-[550px] max-w-full overflow-hidden rounded-[10px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
                <div className="max-h-[85vh] overflow-y-auto">
                    <div className="bg-[#f5f9fe] rounded-[6px_6px_0_0] p-[24px]">
                        <div className="mb-[22px] flex items-center justify-between">
                            <h3 className="text-[18px] font-[Inter-SemiBold] text-[#23262A]">Inquire About this Ad</h3>
                            <button type="button" onClick={onClose} className="cursor-pointer">
                                <CloseIcon className="w-[14px] h-[14px]" fill="#666" />
                            </button>
                        </div>
                        <div className="flex gap-[24px] ">
                            <Image src={image || '/assets/img/property/1.png'} alt="Property" width={150} height={90} className="h-[90px] w-[150px] rounded-[8px] object-cover" />
                            <div className="min-w-0">
                                <h3 className="truncate text-[18px] font-[Inter-SemiBold] text-[#23262A]">
                                    AED <span className="font-[Inter-Bold] text-[22px]">{price}</span>
                                </h3>
                                <div className="flex flex-wrap items-center gap-[22px]">
                                    <div className="flex items-center gap-[6px]">
                                        <Image src={bed} alt="beds" width={16} height={16} />
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{beds} beds</p>
                                    </div>
                                    <div className="flex items-center gap-[6px]">
                                        <Image src={bath} alt="baths" width={16} height={16} />
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{baths} baths</p>
                                    </div>
                                    <div className="flex items-center gap-[6px]">
                                        <Image src={size} alt="sqft" width={16} height={16} />
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{sqft} sqft</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-[6px]">
                                    <LocationIcon className="h-[16px] w-[16px]" stroke="#23262A" />
                                    <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{location}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-[22px]">
                        <h4 className="mb-[14px] text-[16px] font-[Inter-SemiBold] text-[#23262A]">Message</h4>
                        <div className='flex flex-col gap-[14px] mb-[16px]'>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="h-[180px] w-full resize-none rounded-[8px] border border-[rgba(143,143,143,0.45)] p-[14px_14px] text-[14px] text-[#23262A] outline-none"
                            />
                            <input value={name} onChange={(e) => setName(e.target.value)} className=" w-full rounded-[8px] border border-[rgba(143,143,143,0.45)] p-[10px_14px] text-[14px] text-[#23262A] outline-none" />
                            <input value={email} onChange={(e) => setEmail(e.target.value)} className=" w-full rounded-[8px] border border-[rgba(143,143,143,0.45)] p-[10px_14px] text-[14px] text-[#23262A] outline-none" />
                            <input value={phone} onChange={(e) => setPhone(e.target.value)} className=" w-full rounded-[8px] border border-[rgba(143,143,143,0.45)] p-[10px_14px] text-[14px] text-[#23262A] outline-none" />
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={handleSubmitInquiry}
                                className={`mt-[20px] w-full rounded-[10px] py-[10px] text-[14px] font-[Inter-Medium] text-white ${
                                    isSubmitting ? 'cursor-not-allowed bg-[#6b7280]' : 'cursor-pointer bg-[#23262a]'
                                }`}
                            >
                                {isSubmitting ? 'Sending...' : 'Inquire Now'}
                            </button>
                        </div>
                        <p className="text-center text-[14px] text-[#a3a6aa] w-[360px] mx-auto max-sm:w-full">
                            By clicking on 'Inquire Now', I agree to the Ebozor <Link href="/terms-and-conditions" className="text-[#3a88ef]">Terms & Conditions</Link> and <Link href="/privacy-policy" className="text-[#3a88ef]">Privacy Policy</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
