'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { DownArrowIcon, EditIcon, FileIcon, MicIcon, PersonalUserIcon, PortfolioIcon, SkillsIcon } from '@/components/CustomFile/icons'
import coverimage from '../../../../../public/assets/img/profile/coverimage.png'
import user from '../../../../../public/assets/img/user.jpeg'
import graduatecap from '../../../../../public/assets/img/profile/graduatecap.svg'
import work from '../../../../../public/assets/img/profile/work.svg'
import license from '../../../../../public/assets/img/profile/license.svg'

const missingItemClass =
    'flex items-center gap-[12px] rounded-[6px] bg-white p-[8px] hover:[box-shadow:0px_3px_3px_-2px_rgba(0,0,0,0.1),0px_3px_4px_0px_rgba(0,0,0,0.07),0px_1px_8px_0px_rgba(0,0,0,0.06)]'

function MissingItem({ icon, label, onClick }) {
    const inner = (
        <>
            <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[4px] bg-[#EDF0FF]">{icon}</div>
            <p className="text-[12px] font-[Inter-Medium] text-[#23262A]">{label}</p>
        </>
    )
    if (onClick) {
        return (
            <button type="button" onClick={onClick} className={`${missingItemClass} w-full cursor-pointer text-left`}>
                {inner}
            </button>
        )
    }
    return <div className={`${missingItemClass} cursor-default`}>{inner}</div>
}

/**
 * @param {{
 *   onEditProfile?: () => void;
 *   displayName?: string;
 *   availabilityLabel?: string;
 *   subtitle?: string;
 *   onSectionClick?: (section: 'qualification' | 'experience' | 'skills' | 'resume' | 'digitalProfile' | 'portfolio' | 'licenses' | 'reference') => void;
 * }} props
 */
export default function ProfileJobSidebar({
    onEditProfile,
    displayName = 'Muthulakshmi',
    availabilityLabel = '',
    subtitle = '',
    profileImageSrc = '',
    onSectionClick,
    missingSections = ['qualification', 'experience', 'skills', 'resume', 'digitalProfile', 'licenses', 'portfolio', 'reference'],
}) {
    const [moreOpen, setMoreOpen] = useState(false)
    const moreWrapRef = useRef(null)

    useEffect(() => {
        if (!moreOpen) return
        const onDoc = (e) => {
            if (moreWrapRef.current?.contains(e.target)) return
            setMoreOpen(false)
        }
        document.addEventListener('mousedown', onDoc)
        document.addEventListener('touchstart', onDoc)
        return () => {
            document.removeEventListener('mousedown', onDoc)
            document.removeEventListener('touchstart', onDoc)
        }
    }, [moreOpen])

    useEffect(() => {
        if (!moreOpen) return
        const onKey = (e) => {
            if (e.key === 'Escape') setMoreOpen(false)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [moreOpen])

    const sectionMeta = {
        qualification: {
            icon: <Image src={graduatecap} alt="graduatecap" width={14} height={14} />,
            label: 'Qualification',
        },
        experience: {
            icon: <Image src={work} alt="work" width={14} height={14} />,
            label: 'Experiences',
        },
        skills: {
            icon: <SkillsIcon width={14} height={14} fill="#3A88EF" fillOpacity="1" />,
            label: 'Skills',
        },
        resume: {
            icon: <FileIcon width={14} height={14} fill="#3A88EF" fillOpacity="1" />,
            label: 'Resume',
        },
        digitalProfile: {
            icon: <MicIcon width={14} height={14} fill="#3A88EF" fillOpacity="1" />,
            label: 'Digital Profile',
        },
        licenses: {
            icon: <Image src={license} alt="license" width={10} height={10} />,
            label: 'Licences or Certificates',
        },
        portfolio: {
            icon: <PortfolioIcon width={14} height={14} fill="#3A88EF" />,
            label: 'Portfolio',
        },
        reference: {
            icon: <PersonalUserIcon width={14} height={14} fill="#3A88EF" />,
            label: 'Reference',
        },
    }
    const totalSections = 8
    const remainingCount = Array.isArray(missingSections) ? missingSections.length : totalSections
    const completedCount = Math.max(0, totalSections - remainingCount)
    const progressWidth = `${Math.min(100, Math.max(0, Math.round((completedCount / totalSections) * 100)))}%`

    return (
        <aside className="overflow-visible rounded-[12px] bg-white">
            <div className="relative h-[110px] overflow-hidden rounded-t-[12px]">
                <Image src={coverimage} alt="cover" fill className="object-cover" />
                <div ref={moreWrapRef} className="absolute right-[18px] top-[18px] z-[15]">
                    <button
                        type="button"
                        className="inline-flex cursor-pointer items-center gap-[4px] rounded-[6px] p-[2px] text-[#23262A] outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#3a88ef] focus-visible:ring-offset-2"
                        aria-expanded={moreOpen}
                        aria-haspopup="menu"
                        aria-controls="profile-sidebar-more-menu"
                        onClick={() => setMoreOpen((o) => !o)}
                    >
                        <span className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">More</span>
                        <DownArrowIcon
                            width={20}
                            height={20}
                            stroke="#23262A"
                            className={`h-[20px] w-[20px] shrink-0 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {moreOpen ? (
                        <div
                            id="profile-sidebar-more-menu"
                            role="menu"
                            className="absolute right-0 top-[calc(100%+8px)] z-[20] min-w-[168px] overflow-hidden rounded-[6px] border border-[rgba(143,143,143,0.22)] bg-white py-[6px] shadow-[0px_8px_24px_rgba(0,0,0,0.12)]"
                        >
                            <button
                                type="button"
                                role="menuitem"
                                className="flex w-full cursor-pointer items-center gap-[10px] px-[14px] py-[12px] text-left transition-colors hover:bg-[#F3F4F6]"
                                onClick={() => {
                                    setMoreOpen(false)
                                    onEditProfile?.()
                                }}
                            >
                                <EditIcon width={20} height={20} className="h-[20px] w-[20px] shrink-0" fill="#23262A" />
                                <p className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">Edit</p>
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="relative px-[24px] pb-[24px]">
                <div className="mx-auto mb-[20px] mt-[-42px] h-[130px] w-[130px] overflow-hidden rounded-full">
                    <Image src={profileImageSrc || user} alt="profile avatar" width={130} height={130} className="h-[130px] w-[130px] object-cover" />
                </div>

                <div className="mb-[6px] flex flex-col gap-[10px]">
                    <h3 className="text-center text-[22px] font-[Inter-Bold] text-[#0F172A]">{displayName}</h3>
                    {String(availabilityLabel ?? '').trim() ? (
                        <div className="flex justify-center">
                            <span className="rounded-[8px] bg-[#f1f8e9] px-[10px] py-[5px] text-[10px] font-[Inter-SemiBold] text-[#008b04]">
                                {String(availabilityLabel).trim()}
                            </span>
                        </div>
                    ) : null}
                    {String(subtitle ?? '').trim() ? (
                        <p
                            className="line-clamp-2 break-words px-[8px] text-center text-[12px] font-[Inter-Medium] text-[#00000080]"
                            title={String(subtitle).trim()}
                        >
                            {String(subtitle).trim()}
                        </p>
                    ) : null}
                </div>

                <div className="rounded-[12px] bg-[#f5f9fe] p-[16px]">
                    <div className="mb-[14px] flex flex-col gap-[14px]">
                        <h4 className="text-[18px] font-[Inter-SemiBold] text-[#23262A]">{remainingCount} Sections Remaining</h4>
                        <div className="h-[8px] rounded-full bg-[#d8e2ff]">
                            <div className="h-[8px] rounded-full bg-[#3a88ef]" style={{ width: progressWidth }} />
                        </div>
                        <p className="text-[12px] font-[Inter-Regular] leading-[1.45] text-[#3a3f47]">
                            Complete candidate profiles get more attention from potential employers.
                        </p>
                    </div>

                    <div className="flex flex-col gap-[8px]">
                        {missingSections.map((section) => {
                            const meta = sectionMeta[section]
                            if (!meta) return null
                            return (
                                <MissingItem
                                    key={section}
                                    icon={meta.icon}
                                    label={meta.label}
                                    onClick={() => onSectionClick?.(section)}
                                />
                            )
                        })}
                    </div>
                </div>
            </div>
        </aside>
    )
}
