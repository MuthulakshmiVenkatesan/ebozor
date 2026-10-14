'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { loadStripe } from '@stripe/stripe-js'
import { CardElement, Elements, ElementsConsumer } from '@stripe/react-stripe-js'
import toast from 'react-hot-toast'
import { CloseIcon } from '@/components/CustomFile/icons'
import { createPaymentIntentApi, getPackageSettingsApi } from '@/utils/api'
import logo from '../../../../../public/assets/img/logo.png'
import stripeIcon from '../../../../../public/assets/ic_stripe.png'

function StripeForm({ stripePromise, clientSecret, total, onSuccess, onFailure, isPaying, setIsPaying }) {
    const handleSubmit = async (event, stripe, elements) => {
        event.preventDefault()
        if (!stripe || !elements || !clientSecret) return

        try {
            setIsPaying(true)
            const cardElement = elements.getElement(CardElement)
            if (!cardElement) return

            const { error, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
            })

            if (error) {
                toast.error(error.message || 'Unable to create payment method')
                onFailure?.()
                return
            }

            const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: paymentMethod.id,
            })

            if (confirmError) {
                toast.error(confirmError.message || 'Payment failed')
                onFailure?.()
                return
            }

            if (paymentIntent?.status === 'succeeded') {
                onSuccess?.(paymentIntent)
                return
            }

            toast.error(`Payment status: ${paymentIntent?.status || 'failed'}`)
            onFailure?.()
        } finally {
            setIsPaying(false)
        }
    }

    return (
        <div className="p-[18px_24px]">
            <p className="mb-[14px] text-[14px] font-[Inter-Medium] text-[#23262A]">Pay securely with Stripe</p>
            <Elements stripe={stripePromise}>
                <ElementsConsumer>
                    {({ stripe, elements }) => (
                        <form onSubmit={(event) => handleSubmit(event, stripe, elements)}>
                            <div className="rounded-[8px] border border-[rgba(143,143,143,0.35)] p-[14px]">
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
                            <button
                                type="submit"
                                disabled={!stripePromise || !clientSecret || isPaying}
                                className={`mt-[18px] w-full rounded-[8px] py-[12px] text-[14px] font-[Inter-SemiBold] ${
                                    !stripePromise || !clientSecret || isPaying
                                        ? 'cursor-not-allowed bg-[#E8EAEC] text-[#8f8f8f]'
                                        : 'cursor-pointer bg-[#10B910] text-white'
                                }`}
                            >
                                {isPaying ? 'Processing...' : `Pay AED ${Number(total || 0).toLocaleString('en-AE')}`}
                            </button>
                        </form>
                    )}
                </ElementsConsumer>
            </Elements>
        </div>
    )
}

