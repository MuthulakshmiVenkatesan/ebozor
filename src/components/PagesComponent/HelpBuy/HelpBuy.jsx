'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PaginationPrevIcon, PaginationNextIcon, StarIcon, DownArrowIcon, UploadLinkIcon } from '@/components/CustomFile/icons'
import Header from '../SellMyCar/components/Header'
import Footer from '../SellMyCar/components/Footer'
import Certificate from './components/Certificate'
import greenrating from '../../../../public/assets/img/icons/greenrating.svg'
import reviewquote from '../../../../public/assets/img/icons/reviewquote.svg'
import sellcarbg from '../../../../public/assets/img/sellcar/sellcarbg.jpg'
import help1 from '../../../../public/assets/img/sellcar/help1.jpg'
import help2 from '../../../../public/assets/img/sellcar/help2.jpg'
import help3 from '../../../../public/assets/img/sellcar/help3.jpg'
import help4 from '../../../../public/assets/img/sellcar/help4.png'
import convenience from '../../../../public/assets/img/sellcar/convenience.png'
import service from '../../../../public/assets/img/sellcar/service.png'
import trust from '../../../../public/assets/img/sellcar/trust.png'
import mercedes from '../../../../public/assets/img/sellcar/inspect/1.png'
import ford from '../../../../public/assets/img/sellcar/inspect/2.png'
import bmw from '../../../../public/assets/img/sellcar/inspect/3.png'
import audi from '../../../../public/assets/img/sellcar/inspect/4.png'
import whatsappwhite from '../../../../public/assets/img/icons/whatsappwhite.svg'
import InsuranceModal from './components/InsuranceModal'
import HelpBuyStickyNav, { SERVICE_NAV } from './components/HelpBuyStickyNav'
import validatecheck from '../../../../public/assets/img/icons/validatecheck.svg'
import { formatHelpBuyPhone, HELP_BUY_SERVICE_OPTIONS, submitHelpMeBuyForm } from './helpBuyFormUtils'

const sellMyCarTestimonials = [
    {
        name: 'Momin Mehmood',
        date: 'July 30, 2024',
        text: 'I recently bought a new car and requested an inspection before finalizing the purchase. Amjad conducted the inspection, and I was happier with the experience. The report was thorough and helped me make a confident decision.',
    },
    {
        name: 'Sarah Al Mansoori',
        date: 'March 12, 2024',
        text: 'Selling through ebozor was straightforward. The team kept me updated at every step and the offer matched what we discussed after inspection.',
    },
    {
        name: 'James Porter',
        date: 'January 8, 2024',
        text: 'Professional service from listing to handover. I would recommend ebozor Cars to anyone who wants a hassle-free sale.',
    },
]

const whySellStats = [
    { stat: 'Convenience', label: 'Enjoy the ultimate comfort with our convenient car buying experience', icon: convenience },
    { stat: 'Quality Service', label: 'Experience exceptional service, where quality is our top priority', icon: service },
    { stat: 'Trust', label: 'Trained and trusted Industry Professionals', icon: trust },
]

const preInspectedBrands = [
    { id: 'mercedes', label: 'Mercedes-Benz cars', icon: mercedes },
    { id: 'ford', label: 'Ford cars', icon: ford },
    { id: 'bmw', label: 'BMW cars', icon: bmw },
    { id: 'audi', label: 'Audi cars', icon: audi },
]

const branchCards = [
    { city: 'Dubai', location: 'Qusais' },
    { city: 'Dubai', location: 'The Hub' },
    { city: 'Dubai', location: 'The Yard' },
    { city: 'Abu Dhabi', location: 'The Hub' },
]

const marketLinksColumns = [
    {
        title: 'Used Cars in UAE',
        links: [
            'Used Cars in UAE',
            'Used Cars in Dubai',
            'Used Cars in Abu Dhabi',
            'Used Cars in Sharjah',
            'Used Cars in Ajman',
            'Used Cars in Al Ain',
            'Used Cars in Fujairah',
            'Used Cars in Ras Al Khaimah',
            'Used Cars in Umm Al Quwain',
        ],
    },
    {
        title: 'New Cars in UAE',
        links: [
            'New Cars in UAE',
            'New Cars in Dubai',
            'New Cars in Abu Dhabi',
            'New Cars in Sharjah',
            'New Cars in Ajman',
            'New Cars in Al Ain',
        ],
    },
    {
        title: 'Export Cars in UAE',
        links: [
            'Export Cars in UAE',
            'Export Cars in Dubai',
            'Export Cars in Sharjah',
            'Export Cars in Ajman',
            'Export Cars in UAQ',
        ],
    },
]

