'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FormDownArrowIcon, TickIcon, CategoryIcon, DownArrowIcon, RightArrowIcon, PortfolioIcon, CloseIcon, EditIcon, DeleteIcon } from '@/components/CustomFile/icons'
import carbannergrid from '../../../../public/assets/img/car/carbannergrid.svg'
import carevaluations from '../../../../public/assets/img/car/carevaluation.png'
import phoneoutgoing from '../../../../public/assets/img/icons/phoneoutgoing.svg'
import emailopen from '../../../../public/assets/img/icons/emailopen.svg'
import phonewhite from '../../../../public/assets/img/icons/phonewhite.svg'
import AutoFillLink from './Components/AutoFillLink'
import { allItemApi, carEvaluationsApi, carModelsApi, getUserDetailApi } from '@/utils/api'
import { useSelector } from 'react-redux'
import { userSignUpData } from '@/redux/reuducer/authSlice'
import toast from 'react-hot-toast'
import slider1 from '../../../../public/assets/img/car/client/1.svg';
import slider2 from '../../../../public/assets/img/car/client/2.png';
import slider3 from '../../../../public/assets/img/car/client/3.svg';
import slider4 from '../../../../public/assets/img/car/client/4.png';
import slider5 from '../../../../public/assets/img/car/client/5.svg';
import slider6 from '../../../../public/assets/img/car/client/6.svg';
import slider7 from '../../../../public/assets/img/car/client/7.svg';
import calendar from '../../../../public/assets/img/icons/calendar.svg'
import speedometer from '../../../../public/assets/img/icons/speedometer.svg'
import greenchecks from '../../../../public/assets/img/icons/greenchecks.svg'



const customerReviews = [
    {
        name: 'Alex Hager',
        headline: 'The process was smooth.',
        review:
            'Recently purchased a Tesla Model Y through Ebozor, car was shown to us by Riyad Al Ahmad who is welcoming and knowledgeable. The entire inspection process was fast and clear.',
    },
    {
        name: 'Parth Shukla',
        headline: 'Professional and punctual.',
        review:
            'Ebozor is very professional, punctual and can be trusted. Mr. Aaron Pinto is very helpful and supports buyers at every step with complete transparency.',
    },
    {
        name: 'Nabeel Khaleel',
        headline: 'Highly Recommend!',
        review:
            'Mr. Tareq Alhelwani and the sales team throughout the process ensured everything moved smoothly. I got the car I wanted exactly when I needed it.',
    },
    {
        name: 'Mazen Khalid',
        headline: 'Thorough report quality.',
        review:
            'The inspection report was detailed and easy to understand, which helped me negotiate with confidence. Booking and report delivery were both hassle-free.',
    },
]

const faqItems = [
    {
        question: 'What documents are required to apply for car evaluation?',
        answer:
            'No specific documents are required for car evaluation, except the car\'s Mulkia (registration) or possession certificate. Our agents will inspect the vehicle and determine the price based on its make, model, variant, and mileage.',
    },
    {
        question: 'How do I track the status of my evaluation application?',
        answer:
            'The assigned agent will provide updates regarding the status of your evaluation request.',
    },
    {
        question: 'Can I request a re-evaluation if I have made repairs or upgrades?',
        answer:
            'Repairs or upgrades made outside the authorized agency generally do not add value to the car. Re-evaluation may be considered if the modifications were done by an authorized agency.',
    },
    {
        question:
            'Who can use the car evaluation service?',
        answer:
            'Our car evaluation service is available to everyone, particularly those applying for a car loan and in need of a bank evaluation certificate.',
    },
    {
        question: 'What are the factors that influence a car\'s evaluation?',
        answer:
            'The evaluation is influenced by the car\'s make, model, variant, mileage, and overall condition.',
    },
    {
        question: 'How long is the car evaluation certificate valid?',
        answer:
            'The evaluation certificate is valid for 30 days from the date of issue. A change in the bank name will incur additional charges.',
    },
    {
        question: 'Can I get a car evaluation if I have a low credit score?',
        answer:
            'Yes, your credit score does not affect the car evaluation process.',
    },
    {
        question: 'What is the eligibility criteria and what cars are eligible for evaluation?',
        answer:
            'All cars that are approved by the RTA and in running condition are eligible for evaluation. Vehicles that have been declared as total loss are not eligible.',
    },
    {
        question: 'Can I modify or cancel my application after submitting it?',
        answer:
            'Yes, you can modify or cancel your request as long as the report has not yet been processed.',
    },
]

const inspectionWorkSteps = [
    {
        title: 'Submit a Request for Free',
        description: 'Complete the form and click "Get Evaluation Certificate".',
        badgeTitle: 'Get Inspection Report',
    },
    {
        title: 'ebozor Checks the Car',
        description: 'Our expert team visits to inspect your vehicle.',
        badgeTitle: 'Inspection Checklist',
    },
    {
        title: 'Receive your Evaluation Certificate',
        description: 'Get your evaluation certificate, ready to share with all major banks in the UAE.',
        badgeTitle: 'Detailed Vehicle Report',
    },
]

const inspectionWorkStepVideos = [
    '/assets/video/carevaluation.mp4',
    '/assets/video/carevaluationcheck.mp4',
    '/assets/video/carevaluationcertificate.mp4',
]

const INSPECTION_WORK_STEP_MS = 3000
const financeYearOptions = Array.from({ length: 27 }, (_, idx) => String(new Date().getFullYear() - idx))
const AUTOFILL_ERROR_MSG = 'Provide a valid ebozor ad link to proceed.'
const AUTOFILL_ERROR_SUB_MSG = 'Links from other websites are not supported for auto-filling information.'

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



const countryCodeOptions = [
    { flag: '🇮🇳', label: 'India', code: '+91' },
    { flag: '🇹🇲', label: 'Turkmenistan', code: '+993' },
    { flag: '🇹🇳', label: 'Tunisia', code: '+216' },
    { flag: '🇹🇴', label: 'Tonga', code: '+676' },
    { flag: '🇹🇷', label: 'Turkey', code: '+90' },
    { flag: '🇹🇹', label: 'Trinidad and Tobago', code: '+1' },
    { flag: '🇹🇻', label: 'Tuvalu', code: '+688' },
    { flag: '🇹🇼', label: 'Taiwan, Republic of China', code: '+886' },
    { flag: '🇦🇪', label: 'United Arab Emirates', code: '+971' },
    { flag: '🇹🇿', label: 'United Republic of Tanzania', code: '+255' },
    { flag: '🇺🇸', label: 'United States', code: '+1' },
    { flag: '🇺🇦', label: 'Ukraine', code: '+380' },
    { flag: '🇺🇬', label: 'Uganda', code: '+256' },
    { flag: '🇺🇾', label: 'Uruguay', code: '+598' },
    { flag: '🇺🇿', label: 'Uzbekistan', code: '+998' },
    { flag: '🇻🇦', label: 'Holy See (Vatican City State)', code: '+39' },
]

