/* eslint-disable react/prop-types */
'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import NewProjectBanner from '../NewProjectComponents/NewProjectBanner'
import NewProjectAbout from '../NewProjectComponents/NewProjectAbout'
import NewProjectUnitTypes from '../NewProjectComponents/NewProjectUnitTypes'
import NewProjectPaymentPlan from '../NewProjectComponents/NewProjectPaymentPlan'
import NewProjectLocation from '../NewProjectComponents/NewProjectLocation'
import NewProjectPropertyAdsFilters from '../NewProjectComponents/NewProjectPropertyAdsFilters'
import NewProjectPropertyAdsList from '../NewProjectComponents/NewProjectPropertyAdsList'
import NewProjectOtherProjects from '../NewProjectComponents/NewProjectOtherProjects'
import info from '../../../../../public/assets/img/newproject/info.svg'
import unit from '../../../../../public/assets/img/newproject/unit.svg'
import payment from '../../../../../public/assets/img/newproject/payment.svg'
import map from '../../../../../public/assets/img/newproject/map.svg'
import propertyad from '../../../../../public/assets/img/newproject/propertyad.svg'
import otherproject from '../../../../../public/assets/img/newproject/otherproject.svg'
import NewProjectRight from '../NewProjectComponents/NewProjectRight'
import whatsapp from '../../../../../public/assets/img/icons/whatsapp.svg'
import { LocationIcon, RightArrowIcon } from '@/components/CustomFile/icons'
import { buildWhatsAppMeUrl } from '@/utils/whatsapp'
import { useLoginModalGuard } from '@/hooks/useLoginModalGuard'
function firstTruthy(...vals) {
    for (const v of vals) {
        if (v !== undefined && v !== null && v !== '') return v
    }
    return ''
}

function toMoney(value) {
    const n = Number(value)
    if (Number.isNaN(n) || n <= 0) return ''
    if (n >= 1000000) return `${Math.round(n / 1000)}K`
    return n.toLocaleString('en-US')
}

function extractCustomFieldValue(productData, fieldName) {
    const rows = Array.isArray(productData?.custom_fields) ? productData.custom_fields : []
    const found = rows.find(
        (row) => String(row?.name || '').trim().toLowerCase() === String(fieldName || '').trim().toLowerCase()
    )
    const v = found?.custom_field_value?.value ?? found?.value
    if (Array.isArray(v)) {
        const first = v.find((x) => x != null && String(x).trim() !== '')
        return first != null ? String(first).trim() : ''
    }
    return v != null ? String(v).trim() : ''
}

function projectImage(item) {
    const imgs = item?.images || item?.gallery_images || item?.image_gallery || []
    const arr = Array.isArray(imgs) ? imgs : []
    for (const v of arr) {
        if (!v) continue
        if (typeof v === 'string' && v.trim()) return v.trim()
        if (typeof v === 'object') {
            const guess = v?.url || v?.image || v?.src || v?.path || v?.image_url || v?.imageUrl
            if (typeof guess === 'string' && guess.trim()) return guess.trim()
        }
    }
    if (typeof item?.image === 'string' && item.image.trim()) return item.image.trim()
    return '/assets/img/property/1.png'
}
const NEW_PROJECT_LISTING_HREF =
    '/products?mode=property&segment=new_projects&item=All%20New%20Projects&slug=all-new-projects&purpose=sale'

const SECTION_ITEMS = [
    { id: 'about-project', label: 'About The Project', icon: info },
    { id: 'unit-types', label: 'Unit Types', icon: unit },
    { id: 'payment-plan', label: 'Payment Plan', icon: payment },
    { id: 'location', label: 'Location', icon: map },
    // { id: 'property-ads', label: 'Property Ads', icon: propertyad },
    // { id: 'other-projects', label: 'Other Projects', icon: otherproject },
]

