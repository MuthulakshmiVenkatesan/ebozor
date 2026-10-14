'use client'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { placeholderImage, t } from '@/utils'
import { settingsData } from '@/redux/reuducer/settingSlice'
import { CurrentLanguageData, setCurrentLanguage } from '@/redux/reuducer/languageSlice'
import { getLanguageApi } from '@/utils/api'
import toast from 'react-hot-toast'
import phone from '../../../public/assets/img/phone.png'
import googleplay from '../../../public/assets/img/googleplay.png'
import appstore from '../../../public/assets/img/appstore.png'
import FooterCallModal from '../PagesComponent/CommonComponents/FooterCallModal'
import { setCityData } from '@/redux/reuducer/locationSlice'

const FOOTER_COMPANY = [
    { label: 'About Us', href: '/about-us' },
    // { label: 'Advertising', href: '/advertising' },
    // { label: 'Careers', href: '/careers' },
    { label: 'Legal Hub', href: '/legalhub' },
]

const FOOTER_UAE = [
    { label: 'Dubai' },
    { label: 'Abu Dhabi' },
    { label: 'Ras Al Khaimah' },
    { label: 'Sharjah' },
    { label: 'Fujairah' },
    { label: 'Ajman' },
    { label: 'Umm Al Quwain' },
    { label: 'Al Ain' },
]

const FOOTER_OTHER_COUNTRIES = [
    { label: 'Egypt' },
    { label: 'Bahrain' },
    { label: 'Saudi Arabia' },
    { label: 'Kuwait' },
    { label: 'Oman' },
    { label: 'Qatar' },
]

const FOOTER_LEGAL = [
    { label: 'Terms & Conditions', href: '/terms-and-condition' },
    { label: 'Tas', href: '/tas' },
    { label: 'Safety Tips', href: '/safety-tips' },
    { label: 'Reach', href: '/reach' },
    { label: 'User Help', href: '/help' },
]

const LANGUAGE_OPTIONS = [
    { value: 'en', label: 'English' },
    { value: 'ar', label: 'Arabic' },
]

