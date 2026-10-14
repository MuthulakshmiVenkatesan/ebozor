'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import { EditIcon, DeleteIcon } from '@/components/CustomFile/icons'
import { getApp, getApps } from 'firebase/app'
import { getAuth, isSignInWithEmailLink, onAuthStateChanged, reload, signInWithEmailLink } from 'firebase/auth'
import DeactivateModal from '../components/DeactivateModal'
import LogoutModal from '../components/LogoutModal'
import SecureModal from '../components/SecureModal'
import UpdatePassword from '../components/UpdatePassword'
import desktop from '../../../../../public/assets/img/icons/desktop.svg'
import ChangePassword from '../components/ChangePassword'
import { logoutDeviceApi } from '@/utils/api'

const PASSWORD_EMAIL_VERIFY_PENDING_KEY = 'password_email_verify_pending'
const PASSWORD_EMAIL_VERIFY_TOKEN_KEY = 'password_email_verify_token'
const PASSWORD_EMAIL_VERIFY_EMAIL_KEY = 'password_email_verify_email'

const SkeletonBlock = ({ className = '' }) => (
    <div className={`animate-pulse rounded-md bg-[#e8eaec] ${className}`} aria-hidden />
)

function LabeledReadonlyField({ label, value, rightAction = null, masked = false }) {
    return (
        <div className="relative">
            <label className="mb-[20px] pointer-events-none font-[Inter-Medium] text-[20px] leading-[1.2] text-[#3a3f47] block">
                {label}
            </label>
            <div className="flex h-[56px] items-center justify-between rounded-[8px] border border-[rgba(143,143,143,0.55)] bg-white px-[14px]">
                <p className={`text-[14px] leading-none text-[#666] ${masked ? 'tracking-[2px]' : ''}`}>{value}</p>
                {rightAction}
            </div>
        </div>
    )
}

