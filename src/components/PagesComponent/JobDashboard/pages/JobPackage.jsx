'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import logo from '../../../../../public/assets/img/logo.png'
import packagebg from '../../../../../public/assets/img/jobdashboard/packagebg.png'
import discountbannericon from '../../../../../public/assets/img/jobdashboard/icons/discountbannericon.svg'
import quick from '../../../../../public/assets/img/jobdashboard/package/quick.png'
import quickactive from '../../../../../public/assets/img/jobdashboard/package/quickactive.png'
import supericon from '../../../../../public/assets/img/jobdashboard/package/super.png'
import superactiveicon from '../../../../../public/assets/img/jobdashboard/package/superactive.png'
import proicon from '../../../../../public/assets/img/jobdashboard/package/pro.png'
import proactiveicon from '../../../../../public/assets/img/jobdashboard/package/proactive.png'
import hire1 from '../../../../../public/assets/img/jobdashboard/hire/1.png'
import hire2 from '../../../../../public/assets/img/jobdashboard/hire/2.png'
import hire3 from '../../../../../public/assets/img/jobdashboard/hire/3.png'
import client1 from '../../../../../public/assets/img/jobdashboard/client/1.png'
import client2 from '../../../../../public/assets/img/jobdashboard/client/2.png'
import client3 from '../../../../../public/assets/img/jobdashboard/client/3.png'
import client4 from '../../../../../public/assets/img/jobdashboard/client/4.png'
import client5 from '../../../../../public/assets/img/jobdashboard/client/5.png'
import client6 from '../../../../../public/assets/img/jobdashboard/client/6.png'
import client7 from '../../../../../public/assets/img/jobdashboard/client/7.png'
import client8 from '../../../../../public/assets/img/jobdashboard/client/8.png'
import client9 from '../../../../../public/assets/img/jobdashboard/client/9.png'
import client10 from '../../../../../public/assets/img/jobdashboard/client/10.png'
import client11 from '../../../../../public/assets/img/jobdashboard/client/11.png'
import client12 from '../../../../../public/assets/img/jobdashboard/client/12.png'
import client13 from '../../../../../public/assets/img/jobdashboard/client/13.png'
import client14 from '../../../../../public/assets/img/jobdashboard/client/14.png'
import client15 from '../../../../../public/assets/img/jobdashboard/client/15.png'


const NAV_ITEMS = [
    { label: 'Packages', sectionId: 'job-packages' },
    { label: 'Reasons', sectionId: 'job-reasons' },
    { label: 'Clients', sectionId: 'job-clients' },
    { label: 'Help', sectionId: 'job-how-it-works' },
    { label: 'FAQ', sectionId: 'job-faq' },
]

const PACKAGES = [
    {
        name: 'Quick',
        subtitle: 'Quick 50 CVs for 7 days',
        oldPrice: 'AED 449',
        newPrice: 'AED 404',
        vat: '+AED 20.2 (5% VAT)',
        users: 1,
        icon: quick,
        activeicon: quickactive,
    },
    {
        name: 'Super',
        subtitle: 'Super 1000 CVs for 3 months',
        oldPrice: 'AED 1,099',
        newPrice: 'AED 989',
        vat: '+AED 49.45 (5% VAT)',
        users: 3,
        icon: supericon,
        activeicon: superactiveicon,
    },
    {
        name: 'Pro',
        subtitle: 'Pro 2500 CVs for 6 months',
        oldPrice: 'AED 2,099',
        newPrice: 'AED 1,889',
        vat: '+AED 94.45 (5% VAT)',
        users: 5,
        icon: proicon,
        activeicon: proactiveicon,
    },
]

const REASONS = [
    {
        title: 'Cost-efficient Recruitment',
        description: 'Access to 1,600,000+ candidates in our database.',
        icon: hire1,
    },
    {
        title: 'Personal Account Management',
        description: 'Customer Service: A dedicated Customer Service agent is here to support you when you need it.',
        icon: hire2,
    },
    {
        title: 'We Speak Your Language',
        description: 'Support in Arabic and English 14 hours a day.',
        icon: hire3,
    },
]

const CLIENT_LOGOS = [
    client1, client2, client3, client4, client5, client6, client7, client8, client9, client10, client11, client12, client13, client14, client15,
]

