'use client'

import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { CloseIcon } from '@/components/CustomFile/icons'
import logo from '../../../../../public/assets/img/logo.png'

export default function PaymentCardModal({ open, total, packageId, onClose, onPay, onPaymentFailed }) {
    const stripe = useStripe()
    const elements = useElements()
    const [nameOnCard, setNameOnCard] = useState('')
    const [saveCard, setSaveCard] = useState(true)
    const [isProcessing, setIsProcessing] = useState(false)

    const canPay = useMemo(() => {
        return (
            String(nameOnCard).trim().length > 0 &&
            Boolean(stripe) &&
            Boolean(elements) &&
            !isProcessing
        )
    }, [nameOnCard, stripe, elements, isProcessing])

    if (!open) return null

    return (
        <>
            <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-[rgba(0,0,0,0.45)] p-[16px]">
                <div className="w-[400px] max-sm:w-full rounded-[8px] bg-white">
                <div className="flex items-center justify-between border-b border-[rgba(143,143,143,0.35)] p-[0px_20px]">
                    <div className='w-full'>
                        <Image src={logo} alt='logo' width={100} height={60} className='h-[60px] w-auto' />
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer"
                        aria-label="Close payment modal"
                    >
                        <CloseIcon className='w-[14px] h-[14px]' />
                    </button>
                </div>

                <div className="p-[18px_24px]">
                    <div className="mb-[20px]">
                        <label className="mb-[6px] text-[14px] leading-none font-[Inter-Medium] text-[#23262A]">Name on Card</label>
                        <input
                            type="text"
                            value={nameOnCard}
                            onChange={(e) => setNameOnCard(e.target.value)}
                            placeholder="Name"
                            className="h-[44px] w-full border-0 border-b border-[rgba(143,143,143,0.6)] bg-transparent p-0 text-[16px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#8f8f8f] focus:border-b-[#23262A]"
                        />
                    </div>

                    <div className="mb-[20px]">
                        <label className="mb-[6px] text-[14px] leading-none font-[Inter-Medium] text-[#23262A]">Card Details</label>
                        <div className="h-[44px] w-full border-0 border-b border-[rgba(143,143,143,0.6)] bg-transparent p-0 pt-[10px] text-[16px] font-[Inter-Regular] text-[#23262A] outline-none focus-within:border-b-[#23262A]">
                            <CardElement
                                options={{
                                    hidePostalCode: true,
                                    disableLink: true,
                                    style: {
                                        base: {
                                            fontSize: '16px',
                                            color: '#23262A',
                                            '::placeholder': { color: '#8f8f8f' },
                                        },
                                        invalid: {
                                            color: '#DC0000',
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-[12px]">
                        <label className="flex items-center gap-[8px]">
                            <input
                                type="checkbox"
                                checked={saveCard}
                                onChange={(e) => setSaveCard(e.target.checked)}
                                className="h-[20px] w-[20px] cursor-pointer accent-[#23262A]"
                            />
                            <span className="text-[14px] font-[Inter-Regular] text-[#23262A]">Save my card</span>
                        </label>

                        <button
                            type="button"
                            disabled={!canPay}
                            onClick={async () => {
                                const cardElement = elements?.getElement(CardElement)
                                if (!cardElement) return
                                try {
                                    setIsProcessing(true)
                                    const ok = await onPay?.({ nameOnCard, saveCard, packageId, stripe, elements, cardElement })
                                    if (ok) onClose?.()
                                    else onPaymentFailed?.()
                                } finally {
                                    setIsProcessing(false)
                                }
                            }}
                            className={`rounded-[8px] p-[14px_30px] text-[14px] font-[Inter-SemiBold] ${canPay ? 'cursor-pointer bg-[#10B910] text-white' : 'cursor-not-allowed bg-[#E8EAEC] text-[#8f8f8f]'
                                }`}
                        >
                            {isProcessing ? 'Processing...' : `Pay - AED ${Number(total || 0).toLocaleString('en-AE')}`}
                        </button>
                    </div>
                </div>
            </div>
            </div>
        </>
    )
}

