'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { PlusIcon, RightArrowIcon, SearchIcon } from '@/components/CustomFile/icons'
import dashboardempty from '../../../../../public/assets/img/jobdashboard/dashboardempty.svg'
import location from '../../../../../public/assets/img/jobdashboard/icons/location.svg'
import salary from '../../../../../public/assets/img/jobdashboard/icons/salary.svg'
import { chanegItemStatusApi, getMyItemsApi, getMyItemsCountApi } from '@/utils/api'
import { placeholderImage } from '@/utils'

const JOBS_RECRUITERS_SLUG = 'jobs-jobs-seekers'
const ITEMS_PER_PAGE = 10

const STATUS_TABS = [
    { id: 'live', label: 'Live', countKey: 'live' },
    // { id: 'drafts', label: 'Drafts', countKey: 'drafts' },
    { id: 'pending', label: 'Pending Payment', countKey: 'payment_pending' },
    { id: 'review', label: 'Under Review', countKey: 'under_review' },
    { id: 'rejected', label: 'Rejected', countKey: 'rejected' },
    { id: 'expired', label: 'Expired', countKey: 'expired' },
]

const TAB_TO_API_STATUS = {
    live: 'approved',
    pending: 'pending payment',
    review: 'review',
    rejected: 'rejected',
    expired: 'expired',
}

function normalizeJobStatusRaw(status) {
    return String(status || '')
        .trim()
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ')
}

function canShowJobStatusButton(tabId, statusRaw) {
    if (tabId !== 'live') return false
    const value = normalizeJobStatusRaw(statusRaw)
    if (value === 'inactive') return false
    return value === 'approved' || value === 'review' || value === 'under review'
}

function getJobStatusButtonLabel(statusRaw) {
    return normalizeJobStatusRaw(statusRaw) === 'inactive' ? 'Activate' : 'Deactivate'
}

function getJobStatusToggleNext(statusRaw) {
    return normalizeJobStatusRaw(statusRaw) === 'inactive' ? 'active' : 'inactive'
}

/** Backend may append `<script>` after JSON (N+1 debug); strip before parse. */
function parseApiBody(axiosRes) {
    let body = axiosRes?.data
    if (body == null) return null
    if (typeof body === 'string') {
        try {
            const clean = body.split('<script')[0].split('<link')[0].trim()
            if (!clean) return null
            body = JSON.parse(clean)
        } catch {
            return null
        }
    }
    return body
}

function parseMyItemsCounts(body) {
    if (!body || body.error === true) return {}
    const data = body.data || {}
    return {
        live: Number(data.live ?? 0),
        payment_pending: Number(data.payment_pending ?? 0),
        under_review: Number(data.under_review ?? 0),
        rejected: Number(data.rejected ?? 0),
        expired: Number(data.expired ?? 0),
    }
}

function parseMyItemsList(body) {
    if (!body || body.error === true) {
        return { list: [], currentPage: 1, lastPage: 1 }
    }
    const payload = body.data
    if (payload && Array.isArray(payload.data)) {
        return {
            list: payload.data,
            currentPage: Number(payload.current_page) || 1,
            lastPage: Math.max(1, Number(payload.last_page) || 1),
        }
    }
    if (Array.isArray(payload)) {
        return { list: payload, currentPage: 1, lastPage: 1 }
    }
    return { list: [], currentPage: 1, lastPage: 1 }
}

function getCustomFieldValue(item, fieldName) {
    const fields = Array.isArray(item?.custom_fields) ? item.custom_fields : []
    const field = fields.find(
        (f) => String(f?.name || '').trim().toLowerCase() === String(fieldName || '').trim().toLowerCase()
    )
    const val = field?.value ?? field?.custom_field_value?.value
    if (Array.isArray(val)) {
        const joined = val.map((v) => String(v ?? '').trim()).filter(Boolean).join(', ')
        return joined || ''
    }
    return val != null && String(val).trim() !== '' ? String(val).trim() : ''
}

function mapJobItem(item) {
    const monthlySalary = getCustomFieldValue(item, 'Monthly Salary')
    return {
        id: item?.id,
        title: String(item?.name || '').trim() || 'Untitled',
        image: String(item?.image || '').trim(),
        country: String(item?.country || '').trim() || '—',
        salary: monthlySalary || 'Not Mentioned',
        slug: item?.slug,
        statusRaw: normalizeJobStatusRaw(item?.status),
    }
}

