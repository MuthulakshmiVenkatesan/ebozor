'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { HamburgerIcon, JobProfileIcon, JobRejectionRulesIcon, JobUseIcon, JobLegalIcon, JobLogoutIcon, ThreeBarsIcon } from '@/components/CustomFile/icons'
import RejectionRulesDrawer from './RejectionRulesDrawer'
import avatar from '../../../../../public/assets/img/avatar/2.png'
import { getUserDetailApi } from '@/utils/api'
import { useSelector } from 'react-redux'
import { rootSignupData, userSignUpData } from '@/redux/reuducer/authSlice'

const MENU_ITEMS = [
    { id: 'profile', label: 'Profile', href: '/jobdashboard/my-profile', Icon: JobProfileIcon },
    { id: 'hiring-pipeline', label: 'Hiring Pipeline', href: '/jobdashboard/hiringpipeline', Icon: ThreeBarsIcon },
    { id: 'rejection', label: 'Default Rejection Rules', href: '#', Icon: JobRejectionRulesIcon },
    { id: 'howto', label: 'How to use?', href: '#', Icon: JobUseIcon },
    { id: 'legal', label: 'Legal Hub', href: '#', Icon: JobLegalIcon },
]

const JobDashboardHeader = ({ onToggleSidebar }) => {
    const router = useRouter()
    const userData = useSelector(userSignUpData)
    const authRoot = useSelector(rootSignupData)
    const [open, setOpen] = useState(false)
    const [rejectionDrawerOpen, setRejectionDrawerOpen] = useState(false)
    const [headerUser, setHeaderUser] = useState(null)
    const wrapRef = useRef(null)

    const parseApiPayload = (payload) => {
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

    useEffect(() => {
        const userId =
            userData?.id ??
            userData?.data?.id ??
            userData?.user?.id ??
            authRoot?.data?.id ??
            authRoot?.data?.data?.id ??
            authRoot?.data?.user?.id ??
            null
        if (!userId) {
            setHeaderUser(null)
            return
        }
        let cancelled = false
        const run = async () => {
            try {
                const response = await getUserDetailApi.getUserDetail({ user_id: userId })
                const parsed = parseApiPayload(response?.data)
                const detail = parsed?.data && typeof parsed.data === 'object' ? parsed.data : null
                if (!cancelled && detail) setHeaderUser(detail)
            } catch {
                if (!cancelled) setHeaderUser(null)
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [userData?.id, userData?.data?.id, userData?.user?.id, authRoot?.data?.id, authRoot?.data?.data?.id, authRoot?.data?.user?.id])

    const displayName = String(
        [
            headerUser?.name,
            headerUser?.last_name,
        ]
            .filter((v) => v != null && String(v).trim() !== '')
            .join(' ')
    ).trim() ||
        String(userData?.name || userData?.full_name || '').trim() ||
        'User'

    const headerAvatar =
        String(headerUser?.profile || '').trim() ||
        String(userData?.profile || '').trim() ||
        avatar

    const profileHref = String(headerUser?.personal_profile ?? '').trim() === '1'
        ? '/jobdashboard/my-profile'
        : String(headerUser?.company_profile ?? '').trim() === '1'
            ? '/jobdashboard/companyprofile'
            : '/jobdashboard/profilelanding'

    useEffect(() => {
        const onDocMouseDown = (e) => {
            if (!wrapRef.current?.contains(e.target)) {
                setOpen(false)
            }
        }
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', onDocMouseDown)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onDocMouseDown)
            document.removeEventListener('keydown', onKey)
        }
    }, [])

    return (
        <header className="shrink-0 border-b border-[#e5e7eb] bg-white">
            <div className="h-[3px] w-full bg-[#1e3a2f]" aria-hidden />
            <div className="flex items-center justify-end [box-shadow:0px_3px_3px_-2px_rgba(0,0,0,0.1)] max-sm:justify-between bg-white p-[12px_24px] fixed top-0 right-0 w-full z-[9] mobiledashboard_header">
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="inline-flex cursor-pointer items-center justify-center rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white p-[8px] mobiletoggle md:hidden"
                    aria-label="Open sidebar"
                >
                    <HamburgerIcon className="h-[18px] w-[18px]" />
                </button>
                <div className="relative flex items-center" ref={wrapRef}>
                    <button
                        type="button"
                        onClick={() => setOpen((v) => !v)}
                        className="flex cursor-pointer items-center gap-[10px] rounded-[6px] p-[4px] text-left transition hover:bg-[#f9fafb]"
                        aria-expanded={open}
                        aria-haspopup="menu"
                    >
                        <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">{displayName}</p>
                        <Image src={headerAvatar} alt='avatar' width={40} height={40} className='h-[40px] w-[40px] rounded-full shrink-0 object-cover' />
                    </button>

                    {open ? (
                        <div
                            className="absolute end-0 top-[calc(100%+6px)] z-[100] min-w-[230px] rounded-[8px] bg-white py-[6px] shadow-[0_8px_24px_rgba(17,24,39,0.12)]"
                            role="menu"
                        >
                            {MENU_ITEMS.map(({ id, label, href, Icon }) =>
                                id === 'rejection' ? (
                                    <button
                                        key={id}
                                        type="button"
                                        role="menuitem"
                                        onClick={() => {
                                            setOpen(false)
                                            setRejectionDrawerOpen(true)
                                        }}
                                        className="flex w-full cursor-pointer items-center gap-[12px] p-[6px_16px] text-left transition hover:bg-[#f3f4f6]"
                                    >
                                        <Icon className="h-[20px] w-[20px] shrink-0" />
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262a]">{label}</p>
                                    </button>
                                ) : (
                                    <Link
                                        key={id}
                                        href={id === 'profile' ? profileHref : href}
                                        role="menuitem"
                                        onClick={() => setOpen(false)}
                                        className="flex cursor-pointer items-center gap-[12px] p-[6px_16px] transition hover:bg-[#f3f4f6]"
                                    >
                                        <Icon className="h-[20px] w-[20px] shrink-0" fill="#464c55" />
                                        <p className="text-[14px] font-[Inter-Regular] text-[#23262a]">{label}</p>
                                    </Link>
                                )
                            )}
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    setOpen(false)
                                    router.push('/')
                                }}
                                className="border-t border-[rgba(143,143,143,0.25)] flex w-full cursor-pointer items-center gap-[12px] p-[10px_16px] text-left text-[14px] font-[Inter-Regular] text-[#111827] transition hover:bg-[#f3f4f6]"
                            >
                                <JobLogoutIcon className='h-[20px] w-[20px] shrink-0' />
                                <p className="text-[14px] font-[Inter-Regular] text-[#23262a]">Logout</p>
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
            <RejectionRulesDrawer open={rejectionDrawerOpen} onClose={() => setRejectionDrawerOpen(false)} />
        </header>
    )
}

export default JobDashboardHeader
