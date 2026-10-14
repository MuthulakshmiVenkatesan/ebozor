'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FaCheck } from 'react-icons/fa6'
import { CloseIcon, RightArrowIcon, DownArrowIcon, CaptureTickIcon } from '@/components/CustomFile/icons'
import idfront from '../../../../public/assets/img/idfront.svg'
import updates from '../../../../public/assets/img/icons/updates.svg'
import googleplay from '../../../../public/assets/img/googleplay.png'
import appstore from '../../../../public/assets/img/appstore.png'
import selfieexample from '../../../../public/assets/img/selfieexample.png'
import verificationreview from '../../../../public/assets/img/verificationreview.svg'

const stopMediaStream = (stream) => {
    stream?.getTracks?.().forEach((t) => t.stop())
}

const getMediaPermissionErrorMessage = (error, { needAudio = false } = {}) => {
    const name = error?.name || ''
    if (typeof window !== 'undefined' && !window.isSecureContext) {
        return 'Camera access requires a secure (HTTPS) connection. Please open this site over HTTPS and try again.'
    }
    if (!navigator?.mediaDevices?.getUserMedia) {
        return 'Camera access is not supported in this browser. Please try Chrome, Safari, or Edge.'
    }
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        return needAudio
            ? 'Camera and microphone permission was denied. Allow access in your browser settings, then tap Allow again.'
            : 'Camera permission was denied. Allow camera access in your browser settings, then tap Allow again.'
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        return needAudio
            ? 'No camera or microphone was found on this device.'
            : 'No camera was found on this device.'
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
        return 'Camera is already in use by another app. Close it and try again.'
    }
    return needAudio
        ? 'Unable to access camera and microphone. Please allow permissions and try again.'
        : 'Unable to access the camera. Please allow camera permission and try again.'
}

