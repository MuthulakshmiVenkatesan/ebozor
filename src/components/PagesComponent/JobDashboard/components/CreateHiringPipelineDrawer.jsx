'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { InfoIcon, ModalCloseIcon, DoubleDotsIcon } from '@/components/CustomFile/icons'

const DEFAULT_STAGES = [
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
]

const getInitialStages = () =>
    DEFAULT_STAGES.map((stage, index) => ({
        id: stage,
        label: stage,
        enabled: index !== 0 && index !== DEFAULT_STAGES.length - 1,
        locked: index === 0 || index === DEFAULT_STAGES.length - 1,
    }))


function StageToggle({ enabled, onChange, disabled }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(!enabled)}
            className={`relative h-[14px] w-[40px] flex-none cursor-pointer rounded-full p-0 transition-colors ${enabled ? 'bg-[#13a811]' : 'bg-[#ff5540]'
                }`}
            aria-pressed={enabled}
        >
            <span
                className={`pointer-events-none absolute left-[2px] top-[-2px] h-[18px] w-[18px] rounded-full bg-[#fafafa] shadow-[0_1px_4px_rgba(0,0,0,0.16)] transition-transform ${enabled ? 'translate-x-[20px]' : 'translate-x-[-2px]'
                    }`}
            />

        </button>
    )
}