const HOW_IT_WORKS_STEPS = [
    {
        title: '1. Choose Your Plan',
        description: 'Suit your needs by selecting one of our plans',
    },
    {
        title: '2. Find suitable CVs',
        description: '15 filters to find your match from 1,600,000 CVs',
    },
    {
        title: '3. Invite and Hire',
        description: 'Interview and uncover that diamond in the rough or highly skilled pro.',
    },
]




const DEFAULT_ACTIVE_PACKAGE_INDEX = 1

export default function JobPackage() {
    const router = useRouter()
    const [hoveredPackageIndex, setHoveredPackageIndex] = React.useState(null)
    const [activeNavLabel, setActiveNavLabel] = React.useState('Packages')
    const activePackageIndex = hoveredPackageIndex !== null ? hoveredPackageIndex : DEFAULT_ACTIVE_PACKAGE_INDEX

    const goToPayment = (pkgName) => {
        router.push(`/jobdashboard/paymentsummary?package=${encodeURIComponent(pkgName)}`)
    }

    const scrollToSection = (sectionId) => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const scrollToPackages = () => {
        scrollToSection('job-packages')
    }

    const handleNavClick = (label, sectionId) => {
        setActiveNavLabel(label)
        scrollToSection(sectionId)
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#f4f5f7] mt-[-32px] max-sm:mt-[-60px]"
            style={{ backgroundImage: `url(${packagebg.src})`, backgroundSize: 'auto 574px', backgroundPosition: 'center top', backgroundRepeat: 'no-repeat', }}

        >


            <div className="relative z-[1]">
                <header className="flex items-center justify-between px-[15px]">
                    <Image src={logo} alt="ebozor logo" className="h-12 md:h-[80px] w-auto" />
                    <nav className="flex flex-wrap items-center justify-end gap-[16px] md:gap-[28px]">
                        {NAV_ITEMS.map(({ label, sectionId }) => (
                            <button
                                key={label}
                                type="button"
                                onClick={() => handleNavClick(label, sectionId)}
                                className={`cursor-pointer text-[14px] font-[Inter-Regular] ${activeNavLabel === label ? 'text-[#DC0000]' : 'text-[#23262A]'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </nav>
                </header>

                <div className='p-[30px]'>
                    <div className="mx-auto max-w-[980px] text-center">
                        <div className='mb-[80px]'>
                            <h1 className="text-[36px] font-[Inter-Medium] leading-[1.2] text-[#0f1112] mb-[18px]">
                                Want to select candidates yourself?
                            </h1>
                            <p className="text-[16px] font-[Inter-SemiBold] text-[#626465]">
                                Hand pick your job seeker from ebozor&apos;s 1,600,000 CVs
                            </p>
                        </div>

                        <div className="rounded-[12px] bg-white p-[16px] [box-shadow:0px_1px_10px_0px_rgba(0,0,0,0.04),0px_3px_8px_0px_rgba(0,0,0,0.02),0px_4px_8px_-2px_rgba(0,0,0,0.02)] flex items-center gap-[6px] justify-center">
                            <Image src={discountbannericon} alt="discount banner icon" className="h-[24px] w-[24px]" />
                            <p className="text-[16px] text-[#000000] font-[Inter-Regular]">
                                <span className="font-[Inter-Bold]">Enjoy 10% off all packages!</span>Limited time only.
                            </p>
                        </div>
                    </div>

                    <div id="job-packages" className="scroll-mt-[100px]">
                        <h2 className="mt-[16px] mb-[24px] text-center text-[22px] font-[Inter-Regular] text-[#DC0000]">Select a Package</h2>

                        <div
                            className="mx-auto grid max-w-[850px] grid-cols-3 items-center gap-[8px] max-sm:grid-cols-1"
                            onMouseLeave={() => setHoveredPackageIndex(null)}
                        >
                            {PACKAGES.map((pkg, index) => {
                                const isActive = index === activePackageIndex
                                return (
                                    <div
                                        key={pkg.name}
                                        onMouseEnter={() => setHoveredPackageIndex(index)}
                                        className={`delay-150 cursor-pointer rounded-[6px] bg-white p-[50px_30px_50px] text-center transition-[transform,box-shadow] duration-300  ease-out [box-shadow:0px_24px_40px_0px_rgba(0,0,0,0.08)]  ${
                                            isActive
                                                ? 'z-[2] scale-[1.06] [box-shadow:0px_28px_48px_0px_rgba(0,0,0,0.12)]'
                                                : 'z-[1] scale-100'
                                        }`}
                                    >
                                        <div className="mb-[16px] flex justify-center">
                                            <Image
                                                src={isActive ? pkg.activeicon : pkg.icon}
                                                alt={pkg.name}
                                                className="h-[84px] w-auto"
                                            />
                                        </div>
                                        <h3 className="mb-[24px] text-[20px] font-[Inter-Bold] text-[#0f1112]">{pkg.name}</h3>
                                        <div className="border-t border-b border-[rgba(15,17,18,0.12)] py-[18px]">
                                            <p className="text-[16px] font-[Inter-SemiBold] text-[#7b8385]">{pkg.subtitle}</p>
                                        </div>
                                        <div className="mb-[14px] flex flex-col gap-[6px] py-[16px]">
                                            <h4 className="text-[20px] font-[Inter-SemiBold] text-[#23262A] line-through decoration-[2px]">
                                                {pkg.oldPrice}
                                            </h4>
                                            <h4 className="text-[20px] font-[Inter-SemiBold] leading-[1.1] text-[#DC0000]">
                                                {pkg.newPrice}
                                            </h4>
                                            <p className="text-[12px] font-[Inter-SemiBold] text-[#626465]">{pkg.vat}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                goToPayment(pkg.name)
                                            }}
                                            className={`cursor-pointer w-full rounded-[6px] p-[16px] text-[14px] font-[Inter-SemiBold] transition-colors duration-200 ${
                                                isActive
                                                    ? 'bg-[#DC0000] text-white'
                                                    : 'border border-[#DC0000] bg-white text-[#DC0000]'
                                            }`}
                                        >
                                            Get Package
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div id="job-reasons" className="my-[80px] scroll-mt-[100px]">
                        <h2 className="text-[28px] font-[Inter-SemiBold] leading-[1.3] text-[#2b2d2e] mb-[80px] text-center">3 Reasons to hire on ebozor</h2>

                        <div className="mx-auto max-w-[750px] grid grid-cols-3 gap-[18px] max-sm:grid-cols-1">
                            {REASONS.map((reason) => (
                                <div key={reason.title} className="text-center">
                                    <div className="mx-auto flex items-center justify-center mb-[10px]">
                                        <Image src={reason.icon} alt={reason.title} className="h-[64px] w-[64px]" />
                                    </div>
                                    <h3 className="mb-[18px] text-[18px] font-[Inter-Bold] leading-[1.4] text-[#454748]">{reason.title}</h3>
                                    <p className="text-[16px] font-[Inter-Regular] leading-[1.55] text-[#626465]">{reason.description}</p>
                                </div>
                            ))}
                        </div>

                        <div className='text-center mt-[80px] '>
                            <button
                                type="button"
                                onClick={scrollToPackages}
                                className="cursor-pointer rounded-[6px] p-[16px_26px] border border-[#DC0000] text-[14px] font-[Inter-SemiBold] text-[#DC0000] hover:bg-[#DC0000] hover:text-white transition-all duration-300"
                            >
                                Select Your Package
                            </button>
                        </div>
                    </div>

                    <div id="job-clients" className="my-[80px] scroll-mt-[100px]">
                        <h2 className="text-[28px] font-[Inter-SemiBold] leading-[1.3] text-[#2b2d2e] mb-[80px] text-center">
                            Who is using ebozor&apos;s CV search?
                        </h2>

                        <div className="mx-auto max-w-[750px] grid grid-cols-5 gap-[24px] max-sm:grid-cols-2">
                            {CLIENT_LOGOS.map((logoImage, index) => (
                                <div
                                    key={`client-${index}`}
                                    className=""
                                >
                                    <Image
                                        src={logoImage}
                                        alt={`Client logo ${index + 1}`}
                                        className="w-[140px] h-[90px]"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className='text-center mt-[80px] '>
                            <button
                                type="button"
                                onClick={scrollToPackages}
                                className="cursor-pointer rounded-[6px] p-[16px_26px] border border-[#DC0000] text-[14px] font-[Inter-SemiBold] text-[#DC0000] hover:bg-[#DC0000] hover:text-white transition-all duration-300"
                            >
                                Select Your Package
                            </button>
                        </div>
                    </div>

                    <div id="job-how-it-works" className="my-[80px] scroll-mt-[100px]">
                        <h2 className="text-[28px] font-[Inter-SemiBold] leading-[1.3] text-[#2b2d2e] mb-[80px] text-center">How does it work?</h2>

                        <div className="mx-auto max-w-[600px] grid grid-cols-3 gap-[50px] max-sm:grid-cols-1">
                            {HOW_IT_WORKS_STEPS.map((step) => (
                                <div key={step.title}>
                                    <h3 className="text-[18px] font-[Inter-Bold] leading-[1.5] text-[#454748] text-center mb-[18px]">{step.title}</h3>
                                    <p className="text-[16px] font-[Inter-Regular] leading-[1.6] text-[#626465] text-center">{step.description}</p>
                                </div>
                            ))}
                        </div>

                        <div className='text-center mt-[80px] '>
                            <button
                                type="button"
                                onClick={scrollToPackages}
                                className="cursor-pointer rounded-[6px] p-[16px_26px] border border-[#DC0000] text-[14px] font-[Inter-SemiBold] text-[#DC0000] hover:bg-[#DC0000] hover:text-white transition-all duration-300"
                            >
                                Select Your Package
                            </button>
                        </div>
                    </div>
                </div>

                <div id="job-faq" className="scroll-mt-[100px] bg-[#2b2d2e] p-[150px_30px_80px]">
                    <h2 className="text-center text-[24px] font-[Inter-Regular] leading-[1.3] text-[#fff] mb-[50px]">
                        Have questions? We&apos;re here to help
                    </h2>

                    <div className="mx-auto grid max-w-[580px] grid-cols-2 gap-[120px] max-sm:grid-cols-1">
                        <div className="space-y-[26px]">
                            <div>
                                <h3 className="text-[18px] font-[Inter-Bold] leading-[1.45] text-[#fff] mb-[14px]">
                                    How many CVs can I view?
                                </h3>
                                <p className="text-[14px] font-[Inter-Regular] leading-[1.55] text-[#fff]">
                                    At any given time, you see all candidates that match your applied search filters.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-[18px] font-[Inter-Bold] leading-[1.45] text-[#fff] mb-[14px]">
                                    Can I download CVs?
                                </h3>
                                <p className="text-[14px] font-[Inter-Regular] leading-[1.55] text-[#fff]">
                                    At any given time, you see all candidates that match your applied search filters.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-[18px] font-[Inter-Bold] leading-[1.45] text-[#fff] mb-[14px]   ">
                                    Can I still search for CVs if my subscription plan has expired?
                                </h3>
                                <p className="text-[14px] font-[Inter-Regular] leading-[1.55] text-[#fff]">
                                    At any given time, you see all candidates that match your applied search filters.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-[26px]">
                            <div>
                                <h3 className="text-[18px] font-[Inter-Bold] leading-[1.45] text-[#fff] mb-[14px]">
                                    I already have an online package. If I buy the CV search plan, what happens to my existing package?
                                </h3>
                                <p className="text-[14px] font-[Inter-Regular] leading-[1.55] text-[#fff]">
                                    Your CV Search credits will be added to your existing package
                                </p>
                            </div>
                            <div>
                                <h3 className="text-[18px] font-[Inter-Bold] leading-[1.45] text-[#fff] mb-[14px]">
                                    I still have doubts. Can I contact you?
                                </h3>
                                <p className="text-[14px] font-[Inter-Regular] leading-[1.55] text-[#fff]">
                                    Of course! Reach out to us by sending us your questions or comments here:{' '}
                                    <Link href="" className="text-[#DC0000]">Contact Us</Link>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-[80px] ">
                        <button
                            type="button"
                            onClick={scrollToPackages}
                            className="cursor-pointer rounded-[6px] p-[16px_26px] border border-[#ffffff] text-[14px] font-[Inter-SemiBold] text-white hover:bg-[#ffffff] hover:text-[#2b2d2e] transition-all duration-300"
                        >
                            Select Your Package
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
