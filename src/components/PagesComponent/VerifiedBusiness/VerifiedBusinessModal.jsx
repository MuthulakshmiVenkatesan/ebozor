'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { CloseIcon, ModalCloseIcon, UploadLinkIcon } from '@/components/CustomFile/icons'
import { userSignUpData } from '@/redux/reuducer/userSlice'
import { verifiedBusinessApi } from '@/utils/api'

const VerifiedBusinessModal = ({ isOpen, onClose, status = 'not_applied', rejectionReason = '', onSubmitted }) => {
    const dialogRef = useRef(null)
    const fileRef = useRef(null)
    const userData = useSelector(userSignUpData)
    const [email, setEmail] = useState('')
    const [hasTradeLicense, setHasTradeLicense] = useState(false)
    const [mobileNumber, setMobileNumber] = useState('')
    const [subject, setSubject] = useState('')
    const [description, setDescription] = useState('')
    const [attachments, setAttachments] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const isApproved = status === 'approved'
    const isPending = status === 'pending'
    const isRejected = status === 'rejected'
    const showForm = !isApproved && !isPending

    useEffect(() => {
        if (!isOpen) return
        setEmail(String(userData?.email || '').trim())
        setMobileNumber(String(userData?.mobile || '').trim())
        setHasTradeLicense(false)
        setSubject('')
        setDescription('')
        setAttachments([])
    }, [isOpen, userData?.email, userData?.mobile])

    useEffect(() => {
        if (!isOpen) return
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [isOpen, onClose])

    if (!isOpen) return null

    const onPickFiles = (files) => {
        const next = Array.from(files || [])
        if (next.length === 0) return
        setAttachments((prev) => [...prev, ...next].slice(0, 5))
    }

    const onDrop = (e) => {
        e.preventDefault()
        onPickFiles(e.dataTransfer.files)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email.trim()) {
            toast.error('Email address is required')
            return
        }
        if (!subject.trim()) {
            toast.error('Subject is required')
            return
        }
        if (!description.trim()) {
            toast.error('Description is required')
            return
        }
        try {
            setIsSubmitting(true)
            const res = await verifiedBusinessApi.sendRequest({
                email: email.trim(),
                has_trade_license: hasTradeLicense,
                mobile_number: mobileNumber.trim(),
                subject: subject.trim(),
                description: description.trim(),
                attachments,
            })
            if (res?.data?.error === true) {
                toast.error(res?.data?.message || 'Failed to submit request')
                return
            }
            toast.success(res?.data?.message || 'Verified business request submitted successfully')
            onSubmitted?.()
            onClose?.()
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to submit request')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 p-[16px] max-sm:p-[8px]"
            onMouseDown={(e) => {
                if (dialogRef.current && !dialogRef.current.contains(e.target)) onClose?.()
            }}
        >
            <div
                ref={dialogRef}
                className="max-h-[92vh] w-full max-w-[560px] overflow-hidden rounded-[8px] bg-white shadow-[0_12px_28px_rgba(0,0,0,0.24)]"
                onMouseDown={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="verified-business-title"
            >
                <div className="flex items-center justify-between border-b border-[rgba(143,143,143,0.24)] p-[16px_20px]">
                    <h2 id="verified-business-title" className="text-[18px] font-[Inter-SemiBold] text-[#23262A]">
                        Verified Business
                    </h2>
                    <button
                        type="button"
                        onClick={() => onClose?.()}
                        className="flex cursor-pointer items-center justify-center"
                        aria-label="Close"
                    >
                        <ModalCloseIcon className="h-[24px] w-[24px]" fill="#8f8f8f" />
                    </button>
                </div>

                <div className="max-h-[calc(92vh-64px)] overflow-y-auto p-[20px_24px_24px]">
                    <div className="mb-[18px] rounded-[6px] border border-[#F5D0C5] bg-[#FFF6F4] p-[10px_12px]">
                        <p className="text-[13px] font-[Inter-Regular] leading-[1.45] text-[#8A2A16]">
                            This form is only for classifieds product businesses (for example shop stores). Motors, property, and job listings are not eligible.
                        </p>
                    </div>

                    {isApproved ? (
                        <p className="text-[14px] font-[Inter-Regular] text-[#059f01]">
                            Your business is already verified. Your classifieds listings now show the Verified Business badge.
                        </p>
                    ) : null}

                    {isPending ? (
                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                            Your verified business request is under review. Our team will get back to you soon.
                        </p>
                    ) : null}

                    {isRejected ? (
                        <div className="mb-[16px] rounded-[6px] border border-[#F5D0C5] bg-[#FFF6F4] p-[10px_12px]">
                            <p className="mb-[4px] text-[14px] font-[Inter-SemiBold] text-[#DC0000]">Your previous request was rejected.</p>
                            {rejectionReason ? (
                                <p className="text-[13px] font-[Inter-Regular] text-[#8A2A16]">{rejectionReason}</p>
                            ) : null}
                            <p className="mt-[6px] text-[13px] font-[Inter-Regular] text-[#23262A]">You can submit a new request below.</p>
                        </div>
                    ) : null}

                    {showForm ? (
                        <form onSubmit={handleSubmit}>
                            <div className="mb-[18px]">
                                <label className="mb-[5px] block text-[16px] font-[Inter-Regular] text-[#23262A]">
                                    Your email address<span className="text-[#DC0000]"> *</span>
                                </label>
                                <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                    className="w-full rounded-[2px] border border-[rgba(143,143,143,0.45)] p-[8px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                />
                            </div>

                            <div className="mb-[10px]">
                                <p className="text-[16px] font-[Inter-Regular] text-[#23262A]">
                                    Do you have a valid trade license or freelance permit to do business in the UAE?
                                </p>
                            </div>
                            <div className="mb-[16px] flex justify-start">
                                <input
                                    type="checkbox"
                                    checked={hasTradeLicense}
                                    onChange={(e) => setHasTradeLicense(e.target.checked)}
                                    className="h-[14px] w-[14px] cursor-pointer rounded border border-[rgba(143,143,143,0.6)]"
                                />
                            </div>

                            <div className="mb-[18px]">
                                <label className="mb-[5px] block text-[16px] font-[Inter-Regular] text-[#23262A]">
                                    Active Mobile Number
                                </label>
                                <input
                                    value={mobileNumber}
                                    onChange={(e) => setMobileNumber(e.target.value)}
                                    type="text"
                                    className="w-full rounded-[2px] border border-[rgba(143,143,143,0.45)] p-[8px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                />
                                <p className="mt-[6px] text-[11px] font-[Inter-Regular] text-[#b0b4ba]">
                                    Example - +9715xxxxxxxxx
                                </p>
                            </div>

                            <div className="mb-[18px]">
                                <label className="mb-[5px] block text-[16px] font-[Inter-Regular] text-[#23262A]">
                                    Subject<span className="text-[#DC0000]"> *</span>
                                </label>
                                <input
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    type="text"
                                    className="w-full rounded-[2px] border border-[rgba(143,143,143,0.45)] p-[8px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                />
                            </div>

                            <div className="mb-[10px]">
                                <label className="mb-[5px] block text-[16px] font-[Inter-Regular] text-[#23262A]">
                                    Description<span className="text-[#DC0000]"> *</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={5}
                                    className="w-full resize-none rounded-[2px] border border-[rgba(143,143,143,0.45)] p-[8px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                />
                                <p className="mt-[8px] text-[11px] font-[Inter-Regular] text-[#b0b4ba]">
                                    Please enter the details of your request. A member of our support staff will respond as soon as possible.
                                </p>
                            </div>

                            <div className="mt-[14px]">
                                <p className="mb-[10px] text-[16px] font-[Inter-Regular] text-[#23262A]">Attachments</p>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    multiple
                                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                    className="hidden"
                                    onChange={(e) => {
                                        onPickFiles(e.target.files)
                                        e.target.value = ''
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={onDrop}
                                    className="flex h-[62px] w-full cursor-pointer items-center justify-center gap-[10px] rounded-[2px] border border-dashed border-[#DC0000] bg-white text-[14px] font-[Inter-Regular] text-[#23262A]"
                                >
                                    <UploadLinkIcon className="h-[18px] w-[18px]" fill="#DC0000" />
                                    <span>
                                        <span className="font-[Inter-SemiBold] text-[#DC0000] underline">Add file</span>
                                        {' '}or drop files here
                                    </span>
                                </button>

                                {attachments.length > 0 ? (
                                    <div className="mt-[10px] space-y-[6px]">
                                        {attachments.map((f, idx) => (
                                            <div key={`${f.name}-${idx}`} className="flex items-center gap-[10px] text-[12px]">
                                                <p className="truncate font-[Inter-Regular] text-[#666]">{f.name}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                                                    className="cursor-pointer"
                                                >
                                                    <CloseIcon className="h-[6px] w-[6px]" fill="#8f8f8f" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="mt-[26px] w-full cursor-pointer rounded-[2px] bg-[#DC0000] py-[10px] text-[16px] font-[Inter-Bold] text-white transition hover:bg-[#c10000] disabled:opacity-60"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit'}
                            </button>
                        </form>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

export default VerifiedBusinessModal