const sellMyCarHowToSellUaeAnswer = (
    <div className="text-[14px] font-[Inter-Regular] leading-[26px] text-[#23262A]">
        <ol className="ml-[0.35rem] list-decimal space-y-[14px] pl-[14px]">
            <li>
                <span className="font-[Inter-Bold]">Set your price:</span>{' '}
                Research similar cars on ebozor Cars to understand market rates. Set a price that reflects your
                car&apos;s condition and mileage, and leave a little room for negotiation.
            </li>
            <li>
                <span className="font-[Inter-Bold]">Choose how to sell with ebozor Cars:</span>
                <ul className="mt-[8px] list-[circle] space-y-[8px] pl-[22px]">
                    <li>
                        <span className="font-[Inter-Bold]">Post an ad:</span> Create a detailed ad to attract the right
                        buyers.
                    </li>
                    <li>
                        <span className="font-[Inter-Bold]">Let ebozor Cars sell it for you:</span> Skip the effort—ebozor
                        Cars will handle the entire selling process, from advertising to buyer negotiations.
                    </li>
                    <li>
                        <span className="font-[Inter-Bold]">Sell your car to ebozor Cars:</span> Need a quick sale? ebozor
                        Cars can provide a fast offer after inspection.
                    </li>
                </ul>
            </li>
            <li>
                <span className="font-[Inter-Bold]">Advertise without stickers:</span>{' '}
                In the UAE, using &apos;For Sale&apos; stickers on vehicles is prohibited and could lead to fines or
                impoundment. Stick to legal and effective methods by advertising through ebozor Cars&apos; trusted
                platform.
            </li>
            <li>
                <span className="font-[Inter-Bold]">Negotiate smartly:</span>{' '}
                Take your time and negotiate confidently. Highlight your car&apos;s key features, and justify your asking
                price. Buyers often look for value and transparency, so patience is key.
            </li>
            <li>
                <span className="font-[Inter-Bold]">Prepare your documents:</span>
                <ul className="mt-[8px] list-[circle] space-y-[8px] pl-[22px]">
                    <li>Your original Emirates ID or a copy of your passport if ID is unavailable.</li>
                    <li>Clear all outstanding fines and mortgage payments.</li>
                </ul>
            </li>
            <li>
                <span className="font-[Inter-Bold]">Meet the buyer at a vehicle registration centre:</span>{' '}
                Complete the sale by transferring ownership at a registration centre, where the car will be tested and
                officially transferred to the buyer.
            </li>
        </ol>
    </div>
)

const sellMyCarFaqItems = [
    {
        question: 'How to sell a car in the UAE?',
        answer: sellMyCarHowToSellUaeAnswer,
    },
    {
        question: 'How can I sell my car for a good price?',
        answer:
            'Compare your car with similar listings on ebozor Cars, keep service history and condition documentation ready, use clear photos, and price slightly above your minimum so you have room to negotiate. Highlight genuine extras and a clean RTA history when speaking with buyers.',
    },
    {
        question: 'Where can I sell my used car in the UAE?',
        answer:
            'You can sell through licensed online marketplaces such as ebozor Cars, work with dealers or car-buying services, or use consignment and inspection-led sale options. Always complete ownership transfer at an official RTA registration centre.',
    },
    {
        question: 'Can I sell a car with an outstanding auto loan in the UAE?',
        answer:
            'Yes, but the bank&apos;s mortgage on the vehicle must be released before ownership can transfer to the buyer. This usually means settling the loan or the buyer&apos;s bank coordinating a settlement letter. Contact your bank early to understand payoff, clearance timelines, and any early-settlement fees.',
    },
    {
        question: 'How can I sell my car online?',
        answer:
            'Create a detailed listing with accurate mileage and specs, upload quality photos, respond promptly to enquiries, agree on price and payment method, then meet at an RTA centre to transfer ownership. ebozor Cars offers listing, managed sale, and instant-cash routes depending on how quickly you want to sell.',
    },
    {
        question: 'How to get the power of attorney to sell a car?',
        answer:
            'Visit an authorised typing centre or notary public with your Emirates ID, vehicle registration (Mulkiya), and the representative&apos;s ID. A vehicle sale POA allows someone else to complete RTA procedures on your behalf; requirements and fees can vary slightly by emirate, so confirm the latest checklist before your visit.',
    },
    {
        question: 'How long will it take to sell my car on ebozor Cars?',
        answer:
            'Timing depends on make, model, mileage, price, and demand. Many sellers find a buyer within a few weeks when the car is priced competitively. If you need a faster exit, explore instant cash or dealer-offer options after inspection.',
    },
]

const countryCodeOptions = [
    { flag: '🇦🇪', label: 'United Arab Emirates', code: '+971' },
    { flag: '🇦🇫', label: 'Afghanistan', code: '+93' },
    { flag: '🇦🇽', label: 'Aland Islands', code: '+358' },
    { flag: '🇦🇱', label: 'Albania', code: '+355' },
    { flag: '🇩🇿', label: 'Algeria', code: '+213' },
    { flag: '🇦🇸', label: 'American Samoa', code: '+1' },
    { flag: '🇦🇩', label: 'Andorra', code: '+376' },
    { flag: '🇦🇴', label: 'Angola', code: '+244' },
    { flag: '🇦🇮', label: 'Anguilla', code: '+1' },
    { flag: '🇦🇶', label: 'Antarctica', code: '+672' },
    { flag: '🇦🇬', label: 'Antigua and Barbuda', code: '+1' },
    { flag: '🇦🇷', label: 'Argentina', code: '+54' },
    { flag: '🇦🇲', label: 'Armenia', code: '+374' },
    { flag: '🇦🇺', label: 'Australia', code: '+61' },
    { flag: '🇦🇹', label: 'Austria', code: '+43' },
]

