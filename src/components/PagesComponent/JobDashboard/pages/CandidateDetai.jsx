'use client'

import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import { DocumentIcon, UploadLinkIcon } from '@/components/CustomFile/icons'
import { rootSignupData, userSignUpData } from '@/redux/reuducer/authSlice'
import {
    candidateDetailsApi,
    getSavedCandidateDetailsApi,
    getUnsavedCandidateDetailsApi,
} from '@/utils/api'
import user from '../../../../../public/assets/img/jobdashboard/user.jpeg'
import resumeimg from '../../../../../public/assets/img/resume.svg'

function fileNameFromCvUrl(url) {
    if (!url || typeof url !== 'string') return 'Resume.pdf'
    try {
        const base = url.split('?')[0]
        const seg = base.split('/').filter(Boolean).pop()
        if (!seg) return 'Resume.pdf'
        return decodeURIComponent(seg)
    } catch {
        return 'Resume.pdf'
    }
}

function CandidateResumeField({ serverCvUrl, candidateId }) {
    const [showPdfPreview, setShowPdfPreview] = useState(false)
    const label = 'Resume'

    const viewUrl = useMemo(() => resolveMediaUrl(serverCvUrl || ''), [serverCvUrl])
    const displayName = viewUrl ? fileNameFromCvUrl(viewUrl) : ''
    const isPdf = /\.pdf(\?|$)/i.test(viewUrl || '')

    useEffect(() => {
        setShowPdfPreview(false)
    }, [candidateId, viewUrl])

    const onViewClick = () => {
        if (!viewUrl) return
        if (isPdf) {
            setShowPdfPreview((open) => !open)
            return
        }
        window.open(viewUrl, '_blank', 'noopener,noreferrer')
    }

    return (
        <div>
            <p className="mb-[10px] text-[18px] font-[Inter-SemiBold] text-[#23262A]">{label}</p>
            {!viewUrl ? (
                <div className="rounded-[6px] border border-[rgba(143,143,143,0.22)] bg-[#fafbfc] px-[16px] py-[20px] text-center">
                    <p className="text-[14px] font-[Inter-Regular] text-[#666b72]">No resume file is available for this candidate.</p>
                </div>
            ) : (
                <>
                    <div className="overflow-hidden rounded-[6px] bg-[#d8e2ff]">
                        <div className="relative flex h-[60px] items-center justify-center rounded-[6px] bg-[#d8e2ff]">
                            <Image src={resumeimg} alt="resume" width={80} height={80} className="mt-[40px] h-auto w-auto" />
                        </div>
                        <div className="relative z-[9] flex items-center justify-between gap-[12px] bg-[#f5f9fe] p-[8px_16px]">
                            <div className="flex min-w-0 flex-1 items-center gap-[10px]">
                                <div className="shrink-0">
                                    <DocumentIcon className="h-[24px] w-[24px]" width={24} height={24} fill="#3a88ef" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="mb-[4px] text-[14px] font-[Inter-Regular] text-[#23262A]">{label}</h4>
                                    <p className="truncate text-[12px] font-[Inter-Regular] text-[#23262A]" title={displayName}>
                                        {displayName}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onViewClick}
                                className="flex shrink-0 cursor-pointer items-center gap-[6px] rounded-[8px] border border-[#23262A] p-[8px_6px] text-[13px] font-[Inter-Medium] text-[#23262A] transition-colors hover:bg-[#F3F4F6]"
                            >
                                {showPdfPreview && isPdf ? 'Hide' : 'View'}
                                <UploadLinkIcon className="h-[16px] w-[16px]" />
                            </button>
                        </div>
                    </div>
                    {showPdfPreview && isPdf ? (
                        <iframe
                            title="Resume PDF preview"
                            src={viewUrl}
                            className="mt-[12px] min-h-[520px] w-full rounded-[6px] border border-[rgba(143,143,143,0.2)] bg-white"
                        />
                    ) : null}
                </>
            )}
        </div>
    )
}

const CANDIDATE_DETAIL_CACHE_KEY = 'jobdashboard_candidate_detail_cache'
const FETCH_LIMIT = 250