export default function PaymentCardModal({
    open,
    total,
    paymentPayload,
    onClose,
    onPay,
    onPaymentFailed,
}) {
    const [packageSettings, setPackageSettings] = useState({})
    const [stripePromise, setStripePromise] = useState(null)
    const [clientSecret, setClientSecret] = useState('')
    const [selectedMethod, setSelectedMethod] = useState('')
    const [isLoadingSettings, setIsLoadingSettings] = useState(false)
    const [isPaying, setIsPaying] = useState(false)

    const enabledMethods = useMemo(() => {
        const methodEntries = Object.entries(packageSettings || {}).filter(([, config]) => config?.status === 1)
        return methodEntries.map(([key, config]) => ({
            key,
            label: config?.payment_method || key,
            config,
        }))
    }, [packageSettings])

    const stripeConfig = packageSettings?.Stripe

    useEffect(() => {
        if (!open) return

        let cancelled = false
        const fetchSettings = async () => {
            try {
                setIsLoadingSettings(true)
                const res = await getPackageSettingsApi.getPackageSettings()
                if (cancelled) return

                const data = res?.data?.data || {}
                setPackageSettings(data)

                const enabled = Object.entries(data).filter(([, config]) => config?.status === 1)
                const stripeEnabled = enabled.find(([key]) => key === 'Stripe')
                setSelectedMethod(stripeEnabled ? 'Stripe' : (enabled[0]?.[0] || ''))

                if (data?.Stripe?.api_key) {
                    const stripeInstance = await loadStripe(data.Stripe.api_key)
                    if (!cancelled) setStripePromise(stripeInstance)
                }
            } catch (error) {
                if (!cancelled) {
                    toast.error('Unable to load payment settings')
                }
            } finally {
                if (!cancelled) setIsLoadingSettings(false)
            }
        }

        fetchSettings()
        return () => {
            cancelled = true
        }
    }, [open])

    if (!open) return null

    const handleStripeIntent = async () => {
        if (!stripeConfig?.payment_method) {
            toast.error('Stripe is not enabled')
            return
        }

        if (!paymentPayload?.itemId) {
            toast.error('Missing listing id. Please go back and post the ad again.')
            return
        }

        try {
            setIsPaying(true)
            const res = await createPaymentIntentApi.createIntent({
                basePackageRecordId: paymentPayload?.basePackageRecordId,
                selectedAddonPackageIds: paymentPayload?.selectedAddonPackageIds,
                item_id: paymentPayload?.itemId,
                payment_method: stripeConfig.payment_method,
            })

            if (res?.data?.error) {
                toast.error(res.data.message || 'Unable to start payment')
                return
            }

            const paymentIntent = res?.data?.data?.payment_intent?.payment_gateway_response
            const nextClientSecret = paymentIntent?.client_secret
            if (!nextClientSecret) {
                toast.error('Stripe payment could not be initialized')
                return
            }

            setClientSecret(nextClientSecret)
        } catch (error) {
            toast.error('Unable to start Stripe payment')
        } finally {
            setIsPaying(false)
        }
    }

    const handlePaymentSucceeded = async (paymentIntent) => {
        try {
            setIsPaying(true)
            if (paymentIntent?.id) {
                const confirmRes = await createPaymentIntentApi.confirmIntent({
                    payment_intent_id: paymentIntent.id,
                    item_id: paymentPayload?.itemId,
                })
                if (confirmRes?.data?.error) {
                    toast.error(confirmRes.data.message || 'Payment succeeded but listing status was not updated')
                }
            }
            onPay?.({ paymentIntentId: paymentIntent?.id, paymentMethod: 'Stripe' })
            onClose?.()
        } catch (error) {
            toast.error('Payment succeeded but listing status was not updated')
            onPay?.({ paymentIntentId: paymentIntent?.id, paymentMethod: 'Stripe' })
            onClose?.()
        } finally {
            setIsPaying(false)
        }
    }

    return (
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

                {clientSecret && selectedMethod === 'Stripe' ? (
                    <StripeForm
                        stripePromise={stripePromise}
                        clientSecret={clientSecret}
                        total={total}
                        isPaying={isPaying}
                        setIsPaying={setIsPaying}
                        onFailure={onPaymentFailed}
                        onSuccess={handlePaymentSucceeded}
                    />
                ) : (
                    <div className="p-[18px_24px]">
                        <p className="mb-[14px] text-[14px] font-[Inter-Medium] text-[#23262A]">Select payment method</p>
                        {isLoadingSettings ? (
                            <p className="text-[14px] font-[Inter-Regular] text-[#626465]">Loading payment methods...</p>
                        ) : enabledMethods.length === 0 ? (
                            <p className="text-[14px] font-[Inter-Regular] text-[#DC0000]">No payment methods are enabled.</p>
                        ) : (
                            <div className="flex flex-col gap-[10px]">
                                {enabledMethods.map((method) => {
                                    const isStripe = method.key === 'Stripe'
                                    const isSupported = isStripe
                                    return (
                                        <button
                                            key={method.key}
                                            type="button"
                                            disabled={!isSupported || isPaying}
                                            onClick={() => {
                                                setSelectedMethod(method.key)
                                                if (isStripe) {
                                                    handleStripeIntent()
                                                } else {
                                                    toast('This payment method will be enabled in this flow soon.')
                                                }
                                            }}
                                            className={`flex items-center justify-between rounded-[8px] border p-[12px_14px] text-left ${
                                                isSupported ? 'border-[rgba(143,143,143,0.35)] bg-white' : 'cursor-not-allowed border-[#E8EAEC] bg-[#F7F7F8]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-[10px]">
                                                {isStripe ? <Image src={stripeIcon} alt="Stripe" width={28} height={28} /> : null}
                                                <span className="text-[14px] font-[Inter-Medium] text-[#23262A]">{method.label}</span>
                                            </div>
                                            {!isSupported ? (
                                                <span className="text-[12px] font-[Inter-Regular] text-[#8f8f8f]">Soon</span>
                                            ) : null}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