const HelpBuy = () => {
    const [testimonialIndex, setTestimonialIndex] = useState(0)
    const [openSellFaq, setOpenSellFaq] = useState(null)
    const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false)
    const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false)
    const [isGetStartedSuccess, setIsGetStartedSuccess] = useState(false)
    const [submitLoading, setSubmitLoading] = useState(false)
    const [formName, setFormName] = useState('')
    const [formEmail, setFormEmail] = useState('')
    const [formPhone, setFormPhone] = useState('')
    const [formServiceType, setFormServiceType] = useState('')
    const [formMessage, setFormMessage] = useState('')
    const [selectedCountryCode, setSelectedCountryCode] = useState(countryCodeOptions[0])
    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false)
    const [countrySearch, setCountrySearch] = useState('')
    const countryDropdownRef = useRef(null)
    const heroSentinelRef = useRef(null)
    const [showStickyServiceNav, setShowStickyServiceNav] = useState(false)
    const [activeServiceSection, setActiveServiceSection] = useState('inspection')
    const maxTestimonialIndex = sellMyCarTestimonials.length - 1
    const activeTestimonial = sellMyCarTestimonials[testimonialIndex]

    const filteredCountryCodes = useMemo(() => {
        const normalizedSearch = countrySearch.trim().toLowerCase()
        if (!normalizedSearch) {
            return countryCodeOptions
        }

        return countryCodeOptions.filter((country) => {
            return (
                country.label.toLowerCase().includes(normalizedSearch) ||
                country.code.toLowerCase().includes(normalizedSearch)
            )
        })
    }, [countrySearch])

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
                setIsCountryDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleOutsideClick)
        return () => document.removeEventListener('mousedown', handleOutsideClick)
    }, [])

    useEffect(() => {
        let ticking = false
        const updateHeroVisibility = () => {
            ticking = false
            const el = heroSentinelRef.current
            if (!el) {
                return
            }
            const { bottom } = el.getBoundingClientRect()
            setShowStickyServiceNav(bottom < 0)
        }
        const onScroll = () => {
            if (!ticking) {
                ticking = true
                requestAnimationFrame(updateHeroVisibility)
            }
        }
        updateHeroVisibility()
        window.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('resize', updateHeroVisibility)
        return () => {
            window.removeEventListener('scroll', onScroll)
            window.removeEventListener('resize', updateHeroVisibility)
        }
    }, [])

    useEffect(() => {
        if (!showStickyServiceNav) {
            return undefined
        }

        const updateActiveFromScroll = () => {
            const marker = 72
            let current = SERVICE_NAV[0].key
            for (const { key, sectionId } of SERVICE_NAV) {
                const el = document.getElementById(sectionId)
                if (!el) {
                    continue
                }
                const top = el.getBoundingClientRect().top
                if (top <= marker) {
                    current = key
                }
            }
            setActiveServiceSection(current)
        }

        let ticking = false
        const onScroll = () => {
            if (!ticking) {
                ticking = true
                requestAnimationFrame(() => {
                    ticking = false
                    updateActiveFromScroll()
                })
            }
        }
        updateActiveFromScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [showStickyServiceNav])

    const scrollToSection = (sectionId) => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const scrollToGetStarted = () => {
        document.getElementById('helpbuy-get-started')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const handleGetStartedSubmit = async () => {
        if (submitLoading) return
        setIsCountryDropdownOpen(false)
        setSubmitLoading(true)
        try {
            await submitHelpMeBuyForm(
                {
                    name: formName,
                    email: formEmail,
                    phone_no: formatHelpBuyPhone(selectedCountryCode.code, formPhone),
                    service_type: formServiceType,
                    message: formMessage,
                },
                {
                    onSuccess: () => setIsGetStartedSuccess(true),
                    successFallback: 'You have successfully generated a callback request.',
                }
            )
        } finally {
            setSubmitLoading(false)
        }
    }

    return (
        <div>
            <Header />
            <HelpBuyStickyNav
                visible={showStickyServiceNav}
                activeKey={activeServiceSection}
                onNavigate={scrollToSection}
                onGetStarted={scrollToGetStarted}
            />
            <div className="bg-[#fff] pb-[80px]">
                <div className="mx-auto max-w-[1170px] px-[15px] common_container">
                    <div
                        ref={heroSentinelRef}
                        className="grid grid-cols-2 max-sm:grid-cols-1 gap-[20px] items-center rounded-[8px] p-[60px] max-sm:p-[20px]"
                        style={{ backgroundImage: `url(${sellcarbg.src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    >
                        <div className="flex flex-col gap-[24px]">
                            <h4 className="text-[40px] leading-[50px] font-[Inter-Medium] text-[#fff] max-sm:text-[24px] max-sm:leading-[30px]">
                                Elevate Your Experience with ebozor Car’s Buying Services
                            </h4>
                            <p className="text-[18px] leading-[28px] font-[Inter-Regular] text-[#fff] max-sm:text-[14px] max-sm:leading-[20px]">
                                Our key car buying services include car inspection, car financing, bank evaluation certificate and car insurance.
                            </p>
                            <button
                                type="button"
                                onClick={() => scrollToSection('helpbuy-inspection')}
                                className="w-fit cursor-pointer inline-flex items-center justify-center rounded-[6px] bg-[#fff] p-[10px_20px] text-[14px] font-[Inter-SemiBold] text-[#DC0000] transition"
                            >
                                Explore Services
                            </button>
                        </div>
                        <div id="helpbuy-get-started">
                            {!isGetStartedSuccess ? (
                                <div className="rounded-[6px] bg-[#ffffff] p-[24px] max-sm:p-[16px]">
                                    <h3 className="mb-[24px] text-center text-[24px] leading-[1.2] font-[Inter-Bold] text-[#000] ">
                                        Get Started Here
                                    </h3>

                                    <div className="space-y-[12px]">
                                        <input
                                            type="text"
                                            placeholder="Name*"
                                            value={formName}
                                            onChange={(event) => setFormName(event.target.value)}
                                            className="h-[52px] w-full rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white px-[14px] text-[14px] font-[Inter-Regular] text-[#222222] outline-none placeholder:text-[#8f8f8f]"
                                        />
                                        <input
                                            type="email"
                                            placeholder="Email*"
                                            value={formEmail}
                                            onChange={(event) => setFormEmail(event.target.value)}
                                            className="h-[52px] w-full rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white px-[14px] text-[14px] font-[Inter-Regular] text-[#222222] outline-none placeholder:text-[#8f8f8f]"
                                        />

                                        <div className="relative" ref={countryDropdownRef}>
                                            <div className="flex h-[52px] overflow-hidden rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCountryDropdownOpen((prev) => !prev)}
                                                    className="cursor-pointer flex shrink-0 items-center gap-[8px] border-r border-[rgba(143,143,143,0.35)] px-[10px] text-[14px] font-[Inter-Regular] text-[#222222]"
                                                >
                                                    <div className="">{selectedCountryCode.flag}</div>
                                                    <DownArrowIcon className="h-[16px] w-[16px]" stroke="#111827" />
                                                </button>
                                                <input
                                                    type="tel"
                                                    placeholder="050 123 4567"
                                                    value={formPhone}
                                                    onChange={(event) => setFormPhone(event.target.value)}
                                                    className="h-full w-full bg-white px-[14px] text-[14px] font-[Inter-Regular] text-[#222222] outline-none placeholder:text-[#8f8f8f]"
                                                />
                                            </div>

                                            {isCountryDropdownOpen ? (
                                                <div className="absolute left-0 top-[56px] z-20 w-full overflow-hidden rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white shadow-[0_8px_24px_rgba(17,24,39,0.12)]">
                                                    <div className="border-b border-[rgba(143,143,143,0.35)] p-[8px]">
                                                        <input
                                                            type="text"
                                                            value={countrySearch}
                                                            onChange={(event) => setCountrySearch(event.target.value)}
                                                            placeholder="Search"
                                                            className="w-full rounded-[4px] text-[14px] font-[Inter-Regular] text-[#222222] outline-none placeholder:text-[#8f8f8f]"
                                                        />
                                                    </div>
                                                    <div className="max-h-[220px] overflow-y-auto py-[4px]">
                                                        {filteredCountryCodes.map((country) => (
                                                            <button
                                                                key={`${country.label}-${country.code}`}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedCountryCode(country)
                                                                    setIsCountryDropdownOpen(false)
                                                                    setCountrySearch('')
                                                                }}
                                                                className={`cursor-pointer flex w-full items-center gap-[10px] px-[10px] py-[10px] text-left ${selectedCountryCode.label === country.label && selectedCountryCode.code === country.code ? 'bg-[#eeeeee]' : 'bg-white'
                                                                    }`}
                                                            >
                                                                <div className="">{country.flag}</div>
                                                                <h4 className="text-[14px] leading-[1.2] font-[Inter-Regular] text-[#222]">{country.label}</h4>
                                                                <p className="text-[#6b7280] font-[Inter-Regular] text-[14px]">{country.code}</p>
                                                            </button>
                                                        ))}
                                                        {filteredCountryCodes.length === 0 ? (
                                                            <p className="px-[10px] py-[10px] text-[14px] font-[Inter-Regular] text-[#6b7280]">
                                                                No country found.
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="relative">
                                            <select
                                                value={formServiceType}
                                                onChange={(event) => setFormServiceType(event.target.value)}
                                                className="h-[52px] w-full appearance-none rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white px-[14px] text-[14px] font-[Inter-Regular] text-[#222222] outline-none"
                                            >
                                                <option value="" disabled>
                                                    Select service*
                                                </option>
                                                {HELP_BUY_SERVICE_OPTIONS.map((service) => (
                                                    <option key={service.value} value={service.value}>
                                                        {service.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <DownArrowIcon className="pointer-events-none absolute right-[10px] rtl:left-[10px] rtl:right-auto top-1/2 h-[20px] w-[20px] -translate-y-1/2" stroke="#111827" />
                                        </div>

                                        <div className="relative rounded-[6px] border border-[#cecece] bg-white px-[12px] pb-[12px] pt-[14px]">
                                            <textarea
                                                rows={2}
                                                placeholder=" "
                                                value={formMessage}
                                                onChange={(event) => setFormMessage(event.target.value)}
                                                className="peer w-full resize-none text-[15px] leading-[1.5] font-[Inter-Regular] text-[#111827] outline-none"
                                            />
                                            <label className="pointer-events-none absolute left-[10px] top-[-9px] bg-white px-[6px] text-[12px] font-[Inter-Regular] leading-none text-[#6b7280] transition-all duration-150 peer-placeholder-shown:top-[16px] peer-placeholder-shown:bg-transparent peer-placeholder-shown:px-0 peer-placeholder-shown:text-[15px] peer-placeholder-shown:text-[#9ca3af] peer-focus:top-[-9px] peer-focus:bg-white peer-focus:px-[6px] peer-focus:text-[12px] peer-focus:text-[#6b7280]">
                                                Write a message*
                                            </label>
                                        </div>

                                        <div className="flex min-h-[72px] items-center justify-between rounded-[4px] border border-[#cecece] bg-white px-[12px] py-[10px]">
                                            <div className="flex items-center gap-[10px]">
                                                <span className="inline-flex h-[24px] w-[24px] rounded-[2px] border border-[#727272]" />
                                                <span className="text-[14px] font-[Inter-Regular] text-[#1f2937]">I&apos;m not a robot</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[12px] font-[Inter-Bold] text-[#2563eb]">reCAPTCHA</p>
                                                <p className="text-[10px] font-[Inter-Regular] text-[#6b7280]">Privacy - Terms</p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleGetStartedSubmit}
                                            disabled={submitLoading}
                                            className={`mt-[2px] h-[46px] w-full rounded-[6px] bg-[#e60012] text-[16px] font-[Inter-Bold] text-white transition hover:bg-[#cc0010] ${submitLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                                        >
                                            {submitLoading ? 'Submitting...' : 'Submit'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex min-h-[520px] items-center justify-center rounded-[6px] bg-[#ffffff] p-[24px] max-sm:p-[16px] flex-col">
                                    <div className="mx-auto mb-[20px] flex h-[64px] w-[64px] items-center justify-center">
                                        <Image src={validatecheck} alt="validatecheck" width={60} height={60} className="h-[60px] w-[60px]" />
                                    </div>
                                    <h3 className="mb-[14px] text-[24px] leading-[1.2] font-[Inter-Bold] text-[#222]">
                                        Thank you!
                                    </h3>
                                    <p className="text-[16px] leading-[1.55] font-[Inter-Regular] text-[#222]">
                                        You have successfully generated a callback request. Our team will contact you within 24 hours to walk you through the next steps!
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="bg-[#fff] pt-[80px]">
                        <div className="grid grid-cols-3 max-sm:grid-cols-1 gap-[40px]">
                            {whySellStats.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex flex-col gap-[20px] items-start justify-center rounded-[8px] bg-white p-[28px]  shadow-[.1rem_.3rem_1rem_rgba(0,0,0,0.06)]"
                                >
                                    <div className=''>
                                        <Image src={item.icon} alt={item.label} width={80} height={80} className="h-[80px] w-[80px]" />
                                    </div>
                                    <h4 className="text-[22px] leading-tight font-[Inter-Bold] text-[#222222] ">
                                        {item.stat}
                                    </h4>
                                    <p className="text-[14px] leading-[1.5] font-[Inter-Regular] text-[#222]">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-[#d9d9d980] p-[80px_0]">
                <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] overflow-hidden common_container">
                    <div className="mb-[40px]">
                        <h2 className="text-[32px] leading-[1.2] font-[Inter-Medium] text-[#222222] mb-[16px]">
                            A Well-rounded Set of Value Added Services
                        </h2>
                        <p className="text-[14px] leading-[24px] font-[Inter-Regular] text-[#222]">Elevate your car ownership journey with our comprehensive suite of value-added services</p>
                    </div>
                    <div className="flex flex-col gap-[60px]">
                        <div
                            id="helpbuy-inspection"
                            className="grid grid-cols-2 max-sm:grid-cols-1 gap-[50px] items-center scroll-mt-[72px] bg-[#ffffff] rounded-[6px] shadow-[.1rem_.3rem_1rem_rgba(0,0,0,0.06)] p-[40px_80px] max-sm:p-[20px]"
                        >
                            <div className="flex flex-col gap-[14px]">
                                <h2 className="text-[22px] leading-[1.2] font-[Inter-Bold] text-[#222222]">
                                    Car Inspection
                                </h2>
                                <p className="text-[14px] leading-[24px] font-[Inter-Regular] text-[#222]">
                                    Get any used car inspected before buying and seal the deal with complete peace of mind. Our team of experts develops a pre-purchase condition report to help you make a risk-free purchase decision.
                                </p>
                                <Link href="/inception"
                                    className="w-fit cursor-pointer inline-flex items-center justify-center rounded-[6px] border border-[#222222] bg-[#F5F9FE] p-[6px_14px] text-[14px] font-[Inter-SemiBold] text-[#2a2c2d] transition"
                                >
                                    Request Inspection
                                </Link>
                            </div>

                            <div className="overflow-hidden">
                                <Image
                                    src={help1}
                                    alt="Sell my car promotion"
                                    width={900}
                                    height={520}
                                    className="h-full w-full object-cover rounded-[8px]"
                                    priority
                                />
                            </div>
                        </div>
                        <div
                            id="helpbuy-financing"
                            className="grid grid-cols-2 max-sm:grid-cols-1 gap-[50px] items-center scroll-mt-[72px] bg-[#ffffff] rounded-[6px] shadow-[.1rem_.3rem_1rem_rgba(0,0,0,0.06)] p-[40px_80px] max-sm:p-[20px]"
                        >
                            <div className="overflow-hidden">
                                <Image
                                    src={help2}
                                    alt="Sell my car promotion"
                                    width={900}
                                    height={520}
                                    className="h-full w-full object-cover rounded-[8px]"
                                    priority
                                />
                            </div>
                            <div className="flex flex-col gap-[14px]">
                                <h2 className="text-[22px] leading-[1.2] font-[Inter-Bold] text-[#222222]">
                                    Car Financing
                                </h2>
                                <div className="flex flex-col gap-[10px]">
                                    <p className="text-[14px] leading-[24px] font-[Inter-Regular] text-[#222]">
                                        Financing your favourite car has never been easier. We connect you with our partner banks that can offer you the best auto financing deal. Moreover, our pre-purchase condition report will put you in a better position to make the final decision.
                                    </p>
                                </div>
                                <p className="text-[12px] font-[Inter-Regular] text-[#222] italic">*Available for eligible cars in Abu Dhabi, Dubai, and Sharjah only.</p>
                                <Link href="/carfinance"
                                    type="button"
                                    className="w-fit cursor-pointer inline-flex items-center justify-center rounded-[6px] border border-[#222222] bg-[#F5F9FE] p-[6px_14px] text-[14px] font-[Inter-SemiBold] text-[#2a2c2d] transition"
                                >
                                    Get Financing
                                </Link>
                            </div>
                        </div>
                        <div
                            id="helpbuy-certificate"
                            className="grid grid-cols-2 max-sm:grid-cols-1 gap-[50px] items-center scroll-mt-[72px] bg-[#ffffff] rounded-[6px] shadow-[.1rem_.3rem_1rem_rgba(0,0,0,0.06)] p-[40px_80px] max-sm:p-[20px]"
                        >
                            <div className="flex flex-col gap-[14px]">
                                <h2 className="text-[22px] leading-[1.2] font-[Inter-Bold] text-[#222222]">
                                    Bank Evaluation Certificate
                                </h2>
                                <p className="text-[14px] leading-[24px] font-[Inter-Regular] text-[#222]">
                                    With ebozor, you don’t have to worry about an evaluation certificate. We’ll get it for you. The certificate includes maintenance records and accident history to determine the car’s current condition and value.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setIsCertificateModalOpen(true)}
                                    className="w-fit cursor-pointer inline-flex items-center justify-center rounded-[6px] border border-[#222222] bg-[#F5F9FE] p-[6px_14px] text-[14px] font-[Inter-SemiBold] text-[#2a2c2d] transition"
                                >
                                    Get Certificate
                                </button>
                            </div>

                            <div className="overflow-hidden">
                                <Image
                                    src={help3}
                                    alt="Sell my car promotion"
                                    width={900}
                                    height={520}
                                    className="h-full w-full object-cover rounded-[8px]"
                                    priority
                                />
                            </div>
                        </div>
                        <div
                            id="helpbuy-insurance"
                            className="grid grid-cols-2 max-sm:grid-cols-1 gap-[50px] items-center scroll-mt-[72px] bg-[#ffffff] rounded-[6px] shadow-[.1rem_.3rem_1rem_rgba(0,0,0,0.06)] p-[40px_80px] max-sm:p-[20px]"
                        >
                            <div className="overflow-hidden">
                                <Image
                                    src={help4}
                                    alt="Car Inspection"
                                    width={900}
                                    height={520}
                                    className="h-full w-full object-cover rounded-[8px]"
                                    priority
                                />
                            </div>
                            <div className="flex flex-col gap-[14px]">
                                <h2 className="text-[22px] leading-[1.2] font-[Inter-Bold] text-[#222222]">
                                    Car Insurance
                                </h2>
                                <div className="flex flex-col gap-[10px]">
                                    <p className="text-[14px] leading-[24px] font-[Inter-Regular] text-[#222]">
                                        Safeguard your investment with an effective insurance plan by any of our trusted partners. Our detailed car condition report will help you choose a plan that best meets your requirements and budget. Get an effective car insurance plan with our trusted partner
                                    </p>
                                </div>
                                <p className="text-[12px] font-[Inter-Regular] text-[#222] italic">*Available for eligible cars in Abu Dhabi, Dubai, and Sharjah only.</p>
                                <button
                                    type="button"
                                    className="w-fit cursor-pointer inline-flex items-center justify-center rounded-[6px] border border-[#222222] bg-[#F5F9FE] p-[6px_14px] text-[14px] font-[Inter-SemiBold] text-[#2a2c2d] transition hover:bg-[#222222]/10"
                                    onClick={() => setIsInsuranceModalOpen(true)}
                                >
                                    Insure your car
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <div className='bg-[#fff] p-[80px_0]'>
                <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] overflow-hidden common_container">

                    <div className="bg-[#fff] py-[80px]">
                        <div className="mb-[40px] text-center">
                            <h2 className="mb-[12px] text-[32px] leading-[1.2] font-[Inter-Medium] text-[#222]">
                                Join our happy customers
                            </h2>
                            <p className="text-[14px] font-[Inter-Regular] text-[#222]">
                                Google rating score: 3.9 of 5, based on 466 reviews
                            </p>
                        </div>

                        <div className="relative mx-auto flex max-w-[920px] items-center justify-center gap-[8px] max-sm:flex-col max-sm:gap-[16px]">
                            <button
                                type="button"
                                aria-label="Previous testimonial"
                                onClick={() => setTestimonialIndex((i) => Math.max(0, i - 1))}
                                disabled={testimonialIndex === 0}
                                className="z-[2] flex h-[44px] w-[44px] shrink-0 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-35 max-sm:order-2 max-sm:absolute max-sm:left-0 max-sm:top-[36%]"
                            >
                                <PaginationPrevIcon className="h-[22px] w-[22px] rtl:rotate-180" stroke="currentColor" />
                            </button>

                            <div className="relative min-w-0 flex-1 px-[4px] max-sm:order-1 max-sm:w-full">
                                <div className="absolute left-[70px] top-[-60px]">
                                    <Image src={reviewquote} alt="Review quote" width={100} height={100} className="h-[100px] w-[100px]" />
                                </div>
                                <div className="relative z-[1] mx-auto rounded-[4px] bg-white p-[20px] shadow-[.1rem_.3rem_1rem_rgba(0,0,0,0.06)] border border-[#f4f4f4]">
                                    <p className="mb-[20px] text-left text-[14px] leading-[1.75] font-[Inter-Regular] text-[#000000] h-[100px] max-sm:h-[100%]">
                                        {activeTestimonial.text}
                                    </p>
                                    <div className="mb-[10px] flex gap-[4px]">
                                        {Array.from({ length: 5 }).map((_, idx) => (
                                            <Image src={greenrating} alt="Green rating" width={18} height={18} className="h-[18px] w-[18px]" />
                                        ))}
                                    </div>
                                    <h4 className="mb-[2px] text-[14px] font-[Inter-Bold] text-[#000000]">{activeTestimonial.name}</h4>
                                    <p className="text-[12px] font-[Inter-Regular] text-[#000] opacity-50">{activeTestimonial.date}</p>
                                </div>
                                <div className="absolute right-[-70px] bottom-[-60px] rotate-180">
                                    <Image src={reviewquote} alt="Review quote" width={100} height={100} className="h-[100px] w-[100px]" />
                                </div>
                            </div>

                            <button
                                type="button"
                                aria-label="Next testimonial"
                                onClick={() => setTestimonialIndex((i) => Math.min(maxTestimonialIndex, i + 1))}
                                disabled={testimonialIndex === maxTestimonialIndex}
                                className="z-[2] flex h-[44px] w-[44px] shrink-0 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-35 max-sm:order-3 max-sm:absolute max-sm:right-0 max-sm:top-[36%]"
                            >
                                <PaginationNextIcon className="h-[22px] w-[22px] rtl:rotate-180" stroke="currentColor" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#F5F9FE] py-[80px]">
                <div className="mx-auto max-w-[850px] px-[15px] common_container">
                    <h2 className="mb-[24px] text-left text-[22px] leading-[1.2] font-[Inter-Bold] text-[#222]">
                        Frequently Asked Questions
                    </h2>
                    <div className="flex flex-col gap-[14px]">
                        {sellMyCarFaqItems.map((item, index) => {
                            const isOpen = openSellFaq === index
                            return (
                                <div
                                    key={item.question}
                                    className="overflow-hidden rounded-[8px] bg-white p-[16px_32px] shadow-[.1rem_.3rem_1rem_rgba(0,0,0,0.06)]"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setOpenSellFaq((prev) => (prev === index ? null : index))}
                                        className="flex w-full cursor-pointer items-center justify-between gap-[14px] text-left cursor-pointer"
                                        aria-expanded={isOpen}
                                    >
                                        <h4 className="text-[18px] font-[Inter-Regular] leading-[24px] text-[#000000]">
                                            {item.question}
                                        </h4>
                                        <div
                                            className={`inline-flex shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                            aria-hidden
                                        >
                                            <DownArrowIcon className="h-[24px] w-[24px]" stroke="#000000" />
                                        </div>
                                    </button>
                                    {isOpen ? (
                                        <div className="mt-[20px] ml-[20px]">
                                            {typeof item.answer === 'string' ? (
                                                <p className="whitespace-pre-line text-[14px] font-[Inter-Regular] leading-[26px] text-[#23262A]">
                                                    {item.answer}
                                                </p>
                                            ) : (
                                                item.answer
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="bg-[#fff] p-[80px_0]">
                <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] overflow-hidden common_container">
                    <div className="">
                        <div className="mb-[40px]">
                            <h2 className="text-[32px] leading-[1.2] font-[Inter-Medium] text-[#222222] mb-[16px]">
                                How about one of these pre-inspected cars?
                            </h2>
                            <p className="text-[14px] leading-[24px] font-[Inter-Regular] text-[#222]">
                                These fine cars have already been pre-inspected by ebozor cars, as we manage the sale on behalf of sellers. Have a look, maybe your next car is among them!
                            </p>
                        </div>

                        <div className="grid grid-cols-4 gap-[24px] max-lg:grid-cols-2 max-sm:grid-cols-1 mb-[34px]">
                            {preInspectedBrands.map((brand) => (
                                <Link href=''>
                                    <div
                                        key={brand.id}
                                        className="flex min-h-[212px] flex-col items-center justify-center rounded-[2px] shadow-[.1rem_.3rem_1rem_rgba(0,0,0,0.06)] bg-white p-[28px] text-center"
                                    >
                                        <div>
                                            <Image src={brand.icon} alt={brand.label} width={120} height={120} className="h-[120px] w-[120px] object-contain" />
                                        </div>
                                        <h4 className="text-[14px] leading-[1.4] font-[Inter-Regular] text-[#626465]">
                                            Browse pre-inspected
                                        </h4>
                                        <p className="text-[16px] leading-[1.4] font-[Inter-Regular] text-[#DC0000]">
                                            {brand.label}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <div className="flex justify-center">
                            <button
                                type="button"
                                className="cursor-pointer rounded-[6px] border border-[#222] bg-white p-[10px_20px] text-[14px] font-[Inter-Bold] text-[#222]"
                            >
                                Browse other pre-inspected cars
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#F5F9FE] p-[80px_0]">
                <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] overflow-hidden common_container">
                    <div className="">
                        <div className="mb-[40px]">
                            <h2 className="text-[32px] leading-[1.2] font-[Inter-Medium] text-[#222222] mb-[16px]">
                                Get in touch with us
                            </h2>
                            <p className="text-[14px] leading-[24px] font-[Inter-Regular] text-[#222]">
                                While you have the option to sign up for our services online, you can also visit any of our strategically located branches across Dubai and Abu Dhabi. Come down and see us if you ever have any questions or need any help.
                            </p>
                        </div>

                        <div className="grid grid-cols-4 gap-[20px] max-lg:grid-cols-2 max-sm:grid-cols-1">
                            {branchCards.map((branch) => (
                                <Link href=''>
                                    <div
                                        key={`${branch.city}-${branch.location}`}
                                        className="p-[28px] rounded-[4px] shadow-[.1rem_.3rem_1rem_rgba(0,0,0,0.06)] bg-white"
                                    >
                                        <h3 className="mb-[4px] text-[24px] leading-[1.2] font-[Inter-Bold] text-[#2a2c2d]">
                                            {branch.city}
                                        </h3>
                                        <p className="mb-[14px] text-[16px] leading-[1.2] font-[Inter-Regular] text-[#2a2c2d]">
                                            ebozor cars
                                        </p>
                                        <div className='flex items-center gap-[8px]'>
                                            <p className="text-[14px] leading-[1.2] font-[Inter-Regular] text-[#DC0000]">
                                                {branch.location}
                                            </p>
                                            <UploadLinkIcon className='h-[10px] w-[10px]' fill="#DC0000" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <div className="mt-[20px] flex items-center justify-center gap-[10px] max-sm:flex-col">
                            <button
                                type="button"
                                className="inline-flex cursor-pointer items-center gap-[6px] rounded-[6px] bg-[#25D366] p-[10px_24px] text-[14px] font-[Inter-Bold] text-white"
                            >
                                <Image src={whatsappwhite} alt="WhatsApp" width={14} height={14} className="h-[14px] w-[14px]" />
                                Chat with us
                            </button>
                            <button
                                type="button"
                                className="inline-flex cursor-pointer items-center justify-center rounded-[6px] border border-[#8f8f8f] bg-transparent p-[8px_24px] text-[14px] font-[Inter-Bold] text-[#2a2c2d]"
                            >
                                Click to call
                            </button>
                        </div>
                    </div>

                </div>
            </div>


            <div className="bg-[#fff] py-[80px]">
                <div className="mx-auto max-w-[1170px] px-[15px] common_container">
                    <div className="grid grid-cols-3 gap-[36px] max-md:grid-cols-1">
                        {marketLinksColumns.map((column) => (
                            <div key={column.title}>
                                <h3 className="mb-[16px] text-[16px] font-[Inter-Bold] leading-[1.2] text-[#000]">
                                    {column.title}
                                </h3>
                                <div className="flex flex-col gap-[14px]">
                                    {column.links.map((linkItem) => (
                                        <Link href=''
                                            key={linkItem}
                                            type="button"
                                            className="w-fit cursor-pointer text-left text-[14px] font-[Inter-Regular] leading-[1.2] text-[#e00718] hover:text-[#222]"
                                        >
                                            {linkItem}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>


            <Footer />
            <Certificate isOpen={isCertificateModalOpen} onClose={() => setIsCertificateModalOpen(false)} />
            <InsuranceModal isOpen={isInsuranceModalOpen} onClose={() => setIsInsuranceModalOpen(false)} />
        </div >
    )
}

export default HelpBuy