function parseApiPayload(payload) {
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

function toDisplayValue(value) {
    const normalized = value != null ? String(value).trim() : ''
    return normalized || 'N / A'
}

function pickCvUrl(raw) {
    if (!raw || typeof raw !== 'object') return ''
    const keys = [
        'cv_url',
        'resume_url',
        'candidate_cv_url',
        'candidate_cv',
        'cv',
        'resume',
        'cv_file',
        'attachment',
        'attachments',
    ]
    for (const k of keys) {
        const v = raw[k]
        if (typeof v === 'string' && v.trim()) return v.trim()
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            const nested = [v.url, v.path, v.file, v.href].find((x) => typeof x === 'string' && x.trim())
            if (nested) return nested.trim()
        }
        if (Array.isArray(v)) {
            const first = v.find((x) => typeof x === 'string' && x.trim())
            if (first) return first.trim()
            const firstObj = v.find((x) => x && typeof x === 'object')
            if (firstObj) {
                const nested = [firstObj.url, firstObj.path, firstObj.file, firstObj.href].find((x) => typeof x === 'string' && x.trim())
                if (nested) return nested.trim()
            }
        }
    }
    if (raw.data && typeof raw.data === 'object') {
        const nestedDataCv = pickCvUrl(raw.data)
        if (nestedDataCv) return nestedDataCv
    }
    return ''
}

function resolveMediaUrl(href) {
    if (!href || typeof href !== 'string') return ''
    const t = href.trim()
    if (t.startsWith('http://') || t.startsWith('https://')) return t
    if (t.startsWith('//')) return `https:${t}`
    if (typeof window !== 'undefined' && t.startsWith('/')) return `${window.location.origin}${t}`
    return t
}

function mapRawCandidate(raw, isSaved) {
    return {
        id: raw?.id,
        name: toDisplayValue(raw?.full_name),
        profile: String(raw?.profile || '').trim(),
        nationality: toDisplayValue(raw?.nationality),
        currentPosition: toDisplayValue(raw?.current_position),
        desiredSalary: toDisplayValue(raw?.desired_salary),
        location: toDisplayValue(raw?.currentlt_locate),
        dateOfBirth: toDisplayValue(raw?.date_of_birth),
        education: toDisplayValue(raw?.education_level),
        languages: toDisplayValue(raw?.language),
        isSaved: isSaved != null ? Boolean(isSaved) : String(raw?.is_saved ?? '0') === '1',
        cvUrl: pickCvUrl(raw),
    }
}

