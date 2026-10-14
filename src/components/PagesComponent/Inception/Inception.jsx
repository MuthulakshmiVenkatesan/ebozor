'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UploadLinkIcon, FormDownArrowIcon, TickIcon, CategoryIcon, PaginationPrevIcon, PaginationNextIcon, DownArrowIcon } from '@/components/CustomFile/icons'
import { getPackageApi, getUserDetailApi } from '@/utils/api'
import { useSelector } from 'react-redux'
import { userSignUpData } from '@/redux/reuducer/authSlice'
import carbannergrid from '../../../../public/assets/img/car/carbannergrid.svg'
import carbanner from '../../../../public/assets/img/car/carbanner.png'
import car from '../../../../public/assets/img/car/choose/car.png'
import report from '../../../../public/assets/img/car/choose/report.png'
import certified from '../../../../public/assets/img/car/choose/certified.png'
import rating from '../../../../public/assets/img/car/choose/rating.png'
import dollar from '../../../../public/assets/img/car/choose/dollar.png'
import speed from '../../../../public/assets/img/car/choose/speed.png'
import clock from '../../../../public/assets/img/car/choose/clock.png'
import bulb from '../../../../public/assets/img/car/bulb.png'
import tabby from '../../../../public/assets/img/car/tabby.svg'
import check from '../../../../public/assets/img/icons/check.svg'
import phoneoutgoing from '../../../../public/assets/img/icons/phoneoutgoing.svg'
import emailopen from '../../../../public/assets/img/icons/emailopen.svg'
import phonewhite from '../../../../public/assets/img/icons/phonewhite.svg'

const INCEPTION_BOOKING_STORAGE_KEY = 'inception_booking_payload'

const inspectionHighlights = [
    {
        icon: car,
        iconAlt: 'Car inspections',
        title: '100,000+',
        subtitle: 'Car Inspections',
    },
    {
        icon: report,
        iconAlt: 'Online reports',
        title: 'Instant',
        subtitle: 'Online Reports',
    },
    {
        icon: certified,
        iconAlt: 'Certified mechanics',
        title: 'Certified Mechanics',
        subtitle: '20+ Years of Experience',
    },
    {
        icon: rating,
        iconAlt: 'Average customer rating',
        title: '4.7/5 Average',
        subtitle: 'Customer Rating',
    },
]

