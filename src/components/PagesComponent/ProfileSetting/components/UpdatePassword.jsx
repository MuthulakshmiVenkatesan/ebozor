'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { CloseIcon, TickIcon } from '@/components/CustomFile/icons'
import { getApp, getApps } from 'firebase/app'
import {
    RecaptchaVerifier,
    getAuth,
    linkWithPhoneNumber,
    PhoneAuthProvider,
    reauthenticateWithCredential,
    sendSignInLinkToEmail,
} from 'firebase/auth'
import toast from 'react-hot-toast'
import { handleFirebaseAuthError, t } from '@/utils'
import verifyphone from '../../../../../public/assets/img/verifyphone.svg'
import mobiledevice from '../../../../../public/assets/img/icons/mobiledevice.svg'
import mail from '../../../../../public/assets/img/icons/mail.svg'
import otpmobile from '../../../../../public/assets/img/icons/otpmobile.svg'
import mailoutline from '../../../../../public/assets/img/icons/mailOutline.svg'

const TIMER_START = 60
const PASSWORD_EMAIL_VERIFY_PENDING_KEY = 'password_email_verify_pending'
const PASSWORD_EMAIL_VERIFY_TOKEN_KEY = 'password_email_verify_token'
const PASSWORD_EMAIL_VERIFY_EMAIL_KEY = 'password_email_verify_email'

