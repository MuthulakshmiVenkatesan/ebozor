'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { CategoryIcon } from '@/components/CustomFile/icons'
import { useSelector } from 'react-redux'
import logo from '../../../../public/assets/img/logo.png'
import tabby from '../../../../public/assets/img/car/tabby.svg'
import whatsappwhite from '../../../../public/assets/img/icons/whatsappwhite.svg'
import refundtick from '../../../../public/assets/img/icons/refundtick.svg'
import tick from '../../../../public/assets/img/icons/tick.svg'
import redcross from '../../../../public/assets/img/icons/redcross.svg'
import paypal from '../../../../public/assets/img/payment/paypal.svg'
import visa from '../../../../public/assets/img/payment/visa.svg'
import fees from '../../../../public/assets/img/inspectionpackage/fees.svg'
import anycard from '../../../../public/assets/img/inspectionpackage/anycard.svg'
import buyer from '../../../../public/assets/img/inspectionpackage/buyer.svg'
import PaymentCardModal from './components/PaymentCardModal'
import PaymentFailedPage from './components/PaymentFailedPage'
import PaymentSuccessPage from './components/PaymentSuccessPage'
import { carInspectionApi, createPaymentIntentApi, getPackageApi, getPackageSettingsApi, getUserDetailApi, paymentTransactionApi } from '@/utils/api'
import { userSignUpData } from '@/redux/reuducer/authSlice'

const INCEPTION_BOOKING_STORAGE_KEY = 'inception_booking_payload'

const STATIC_PACKAGE_OPTIONS = [
    {
        id: 'advanced',
        name: 'Advanced',
        subtitle: '240-point Comprehensive Inspection',
        price: 569,
        installment: 'Pay in 4 payments of AED 149.36 with',
        recommended: true,
        features: [
            { label: 'Doorstep Inspection', included: true },
            { label: 'Exterior & Body', included: true },
            { label: 'Engine & Transmission', included: true },
            { label: 'Brakes & Suspension', included: true },
            { label: 'Electrical Systems & Controls', included: true },
            { label: 'Rims & Tyres Condition', included: true },
            { label: 'Road Test', included: true },
            { label: 'Chassis Condition', included: true },
            { label: 'Computerized Diagnostic Scan', included: true },
            { label: 'Accident History Check', included: true },
            { label: 'Under Body Examination', included: true },
        ],
    },
    {
        id: 'standard',
        name: 'Standard',
        subtitle: '120-point inspection',
        price: 369,
        installment: 'Pay in 4 payments of AED 96.86 with',
        recommended: false,
        features: [
            { label: 'Doorstep Inspection', included: true },
            { label: 'Exterior & Body', included: true },
            { label: 'Engine & Transmission', included: true },
            { label: 'Brakes & Suspension', included: true },
            { label: 'Electrical Systems & Controls', included: true },
            { label: 'Rims & Tyres Condition', included: true },
            { label: 'Road Test', included: true },
            { label: 'Chassis Condition', included: false },
            { label: 'Computerized Diagnostic Scan', included: false },
            { label: 'Accident History Check', included: false },
            { label: 'Under Body Examination', included: false },
        ],
    },
]

function parseApiPayload(payload) {
    if (typeof payload !== 'string') return payload || {}
    const debugAssetIndex = payload.indexOf('<link')
    const scriptIndex = payload.indexOf('<script')
    let cutIndex = -1
    if (debugAssetIndex >= 0 && scriptIndex >= 0) cutIndex = Math.min(debugAssetIndex, scriptIndex)
    else if (debugAssetIndex >= 0) cutIndex = debugAssetIndex
    else if (scriptIndex >= 0) cutIndex = scriptIndex
    const jsonText = cutIndex >= 0 ? payload.slice(0, cutIndex) : payload
    try {
        return JSON.parse(jsonText)
    } catch {
        return {}
    }
}

