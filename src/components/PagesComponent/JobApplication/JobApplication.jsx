'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSelector } from 'react-redux'
import { ReportAdFlagIcon } from '@/components/CustomFile/icons'
import { userSignUpData } from '@/redux/reuducer/authSlice'
import { getMyJobApplicationApi } from '@/utils/api'
import emptyimage from '../../../../public/assets/img/emptyImage.svg'
import commitment from '../../../../public/assets/img/icons/commitment.svg'
import ReportListingModal from '../ProductDetail/components/ReportListingModal'

const FILTERS = [
    { key: 'all', label: 'All Applications' },
    { key: 'under_review', label: 'Under Review' },
    { key: 'rejected', label: 'Rejected' },
]

function parseApiPayload(payload) {
    if (typeof payload !== 'string') return payload || {}
    const debugAssetIndex = payload.indexOf("<link rel='stylesheet'")
    const scriptIndex = payload.indexOf('<script')
    const cutIndex = debugAssetIndex >= 0 ? debugAssetIndex : scriptIndex
    const jsonText = cutIndex >= 0 ? payload.slice(0, cutIndex) : payload
    try {
        return JSON.parse(jsonText)
    } catch (e) {
        console.error('my job applications parse failed:', e)
        return {}
    }
}

function formatDateLabel(value) {
    if (!value) return '-'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function isRejectedApplication(row) {
    const raw = String(row?.application_status || '').trim().toLowerCase()
    if (raw.includes('reject')) return true
    if (Number(row?.status) === 0) return true
    return false
}

function applicationFilterKey(row) {
    return isRejectedApplication(row) ? 'rejected' : 'under_review'
}

function applicationStatusLabel(row) {
    if (isRejectedApplication(row)) return 'Rejected'
    const raw = String(row?.application_status || '').trim()
    return raw || 'Under Review'
}

function StatusBadge({ label, rejected }) {
    if (rejected) {
        return (
            <span className="inline-block rounded-full bg-[#e00000] px-[8px] py-[3px] text-[10px] font-[Inter-SemiBold] text-white">
                Rejected
            </span>
        )
    }
    return (
        <span className="inline-block rounded-full bg-[#43bb3f] px-[8px] py-[3px] text-[10px] font-[Inter-SemiBold] text-white">
            {label}
        </span>
    )
}

function Thumb({ src }) {
    if (!src) {
        return <div className="h-[70px] w-[70px] shrink-0 rounded-[8px] bg-[#E8EEF4]" aria-hidden />
    }
    return (
        <div className="relative h-[70px] w-[70px] shrink-0 overflow-hidden rounded-[8px]">
            <Image src={src} alt="" fill className="object-cover" sizes="70px" />
        </div>
    )
}

export default function JobApplication() {
    const userData = useSelector(userSignUpData)
    const [filter, setFilter] = useState('all')
    const [applications, setApplications] = useState([])
    const [apiCounts, setApiCounts] = useState({ under_review: 0, rejected: 0 })
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)
    const [selectedApplication, setSelectedApplication] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const userId = userData?.id
        if (!userId) {
            setApplications([])
            setApiCounts({ under_review: 0, rejected: 0 })
            return
        }

        let cancelled = false
        setLoading(true)
        const loadMyApplications = async () => {
            try {
                const response = await getMyJobApplicationApi.getMyJobApplication({ user_id: userId })
                const parsed = parseApiPayload(response?.data)
                const rows = Array.isArray(parsed?.data) ? parsed.data : []
                const mapped = rows.map((row, idx) => {
                    const item = row?.item_details || {}
                    return {
                        id: row?.id ?? `app-${idx}`,
                        status: applicationFilterKey(row),
                        statusLabel: applicationStatusLabel(row),
                        title: item?.name || '-',
                        applicants: row?.applicant_count ?? 0,
                        appliedOn: formatDateLabel(row?.created_at),
                        postedOn: formatDateLabel(item?.created_at),
                        thumbSrc: item?.image || '',
                        slug: item?.slug || row?.item_slug || row?.item_id || '',
                        raw: row,
                    }
                })
                if (cancelled) return
                setApplications(mapped)
                setApiCounts({
                    under_review: Number(parsed?.under_review_count || 0),
                    rejected: Number(parsed?.rejected_count || 0),
                })
            } catch (e) {
                if (!cancelled) {
                    setApplications([])
                    setApiCounts({ under_review: 0, rejected: 0 })
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        loadMyApplications()
        return () => {
            cancelled = true
        }
    }, [userData?.id])

    const counts = useMemo(() => {
        const all = applications.length
        const underFromRows = applications.filter((a) => a.status === 'under_review').length
        const rejectedFromRows = applications.filter((a) => a.status === 'rejected').length
        return {
            all,
            under_review: apiCounts.under_review || underFromRows,
            rejected: apiCounts.rejected || rejectedFromRows,
        }
    }, [applications, apiCounts.under_review, apiCounts.rejected])

    const filtered = useMemo(() => {
        if (filter === 'all') return applications
        return applications.filter((a) => a.status === filter)
    }, [applications, filter])

    const pillBase =
        'inline-flex cursor-pointer items-center gap-[6px] rounded-full border px-[16px] py-[6px] text-[14px] font-[Inter-SemiBold] transition-colors'

    return (
        <div className="w-full bg-white pb-[40px]">
            <div className="mx-auto max-w-[1170px] max-sm:max-w-full max-sm:px-[15px] common_container ">

                <div className='border-b border-[rgba(143,143,143,0.22)] pb-[24px]'>
                    <h1 className="mb-[20px] text-[22px] font-[Inter-Bold] leading-tight text-[#23262A]">My Job Applications</h1>

                    <div className="flex flex-wrap gap-[10px]">
                        {FILTERS.map(({ key, label }) => {
                            const count = counts[key]
                            const active = filter === key
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setFilter(key)}
                                    className={`${pillBase} ${active
                                        ? 'border-[#23262A] bg-[#23262A] text-white'
                                        : 'border-[#23262A] bg-white text-[#23262A] '
                                        }`}
                                >
                                    {label}
                                    <span className={active ? 'text-[#fff]' : 'text-[#23262A]'}>({count})</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {loading ? (
                    <div className="pt-[24px]">
                        <h2 className="text-[26px] font-[Inter-SemiBold] leading-tight text-[#23262A]">Loading applications...</h2>
                    </div>
                ) : applications.length === 0 ? (
                    <div className="pt-[24px]">
                        <h2 className="text-[26px] font-[Inter-SemiBold] leading-tight text-[#23262A]">No applications yet</h2>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="pt-[24px]">
                        <h2 className="text-[26px] font-[Inter-SemiBold] leading-tight text-[#23262A]">No applications in this category</h2>
                    </div>
                ) : (
                    <ul className="divide-y divide-[rgba(143,143,143,0.22)]">
                        {filtered.map((app) => (
                            <li key={app.id} className="py-[32px]">
                                <div className="flex items-end justify-between gap-[24px] max-sm:flex-col max-sm:items-start max-sm:justify-start">
                                    <div className="flex min-w-0 flex-1 gap-[14px] sm:gap-[18px] max-sm:flex-col">
                                        <Thumb src={app.thumbSrc ?? emptyimage} />
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-[6px]">
                                                <StatusBadge label={app.statusLabel} rejected={app.status === 'rejected'} />
                                            </div>
                                            <h2 className="mb-[6px] text-[14px] font-[Inter-Medium] leading-snug text-[#23262A] ">{app.title}</h2>
                                            <p className="mb-[6px] text-[14px] font-[Inter-Regular] text-[#23262a80] ">
                                                {app.applicants} Applicants <span className="text-[#8f8f8f]">•</span> Applied on {app.appliedOn}
                                            </p>
                                            <div className="flex items-center gap-[6px]">
                                                <Image src={commitment} alt="commitment" width={16} height={16} />
                                                <p className="text-[12px] font-[Inter-Bold] text-[#23262a]">
                                                    Ad posted on {app.postedOn}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-[20px]">
                                        <Link href={app.slug ? `/productdetail?slug=${encodeURIComponent(String(app.slug))}&item=jobs-seekers&mode=jobs` : '/jobs'} className="text-[12px] font-[Inter-SemiBold] text-[#3a88ef] ">
                                            View
                                        </Link>
                                        <button
                                            type="button"
                                            className="cursor-pointer inline-flex items-center gap-[6px] text-[14px] font-[Inter-Medium] text-[#23262A]"
                                            onClick={() => {
                                                /* TODO: open report flow */
                                                setSelectedApplication(app)
                                                setIsReportModalOpen(true)
                                            }}
                                        >
                                            <ReportAdFlagIcon className="h-[16px] w-[16px] shrink-0 text-[#23262A]" aria-hidden />
                                            Report This Ad
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <ReportListingModal
                open={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                brandName="ebozor"
                onSubmitReport={() => { }}
                productData={selectedApplication?.raw || selectedApplication}
            />
        </div>
    )
}
