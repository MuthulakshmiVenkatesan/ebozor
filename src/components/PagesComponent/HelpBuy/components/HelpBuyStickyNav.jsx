'use client'

import React from 'react'
import Image from 'next/image'
import carinspectionicon from '../../../../../public/assets/img/sellcar/helpheader/carinspectionicon.svg'
import carfinancingicon from '../../../../../public/assets/img/sellcar/helpheader/carfinancingicon.svg'
import evaluationcertificateicon from '../../../../../public/assets/img/sellcar/helpheader/evaluationcertificateicon.svg'
import carinsuranceicon from '../../../../../public/assets/img/sellcar/helpheader/carinsuranceicon.svg'

const ACTIVE_ICON_FILTER =
    'invert(15%) sepia(80%) saturate(7217%) hue-rotate(355deg) brightness(101%) contrast(126%)'

const SERVICE_NAV = [
    { key: 'inspection', label: 'Car Inspection', sectionId: 'helpbuy-inspection', icon: carinspectionicon },
    { key: 'financing', label: 'Car Financing', sectionId: 'helpbuy-financing', icon: carfinancingicon },
    { key: 'certificate', label: 'Evaluation Certificate', sectionId: 'helpbuy-certificate', icon: evaluationcertificateicon },
    { key: 'insurance', label: 'Car Insurance', sectionId: 'helpbuy-insurance', icon: carinsuranceicon },
]



const HelpBuyStickyNav = ({ visible, activeKey, onNavigate, onGetStarted }) => {
    if (!visible) {
        return null
    }

    return (
        <nav
            className="fixed inset-x-0 top-0 z-[85] border-b border-[#A3A6AA] bg-white"
            aria-label="Help buy services"
        >
            <div className="mx-auto flex max-w-[1170px] items-center justify-between gap-[12px] px-[15px] common_container">
                <div className="flex min-w-0 flex-1 items-center gap-[30px] overflow-x-auto max-sm:gap-[14px]">
                    {SERVICE_NAV.map(({ key, label, sectionId, icon }) => {
                        const active = activeKey === key
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => onNavigate(sectionId)}
                                className={`py-[20px] flex shrink-0 cursor-pointer items-center gap-[8px] whitespace-nowrap transition-color border-b ${active ? 'text-[#DC0000] border-[#DC0000]' : 'text-[#222] border-transparent'
                                    }`}
                            >
                                <Image
                                    src={icon}
                                    alt={label}
                                    width={20}
                                    height={20}
                                    className="h-[20px] w-[20px] shrink-0"
                                    style={active ? { filter: ACTIVE_ICON_FILTER } : undefined}
                                />
                                <p className={`text-[16px] leading-[1.2] font-[Inter-Regular] ${active ? '' : ''}`}>{label}</p>
                            </button>
                        )
                    })}
                </div>
                <button
                    type="button"
                    onClick={onGetStarted}
                    className="shrink-0 cursor-pointer rounded-[6px] bg-[#DC0000] px-[16px] py-[10px] text-[14px] font-[Inter-Bold] text-white transition hover:bg-[#b80000] max-sm:px-[12px] max-sm:py-[8px] max-sm:text-[12px]"
                >
                    Get Started Here
                </button>
            </div>
        </nav>
    )
}

export default HelpBuyStickyNav
export { SERVICE_NAV }