export default function Security({
    userDetail,
    userDetailLoading = false,
    devices = [],
    devicesLoading = false,
    onRemoveDevice = null,
}) {
    const [deactivateOpen, setDeactivateOpen] = useState(false)
    const [logoutOpen, setLogoutOpen] = useState(false)
    const [logoutDeviceId, setLogoutDeviceId] = useState(null)
    const [logoutLoading, setLogoutLoading] = useState(false)
    const [localDevices, setLocalDevices] = useState([])
    const [secureOpen, setSecureOpen] = useState(false)
    const [updatePasswordOpen, setUpdatePasswordOpen] = useState(false)
    const [changePasswordOpen, setChangePasswordOpen] = useState(false)

    const emailDisplay = useMemo(
        () => String(userDetail?.email || '').trim(),
        [userDetail?.email]
    )
    const phoneDisplay = useMemo(
        () => String(userDetail?.mobile || '').trim(),
        [userDetail?.mobile]
    )
    const auth = useMemo(() => {
        if (typeof window === 'undefined') return null
        try {
            if (getApps().length > 0) return getAuth(getApp())
            return getAuth()
        } catch {
            return getAuth()
        }
    }, [])

    useEffect(() => {
        setLocalDevices(Array.isArray(devices) ? devices : [])
    }, [devices])

    useEffect(() => {
        if (!auth || typeof window === 'undefined') return
        const isPending = window.localStorage.getItem(PASSWORD_EMAIL_VERIFY_PENDING_KEY) === '1'
        if (!isPending) return
        const expectedToken = window.localStorage.getItem(PASSWORD_EMAIL_VERIFY_TOKEN_KEY) || ''
        const pendingEmail = window.localStorage.getItem(PASSWORD_EMAIL_VERIFY_EMAIL_KEY) || ''
        const currentUrl = new URL(window.location.href)
        const oobCode = currentUrl.searchParams.get('oobCode') || ''
        const mode = currentUrl.searchParams.get('mode') || ''
        const emailVerifiedIntent = currentUrl.searchParams.get('emailverified') === '1'
        const returnedToken = currentUrl.searchParams.get('pwd_flow_token') || ''
        const isValidResumeIntent = emailVerifiedIntent && expectedToken && returnedToken && expectedToken === returnedToken && pendingEmail
        if (!isValidResumeIntent || mode !== 'signIn' || !oobCode) return

        let disposed = false
        let retryCount = 0
        let retryTimerId = null
        let signInAttempted = false

        const checkEmailSignIn = async () => {
            try {
                if (!signInAttempted && isSignInWithEmailLink(auth, window.location.href)) {
                    signInAttempted = true
                    await signInWithEmailLink(auth, pendingEmail, window.location.href)
                }
                if (!auth.currentUser) {
                    if (retryCount < 20 && !disposed) {
                        retryCount += 1
                        retryTimerId = window.setTimeout(checkEmailSignIn, 500)
                    }
                    return
                }
                await reload(auth.currentUser)
                if (disposed) return
                const sameEmail = String(auth.currentUser.email || '').trim().toLowerCase() === String(pendingEmail).trim().toLowerCase()
                if (!sameEmail) return

                window.localStorage.removeItem(PASSWORD_EMAIL_VERIFY_PENDING_KEY)
                window.localStorage.removeItem(PASSWORD_EMAIL_VERIFY_TOKEN_KEY)
                window.localStorage.removeItem(PASSWORD_EMAIL_VERIFY_EMAIL_KEY)
                currentUrl.searchParams.delete('emailverified')
                currentUrl.searchParams.delete('pwd_flow_token')
                currentUrl.searchParams.delete('apiKey')
                currentUrl.searchParams.delete('mode')
                currentUrl.searchParams.delete('lang')
                currentUrl.searchParams.delete('oobCode')
                window.history.replaceState({}, '', currentUrl.toString())
                setUpdatePasswordOpen(false)
                setChangePasswordOpen(true)
            } catch (error) {
                console.error('Failed to verify email sign-in link:', error)
            }
        }

        const unsubscribe = onAuthStateChanged(auth, () => {
            if (disposed) return
            checkEmailSignIn()
        })
        checkEmailSignIn()
        return () => {
            disposed = true
            if (retryTimerId) {
                window.clearTimeout(retryTimerId)
            }
            unsubscribe()
        }
    }, [auth])

    return (
        <div className="w-full">
            <div className="mb-[24px] border-b border-[rgba(143,143,143,0.35)] pb-[20px]">
                <h2 className="text-[22px] font-[Inter-Bold] leading-none text-[#23262A] mb-[4px]">Security</h2>
            </div>


            <div className="mb-[28px] flex flex-col gap-[26px] border-b border-[rgba(143,143,143,0.35)] pb-[30px]">
                <div className=" ">
                    <LabeledReadonlyField label="Email" value={emailDisplay || '—'} />
                </div>

                <div className="">
                    <LabeledReadonlyField
                        label="Password"
                        value="......."
                        masked
                        rightAction={
                            <button
                                type="button"
                                onClick={() => setUpdatePasswordOpen(true)}
                                className="flex h-[24px] w-[24px] cursor-pointer items-center justify-center"
                                aria-label="Edit password"
                            >
                                <EditIcon className="w-[20px] h-[20px]" fill="#6B7280" />
                            </button>
                        }
                    />
                </div>

                <div className="px-[14px]">
                    <button
                        type="button"
                        onClick={() => setDeactivateOpen(true)}
                        className="flex cursor-pointer items-center gap-[10px]"
                    >
                        <DeleteIcon className="w-[16px] h-[16px]" fill="#23262A" />
                        <p className="text-[14px] font-[Inter-Medium] leading-[1.2] text-[#23262A]">Deactivate Your Account</p>
                    </button>
                </div>
            </div>


            <div className="">
                <div className="mb-[26px] flex-wrap flex items-center justify-between gap-[12px]">
                    <div>
                        <h3 className="text-[14px] font-[Inter-SemiBold] leading-none text-[#23262A] mb-[16px]">Your devices</h3>
                        <p className="text-[14px] leading-none text-[#23262A]">If you don’t recognize any devices below</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSecureOpen(true)}
                        // onClick={() => setChangePasswordOpen(true)}
                        className="shrink-0 cursor-pointer rounded-[6px] border border-[rgba(143,143,143,0.55)] bg-white p-[8px_14px] text-[12px] leading-none text-[#23262A] font-[Inter-Medium]"
                    >
                        Secure your account
                    </button>
                </div>


                <div className="pr-[20px] max-h-[500px] overflow-y-auto pb-[20px] rtl:pr-0 rtl:pl-[20px]">
                    <div className="flex flex-col gap-[24px]">
                        {devicesLoading ? (
                            <>
                                {[0, 1, 2].map((row) => (
                                    <div key={`device-skeleton-${row}`} className="flex items-start justify-between gap-[14px]">
                                        <div className="min-w-0 flex items-start gap-[14px] max-sm:flex-wrap">
                                            <SkeletonBlock className="h-[22px] w-[22px] rounded-full" />
                                            <div className="flex flex-col gap-[14px]">
                                                <SkeletonBlock className="h-[14px] w-[240px] max-w-[70vw]" />
                                                <SkeletonBlock className="h-[12px] w-[140px]" />
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <SkeletonBlock className="h-[12px] w-[130px]" />
                                            <SkeletonBlock className="mt-[8px] h-[12px] w-[55px] ml-auto" />
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            localDevices.map((device) => (
                                <div key={device.id} className="flex items-start justify-between gap-[14px]">
                                    <div className="min-w-0 flex items-start gap-[14px] max-sm:flex-wrap">
                                        <div className="flex items-center gap-[10px]">
                                            <Image src={desktop} alt="desktop" width={22} height={22} className="w-[22px] h-[22px]" />
                                        </div>
                                        <div className="flex flex-col gap-[14px]">
                                            <h4 className="truncate text-[14px] font-[Inter-Regular] leading-none text-[#23262A]">{device.title}</h4>
                                            <p className="text-[12px] leading-none text-[#9CA3AF]">{device.country}</p>
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-[12px] font-[Inter-Regular] leading-none text-[#a3a6aa]">{device.date}</p>
                                        {!device.current ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setLogoutDeviceId(device.id)
                                                    setLogoutOpen(true)
                                                }}
                                                className="mt-[8px] cursor-pointer text-[12px] font-[Inter-Medium] leading-none text-[#23262A]"
                                            >
                                                Log out
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <DeactivateModal
                open={deactivateOpen}
                onClose={() => setDeactivateOpen(false)}
                onConfirm={() => {
                    // TODO: call API to deactivate account
                }}
            />

            <LogoutModal
                open={logoutOpen}
                onClose={() => {
                    if (logoutLoading) return
                    setLogoutOpen(false)
                    setLogoutDeviceId(null)
                }}
                onConfirm={async () => {
                    if (logoutDeviceId == null || logoutLoading) return
                    try {
                        setLogoutLoading(true)
                        await logoutDeviceApi.logoutDevice({ device_id: logoutDeviceId })
                        setLocalDevices((prev) => prev.filter((d) => d.id !== logoutDeviceId))
                        if (typeof onRemoveDevice === 'function') onRemoveDevice(logoutDeviceId)
                        setLogoutOpen(false)
                        setLogoutDeviceId(null)
                    } catch (error) {
                        console.error('logout-device error:', error)
                    } finally {
                        setLogoutLoading(false)
                    }
                }}
            />

            <SecureModal
                open={secureOpen}
                onClose={() => setSecureOpen(false)}
                onUpdatePassword={() => setUpdatePasswordOpen(true)}
            />

            <UpdatePassword
                open={updatePasswordOpen}
                onClose={() => setUpdatePasswordOpen(false)}
                accountType={userDetail?.type}
                phoneDisplay={phoneDisplay}
                emailDisplay={emailDisplay}
                onOtpVerified={() => {
                    setUpdatePasswordOpen(false)
                    setChangePasswordOpen(true)
                }}
            />

            <ChangePassword
                open={changePasswordOpen}
                onClose={() => {
                    setChangePasswordOpen(false)
                }}
                accountType={userDetail?.type}
                email={emailDisplay}
                phone={phoneDisplay}
                onSubmit={(payload) => {
                    // TODO: call API to change password if needed (payload includes accountType + phone or email)
                }}
            />
        </div>
    )
}