export default function CreateHiringPipelineDrawer({ isOpen, onClose, onSubmit, initialData = null }) {
    const [name, setName] = useState('')
    const [stages, setStages] = useState(getInitialStages)
    const [draggingId, setDraggingId] = useState(null)

    useEffect(() => {
        if (!isOpen) return undefined
        const onEsc = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        document.addEventListener('keydown', onEsc)
        return () => document.removeEventListener('keydown', onEsc)
    }, [isOpen, onClose])

    useEffect(() => {
        if (!isOpen) return
        if (!initialData) {
            setName('')
            setStages(getInitialStages())
            return
        }
        setName(initialData.name || '')
        if (Array.isArray(initialData.stage_config) && initialData.stage_config.length > 0) {
            setStages(
                initialData.stage_config.map((stage) => ({
                    id: stage.id || stage.label,
                    label: stage.label,
                    enabled: Boolean(stage.locked || stage.enabled),
                    locked: Boolean(stage.locked),
                }))
            )
            return
        }
        const selectedStages = (initialData.stages || []).map((stage) => (
            typeof stage === 'string' ? stage : stage?.label || stage?.name
        ))
        setStages((prev) =>
            prev.map((stage) => ({
                ...stage,
                enabled: stage.locked ? true : selectedStages.includes(stage.label),
            }))
        )
    }, [initialData, isOpen])

    const canSubmit = useMemo(
        () => name.trim().length > 0 && stages.some((stage) => stage.enabled),
        [name, stages]
    )

    const onDropAt = (dropId) => {
        if (!draggingId || draggingId === dropId) return
        const fromIndex = stages.findIndex((stage) => stage.id === draggingId)
        const toIndex = stages.findIndex((stage) => stage.id === dropId)
        if (fromIndex < 0 || toIndex < 0) return
        const dragged = stages[fromIndex]
        if (dragged.locked) return
        const next = [...stages]
        next.splice(fromIndex, 1)
        next.splice(toIndex, 0, dragged)
        setStages(next)
        setDraggingId(null)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[1300] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="rejection-rules-title">
            <button
                type="button"
                className="absolute inset-0 cursor-default bg-[rgba(0,0,0,0.45)]"
                aria-label="Close drawer"
                onClick={() => onClose?.()}
            />
            <div
                className="relative z-[1] flex h-full w-full max-w-[500px] flex-col bg-[#fff]"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <header className="shrink-0 [box-shadow:0px_3px_3px_-2px_rgba(0,0,0,0.1),0px_3px_4px_rgba(0,0,0,0.07),0px_1px_8px_rgba(0,0,0,0.06)] bg-[#fff] p-[30px_24px]">
                    <div className="flex flex-col items-start justify-between gap-[14px]">
                        <div className="min-w-0 flex items-center justify-between gap-[12px] w-full">
                            <h2 className="text-[20px] font-[Inter-Medium] leading-tight text-[#23262a] ">
                                Create Hiring Pipeline
                            </h2>
                            <button
                                type="button"
                                onClick={() => onClose?.()}
                                className="flex shrink-0 cursor-pointer items-center justify-center "
                                aria-label="Close"
                            >
                                <ModalCloseIcon className="h-[24px] w-[24px]" fill="#8f8f8f" />
                            </button>
                        </div>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Name*"
                            className=" w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white p-[12px_16px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#8f8f8f] focus:border-[#1270ec]"
                        />
                    </div>
                </header>

                <div className="flex-1 bg-[#f5f5f5] p-[24px] mt-[5px] overflow-y-auto overflow-x-hidden">
                    <div className="mb-[14px] flex items-center justify-between gap-[12px]">
                        <h3 className="text-[14px] font-[Inter-SemiBold] text-[#666b72]">Hiring Stages</h3>
                        <p className="text-[14px] font-[Inter-SemiBold] text-[#666b72]">Include Stage</p>
                    </div>

                    <div className="flex flex-col gap-[8px]">
                        {stages.map((stage) => (
                            <div
                                key={stage.id}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => onDropAt(stage.id)}
                                className={`flex items-center justify-between rounded-[6px] bg-white p-[14px_16px] [box-shadow:0px_4px_8px_-2px_rgba(0,0,0,0.02),0px_3px_8px_rgba(0,0,0,0.02),0px_1px_10px_rgba(0,0,0,0.04)] ${draggingId === stage.id ? 'opacity-70' : ''}`}
                            >
                                <div className="flex items-center gap-[14px]">
                                    <button
                                        type="button"
                                        draggable={!stage.locked}
                                        onDragStart={() => !stage.locked && setDraggingId(stage.id)}
                                        onDragEnd={() => setDraggingId(null)}
                                        className={`${stage.locked ? 'cursor-default opacity-70' : 'cursor-grab active:cursor-grabbing'}`}
                                        aria-label={`Drag ${stage.label}`}
                                    >
                                        <DoubleDotsIcon className="h-[20px] w-[20px]" fill="#c2c4c7" />
                                    </button>
                                    <p className="text-[14px] font-[Inter-SemiBold] leading-[1.25] text-[#162033]">
                                        {stage.label}
                                    </p>
                                </div>

                                {stage.locked ? (
                                    <div className="group relative">
                                        <InfoIcon className="h-[22px] w-[22px] cursor-pointer" fill="#c2c4c7" />
                                        <div className="pointer-events-none absolute right-[28px] top-1/2 z-[10] -translate-y-1/2 whitespace-nowrap rounded-[6px] bg-[#23262A] p-[6px_10px] text-[10px] font-[Inter-SemiBold] text-white opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-opacity group-hover:opacity-100">
                                           This stage cannot be edited or moved.
                                        </div>
                                    </div>
                                ) : (
                                    <StageToggle
                                        enabled={stage.enabled}
                                        disabled={false}
                                        onChange={(enabled) =>
                                            setStages((prev) =>
                                                prev.map((item) => (item.id === stage.id ? { ...item, enabled } : item))
                                            )
                                        }
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>


                <footer className="shrink-0 bg-white p-[16px_24px]">
                    <div className="flex gap-[12px]">
                        <button
                            type="button"
                            onClick={() => {
                                setName('')
                                setStages(getInitialStages())
                            }}
                            className="cursor-pointer rounded-[6px] border border-[#23262A] bg-white p-[8px_16px] text-[14px] font-[Inter-SemiBold] text-[#23262A] transition"
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            disabled={!canSubmit}
                            onClick={() => {
                                if (!canSubmit) return
                                const includedStages = stages
                                    .filter((stage) => stage.locked || stage.enabled)
                                    .map((stage) => stage.label)
                                onSubmit?.({
                                    id: initialData?.id,
                                    name: name.trim(),
                                    stages: includedStages,
                                    stage_config: stages.map((stage, index) => ({
                                        id: stage.id,
                                        label: stage.label,
                                        enabled: Boolean(stage.locked || stage.enabled),
                                        locked: Boolean(stage.locked),
                                        order: index,
                                    })),
                                })
                                onClose?.()
                            }}
                            className={`flex-1 cursor-pointer rounded-[6px] bg-[#23262A] py-[8px] text-[14px] font-[Inter-SemiBold] text-white transition ${canSubmit ? 'cursor-pointer bg-[#DC0000] text-white' : 'cursor-not-allowed bg-[#d9d9dc] text-[#9fa3ab]'}`}
                        >
                            Submit
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    )
}