function formatCountdown(totalSeconds) {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} seconds`
}

/** Compare phone numbers by digits only (E.164 vs local formats). */
function phonesEqualDigits(a, b) {
    const d = (x) => String(x || '').replace(/\D/g, '')
    const da = d(a)
    const db = d(b)
    return da.length > 0 && da === db
}

export default function UpdatePassword({
    open,
    onClose,
    accountType = '',
    phoneDisplay = '',
    emailDisplay = '',
    onOtpVerified,
}) {
    const auth = useMemo(() => {
        if (typeof window === 'undefined') return null
        try {
            if (getApps().length > 0) return getAuth(getApp())
            return getAuth()
        } catch {
            return getAuth()
        }
    }, [])
    const [method, setMethod] = useState(null)
    const [step, setStep] = useState('select')
    const [otpCode, setOtpCode] = useState('')
    const [secondsLeft, setSecondsLeft] = useState(0)
    const [confirmationResult, setConfirmationResult] = useState(null)
    /** signIn = phone-only account; link = add phone to current user; reauth = SMS proof without switching user */
    const [verifyMode, setVerifyMode] = useState(null)
    const [reauthVerificationId, setReauthVerificationId] = useState(null)
    const [showLoader, setShowLoader] = useState(false)
    const [resendOtpLoader, setResendOtpLoader] = useState(false)

    const handleClose = useCallback(() => {
        setMethod(null)
        setStep('select')
        setOtpCode('')
        setSecondsLeft(0)
        setConfirmationResult(null)
        setVerifyMode(null)
        setReauthVerificationId(null)
        onClose?.()
    }, [onClose])

    useEffect(() => {
        if (!open) {
            setMethod(null)
            setStep('select')
            setOtpCode('')
            setSecondsLeft(0)
            setConfirmationResult(null)
            setVerifyMode(null)
            setReauthVerificationId(null)
        }
    }, [open])

    useEffect(() => {
        if (step === 'otp_pending' || step === 'email_sent') {
            setSecondsLeft(TIMER_START)
        }
    }, [step])

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
            if (e.key === 'Escape') handleClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, handleClose])

    const clearRecaptcha = () => {
        const recaptchaContainer = document.getElementById('recaptcha-container')
        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear()
            } catch (error) {
                console.error('Error clearing RecaptchaVerifier:', error?.message)
            }
            window.recaptchaVerifier = null
        }
        if (recaptchaContainer) {
            recaptchaContainer.innerHTML = ''
        }
    }

    const generateRecaptcha = () => {
        if (!auth) return null
        if (!window.recaptchaVerifier) {
            const recaptchaContainer = document.getElementById('recaptcha-container')
            if (!recaptchaContainer) {
                console.error("Container element 'recaptcha-container' not found.")
                return null
            }
            try {
                recaptchaContainer.innerHTML = ''
                // Firebase v10 modular signature: RecaptchaVerifier(auth, container, params)
                window.recaptchaVerifier = new RecaptchaVerifier(
                    auth,
                    'recaptcha-container',
                    {
                        size: 'invisible',
                    }
                )
                return window.recaptchaVerifier
            } catch (error) {
                console.error('Error initializing RecaptchaVerifier:', error?.message)
                return null
            }
        }
        return window.recaptchaVerifier
    }

    /**
     * Always verify against the currently signed-in Firebase user:
     * - if phone already linked => reauthenticateWithCredential flow
     * - if phone not linked yet   => linkWithPhoneNumber flow
     * This avoids creating/switching to a different Firebase UID session.
     */
    const startSmsVerification = async () => {
        const appVerifier = generateRecaptcha()
        if (!appVerifier) {
            throw new Error('RECAPTCHA_INIT')
        }

        if (!auth) {
            const err = new Error('NO_AUTH')
            err.code = 'NO_AUTH'
            throw err
        }

        const user = auth.currentUser
        if (!user) {
            const err = new Error('NO_USER')
            err.code = 'NO_USER'
            throw err
        }

        if (phonesEqualDigits(user.phoneNumber, phoneDisplay)) {
            const provider = new PhoneAuthProvider(auth)
            const vid = await provider.verifyPhoneNumber(phoneDisplay, appVerifier)
            setVerifyMode('reauth')
            setReauthVerificationId(vid)
            setConfirmationResult(null)
            return
        }

        const confirmation = await linkWithPhoneNumber(user, phoneDisplay, appVerifier)
        setVerifyMode('link')
        setConfirmationResult(confirmation)
        setReauthVerificationId(null)
    }

    const sendOTP = async () => {
        if (!phoneDisplay) return
        if (!auth?.currentUser) {
            toast.error(t('userNotFound'))
            return
        }
        try {
            setShowLoader(true)
            clearRecaptcha()
            setConfirmationResult(null)
            setVerifyMode(null)
            setReauthVerificationId(null)
            await startSmsVerification()
            setStep('otp_pending')
            setSecondsLeft(TIMER_START)
            setOtpCode('')
            toast.success(t('otpSentSuccess'))
        } catch (error) {
            if (error?.code === 'NO_USER' || error?.message === 'NO_USER') {
                toast.error(t('userNotFound'))
            } else if (error?.code === 'NO_AUTH' || error?.message === 'NO_AUTH') {
                toast.error(t('errorOccurred'))
            } else if (error?.message === 'RECAPTCHA_INIT') {
                toast.error(t('errorOccurred'))
            } else if (error?.code) {
                handleFirebaseAuthError(error.code)
            }
        } finally {
            setShowLoader(false)
        }
    }

    const resendOtp = async () => {
        if (secondsLeft > 0 || !phoneDisplay) return
        if (!auth?.currentUser) {
            toast.error(t('userNotFound'))
            return
        }
        try {
            setResendOtpLoader(true)
            clearRecaptcha()
            await startSmsVerification()
            setSecondsLeft(TIMER_START)
            toast.success(t('otpSentSuccess'))
        } catch (error) {
            if (error?.code === 'NO_USER' || error?.message === 'NO_USER') {
                toast.error(t('userNotFound'))
            } else if (error?.code === 'NO_AUTH' || error?.message === 'NO_AUTH') {
                toast.error(t('errorOccurred'))
            } else if (error?.message === 'RECAPTCHA_INIT') {
                toast.error(t('errorOccurred'))
            } else if (error?.code) {
                handleFirebaseAuthError(error.code)
            }
        } finally {
            setResendOtpLoader(false)
        }
    }

    const verifyOTP = async () => {
        const code = otpCode.replace(/\D/g, '')
        if (code.length < 4) {
            toast.error(t('otpmissing'))
            return
        }

        try {
            setShowLoader(true)
            if (verifyMode === 'reauth' && reauthVerificationId) {
                if (!auth?.currentUser) {
                    toast.error(t('userNotFound'))
                    return
                }
                const cred = PhoneAuthProvider.credential(reauthVerificationId, code)
                await reauthenticateWithCredential(auth.currentUser, cred)
            } else if (confirmationResult?.confirm) {
                await confirmationResult.confirm(code)
            } else {
                // OTP was not requested (or expired state), ask user to request again.
                toast.error(t('otpmissing'))
                return
            }
            toast.success(t('otpVerifiedSuccess'))
            setOtpCode('')
            setSecondsLeft(0)
            onOtpVerified?.()
            handleClose()
        } catch (error) {
            handleFirebaseAuthError(error?.code)
        } finally {
            setShowLoader(false)
        }
    }

    const sendEmailVerificationLink = async () => {
        if (!auth?.currentUser) {
            toast.error(t('userNotFound'))
            return
        }
        try {
            setShowLoader(true)
            if (typeof window !== 'undefined') {
                const flowToken = Math.random().toString(36).slice(2) + Date.now().toString(36)
                const userEmail = String(auth.currentUser.email || '').trim()
                if (!userEmail) {
                    toast.error(t('emailRequired'))
                    return
                }
                window.localStorage.setItem(PASSWORD_EMAIL_VERIFY_PENDING_KEY, '1')
                window.localStorage.setItem(PASSWORD_EMAIL_VERIFY_TOKEN_KEY, flowToken)
                window.localStorage.setItem(PASSWORD_EMAIL_VERIFY_EMAIL_KEY, userEmail)
                const returnUrl = new URL(window.location.href)
                returnUrl.searchParams.set('emailverified', '1')
                returnUrl.searchParams.set('pwd_flow_token', flowToken)
                await sendSignInLinkToEmail(auth, userEmail, {
                    url: returnUrl.toString(),
                    handleCodeInApp: true,
                })
            } else {
                toast.error(t('errorOccurred'))
                return
            }
            setStep('email_sent')
            setSecondsLeft(TIMER_START)
            toast.success('Verification email sent')
        } catch (error) {
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(PASSWORD_EMAIL_VERIFY_PENDING_KEY)
                window.localStorage.removeItem(PASSWORD_EMAIL_VERIFY_TOKEN_KEY)
                window.localStorage.removeItem(PASSWORD_EMAIL_VERIFY_EMAIL_KEY)
            }
            if (error?.code) {
                handleFirebaseAuthError(error.code)
            } else {
                toast.error(t('errorOccurred'))
            }
        } finally {
            setShowLoader(false)
        }
    }

    const verifyEmailLinkStatus = async () => {
        toast('Open the reset link from your email, then you will be redirected automatically.')
    }

    useEffect(() => {
        return () => clearRecaptcha()
    }, [])

    useEffect(() => {
        if (step !== 'otp_pending' && step !== 'email_sent') return
        if (secondsLeft <= 0) return
        const id = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
        return () => window.clearTimeout(id)
    }, [step, secondsLeft])

    if (!open) return null

    const canConfirm = method === 'otp' || method === 'email'
    const canResend = secondsLeft === 0
    const otpReady = otpCode.replace(/\D/g, '').length >= 4

    const goToEmailStep = () => {
        sendEmailVerificationLink()
    }

    return (
        <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/45 p-[16px]" role="dialog" aria-modal="true" aria-labelledby="update-password-title">
            <button type="button" className="absolute inset-0 cursor-default" aria-label="Close dialog overlay" onClick={handleClose} />
            <div
                className="relative z-[1] flex max-h-[min(640px,90vh)] w-[450px] max-sm:w-full flex-col overflow-hidden rounded-[10px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex shrink-0 items-center justify-end p-[24px]">
                    <button type="button" onClick={handleClose} className="cursor-pointer p-[6px]" aria-label="Close">
                        <CloseIcon className="h-[14px] w-[14px]" fill="#9CA3AF" fillOpacity="1" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-[24px] pb-[20px] pt-[4px]">
                    {step === 'select' ? (
                        <>
                            <div className="mb-[20px] flex flex-col items-center justify-center gap-[14px]">
                                <div className="w-full flex items-center justify-center">
                                    <Image src={verifyphone} alt="verifyphone" width={150} height={150} className="w-[150px] h-[150px]" />
                                </div>

                                <h2 id="update-password-title" className="text-center text-[22px] font-[Inter-Bold] leading-snug text-[#23262A]">
                                    Change Password
                                </h2>
                                <p className="w-[300px] mx-auto max-sm:w-full text-center text-[14px] font-[Inter-Regular] leading-[1.5] text-[#23262A]">
                                    To change your password, please verify your identity by selecting your preferred authentication method.
                                </p>
                            </div>

                            <div className="flex flex-col gap-[12px]">
                                <button
                                    type="button"
                                    onClick={() => setMethod('otp')}
                                    className={`flex w-full cursor-pointer items-center gap-[14px] rounded-[6px] border p-[8px_16px] text-left transition-colors ${method === 'otp' ? 'border-[#23262A] bg-[#f7f7f8]' : 'border-[#0000001f] bg-white'
                                        }`}
                                >
                                    <label className='relative'>
                                        <input type="checkbox" className="w-[18px] h-[18px] rounded-full border border-[#0000001f] bg-white checked:bg-[#23262A] appearance-none" checked={method === 'otp'} />
                                        {method === 'otp' ? <TickIcon className="w-[18px] h-[18px] absolute left-0 top-0" fill="#fff" /> : null}
                                    </label>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="mb-[4px] text-[14px] font-[Inter-SemiBold] text-[#23262A] rtl:text-right">Request OTP</h4>
                                        <p className="w-[200px] max-sm:w-full text-[12px] font-[Inter-Regular] leading-[1.4] text-[#23262A] rtl:text-right">
                                            A verification code will be sent to {phoneDisplay || '—'}
                                        </p>
                                    </div>
                                    <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-[#23262a14]">
                                        <Image src={mobiledevice} alt="mobiledevice" width={22} height={22} className="w-[22px] h-[22px]" />
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setMethod('email')}
                                    className={`flex w-full cursor-pointer items-center gap-[14px] rounded-[6px] border p-[8px_16px] text-left transition-colors ${method === 'email' ? 'border-[#23262A] bg-[#f7f7f8]' : 'border-[#0000001f] bg-white'
                                        }`}
                                >
                                    <label className='relative'>
                                        <input type="checkbox" className="w-[18px] h-[18px] rounded-full border border-[#0000001f] bg-white checked:bg-[#23262A] appearance-none" checked={method === 'email'} />
                                        {method === 'email' ? <TickIcon className="w-[18px] h-[18px] absolute left-0 top-0" fill="#fff" /> : null}
                                    </label>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="mb-[4px] text-[14px] font-[Inter-SemiBold] text-[#23262A] rtl:text-right">Verify with Email</h4>
                                        <p className="w-[200px] max-sm:w-full text-[12px] font-[Inter-Regular] leading-[1.4] text-[#23262A] rtl:text-right">
                                            A link will be sent to {emailDisplay || '—'}
                                        </p>
                                    </div>
                                    <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-[#23262a14]">
                                        <Image src={mail} alt="mail" width={22} height={22} className="w-[22px] h-[22px]" />
                                    </div>
                                </button>
                            </div>
                        </>
                    ) : null}

                    {step === 'otp_pending' ? (
                        <div className='px-[40px] max-sm:px-0'>
                            <div className="mx-auto mb-[20px] mt-[8px] flex justify-center">
                                <div className="">
                                    <Image src={otpmobile} alt="otpmobile" width={64} height={64} className="w-[64px] h-[64px]" />
                                </div>
                            </div>
                            <h2 id="update-password-title" className="mb-[26px] text-center text-[22px] font-[Inter-Bold] leading-snug text-[#23262A]">
                                An OTP is on the way
                            </h2>
                            <div className="mb-[26px] flex flex-col items-center justify-center gap-[6px]">
                                <p className="text-center text-[14px] font-[Inter-Regular] leading-[1.5] text-[#4B5563]">We sent a verification code to</p>
                                <p className="text-center text-[14px] font-[Inter-Bold] text-[#DC0000]">{phoneDisplay}</p>
                                <p className="text-center text-[14px] font-[Inter-Regular] text-[#4B5563]">Please enter it below:</p>
                            </div>

                            <input
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                placeholder="Enter your verification code."
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                className="mb-[14px] h-[48px] w-full rounded-[8px] border border-[rgba(143,143,143,0.45)] px-[14px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#9CA3AF] focus:border-[#23262A] flex items-center justify-center text-center"
                            />

                            <p className="mb-[14px] text-center text-[14px] font-[Inter-Regular] text-[#23262A]">{formatCountdown(secondsLeft)}</p>

                            <div className="mb-[18px] flex flex-col items-center justify-center gap-[20px]">
                                <button
                                    type="button"
                                    disabled={!canResend || resendOtpLoader}
                                    onClick={resendOtp}
                                    className={`font-[Inter-Medium] ${canResend && !resendOtpLoader ? 'cursor-pointer text-[#23262A]' : 'cursor-not-allowed text-[#9CA3AF]'}`}
                                >
                                    {resendOtpLoader ? 'Sending...' : 'Resend code'}
                                </button>
                                <button
                                    type="button"
                                    disabled={!canResend}
                                    className={`font-[Inter-Medium] ${canResend ? 'cursor-pointer text-[#23262A]' : 'cursor-not-allowed text-[#9CA3AF]'}`}
                                >
                                    Receive a phone call instead
                                </button>
                            </div>

                            <button
                                type="button"
                                disabled={!otpReady || showLoader}
                                onClick={verifyOTP}
                                className={`mb-[16px] w-full rounded-[8px] py-[10px] text-[14px] font-[Inter-SemiBold] ${otpReady && !showLoader ? 'cursor-pointer bg-[#23262A] text-white hover:bg-[#1a1d21]' : 'cursor-not-allowed bg-[#E5E7EB] text-[#9CA3AF]'
                                    }`}
                            >
                                {showLoader ? 'Verifying...' : 'Verify'}
                            </button>

                            <button type="button" onClick={goToEmailStep} className="w-full cursor-pointer text-center text-[14px] font-[Inter-SemiBold] text-[#3a88ef]">
                                Send Email Link Instead
                            </button>
                        </div>
                    ) : null}

                    {step === 'email_sent' ? (
                        <div className='px-[40px] max-sm:px-0'>
                            <div className="mx-auto mb-[20px] mt-[8px] flex justify-center">
                                <div className="flex h-[64px] w-[64px] items-center justify-center rounded-[12px] bg-[#3a88ef1f]">
                                    <Image src={mailoutline} alt="mailoutline" width={28} height={28} className="w-[20px] h-[25px]" />
                                </div>
                            </div>
                            <h2 id="update-password-title" className="mb-[26px] text-center text-[22px] font-[Inter-Bold] leading-snug text-[#23262A]">
                                An email is on the way
                            </h2>
                            <div className="mb-[30px] flex flex-col items-center justify-center gap-[6px]">
                                <p className="text-center text-[14px] font-[Inter-Regular] leading-[1.5] text-[#4B5563]">We sent a verification link to</p>
                                <p className="text-center text-[14px] font-[Inter-Bold] text-[#DC0000]">{emailDisplay || '—'}</p>
                                <p className="text-center text-[14px] font-[Inter-Regular] text-[#4B5563]">Open your email and continue. You will be redirected here and then password popup will open.</p>
                            </div>

                            <p className="mb-[30px] text-center text-[14px] font-[Inter-Medium] text-[#666]">{formatCountdown(secondsLeft)}</p>

                            <div className='text-center'>
                                <button
                                    type="button"
                                    disabled={!canResend || showLoader}
                                    onClick={() => {
                                        if (!canResend || showLoader) return
                                        sendEmailVerificationLink()
                                    }}
                                    className={`mb-[18px] rounded-[8px] mx-auto text-[14px] font-[Inter-SemiBold] ${canResend ? 'cursor-pointer text-[#23262A] hover:bg-[#F9FAFB]' : 'cursor-not-allowed text-[#9CA3AF]'
                                        }`}
                                >
                                    Resend Email
                                </button>
                            </div>


                            <div className='text-center'>
                                <button
                                    type="button"
                                    disabled={showLoader}
                                    onClick={() => {
                                        if (showLoader) return
                                        verifyEmailLinkStatus()
                                    }}
                                    className={`mb-[16px] w-full rounded-[8px] py-[10px] text-[14px] font-[Inter-SemiBold] ${!showLoader ? 'cursor-pointer bg-[#23262A] text-white hover:bg-[#1a1d21]' : 'cursor-not-allowed bg-[#E5E7EB] text-[#9CA3AF]'
                                    }`}
                                   
                                >
                                    {showLoader ? 'Please wait...' : 'Verify'}
                                </button>
                            </div>

                            {/* <button type="button" onClick={goToOtpStep} className="w-full cursor-pointer text-center text-[14px] font-[Inter-SemiBold] text-[#2563EB]">
                                Use SMS / OTP instead
                            </button> */}
                        </div>
                    ) : null}
                </div>

                <div
                    id="recaptcha-container"
                    className="hidden"
                />

                {step === 'select' ? (
                    <div className="flex shrink-0 justify-end px-[24px] py-[16px]">
                                <button
                                    type="button"
                                    disabled={!canConfirm || showLoader}
                                    onClick={() => {
                                        if (!canConfirm || showLoader) return
                                        if (method === 'otp') {
                                            sendOTP()
                                        } else if (method === 'email') {
                                            sendEmailVerificationLink()
                                        }
                                    }}
                                    className={`rounded-[6px] px-[28px] py-[10px] text-[14px] font-[Inter-SemiBold] ${canConfirm && !showLoader ? 'cursor-pointer bg-[#23262A] text-white ' : 'cursor-not-allowed bg-[#E5E7EB] text-white'
                                        }`}
                                >
                                    {showLoader ? 'Please wait...' : 'Confirm'}
                                </button>
                    </div>
                ) : null}
            </div>
        </div >
    )
}