function JobCardSkeleton() {
    return (
        <div
            className="[box-shadow:0px_3px_3px_-2px_rgba(0,0,0,0.1),0px_3px_4px_rgba(0,0,0,0.07),0px_1px_8px_rgba(0,0,0,0.06)] animate-pulse rounded-[6px] bg-white"
        >
            <div className="flex min-w-0 flex-1 items-center gap-[14px] border-b border-[rgba(143,143,143,0.16)] p-[16px]">
                <div className="h-[48px] w-[48px] shrink-0 rounded-full bg-[#eef1f4]" />
                <div className="h-[16px] flex-1 rounded bg-[#eef1f4]" />
            </div>
            <div className="flex flex-col gap-[10px] p-[20px]">
                <div className="h-[14px] w-[70%] rounded bg-[#eef1f4]" />
                <div className="h-[14px] w-[55%] rounded bg-[#eef1f4]" />
            </div>
        </div>
    )
}


const DashboardPage = () => {
    const [status, setStatus] = useState('live')
    const [search, setSearch] = useState('')
    const [statusSavingById, setStatusSavingById] = useState({})
    const [jobs, setJobs] = useState([])
    const [counts, setCounts] = useState({})
    const [loading, setLoading] = useState(true)
    const [countsLoading, setCountsLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [lastPage, setLastPage] = useState(1)

    const tabsMeta = useMemo(
        () =>
            STATUS_TABS.map((tab) => ({
                ...tab,
                count: Number(counts?.[tab.countKey] ?? 0),
            })),
        [counts]
    )

    const activeTabMeta = tabsMeta.find((t) => t.id === status)

    const filteredJobs = useMemo(() => {
        const q = String(search || '').trim().toLowerCase()
        if (!q) return jobs
        return jobs.filter((job) => String(job.title || '').toLowerCase().includes(q))
    }, [jobs, search])

    const fetchCounts = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setCountsLoading(true)
        try {
            const res = await getMyItemsCountApi.getMyItemsCount({
                category_slug: JOBS_RECRUITERS_SLUG,
            })
            const body = parseApiBody(res)
            setCounts(parseMyItemsCounts(body))
        } catch {
            if (!silent) setCounts({})
        } finally {
            if (!silent) setCountsLoading(false)
        }
    }, [])

    const fetchJobs = useCallback(async (tabId, page) => {
        setLoading(true)
        try {
            const res = await getMyItemsApi.getMyItems({
                page,
                per_page: ITEMS_PER_PAGE,
                category_slug: JOBS_RECRUITERS_SLUG,
                status: TAB_TO_API_STATUS[tabId],
            })
            const body = parseApiBody(res)
            const { list, currentPage: apiPage, lastPage: apiLastPage } = parseMyItemsList(body)
            setJobs(list.map(mapJobItem))
            setCurrentPage(apiPage || page || 1)
            setLastPage(apiLastPage)
        } catch {
            setJobs([])
            setCurrentPage(1)
            setLastPage(1)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCounts()
    }, [fetchCounts])

    useEffect(() => {
        fetchJobs(status, currentPage)
    }, [status, currentPage, fetchJobs])

    const emptyCopy = useMemo(() => {
        const label = activeTabMeta?.label || 'Live'
        return {
            title: `There are no ${label} listings.`,
            hint: 'Please refine your search using the filters above.',
        }
    }, [activeTabMeta])

    const totalPages = Math.max(1, lastPage)

    const updateJobStatus = async (job) => {
        if (!job?.id) return
        const nextStatus = getJobStatusToggleNext(job.statusRaw)
        try {
            setStatusSavingById((prev) => ({ ...prev, [job.id]: true }))
            const res = await chanegItemStatusApi.changeItemStatus({
                item_id: job.id,
                status: nextStatus,
            })
            const body = parseApiBody(res)
            if (body?.error === false) {
                if (nextStatus === 'inactive') {
                    setJobs((prev) => prev.filter((item) => item.id !== job.id))
                    if (status === 'live') {
                        setCounts((prev) => ({
                            ...prev,
                            live: Math.max(0, Number(prev?.live ?? 0) - 1),
                        }))
                    }
                    toast.success(body?.message || 'Status updated')
                } else {
                    setJobs((prev) => prev.filter((item) => item.id !== job.id))
                    if (status === 'live') {
                        setCounts((prev) => ({
                            ...prev,
                            live: Math.max(0, Number(prev?.live ?? 0) - 1),
                            under_review: Number(prev?.under_review ?? 0) + 1,
                        }))
                    }
                    toast.success(
                        body?.message || 'Your listing has been submitted and is under review.'
                    )
                }
                fetchCounts({ silent: true })
            } else {
                toast.error(body?.message || 'Failed to update status')
            }
        } catch {
            toast.error('Failed to update status')
        } finally {
            setStatusSavingById((prev) => ({ ...prev, [job.id]: false }))
        }
    }

    return (
        <div className="p-[24px]">

            {/* {status === 'drafts' ? (
                <div className="mb-[16px] flex items-start gap-[10px] rounded-[6px] bg-[#1270ec] p-[16px_16px] fixed top-[64px] left-[280px] rtl:right-[280px] rtl:left-0 right-0 z-[2] max-sm:left-0 max-sm:right-0  ">
                    <div className="">
                        <InfoIcon className="w-[20px] h-[20px]" />
                    </div>
                    <p className="text-[14px] font-[Inter-Regular] text-white">
                        Drafts that remain inactive will be automatically deleted after 4 months
                    </p>
                </div>
            ) : null} */}

            <div className="mb-[24px] flex flex-wrap items-start justify-between gap-[16px]">
                <h1 className="text-[20px] font-[Inter-Medium] leading-tight text-[#141414]">Jobs Dashboard</h1>
                <button
                    type="button"
                    className="inline-flex shrink-0 cursor-pointer items-center gap-[6px] rounded-[6px] border border-[#DC0000] p-[4px_10px] text-[12px] font-[Inter-Medium] text-[#DC0000] transition "
                >
                    0 Credits Remaining
                    <RightArrowIcon className="w-[16px] h-[16px] rtl:rotate-180" stroke='#DC0000' />
                </button>
            </div>

            <div className="mb-[18px] flex flex-col gap-[12px] lg:flex-row lg:items-center lg:justify-between">
                <div className="hide_scrollbar flex gap-[8px] overflow-x-auto whitespace-nowrap">
                    {tabsMeta.map((tab) => {
                        const active = status === tab.id
                        const countLabel = countsLoading ? '…' : tab.count
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => {
                                    setStatus(tab.id)
                                    setCurrentPage(1)
                                }}
                                className={`cursor-pointer rounded-[8px] border p-[6px_12px] text-[12px] font-[Inter-Regular] transition ${
                                    active
                                        ? 'border-[#23262A] bg-[#23262A] text-white'
                                        : 'border-[rgba(143,143,143,0.35)] bg-transparent text-[#111827]'
                                }`}
                            >
                                {tab.label} ({countLabel})
                            </button>
                        )
                    })}
                </div>
                <div className="relative w-full min-w-0 lg:max-w-[280px] lg:flex-1">
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by job title"
                        className="w-full rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white p-[10px_12px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#8F8F8F]"
                    />
                    <div className="pointer-events-none absolute right-[12px] rtl:left-[12px] rtl:right-auto top-1/2 -translate-y-1/2">
                        <SearchIcon className="w-[24px] h-[24px]" stroke='#23262A' />
                    </div>
                </div>
            </div>

            <div>
                {loading ? (
                    <div className="flex flex-col gap-[16px]">
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <JobCardSkeleton key={`job-dashboard-skeleton-${idx}`} />
                        ))}
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="rounded-[6px] bg-white p-[24px] [box-shadow:0px_4px_8px_-2px_rgba(0,0,0,0.02),0px_3px_8px_rgba(0,0,0,0.02),0px_1px_10px_rgba(0,0,0,0.04)]">
                        <div className="flex flex-col items-center py-[8px]">
                            <div>
                                <Image
                                    src={dashboardempty}
                                    alt="dashboardempty"
                                    width={550}
                                    height={318}
                                    className="h-[318px] w-[550px]"
                                />
                            </div>
                            <div className="mb-[14px]">
                                <p className="mb-[6px] text-center text-[14px] font-[Inter-Regular] text-[#616161]">
                                    {search.trim() ? 'No jobs match your search.' : emptyCopy.title}
                                </p>
                                <p className="text-center text-[14px] font-[Inter-Regular] text-[#616161]">
                                    {emptyCopy.hint}
                                </p>
                            </div>
                            <Link
                                href="/placeyourad"
                                className="inline-flex cursor-pointer items-center gap-[8px] rounded-[6px] bg-[#DC0000] p-[14px_26px] transition "
                            >
                                <PlusIcon className="h-[15px] w-[15px]" />
                                <p className="text-[14px] font-[Inter-SemiBold] leading-none text-[#fff]">Post A Job</p>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-[16px]">
                            {filteredJobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="[box-shadow:0px_3px_3px_-2px_rgba(0,0,0,0.1),0px_3px_4px_rgba(0,0,0,0.07),0px_1px_8px_rgba(0,0,0,0.06)] rounded-[6px] bg-white"
                                >
                                    <div className="flex min-w-0 flex-1 items-center gap-[14px] border-b border-[rgba(143,143,143,0.16)] p-[16px]">
                                        <div className="relative h-[48px] w-[48px] shrink-0 overflow-hidden rounded-full bg-[#dbeafe]">
                                            {job.image ? (
                                                <Image
                                                    src={job.image}
                                                    alt={job.title}
                                                    fill
                                                    className="object-cover"
                                                    onErrorCapture={placeholderImage}
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-[#dbeafe] text-[12px] font-[Inter-Medium] text-[#3A88EF]">
                                                    {String(job.title || 'J').charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h2 className="truncate text-[16px] font-[Inter-SemiBold] text-[#23262A]">
                                                {job.title}
                                            </h2>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-[20px] max-sm:flex-col max-sm:items-start max-sm:gap-[10px]">
                                        <div className="flex flex-col gap-[10px]">
                                            <div className="flex items-center gap-[8px]">
                                                <Image
                                                    src={location}
                                                    alt="location"
                                                    width={16}
                                                    height={16}
                                                    className="h-[16px] w-[16px]"
                                                />
                                                <p className="text-[16px] font-[Inter-Regular] text-[#23262A]">
                                                    {job.country}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-[8px]">
                                                <Image
                                                    src={salary}
                                                    alt="salary"
                                                    width={16}
                                                    height={16}
                                                    className="h-[16px] w-[16px]"
                                                />
                                                <p className="text-[16px] font-[Inter-Regular] text-[#23262A]">
                                                    {job.salary}
                                                </p>
                                            </div>
                                        </div>
                                        {canShowJobStatusButton(status, job.statusRaw) ? (
                                            <div className="flex shrink-0 flex-col gap-2">
                                                <button
                                                    type="button"
                                                    disabled={Boolean(statusSavingById[job.id])}
                                                    onClick={() => updateJobStatus(job)}
                                                    className="inline-flex w-full cursor-pointer items-center justify-center rounded-[6px] border border-[#DC0000] bg-white p-[8px_50px] transition disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <p className="text-[14px] font-[Inter-SemiBold] leading-[24px] text-[#DC0000]">
                                                        {getJobStatusButtonLabel(job.statusRaw)}
                                                    </p>
                                                </button>
                                                <Link
                                                    href={`/jobdashboard/hiringpipeline/${job.id}`}
                                                    className="inline-flex w-full cursor-pointer items-center justify-center rounded-[6px] bg-[#3a88ef] p-[8px_50px] transition"
                                                >
                                                    <p className="text-[14px] font-[Inter-SemiBold] leading-[24px] text-white">
                                                        View Pipeline
                                                    </p>
                                                </Link>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {totalPages > 1 ? (
                            <div className="mt-[18px] flex items-center justify-center gap-[8px]">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="inline-flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white text-[18px] text-[#9ca3af] disabled:cursor-not-allowed disabled:opacity-60"
                                    aria-label="Previous page"
                                >
                                    ‹
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => setCurrentPage(page)}
                                        className={`inline-flex h-[32px] min-w-[32px] cursor-pointer items-center justify-center rounded-[6px] border p-[0_8px] text-[14px] font-[Inter-Medium] ${
                                            currentPage === page
                                                ? 'border-[#23262A] bg-[#23262A] text-white'
                                                : 'border-[rgba(143,143,143,0.35)] bg-white text-[#23262A]'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="inline-flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white text-[18px] text-[#23262A] disabled:cursor-not-allowed disabled:opacity-60"
                                    aria-label="Next page"
                                >
                                    ›
                                </button>
                            </div>
                        ) : null}
                    </>
                )}
            </div>

        </div>
    )
}

export default DashboardPage
