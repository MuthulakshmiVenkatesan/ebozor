'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { CloseIcon, EyeIcon, EyeSlashIcon } from '@/components/CustomFile/icons'
import Tick from '../../../../../public/assets/img/icons/tick.svg'
import SuccessModal from './SuccessModal'
import { getApp } from 'firebase/app'
import { getAuth, updatePassword } from 'firebase/auth'
import toast from 'react-hot-toast'
import { handleFirebaseAuthError, t } from '@/utils'

function getPasswordChecks(newPassword, confirmPassword, userName) {
    const trimmedName = (userName || '').trim()
    const pwd = newPassword || ''
    const confirm = confirmPassword || ''

    return {
        match: pwd.length > 0 && confirm.length > 0 && pwd === confirm,
        length: pwd.length >= 7,
        upperLower: /[a-z]/.test(pwd) && /[A-Z]/.test(pwd),
        number: /\d/.test(pwd),
        special: /[^A-Za-z0-9]/.test(pwd),
        noName: trimmedName.length === 0 ? true : !pwd.toLowerCase().includes(trimmedName.toLowerCase()),
    }
}

function strengthFromChecks(checks) {
    const { length, upperLower, number, special, noName } = checks
    const rules = [length, upperLower, number, special, noName]
    const met = rules.filter(Boolean).length
    if (met <= 1) return { label: 'Weak', widthPct: 22, barClass: 'bg-[#DC0000]', textClass: 'text-[#DC0000]' }
    if (met === 2) return { label: 'Weak', widthPct: 35, barClass: 'bg-[#DC0000]', textClass: 'text-[#DC0000]' }
    if (met === 3) return { label: 'Medium', widthPct: 55, barClass: 'bg-[#F59E0B]', textClass: 'text-[#D97706]' }
    if (met === 4) return { label: 'Medium', widthPct: 75, barClass: 'bg-[#F59E0B]', textClass: 'text-[#D97706]' }
    return { label: 'Strong', widthPct: 100, barClass: 'bg-[#22C55E]', textClass: 'text-[#16A34A]' }
}