function formatCurrency(value) {
    return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export default function InceptionPackage() {
    const router = useRouter()
    const userData = useSelector(userSignUpData)
    const [packageOptions, setPackageOptions] = useState(STATIC_PACKAGE_OPTIONS)
    const [packageLoading, setPackageLoading] = useState(true)
    const [selectedPackageId, setSelectedPackageId] = useState(STATIC_PACKAGE_OPTIONS[0].id)
    const [reportEmail, setReportEmail] = useState('')
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card')
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
    const [stripePublishableKey, setStripePublishableKey] = useState('')
    const [apiPackages, setApiPackages] = useState([])
    const [bookingPayload, setBookingPayload] = useState({ user_number: '', seller_number: '' })
    const [paymentResultPage, setPaymentResultPage] = useState('idle')

    useEffect(() => {
        let cancelled = false
        const run = async () => {
            try {
                setPackageLoading(true)
                const response = await getPackageApi.getPackage()
                const parsed = parseApiPayload(response?.data)
                const rows = Array.isArray(parsed?.data) ? parsed.data : []
                if (!cancelled) setApiPackages(rows)
                const byName = new Map(rows.map((row) => [String(row?.name || '').trim().toLowerCase(), row]))
                const merged = STATIC_PACKAGE_OPTIONS.map((pkg) => {
                    const matched = byName.get(String(pkg.name || '').trim().toLowerCase())
                    const fallbackByIndex = rows[STATIC_PACKAGE_OPTIONS.findIndex((staticPkg) => staticPkg.id === pkg.id)] || null
                    const source = matched || fallbackByIndex
                    if (!source) {
                        return {
                            ...pkg,
                            apiPackageId: null,
                        }
                    }
                    return {
                        ...pkg,
                        apiPackageId: source?.id ?? null,
                        price: Number(source?.final_price ?? source?.price ?? pkg.price),
                        subtitle: source?.item_limit ? `${source.item_limit}-point inspection` : pkg.subtitle,
                    }
                })
                if (!cancelled) setPackageOptions(merged)
            } catch {
                if (!cancelled) setApiPackages([])
                if (!cancelled) setPackageOptions(STATIC_PACKAGE_OPTIONS)
            } finally {
                if (!cancelled) setPackageLoading(false)
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        try {
            const raw = window.localStorage.getItem(INCEPTION_BOOKING_STORAGE_KEY)
            if (!raw) return
            const parsed = JSON.parse(raw)
            setBookingPayload({
                user_number: String(parsed?.user_number || '').trim(),
                seller_number: String(parsed?.seller_number || '').trim(),
            })
        } catch {
            setBookingPayload({ user_number: '', seller_number: '' })
        }
    }, [])

    useEffect(() => {
        if (!packageOptions.some((pkg) => pkg.id === selectedPackageId)) {
            setSelectedPackageId(packageOptions[0]?.id || STATIC_PACKAGE_OPTIONS[0].id)
        }
    }, [packageOptions, selectedPackageId])

    useEffect(() => {
        let cancelled = false
        const fromStore =
            String(userData?.email || '').trim() ||
            String(userData?.data?.email || '').trim() ||
            String(userData?.user?.email || '').trim()
        if (fromStore) {
            setReportEmail(fromStore)
            return
        }

        const run = async () => {
            const userId = userData?.id ?? userData?.data?.id ?? userData?.user?.id ?? null
            if (!userId) return
            try {
                const response = await getUserDetailApi.getUserDetail({ user_id: userId })
                const parsed = parseApiPayload(response?.data)
                const row = parsed?.data && typeof parsed.data === 'object' ? parsed.data : {}
                const email = String(row?.email || '').trim()
                if (!cancelled && email) setReportEmail(email)
            } catch {
                // keep current value
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [userData?.id, userData?.data?.id, userData?.user?.id, userData?.email, userData?.data?.email, userData?.user?.email])

    useEffect(() => {
        let cancelled = false
        const run = async () => {
            try {
                const response = await getPackageSettingsApi.getPackageSettings()
                const parsed = parseApiPayload(response?.data)
                const stripeKey = String(parsed?.data?.Stripe?.api_key || '').trim()
                if (!cancelled && stripeKey) {
                    setStripePublishableKey(stripeKey)
                    return
                }
            } catch {
                // fallback below
            }

            const fallbackKey = String(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '').trim()
            if (!cancelled && fallbackKey) setStripePublishableKey(fallbackKey)
        }
        run()
        return () => {
            cancelled = true
        }
    }, [])

    const selectedPackage = useMemo(
        () => packageOptions.find((pkg) => pkg.id === selectedPackageId) || packageOptions[0] || STATIC_PACKAGE_OPTIONS[0],
        [selectedPackageId, packageOptions]
    )
    const selectedPackageApiId = useMemo(() => {
        const fromMappedOption = packageOptions.find((pkg) => pkg.id === selectedPackageId)?.apiPackageId
        if (fromMappedOption) return fromMappedOption
        const fromName = apiPackages.find(
            (row) => String(row?.name || '').trim().toLowerCase() === String(selectedPackage?.name || '').trim().toLowerCase()
        )?.id
        if (fromName) return fromName
        return null
    }, [packageOptions, selectedPackageId, selectedPackage?.name, apiPackages])
    const stripePromise = useMemo(() => (stripePublishableKey ? loadStripe(stripePublishableKey) : null), [stripePublishableKey])

    const vatAmount = useMemo(() => Number((selectedPackage.price * 0.05).toFixed(2)), [selectedPackage.price])
    const totalAmount = useMemo(() => Number((selectedPackage.price + vatAmount).toFixed(2)), [selectedPackage.price, vatAmount])

    const handleCardPay = async ({ nameOnCard, stripe, cardElement, packageId }) => {
        if (!stripe || !cardElement) {
            toast.error('Card payment is not ready yet. Please try again.')
            return false
        }
        if (!packageId) {
            toast.error('Selected package is not available for online payment.')
            return false
        }

        try {
            setIsSubmittingPayment(true)
            const response = await createPaymentIntentApi.createIntent({
                package_id: packageId,
                payment_method: 'Stripe',
            })

            if (response?.data?.error) {
                toast.error(response?.data?.message || 'Unable to initialize payment.')
                return false
            }

            const paymentIntentData = response?.data?.data?.payment_intent || {}
            const paymentGatewayResponse = paymentIntentData?.payment_gateway_response || paymentIntentData
            const clientSecret = paymentGatewayResponse?.client_secret

            if (!clientSecret) {
                toast.error('Unable to initialize card payment. Please try again.')
                return false
            }

            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: String(nameOnCard || '').trim() || 'Customer',
                        email: String(reportEmail || '').trim() || undefined,
                    },
                },
            })

            if (error) {
                toast.error(error?.message || 'Payment failed. Please try again.')
                setPaymentResultPage('failed')
                return false
            }

            if (paymentIntent?.status === 'succeeded') {
                try {
                    await paymentTransactionApi.transaction()
                } catch {
                    // do not block successful checkout UX
                }
                const currentUserId = userData?.id ?? userData?.data?.id ?? userData?.user?.id ?? null
                const payload = {
                    user_id: currentUserId,
                    user_number: bookingPayload.user_number,
                    seller_number: bookingPayload.seller_number,
                    package_id: packageId,
                    price: selectedPackage.price,
                    email: String(reportEmail || '').trim(),
                    payment_type: 'Stripe',
                    payment_status: 'success',
                }
                try {
                    await carInspectionApi.createInspection(payload)
                } catch {
                    toast.error('Payment succeeded but inspection booking sync failed. Please contact support.')
                }
                toast.success('Payment successful.')
                setIsPaymentModalOpen(false)
                setPaymentResultPage('success')
                return true
            }

            toast.error(`Payment status: ${paymentIntent?.status || 'failed'}`)
            setPaymentResultPage('failed')
            return false
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error processing payment.')
            setPaymentResultPage('failed')
            return false
        } finally {
            setIsSubmittingPayment(false)
        }
    }

    if (paymentResultPage === 'failed') {
        return (
            <PaymentFailedPage
                onTryAgain={() => {
                    setPaymentResultPage('idle')
                    router.replace('/inceptionpackage')
                }}
            />
        )
    }

    if (paymentResultPage === 'success') {
        return (
            <PaymentSuccessPage
                onContinue={() => {
                    setPaymentResultPage('idle')
                    router.replace('/')
                }}
            />
        )
    }

    return (
        <div className="">
            <div className='w-full p-[0px_20px] shadow-[0_2px_8px_0px_rgba(0,0,0,0.1)] flex items-center justify-start'>
                <Link href="/inception" className='rotate-180'>
                    <CategoryIcon className="w-[18px] h-[18px]" fill="#23262A" />
                </Link>
                <Link href="/" className='flex items-center justify-center mx-auto'>
                    <div className='w-full flex items-center justify-center'>
                        <Image src={logo} alt='logo' width={100} height={80} className='h-12 md:h-[80px] w-auto' />
                    </div>
                </Link>
            </div>

            <div className="mx-auto max-w-[1170px] max-sm:max-w-full max-sm:px-[15px] py-[50px] common_container ">

                <div className="mb-[24px]">
                    <h1 className="text-[20px] leading-none font-[Inter-SemiBold] text-[#23262A] mb-[6px]">Select a Package</h1>
                    <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                        Choose the inspection type of your choice
                    </p>
                </div>

                <div className="grid grid-cols-[1fr_400px] gap-[24px] max-sm:grid-cols-1 inspectionpackage_grid">
                    <div>
                        <div className='grid grid-cols-2 gap-[12px] max-sm:grid-cols-1 mb-[24px] border-b border-[rgba(143,143,143,0.22)] pb-[24px]'>
                            {packageLoading
                                ? [0, 1].map((idx) => (
                                    <div
                                        key={`package-skeleton-${idx}`}
                                        className="rounded-[6px] border border-[#e0e1e3] bg-white p-[20px] [box-shadow:0px_4px_8px_-2px_rgba(0,0,0,0.02),0px_3px_8px_rgba(0,0,0,0.02),0px_1px_10px_rgba(0,0,0,0.04)]"
                                    >
                                        <div className="mb-[16px] h-[20px] w-[140px] animate-pulse rounded-[6px] bg-[#ECECEC]" />
                                        <div className="mb-[12px] h-[16px] w-[180px] animate-pulse rounded-[6px] bg-[#ECECEC]" />
                                        <div className="mb-[16px] h-[28px] w-[160px] animate-pulse rounded-[6px] bg-[#ECECEC]" />
                                        <div className="mb-[16px] h-[14px] w-[220px] animate-pulse rounded-[6px] bg-[#ECECEC]" />
                                        <div className="space-y-[12px]">
                                            {Array.from({ length: 6 }).map((_, row) => (
                                                <div key={row} className="h-[14px] w-[85%] animate-pulse rounded-[6px] bg-[#ECECEC]" />
                                            ))}
                                        </div>
                                    </div>
                                ))
                                : packageOptions.map((pkg) => {
                                const isSelected = selectedPackageId === pkg.id
                                return (
                                    <button
                                        key={pkg.id}
                                        type="button"
                                        onClick={() => setSelectedPackageId(pkg.id)}
                                        className={`cursor-pointer rounded-[6px] border p-[20px] text-left [box-shadow:0px_4px_8px_-2px_rgba(0,0,0,0.02),0px_3px_8px_rgba(0,0,0,0.02),0px_1px_10px_rgba(0,0,0,0.04)] transition ${isSelected
                                            ? 'border-[#f5aaaa] bg-[linear-gradient(2.46deg,_rgba(255,255,255,0.6)_39.06%,_rgba(255,204,204,0.6)_143.88%),linear-gradient(0deg,_#ffffff,_#ffffff)]'
                                            : 'bg-white border-[#e0e1e3]'
                                            }`}
                                    >
                                        <div className="mb-[16px] flex items-center justify-between gap-[8px]">
                                            <div>
                                                <div className="flex items-center gap-[8px]">
                                                    <h2 className="mb-[4px] text-[16px] leading-none font-[Inter-SemiBold] text-[#23262A]">{pkg.name}</h2>
                                                    {pkg.recommended ? (
                                                        <span className="rounded-full bg-[#000] p-[2px_6px] text-[10px] font-[Inter-SemiBold] uppercase text-white">
                                                            Recommended
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{pkg.subtitle}</p>
                                            </div>
                                            <div
                                                className={`relative h-[18px] w-[18px] rounded-full border-2 ${isSelected ? 'border-[#23262A]' : 'border-[#23262A]'
                                                    }`}
                                            >
                                                {isSelected ? (
                                                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 block h-[10px] w-[10px] rounded-full bg-[#23262A]" />
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="mb-[16px] flex items-center justify-between">
                                            <h3 className="text-[18px] leading-none font-[Inter-SemiBold] text-[#23262A]">
                                                AED <span className="text-[24px] font-[Inter-Bold]">{formatCurrency(pkg.price)}</span>
                                            </h3>
                                            <div className="inline-flex items-center gap-[8px]">
                                                <Image src={refundtick} alt="refundtick" width={24} height={24} className="h-[24px] w-[24px]" />
                                                <p className="text-[14px] font-[Inter-SemiBold] text-[#2e7d32]">
                                                    100% Refund Policy
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mb-[16px] flex items-center gap-[4px] border-b border-t border-[rgba(143,143,143,0.18)] py-[8px]">
                                            <p className="text-[14px] italic font-[Inter-Regular] text-[#23262A]">{pkg.installment}</p>
                                            <Image src={tabby} alt="tabby" width={66} height={22} className="h-[22px] w-[66px] object-contain" />
                                        </div>

                                        <ul className="flex flex-col gap-[12px]">
                                            {pkg.features.map((feature) => (
                                                <li key={feature.label} className="flex items-center gap-[10px]">
                                                    <div
                                                        className={`inline-flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full  ${feature.included ? 'bg-[#c2e4c3]' : 'bg-[#f7f7f8]'
                                                            }`}
                                                    >
                                                        {feature.included ? <Image src={tick} alt="tick" width={12} height={12} className="h-[12px] w-[12px]" /> : <Image src={redcross} alt="redcross" width={12} height={12} className="h-[12px] w-[12px]" />}
                                                    </div>
                                                    <p
                                                        className={`text-[14px] font-[Inter-Regular] text-[#23262A]  ${feature.included ? '' : 'line-through'
                                                            }`}
                                                    >
                                                        {feature.label}
                                                    </p>
                                                </li>
                                            ))}
                                        </ul>
                                    </button>
                                )
                            })}
                        </div>
                        <div className="">
                            <div className="mb-[20px]">
                                <h3 className="mb-[20px] text-[14px] font-[Inter-SemiBold] leading-none text-[#23262A] max-sm:text-[18px]">
                                    Please provide your email to receive the Inspection Report
                                </h3>
                                <input
                                    type="email"
                                    value={reportEmail}
                                    onChange={(e) => setReportEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="h-[54px] w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white px-[12px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                />
                            </div>

                            <div>
                                <h3 className="mb-[20px] text-[14px] font-[Inter-SemiBold] leading-none text-[#23262A]">
                                    Select a Payment Method
                                </h3>

                                <button
                                    type="button"
                                    onClick={() => setSelectedPaymentMethod('card')}
                                    className="mb-[12px] flex w-full cursor-pointer items-center justify-between rounded-[8px] border border-[#23262A] bg-white p-[24px]"
                                >
                                    <div className="flex items-center gap-[12px]">
                                        <div
                                            className={`relative h-[20px] w-[20px] rounded-full border-2 ${selectedPaymentMethod === 'card' ? 'border-[#DC0000]' : 'border-[#23262A]'
                                                }`}
                                        >
                                            {selectedPaymentMethod === 'card' ? (
                                                <span className="absolute left-1/2 top-1/2 h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#DC0000]" />
                                            ) : null}
                                        </div>
                                        <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">Credit Card</p>
                                    </div>
                                    <div className="flex items-center gap-[6px]">
                                        <Image src={visa} alt="visa" width={34} height={18} className="h-[18px] w-[34px] object-contain" />
                                        <Image src={paypal} alt="paypal" width={34} height={18} className="h-[18px] w-[34px] object-contain" />
                                    </div>
                                </button>

                                <div
                                    className={`hidden overflow-hidden rounded-[8px] border p-[24px] ${selectedPaymentMethod === 'tabby' ? 'border-[#23262A]' : 'border-[rgba(143,143,143,0.45)]'
                                        }`}
                                >
                                    {/* <button
                                        type="button"
                                        onClick={() => setSelectedPaymentMethod('tabby')}
                                        className="flex w-full cursor-pointer items-center justify-between bg-white "
                                    >
                                        <div className="flex items-center gap-[12px]">
                                            <div
                                                className={`relative h-[20px] w-[20px] rounded-full border-2 ${selectedPaymentMethod === 'tabby' ? 'border-[#DC0000]' : 'border-[#23262A]'
                                                    }`}
                                            >
                                                {selectedPaymentMethod === 'tabby' ? (
                                                    <span className="absolute left-1/2 top-1/2 h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#DC0000]" />
                                                ) : null}
                                            </div>
                                            <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">
                                                4 payments of AED 149.36 each*
                                            </p>
                                        </div>
                                        <Image src={tabby} alt="tabby" width={66} height={22} className="h-[22px] w-[66px] object-contain" />
                                    </button> */}

                                    {selectedPaymentMethod === 'tabby' ? (
                                        <div className="mt-[24px] border-t border-[rgba(143,143,143,0.25)] bg-white py-[16px]">
                                            <p className="mb-[26px] text-[14px] font-[Inter-Regular] text-[#23262A]">
                                                Pay in 4 payments. No interest charges.
                                            </p>
                                            <div className="grid grid-cols-[190px_1fr] gap-[16px] max-sm:grid-cols-1 px-[20px]">
                                                <div>
                                                    <Image src={tabby} alt="tabby" width={56} height={20} className="mb-[6px] h-[20px] w-[56px] object-contain" />
                                                    <p className="mb-[6px] text-[16px] leading-[1.05] font-[Inter-Bold] text-[#23262A]">
                                                        Split your purchase
                                                    </p>
                                                    <p className="mb-[10px] text-[14px] leading-[1.1] font-[Inter-Regular] text-[#23262A]">
                                                        into monthly payments
                                                    </p>
                                                    <button
                                                        type="button"
                                                        className="cursor-pointer rounded-full bg-[#e9eff5] p-[2px_6px] text-[12px] font-[Inter-Regular] text-[#23262A]"
                                                    >
                                                        View options
                                                    </button>
                                                </div>
                                                <div className="flex flex-col gap-[10px] pt-[4px]">
                                                    <div className="flex items-center gap-[8px]">
                                                        <div className="inline-flex p-[4px] items-center justify-center rounded-full bg-[#edfaf1]">
                                                            <Image src={fees} alt="fees" width={16} height={16} className="h-[16px] w-[16px]" />
                                                        </div>
                                                        <p className="text-[12px] font-[Inter-Regular] text-[#23262A]">No processing fees</p>
                                                    </div>
                                                    <div className="flex items-center gap-[8px]">
                                                        <div className="inline-flex p-[4px] items-center justify-center rounded-full bg-[#edfaf1]">
                                                            <Image src={anycard} alt="anycard" width={16} height={16} className="h-[16px] w-[16px]" />
                                                        </div>
                                                        <p className="text-[12px] font-[Inter-Regular] text-[#23262A]">Use any card</p>
                                                    </div>
                                                    <div className="flex items-center gap-[8px]">
                                                        <div className="inline-flex p-[4px] items-center justify-center rounded-full bg-[#edfaf1]">
                                                            <Image src={buyer} alt="buyer" width={16} height={16} className="h-[16px] w-[16px]" />
                                                        </div>
                                                        <p className="text-[12px] font-[Inter-Regular] text-[#23262A]">Buyer protection</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-fit cursor-pointer rounded-[6px] border text-left [box-shadow:0px_4px_8px_-2px_rgba(0,0,0,0.02),0px_3px_8px_rgba(0,0,0,0.02),0px_1px_10px_rgba(0,0,0,0.04)] border-[#e0e1e3]">
                        <h2 className="border-b border-[rgba(143,143,143,0.18)] p-[24px_20px] text-[20px] leading-none font-[Inter-Bold] text-[#23262A] ">
                            Order Summary
                        </h2>
                        <div className="p-[20px]">
                            <div className="flex items-center justify-between gap-[8px] border-b border-[rgba(143,143,143,0.18)] pb-[24px]">
                                <h4 className="text-[14px] font-[Inter-Regular] text-[#23262A]">{selectedPackage.name} Inspection</h4>
                                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">AED {formatCurrency(selectedPackage.price)}</p>
                            </div>
                            <div className='py-[20px] flex flex-col gap-[12px] border-b border-[rgba(143,143,143,0.18)] '>
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[14px] font-[Inter-Regular] text-[#23262A]">Subtotal</h4>
                                    <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">AED {formatCurrency(selectedPackage.price)}</p>
                                </div>
                                <div className="flex items-center justify-between ">
                                    <h4 className="text-[14px] font-[Inter-Regular] text-[#23262A]">VAT 5%</h4>
                                    <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">AED {formatCurrency(vatAmount)}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between py-[20px]">
                                <h4 className="text-[14px] font-[Inter-Bold] text-[#23262A]">Total</h4>
                                <p className="text-[14px] font-[Inter-Bold] text-[#23262A]">AED {formatCurrency(totalAmount)}</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    if (selectedPaymentMethod === 'card') {
                                        if (!stripePromise) {
                                            toast.error('Payment settings are loading. Please try again in a moment.')
                                            return
                                        }
                                        setIsPaymentModalOpen(true)
                                    }
                                }}
                                className="w-full cursor-pointer rounded-[6px] bg-[#DC0000] p-[10px] text-[14px] font-[Inter-Bold] text-white transition "
                            >
                                {selectedPaymentMethod === 'tabby' ? 'Proceed With Tabby' : `Pay - AED ${formatCurrency(totalAmount)}`}
                            </button>
                        </div>
                    </div>
                </div>


            </div>

            {/* <Link href=""
                className="fixed bottom-[18px] right-[18px] inline-flex cursor-pointer items-center gap-[8px] rounded-full bg-[#25d366] p-[10px_14px] text-[14px] font-[Inter-Medium] text-white "
            >
                <Image src={whatsappwhite} alt="" width={18} height={18} className="h-[18px] w-[18px]" />
                Chat With Us
            </Link> */}

            {stripePromise ? (
                <Elements stripe={stripePromise}>
                    <PaymentCardModal
                        open={isPaymentModalOpen}
                        total={totalAmount}
                        packageId={selectedPackageApiId}
                        onClose={() => setIsPaymentModalOpen(false)}
                        onPay={handleCardPay}
                        onPaymentFailed={() => { }}
                    />
                </Elements>
            ) : null}
        </div>
    )
}
