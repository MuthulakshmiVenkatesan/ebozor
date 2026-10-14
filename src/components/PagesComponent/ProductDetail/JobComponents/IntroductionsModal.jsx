/* eslint-disable react/prop-types */
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CloseIcon } from '@/components/CustomFile/icons'

const AUDIO_INSTRUCTIONS = [
    'Please be in a noise free environment.',
    'Speak clearly and make sure you can be heard.',
]

const VIDEO_INSTRUCTIONS = [
    'Please be in a noise free environment.',
    'Appear presentable and professional.',
    'Look into the camera when talking.',
    'Speak clearly and make sure you can be heard.',
]
const STOP_ENABLE_AT_SEC = 6 // enable after 0:06 elapsed (timer shows 1:54 remaining)
const MAX_RECORDING_SEC = 120 // 2:00

/**
 * “Introductions” — instructions, record area, Cancel / Save (enabled after Record for UX stub).
 */
export default function IntroductionsModal({ open, onClose, variant = 'video', onSave }) {
    const [stage, setStage] = useState('idle') // idle | countdown | recording | recorded | uploading
    const [countdown, setCountdown] = useState(3)
    const [elapsedSec, setElapsedSec] = useState(0)
    const [permissionError, setPermissionError] = useState('')
    const [recordedUrl, setRecordedUrl] = useState('')
    const [recordedBlob, setRecordedBlob] = useState(null)
    const streamRef = useRef(null)
    const recorderRef = useRef(null)
    const chunksRef = useRef([])
    const countdownTimerRef = useRef(null)
    const elapsedTimerRef = useRef(null)

    const instructions = variant === 'audio' ? AUDIO_INSTRUCTIONS : VIDEO_INSTRUCTIONS

    const clearTimers = useCallback(() => {
        if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current)
            countdownTimerRef.current = null
        }
        if (elapsedTimerRef.current) {
            clearInterval(elapsedTimerRef.current)
            elapsedTimerRef.current = null
        }
    }, [])

    const stopMediaStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
        }
    }, [])

    const resetRecordingState = useCallback(() => {
        clearTimers()
        stopMediaStream()
        if (recordedUrl) {
            URL.revokeObjectURL(recordedUrl)
        }
        recorderRef.current = null
        chunksRef.current = []
        setRecordedBlob(null)
        setRecordedUrl('')
        setElapsedSec(0)
        setCountdown(3)
        setPermissionError('')
        setStage('idle')
    }, [clearTimers, stopMediaStream, recordedUrl])

    useEffect(() => {
        if (!open) return
        resetRecordingState()
    }, [open, variant, resetRecordingState])

    useEffect(() => {
        if (!open) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prev
        }
    }, [open])

    useEffect(() => {
        if (!open) return
        const onKey = (e) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    useEffect(() => {
        return () => {
            clearTimers()
            stopMediaStream()
            if (recordedUrl) URL.revokeObjectURL(recordedUrl)
        }
    }, [clearTimers, stopMediaStream, recordedUrl])

    const formatTime = useCallback((totalSec) => {
        const m = Math.floor(totalSec / 60)
        const s = totalSec % 60
        return `${m}:${String(s).padStart(2, '0')}`
    }, [])

    const startRecording = useCallback(async () => {
        try {
            setPermissionError('')
            if (!navigator?.mediaDevices?.getUserMedia) {
                setPermissionError('Microphone access is not supported in this browser.')
                return
            }

            const constraints = variant === 'video' ? { audio: true, video: false } : { audio: true }
            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            streamRef.current = stream

            const recorder = new MediaRecorder(stream)
            chunksRef.current = []

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunksRef.current.push(event.data)
                }
            }
            recorder.onstop = () => {
                clearTimers()
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                const url = URL.createObjectURL(blob)
                setRecordedBlob(blob)
                setRecordedUrl(url)
                setStage('recorded')
                stopMediaStream()
            }
            recorderRef.current = recorder

            setCountdown(3)
            setStage('countdown')
            countdownTimerRef.current = setInterval(() => {
                setCountdown((value) => {
                    if (value <= 1) {
                        clearTimers()
                        recorder.start()
                        setElapsedSec(0)
                        setStage('recording')
                        elapsedTimerRef.current = setInterval(() => {
                            setElapsedSec((s) => {
                                const next = s + 1
                                if (next >= MAX_RECORDING_SEC) {
                                    if (recorderRef.current?.state === 'recording') {
                                        recorderRef.current.stop()
                                    }
                                    return MAX_RECORDING_SEC
                                }
                                return next
                            })
                        }, 1000)
                        return 0
                    }
                    return value - 1
                })
            }, 1000)
        } catch {
            clearTimers()
            stopMediaStream()
            setStage('idle')
            setPermissionError('Please allow microphone access to start recording.')
        }
    }, [variant, clearTimers, stopMediaStream])

    const stopRecording = useCallback(() => {
        const recorder = recorderRef.current
        if (!recorder || recorder.state !== 'recording') return
        recorder.stop()
    }, [])

    const handleSave = useCallback(() => {
        if (!recordedBlob || stage === 'uploading') return
        setStage('uploading')
        setTimeout(() => {
            onSave?.({ variant, recorded: true, blob: recordedBlob })
            onClose()
        }, 700)
    }, [recordedBlob, stage, onSave, onClose, variant])

    if (!open) return null

    const canSave = !!recordedBlob && stage !== 'uploading'
    const isBusy = stage === 'uploading'
    const canStopRecording = elapsedSec >= STOP_ENABLE_AT_SEC
    const remainingSec = Math.max(MAX_RECORDING_SEC - elapsedSec, 0)
    const panelClass = variant === 'audio' ? 'rounded-[12px]' : 'rounded-[2px]'
    const showIdleControls = stage === 'idle'
    const showCountdown = stage === 'countdown'
    const showRecordingControls = stage === 'recording'
    const showRecordedPreview = stage === 'recorded' || stage === 'uploading'

    return (
        <div className="fixed inset-0 z-[260] flex items-center justify-center p-[16px]" role="dialog" aria-modal="true" aria-labelledby="introductions-title">
            <button
                type="button"
                className="absolute inset-0 z-0 bg-black/45"
                onClick={onClose}
                aria-label="Close dialog"
            />
            <div
                className="relative z-[1] flex max-h-[min(90vh,720px)] w-full max-w-[520px] flex-col overflow-hidden rounded-[12px] bg-white shadow-[0px_8px_24px_rgba(0,0,0,0.12)]"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex shrink-0 items-center justify-between border-b border-[rgba(143,143,143,0.25)] px-[20px] py-[18px]">
                    <h2 id="introductions-title" className="text-[18px] font-[Inter-SemiBold] text-[#23262A]">
                        Introductions
                    </h2>
                    <button type="button" onClick={onClose} className="flex cursor-pointer items-center justify-center p-[4px]" aria-label="Close">
                        <CloseIcon className="h-[10px] w-[10px]" fill="#23262A" />
                    </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[20px] py-[20px]">
                    <p className="mb-[20px] text-[14px] font-[Inter-Regular] text-[#3a3f47]">
                        Please keep in mind the following instructions:
                    </p>
                    <ol className="mb-[20px] list-decimal space-y-[8px] pl-[20px] text-[14px] font-[Inter-Regular] leading-snug text-[#3a3f47]">
                        {instructions.map((line) => (
                            <li key={line}>{line}</li>
                        ))}
                    </ol>

                    <div className={`relative min-h-[220px] overflow-hidden bg-black px-[16px] py-[20px] sm:min-h-[280px] ${panelClass}`}>
                        {showRecordedPreview ? (
                            <div className="h-full flex flex-col justify-between">
                                {isBusy ? (
                                    <>
                                        <p className="text-[14px] font-[Inter-Regular] text-white">Uploading: 100%</p>
                                        <div className="flex flex-col items-center justify-center gap-[10px]">
                                            <div className="flex h-[56px] w-[56px] items-center justify-center rounded-full border-4 border-[#9CA3AF] text-[28px] text-[#D1D5DB]">
                                                ▶
                                            </div>
                                            <button
                                                type="button"
                                                className="text-[28px] font-[Inter-Regular] text-white max-md:text-[20px]"
                                                onClick={resetRecordingState}
                                                disabled
                                            >
                                                Redo
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {variant === 'audio' ? (
                                            <div className="relative h-[240px] w-full bg-black">
                                                <audio src={recordedUrl} preload="metadata" />
                                                <p className="absolute left-[12px] top-[10px] text-[14px] font-[Inter-Regular] text-white">Muthulakshmi</p>
                                                <div className="absolute right-[10px] top-[10px] flex items-center gap-[8px]">
                                                    <span className="text-white">🔊</span>
                                                    <div className="h-[8px] w-[80px] rounded-full bg-white" />
                                                </div>

                                                <div className="absolute inset-x-[10px] bottom-[10px] flex items-center justify-between text-white">
                                                    <span className="text-[20px]">↻</span>
                                                    <span className="text-[20px]">▶</span>
                                                    <span className="text-[14px]">0:02</span>
                                                    <div className="h-[4px] w-[220px] rounded-full bg-[#9CA3AF] max-md:w-[120px]" />
                                                    <span className="text-[14px]">0:13</span>
                                                    <span className="text-[16px]">⤢</span>
                                                    <span className="text-[16px]">⚙</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center gap-[10px]">
                                                <div className="flex h-[56px] w-[56px] items-center justify-center rounded-full border-4 border-[#9CA3AF] text-[28px] text-[#D1D5DB]">
                                                    ▶
                                                </div>
                                                <button
                                                    type="button"
                                                    className="text-[28px] font-[Inter-Regular] text-white max-md:text-[20px]"
                                                    onClick={resetRecordingState}
                                                >
                                                    Redo
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ) : null}

                        {showCountdown ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full border-4 border-[#111827] bg-black text-[60px] font-[Inter-Regular] text-white max-md:text-[40px]">
                                    {countdown}
                                </div>
                            </div>
                        ) : null}

                        {showIdleControls ? (
                            <div className="absolute inset-x-0 bottom-[14px] flex items-center justify-center gap-[16px]">
                                <button type="button" className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#6B7280] text-white" aria-label="Settings">
                                    ⚙
                                </button>
                                <button type="button" className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#6B7280] text-white" aria-label="Microphone">
                                    🎙
                                </button>
                                <button
                                    type="button"
                                    onClick={startRecording}
                                    className="rounded-[6px] bg-[#D00000] p-[8px_22px] text-[26px] font-[Inter-SemiBold] text-white max-md:text-[18px]"
                                >
                                    Record
                                </button>
                            </div>
                        ) : null}

                        {showRecordingControls ? (
                            <>
                                <div className="absolute bottom-[14px] left-[18px] h-[14px] w-[14px] rounded-full bg-[#FF0000]" />
                                <div className="absolute inset-x-0 bottom-[14px] flex items-center justify-center gap-[10px]">
                                    <div className="rounded-[6px] bg-[#FF0000] p-[8px_18px] text-[26px] font-[Inter-SemiBold] text-white max-md:text-[18px]">
                                        {formatTime(remainingSec)}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={stopRecording}
                                        disabled={!canStopRecording}
                                        className={`rounded-[6px] p-[8px_22px] text-[26px] font-[Inter-SemiBold] text-white max-md:text-[18px] ${
                                            canStopRecording ? 'bg-[#9f0404]' : 'cursor-not-allowed bg-[#7f8084]'
                                        }`}
                                    >
                                        Stop
                                    </button>
                                </div>
                                <div className="absolute bottom-[14px] right-[18px] h-[40px] w-[40px] rounded-full bg-[#6B7280]" />
                            </>
                        ) : null}
                    </div>
                    {permissionError ? <p className="mt-[10px] text-[12px] font-[Inter-Regular] text-[#D32F2F]">{permissionError}</p> : null}
                </div>

                <footer className="shrink-0 border-t border-[rgba(143,143,143,0.25)] px-[20px] py-[16px]">
                    <div className="flex items-center justify-end gap-[12px]">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isBusy}
                            className={`rounded-[6px] border p-[8px_20px] text-[14px] font-[Inter-SemiBold] ${
                                isBusy ? 'cursor-not-allowed border-[#D1D5DB] bg-[#F3F4F6] text-[#A0A4AB]' : 'cursor-pointer border-[#8F8F8F] bg-white text-[#23262A]'
                            }`}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={!canSave}
                            onClick={handleSave}
                            className={`rounded-[6px] p-[8px_20px] text-[14px] font-[Inter-SemiBold] text-white ${
                                canSave ? 'cursor-pointer bg-[#23262A] hover:bg-[#23262A]' : 'cursor-not-allowed bg-[#8F8F8F]'
                            }`}
                        >
                            Save
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    )
}