export default function NewProjectDetail({ productData = {} }) {
    const [adsTab, setAdsTab] = useState('All')
    const [activeSection, setActiveSection] = useState(SECTION_ITEMS[0].id)
    const [showFloatingHeader, setShowFloatingHeader] = useState(false)
    const { requireLogin, loginModal } = useLoginModalGuard()
    const adsHref =
        productData.view_ads_url ||
        productData.viewAdsUrl ||
        `${NEW_PROJECT_LISTING_HREF}&project=${encodeURIComponent(productData.slug || productData.title || '')}`
    const projectName = firstTruthy(productData?.title, productData?.name, 'Binghatti Apex')
    const locationText = firstTruthy(productData?.location, productData?.address, 'Jumeirah Village Circle (JVC), Dubai')
    const launchPrice = toMoney(
        firstTruthy(
            extractCustomFieldValue(productData, 'Launch price'),
            extractCustomFieldValue(productData, 'Launch Price'),
            productData?.launch_price,
            productData?.price,
            productData?.amount
        )
    ) || '650K'
    const handoverText = firstTruthy(
        extractCustomFieldValue(productData, 'Handover'),
        productData?.handover_date,
        productData?.handover,
        productData?.completion_date,
        'Q2 2026'
    )
    const thumb = useMemo(() => projectImage(productData), [productData])

    const projectWhatsAppUrl = useMemo(
        () =>
            buildWhatsAppMeUrl(
                firstTruthy(
                    productData?.whatsapp,
                    productData?.whatsapp_number,
                    productData?.contact_whatsapp
                ),
                firstTruthy(productData?.whatsapp_message, `Hi, I'm interested in ${projectName}`)
            ),
        [productData, projectName]
    )

    const openProjectWhatsApp = () =>
        requireLogin(() => {
            if (projectWhatsAppUrl) window.open(projectWhatsAppUrl, '_blank', 'noopener,noreferrer')
        })

    const brochureDownloadUrl = useMemo(
        () => String(firstTruthy(productData?.brochure_url, productData?.brochureUrl, '') || '').trim(),
        [productData]
    )

    const openBrochure = () => {
        if (!brochureDownloadUrl || brochureDownloadUrl === '#') return
        requireLogin(() => {
            window.open(brochureDownloadUrl, '_blank', 'noopener,noreferrer')
        })
    }

    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY || window.pageYOffset || 0
            setShowFloatingHeader(y > 280)
        }
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        const getHeaderOffset = () => (showFloatingHeader ? 190 : 120)

        const onScroll = () => {
            const y = (window.scrollY || window.pageYOffset || 0) + getHeaderOffset()
            let current = SECTION_ITEMS[0].id

            SECTION_ITEMS.forEach((section) => {
                const el = document.getElementById(section.id)
                if (!el) return
                if (el.offsetTop <= y) current = section.id
            })

            setActiveSection((prev) => (prev === current ? prev : current))
        }

        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [showFloatingHeader])

    const scrollToSection = (sectionId) => {
        setActiveSection(sectionId)
        const el = document.getElementById(sectionId)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    return (
        <div className="w-full">
            {showFloatingHeader ? (
                <div className="fixed inset-x-0 top-0 z-[60] border-b border-[rgba(143,143,143,0.28)] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] max-sm:hidden">
                    <div className="mx-auto flex max-w-[1170px] items-center justify-between gap-[14px] px-[12px] py-[10px] max-sm:flex-col max-sm:items-start">
                        <div className="flex min-w-0 items-center gap-[16px]">
                            <div className="relative h-[56px] w-[56px] shrink-0 overflow-hidden rounded-[6px]">
                                <Image src={thumb} alt={projectName} fill className="object-cover" />
                            </div>
                            <div className="min-w-0 flex flex-col gap-[4px]">
                                <h3 className="truncate text-[16px] font-[Inter-SemiBold] text-[#23262A]">{projectName}</h3>
                                <div className='flex items-center gap-[4px]'>
                                    <LocationIcon className="w-[16px] h-[16px]" />
                                    <p className="truncate text-[14px] font-[Inter-Regular] text-[#3a3f47] w-[250px] max-sm:w-[200px]">
                                        {locationText}
                                    </p>
                                </div>
                            </div>

                        </div>
                        <div className='flex items-center gap-[40px] max-sm:gap-[20px] max-sm:flex-wrap'>
                            <div className='flex items-center gap-[16px]'>
                                <div className="">
                                    <h4 className="mb-[4px] text-[16px] font-[Inter-SemiBold] text-[#23262A]">AED {launchPrice}</h4>
                                    <p className="text-[14px] font-[Inter-Regular] text-[#3a3f47]">Launch Price</p>
                                </div>
                                <div className="mx-[6px] h-[42px] w-[1px] bg-[rgba(143,143,143,0.35)] " />
                                <div className="">
                                    <p className="mb-[4px] text-[16px] font-[Inter-SemiBold] text-[#23262A]">{handoverText}</p>
                                    <p className="text-[14px] font-[Inter-Regular] text-[#3a3f47]">Handover</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-[8px] max-sm:flex-wrap">
                                <button type="button" onClick={openProjectWhatsApp} className="inline-flex cursor-pointer items-center gap-[8px] rounded-[8px] bg-[#EAF9EF] px-[14px] py-[12px]">
                                    <Image src={whatsapp} alt="whatsapp" width={18} height={18} />
                                    <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">WhatsApp</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => scrollToSection('other-projects')}
                                    className="inline-flex items-center gap-[6px] rounded-[8px] bg-[#161B23] px-[16px] py-[10px]"
                                >
                                    <p className="text-[14px] font-[Inter-SemiBold] text-[#fff]">View 225 Property Ads</p>
                                    <RightArrowIcon className="w-[24px] h-[24px] rtl:rotate-180" stroke="#fff"/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
           
            <NewProjectBanner
                productData={productData}
                viewAdsHref={adsHref}
                onViewAds={() => scrollToSection('property-ads')}
                onWhatsAppClick={openProjectWhatsApp}
            />
            <div className={` ${showFloatingHeader ? 'top-[76px] fixed max-sm:top-0' : 'top-0 sticky border-b border-[rgba(143,143,143,0.22)] shadow-[0_2px_8px_rgba(0,0,0,0.06)] '} z-[40] w-full bg-white mb-[20px]`}>
                <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
                    <div className="hide_scrollbar flex items-center justify-between gap-3 overflow-x-auto">
                        {SECTION_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    setActiveSection(item.id)
                                    const el = document.getElementById(item.id)
                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                }}
                                className={`inline-flex shrink-0 cursor-pointer items-center gap-[8px] whitespace-nowrap p-[14px] border-b-[2px] ${item.id === activeSection ? 'border-[#3a88ef]' : 'border-transparent'}`}
                            >
                                <Image src={item.icon} alt={item.label} width={20} height={20} />
                                <p className="text-[16px] font-[Inter-Medium] text-[#3a3f47]">{item.label}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
                <div className="grid grid-cols-[1fr_260px] gap-[20px] max-sm:grid-cols-1 products_grid">
                    <div className="min-w-0">
                        <div id="about-project" className="scroll-mt-[150px]">
                            <NewProjectAbout productData={productData} />
                        </div>
                        <div id="unit-types" className="scroll-mt-[150px]">
                            <NewProjectUnitTypes productData={productData} />
                        </div>
                        <div id="payment-plan" className="scroll-mt-[150px]">
                            <NewProjectPaymentPlan productData={productData} />
                        </div>
                        <div id="location" className="scroll-mt-[150px]">
                            <NewProjectLocation productData={productData} />
                        </div>
                        {/* <div id="property-ads" className="scroll-mt-[150px]">
                            <NewProjectPropertyAdsFilters
                                productData={productData}
                                activeTab={adsTab}
                                onTabChange={setAdsTab}
                            />
                            <NewProjectPropertyAdsList
                                productData={productData}
                                activeTab={adsTab}
                                onTabChange={setAdsTab}
                            />
                        </div>
                        <div id="other-projects" className="scroll-mt-[150px]">
                            <NewProjectOtherProjects productData={productData} />
                        </div> */}

                    </div>
                    <div className="min-w-0">
                        <NewProjectRight
                            productData={productData}
                            onWhatsApp={openProjectWhatsApp}
                            onDownloadBrochure={openBrochure}
                        />
                    </div>
                </div>
            </div>
            {loginModal}
        </div>
    )
}