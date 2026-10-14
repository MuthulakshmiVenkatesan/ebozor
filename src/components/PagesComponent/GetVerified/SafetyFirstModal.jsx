'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { CloseIcon, DownArrowIcon } from '@/components/CustomFile/icons'
import safety from '../../../../public/assets/img/icons/safety.svg'
import VerifyOTPModal from './VerifyOTPModal'
import { getApp, getApps } from 'firebase/app'
import { PhoneAuthProvider, RecaptchaVerifier, getAuth, linkWithCredential, updatePhoneNumber } from 'firebase/auth'
import { setUserPhoneNumberApi } from '@/utils/api'
import { useSelector } from 'react-redux'
import { loadUpdateUserData, userSignUpData } from '@/redux/reuducer/authSlice'
import { handleFirebaseAuthError } from '@/utils'
import toast from 'react-hot-toast'

const COUNTRY_CODES = [
    '+1', '+7', '+20', '+27', '+30', '+31', '+32', '+33', '+34', '+36', '+39', '+40', '+41', '+43', '+44', '+45', '+46', '+47', '+48', '+49',
    '+51', '+52', '+53', '+54', '+55', '+56', '+57', '+58', '+60', '+61', '+62', '+63', '+64', '+65', '+66', '+81', '+82', '+84', '+86', '+90',
    '+91', '+92', '+93', '+94', '+95', '+98',
    '+211', '+212', '+213', '+216', '+218', '+220', '+221', '+222', '+223', '+224', '+225', '+226', '+227', '+228', '+229', '+230', '+231', '+232', '+233', '+234',
    '+235', '+236', '+237', '+238', '+239', '+240', '+241', '+242', '+243', '+244', '+245', '+246', '+248', '+249', '+250', '+251', '+252', '+253', '+254', '+255',
    '+256', '+257', '+258', '+260', '+261', '+262', '+263', '+264', '+265', '+266', '+267', '+268', '+269',
    '+290', '+291', '+297', '+298', '+299',
    '+350', '+351', '+352', '+353', '+354', '+355', '+356', '+357', '+358', '+359',
    '+370', '+371', '+372', '+373', '+374', '+375', '+376', '+377', '+378', '+380', '+381', '+382', '+383', '+385', '+386', '+387', '+389', '+420', '+421', '+423',
    '+500', '+501', '+502', '+503', '+504', '+505', '+506', '+507', '+508', '+509',
    '+590', '+591', '+592', '+593', '+594', '+595', '+596', '+597', '+598', '+599',
    '+670', '+672', '+673', '+674', '+675', '+676', '+677', '+678', '+679', '+680', '+681', '+682', '+683', '+685', '+686', '+687', '+688', '+689', '+690', '+691', '+692',
    '+850', '+852', '+853', '+855', '+856', '+880', '+886',
    '+960', '+961', '+962', '+963', '+964', '+965', '+966', '+967', '+968', '+970', '+971', '+972', '+973', '+974', '+975', '+976', '+977', '+992', '+993', '+994', '+995', '+996', '+998',
]