const EmiratesIdModal = ({
    isOpen,
    onClose,
    onTakePhoto,
    onConfirmPhoto,
    onConfirmPhotoFile,
    onFaceClipRecorded,
    onVerificationSubmitted,
}) => {
    const [idSide, setIdSide] = useState('front')
    const [phase, setPhase] = useState('id_intro')
    const [capturedUrl, setCapturedUrl] = useState('')
    const [selfiePreviewUrl, setSelfiePreviewUrl] = useState('')
    const [cameraError, setCameraError] = useState('')
    const [isRequestingMedia, setIsRequestingMedia] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [recordingProgress, setRecordingProgress] = useState(0)
    const [uploadPercent, setUploadPercent] = useState(0)
    const [isSubmittingVideo, setIsSubmittingVideo] = useState(false)
    const [isTryAppOpen, setIsTryAppOpen] = useState(false)
    const [faceClipFile, setFaceClipFile] = useState(null)
    const videoRef = useRef(null)
    const streamRef = useRef(null)
    const recordingIntervalRef = useRef(null)
    const uploadIntervalRef = useRef(null)
    const mediaRecorderRef = useRef(null)
    const recordedChunksRef = useRef([])

    const stopActiveStream = useCallback(() => {
        stopMediaStream(streamRef.current)
        streamRef.current = null
        if (videoRef.current) videoRef.current.srcObject = null
    }, [])

    const attachStreamToVideo = useCallback(async (stream) => {
        streamRef.current = stream
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        video.muted = true
        video.setAttribute('playsinline', 'true')
        await video.play().catch(() => {})
    }, [])

    /**
     * Must be called from a user gesture (button click) so the browser shows the permission prompt.
     * Photo: camera only. Selfie video: camera + microphone.
     */
    const requestMediaAccess = useCallback(
        async ({ withAudio = false, facingMode = 'user' } = {}) => {
            setCameraError('')
            setIsRequestingMedia(true)
            stopActiveStream()

            try {
                if (typeof window !== 'undefined' && !window.isSecureContext) {
                    throw Object.assign(new Error('Insecure context'), { name: 'SecurityError' })
                }
                if (!navigator?.mediaDevices?.getUserMedia) {
                    throw Object.assign(new Error('getUserMedia unsupported'), { name: 'NotSupportedError' })
                }

                const constraints = {
                    audio: withAudio,
                    video: {
                        facingMode: { ideal: facingMode },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                }

                let stream
                try {
                    stream = await navigator.mediaDevices.getUserMedia(constraints)
                } catch (primaryError) {
                    // Fallback without facingMode / ideal size if the first request fails.
                    if (withAudio) {
                        try {
                            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
                        } catch {
                            throw primaryError
                        }
                    } else {
                        try {
                            stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true })
                        } catch {
                            throw primaryError
                        }
                    }
                }

                await attachStreamToVideo(stream)
                return true
            } catch (error) {
                stopActiveStream()
                setCameraError(getMediaPermissionErrorMessage(error, { needAudio: withAudio }))
                return false
            } finally {
                setIsRequestingMedia(false)
            }
        },
        [attachStreamToVideo, stopActiveStream]
    )

    const resetFlow = useCallback(() => {
        stopActiveStream()
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
        if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current)
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        }
        recordingIntervalRef.current = null
        uploadIntervalRef.current = null
        setIdSide('front')
        setPhase('id_intro')
        setCapturedUrl('')
        setSelfiePreviewUrl('')
        setCameraError('')
        setIsRequestingMedia(false)
        setIsRecording(false)
        setRecordingProgress(0)
        setUploadPercent(0)
        setIsSubmittingVideo(false)
        setFaceClipFile(null)
        setIsTryAppOpen(false)
    }, [stopActiveStream])

    useEffect(() => {
        if (!isOpen) {
            resetFlow()
        }
    }, [isOpen, resetFlow])

    // Re-attach stream after React mounts the <video> for the camera phase.
    useEffect(() => {
        const isCameraPhase = phase === 'id_camera' || phase === 'selfie_camera'
        if (!isOpen || !isCameraPhase) return
        const stream = streamRef.current
        if (!stream || !videoRef.current) return
        if (videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(() => {})
        }
    }, [isOpen, phase])

    const handleTakePhotoClick = async () => {
        onTakePhoto?.(idSide)
        // Request camera from the click so the browser permission prompt appears.
        await requestMediaAccess({ withAudio: false, facingMode: 'environment' })
        setPhase('id_camera')
    }

    const handleOpenSelfieCamera = async () => {
        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current)
            recordingIntervalRef.current = null
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        }
        recordedChunksRef.current = []
        setIsRecording(false)
        setRecordingProgress(0)
        setFaceClipFile(null)
        setSelfiePreviewUrl('')
        // Camera + microphone from the click so both permission prompts appear.
        await requestMediaAccess({ withAudio: true, facingMode: 'user' })
        setPhase('selfie_camera')
    }

    const handleRetryCameraAccess = async () => {
        const withAudio = phase === 'selfie_camera'
        const facingMode = withAudio ? 'user' : 'environment'
        await requestMediaAccess({ withAudio, facingMode })
    }

    const handleCapture = () => {
        const video = videoRef.current
        if (video && video.videoWidth > 0) {
            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.drawImage(video, 0, 0)
                setCapturedUrl(canvas.toDataURL('image/jpeg', 0.85))
            }
        } else if (!capturedUrl) {
            setCapturedUrl('')
        }
        stopActiveStream()
        setPhase('id_captured')
    }

    const handleTryAgain = async () => {
        setCapturedUrl('')
        await requestMediaAccess({ withAudio: false, facingMode: 'environment' })
        setPhase('id_camera')
    }

    const handleConfirmId = () => {
        const toFile = (dataUrl, name) => {
            if (!dataUrl) return null
            const arr = dataUrl.split(',')
            if (arr.length < 2) return null
            const mimeMatch = arr[0].match(/:(.*?);/)
            const mime = mimeMatch?.[1] || 'image/jpeg'
            const bstr = atob(arr[1])
            let n = bstr.length
            const u8arr = new Uint8Array(n)
            while (n--) u8arr[n] = bstr.charCodeAt(n)
            return new File([u8arr], name, { type: mime })
        }
        if (idSide === 'front') {
            onConfirmPhoto?.(capturedUrl, 'front')
            onConfirmPhotoFile?.(toFile(capturedUrl, 'id-front.jpg'), 'front')
            setIdSide('back')
            setCapturedUrl('')
            setPhase('id_intro')
            return
        }
        onConfirmPhoto?.(capturedUrl, 'back')
        onConfirmPhotoFile?.(toFile(capturedUrl, 'id-back.jpg'), 'back')
        setCapturedUrl('')
        setPhase('selfie_intro')
    }

    const handleBackToIntro = () => {
        stopActiveStream()
        setCameraError('')
        setPhase('id_intro')
    }

    if (!isOpen) return null

    const showIntro = phase === 'id_intro'
    const showCamera = phase === 'id_camera'
    const showCaptured = phase === 'id_captured'
    const showSelfieIntro = phase === 'selfie_intro'
    const showSelfieCamera = phase === 'selfie_camera'
    const showSelfiePreview = phase === 'selfie_preview'
    const showUploading = phase === 'selfie_uploading'
    const showSubmitted = phase === 'submitted'
    const isFront = idSide === 'front'
    const isBack = idSide === 'back'

    const modalTitle = showSelfieIntro
        ? "You're almost there!"
        : showSelfieCamera || showSelfiePreview
            ? 'Selfie Video'
            : isFront
                ? 'Take the first photo - front of the Emirates ID'
                : showIntro
                    ? 'Second photo - flip the Emirates ID'
                    : 'Second photo - back of Emirates ID'

    const firstProgressClass = isFront ? (showCaptured ? 'w-full' : 'w-[50%]') : 'w-full'
    const secondProgressClass =
        showSelfieIntro ? 'w-[50%]' : showSelfieCamera || showSelfiePreview ? 'w-[50%]' : isFront ? 'w-0' : showCaptured ? 'w-[75%]' : 'w-[50%]'

    const step1Done = isBack || (isFront && showCaptured)
    const step2Active = isBack && (showIntro || showCamera)
    const step2Done = isBack && showCaptured

    const capturedQuestion1 = isFront
        ? 'Is the front of the ID clear with details visible?'
        : 'Is the back of the ID clear with details visible?'

    const startSelfieRecording = () => {
        recordedChunksRef.current = []
        const stream = streamRef.current
        if (stream && typeof MediaRecorder !== 'undefined') {
            try {
                const recorder = new MediaRecorder(stream)
                recorder.ondataavailable = (evt) => {
                    if (evt.data?.size > 0) recordedChunksRef.current.push(evt.data)
                }
                recorder.onstop = () => {
                    if (recordedChunksRef.current.length === 0) return
                    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
                    if (!blob || blob.size === 0) return
                    const file = new File([blob], `face-clip-${Date.now()}.webm`, { type: 'video/webm' })
                    setFaceClipFile(file)
                    onFaceClipRecorded?.(file)
                }
                recorder.start()
                mediaRecorderRef.current = recorder
            } catch {
                mediaRecorderRef.current = null
            }
        }
        setIsRecording(true)
        setRecordingProgress(0)
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = setInterval(() => {
            setRecordingProgress((prev) => {
                const next = prev + 20
                if (next >= 100) {
                    clearInterval(recordingIntervalRef.current)
                    recordingIntervalRef.current = null
                    setIsRecording(false)
                    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                        mediaRecorderRef.current.stop()
                    }

                    const video = videoRef.current
                    if (video && video.videoWidth > 0) {
                        const canvas = document.createElement('canvas')
                        canvas.width = video.videoWidth
                        canvas.height = video.videoHeight
                        const ctx = canvas.getContext('2d')
                        if (ctx) {
                            ctx.drawImage(video, 0, 0)
                            setSelfiePreviewUrl(canvas.toDataURL('image/jpeg', 0.85))
                        }
                    }
                    setPhase('selfie_preview')
                    stopActiveStream()
                    return 100
                }
                return next
            })
        }, 1000)
    }

    const cancelSelfieRecording = () => {
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        }
        recordedChunksRef.current = []
        setIsRecording(false)
        setRecordingProgress(0)
    }

    const submitSelfieVideo = async () => {
        if (!faceClipFile) {
            return
        }
        setUploadPercent(0)
        setIsSubmittingVideo(true)
        setPhase('selfie_uploading')
        if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current)
        uploadIntervalRef.current = setInterval(() => {
            setUploadPercent((prev) => {
                const next = prev + 12
                return next >= 90 ? 90 : next
            })
        }, 250)
        try {
            const ok = await onVerificationSubmitted?.({ face: faceClipFile })
            if (uploadIntervalRef.current) {
                clearInterval(uploadIntervalRef.current)
                uploadIntervalRef.current = null
            }
            if (!ok) {
                setUploadPercent(0)
                setPhase('selfie_preview')
                return
            }
            setUploadPercent(100)
            setPhase('submitted')
        } finally {
            setIsSubmittingVideo(false)
        }
    }

    const renderTryAppPanel = () => (
        <>
            <button
                type="button"
                onClick={() => setIsTryAppOpen((prev) => !prev)}
                className="cursor-pointer flex items-center gap-[4px]"
            >
                <p className="text-[14px] font-[Inter-SemiBold] text-[#464c55]">Try the app</p>
                <DownArrowIcon className={`w-[18px] h-[18px] transition-transform ${isTryAppOpen ? 'rotate-180' : ''}`} stroke="#000" />
            </button>
            {isTryAppOpen && (
                <div className="mt-[6px] mb-[14px] rounded-[6px] bg-[#f7f7f8] p-[16px]">
                    <div className="flex items-start justify-between gap-[14px]">
                        <p className="max-w-[140px] text-[14px] leading-[1.6] text-[#23262a] font-[Inter-Regular]">
                            Scan the QR code to find the app on your device
                        </p>
                        <div className="flex gap-[40px]">
                            <div className="flex flex-col items-center gap-[10px]">
                                <Image src={googleplay} alt="Google Play" className="w-[100px] h-[30px]" />
                            </div>
                            <div className="flex flex-col items-center gap-[10px]">
                                <Image src={appstore} alt="App Store" className="w-[100px] h-[30px]" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )

    const TipsPanel = () => (
        <div className="mb-[10px] flex items-start gap-[8px]">
            <Image src={updates} alt="Updates" className="w-[18px] h-[18px]" />
            <p className="text-[14px] font-[Inter-Regular] text-[#464c55]">
                Ensure the details are clear, and ID is not expired
            </p>
        </div>
    )

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/45 p-[16px]">
            <div className="relative max-sm:w-full w-[480px] overflow-hidden rounded-[8px] bg-white shadow-[0_12px_28px_rgba(0,0,0,0.24)]">
                {showUploading && (
                    <div className="p-[60px_50px_300px]">
                        <div className="h-[6px] w-full rounded-full bg-[#E4E7EB]">
                            <div className="h-[6px] rounded-full bg-[#DC0000] transition-[width] duration-300" style={{ width: `${uploadPercent}%` }} />
                        </div>
                        <p className="mt-[18px] text-center text-[16px] font-[Inter-SemiBold] text-[#23262A]">Uploading {uploadPercent} %</p>
                    </div>
                )}

                {showSubmitted && (
                    <>
                        <div className="p-[16px_16px_0px]">
                            <div className='border-b border-[rgba(143,143,143,0.25)] pb-[16px]'>
                                <div className="mb-[14px] flex justify-center">
                                    <Image src={verificationreview} alt="Verification review" className="w-[42px] h-[42px] object-contain" />
                                </div>
                                <h3 className="text-center text-[18px] font-[Inter-Bold] text-[#23262A]">
                                    Verification request submitted successfully
                                </h3>
                            </div>
                            <div className="p-[24px_0] text-center flex flex-col gap-[8px]">
                                <p className="text-[14px] text-[#23262A] font-[Inter-Regular]">Your verification request is currently being reviewed.</p>
                                <p className="text-[14px] text-[#23262A] font-[Inter-Regular]">
                                    You can always review your status from your <Link href="/profilesetting" className="text-[#3A88EF] font-[Inter-SemiBold] text-[14px]">profile section.</Link>
                                </p>
                                <p className="text-[14px] text-[#23262A] font-[Inter-Regular]">Got questions?</p>
                                <Link className="text-[#3A88EF] font-[Inter-SemiBold] text-[14px]" href="/">
                                    Contact customer support
                                </Link>
                            </div>
                        </div>
                        <div className="border-t border-[rgba(143,143,143,0.25)] flex justify-end p-[16px]">
                            <button
                                type="button"
                                onClick={() => {
                                    onClose?.()
                                }}
                                className="rounded-[6px] bg-[#23262A] p-[6px_28px] text-[14px] font-[Inter-SemiBold] text-white cursor-pointer"
                            >
                                OK
                            </button>
                        </div>
                    </>
                )}

                {!showUploading && !showSubmitted && (
                    <>
                        <div className="max-h-[80vh] overflow-y-auto p-[16px]">
                            <div className="relative mb-[12px] flex items-center justify-center border-b border-[rgba(143,143,143,0.25)] p-[10px_0px_18px]">
                                <h2 className="mx-auto text-center text-[18px] font-[Inter-Bold] text-[#23262A]">{modalTitle}</h2>
                                <button type="button" onClick={onClose} className="cursor-pointer" aria-label="Close">
                                    <CloseIcon className="h-[12px] w-[12px]" fill="#9CA3AF" fillOpacity="1" />
                                </button>
                            </div>

                            <div className="mb-[28px] flex items-center gap-[12px]">
                                <div className="h-[4px] flex-1 rounded-full bg-[#e0e1e3]">
                                    <div
                                        className={`h-[4px] rounded-full bg-[#DC0000] transition-[width] duration-300 ${showSelfieIntro || showSelfieCamera || showSelfiePreview ? 'w-full' : firstProgressClass
                                            }`}
                                    />
                                </div>
                                <div className="h-[4px] flex-1 rounded-full bg-[#e0e1e3]">
                                    <div className={`h-[4px] rounded-full bg-[#DC0000] transition-[width] duration-300 ${secondProgressClass}`} />
                                </div>
                            </div>

                            {!showSelfieIntro && !showSelfieCamera && !showSelfiePreview && (
                                <div className="flex items-center gap-[10px]">
                                    <div className="flex items-center gap-[8px]">
                                        <div
                                            className={`flex h-[24px] w-[24px] items-center justify-center rounded-full text-[12px] font-[Inter-Regular] text-white ${step1Done ? (isBack ? 'bg-[#a3a6aa]' : 'bg-black') : 'bg-black'
                                                }`}
                                        >
                                            {step1Done ? <FaCheck className="h-[12px] w-[12px]" /> : '1'}
                                        </div>
                                        <p
                                            className={`text-[14px] font-[Inter-Regular] ${step1Done ? (isBack ? 'text-[#a3a6aa]' : 'text-[#23262A]') : 'text-[#23262A]'
                                                }`}
                                        >
                                            Front of ID
                                        </p>
                                    </div>
                                    <div className="h-[1px] flex-1 bg-[#c2c4c7]" />
                                    <div className="flex items-center gap-[8px]">
                                        <div
                                            className={`flex h-[24px] w-[24px] items-center justify-center rounded-full text-[12px] font-[Inter-Regular] text-white ${step2Done ? 'bg-black' : step2Active ? 'bg-black' : 'bg-[#a3a6aa]'
                                                }`}
                                        >
                                            {step2Done ? <FaCheck className="h-[12px] w-[12px]" /> : '2'}
                                        </div>
                                        <p
                                            className={`text-[14px] font-[Inter-Regular] ${step2Done || step2Active ? 'text-[#23262A]' : 'text-[#a3a6aa]'
                                                }`}
                                        >
                                            Back of ID
                                        </p>
                                    </div>
                                </div>
                            )}

                            {showSelfieIntro && (
                                <>
                                    <div className="mb-[22px]">
                                        <h4 className="mb-[12px] text-[14px] font-[Inter-Bold] text-[#23262A]">Record a video to complete verification</h4>
                                        <p className="text-[14px] text-[#23262A] font-[Inter-Regular]">
                                            Position your face in the center of the video, it will just take 5 seconds.
                                        </p>
                                    </div>
                                    <div className="mb-[22px]">
                                        <h4 className="mb-[10px] text-[14px] font-[Inter-Bold] text-[#23262A]">
                                            Here’s an example:
                                        </h4>
                                        <div className="overflow-hidden rounded-[8px]">
                                            <Image src={selfieexample} alt="Selfie sample" className="w-auto h-auto object-contain" />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="mb-[12px] text-[14px] font-[Inter-Bold] text-[#23262A]">Tip</h4>
                                        <p className="text-[14px] text-[#23262A] font-[Inter-Regular]">
                                            Make sure you are in a well lit room with a plain backgorund
                                        </p>
                                    </div>
                                </>
                            )}

                            {showIntro && (
                                <>
                                    <div className="flex justify-center my-[60px]">
                                        <Image
                                            src={idfront}
                                            alt={isBack ? 'ID back' : 'ID front'}
                                            className={`h-[158px] w-[268px] rounded-[8px] object-cover [box-shadow:0px_6px_6px_-3px_rgba(0,0,0,0.1),0px_10px_14px_1px_rgba(0,0,0,0.07),0px_4px_18px_3px_rgba(0,0,0,0.06)] ${isBack ? 'scale-x-[-1]' : ''
                                                }`}
                                        />
                                    </div>
                                    <TipsPanel />
                                    {renderTryAppPanel()}
                                </>
                            )}

                            {showCamera && (
                                <>
                                    <div className="relative mt-[20px] overflow-hidden rounded-[12px]">
                                        <video ref={videoRef} playsInline muted autoPlay className="aspect-[4/3] w-full object-cover object-center bg-[#1a1a1a]" />
                                        {(cameraError || isRequestingMedia) && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-[12px] bg-[#2a2a2a] p-[16px] text-center">
                                                <p className="text-[13px] text-white/90">
                                                    {isRequestingMedia
                                                        ? 'Waiting for camera permission…'
                                                        : cameraError}
                                                </p>
                                                {!isRequestingMedia && cameraError ? (
                                                    <button
                                                        type="button"
                                                        onClick={handleRetryCameraAccess}
                                                        className="rounded-[4px] bg-[#DC0000] p-[8px_14px] text-[12px] font-[Inter-SemiBold] text-white cursor-pointer"
                                                    >
                                                        Allow camera
                                                    </button>
                                                ) : null}
                                            </div>
                                        )}
                                        {!cameraError && !isRequestingMedia ? (
                                            <div className="absolute bottom-[16px] left-1/2 flex -translate-x-1/2 justify-center">
                                                <button
                                                    type="button"
                                                    onClick={handleCapture}
                                                    className="rounded-[4px] bg-[#DC0000] p-[6px_10px] text-[10px] font-[Inter-SemiBold] text-white cursor-pointer"
                                                >
                                                    Capture
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                </>
                            )}

                            {showSelfieCamera && (
                                <>
                                    <p className="mb-[14px] text-[14px] text-[#23262A]">Ensure your face is in the centre of the video</p>
                                    <div className="relative mb-[16px] overflow-hidden rounded-[16px] bg-[#1a1a1a]">
                                        <video ref={videoRef} playsInline muted autoPlay className="aspect-[4/3] w-full object-cover object-center" />
                                        {(cameraError || isRequestingMedia) && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-[12px] bg-[#2a2a2a] p-[16px] text-center">
                                                <p className="text-[13px] text-white/90">
                                                    {isRequestingMedia
                                                        ? 'Waiting for camera and microphone permission…'
                                                        : cameraError}
                                                </p>
                                                {!isRequestingMedia && cameraError ? (
                                                    <button
                                                        type="button"
                                                        onClick={handleRetryCameraAccess}
                                                        className="rounded-[4px] bg-[#DC0000] p-[8px_14px] text-[12px] font-[Inter-SemiBold] text-white cursor-pointer"
                                                    >
                                                        Allow camera & microphone
                                                    </button>
                                                ) : null}
                                            </div>
                                        )}
                                        {!cameraError && !isRequestingMedia && !isRecording ? (
                                            <div className="absolute bottom-[12px] left-1/2 -translate-x-1/2">
                                                <button
                                                    type="button"
                                                    onClick={startSelfieRecording}
                                                    className="rounded-[4px] bg-[#DC0000] p-[6px_10px] text-[10px] font-[Inter-SemiBold] text-white cursor-pointer"
                                                >
                                                    Record
                                                </button>
                                            </div>
                                        ) : null}
                                        {isRecording ? (
                                            <>
                                                <div className="absolute bottom-[14px] left-[12px] flex items-center gap-[6px] text-white text-[14px]">
                                                    <span className="h-[10px] w-[10px] rounded-full bg-[#DC0000]" />
                                                    Recording...
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={cancelSelfieRecording}
                                                    className="absolute bottom-[14px] left-1/2 -translate-x-1/2 rounded-[6px] bg-[#2F3842] p-[6px_10px] text-[10px] text-white cursor-pointer"
                                                >
                                                    Cancel
                                                </button>
                                                <div className="absolute bottom-0 left-0 h-[4px] bg-[#DC0000]" style={{ width: `${recordingProgress}%` }} />
                                            </>
                                        ) : null}
                                    </div>
                                </>
                            )}

                            {showSelfiePreview && (
                                <>
                                    <p className="mb-[10px] text-[16px] text-[#23262A]">Ensure your face is in the centre of the video</p>
                                    <p className="mb-[14px] text-[16px] text-[#23262A]">Review your video before submitting</p>
                                    <div className="mb-[16px] overflow-hidden rounded-[16px] bg-[#f2f2f2]">
                                        {selfiePreviewUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={selfiePreviewUrl} alt="Selfie preview" className="aspect-[4/3] w-full object-cover" />
                                        ) : (
                                            <div className="flex aspect-[4/3] w-full items-center justify-center text-[#626465]">
                                                Preview unavailable
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {showCaptured && (
                                <>
                                    <div className="my-[14px] rounded-[6px] bg-[#f0f9ef] p-[16px_16px]">
                                        <div className="mb-[8px] flex items-start gap-[12px]">
                                            <div className="">
                                                <CaptureTickIcon className="h-[24px] w-[24px]" />
                                            </div>
                                            <div className="flex flex-col gap-[4px]">
                                                <h4 className="text-[16px] font-[Inter-SemiBold] text-[#2a5028] mb-[6px]">Captured</h4>
                                                <p className="text-[14px] font-[Inter-Regular] leading-[1.45] text-[#2a5028]">{capturedQuestion1}</p>
                                                <p className="text-[14px] font-[Inter-Regular] leading-[1.45] text-[#2a5028]">Is the ID valid?</p>
                                            </div>
                                        </div>

                                    </div>

                                    <div className="relative mb-[16px] overflow-hidden rounded-[12px] border border-[rgba(0,0,0,0.08)] bg-[#F5F5F5] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                                        {capturedUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={capturedUrl} alt="Captured ID preview" className="max-h-[360px] w-full object-contain" />
                                        ) : (
                                            <div className="flex aspect-[4/3] w-full items-center justify-center text-[14px] text-[#626465]">Preview unavailable</div>
                                        )}
                                        {capturedUrl ? (
                                            <button
                                                type="button"
                                                onClick={handleTryAgain}
                                                className="cursor-pointer absolute bottom-[16px] left-1/2 -translate-x-1/2 rounded-[6px] bg-[#2e3238] p-[6px_10px] text-[10px] font-[Inter-SemiBold] text-white "
                                            >
                                                Retake
                                            </button>
                                        ) : null}
                                    </div>


                                    <TipsPanel />
                                    {renderTryAppPanel()}
                                </>
                            )}
                        </div>

                        {showCamera && (
                            <div className='px-[16px] pb-[16px]'>
                                {renderTryAppPanel()}
                            </div>
                        )}

                        {showIntro && (
                            <div className="flex items-center border-t border-[rgba(143,143,143,0.25)] justify-end p-[16px]">

                                <button
                                    type="button"
                                    onClick={handleTakePhotoClick}
                                    disabled={isRequestingMedia}
                                    className="cursor-pointer flex items-center gap-[4px] rounded-[6px] bg-[#DC0000] p-[8px_16px] disabled:opacity-60"
                                >
                                    <p className="text-[14px] font-[Inter-SemiBold] text-white">
                                        {isRequestingMedia ? 'Requesting camera…' : 'Take Photo'}
                                    </p>
                                    <RightArrowIcon className="h-[24px] w-[24px]" stroke="#fff" />
                                </button>
                            </div>
                        )}

                        {showCaptured && (
                            <div className="flex items-center border-t border-[rgba(143,143,143,0.25)] p-[16px] justify-end gap-[10px]">
                                <button
                                    type="button"
                                    onClick={handleTryAgain}
                                    className="cursor-pointer rounded-[6px] border border-[rgba(35,38,42,0.35)] bg-white p-[8px_16px] text-[14px] font-[Inter-SemiBold] text-[#23262A]"
                                >
                                    Try Again
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmId}
                                    className="cursor-pointer flex items-center gap-[4px] rounded-[6px] bg-[#DC0000] p-[8px_16px]"
                                >
                                    <p className="text-[14px] font-[Inter-SemiBold] text-white">Confirm</p>
                                    <RightArrowIcon className="h-[24px] w-[24px]" stroke="#fff" />
                                </button>
                            </div>
                        )}
                        {showSelfieIntro && (
                            <div className="flex items-center border-t border-[rgba(143,143,143,0.25)] p-[16px] justify-end gap-[10px]">
                                <button
                                    type="button"
                                    onClick={handleOpenSelfieCamera}
                                    disabled={isRequestingMedia}
                                    className="flex items-center gap-[4px] rounded-[6px] bg-[#DC0000] p-[8px_16px] cursor-pointer disabled:opacity-60"
                                >
                                    <p className="text-[14px] font-[Inter-SemiBold] text-white">
                                        {isRequestingMedia ? 'Requesting access…' : 'Open Camera'}
                                    </p>
                                    <RightArrowIcon className="h-[24px] w-[24px]" stroke="#fff" />
                                </button>
                            </div>
                        )}
                        {showSelfieCamera && (
                            <div className="flex items-center border-t border-[rgba(143,143,143,0.25)] p-[16px] justify-end gap-[10px]">
                                <button
                                    type="button"
                                    disabled
                                    className="cursor-not-allowed rounded-[6px] bg-[#0000001f] p-[8px_16px] flex items-center gap-[4px]"
                                >
                                    <p className="text-[14px] font-[Inter-SemiBold] text-[#00000042]">Submit Video</p>
                                    <RightArrowIcon className="h-[24px] w-[24px]" stroke="#00000042" disabled />
                                </button>
                            </div>
                        )}
                        {showSelfiePreview && (
                            <div className="flex items-center border-t border-[rgba(143,143,143,0.25)] p-[16px] justify-end gap-[10px]">
                                <button
                                    type="button"
                                    onClick={handleOpenSelfieCamera}
                                    disabled={isRequestingMedia}
                                    className="rounded-[6px] border border-[rgba(35,38,42,0.35)] bg-white p-[8px_16px] text-[14px] font-[Inter-SemiBold] text-[#23262A] cursor-pointer disabled:opacity-60"
                                >
                                    Retake
                                </button>
                                <button
                                    type="button"
                                    onClick={submitSelfieVideo}
                                    disabled={isSubmittingVideo || !faceClipFile}
                                    className="flex items-center gap-[4px] rounded-[6px] bg-[#DC0000] p-[8px_16px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <p className="text-[14px] font-[Inter-SemiBold] text-white">{isSubmittingVideo ? 'Uploading...' : 'Submit Video'}</p>
                                    <RightArrowIcon className="h-[24px] w-[24px]" stroke="#fff" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div >
    )
}

export default EmiratesIdModal