const inspectionBenefits = [
    {
        icon: dollar,
        iconAlt: 'Avoid surprises',
        title: 'Avoid Surprises',
        subtitle: 'Save thousands on costly repairs',
    },
    {
        icon: speed,
        iconAlt: 'Hidden issues',
        title: 'Hidden Issues',
        subtitle: '70% of cars have hidden defects',
    },
    {
        icon: report,
        iconAlt: 'Trusted reports',
        title: 'Trusted Reports',
        subtitle: '120 or 240-point detailed report',
    },
    {
        icon: clock,
        iconAlt: 'Convenient inspection',
        title: 'Convenient',
        subtitle: 'Quick inspection anywhere, anytime',
    },
]

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
        question: 'How long does a vehicle inspection take, and when can I schedule it?',
        answer:
            'A Ebozor car inspection typically takes around 60 minutes, and you receive the report on the spot once it’s completed. You can schedule an inspection at your convenience, with same-day appointments and flexible time slots available from 9:00 AM to midnight. On-site Ebozor hubs generally operate from 9:00 AM to 6:00 PM, except the Al Quoz hub in Dubai, which stays open until 7:00 PM.',
    },
    {
        question: 'What are the types of inspections available, their cost, and what’s included in each?',
        answer:
            'Ebozor offers two inspection packages:\n\nStandard Inspection (120 points) - AED 369 + VAT\nAdvanced Inspection (240 points) - AED 569 + VAT\n\nBoth include a complete digital report with images, mechanical checks, and condition notes. The Advanced package provides deeper diagnostics and additional component checks for buyers who want a more detailed assessment.',
    },
    {
        question: 'Where does Ebozor provide inspections, and what are the available hub locations?',
        answer:
            'Ebozor provides vehicle inspections all across the UAE, including major cities like Dubai, Abu Dhabi, and Sharjah, as well as remote areas with the convenience of coming to your doorstep.\n\nFor those preferring on-site inspections, you can visit one of the dedicated Ebozor hubs located at:\n• Ebozor Hub, Al Quoz, Dubai\n• Ebozor Cars - The Yard, Al Quoz, Dubai\n• Ebozor Cars - Al Qusais, Dubai\n• Ebozor Cars - The Hub, Abu Dhabi',
    },
    {
        question:
            'What is the purpose of the inspection, and can it be used for registration or final purchase decisions?',
        answer:
            'The purpose of the Ebozor car inspection is to assess the current condition of a used vehicle, primarily to help buyers and sellers make informed decisions. It is especially useful before purchasing a car to uncover any hidden issues, or before selling to provide a verified condition report. Regular inspections can also help maintain vehicle safety and prevent costly repairs over time.\n\nHowever, this inspection is not valid for vehicle registration or renewal purposes. It is a pre-purchase condition assessment and is designed solely to guide your decision-making. While the Standard and Advanced inspection reports offer detailed insights, it’s advisable to consider an additional Tasjeel Comprehensive or OEM inspection if you want a more exhaustive evaluation before finalizing your purchase.',
    },
    {
        question: 'What happens in case of post-inspection issues, missed appointments, or rescheduling needs?',
        answer:
            'If the inspection uncovers serious issues with the vehicle, you can use the report to negotiate with the seller or reconsider your purchase entirely. In case the seller misses the appointment or the vehicle isn’t presented on time, we’ll promptly reschedule the inspection to suit your availability. If the car is sold before the inspection, you’re eligible for a 100% refund or can choose to reschedule the inspection for another vehicle. For any concerns regarding the contents of the report, you can reach out to Ebozor’s support center or email us at cars@Ebozor.com, and our team will assist you with further clarification.',
    },
    {
        question: 'How reliable is the Ebozor inspection report in assessing a used car’s condition, and what should I know about its accuracy, limitations, and the inspector’s credibility?',
        answer:
            'The Ebozor inspection report provides a professional assessment of the car’s current condition at the time of inspection, offering valuable insights across key areas such as engine performance, transmission, suspension, steering, brakes, electrical systems, and more. Ebozor’s inspectors are highly trained and equipped with tools like OBD scanners and Elcometers, enabling them to detect visible faults and evaluate various components with technical precision\n\nHowever, it’s important to understand the limitations of the report. It does not guarantee the lifespan or future reliability of car components, nor can it verify agency service history unless the seller provides that information. Ebozor does not disassemble any parts during inspection, meaning it remains a non-invasive, visual process. Any potential flood damage can only be speculated based on visible signs—Ebozor has no access to official flood declarations from agencies or insurers. Similarly, odometer readings are checked against defined markers, but tampering may still go undetected in rare cases.\n\nWhen reviewing the report, pay close attention to remarks that go beyond “no visible fault.” Flags like “leak,” “vibration,” “rust,” or “abnormal” require extra caution and might warrant third-party verification. Highlights in red or points marked as faulty should be reviewed thoroughly.\n\nIn summary, the Ebozor inspection report is a reliable tool for assessing the visible and accessible condition of a used car. While it is conducted by credible and well-trained inspectors, it does not replace agency verification or provide future performance guarantees. Buyers are encouraged to use the report as a decision-making aid while also considering additional checks where necessary.',
    },
    {
        question: 'What does the inspection include, and how accurate or detailed is it regarding damage, history, and electrical issues?',
        answer:
            'The Ebozor inspection report provides a professional assessment of the car’s current condition at the time of inspection, offering valuable insights across key areas such as engine performance, transmission, suspension, steering, brakes, electrical systems, and more. Ebozor’s inspectors are highly trained and equipped with tools like OBD scanners and Elcometers, enabling them to detect visible faults and evaluate various components with technical precision.',
    },
    {
        question: 'How are issues like oil leaks and paintwork categorized in the inspection report?',
        answer:
            'The Ebozor inspection provides a comprehensive evaluation of the vehicle’s current condition. It includes checks on mechanical components such as the engine, brakes, suspension, and tires; assessments of the exterior and interior condition; a road test; under-chassis inspection; flood and rust detection; and a computer diagnostic test (OBD scan) in the Advanced Inspection. Accident history, odometer verification, and service records are reviewed when available, though their accuracy depends on data provided by the seller or accessible databases.\n\nWhile the inspection can identify visible damage or signs of previous repairs, it does not involve disassembly of any parts and may not confirm a complete accident history. Electrical or sensor-related issues (like airbags) are generally not covered in the Standard Inspection but may be detected in the Advanced Inspection. Additionally, web-based accident history checks in the UAE are not fully reliable or comprehensive across all emirates.',
    },
    {
        question: 'Is my presence required at the inspection?',
        answer:
            'No. You are less likely to interrupt your schedule, as our service is designed for your convenience. Our Inspectors can visit your home, office, or any preferred location or time.'
    },
    {
        question: 'Is the Ebozor car inspection service available for all car brands?',
        answer:
            'Yes, we inspect cars of all makes and models, including Toyota, BMW, Mercedes, Ford, Porsche and Dodge.'
    },
    {
        question: 'What documents do I need for booking a car inspection?',
        answer:
            'No documents are required to book a vehicle inspection. Simply request the Ebozor Car Inspection service, and we will handle the rest. The buyer only needs to provide payment and either the vehicle listing or the seller’s contact information. Our team will coordinate the inspection and deliver a comprehensive digital report directly to the buyer, all from the comfort of their home.',
    },
    {
        question: 'How does Ebozor identify the trim or variant of the car?',
        answer:
            'While we strive to identify all trims available in the market, it must be noted that Ebozor\'s methodology in identifying trims is its own and is not affiliated with any OEMs (Original Equipment Manufacturer). To introduce a further level of accuracy, Ebozor and its staff will always request the customer to cross validate from the OEM directly.',
    },
    {
        question: 'How is the battery percentage calculated? What does it indicate about the remaining lifespan of the battery?',
        answer:
            'If the Ebozor report shows the battery life is above 50%, it means the battery is currently in good condition. However, as it is an electrical component, the exact remaining lifespan cannot be accurately determined.',
    },
    {
        question: 'What are the performance parameters against which Car Specs & Features are judged?',
        answer:
            'Ebozor inspections cover the specs and features of a car insofar as to identify their availability. We recommend the customer during the test drive to test the functionality of features marked “Available” in this section for their convenience and due diligence.',
    },
]