export default function ChangePassword({
    open,
    onClose,
    onSubmit,
    userName = '',
    accountType = '',
    email = '',
    phone = '',
}) {
    const showPasswordUpdateError = useCallback((error) => {
        const code = String(error?.code || '').trim()
        if (code.startsWith('auth/')) {
            handleFirebaseAuthError(code)
            return
        }
        const message = String(error?.message || '').trim()
        if (message) {
            toast.error(message)
            return
        }
        toast.error(t('errorOccurred'))
    }, [])

    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const checks = useMemo(
        () => getPasswordChecks(newPassword, confirmPassword, userName),
        [newPassword, confirmPassword, userName]
    )

    const strength = useMemo(() => strengthFromChecks(checks), [checks])

    const allValid = checks.match && checks.length && checks.upperLower && checks.number && checks.special && checks.noName

    const auth = useMemo(() => {
        try {
            return getAuth(getApp())
        } catch {
            return getAuth()
        }
    }, [])

    const checklist = useMemo(
        () => [
            { key: 'match', label: 'The two password fields must match', pass: checks.match },
            { key: 'length', label: 'At least 7 characters long', pass: checks.length },
            { key: 'upperLower', label: 'One upper and one lower case letter', pass: checks.upperLower },
            { key: 'number', label: 'Must contain a number', pass: checks.number },
            { key: 'special', label: 'At least one special character', pass: checks.special },
            { key: 'noName', label: 'Must not include your name', pass: checks.noName },
        ],
        [checks]
    )

    const handleClose = useCallback(() => {
        setNewPassword('')
        setConfirmPassword('')
        setShowNew(false)
        setShowConfirm(false)
        setShowSuccessModal(false)
        setIsSubmitting(false)
        onClose?.()
    }, [onClose])

    const handleSuccessClose = useCallback(() => {
        setNewPassword('')
        setConfirmPassword('')
        setShowNew(false)
        setShowConfirm(false)
        setShowSuccessModal(false)
        setIsSubmitting(false)
        onClose?.()
    }, [onClose])

    useEffect(() => {
        if (!open) {
            setNewPassword('')
            setConfirmPassword('')
            setShowNew(false)
            setShowConfirm(false)
            setShowSuccessModal(false)
            setIsSubmitting(false)
        }
    }, [open])

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
            if (e.key !== 'Escape') return
            if (showSuccessModal) handleSuccessClose()
            else handleClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, showSuccessModal, handleClose, handleSuccessClose])

    if (!open) return null

    return (
        <>
            {!showSuccessModal ? (
            <div
                className="fixed inset-0 z-[270] flex items-center justify-center bg-black/45 p-[16px]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="change-password-title"
            >
                <div
                    className="absolute inset-0 cursor-default"
                    aria-hidden
                    onClick={handleClose}
                />
                <div
                    className="relative z-[1] flex max-h-[min(90vh,720px)] w-[440px] max-sm:w-full flex-col overflow-hidden rounded-[6px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex shrink-0 items-center justify-end px-[16px] pb-[4px] pt-[12px]">
                        <button type="button" onClick={handleClose} className="cursor-pointer p-[6px]" aria-label="Close">
                            <CloseIcon className="h-[12px] w-[12px]" fill="#9CA3AF" fillOpacity="1" />
                        </button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-[60px] pb-[24px]">
                        <h2 id="change-password-title" className="mb-[34px] text-center text-[22px] font-[Inter-Bold] leading-tight text-[#23262A]">
                            Change Password
                        </h2>

                        <div className="mb-[14px]">
                            <div className="relative">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="h-[52px] w-full rounded-[8px] border border-[rgba(143,143,143,0.55)] px-[14px] pr-[44px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#9CA3AF] focus:border-[#23262A]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew((v) => !v)}
                                    className="absolute right-[12px] top-1/2 -translate-y-1/2 cursor-pointer p-[4px] text-[#23262A]"
                                    aria-label={showNew ? 'Hide password' : 'Show password'}
                                >
                                    {showNew ? <EyeIcon className="h-[20px] w-[20px]" fill="#9CA3AF" fillOpacity="1" /> : <EyeSlashIcon className="h-[20px] w-[20px]" fill="#9CA3AF" fillOpacity="1" />}
                                </button>
                            </div>
                        </div>

                        <div className="mb-[16px]">
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="Confirm New Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="h-[52px] w-full rounded-[8px] border border-[rgba(143,143,143,0.55)] px-[14px] pr-[44px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#9CA3AF] focus:border-[#23262A]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((v) => !v)}
                                    className="absolute right-[12px] top-1/2 -translate-y-1/2 cursor-pointer p-[4px] text-[#23262A]"
                                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirm ? <EyeIcon className="h-[20px] w-[20px]" fill="#9CA3AF" fillOpacity="1" /> : <EyeSlashIcon className="h-[20px] w-[20px]" fill="#9CA3AF" fillOpacity="1" />}
                                </button>
                            </div>
                        </div>

                        {newPassword.length > 0 ? (
                            <div>
                                <div className="mb-[8px] h-[4px] w-full overflow-hidden rounded-full bg-[#FEE2E2]">
                                    <div
                                        className={`h-full rounded-full transition-all duration-200 ${strength.barClass}`}
                                        style={{ width: `${strength.widthPct}%` }}
                                    />
                                </div>
                                <p className="mb-[16px] text-[12px] font-[Inter-Regular] text-[#23262A]">
                                    Password Strength:{' '}
                                    <span className={`font-[Inter-SemiBold] ${strength.textClass}`}>{strength.label}</span>
                                </p>
                            </div>
                        ) : null}
                        {newPassword.length > 0 ? (
                            <div className="mb-[22px] rounded-[8px] bg-[#F3F4F6] p-[14px_16px]">
                                <ul className="flex flex-col gap-[20px]">
                                    {checklist.map((row) => (
                                        <li key={row.key} className="flex items-center gap-[10px]">
                                            {row.pass ? (
                                                <Image src={Tick} alt="tick" className="h-[12px] w-[12px]" width={12} height={12} />
                                            ) : (
                                                <CloseIcon className="h-[8px] w-[8px]" fill="#DC0000" fillOpacity="1" />
                                            )}
                                            <p className="text-[12px] font-[Inter-Regular] leading-[1.4] text-[#374151]">{row.label}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}

                        <button
                            type="button"
                            disabled={!allValid || isSubmitting}
                            onClick={async (e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (!allValid || isSubmitting) return
                                try {
                                    setIsSubmitting(true)
                                    const user = auth.currentUser
                                    if (!user) {
                                        toast.error(t('userNotFound'))
                                        return
                                    }
                                    await updatePassword(user, newPassword)
                                    toast.success(t('passwordUpdated'))
                                    const typeNorm = String(accountType || '').trim().toLowerCase()
                                    try {
                                        onSubmit?.({
                                            newPassword,
                                            confirmPassword,
                                            accountType: typeNorm,
                                            phone: String(phone || '').trim(),
                                            email: String(email || '').trim(),
                                        })
                                    } catch (submitError) {
                                        console.error('ChangePassword onSubmit error:', submitError)
                                    }
                                    setShowSuccessModal(true)
                                } catch (error) {
                                    showPasswordUpdateError(error)
                                } finally {
                                    setIsSubmitting(false)
                                }
                            }}
                            className={`w-full rounded-[8px] py-[12px] text-[14px] font-[Inter-SemiBold] ${allValid && !isSubmitting
                                ? 'cursor-pointer bg-[#23262A] text-white'
                                : 'cursor-not-allowed bg-[#E5E7EB] text-[#9CA3AF]'
                                }`}
                        >
                            {isSubmitting ? 'Updating...' : 'Change Password'}
                        </button>
                    </div>
                </div>

            </div>
            ) : null}
            <SuccessModal open={showSuccessModal} onClose={handleSuccessClose} />
        </>
    )
}