const Footer = () => {
    const dispatch = useDispatch()
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const cityData = useSelector((state) => state?.Location?.cityData)
    const langDropdownRef = useRef(null)
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false)
    const isLandingPage = pathname === '/home'
    const [showDownloadLinks, setShowDownloadLinks] = useState(false)
    const systemSettingsData = useSelector(settingsData)
    const settings = systemSettingsData?.data
    const currentYear = new Date().getFullYear()
    const currentLanguage = useSelector(CurrentLanguageData)
    const [showCallModal, setShowCallModal] = useState(false)

    useEffect(() => {
        if (settings?.play_store_link && settings?.app_store_link && isLandingPage) {
            setShowDownloadLinks(true)
        } else {
            setShowDownloadLinks(false)
        }
    }, [settings, isLandingPage])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
                setIsLangDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const companyName = settings?.company_name || 'sitenime.com'
    const currentLangCode = (currentLanguage?.language_code || currentLanguage?.code || 'en').toLowerCase()
    const currentLangLabel = LANGUAGE_OPTIONS.find((o) => o.value === currentLangCode)?.label || 'English'

    const footerLangTargetCode = currentLangCode === 'ar' ? 'en' : 'ar'
    const footerLangLinkLabel = footerLangTargetCode === 'ar' ? 'العربية' : 'English'
    const footerLangTextDir = footerLangTargetCode === 'ar' ? 'rtl' : 'ltr'
    const handleFooterLanguageSwitch = async () => {
        const code = footerLangTargetCode
        try {
            const res = await getLanguageApi.getLanguage({ language_code: code, type: 'web' })
            if (res?.data?.error === true) {
                toast.error(res?.data?.message)
                return
            }
            dispatch(setCurrentLanguage(res?.data?.data))

            const urlLang = (searchParams?.get('lang') || '').trim().toLowerCase()
            if (urlLang === 'ar' || urlLang === 'en') {
                const next = new URLSearchParams(searchParams?.toString() || '')
                next.delete('lang')
                const qs = next.toString()
                router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
            }
        } catch (error) {
            console.error('Footer language switch failed:', error)
            toast.error('Could not change language')
        }
    }

    const handleLanguageSelect = (code) => {
        setIsLangDropdownOpen(false)
        if (typeof window === 'undefined') return
        const next = new URLSearchParams(window.location.search || '')
        next.set('lang', code)
        const qs = next.toString()
        window.location.href = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash || ''}`
    }

    const hideFooterSellMyCar = pathname?.startsWith('/sellmycar') || pathname?.startsWith('/helpbuy') || pathname?.startsWith('/jobdashboard') || pathname?.startsWith('/inceptionpackage') || pathname?.startsWith('/about-us') || pathname?.startsWith('/contact-us') || pathname?.startsWith('/faqs');

    const handleShowCallModal = () => {
        setShowCallModal(true)
    }

    const handleCloseCallModal = () => {
        setShowCallModal(false)
    }

    /** Same pattern as Header city dropdown: Redux `city` only, optional `/products` query sync — no route change. */
    const handleFooterLocationPick = (label) => {
        const cityName = String(label ?? '').trim()
        if (!cityName) return
        dispatch(
            setCityData({
                data: {
                    ...(cityData || {}),
                    city: cityName,
                },
            }),
        )
        const normalizedPath = String(pathname || '').replace(/\/$/, '') || '/'
        if (normalizedPath === '/products') {
            const next = new URLSearchParams(searchParams?.toString() || '')
            next.set('city', cityName)
            next.delete('area')
            next.set('page', '1')
            const country = String(cityData?.country || '').trim()
            if (country) next.set('country', country)
            else next.delete('country')
            const qs = next.toString()
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
        }
    }

    if (hideFooterSellMyCar) {
        return null;
    }

    return (
        <>
            <footer className="pt-[60px] md:pt-[80px] bg-[#F8FAFE] text-start">
                {/* Upper section - light gray */}
                <div className="bg-[#F8FAFE] w-full py-[40px]">
                    {/* App promo block */}
                    <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
                        <div className="flex flex-col md:flex-row items-center justify-between mb-[20px]">
                            <div>
                                <Image src={phone} alt="Phone" className="h-[150px] w-auto" onErrorCapture={placeholderImage} />
                            </div>
                            {/* Center text */}
                            <div className="text-center">
                                <h4 className="text-[#000] text-[20px] font-[Inter-SemiBold]">
                                    Find amazing deals on the go. <span className="text-[#DC0000]">Download the app now!</span>
                                </h4>
                            </div>
                            {/* Store buttons */}
                            <div className="flex flex-wrap items-center justify-center gap-[6px] shrink-0">
                                {settings?.play_store_link && (
                                    <Link
                                        href={settings.play_store_link}
                                        className=""
                                    >
                                        <Image src={googleplay} alt="Google Play" width={120} height={40} className="h-8 w-auto" onErrorCapture={placeholderImage} />
                                    </Link>
                                )}
                                {settings?.app_store_link && (
                                    <Link
                                        href={settings.app_store_link}
                                        className=""
                                    >
                                        <Image src={appstore} alt="App Store" width={120} height={40} className="h-8 w-auto" onErrorCapture={placeholderImage} />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Link columns */}
                    <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-[30px]">
                            {/* Company */}
                            <div>
                                <h4 className="text-[#000] font-[Inter-Medium] text-[14px] mb-[10px]">Company</h4>
                                <ul className="flex flex-col gap-[10px]">
                                    {FOOTER_COMPANY.map((item) => (
                                        <li key={item.href}>
                                            <Link href={item.href} className="!text-[#3A88EF] text-[14px] font-[Inter-Regular] hover:!text-[#DC0000] hover:!underline">
                                                {item.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {/* UAE */}
                            <div>
                                <h4 className="text-[#000] font-[Inter-Medium] text-[14px] mb-[10px]">UAE</h4>
                                <ul className="flex flex-col gap-[10px]">
                                    {FOOTER_UAE.map((item) => (
                                        <li key={item.label}>
                                            <button
                                                type="button"
                                                onClick={() => handleFooterLocationPick(item.label)}
                                                className="!text-[#3A88EF] text-[14px] font-[Inter-Regular] hover:!text-[#DC0000] hover:!underline inline text-start bg-transparent border-0 p-0 cursor-pointer"
                                            >
                                                {item.label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {/* Other Country */}
                            <div>
                                <h4 className="text-[#000] font-[Inter-Medium] text-[14px] mb-[10px]">Other Country</h4>
                                <ul className="flex flex-col gap-[10px]">
                                    {FOOTER_OTHER_COUNTRIES.map((item) => (
                                        <li key={item.label}>
                                            <button
                                                type="button"
                                                onClick={() => handleFooterLocationPick(item.label)}
                                                className="!text-[#3A88EF] text-[14px] font-[Inter-Regular] hover:!text-[#DC0000] hover:!underline inline text-start bg-transparent border-0 p-0 cursor-pointer"
                                            >
                                                {item.label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {/* Get Social */}
                            <div>
                                <h4 className="text-[#000] font-[Inter-Medium] text-[14px] mb-[10px]">Get Social</h4>
                                <ul className="flex flex-col gap-[10px]">
                                    {settings?.facebook_link && (
                                        <li>
                                            <a href={settings.facebook_link} target="_blank" rel="noopener noreferrer" className="!text-[#3A88EF] text-[14px] font-[Inter-Regular] hover:!text-[#DC0000] hover:!underline">
                                                Facebook
                                            </a>
                                        </li>
                                    )}
                                    {settings?.x_link && (
                                        <li>
                                            <a href={settings.x_link} target="_blank" rel="noopener noreferrer" className="!text-[#3A88EF] text-[14px] font-[Inter-Regular] hover:!text-[#DC0000] hover:!underline">
                                                X
                                            </a>
                                        </li>
                                    )}
                                    {settings?.youtube_link && (
                                        <li>
                                            <a href={settings.youtube_link} target="_blank" rel="noopener noreferrer" className="!text-[#3A88EF] text-[14px] font-[Inter-Regular] hover:!text-[#DC0000] hover:!underline">
                                                Youtube
                                            </a>
                                        </li>
                                    )}
                                    {settings?.instagram_link && (
                                        <li>
                                            <a href={settings.instagram_link} target="_blank" rel="noopener noreferrer" className="!text-[#3A88EF] text-[14px] font-[Inter-Regular] hover:!text-[#DC0000] hover:!underline">
                                                Instagram
                                            </a>
                                        </li>
                                    )}
                                </ul>
                            </div>
                            {/* Support */}
                            <div>
                                <h4 className="text-[#000] font-[Inter-Medium] text-[14px] mb-[10px]">Support</h4>
                                <ul className="flex flex-col gap-[10px]">
                                    <li>
                                        <Link href="/faqs" className="!text-[#3A88EF] text-[14px] font-[Inter-Regular] hover:!text-[#DC0000] hover:!underline">Help</Link>
                                    </li>
                                    <li>
                                        <Link  href="/contact-us" className="!text-[#3A88EF] text-[14px] font-[Inter-Regular] hover:!text-[#DC0000] hover:!underline">Contact Us</Link>
                                    </li>
                                    <li>
                                        {settings?.company_tel1 && (
                                            <button type="button" onClick={handleShowCallModal} className="!text-[#3A88EF] text-[14px] font-[Inter-Regular] hover:!text-[#DC0000] hover:!underline">Call Us</button>
                                        )}
                                    </li>
                                </ul>
                            </div>
                            {/* Language */}
                            <div>
                                <h4 className="text-[#000] font-[Inter-Medium] text-[14px] mb-[10px]">Language</h4>
                                <ul className="flex flex-col gap-[10px]">
                                    <li>
                                        <button
                                            type="button"
                                            onClick={handleFooterLanguageSwitch}
                                            dir={footerLangTextDir}
                                            className="!text-[#3A88EF] text-[14px] font-[Inter-Regular] hover:!text-[#DC0000] hover:!underline bg-transparent border-0 p-0 cursor-pointer text-start"
                                        >
                                            {footerLangLinkLabel}
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lower section - dark gray */}
                <div className="bg-[rgba(0,0,0,0.05)] w-full py-[20px]">
                    <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-col gap-[10px]">
                            {/* <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                {FOOTER_LEGAL.map((item) => (
                                    <Link key={item.href} href={item.href} className="text-[#000] font-[Inter-Regular] text-[14px] border-r border-[#B0B0B0] last:border-r-0 last:border-none pr-[14px]">
                                        {item.label}
                                    </Link>
                                ))}
                            </div> */}
                            <p className="text-[#000] font-[Inter-Regular] text-[14px]" dir="ltr">
                                @ Copyright {currentYear} {companyName} Limited. All rights reserved.
                            </p>
                        </div>
                        {/* <div className="flex items-center gap-2" ref={langDropdownRef}>
                            <h4 className="text-[#000] text-[14px] font-[Inter-Regular]">Language :</h4>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsLangDropdownOpen((prev) => !prev)}
                                    className="flex items-center justify-between gap-2 min-w-[120px] bg-white border border-[#E0E0E0] text-[#000] text-[14px] font-[Inter-Regular] rounded-[6px] px-3 py-2 cursor-pointer hover:border-[#B0B0B0] transition-colors"
                                >
                                    <span>{currentLangLabel}</span>
                                    <svg className={`w-4 h-4 text-[#666] transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {isLangDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-1 min-w-[120px] bg-white border border-[#E0E0E0] rounded-[6px] shadow-lg py-1 z-50">
                                        {LANGUAGE_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => handleLanguageSelect(opt.value)}
                                                className={`w-full text-left px-3 py-2 text-[14px] font-[Inter-Regular] hover:bg-[#F5F5F5] transition-colors first:rounded-t-[6px] last:rounded-b-[6px] ${currentLangCode === opt.value ? 'text-[#DC0000] font-[Inter-SemiBold] bg-[#FFF5F5]' : 'text-[#000]'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div> */}
                    </div>
                </div>
            </footer>
            <FooterCallModal open={showCallModal} onClose={handleCloseCallModal} />
        </>
    )
}

export default Footer