const inspectionWorkSteps = [
    {
        title: 'Book Car Inspection',
        description: 'Sign up and pay online. We handle the rest from here.',
        badgeTitle: 'Get Inspection Report',
    },
    {
        title: 'Car Gets Inspected',
        description: 'Our certified mechanics inspect your car.',
        badgeTitle: 'Inspection Checklist',
    },
    {
        title: 'Receive Your Report',
        description: 'The inspection report is sent instantly to your email.',
        badgeTitle: 'Detailed Vehicle Report',
    },
]

const inspectionWorkStepVideos = [
    '/assets/video/carinceptions.mp4',
    '/assets/video/carchecks.mp4',
    '/assets/video/carreport.mp4',
]

const INSPECTION_WORK_STEP_MS = 3000

const inspectionPackages = [
    {
        price: '569',
        title: 'Advanced',
        subtitle: '240-point inspection',
        installment: 'Pay in 4 payments of AED 149.36 with',
        features: [
            'Doorstep Inspection',
            'Exterior & Body',
            'Engine & Transmission',
            'Brakes & Suspension',
            'Electrical Systems & Controls',
            'Rims & Tyres Condition',
            'Road Test',
            'Chassis Condition',
            'Under Body examination',
            'Computerized Diagnostic Scan',
            'Accident History Check',
        ],
    },
    {
        price: '369',
        title: 'Standard',
        subtitle: '120-point inspection',
        installment: 'Pay in 4 payments of AED 96.86 with',
        features: [
            'Doorstep Inspection',
            'Exterior & Body',
            'Engine & Transmission',
            'Brakes & Suspension',
            'Electrical Systems & Controls',
            'Rims & Tyres Condition',
            'Road Test',
        ],
    },
]