const CarEvaluation = () => {
    const userData = useSelector(userSignUpData)
    const [currentSlide, setCurrentSlide] = useState(0)
    const [visibleSlides, setVisibleSlides] = useState(3)
    const [openFaq, setOpenFaq] = useState(null)
    const [activeWorkStep, setActiveWorkStep] = useState(0)
    const [workStepFillProgress, setWorkStepFillProgress] = useState(0)
    const [activeCountryDropdown, setActiveCountryDropdown] = useState(null)
    const [selectedPrimaryCountry, setSelectedPrimaryCountry] = useState(countryCodeOptions[7])
    const [selectedSupportCountry, setSelectedSupportCountry] = useState(countryCodeOptions[7])
    const countryDropdownRef = useRef(null)
    const callBackMessageTimerRef = useRef(null)
    const supportCallBackMessageTimerRef = useRef(null)
    const bookInspectionSectionRef = useRef(null)
    const [checked, setChecked] = useState(false)
    const [showTermsError, setShowTermsError] = useState(false)
    const [callBackFeedback, setCallBackFeedback] = useState(null)
    const [checkedSupport, setCheckedSupport] = useState(false)
    const [showSupportTermsError, setShowSupportTermsError] = useState(false)
    const [supportCallFeedback, setSupportCallFeedback] = useState(null)
    const [carDetailsQuery, setCarDetailsQuery] = useState('')
    const [carModelSuggestions, setCarModelSuggestions] = useState([])
    const [showCarModelDropdown, setShowCarModelDropdown] = useState(false)
    const [selectedCarModel, setSelectedCarModel] = useState(null)
    const [selectedFinanceYear, setSelectedFinanceYear] = useState('')
    const [isAutofillModalOpen, setIsAutofillModalOpen] = useState(false)
    const [autofillAdLink, setAutofillAdLink] = useState('')
    const [autofillTouched, setAutofillTouched] = useState(false)
    const [autofillItemData, setAutofillItemData] = useState(null)
    const [isAutofillLoading, setIsAutofillLoading] = useState(false)
    const [autofillError, setAutofillError] = useState('')
    const [hasAutofilledCarDetails, setHasAutofilledCarDetails] = useState(false)
    const [prefillName, setPrefillName] = useState('')
    const [prefillPhone, setPrefillPhone] = useState('')
    const [prefillEmail, setPrefillEmail] = useState('')
    const [prefillLoading, setPrefillLoading] = useState(true)
    const [isSubmittingEvaluation, setIsSubmittingEvaluation] = useState(false)
    const parsedAutofillLink = useMemo(() => {
        const raw = String(autofillAdLink || '').trim()
        if (!raw) return { isValidBase: false, slug: '' }
        try {
            const url = new URL(raw)
            const host = String(url.hostname || '').toLowerCase()
            const isSupportedHost = host.includes('ebozor.com') || host === 'localhost' || host === '127.0.0.1'
            const mode = String(url.searchParams.get('mode') || '').toLowerCase()
            const slug = String(url.searchParams.get('slug') || '').trim()
            return {
                isValidBase: Boolean(isSupportedHost && mode === 'motors' && slug),
                slug,
            }
        } catch {
            return { isValidBase: false, slug: '' }
        }
    }, [autofillAdLink])
    const isValidAutofillLink = useMemo(
        () => Boolean(parsedAutofillLink.isValidBase && autofillItemData),
        [parsedAutofillLink.isValidBase, autofillItemData]
    )
    useEffect(() => {
        const updateVisibleSlides = () => {
            if (window.innerWidth < 640) {
                setVisibleSlides(1)
                return
            }

            if (window.innerWidth < 1024) {
                setVisibleSlides(2)
                return
            }

            setVisibleSlides(3)
        }

        updateVisibleSlides()
        window.addEventListener('resize', updateVisibleSlides)

        return () => window.removeEventListener('resize', updateVisibleSlides)
    }, [])

    const maxSlideIndex = useMemo(() => {
        return Math.max(customerReviews.length - visibleSlides, 0)
    }, [visibleSlides])

    useEffect(() => {
        if (currentSlide > maxSlideIndex) {
            setCurrentSlide(maxSlideIndex)
        }
    }, [currentSlide, maxSlideIndex])

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
                setActiveCountryDropdown(null)
            }
        }

        document.addEventListener('mousedown', handleOutsideClick)
        return () => document.removeEventListener('mousedown', handleOutsideClick)
    }, [])

    useEffect(() => {
        const autoStepTimer = setInterval(() => {
            setActiveWorkStep((prev) => (prev + 1) % inspectionWorkSteps.length)
        }, INSPECTION_WORK_STEP_MS)

        return () => clearInterval(autoStepTimer)
    }, [])

    useEffect(() => {
        setWorkStepFillProgress(0)
        let cancelled = false
        const start = performance.now()
        const loop = (now) => {
            if (cancelled) return
            const next = Math.min((now - start) / INSPECTION_WORK_STEP_MS, 1)
            setWorkStepFillProgress(next)
            if (next < 1) {
                requestAnimationFrame(loop)
            }
        }
        const raf = requestAnimationFrame(loop)
        return () => {
            cancelled = true
            cancelAnimationFrame(raf)
        }
    }, [activeWorkStep])

    useEffect(() => {
        return () => {
            if (callBackMessageTimerRef.current) {
                clearTimeout(callBackMessageTimerRef.current)
            }
            if (supportCallBackMessageTimerRef.current) {
                clearTimeout(supportCallBackMessageTimerRef.current)
            }
        }
    }, [])

    useEffect(() => {
        let cancelled = false
        const run = async () => {
            const currentUserId = userData?.id ?? userData?.data?.id ?? userData?.user?.id ?? null
            if (!currentUserId) {
                if (!cancelled) setPrefillLoading(false)
                return
            }
            try {
                if (!cancelled) setPrefillLoading(true)
                const response = await getUserDetailApi.getUserDetail({ user_id: currentUserId })
                const parsed = parseApiPayload(response?.data)
                const row = parsed?.data && typeof parsed.data === 'object' ? parsed.data : {}
                const firstName = String(row?.name || '').trim()
                const lastName = String(row?.last_name || '').trim()
                const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
                const mobileVerified = Number(row?.mobile_verify) === 1
                const rawMobile = mobileVerified ? String(row?.mobile || '').trim() : ''
                let resolvedCountry = countryCodeOptions[7]
                let localMobile = rawMobile
                if (rawMobile) {
                    const matched = [...countryCodeOptions]
                        .sort((a, b) => b.code.length - a.code.length)
                        .find((country) => rawMobile.startsWith(country.code))
                    if (matched) {
                        resolvedCountry = matched
                        localMobile = rawMobile.slice(matched.code.length).trim()
                    }
                }
                const email = String(row?.email || '').trim()
                if (!cancelled) {
                    setPrefillName(fullName)
                    setSelectedPrimaryCountry(resolvedCountry)
                    setPrefillPhone(localMobile)
                    setPrefillEmail(email)
                }
            } catch {
                if (!cancelled) {
                    setPrefillName('')
                    setPrefillPhone('')
                    setPrefillEmail('')
                }
            } finally {
                if (!cancelled) setPrefillLoading(false)
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [userData?.id, userData?.data?.id, userData?.user?.id])

    useEffect(() => {
        const q = String(carDetailsQuery || '').trim()
        if (!q || hasAutofilledCarDetails) {
            setCarModelSuggestions([])
            setShowCarModelDropdown(false)
            return
        }

        let cancelled = false
        const timer = setTimeout(async () => {
            try {
                const response = await carModelsApi.getCarModels({ search: q })
                const parsed = parseApiPayload(response?.data)
                const rows = Array.isArray(parsed?.data) ? parsed.data : []
                const mapped = rows
                    .map((row) => ({
                        name: String(row?.name || '').trim(),
                        car_make_id: row?.car_make_id ?? null,
                        car_model_id: row?.car_model_id ?? null,
                        car_trim_id: row?.car_trim_id ?? null,
                    }))
                    .filter((row) => row.name.length > 0)
                if (!cancelled) {
                    if (mapped.length === 0) {
                        setCarDetailsQuery('')
                        setSelectedCarModel(null)
                    }
                    setCarModelSuggestions(mapped)
                    setShowCarModelDropdown(mapped.length > 0)
                }
            } catch {
                if (!cancelled) {
                    setCarModelSuggestions([])
                    setShowCarModelDropdown(false)
                }
            }
        }, 250)

        return () => {
            cancelled = true
            clearTimeout(timer)
        }
    }, [carDetailsQuery, hasAutofilledCarDetails])

    useEffect(() => {
        if (!isAutofillModalOpen) return
        if (!parsedAutofillLink.isValidBase || !parsedAutofillLink.slug) {
            setAutofillItemData(null)
            setAutofillError(autofillAdLink.trim() ? AUTOFILL_ERROR_MSG : '')
            setIsAutofillLoading(false)
            return
        }

        let cancelled = false
        const timer = setTimeout(async () => {
            try {
                setIsAutofillLoading(true)
                setAutofillError('')
                const response = await allItemApi.getItems({ slug: parsedAutofillLink.slug })
                const parsed = parseApiPayload(response?.data)
                const rows = Array.isArray(parsed?.data?.data) ? parsed.data.data : []
                const first = rows[0] || null
                if (!cancelled) {
                    if (first) {
                        setAutofillItemData(first)
                        setAutofillError('')
                    } else {
                        setAutofillItemData(null)
                        setAutofillError(AUTOFILL_ERROR_MSG)
                    }
                }
            } catch {
                if (!cancelled) {
                    setAutofillItemData(null)
                    setAutofillError(AUTOFILL_ERROR_MSG)
                }
            } finally {
                if (!cancelled) setIsAutofillLoading(false)
            }
        }, 200)

        return () => {
            cancelled = true
            clearTimeout(timer)
        }
    }, [isAutofillModalOpen, parsedAutofillLink.isValidBase, parsedAutofillLink.slug, autofillAdLink])

    const handleBookInspectionClick = async () => {
        if (isSubmittingEvaluation) return
        if (!checked) {
            setShowTermsError(true)
            return
        }

        setShowTermsError(false)
        const currentUserId = userData?.id ?? userData?.data?.id ?? userData?.user?.id ?? null
        if (!currentUserId) {
            toast.error('Please login and try again.')
            return
        }

        const selectedAutofillModel = hasAutofilledCarDetails && autofillItemData
            ? {
                name: String(autofillItemData?.name || '').trim(),
                car_make_id: autofillItemData?.car_make ?? null,
                car_model_id: autofillItemData?.car_model ?? null,
                car_trim_id: autofillItemData?.car_trim ?? null,
            }
            : null
        const finalCarModel = selectedAutofillModel || selectedCarModel
        const resolvedCarName = String(finalCarModel?.name || carDetailsQuery || '').trim()
        if (!resolvedCarName) {
            toast.error('Please select car details.')
            return
        }

        try {
            setIsSubmittingEvaluation(true)
            await carEvaluationsApi.createEvaluation({
                user_id: currentUserId,
                user_name: String(prefillName || '').trim(),
                user_number: `${selectedPrimaryCountry?.code || ''}${String(prefillPhone || '').trim()}`,
                user_email: String(prefillEmail || '').trim(),
                car_name: resolvedCarName,
                car_make_id: finalCarModel?.car_make_id,
                car_model_id: finalCarModel?.car_model_id,
                car_trim_id: finalCarModel?.car_trim_id,
                car_year: selectedFinanceYear,
            })
            toast.success('Evaluation request submitted successfully.')
            setPrefillName('')
            setPrefillPhone('')
            setPrefillEmail('')
            setCarDetailsQuery('')
            setCarModelSuggestions([])
            setShowCarModelDropdown(false)
            setSelectedCarModel(null)
            setSelectedFinanceYear('')
            setChecked(false)
            setShowTermsError(false)
            setHasAutofilledCarDetails(false)
            setAutofillAdLink('')
            setAutofillTouched(false)
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to submit evaluation request.')
        } finally {
            setIsSubmittingEvaluation(false)
        }
    }

    const handleRequestCallBackClick = async () => {
        const hasName = String(prefillName || '').trim().length > 0
        const hasPhone = String(prefillPhone || '').trim().length > 0
        if (!hasName || !hasPhone) {
            toast.error('Please fill your name and phone number.')
            return
        }

        if (!checked) {
            setShowTermsError(true)
            return
        }

        setShowTermsError(false)
        if (callBackMessageTimerRef.current) {
            clearTimeout(callBackMessageTimerRef.current)
        }

        let ok = true
        try {
            // Replace with real API; set ok from response status.
            await new Promise((resolve) => setTimeout(resolve, 300))
        } catch {
            ok = false
        }

        setCallBackFeedback(ok ? 'success' : 'failure')
        callBackMessageTimerRef.current = setTimeout(() => {
            setCallBackFeedback(null)
            callBackMessageTimerRef.current = null
        }, 4000)
    }

    const handleCallMeBackClick = async () => {
        if (!checkedSupport) {
            setShowSupportTermsError(true)
            return
        }

        setShowSupportTermsError(false)
        if (supportCallBackMessageTimerRef.current) {
            clearTimeout(supportCallBackMessageTimerRef.current)
        }

        let ok = true
        try {
            // Replace with real API; set ok from response status.
            await new Promise((resolve) => setTimeout(resolve, 300))
        } catch {
            ok = false
        }

        setSupportCallFeedback(ok ? 'success' : 'failure')
        supportCallBackMessageTimerRef.current = setTimeout(() => {
            setSupportCallFeedback(null)
            supportCallBackMessageTimerRef.current = null
        }, 4000)
    }

    const scrollToBookInspectionSection = () => {
        bookInspectionSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const handleOpenAutofillModal = () => {
        setActiveCountryDropdown(null)
        setAutofillTouched(false)
        setAutofillError('')
        setIsAutofillModalOpen(true)
    }

    const handleCloseAutofillModal = (options = {}) => {
        const { preserveFetchedData = false, preserveLink = false } = options
        if (!preserveLink) {
            setAutofillAdLink('')
        }
        setAutofillTouched(false)
        if (!preserveFetchedData) {
            setHasAutofilledCarDetails(false)
            setAutofillItemData(null)
            setSelectedCarModel(null)
            setCarDetailsQuery('')
        }
        setAutofillError('')
        setIsAutofillLoading(false)
        setIsAutofillModalOpen(false)
    }

    const handleConfirmAutofill = () => {
        if (!isValidAutofillLink) {
            setAutofillTouched(true)
            return
        }
        const carName = String(autofillItemData?.name || '').trim()
        setCarDetailsQuery(carName)
        setSelectedCarModel({
            name: carName,
            car_make_id: autofillItemData?.car_make ?? null,
            car_model_id: autofillItemData?.car_model ?? null,
            car_trim_id: autofillItemData?.car_trim ?? null,
        })
        setHasAutofilledCarDetails(true)
        handleCloseAutofillModal({ preserveFetchedData: true, preserveLink: true })
    }

    return (
        <div className="w-full bg-[#f9fbfe] mt-[-30px]">
            <div
                ref={bookInspectionSectionRef}
                id="book-car-inspection"
                className="w-full scroll-mt-[24px] bg-white p-[60px] max-sm:p-[14px]"
                style={{
                    backgroundImage: `
                    radial-gradient(25% 50% at 75% 50%, rgba(224, 0, 0, 0.69) 1.56%, rgba(224, 0, 0, 0.34) 22.4%, rgba(224, 0, 0, 0) 91.15%),
                    url(${carbannergrid.src})
                  `,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                <div className="grid grid-cols-[1fr_500px] gap-[20px] max-sm:grid-cols-1 tabgrid2">
                    <div
                        className="relative overflow-hidden"

                    >
                        <div className='flex flex-col gap-[14px] mb-[20px]'>
                            <h1 className="text-[50px] font-[Inter-Bold] leading-[1.12] text-[#23262A] max-sm:text-[34px]">
                                <span className="bg-[linear-gradient(90deg,#E00000_0%,#5A3333_100%)] bg-clip-text text-transparent">Ebozor</span> Car Evaluation
                            </h1>
                            <p className="max-w-[560px] max-sm:max-w-full text-[18px] font-[Inter-Regular] leading-[1.3] text-[#23262A]">
                                Get a car evaluation certificate and secure quick financing for your used car.
                            </p>
                        </div>

                        <div className="relative mt-[24px] min-h-[420px] max-sm:min-h-[320px]">
                            <div className="absolute left-0 top-[24px] z-10 w-[325px] rounded-[10px] border border-[#E0E1E3] bg-white p-[22px] shadow-[0_24px_60px_rgba(35,38,42,0.12)] max-sm:relative max-sm:top-0 max-sm:w-full">
                                <h3 className="text-[22px] font-[Inter-Bold] leading-[1.2] text-[#020817] mb-[6px]">
                                    Evaluation Certificate
                                </h3>
                                <div className="flex flex-col gap-[8px]">
                                    <span className="h-[8px] w-[195px] rounded-full bg-[#D9DDE3] max-sm:w-[75%]" />
                                    <span className="h-[8px] w-[82px] rounded-full bg-[#D9DDE3]" />
                                </div>


                                <div className='mt-[22px]'>
                                    <h4 className="text-[18px] font-[Inter-Bold] leading-[1.2] text-[#020817]">
                                        Car Details
                                    </h4>

                                    <div className="mt-[18px] flex flex-col gap-[12px]">
                                        {['Fair market value', 'Car Condition', 'Photos', 'Car Damage Diagram'].map((item) => (
                                            <div key={item} className="flex items-center gap-[10px]">
                                                <Image src={greenchecks} alt="greenchecks" width={16} height={16} />
                                                <p className="text-[14px] font-[Inter-Medium] text-[#020817]">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>


                            </div>

                            <div className="absolute bottom-0 right-0 w-[520px] max-sm:relative max-sm:mt-[20px] max-sm:w-full">
                                <Image
                                    src={carevaluations}
                                    alt="Car evaluation vehicle"
                                    width={600}
                                    height={365}
                                    className="h-auto w-full object-contain"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.02),0px_3px_8px_rgba(0,0,0,0.02),0px_1px_10px_rgba(0,0,0,0.04)] bg-white rounded-[6px] p-[30px_20px] h-fit">

                        <div className='flex flex-col gap-[4px] mb-[20px]'>
                            <h2 className="text-[22px] font-[Inter-Bold] leading-[1.2] text-[#23262A]">
                                Get Car Evaluation Certificate
                            </h2>
                        </div>

                        <form className="flex flex-col gap-[16px]" ref={countryDropdownRef}>
                            <div>
                                <label className="mb-[6px] block text-[16px] font-[Inter-SemiBold] text-[#3a3f47]">
                                    Your Details*
                                </label>

                                {prefillLoading ? (
                                    <div className='flex flex-col gap-[12px]'>
                                        <div className="h-[52px] w-full animate-pulse rounded-[8px] bg-[#ECECEC]" />
                                        <div className="h-[52px] w-full animate-pulse rounded-[8px] bg-[#ECECEC]" />
                                        <div className="h-[52px] w-full animate-pulse rounded-[8px] bg-[#ECECEC]" />
                                    </div>
                                ) : (
                                    <div className='flex flex-col gap-[12px]'>
                                        <input
                                            type="text"
                                            value={prefillName}
                                            onChange={(e) => setPrefillName(e.target.value)}
                                            className="w-full rounded-[8px] border border-[rgba(143,143,143,0.45)] bg-white p-[14px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                        />

                                        <div className="relative">
                                            <div className="flex h-[52px] overflow-hidden rounded-[8px] border border-[rgba(143,143,143,0.45)] bg-white">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setActiveCountryDropdown((prev) => (prev === 'primary' ? null : 'primary'))
                                                    }
                                                    className="cursor-pointer flex shrink-0 items-center px-[14px] justify-center gap-[12px] border-r border-[rgba(143,143,143,0.45)] bg-white"
                                                >
                                                    <p className="">{selectedPrimaryCountry.flag}</p>
                                                    <FormDownArrowIcon className="w-[16px] h-[16px]" fill="#23262A" />
                                                </button>
                                                <input
                                                    type="tel"
                                                    value={prefillPhone}
                                                    onChange={(e) => setPrefillPhone(e.target.value)}
                                                    className="h-full w-full bg-white p-[14px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                                />
                                            </div>

                                            {activeCountryDropdown === 'primary' ? (
                                                <div className="absolute left-0 top-[56px] z-20 max-h-[280px] w-full overflow-y-auto rounded-[8px] border border-[rgba(35,38,42,0.15)] bg-white py-[6px] shadow-[0_8px_20px_rgba(35,38,42,0.12)]">
                                                    {countryCodeOptions.map((country) => (
                                                        <button
                                                            key={`${country.label}-${country.code}`}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedPrimaryCountry(country)
                                                                setActiveCountryDropdown(null)
                                                            }}
                                                            className={`flex w-full items-center gap-[10px] px-[12px] py-[8px] text-left  hover:bg-[#F7F7F8] ${selectedPrimaryCountry.code === country.code &&
                                                                selectedPrimaryCountry.label === country.label
                                                                ? 'bg-[#FBEFF0]'
                                                                : 'bg-white'
                                                                }`}
                                                        >
                                                            <span>{country.flag}</span>
                                                            <p className="text-[#23262A] text-[14px] font-[Inter-Regular]">
                                                                {country.label} {country.code}
                                                            </p>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>

                                        <input
                                            type="text"
                                            value={prefillEmail}
                                            onChange={(e) => setPrefillEmail(e.target.value)}
                                            className="w-full rounded-[8px] border border-[rgba(143,143,143,0.45)] bg-white p-[14px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="mb-[8px] flex items-center justify-between gap-[10px]">
                                    <label className="mb-[6px] block text-[16px] font-[Inter-SemiBold] text-[#3a3f47]">Car Details</label>
                                    {!hasAutofilledCarDetails ? (
                                        <button
                                            type="button"
                                            onClick={handleOpenAutofillModal}
                                            className="cursor-pointer inline-flex items-center gap-[4px] text-[14px] font-[Inter-SemiBold] text-[#3a88ef]"
                                        >
                                            <PortfolioIcon className="w-[16px] h-[16px] rotate-[120deg]" fill="#3a88ef" />
                                            <p className="text-[14px] font-[Inter-Regular] text-[#3a88ef]">Autofill With Ad Link</p>
                                            <RightArrowIcon className="w-[20px] h-[20px] rtl:rotate-180" stroke="#3a88ef" />
                                        </button>
                                    ) : null}
                                </div>

                                {hasAutofilledCarDetails ? (
                                    <div className="rounded-[10px] bg-[#0000000a] p-[12px]">
                                        <div className="mb-[8px] flex items-center justify-between gap-[10px]">
                                            <div className="inline-flex items-center gap-[4px] text-[#3a88ef]">
                                                <PortfolioIcon className="w-[16px] h-[16px] rotate-[130deg]" fill="#3a88ef" />
                                                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Autofilled with ad link</p>
                                            </div>
                                            <div className="flex items-center gap-[10px]">
                                                <button
                                                    type="button"
                                                    onClick={handleOpenAutofillModal}
                                                    className="cursor-pointer"
                                                >
                                                    <EditIcon className="h-[16px] w-[16px]" fill="#DC0000" fillOpacity="1" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setHasAutofilledCarDetails(false)
                                                        setCarDetailsQuery('')
                                                        setSelectedFinanceYear('')
                                                        setSelectedCarModel(null)
                                                        setAutofillItemData(null)
                                                        setAutofillAdLink('')
                                                        setAutofillTouched(false)
                                                        setAutofillError('')
                                                        setShowCarModelDropdown(false)
                                                        setCarModelSuggestions([])
                                                    }}
                                                    className="cursor-pointer"
                                                    aria-label="Remove autofilled details"
                                                >
                                                    <DeleteIcon className="h-[16px] w-[16px]" fill="#DC0000" fillOpacity="1" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex gap-[10px]">
                                            <Image
                                                src={String(autofillItemData?.image || '').trim() || carevaluations}
                                                alt="Autofilled car"
                                                width={135}
                                                height={100}
                                                className="h-[100px] w-[135px] rounded-[6px] object-cover"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between gap-[10px]">
                                                    <div className="flex-1">
                                                        <h4 className="text-[14px] font-[Inter-Regular] leading-[1.45] text-[#23262A]">
                                                            {String(autofillItemData?.name || 'N/A')}
                                                        </h4>
                                                    </div>
                                                    <div className="shrink-0">
                                                        <h3 className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">
                                                            {autofillItemData?.price != null ? `AED ${Number(autofillItemData.price).toLocaleString('en-AE')}` : 'N/A'}
                                                        </h3>
                                                    </div>
                                                </div>

                                                <div className="mt-[8px] flex items-center gap-[12px]">
                                                    <div className="flex items-center gap-[4px]">
                                                        <Image src={calendar} alt="Calendar" className="h-[14px] w-[14px]" />
                                                        <p className="text-[14px] font-[Inter-Regular] text-[#626465]">{selectedFinanceYear || 'N/A'}</p>
                                                    </div>
                                                    <div className="flex items-center gap-[4px]">
                                                        <Image src={speedometer} alt="Mileage" className="h-[14px] w-[14px]" />
                                                        <p className="text-[14px] font-[Inter-Regular] text-[#626465]">-</p>
                                                    </div>
                                                </div>

                                                <div className="mt-[14px] flex items-center gap-[10px]">
                                                    <p className="text-[12px] font-[Inter-Regular] text-[#626465]">Seller Name</p>
                                                    <h3 className="text-[12px] font-[Inter-Regular] text-[#23262A]">{String(autofillItemData?.user?.name || 'N/A')}</h3>
                                                </div>
                                                <div className="mt-[6px] flex items-center gap-[10px]">
                                                    <p className="text-[12px] font-[Inter-Regular] text-[#626465]">Seller Phone Number</p>
                                                    <h3 className="text-[12px] font-[Inter-Regular] text-[#23262A]">{String(autofillItemData?.contact || autofillItemData?.user?.mobile || 'N/A')}</h3>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative flex flex-col gap-[10px]">
                                        <input
                                            type="text"
                                            value={carDetailsQuery}
                                            onChange={(e) => {
                                                setCarDetailsQuery(e.target.value)
                                                setShowCarModelDropdown(true)
                                                setSelectedCarModel(null)
                                            }}
                                            onFocus={() => {
                                                if (carModelSuggestions.length > 0) setShowCarModelDropdown(true)
                                            }}
                                            placeholder="Search Make, Model, or Trim"
                                            className="w-full rounded-[8px] border border-[rgba(143,143,143,0.45)] bg-white p-[14px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#999999]"
                                        />
                                        {showCarModelDropdown && carModelSuggestions.length > 0 ? (
                                            <div className="absolute left-0 top-[56px] z-20 max-h-[240px] w-full overflow-y-auto rounded-[8px] border border-[rgba(35,38,42,0.15)] bg-white py-[6px] shadow-[0_8px_20px_rgba(35,38,42,0.12)]">
                                                {carModelSuggestions.map((row, idx) => (
                                                    <button
                                                        key={`${row.name}-${row.car_make_id}-${row.car_model_id}-${row.car_trim_id}-${idx}`}
                                                        type="button"
                                                        onClick={() => {
                                                            setCarDetailsQuery(row.name)
                                                            setShowCarModelDropdown(false)
                                                            setSelectedCarModel(row)
                                                        }}
                                                        className="cursor-pointer flex w-full items-center px-[14px] py-[10px] text-left text-[14px] font-[Inter-Regular] text-[#23262A] hover:bg-[#F7F7F8]"
                                                    >
                                                        {row.name}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                )}

                                {!hasAutofilledCarDetails ? (
                                    <div className='mt-[10px]'>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setActiveCountryDropdown((prev) => (prev === 'finance-year' ? null : 'finance-year'))
                                                }
                                                className="cursor-pointer flex h-[52px] w-full items-center justify-between rounded-[8px] border border-[rgba(143,143,143,0.45)] bg-white px-[14px] text-left"
                                            >
                                                <p className={`text-[14px] font-[Inter-Regular] ${selectedFinanceYear ? 'text-[#23262A]' : 'text-[#999999]'}`}>
                                                    {selectedFinanceYear || 'Year'}
                                                </p>
                                                <FormDownArrowIcon className="h-[16px] w-[16px]" fill="#666B72" />
                                            </button>

                                            {activeCountryDropdown === 'finance-year' ? (
                                                <div className="absolute left-0 top-[82px] z-20 max-h-[280px] w-full overflow-y-auto rounded-[8px] border border-[rgba(35,38,42,0.15)] bg-white py-[6px] shadow-[0_8px_20px_rgba(35,38,42,0.12)]">
                                                    {financeYearOptions.map((year) => (
                                                        <button
                                                            key={year}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedFinanceYear(year)
                                                                setActiveCountryDropdown(null)
                                                            }}
                                                            className={`cursor-pointer flex w-full items-center px-[14px] py-[10px] text-left text-[14px] font-[Inter-Regular] hover:bg-[#F7F7F8] ${selectedFinanceYear === year ? 'bg-[#FBEFF0] text-[#23262A]' : 'bg-white text-[#23262A]'
                                                                }`}
                                                        >
                                                            {year}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : null}
                            </div>




                            <div>

                                <label className="cursor-pointer relative flex items-center gap-[10px]">
                                    <input
                                        type="checkbox"
                                        className="cursor-pointer w-[18px] h-[18px] rounded-[4px] border border-[rgba(143,143,143,0.45)] bg-white checked:bg-[#DC0000] checked:border-[#DC0000] appearance-none"
                                        checked={checked}
                                        onChange={(e) => {
                                            setChecked(e.target.checked)
                                            if (e.target.checked) {
                                                setShowTermsError(false)
                                            } else {
                                                if (callBackMessageTimerRef.current) {
                                                    clearTimeout(callBackMessageTimerRef.current)
                                                    callBackMessageTimerRef.current = null
                                                }
                                                setCallBackFeedback(null)
                                            }
                                        }}
                                    />

                                    {checked ? <TickIcon className="w-[18px] h-[18px] absolute left-0 top-0 rtl:right-0 rtl:left-auto" fill="#fff" /> : null}

                                    <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                                        I agree to Ebozor&apos;s{' '}
                                        <Link href="" className="text-[#3a88ef] underline">
                                            terms of service
                                        </Link>
                                    </p>
                                </label>

                                {showTermsError ? (
                                    <p className="text-[12px] font-[Inter-Regular] text-[#DC0000] mt-[4px]">
                                        You must agree to the terms of service
                                    </p>
                                ) : null}
                            </div>


                            <button
                                type="button"
                                onClick={handleBookInspectionClick}
                                disabled={isSubmittingEvaluation}
                                className={`mt-[30px] p-[14px_16px] w-full rounded-[6px] bg-[#DC0000] text-[14px] font-[Inter-SemiBold] text-white transition ${isSubmittingEvaluation ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                            >
                                {isSubmittingEvaluation ? 'Submitting...' : 'Get Evaluation Certificate'}
                            </button>

                            {callBackFeedback === 'failure' ? (
                                <p className="mt-[8px] text-center text-[14px] font-[Inter-SemiBold] text-[#DC0000]">
                                    Call Back Request Failed. Please try again.
                                </p>
                            ) : null}

                            {callBackFeedback === 'success' ? (
                                <p className="mt-[8px] text-center text-[14px] font-[Inter-SemiBold] text-[#1B9E3E]">
                                    Call Back Request Received!
                                </p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleRequestCallBackClick}
                                    className="mt-[8px] w-full cursor-pointer text-center text-[14px] font-[Inter-SemiBold] text-[#DC0000]"
                                >
                                    Request Call Back
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-[1170px] max-sm:max-w-full max-sm:px-[15px] common_container ">


                <div className="p-[60px_0]">
                    <div className="text-center mb-[40px]">
                        <h2 className="mb-[14px] text-[28px] leading-[1.2] text-[#23262A] font-[Inter-Bold] ">
                            Why You Need a Car Evaluation Certificate
                        </h2>
                        <p className="w-[700px] mx-auto max-sm:w-full text-[18px] leading-[1.3] text-[#23262A] font-[Inter-Regular]">
                            Banks require an official car evaluation certificate to approve your loan. ebozor's car evaluation certificates are recognized by top UAE banks, ensuring a smooth & quick financing process.
                        </p>
                    </div>

                    <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] shadow-[0px_1px_10px_0px_#0000000A] rounded-[16px]  overflow-hidden common_container">
                        <div className="">
                            <div className="flex items-center gap-[80px] animate-logo-slider">
                                {[...Array(2)].flatMap((_, loopIdx) =>
                                    [slider1, slider2, slider3, slider4, slider5, slider6, slider7].map((logo, idx) => (
                                        <div key={`${loopIdx}-${idx}`} className="flex-shrink-0 p-[40px_0]">
                                            <Image src={logo} alt={`company logo ${idx + 1}`} className="w-[120px] h-auto" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                </div>


                <div className="p-[60px_0]">
                    <div className="text-center mb-[40px]">
                        <h2 className="mb-[14px] text-[28px] leading-[1.2] text-[#23262A] font-[Inter-Bold] ">
                            How the ebozor Evaluation Works
                        </h2>
                        <p className="text-[18px] leading-[1.3] text-[#23262A] font-[Inter-Regular]">
                            Get your evaluation certificate in 3 simple steps.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-[50px] max-sm:grid-cols-1">
                        <div className="">
                            <div className="relative overflow-hidden rounded-[12px]">
                                <video
                                    key={inspectionWorkStepVideos[activeWorkStep]}
                                    className="h-auto w-full"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    preload="metadata"
                                // poster="/assets/img/carinceptionempty.svg"
                                >
                                    <source
                                        src={inspectionWorkStepVideos[activeWorkStep]}
                                        type="video/mp4"
                                    />
                                </video>


                            </div>
                        </div>

                        <div>
                            <div className="flex flex-col gap-[22px]">
                                {inspectionWorkSteps.map((step, index) => {
                                    const isActive = activeWorkStep === index

                                    return (
                                        <div
                                            key={step.title}
                                            className="w-full text-left"
                                        >
                                            <div className="flex gap-[20px] items-center">
                                                <div className="relative w-[4px] min-h-[72px] shrink-0 self-stretch overflow-hidden rounded-full bg-[#DBDDE1]">
                                                    <div
                                                        className="absolute left-0 top-0 w-full rounded-full bg-[#DC0000]"
                                                        style={{
                                                            height:
                                                                index === activeWorkStep
                                                                    ? `${workStepFillProgress * 100}%`
                                                                    : '0%',
                                                        }}
                                                    />
                                                </div>
                                                <div className='flex flex-col gap-[10px]'>
                                                    <h3
                                                        className={`text-[24px] font-[Inter-SemiBold] leading-[1.25] ${isActive ? 'text-[#23262A]' : 'text-[#A3A6AA]'} `}
                                                    >
                                                        {step.title}
                                                    </h3>
                                                    {isActive ? (
                                                        <p className="text-[14px] font-[Inter-Regular] leading-[1.35] text-[#23262A] ]">
                                                            {step.description}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <button
                                type="button"
                                onClick={scrollToBookInspectionSection}
                                className="cursor-pointer mt-[24px] inline-flex items-center gap-[8px] rounded-[8px] border border-[#DC0000] px-[24px] py-[10px] text-[14px] font-[Inter-SemiBold] text-[#DC0000] "
                            >
                                Book Inspection
                                <CategoryIcon className="w-[18px] h-[18px]" fill="#DC0000" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-[60px_0]">
                    <div className="rounded-[16px] p-[44px] border border-[#C0CDE7] bg-[linear-gradient(90deg,rgba(235,243,253,0.3)_0%,rgba(192,205,231,0.3)_100%)] max-sm:p-[20px]">
                        <div className="grid grid-cols-1 gap-[20px] lg:grid-cols-2 lg:gap-[32px]">
                            <div>
                                <h2 className="text-[26px] font-[Inter-Bold] leading-[34px] text-[#23262A] mb-[20px]">
                                    Have Questions?
                                    <br />
                                    We&apos;ve got answers!
                                </h2>
                                <p className="text-[18px] font-[Inter-Regular] leading-[1.3] text-[#23262a]">
                                    Request a call back or reach out to us for any assistance.
                                </p>

                                <div className="mt-[18px] flex flex-wrap items-center gap-x-[26px] gap-y-[12px]">
                                    <div className="flex items-center gap-[10px]">
                                        <div className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-white">
                                            <Image src={phoneoutgoing} alt="Phone" width={24} height={24} />
                                        </div>
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">04 446 6830</p>
                                    </div>

                                    <div className="flex items-center gap-[10px]">
                                        <div className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-white">
                                            <Image src={emailopen} alt="Email" width={24} height={24} />
                                        </div>
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">carservices@ebozor.com</p>
                                    </div>
                                </div>
                            </div>

                            <form className="space-y-[12px]">
                                <input
                                    type="text"
                                    className="h-[56px] w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white px-[14px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none focus:border-[rgba(35,38,42,0.3)]"
                                />

                                <div className="relative">
                                    <div className="flex overflow-hidden rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setActiveCountryDropdown((prev) => (prev === 'support' ? null : 'support'))
                                            }
                                            className="cursor-pointer flex shrink-0 items-center px-[14px] justify-center gap-[12px] border-r border-[rgba(143,143,143,0.45)] bg-white"
                                        >
                                            <p>{selectedSupportCountry.flag}</p>
                                            <FormDownArrowIcon className="w-[16px] h-[16px]" fill="#23262A" />
                                        </button>
                                        <input
                                            type="tel"
                                            className="h-[56px] w-full bg-white px-[12px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                        />
                                    </div>

                                    {activeCountryDropdown === 'support' ? (
                                        <div className="absolute left-0 top-[56px] z-20 max-h-[280px] w-full overflow-y-auto rounded-[8px] border border-[rgba(35,38,42,0.15)] bg-white py-[6px] shadow-[0_8px_20px_rgba(35,38,42,0.12)]">
                                            {countryCodeOptions.map((country) => (
                                                <button
                                                    key={`${country.label}-${country.code}-support`}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedSupportCountry(country)
                                                        setActiveCountryDropdown(null)
                                                    }}
                                                    className={`flex w-full items-center gap-[10px] px-[12px] py-[8px] text-left text-[16px] font-[Inter-Regular] hover:bg-[#F7F7F8] ${selectedSupportCountry.code === country.code &&
                                                        selectedSupportCountry.label === country.label
                                                        ? 'bg-[#FBEFF0]'
                                                        : 'bg-white'
                                                        }`}
                                                >
                                                    <span>{country.flag}</span>
                                                    <span className="text-[#23262A]">
                                                        {country.label} {country.code}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="flex items-center gap-[10px]">
                                    <label className="cursor-pointer relative flex items-center gap-[10px]">
                                        <input
                                            type="checkbox"
                                            className="cursor-pointer w-[18px] h-[18px] rounded-[4px] border border-[rgba(143,143,143,0.45)] bg-white checked:bg-[#DC0000] checked:border-[#DC0000] appearance-none"
                                            checked={checkedSupport}
                                            onChange={(e) => {
                                                setCheckedSupport(e.target.checked)
                                                if (e.target.checked) {
                                                    setShowSupportTermsError(false)
                                                } else {
                                                    if (supportCallBackMessageTimerRef.current) {
                                                        clearTimeout(supportCallBackMessageTimerRef.current)
                                                        supportCallBackMessageTimerRef.current = null
                                                    }
                                                    setSupportCallFeedback(null)
                                                }
                                            }}
                                        />
                                        {checkedSupport ? <TickIcon className="w-[18px] h-[18px] absolute left-0 top-[0px]" fill="#fff" /> : null}

                                    </label>
                                    <p className="text-[14px] font-[Inter-Regular] text-[#23262A] ">
                                        I agree to Ebozor&apos;s{' '}
                                        <Link href="#" className="text-[#3a88ef] underline">
                                            terms of service
                                        </Link>
                                    </p>
                                </div>

                                {showSupportTermsError ? (
                                    <p className="text-[14px] font-[Inter-Regular] text-[#DC0000]">
                                        You must agree to the terms of service
                                    </p>
                                ) : null}

                                {supportCallFeedback ? (
                                    <p
                                        className={`mt-[10px] text-center text-[14px] font-[Inter-SemiBold] ${supportCallFeedback === 'failure' ? 'text-[#DC0000]' : 'text-[#1B9E3E]'
                                            }`}
                                    >
                                        {supportCallFeedback === 'failure'
                                            ? 'Call Back Request Failed. Please try again.'
                                            : 'Call Back Request Received!'}
                                    </p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleCallMeBackClick}
                                        className="mt-[10px] cursor-pointer flex w-full items-center justify-center gap-[8px] rounded-[6px] bg-[#23262a] text-[14px] font-[Inter-Medium] text-white transition p-[14px]"
                                    >
                                        <Image src={phonewhite} alt="Phone" width={18} height={18} />
                                        Call Me Back
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>
                </div>

                <div className="p-[60px_0]">
                    <div className="grid grid-cols-[1fr_450px] gap-[24px] max-sm:grid-cols-1 tabgrid2">
                        <div className="">
                            <h2 className="mb-[14px] text-[28px] leading-[1.2] text-[#23262A] font-[Inter-Bold] ">
                                Frequently Asked Questions
                            </h2>
                            <p className="text-[16px] leading-[26px] text-[#23262A] font-[Inter-Regular] w-[450px] max-sm:w-full w_full">
                                Find quick answers to the most common queries about our services, process, and support.
                                If you can&apos;t find what you&apos;re looking for, our team is always here to help.
                            </p>
                        </div>

                        <div className="space-y-[10px]">
                            {faqItems.map((item, index) => {
                                const isOpen = openFaq === index

                                return (
                                    <div
                                        key={item.question}
                                        className="overflow-hidden rounded-[10px] p-[20px_30px] bg-white"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setOpenFaq((prev) => (prev === index ? null : index))}
                                            className="cursor-pointer flex w-full items-center justify-between gap-[10px] text-left"
                                        >
                                            <h4 className="text-[18px] font-[Inter-Medium] leading-[28px] text-[#23262A] ">
                                                {item.question}
                                            </h4>
                                            <div
                                                className={` ${isOpen ? 'rotate-180' : ''
                                                    }`}
                                                aria-hidden="true"
                                            >
                                                <DownArrowIcon className="w-[22px] h-[22px]" stroke="#23262A" />
                                            </div>
                                        </button>

                                        {isOpen ? (
                                            <div className="mt-[20px]">
                                                <p className="whitespace-pre-line text-[14px] font-[Inter-Regular] leading-[26px] text-[#23262A]">
                                                    {item.answer}
                                                </p>
                                            </div>
                                        ) : null}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

            </div>

            <AutoFillLink
                isOpen={isAutofillModalOpen}
                autofillAdLink={autofillAdLink}
                setAutofillAdLink={setAutofillAdLink}
                autofillTouched={autofillTouched}
                setAutofillTouched={setAutofillTouched}
                isValidAutofillLink={isValidAutofillLink}
                isAutofillLoading={isAutofillLoading}
                autofillError={autofillError}
                handleCloseAutofillModal={handleCloseAutofillModal}
                handleConfirmAutofill={handleConfirmAutofill}
                previewImage={carevaluations}
                previewData={autofillItemData}
                invalidHelperText={AUTOFILL_ERROR_MSG}
                invalidSubText={AUTOFILL_ERROR_SUB_MSG}
            />

        </div>
    )
}

export default CarEvaluation
