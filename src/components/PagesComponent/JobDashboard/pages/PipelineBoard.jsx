'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { hiringPipelinesApi } from '@/utils/api'
import { rootSignupData } from '@/redux/reuducer/authSlice'
import { PaginationPrevIcon } from '@/components/CustomFile/icons'
import { placeholderImage } from '@/utils'

const DEFAULT_PIPELINE = {
    id: 'default',
    name: 'Default',
    stages: [
        'Applied / Recommended',
        'Screening',
        '1st Interview',
        '2nd Interview',
        '3rd Interview',
        'Interview Not Attended',
        'Interview Rescheduled',
        'Awaiting Approval',
        'On Hold',
        'Shortlisted',
        'Offered',
        'Did Not Join',
        'Hired',
    ],
}

const INITIAL_STATUS_ALIASES = ['under review', 'applied', 'applied / recommended']

function getPipelineStages(pipeline) {
    if (Array.isArray(pipeline?.stage_config) && pipeline.stage_config.length > 0) {
        return pipeline.stage_config
            .filter((stage) => stage?.locked || stage?.enabled)
            .map((stage) => stage.label)
            .filter(Boolean)
    }
    return (pipeline?.stages || [])
        .map((stage) => (typeof stage === 'string' ? stage : stage?.label || stage?.name))
        .filter(Boolean)
}

function isRejectedCandidate(candidate) {
    if (candidate?.rejected) return true
    if (Number(candidate?.status) === 0) return true
    return String(candidate?.application_status || '').trim().toLowerCase() === 'rejected'
}

function mapStatusToStage(status, stages) {
    const firstStage = stages[0] || DEFAULT_PIPELINE.stages[0]
    const raw = String(status || '').trim()
    if (!raw) return firstStage
    const lower = raw.toLowerCase()
    if (lower === 'rejected') return null
    if (INITIAL_STATUS_ALIASES.includes(lower)) return firstStage
    const exact = stages.find((stage) => String(stage).toLowerCase() === lower)
    if (exact) return exact
    return firstStage
}