function parseApiPayload(payload) {
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

const Inception = () => {
    const router = useRouter()
    const userData = useSelector(userSignUpData)
    const [currentSlide, setCurrentSlide] = useState(0)
    const [visibleSlides, setVisibleSlides] = useState(3)
    const [openFaq, setOpenFaq] = useState(null)
    const [activeWorkStep, setActiveWorkStep] = useState(0)
    const [workStepFillProgress, setWorkStepFillProgress] = useState(0)
    const [activeCountryDropdown, setActiveCountryDropdown] = useState(null)
    const [selectedPrimaryCountry, setSelectedPrimaryCountry] = useState(countryCodeOptions[7])
    const [selectedSellerCountry, setSelectedSellerCountry] = useState(countryCodeOptions[7])
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
    const [prefillName, setPrefillName] = useState('')
    const [prefillPhone, setPrefillPhone] = useState('')
    const [sellerPhone, setSellerPhone] = useState('')
    const [prefillLoading, setPrefillLoading] = useState(true)
    const [inspectionPackageData, setInspectionPackageData] = useState(inspectionPackages)
    const [inspectionPackageLoading, setInspectionPackageLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        const run = async () => {
            try {
                setInspectionPackageLoading(true)
                const response = await getPackageApi.getPackage({ type: 'inception' })
                const parsed = parseApiPayload(response?.data)
                const rows = Array.isArray(parsed?.data) ? parsed.data : []

                const byName = new Map(
                    rows.map((row) => [String(row?.name || '').trim().toLowerCase(), row])
                )

                const merged = inspectionPackages.map((pkg) => {
                    const matched = byName.get(String(pkg.title || '').trim().toLowerCase())
                    if (!matched) return pkg
                    const priceValue = matched?.final_price ?? matched?.price ?? pkg.price
                    const pointsValue = matched?.item_limit
                    return {
                        ...pkg,
                        price: String(priceValue ?? pkg.price),
                        subtitle: pointsValue ? `${pointsValue}-point inspection` : pkg.subtitle,
                    }
                })

                if (!cancelled) {
                    setInspectionPackageData(merged)
                }
            } catch {
                if (!cancelled) {
                    setInspectionPackageData(inspectionPackages)
                }
            } finally {
                if (!cancelled) setInspectionPackageLoading(false)
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        let cancelled = false
        const run = async () => {
            const userId = userData?.id ?? userData?.data?.id ?? userData?.user?.id ?? null
            if (!userId) {
                if (!cancelled) setPrefillLoading(false)
                return
            }
            try {
                setPrefillLoading(true)
                const response = await getUserDetailApi.getUserDetail({ user_id: userId })
                const parsed = parseApiPayload(response?.data)
                const row = parsed?.data && typeof parsed.data === 'object' ? parsed.data : {}
                const firstName = String(row?.name || '').trim()
                const lastName = String(row?.last_name || '').trim()
                const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
                const mobileVerified = Number(row?.mobile_verify) === 1
                const rawMobile = mobileVerified ? String(row?.mobile || '').trim() : ''
                let resolvedCountry = countryCodeOptions[8]
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
                if (!cancelled) {
                    setPrefillName(fullName)
                    setSelectedPrimaryCountry(resolvedCountry)
                    setPrefillPhone(localMobile)
                }
            } catch {
                if (!cancelled) {
                    setPrefillName('')
                    setPrefillPhone('')
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

    const handleBookInspectionClick = () => {
        if (!checked) {
            setShowTermsError(true)
            return
        }

        setShowTermsError(false)
        if (typeof window !== 'undefined') {
            const payload = {
                user_number: `${selectedPrimaryCountry?.code || ''}${String(prefillPhone || '').trim()}`,
                seller_number: `${selectedSellerCountry?.code || ''}${String(sellerPhone || '').trim()}`,
            }
            window.localStorage.setItem(INCEPTION_BOOKING_STORAGE_KEY, JSON.stringify(payload))
        }
        router.push('/inceptionpackage')
    }

    const handleRequestCallBackClick = async () => {
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
                                <span className="bg-[linear-gradient(90deg,#E00000_0%,#5A3333_100%)] bg-clip-text text-transparent">Ebozor</span> Car Inspection
                            </h1>
                            <p className="max-w-[560px] max-sm:max-w-full text-[18px] font-[Inter-Regular] leading-[1.3] text-[#23262A]">
                                Book a pre-purchase car inspection anywhere in the UAE. Starting from AED 369.
                            </p>

                            {/* <button
                                type="button"
                                className="cursor-pointer w-fit inline-flex items-center gap-[8px] rounded-[6px] border border-[#DC0000] bg-white px-[16px] py-[8px] text-[14px] font-[Inter-SemiBold] text-[#DC0000]"
                            >
                                Sample Inspection Report
                                <UploadLinkIcon className="w-[16px] h-[16px]" fill="#DC0000" />
                            </button> */}
                        </div>

                        <div className="relative mt-[24px]">
                            <Image
                                src={carbanner}
                                alt="Car inspection visual"
                                width={600}
                                height={365}
                                className="w-[600px] h-[365px] object-cover"
                            />
                        </div>
                    </div>

                    <div className="shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.02),0px_3px_8px_rgba(0,0,0,0.02),0px_1px_10px_rgba(0,0,0,0.04)] bg-white rounded-[6px] p-[30px_20px] h-fit">

                        <div className='flex flex-col gap-[4px] mb-[20px]'>
                            <h2 className="text-[22px] font-[Inter-Bold] leading-[1.2] text-[#23262A]">
                                Book Car Inspection
                            </h2>
                            <p className="text-[14px] font-[Inter-Regular] leading-[1.3] text-[#23262A]">
                                Fill out this form and secure your inspection slot in minutes!
                            </p>
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
                                                            className={`flex w-full items-center gap-[10px] px-[12px] py-[8px] text-left text-[16px] font-[Inter-Regular] hover:bg-[#F7F7F8] ${selectedPrimaryCountry.code === country.code &&
                                                                selectedPrimaryCountry.label === country.label
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
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="mb-[6px] block text-[16px] font-[Inter-SemiBold] text-[#3a3f47]">
                                    Seller Phone Number
                                </label>
                                <div className="relative">
                                    <div className="flex overflow-hidden rounded-[8px] border border-[rgba(143,143,143,0.45)] bg-white">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setActiveCountryDropdown((prev) => (prev === 'seller' ? null : 'seller'))
                                            }
                                            className="cursor-pointer flex shrink-0 items-center px-[14px] justify-center gap-[12px] border-r border-[rgba(143,143,143,0.45)] bg-white"
                                        >
                                            <p className="">{selectedSellerCountry.flag}</p>
                                            <FormDownArrowIcon className="w-[16px] h-[16px]" fill="#23262A" />
                                        </button>
                                        <input
                                            type="tel"
                                            value={sellerPhone}
                                            onChange={(e) => setSellerPhone(e.target.value)}
                                            className="h-full w-full bg-white p-[14px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                                        />
                                    </div>

                                    {activeCountryDropdown === 'seller' ? (
                                        <div className="absolute left-0 top-[56px] z-20 max-h-[280px] w-full overflow-y-auto rounded-[8px] border border-[rgba(35,38,42,0.15)] bg-white py-[6px] shadow-[0_8px_20px_rgba(35,38,42,0.12)]">
                                            {countryCodeOptions.map((country) => (
                                                <button
                                                    key={`${country.label}-${country.code}-seller`}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedSellerCountry(country)
                                                        setActiveCountryDropdown(null)
                                                    }}
                                                    className={`flex w-full items-center gap-[10px] px-[12px] py-[8px] text-left text-[16px] font-[Inter-Regular] hover:bg-[#F7F7F8] ${selectedSellerCountry.code === country.code &&
                                                        selectedSellerCountry.label === country.label
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
                                className="cursor-pointer mt-[30px] p-[14px_16px] w-full rounded-[6px] bg-[#DC0000] text-[14px] font-[Inter-SemiBold] text-white transition"
                            >
                                Book Inspection
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
                            Why choose Ebozor Cars Inspection
                        </h2>
                        <p className="text-[18px] leading-[1.3] text-[#23262A] font-[Inter-Regular]">
                            GCC&apos;s leading car marketplace and services provider. Trusted by millions.
                        </p>
                    </div>

                    <div className="shadow-[0px_1px_10px_0px_#0000000A] rounded-[16px]">
                        <div className="grid grid-cols-4 max-sm:grid-cols-1">
                            {inspectionHighlights.map((item, index) => (
                                <div
                                    key={item.title}
                                    className={`flex flex-col items-center gap-[4px] p-[20px] text-center ${index !== inspectionHighlights.length - 1 ? '' : ''} ${index % 2 === 0 ? '' : ''} ${index < 2 ? '' : ''}`}
                                >
                                    <Image src={item.icon} alt={item.iconAlt} width={58} height={58} className='object-contain w-[58px] h-[58px] ' />
                                    <h3 className="mb-[6px] text-[24px] leading-[1.1] text-[#23262A] font-[Inter-SemiBold]">
                                        {item.title}
                                    </h3>
                                    <p className="text-[18px] leading-[1.2] text-[#666b72] font-[Inter-Regular]">
                                        {item.subtitle}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                <div className="p-[60px_0]">
                    <div className="text-center mb-[40px]">
                        <h2 className="mb-[14px] text-[28px] leading-[1.2] text-[#23262A] font-[Inter-Bold] ">
                            How Ebozor Car Inspection Works
                        </h2>
                        <p className="text-[18px] leading-[1.3] text-[#23262A] font-[Inter-Regular]">
                            Our 3-step inspection process helps you buy with confidence and avoid unexpected repair
                            costs.
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
                    <div className="text-center mb-[40px]">
                        <h2 className="mb-[14px] text-[28px] leading-[1.2] text-[#23262A] font-[Inter-Bold] ">
                            Benefits of Getting a Car Inspection
                        </h2>
                    </div>

                    <div className="grid grid-cols-4 gap-[6px] max-sm:grid-cols-1 mb-[50px]">
                        {inspectionBenefits.map((item) => (
                            <div
                                key={item.title}
                                className="shadow-[0px_1px_10px_0px_rgba(0,0,0,0.04),0px_3px_8px_0px_rgba(0,0,0,0.02),0px_4px_8px_-2px_rgba(0,0,0,0.02)] border border-[#e0e1e3] rounded-[8px] bg-[linear-gradient(180deg,rgba(255,255,255,0.6)_0%,rgba(242,247,254,0.6)_100%)] p-[16px_6px] flex flex-col gap-[6px] items-center justify-center text-center"
                            >
                                <div className="flex h-[75px] w-[75px] items-center justify-center ">
                                    <Image src={item.icon} alt={item.iconAlt} width={75} height={75} className='object-contain w-[75px] h-[75px] ' />
                                </div>
                                <h3 className="text-[22px] font-[Inter-SemiBold] leading-[1.2] text-[#23262A]">
                                    {item.title}
                                </h3>
                                <p className="text-[18px] font-[Inter-Regular] leading-[1.25] text-[#666b72]">
                                    {item.subtitle}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mx-auto  flex w-fit items-center gap-[8px] rounded-[6px] bg-[#FFF8E1] p-[12px]">
                        <Image src={bulb} alt="Inspection insight" width={18} height={18} />
                        <p className="text-[18px] font-[Inter-Regular] leading-[1.3] text-[#23262A]">
                            1 in 5 buyers change their mind after inspection.
                        </p>
                    </div>
                </div>

                <div className="p-[60px_0]">
                    <div className="text-center mb-[40px]">
                        <h2 className="mb-[14px] text-[28px] leading-[1.2] text-[#23262A] font-[Inter-Bold] ">
                            Car Inspection Packages Tailored to Your Needs
                        </h2>
                        <p className="w-[600px] mx-auto max-sm:w-full text-[18px] leading-[1.3] text-[#23262A] font-[Inter-Regular]">
                            Choose between a 120-point Standard inspection or a 240-point Advanced inspection for
                            complete peace of mind.
                        </p>
                    </div>

                    {inspectionPackageLoading ? (
                        <div className="flex items-center gap-[28px] justify-center max-sm:flex-col">
                            {[0, 1].map((idx) => (
                                <div
                                    key={`inspection-package-skeleton-${idx}`}
                                    className="w-[40%] max-sm:w-full overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.16)] bg-white p-[20px]"
                                >
                                    <div className="h-[56px] w-[180px] animate-pulse rounded-[8px] bg-[#ECECEC]" />
                                    <div className="mt-[20px] h-[16px] w-[60%] animate-pulse rounded-[6px] bg-[#ECECEC]" />
                                    <div className="mt-[10px] h-[16px] w-[80%] animate-pulse rounded-[6px] bg-[#ECECEC]" />
                                    <div className="mt-[10px] h-[22px] w-[40%] animate-pulse rounded-[6px] bg-[#ECECEC]" />
                                    <div className="mt-[10px] h-[16px] w-[55%] animate-pulse rounded-[6px] bg-[#ECECEC]" />
                                    <div className="mt-[20px] h-[40px] w-[150px] animate-pulse rounded-[8px] bg-[#ECECEC]" />
                                    <div className="mt-[20px] border-t border-[rgba(143,143,143,0.18)] pt-[20px]">
                                        {Array.from({ length: 6 }).map((_, row) => (
                                            <div key={row} className="mb-[10px] flex items-center gap-[14px]">
                                                <div className="h-[25px] w-[25px] animate-pulse rounded-full bg-[#ECECEC]" />
                                                <div className="h-[14px] w-[70%] animate-pulse rounded-[6px] bg-[#ECECEC]" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                    <div className="flex items-center gap-[28px] justify-center max-sm:flex-col">
                        {inspectionPackageData.map((pkg) => (
                            <div
                                key={pkg.title}
                                className="w-[40%] max-sm:w-full overflow-hidden rounded-[10px] shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.02),0px_3px_8px_rgba(0,0,0,0.02),0px_1px_10px_rgba(0,0,0,0.04)] bg-white hover:bg-[#E000000A] group border border-transparent hover:border-[#DC0000] transition border-t-[8px]"
                            >
                                <div className="p-[20px]">
                                    <h4 className="text-[26px] font-[Inter-Bold] leading-[1.1] text-[#23262A] max-sm:text-[36px]">
                                        AED
                                        <span className="text-[46px] max-sm:text-[36px]">{pkg.price}</span>
                                    </h4>
                                    <div className="mt-[20px] flex flex-col gap-[6px] mb-[30px]">
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262A] ">
                                            (exclusive of 5% tax)
                                        </p>
                                        <div className="flex items-center gap-[6px]">
                                            <p className="text-[14px] italic font-[Inter-Regular] leading-[1.3] text-[#23262A]">
                                                {pkg.installment}{' '}

                                            </p>
                                            <Image src={tabby} alt="tabby" width={60} height={20} className='object-contain w-[60px] h-[20px] ' />
                                        </div>
                                        <h3 className="text-[22px] font-[Inter-SemiBold] leading-[1.2] text-[#23262A] ">
                                            {pkg.title}
                                        </h3>
                                        <h4 className="text-[16px] font-[Inter-Regular] leading-[1.25] text-[#23262A] ">
                                            {pkg.subtitle}
                                        </h4>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={scrollToBookInspectionSection}
                                        className="group-hover:bg-[#DC0000] group-hover:text-white transition cursor-pointer inline-flex items-center gap-[8px] rounded-[8px] bg-[#E000000A] px-[30px] py-[10px] text-[14px] font-[Inter-SemiBold] text-[#DC0000] "
                                    >
                                        Select Package
                                        <CategoryIcon className="w-[18px] h-[18px] shrink-0 [&>path]:fill-[#DC0000] group-hover:[&>path]:fill-white" />
                                    </button>
                                </div>

                                <div className="border-t border-[rgba(143,143,143,0.18)] p-[20px]">
                                    <ul className="flex flex-col gap-[10px] mb-[28px] h-[375px] max-sm:h-fit">
                                        {pkg.features.map((feature) => (
                                            <li key={feature} className="flex items-center gap-[14px]">
                                                <div className="w-[25px] h-[25px] flex items-center justify-center bg-[#C2E4C3] rounded-full">
                                                    <Image
                                                        src={check}
                                                        alt=""
                                                        width={16}
                                                        height={16}
                                                        className='object-contain w-[16px] h-[16px] '
                                                    />
                                                </div>
                                                <p className="text-[14px] font-[Inter-Regular] leading-[1.3] text-[#23262A]">
                                                    {feature}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        type="button"
                                        className="cursor-pointer inline-flex items-center gap-[8px] text-[14px] font-[Inter-SemiBold] text-[#DC0000] hover:bg-[#E000000A] rounded-[8px] px-[20px] py-[10px]"
                                    >
                                        View Sample Report
                                        <UploadLinkIcon className="w-[18px] h-[18px]" fill="#DC0000" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    )}
                </div>



                <div className="p-[60px_0]">
                    <div className="text-center mb-[40px]">
                        <h2 className="mb-[14px] text-[28px] leading-[1.2] text-[#23262A] font-[Inter-Bold] ">
                            What Our Customers Say
                        </h2>
                        <p className="text-[18px] leading-[1.3] text-[#23262A] font-[Inter-Regular]">
                            Hear from customers who made confident car purchases using Ebozor inspections!
                        </p>
                    </div>

                    <div className="mb-[28px] flex items-center justify-between">
                        <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">Google Reviews</p>

                        <div className="flex items-center gap-[10px]">
                            <button
                                type="button"
                                aria-label="Previous reviews"
                                onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
                                disabled={currentSlide === 0}
                                className="cursor-pointer flex h-[40px] w-[40px] items-center justify-center rounded-full border border-[rgba(143,143,143,0.18)] bg-white transition disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <PaginationPrevIcon className="w-[10px] h-[10px] rtl:rotate-180" stroke="#000" />
                            </button>
                            <button
                                type="button"
                                aria-label="Next reviews"
                                onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, maxSlideIndex))}
                                disabled={currentSlide === maxSlideIndex}
                                className="cursor-pointer flex h-[40px] w-[40px] items-center justify-center rounded-full border border-[rgba(143,143,143,0.18)] bg-white transition disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <PaginationNextIcon className="w-[10px] h-[10px] rtl:rotate-180" stroke="#000" />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-hidden">
                        <div
                            className="flex transition-transform duration-300 ease-in-out gap-[10px]"
                            style={{
                                transform: `translateX(-${(currentSlide * 100) / visibleSlides}%)`,
                            }}
                        >
                            {customerReviews.map((item) => (
                                <div
                                    key={item.name}
                                    className="shrink-0"
                                    style={{ width: `${98 / visibleSlides}%` }}
                                >
                                    <div className="h-full min-h-[220px] rounded-[24px] border border-[rgba(143,143,143,0.18)] bg-white p-[16px]">
                                        <h4 className="text-[14px] font-[Inter-Medium] text-[#23262A] mb-[20px]">{item.name}</h4>
                                        <h3 className="text-[18px] font-[Inter-Bold] leading-[1.2] text-[#23262A] mb-[4px]">
                                            {item.headline}
                                        </h3>
                                        <p className="text-[14px] font-[Inter-Regular] leading-[1.55] text-[#3A3F47]">
                                            {item.review}
                                        </p>
                                    </div>
                                </div>
                            ))}
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
                                    defaultValue="Muthulakshmi"
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
                                            defaultValue="+971521121006"
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

        </div>
    )
}

export default Inception
