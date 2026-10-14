'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { FaChevronLeft } from 'react-icons/fa'
import {
    JobOverviewIcon,
    JobDashboardIcon,
    JobCandidateSearchIcon,
    JobSavedSearchesIcon,
    JobSavedCandidatesIcon,
    JobProfileIcon,
    PlusIcon,
    ShareFeedbackIcon,
    ThreeBarsIcon,
} from '@/components/CustomFile/icons'
import logo from '../../../../../public/assets/img/logo.png'
import feedback from '../../../../../public/assets/img/feedback.svg'



const NAV_ITEMS = [
    { id: 'overview', href: '/jobdashboard/overview', label: 'Overview', Icon: JobOverviewIcon },
    { id: 'jobs', href: '/jobdashboard', label: 'Jobs Dashboard', Icon: JobDashboardIcon },
    { id: 'candidates', href: '/jobdashboard/candidates', label: 'Candidate Search', Icon: JobCandidateSearchIcon },
    { id: 'all-candidates', href: '/jobdashboard/all-candidates', label: 'All Candidate Search', Icon: JobCandidateSearchIcon },
    { id: 'saved-searches', href: '/jobdashboard/saved-searches', label: 'Saved Searches', Icon: JobSavedSearchesIcon },
    { id: 'saved-candidates', href: '/jobdashboard/saved-candidates', label: 'Saved Candidates', Icon: JobSavedCandidatesIcon },
    { id: 'hiring-pipeline', href: '/jobdashboard/hiringpipeline', label: 'Hiring Pipeline', Icon: ThreeBarsIcon },
]


const Sidebar = ({ isOpen = false, onClose }) => {
    const pathname = usePathname()
    const normalizedPath = (pathname || '/').replace(/\/$/, '') || '/'

    return (
        <aside
            className={`[box-shadow:rgba(0,0,0,0.1)_0px_2px_4px_-1px,rgba(0,0,0,0.07)_0px_4px_5px,rgba(0,0,0,0.06)_0px_1px_10px] w-[280px] border-r border-[#0000001f] bg-white p-[8px_16px_30px] fixed top-0 left-0 rtl:right-0 rtl:left-auto h-screen overflow-y-auto z-[99] transition-transform duration-300 ${isOpen ? 'open-sidebar translate-x-0' : 'close-sidebar -translate-x-full'
                } min-[992px]:translate-x-0`}
        >
            <div className="relative flex items-center justify-center">
                <Link
                    href="/"
                    prefetch={false}
                    onClick={() => onClose?.()}
                    className="absolute left-0 top-1/2 flex h-8 w-8 -translate-y-1/2 shrink-0 cursor-pointer items-center justify-center text-[#000000] transition-opacity hover:opacity-75 md:h-10 md:w-10"
                    aria-label="Back to home"
                >
                    <FaChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                </Link>
                <Link
                    href="/"
                    prefetch={false}
                    onClick={() => onClose?.()}
                    className="flex cursor-pointer items-center justify-center transition-opacity hover:opacity-75"
                    aria-label="Go to homepage"
                >
                    <Image src={logo} alt='logo' width={100} height={80} className='h-12 md:h-[80px] w-auto' />
                </Link>
            </div>

            <nav className="flex flex-col gap-[4px] " aria-label="Job dashboard">
                {NAV_ITEMS.map(({ id, href, label, Icon }) => {
                    const hrefNorm = (href || '').replace(/\/$/, '') || href
                    const active =
                        id === 'jobs'
                            ? normalizedPath === '/jobdashboard'
                            : id === 'hiring-pipeline'
                                ? normalizedPath === hrefNorm || normalizedPath.startsWith(`${hrefNorm}/`)
                                : normalizedPath === hrefNorm
                    return (
                        <Link
                            key={id}
                            href={href}
                            onClick={() => onClose?.()}
                            className={`flex cursor-pointer items-center gap-[20px] rounded-[6px] p-[12px_16px] transition-colors ${active ? 'bg-[#0000000a]' : 'hover:bg-[#0000000a]'
                                }`}
                        >
                            <Icon fill={active ? '#17191c' : '#2e3238'} className="h-6 w-6 shrink-0" />
                            <p
                                className={`text-[14px] leading-[1.2] ${active ? 'font-[Inter-Bold] text-[#17191c]' : 'font-[Inter-SemiBold] text-[#2e3238]'
                                    }`}
                            >
                                {label}
                            </p>
                        </Link>
                    )
                })}
            </nav>

            <div className="mt-[20px] shrink-0">
                <Link
                    href="/jobdashboard/placeyourad"
                    onClick={() => onClose?.()}
                    className="flex w-full cursor-pointer items-center justify-center gap-[8px] rounded-[6px] bg-[#DC0000] py-[12px] transition text-center"
                >
                    <PlusIcon className="h-[18px] w-[18px] shrink-0" />
                    <p className="text-[14px] font-[Inter-Bold] text-white">Post A Job</p>
                </Link>
            </div>

            <div className="mt-auto pt-[28px]">
                <div className="rounded-[6px] bg-white p-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center gap-[6px]">
                    <Image src={feedback} alt='feedback' width={150} height={100} className='w-[150px] h-[100px]' />
                    <p className="text-center text-[14px] leading-[1.45] font-[Inter-Regular] text-[#23262a]">
                        Share your thoughts on the new interface.
                    </p>
                    <button
                        type="button"
                        className="flex w-full cursor-pointer items-center justify-center gap-[8px] rounded-[6px] border border-[#1270ec] bg-white py-[10px] text-[14px] font-[Inter-SemiBold] text-[#1270ec] transition "
                    >
                        <ShareFeedbackIcon className="h-[18px] w-[18px] shrink-0" />
                        Share Feedback
                    </button>
                </div>
            </div>
        </aside>
    )
}

export default Sidebar