const SafetyFirstModal = ({
    isOpen,
    onClose,
    onSubmit,
    onSupportClick,
    defaultCountryCode = '+971',
}) => {
    const userData = useSelector(userSignUpData)
    const auth = (() => {
        if (typeof window === 'undefined') return null
        try {
            if (getApps().length > 0) return getAuth(getApp())
            return getAuth()
        } catch {
            return getAuth()
        }
    })()
    const [countryCode, setCountryCode] = useState(defaultCountryCode)
    const [phoneNumber, setPhoneNumber] = useState('')
    const [isCountryOpen, setIsCountryOpen] = useState(false)
    const [isVerifyOtpOpen, setIsVerifyOtpOpen] = useState(false)
    const [verificationId, setVerificationId] = useState('')
    const [isSendingOtp, setIsSendingOtp] = useState(false)
    const countryRef = useRef(null)

    const PHONE_IN_USE_MESSAGE =
        'This phone number is still linked to a previous login in our auth system (not your app profile). Sign in with that number once and delete the account, or contact support to release it.'

    const isPhoneAlreadyUsedError = (error) => {
        const code = String(error?.code || '').trim()
        if (code === 'auth/account-exists-with-different-credential' || code === 'auth/credential-already-in-use') {
            return true
        }
        const msg = String(error?.message || '').toLowerCase()
        if (msg.includes('already in use') || msg.includes('already associated')) {
            return true
        }
        // Firebase may omit `code` for account-exists conflicts; require conflict hints in token payload.
        const tokenResp = error?.customData?._tokenResponse || error?._tokenResponse || null
        if (tokenResp?.temporaryProof && tokenResp?.phoneNumber && (tokenResp?.localId || tokenResp?.federatedId)) {
            return true
        }
        return false
    }

    const attachPhoneCredential = async (user, credential) => {
        try {
            await linkWithCredential(user, credential)
        } catch (linkError) {
            const linkCode = String(linkError?.code || '').trim()
            if (linkCode === 'auth/provider-already-linked') {
                await updatePhoneNumber(user, credential)
                return
            }
            throw linkError
        }
    }

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (!countryRef.current?.contains(event.target)) {
                setIsCountryOpen(false)
            }
        }

        document.addEventListener('mousedown', handleOutsideClick)
        return () => document.removeEventListener('mousedown', handleOutsideClick)
    }, [])

    useEffect(() => {
        if (isOpen) return undefined
        const recaptchaContainer = document.getElementById('get-verified-recaptcha-container')
        if (window.getVerifiedRecaptchaVerifier) {
            try {
                window.getVerifiedRecaptchaVerifier.clear()
            } catch {
                // no-op
            }
            window.getVerifiedRecaptchaVerifier = null
        }
        if (recaptchaContainer) recaptchaContainer.innerHTML = ''
        return undefined
    }, [isOpen])

    if (!isOpen) return null

    const isValidPhone = phoneNumber.trim().length >= 7

    const handleSubmit = () => {
        if (!isValidPhone) return
        sendOTP()
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber.trim()}`

    const clearRecaptcha = () => {
        const recaptchaContainer = document.getElementById('get-verified-recaptcha-container')
        // Use a dedicated verifier so login/profile flows do not share a stale instance.
        if (window.getVerifiedRecaptchaVerifier) {
            try {
                window.getVerifiedRecaptchaVerifier.clear()
            } catch {
                // no-op
            }
            window.getVerifiedRecaptchaVerifier = null
        }
        if (recaptchaContainer) recaptchaContainer.innerHTML = ''
    }

    const generateRecaptcha = async () => {
        if (typeof window === 'undefined' || !auth) return null
        const recaptchaContainer = document.getElementById('get-verified-recaptcha-container')
        if (!recaptchaContainer) return null

        if (!window.getVerifiedRecaptchaVerifier) {
            recaptchaContainer.innerHTML = ''
            window.getVerifiedRecaptchaVerifier = new RecaptchaVerifier(auth, 'get-verified-recaptcha-container', {
                size: 'invisible',
                callback: () => {},
                'expired-callback': () => {
                    clearRecaptcha()
                },
            })
            // Invisible reCAPTCHA must render before verifyPhoneNumber; otherwise Firebase
            // often returns auth/invalid-app-credential.
            await window.getVerifiedRecaptchaVerifier.render()
        }
        return window.getVerifiedRecaptchaVerifier
    }

    const sendOTP = async () => {
        try {
            setIsSendingOtp(true)
            if (!auth?.currentUser) {
                toast.error('Please login again to verify phone')
                return
            }
            clearRecaptcha()
            const appVerifier = await generateRecaptcha()
            if (!appVerifier) {
                toast.error('Unable to start phone verification. Please refresh and try again.')
                return
            }
            const provider = new PhoneAuthProvider(auth)
            const vid = await provider.verifyPhoneNumber(fullPhoneNumber, appVerifier)
            setVerificationId(vid)
            setIsVerifyOtpOpen(true)
            onSubmit?.({
                countryCode,
                phoneNumber: phoneNumber.trim(),
                stage: 'otp_sent',
            })
            toast.success('OTP sent successfully')
        } catch (error) {
            console.error('Get verified send OTP error:', error)
            clearRecaptcha()
            if (isPhoneAlreadyUsedError(error)) {
                toast.error(PHONE_IN_USE_MESSAGE)
                return
            }
            const code = String(error?.code || '').trim()
            if (code === 'auth/account-exists-with-different-credential' || code === 'auth/credential-already-in-use') {
                toast.error(PHONE_IN_USE_MESSAGE)
                return
            }
            handleFirebaseAuthError(code)
        } finally {
            setIsSendingOtp(false)
        }
    }

    const verifyOTP = async (otpCode) => {
        try {
            if (!verificationId) {
                toast.error('Send OTP first')
                return false
            }
            if (!auth?.currentUser) {
                toast.error('Please login again to verify phone')
                return false
            }
            const credential = PhoneAuthProvider.credential(verificationId, String(otpCode || '').replace(/\D/g, ''))
            await attachPhoneCredential(auth.currentUser, credential)
            const userId =
                userData?.id ??
                userData?.data?.id ??
                userData?.user?.id ??
                null
            if (userId) {
                const phoneRes = await setUserPhoneNumberApi.setUserPhoneNumber({
                    user_id: userId,
                    phone_number: fullPhoneNumber,
                })
                if (phoneRes?.data?.data) {
                    loadUpdateUserData({ data: phoneRes.data.data })
                }
            }
            onSubmit?.({
                countryCode,
                phoneNumber: phoneNumber.trim(),
                stage: 'otp_verified',
            })
            return true
        } catch (error) {
            console.error('Get verified OTP error:', error)
            if (isPhoneAlreadyUsedError(error)) {
                toast.error(PHONE_IN_USE_MESSAGE)
                return false
            }
            const code = String(error?.code || '').trim()
            if (code === 'auth/requires-recent-login') {
                toast.error('For security reasons, please log in again and retry phone verification.')
                return false
            }
            if (code === 'auth/account-exists-with-different-credential' || code === 'auth/credential-already-in-use') {
                toast.error(PHONE_IN_USE_MESSAGE)
                return false
            }
            handleFirebaseAuthError(code)
            return false
        }
    }

    return (
        <>
            {!isVerifyOtpOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 p-[16px]">
                    <div className="relative max-sm:w-full w-[440px] rounded-[8px] bg-white p-[24px_60px] shadow-[0_12px_28px_rgba(0,0,0,0.24)]">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-[16px] top-[14px] text-[34px] leading-none text-[#8F8F8F]"
                    aria-label="Close safety modal"
                >
                    <CloseIcon className='w-[14px] h-[14px]' stroke='#8f8f8f' fill='#8f8f8f' />
                </button>

                <div className="mx-auto mb-[8px] flex w-full max-w-[160px] justify-center">
                    <Image
                        src={safety}
                        alt="Safety verification"
                        className="h-[130px] w-full object-contain"
                        priority
                    />
                </div>

                <div className='mb-[24px]'>
                    <h2 className="text-center text-[22px] font-[Inter-Bold] text-[#23262A] mb-[14px]">
                        Safety first!
                    </h2>
                    <p className="text-center text-[16px] font-[Inter-Regular] leading-[1.35] text-[#626465]">
                        Verify your phone number and enjoy connecting with more sellers.
                    </p>
                </div>

                <div className="mx-auto mb-[20px] ">
                    <div className="relative z-[5] flex rounded-[6px] border border-[rgba(35,38,42,0.35)] bg-white">
                        <div ref={countryRef} className="relative w-[75px] border-r border-[rgba(35,38,42,0.25)]">
                            <button
                                type="button"
                                onClick={() => setIsCountryOpen((prev) => !prev)}
                                className="flex h-full min-h-[52px] w-full items-center justify-between cursor-pointer pl-[14px] pr-[10px] "
                            >
                                <p className='text-[14px] font-[Inter-Regular] text-[#23262A]'>{countryCode}</p>
                                <DownArrowIcon className='w-[16px] h-[16px]' stroke="#23262A" />
                            </button>

                            {isCountryOpen && (
                                <div className="absolute left-0 top-[calc(100%+6px)] z-[99999] max-h-[220px] w-[104px] overflow-y-auto rounded-b-[14px] rounded-t-[6px] bg-white shadow-[0_6px_18px_rgba(0,0,0,0.2)]">
                                    {COUNTRY_CODES.map((code) => (
                                        <button
                                            key={code}
                                            type="button"
                                            onClick={() => {
                                                setCountryCode(code)
                                                setIsCountryOpen(false)
                                            }}
                                            className={`cursor-pointer block w-full px-[16px] py-[9px] text-left text-[14px] ${countryCode === code ? 'font-[Inter-Bold] text-[#23262A]' : 'font-[Inter-Regular] text-[#23262A]'}`}
                                        >
                                            {code}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="50 123 4567"
                            className="min-w-0 flex-1 px-[16px] py-[16px] text-[14px] font-[Inter-Regular] text-[#23262A] placeholder:text-[#8f8f8f] outline-none"
                        />
                    </div>
                </div>

                <div className='mb-[50px]'>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!isValidPhone || isSendingOtp}
                        className="cursor-pointer mx-auto block rounded-[8px] px-[18px] py-[10px] text-[14px] font-[Inter-SemiBold] transition-colors disabled:cursor-not-allowed disabled:bg-[#0000001f] disabled:text-[#00000042] bg-[#DC0000] text-white"
                    >
                        {isSendingOtp ? (
                            <span className="inline-flex items-center gap-[8px]">
                                <span className="h-[14px] w-[14px] rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                Sending...
                            </span>
                        ) : (
                            'Send Verification Code'
                        )}
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => onSupportClick?.()}
                    className="mx-auto block text-[14px] font-[Inter-Bold] text-[#3a88ef]"
                >
                    Contact Customer Support.
                </button>
                    </div>
                </div>
            )}
            {/* Keep reCAPTCHA in the DOM (do not use display:none) — hidden containers cause invalid-app-credential */}
            <div
                id="get-verified-recaptcha-container"
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    left: '-9999px',
                    top: 0,
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden',
                    opacity: 0,
                    pointerEvents: 'none',
                }}
            />
            <VerifyOTPModal
                isOpen={isVerifyOtpOpen}
                phoneNumber={fullPhoneNumber}
                onBack={() => setIsVerifyOtpOpen(false)}
                onClose={() => {
                    setIsVerifyOtpOpen(false)
                    clearRecaptcha()
                    onClose?.()
                }}
                onVerify={verifyOTP}
                onResendCode={sendOTP}
                onSupportClick={onSupportClick}
            />
        </>
    )
}

export default SafetyFirstModal