function readCachedCandidate(id) {
    if (typeof window === 'undefined' || !id) return null
    try {
        const raw = sessionStorage.getItem(CANDIDATE_DETAIL_CACHE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (String(parsed?.id) !== String(id)) return null
        return {
            id: parsed.id,
            name: toDisplayValue(parsed.name),
            profile: String(parsed.profile || '').trim(),
            nationality: toDisplayValue(parsed.nationality),
            currentPosition: toDisplayValue(parsed.currentPosition),
            desiredSalary: toDisplayValue(parsed.desiredSalary),
            location: toDisplayValue(parsed.location),
            dateOfBirth: toDisplayValue(parsed.dateOfBirth ?? parsed.experience),
            education: toDisplayValue(parsed.education),
            languages: toDisplayValue(parsed.languages),
            isSaved: Boolean(parsed.isSaved),
            cvUrl: pickCvUrl(parsed) || (typeof parsed.cvUrl === 'string' ? parsed.cvUrl.trim() : ''),
        }
    } catch {
        return null
    }
}

async function fetchCandidateFromApis(userId, id) {
    const tryList = async (fn) => {
        const response = await fn()
        const parsed = parseApiPayload(response?.data)
        const list = Array.isArray(parsed?.data)
            ? parsed.data
            : parsed?.data && typeof parsed.data === 'object'
                ? [parsed.data]
                : []
        const rawFromList = list.find(
            (c) =>
                String(c?.id) === String(id) ||
                String(c?.user_id) === String(id)
        )
        if (rawFromList) return rawFromList
        const direct = parsed && typeof parsed === 'object' ? parsed : null
        if (
            direct &&
            (String(direct?.id) === String(id) || String(direct?.user_id) === String(id) || pickCvUrl(direct))
        ) {
            return direct
        }
        return null
    }

    try {
        const raw =
            (await tryList(() =>
                candidateDetailsApi.getCandidateDetails({
                    user_id: userId,
                    offset: 0,
                    limit: FETCH_LIMIT,
                })
            )) ||
            (await tryList(() =>
                getSavedCandidateDetailsApi.getSavedCandidateDetails({
                    user_id: userId,
                    offset: 0,
                    limit: FETCH_LIMIT,
                })
            )) ||
            (await tryList(() =>
                getUnsavedCandidateDetailsApi.getUnsavedCandidateDetails({
                    user_id: userId,
                    offset: 0,
                    limit: FETCH_LIMIT,
                })
            ))
        if (!raw) return null
        return mapRawCandidate(raw)
    } catch {
        return null
    }
}

function DetailSkeleton() {
    return (
        <div className="animate-pulse [box-shadow:0px_3px_3px_-2px_rgba(0,0,0,0.1),0px_3px_4px_rgba(0,0,0,0.07),0px_1px_8px_rgba(0,0,0,0.06)] rounded-[6px] bg-white">
            <div className="flex gap-[16px] border-b border-[rgba(143,143,143,0.16)] p-[20px]">
                <div className="h-[88px] w-[88px] shrink-0 rounded-full bg-[#eef1f4]" />
                <div className="flex flex-1 flex-col justify-center gap-[10px]">
                    <div className="h-[20px] w-[220px] rounded bg-[#eef1f4]" />
                    <div className="h-[14px] w-[140px] rounded bg-[#eef1f4]" />
                </div>
            </div>
            <div className="p-[24px]">
                <div className="mb-[10px] h-[14px] w-[80%] rounded bg-[#eef1f4]" />
                <div className="mb-[10px] h-[14px] w-[65%] rounded bg-[#eef1f4]" />
                <div className="h-[14px] w-[70%] rounded bg-[#eef1f4]" />
            </div>
        </div>
    )
}

const CandidateDetail = () => {
    const searchParams = useSearchParams()
    const candidateId = searchParams.get('id')
    const userData = useSelector(userSignUpData)
    const authRoot = useSelector(rootSignupData)

    const resolvedUserId = useMemo(
        () =>
            userData?.id ??
            userData?.data?.id ??
            userData?.user?.id ??
            authRoot?.data?.id ??
            authRoot?.data?.data?.id ??
            authRoot?.data?.user?.id ??
            null,
        [userData?.id, userData?.data?.id, userData?.user?.id, authRoot?.data?.id, authRoot?.data?.data?.id, authRoot?.data?.user?.id]
    )

    const [candidate, setCandidate] = useState(null)
    const [loading, setLoading] = useState(Boolean(candidateId))
    const [notFound, setNotFound] = useState(false)

    useLayoutEffect(() => {
        if (!candidateId) {
            setCandidate(null)
            return
        }
        const cached = readCachedCandidate(candidateId)
        if (cached) setCandidate(cached)
    }, [candidateId])

    useEffect(() => {
        if (!candidateId) {
            setCandidate(null)
            setLoading(false)
            setNotFound(false)
            return
        }

        const cached = readCachedCandidate(candidateId)

        if (!resolvedUserId) {
            setLoading(false)
            setNotFound(!cached)
            return
        }

        let cancelled = false
        setLoading(true)
            ; (async () => {
                const fromApi = await fetchCandidateFromApis(resolvedUserId, candidateId)
                if (cancelled) return
                if (fromApi) {
                    setCandidate((prev) => ({
                        ...fromApi,
                        cvUrl: fromApi.cvUrl || prev?.cvUrl || '',
                    }))
                    setNotFound(false)
                } else if (!cached) {
                    setCandidate(null)
                    setNotFound(true)
                }
                setLoading(false)
            })()

        return () => {
            cancelled = true
        }
    }, [candidateId, resolvedUserId])

    return (
        <div className="p-[0px_24px]">
            <div className="mb-[24px]">
                <div className="mb-[16px] flex flex-wrap items-center justify-between gap-[12px]">
                    <div>

                        <h1 className="text-[20px] font-[Inter-Medium] leading-tight text-[#141414]">Candidate detail</h1>
                        {!candidateId ? (
                            <p className="mt-[4px] text-[13px] font-[Inter-Regular] text-[#DC0000]">
                                No candidate selected. Open a profile from{' '}
                                <Link href="/jobdashboard/candidates" className="font-[Inter-SemiBold] text-[#0c4a9d] underline">
                                    candidate search
                                </Link>
                                .
                            </p>
                        ) : !resolvedUserId && !candidate ? (
                            <p className="mt-[4px] text-[13px] font-[Inter-Regular] text-[#666b72]">
                                Sign in to load this profile and CV from the server.
                            </p>
                        ) : null}
                    </div>
                </div>

                {candidateId && loading && !candidate ? <DetailSkeleton /> : null}

                {candidateId && candidate ? (
                    <>
                        <div className="[box-shadow:0px_3px_3px_-2px_rgba(0,0,0,0.1),0px_3px_4px_rgba(0,0,0,0.07),0px_1px_8px_rgba(0,0,0,0.06)] rounded-[6px] bg-white w-[600px] mx-auto">
                            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-[14px] border-b border-[rgba(143,143,143,0.16)] p-[20px] max-sm:flex-col max-sm:items-start">
                                <div className="flex min-w-0 items-center gap-[16px]">
                                    <div className="flex h-[120px] w-[120px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-[rgba(143,143,143,0.12)] bg-[#f5f6f8]">
                                        <Image
                                            src={candidate.profile || user}
                                            alt="Candidate"
                                            width={120}
                                            height={120}
                                            className="h-[120px] w-[120px] object-cover"
                                        />
                                    </div>

                                </div>
                            </div>

                            <div className="flex flex-col gap-[20px] p-[20px]">
                                <div className='mb-[20px]'>
                                    <h4 className="text-[18px] font-[Inter-SemiBold] text-[#23262A] mb-[20px]">Personal Details</h4>
                                    <div className="flex min-w-0 flex-1 flex-col gap-[12px] justify-center ">
                                        <div className="flex flex-wrap items-center gap-[8px]">
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A] w-[40%]">Name :</p>
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{candidate.name}</p>
                                        </div>
                                        <div className="flex items-center gap-[8px]">
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A] w-[40%]">Date of birth :</p>
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{candidate.dateOfBirth}</p>
                                        </div>
                                        <div className="flex items-center gap-[8px]">
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A] w-[40%]">Phone Number :</p>
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{candidate.phoneNumber}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-[8px]">
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A] w-[40%]">Nationality :</p>
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{candidate.nationality}</p>
                                        </div>
                                        <div className="flex items-center gap-[8px]">
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A] w-[40%]">Education :</p>
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{candidate.education}</p>
                                        </div>
                                        <div className="flex items-center gap-[8px]">
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A] w-[40%]">Languages :</p>
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{candidate.languages}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-[8px]">
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A] w-[40%]">Current Position :</p>
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{candidate.currentPosition}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-[8px]">
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A] w-[40%]">Desired Salary :</p>
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{candidate.desiredSalary}</p>
                                        </div>
                                        <div className="flex items-center gap-[8px]">
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A] w-[40%]">Location :</p>
                                            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{candidate.location}</p>
                                        </div>
                                       
                                       
                                    </div>
                                </div>
                                <CandidateResumeField serverCvUrl={candidate?.cvUrl} candidateId={candidateId} />
                            </div>
                        </div>


                    </>
                ) : null}

                {candidateId && notFound && !loading && !candidate ? (
                    <div className="rounded-[6px] border border-[rgba(220,0,0,0.25)] bg-[#fff5f5] p-[20px] text-[14px] font-[Inter-Regular] text-[#23262A]">
                        We could not load this profile. Try again from{' '}
                        <Link href="/jobdashboard/candidates" className="font-[Inter-SemiBold] text-[#0c4a9d] underline">
                            candidate search
                        </Link>{' '}
                        (it may be outside the first {FETCH_LIMIT} results), or confirm you are signed in with the correct account.
                    </div>
                ) : null}
            </div>
        </div>
    )
}

export default CandidateDetail
