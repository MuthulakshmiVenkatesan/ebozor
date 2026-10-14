'use client'

import React, { useEffect } from 'react'
import { CloseIcon } from '@/components/CustomFile/icons'
import Image from 'next/image'
import validatecheck from '../../../../../public/assets/img/icons/validatecheck.svg'

const SuccessModal = ({ onClose }) => {
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose()
            }
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [onClose])

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(17,24,39,0.55)]"
            onClick={onClose}
            role="presentation"
        >
            <div
                className="relative w-full max-w-[440px] rounded-[8px] bg-white p-[120px_20px] text-center shadow-[0_8px_32px_rgba(17,24,39,0.12)] max-sm:p-[20px]"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="success-modal-title"
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close modal"
                    className="absolute right-[-10px] top-[-10px] flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-full bg-black text-white"
                >
                    <CloseIcon className="h-[10px] w-[10px]" fill="#fff" fillOpacity="1" />
                </button>

                <div className="mx-auto mb-[20px] flex  items-center justify-center ">
                    <Image src={validatecheck} alt="validatecheck" width={60} height={60} className="h-[60px] w-[60px]" />
                </div>

                <h2 id="success-modal-title" className="mb-[14px] text-[24px] leading-[1.2] font-[Inter-Bold] text-[#222]">
                    Thank you!
                </h2>
                <p className="text-[16px] leading-[1.55] font-[Inter-Regular] text-[#222]">
                    You have successfully generated a callback request. Our team will contact you within 24 hours to walk you through the next steps!
                </p>
            </div>
        </div>
    )
}

export default SuccessModal