export default function PipelineBoard({ jobId }) {
    const authRoot = useSelector(rootSignupData)
    const token = authRoot?.data?.token
    const [pipelines, setPipelines] = useState([DEFAULT_PIPELINE])
    const [candidates, setCandidates] = useState([])
    const [loading, setLoading] = useState(true)
    const [pipelineId, setPipelineId] = useState(DEFAULT_PIPELINE.id)
    const [jobName, setJobName] = useState('')
    const [draggingId, setDraggingId] = useState(null)
    const boardScrollRef = useRef(null)

    const activePipeline = useMemo(
        () => pipelines.find((pipeline) => String(pipeline.id) === String(pipelineId)) || pipelines[0] || DEFAULT_PIPELINE,
        [pipelines, pipelineId]
    )
    const activeStages = useMemo(() => getPipelineStages(activePipeline), [activePipeline])

    useEffect(() => {
        if (!token || !jobId) {
            setLoading(false)
            return undefined
        }

        let cancelled = false
        setLoading(true)

        Promise.all([
            hiringPipelinesApi.getHiringPipelines(),
            hiringPipelinesApi.getJobPipelineCandidates({ item_id: jobId }),
        ])
            .then(([pipelinesRes, candidatesRes]) => {
                if (cancelled) return
                const custom = Array.isArray(pipelinesRes?.data?.data) ? pipelinesRes.data.data : []
                const nextPipelines = [DEFAULT_PIPELINE, ...custom]
                setPipelines(nextPipelines)
                setPipelineId(custom[0]?.id || DEFAULT_PIPELINE.id)
                const list = candidatesRes?.data?.data
                setCandidates(Array.isArray(list) ? list : [])
                setJobName(candidatesRes?.data?.job?.name || '')
            })
            .catch(() => {
                if (!cancelled) {
                    toast.error('Failed to load pipeline data')
                    setCandidates([])
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [jobId, token])

    useEffect(() => {
        const scroller = boardScrollRef.current
        if (!scroller) return undefined
        scroller.scrollLeft = 0
        const frame = window.requestAnimationFrame(() => {
            if (boardScrollRef.current) boardScrollRef.current.scrollLeft = 0
        })
        return () => window.cancelAnimationFrame(frame)
    }, [jobId, pipelineId, activeStages.length, loading])

    const visibleCandidates = useMemo(
        () => candidates.filter((candidate) => !isRejectedCandidate(candidate)),
        [candidates]
    )

    const handleStageChange = async (candidateId, newStage) => {
        if (!newStage || !activeStages.includes(newStage)) return
        const current = candidates.find((candidate) => candidate.id === candidateId)
        if (!current || isRejectedCandidate(current)) return
        const previousStatus = current.application_status
        if (mapStatusToStage(previousStatus, activeStages) === newStage) return

        setCandidates((prev) =>
            prev.map((candidate) =>
                candidate.id === candidateId ? { ...candidate, application_status: newStage } : candidate
            )
        )

        try {
            const res = await hiringPipelinesApi.updateApplicationStatus({
                application_id: candidateId,
                application_status: newStage,
                item_id: jobId,
            })
            if (res?.data?.error) {
                throw new Error(res?.data?.message || 'Failed to update candidate stage')
            }
            const savedStatus = res?.data?.data?.application_status || newStage
            setCandidates((prev) =>
                prev.map((candidate) =>
                    candidate.id === candidateId ? { ...candidate, application_status: savedStatus } : candidate
                )
            )
        } catch (error) {
            setCandidates((prev) =>
                prev.map((candidate) =>
                    candidate.id === candidateId ? { ...candidate, application_status: previousStatus } : candidate
                )
            )
            toast.error(error?.message || 'Failed to update candidate stage')
        }
    }

    if (loading) {
        return <div className="p-[24px] text-[14px] font-[Inter-Regular] text-[#424242]">Loading pipeline...</div>
    }

    return (
        <div className="min-w-0 max-w-full overflow-x-hidden p-[0_24px_24px_24px]">
            <div className="mb-[24px] flex min-w-0 items-start justify-between gap-[16px] max-sm:flex-col">
                <div>
                    <Link href="/jobdashboard" className="mb-[12px] inline-flex items-center gap-[8px] text-[14px] font-[Inter-SemiBold] text-[#3a88ef]">
                        <PaginationPrevIcon className="h-[14px] w-[14px]" stroke="#3a88ef" /> Back to Jobs Dashboard
                    </Link>
                    <h1 className="text-[20px] font-[Inter-SemiBold] leading-[1.25] text-[#23262A] mb-[8px]">
                        Hiring Pipeline{jobName ? ` · ${jobName}` : ` for Job #${jobId}`}
                    </h1>
                    <p className="text-[14px] font-[Inter-Regular] leading-[1.5] text-[#424242]">
                        Move existing applicants between the stages configured in your hiring pipeline.
                    </p>
                </div>
                {pipelines.length > 1 ? (
                    <select
                        value={pipelineId}
                        onChange={(e) => setPipelineId(e.target.value)}
                        className="shrink-0 rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white p-[8px_12px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none"
                    >
                        {pipelines.map((pipeline) => (
                            <option key={pipeline.id || pipeline.name} value={pipeline.id}>
                                {pipeline.name || 'Pipeline'}
                            </option>
                        ))}
                    </select>
                ) : null}
            </div>

            <div
                ref={boardScrollRef}
                dir="ltr"
                className="flex min-w-0 w-full max-w-full flex-nowrap gap-[12px] overflow-x-auto overflow-y-hidden overscroll-x-contain pb-[12px]"
                style={{ minHeight: '560px' }}
            >
                {activeStages.map((stage) => {
                    const stageCandidates = visibleCandidates.filter(
                        (candidate) => mapStatusToStage(candidate.application_status, activeStages) === stage
                    )

                    return (
                        <div
                            key={stage}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                                if (draggingId) handleStageChange(draggingId, stage)
                                setDraggingId(null)
                            }}
                            className="flex w-[280px] min-w-[280px] max-w-[280px] shrink-0 flex-col rounded-[6px] bg-white p-[12px] [box-shadow:0px_1px_3px_rgba(15,23,42,0.08)]"
                        >
                            <div className="mb-[12px] flex items-center justify-between gap-[8px]">
                                <h3 className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">{stage}</h3>
                                <span className="rounded-full bg-[#f4f4f5] px-[8px] py-[2px] text-[12px] font-[Inter-SemiBold] text-[#616161]">
                                    {stageCandidates.length}
                                </span>
                            </div>

                            <div className="flex flex-col gap-[10px]">
                                {stageCandidates.map((candidate) => (
                                    <div
                                        key={candidate.id}
                                        draggable
                                        onDragStart={() => setDraggingId(candidate.id)}
                                        onDragEnd={() => setDraggingId(null)}
                                        className={`cursor-grab rounded-[6px] border border-[rgba(143,143,143,0.18)] bg-white p-[12px] active:cursor-grabbing ${draggingId === candidate.id ? 'opacity-70' : ''}`}
                                    >
                                        <div className="mb-[10px] flex items-center gap-[10px]">
                                            <div className="relative h-[40px] w-[40px] shrink-0 overflow-hidden rounded-full bg-[#dbeafe]">
                                                {candidate.profile ? (
                                                    <Image
                                                        src={candidate.profile}
                                                        alt={candidate.name}
                                                        fill
                                                        className="object-cover"
                                                        onErrorCapture={placeholderImage}
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-[14px] font-[Inter-Bold] text-[#3A88EF]">
                                                        {String(candidate.name || 'C').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="truncate text-[14px] font-[Inter-SemiBold] text-[#23262A]">{candidate.name}</h4>
                                                <p className="truncate text-[12px] font-[Inter-Regular] text-[#616161]">{candidate.currentPosition}</p>
                                            </div>
                                        </div>

                                        <div className="mb-[10px] space-y-[2px] text-[12px] font-[Inter-Regular] text-[#616161]">
                                            <p>{candidate.location}</p>
                                            <p>{candidate.experience}</p>
                                        </div>

                                        <select
                                            value={stage}
                                            onChange={(e) => handleStageChange(candidate.id, e.target.value)}
                                            className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white p-[6px_8px] text-[12px] font-[Inter-Regular] text-[#23262A]"
                                        >
                                            {activeStages.map((optionStage) => (
                                                <option key={optionStage} value={optionStage}>
                                                    {optionStage}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
