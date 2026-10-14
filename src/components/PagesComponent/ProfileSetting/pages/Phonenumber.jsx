'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { EditIcon, CloseIcon, PlusIcon, DownArrowIcon } from '@/components/CustomFile/icons'
import { PhoneAuthProvider, RecaptchaVerifier, linkWithCredential } from 'firebase/auth'
import toast from 'react-hot-toast'
import { handleFirebaseAuthError, t } from '@/utils'
import FirebaseData from '@/utils/Firebase'
import { userSignUpData } from '@/redux/reuducer/authSlice'
import { setUserPhoneNumberApi } from '@/utils/api'
import PhoneOTPModal from '../components/PhoneOTPModal'

const COUNTRY_CODE_OPTIONS = [
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

const SkeletonBlock = ({ className = '' }) => (
    <div className={`animate-pulse rounded-md bg-[#e8eaec] ${className}`} aria-hidden />
)

function normalizePhoneInput(value) {
    const digits = String(value || '').replace(/\D/g, '')
    return digits
}

function CountryCodeDropdown({ value, onChange }) {
    const [open, setOpen] = useState(false)
    const rootRef = useRef(null)

    useEffect(() => {
        if (!open) return
        const handleOutside = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleOutside)
        return () => document.removeEventListener('mousedown', handleOutside)
    }, [open])

    return (
        <div ref={rootRef} className="relative pl-[10px] pr-[6px]">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex cursor-pointer items-center gap-[6px] border-0 bg-transparent text-[14px] font-[Inter-Regular] leading-none text-[#23262A] outline-none"
                aria-label="Country code"
            >
                <p className='text-[14px] font-[Inter-Regular] leading-none text-[#23262A]'>{value}</p>
                <DownArrowIcon className="w-[14px] h-[14px]" stroke="#23262A" />
            </button>
            {open ? (
                <div className="absolute left-0 top-[calc(100%+8px)] z-20 max-h-[230px] min-w-[108px] overflow-y-auto rounded-[14px] bg-white py-[8px] shadow-[0_8px_24px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.08)]">
                    {COUNTRY_CODE_OPTIONS.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => {
                                onChange(option)
                                setOpen(false)
                            }}
                            className={`w-full cursor-pointer px-[18px] py-[10px] text-left text-[14px] leading-[1] text-[#23262A] hover:bg-[#f5f5f5] ${value === option ? 'font-[Inter-SemiBold]' : 'font-[Inter-Regular]'}`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

function PhoneField({ id, label, value, onChange, placeholder, countryCode, onCountryCodeChange }) {
    return (
        <div className="relative mt-[30px]">
            <label
                htmlFor={id}
                className="pointer-events-none absolute left-[12px] top-0 z-[2] -translate-y-1/2 font-[Inter-Regular] px-[6px] text-[12px] bg-[#f7f7f8] leading-[1.2] text-[#23262A]"
            >
                {label}
            </label>
            <div className="flex h-[56px] items-center rounded-[8px] border border-[rgba(143,143,143,0.45)] bg-transparent">
                <CountryCodeDropdown value={countryCode} onChange={onCountryCodeChange} />
                <input
                    id={id}
                    type="tel"
                    inputMode="numeric"
                    value={value}
                    onChange={(e) => onChange(normalizePhoneInput(e.target.value))}
                    placeholder={placeholder}
                    className="h-full w-full border-0 bg-transparent px-[2px] text-[14px] leading-none text-[#23262A] outline-none placeholder:text-[#8f8f8f]"
                />
            </div>
        </div>
    )
}

export default function Phonenumber({ userDetail, userDetailLoading = false }) {
    const { authentication: auth } = FirebaseData()
    const userData = useSelector(userSignUpData)
    const [isPrimaryEditing, setIsPrimaryEditing] = useState(false)
    const [isAdditionalEditing, setIsAdditionalEditing] = useState(false)
    const [primaryCountryCode, setPrimaryCountryCode] = useState('+971')
    const [primaryPhone, setPrimaryPhone] = useState('')
    const [additionalCountryCode, setAdditionalCountryCode] = useState('+971')
    const [additionalPhone, setAdditionalPhone] = useState('')
    const [isPhoneOTPModalOpen, setIsPhoneOTPModalOpen] = useState(false)
    const [otpCode, setOtpCode] = useState('')
    const [secondsLeft, setSecondsLeft] = useState(0)
    const [verificationId, setVerificationId] = useState('')
    const [showLoader, setShowLoader] = useState(false)
    const [resendOtpLoader, setResendOtpLoader] = useState(false)
    const [isPrimaryVerified, setIsPrimaryVerified] = useState(false)
    const canUpdatePrimary = useMemo(() => primaryPhone.length >= 9, [primaryPhone])
    const canAddAdditional = useMemo(() => additionalPhone.length >= 9, [additionalPhone])

    const countryCodeDigitsOnly = primaryCountryCode.replace(/\D/g, '')
    const startsWithCountryCode = primaryPhone.startsWith(countryCodeDigitsOnly)
    const formattedNumber = startsWithCountryCode ? primaryPhone.substring(countryCodeDigitsOnly.length) : primaryPhone
    const primaryDisplay = `${primaryCountryCode}${primaryPhone}`
    const otpPhoneDisplay = `${primaryCountryCode}${formattedNumber}`
    const canShowVerifiedUI = isPrimaryVerified && primaryPhone.trim() !== ''

    useEffect(() => {
        if (userDetailLoading) return
        const mobile = String(userDetail?.mobile || '').trim()
        const mobileVerify = Number(userDetail?.mobile_verify) === 1
        if (!mobile || !mobileVerify) return

        const normalized = mobile.replace(/\s+/g, '')
        const optionsByLength = [...COUNTRY_CODE_OPTIONS].sort((a, b) => b.length - a.length)
        let resolvedCode = '+971'
        let resolvedNumber = normalized

        const plusMatch = optionsByLength.find((code) => normalized.startsWith(code))
        if (plusMatch) {
            resolvedCode = plusMatch
            resolvedNumber = normalized.slice(plusMatch.length)
        } else {
            const digitsOnly = normalized.replace(/\D/g, '')
            const digitMatch = optionsByLength.find((code) => digitsOnly.startsWith(code.replace(/\D/g, '')))
            if (digitMatch) {
                resolvedCode = digitMatch
                resolvedNumber = digitsOnly.slice(digitMatch.replace(/\D/g, '').length)
            } else {
                resolvedNumber = digitsOnly
            }
        }

        setPrimaryCountryCode(resolvedCode)
        setPrimaryPhone(resolvedNumber.replace(/\D/g, ''))
        setIsPrimaryVerified(true)
    }, [userDetail?.mobile, userDetail?.mobile_verify, userDetailLoading])

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

    const prepareRecaptcha = async () => {
        if (typeof window === 'undefined' || !auth) return null
        clearRecaptcha()
        const recaptchaContainer = document.getElementById('recaptcha-container')
        if (!recaptchaContainer) {
            console.error("Container element 'recaptcha-container' not found.")
            return null
        }
        try {
            recaptchaContainer.innerHTML = ''
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
            })
            await window.recaptchaVerifier.render()
            return window.recaptchaVerifier
        } catch (error) {
            console.error('Error initializing RecaptchaVerifier:', error?.message)
            clearRecaptcha()
            return null
        }
    }

    const showFirebaseError = (error) => {
        const code = String(error?.code || '').trim()
        if (code) {
            handleFirebaseAuthError(code)
            return
        }
        const message = String(error?.message || '').trim()
        if (message) {
            toast.error(message)
            return
        }
        toast.error(t('errorOccurred'))
    }

    const sendOTP = async () => {
        if (!canUpdatePrimary) return
        const phoneNumber = `${primaryCountryCode}${formattedNumber}`
        try {
            setShowLoader(true)
            const appVerifier = await prepareRecaptcha()
            if (!appVerifier) {
                toast.error(t('somethingWentWrong'))
                return
            }
            if (!auth?.currentUser) {
                toast.error(t('userNotFound'))
                return
            }
            const provider = new PhoneAuthProvider(auth)
            const vid = await provider.verifyPhoneNumber(phoneNumber, appVerifier)
            setVerificationId(vid)
            setIsPhoneOTPModalOpen(true)
            setSecondsLeft(60)
            setOtpCode('')
            toast.success(t('otpSentSuccess'))
        } catch (error) {
            clearRecaptcha()
            showFirebaseError(error)
        } finally {
            setShowLoader(false)
        }
    }

    const resendOtp = async () => {
        if (secondsLeft > 0 || !canUpdatePrimary) return
        const phoneNumber = `${primaryCountryCode}${formattedNumber}`
        try {
            setResendOtpLoader(true)
            const appVerifier = await prepareRecaptcha()
            if (!appVerifier) {
                toast.error(t('somethingWentWrong'))
                return
            }
            if (!auth?.currentUser) {
                toast.error(t('userNotFound'))
                return
            }
            const provider = new PhoneAuthProvider(auth)
            const vid = await provider.verifyPhoneNumber(phoneNumber, appVerifier)
            setVerificationId(vid)
            setSecondsLeft(60)
            setOtpCode('')
            toast.success(t('otpSentSuccess'))
        } catch (error) {
            clearRecaptcha()
            showFirebaseError(error)
        } finally {
            setResendOtpLoader(false)
        }
    }

    const verifyOTP = async () => {
        if (!verificationId) {
            toast.error(t('otpmissing'))
            return
        }
        if (!otpCode) {
            toast.error(t('otpmissing'))
            return
        }
        try {
            setShowLoader(true)
            if (!auth?.currentUser) {
                toast.error(t('userNotFound'))
                return
            }
            const credential = PhoneAuthProvider.credential(verificationId, otpCode.replace(/\D/g, ''))
            await linkWithCredential(auth.currentUser, credential)
            const userId =
                userData?.id ??
                userData?.data?.id ??
                userData?.user?.id ??
                null
            const fullPhoneNumber = `${primaryCountryCode}${formattedNumber}`
            if (userId) {
                await setUserPhoneNumberApi.setUserPhoneNumber({
                    user_id: userId,
                    phone_number: fullPhoneNumber,
                })
            }
            toast.success('OTP verified successfully')
            setIsPrimaryVerified(true)
            setIsPhoneOTPModalOpen(false)
            setIsPrimaryEditing(false)
            setOtpCode('')
            setVerificationId('')
        } catch (error) {
            showFirebaseError(error)
        } finally {
            setShowLoader(false)
        }
    }

    useEffect(() => {
        return () => {
            clearRecaptcha()
        }
    }, [])

    const handleOtpModalClose = () => {
        setIsPhoneOTPModalOpen(false)
        setOtpCode('')
        setSecondsLeft(0)
        setVerificationId('')
        clearRecaptcha()
    }

    useEffect(() => {
        if (!isPhoneOTPModalOpen || secondsLeft <= 0) return
        const id = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
        return () => window.clearTimeout(id)
    }, [isPhoneOTPModalOpen, secondsLeft])

    return (
        <div className="w-full">
            <div className="mb-[28px]">
                <h2 className="mb-[4px] text-[22px] font-[Inter-Bold] leading-none text-[#23262A]">Phone numbers</h2>
                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                    To ensure safety, it is beneficial to have your number added. You will receive an SMS with the authentication code on your phone to be able to link your phone with your account.
                </p>
            </div>

            <div className={`mb-[34px] rounded-[8px] border p-[16px] ${isPrimaryEditing ? 'border-[#f7f7f8] bg-[#f7f7f8]' : 'border-[#00000014] bg-[#fff]'}`}>
                <div className="flex items-center justify-between gap-[12px]">
                    <div className="flex min-w-0 items-center gap-[60px]">
                        <h4 className="text-[16px] font-[Inter-Regular] leading-none text-[#23262A]">Primary phone</h4>
                        {!isPrimaryEditing ? (
                            userDetailLoading ? (
                                <SkeletonBlock className="h-[16px] w-[180px]" />
                            ) : (
                                <p className="truncate text-[16px] font-[Inter-Regular] leading-none text-[#23262A]">{primaryDisplay}</p>
                            )
                        ) : null}
                    </div>
                    <button
                        type="button"
                        aria-label={isPrimaryEditing ? 'Close primary phone edit' : 'Edit primary phone'}
                        onClick={() => setIsPrimaryEditing((v) => !v)}
                        className="flex h-[24px] w-[24px] cursor-pointer items-center justify-center"
                    >
                        {isPrimaryEditing ? (
                            <CloseIcon className="w-[12px] h-[12px]" fill="#8f8f8f" />
                        ) : canShowVerifiedUI ? (
                            <EditIcon className="w-[16px] h-[16px]" fill="#8f8f8f" />
                        ) : (
                            <PlusIcon className="w-[20px] h-[20px]" fill="#8f8f8f" />
                        )}
                    </button>
                </div>
                {isPrimaryEditing ? (
                    <>
                        <PhoneField
                            id="primary-phone"
                            label="Phone"
                            value={primaryPhone}
                            onChange={setPrimaryPhone}
                            placeholder="5XXXXXXXX"
                            countryCode={primaryCountryCode}
                            onCountryCodeChange={setPrimaryCountryCode}
                        />
                        <div className="mt-[12px] flex justify-end">
                            <button
                                type="button"
                                disabled={!canUpdatePrimary || showLoader}
                                className={`rounded-[6px] p-[8px_16px] text-[12px] font-[Inter-SemiBold] ${
                                    canUpdatePrimary && !showLoader
                                        ? 'cursor-pointer bg-[#23262A] text-white'
                                        : 'cursor-not-allowed bg-[#0000001f] text-[#8f8f8f]'
                                }`}

                                onClick={sendOTP}
                            >
                                {showLoader ? 'Please wait...' : canShowVerifiedUI ? 'Update Number' : 'Add Number'}
                            </button>
                        </div>
                    </>
                ) : null}
            </div>

            {/* <div className="mb-[28px]">
                <h3 className="mb-[8px] text-[18px] font-[Inter-SemiBold] leading-[1.05] text-[#23262A]">Additional numbers</h3>
                <p className="text-[14px] font-[Inter-Regular] leading-[1.5] text-[#23262A]">
                    Multiple numbers facilitates you to use different numbers interchangeably while posting ad
                </p>
            </div>

            <div className={`mb-[34px] rounded-[8px] border p-[16px] ${isAdditionalEditing ? 'border-[#f7f7f8] bg-[#f7f7f8]' : 'border-[#00000014] bg-[#fff]'}`}>
                <div className="flex items-center justify-between gap-[12px]">
                    <h4 className="text-[16px] font-[Inter-Regular] leading-none text-[#23262A]">Additional phone 1</h4>
                    <button
                        type="button"
                        aria-label={isAdditionalEditing ? 'Close additional phone edit' : 'Add additional phone'}
                        onClick={() => setIsAdditionalEditing((v) => !v)}
                        className="flex h-[24px] w-[24px] cursor-pointer items-center justify-center text-[#6B7280]"
                    >
                        {isAdditionalEditing ? <CloseIcon className="w-[12px] h-[12px]" fill="#8f8f8f" /> : <PlusIcon className="w-[20px] h-[20px]" fill="#8f8f8f" />}
                    </button>
                </div>
                {isAdditionalEditing ? (
                    <>
                        <PhoneField
                            id="additional-phone-1"
                            label="Phone 1"
                            value={additionalPhone}
                            onChange={setAdditionalPhone}
                            placeholder="5XXXXXXXX"
                            countryCode={additionalCountryCode}
                            onCountryCodeChange={setAdditionalCountryCode}
                        />
                        <div className="mt-[12px] flex justify-end">
                            <button
                                type="button"
                                disabled={!canAddAdditional}
                                className={`rounded-[6px] p-[8px_16px] text-[12px] font-[Inter-SemiBold] ${
                                    canAddAdditional ? 'cursor-pointer bg-[#23262A] text-white' : 'cursor-not-allowed bg-[#0000001f] text-[#8f8f8f]'
                                }`}
                            >
                                Add Number
                            </button>
                        </div>
                    </>
                ) : null}
            </div> */}

            <PhoneOTPModal
                open={isPhoneOTPModalOpen}
                onClose={handleOtpModalClose}
                phoneDisplay={otpPhoneDisplay}
                otpCode={otpCode}
                onOtpChange={setOtpCode}
                secondsLeft={secondsLeft}
                canResend={secondsLeft === 0 && !resendOtpLoader}
                onResend={resendOtp}
                onVerify={verifyOTP}
                showLoader={showLoader}
                resendOtpLoader={resendOtpLoader}
            />
        </div>
    )
}
