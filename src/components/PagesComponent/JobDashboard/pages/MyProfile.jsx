'use client'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { FormDownArrowIcon, JobEmailIcon } from '@/components/CustomFile/icons'
import { getUserDetailApi, jobDashboardProfileApi } from '@/utils/api'
import { rootSignupData, userSignUpData } from '@/redux/reuducer/authSlice'

const CITY_OPTIONS = [
    'Dubai',
    'Abu Dhabi',
    'Ras Al Khaimah',
    'Sharjah',
    'Fujairah',
    'Ajman',
    'Umm Al Quwain',
    'Al Ain',
]

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

function resolveUserId(userData, authRoot) {
    return (
        userData?.id ??
        userData?.data?.id ??
        userData?.user?.id ??
        authRoot?.data?.id ??
        authRoot?.data?.data?.id ??
        authRoot?.data?.user?.id ??
        null
    )
}

function FloatingTextField({ id, label, required, value, onChange, type = 'text', autoComplete, disabled }) {
    return (
        <div className="relative w-full min-w-0">
            <input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder=" "
                required={required}
                autoComplete={autoComplete}
                disabled={disabled}
                className="peer h-[48px] w-full rounded-[8px] border border-[rgba(143,143,143,0.45)] bg-white p-[18px_14px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none transition placeholder:text-transparent focus:border-[#1270ec] focus:ring-1 focus:ring-[#1270ec]/25 disabled:cursor-not-allowed disabled:bg-[#f9fafb] disabled:text-[#6b7280]"
            />
            <label
                htmlFor={id}
                className="pointer-events-none absolute left-[10px] top-[-8px] z-[1] bg-white px-[4px] text-[12px] font-[Inter-Regular] text-[#3a3f47]"
            >
                {label}
                {required ? <span className="">*</span> : null}
            </label>
        </div>
    )
}

function FloatingEmailField({ id, label, value, onChange, disabled }) {
    return (
        <div className="relative w-full min-w-0">
            <div className="pointer-events-none absolute left-[12px] top-1/2 z-[1] -translate-y-1/2">
                <JobEmailIcon className="h-[18px] w-[18px]" />
            </div>
            <input
                id={id}
                type="email"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder=" "
                autoComplete="email"
                disabled={disabled}
                className="peer h-[48px] w-full rounded-[8px] border border-[rgba(143,143,143,0.45)] bg-white p-[18px_38px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none transition placeholder:text-transparent focus:border-[#1270ec] focus:ring-1 focus:ring-[#1270ec]/25 disabled:cursor-not-allowed disabled:bg-[#f9fafb] disabled:text-[#6b7280]"
            />
            <label
                htmlFor={id}
                className="pointer-events-none absolute left-[10px] top-[-8px] z-[1] bg-white px-[4px] text-[12px] font-[Inter-Regular] text-[#3a3f47]"
            >
                {label}
            </label>
        </div>
    )
}

function ProfileCityField({ id, label, value, options, onChange, disabled }) {
    const [open, setOpen] = useState(false)
    const wrapRef = useRef(null)
    const [menuPos, setMenuPos] = useState(null)
    const normalized = String(value || '').toLowerCase()
    const filtered = options.filter((o) => String(o).toLowerCase().includes(normalized))

    const updateMenuPosition = () => {
        const el = wrapRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        setMenuPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }

    useLayoutEffect(() => {
        if (!open) {
            setMenuPos(null)
            return undefined
        }
        updateMenuPosition()
        const onScroll = () => updateMenuPosition()
        window.addEventListener('scroll', onScroll, true)
        window.addEventListener('resize', onScroll)
        return () => {
            window.removeEventListener('scroll', onScroll, true)
            window.removeEventListener('resize', onScroll)
        }
    }, [open, value])

    const dropdown =
        open && menuPos && typeof document !== 'undefined' && !disabled
            ? createPortal(
                <div
                    className="fixed z-[1300] max-h-[260px] overflow-auto rounded-[8px] border border-[#e5e7eb] bg-white py-[4px] shadow-[0_8px_24px_rgba(17,24,39,0.12)]"
                    style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
                >
                    {filtered.length > 0 ? (
                        filtered.map((option) => (
                            <button
                                key={`${id}-${option}`}
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault()
                                    onChange(option)
                                    setOpen(false)
                                }}
                                className={`w-full cursor-pointer px-[12px] py-[10px] text-left text-[14px] font-[Inter-Regular] text-[#23262A] transition ${option === value ? 'bg-[#e3f2fd]' : 'bg-white hover:bg-[#e3f2fd]/70'
                                    }`}
                            >
                                {option}
                            </button>
                        ))
                    ) : (
                        <p className="px-[12px] py-[10px] text-[12px] font-[Inter-Regular] text-[#23262a]">No results</p>
                    )}
                </div>,
                document.body
            )
            : null

    return (
        <div ref={wrapRef} className="relative w-full min-w-0">
            <div
                className={`flex h-[48px] items-stretch rounded-[8px] border bg-white transition focus-within:ring-1 focus-within:ring-[#1270ec]/25 ${open ? 'border-[#1270ec] ring-1 ring-[#1270ec]/25' : 'border-[#d1d5db]'
                    } ${disabled ? 'cursor-not-allowed bg-[#f9fafb]' : ''}`}
            >
                <input
                    id={id}
                    value={value}
                    onFocus={() => !disabled && setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 120)}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder=" "
                    autoComplete="address-level2"
                    disabled={disabled}
                    className="peer h-full min-h-0 flex-1 rounded-[8px] border-0 bg-transparent p-[18px_14px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-transparent disabled:cursor-not-allowed"
                    aria-expanded={open}
                    aria-haspopup="listbox"
                />
                <div className="pointer-events-none flex shrink-0 items-center">
                    <FormDownArrowIcon className={`h-[18px] w-[18px] transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </div>
            <label
                htmlFor={id}
                className="pointer-events-none absolute left-[10px] top-[-8px] z-[1] bg-white px-[4px] text-[12px] font-[Inter-Regular] text-[#3a3f47]"
            >
                {label}
            </label>
            {dropdown}
        </div>
    )
}

function MyProfileFormSkeleton() {
    return (
        <div
            className="animate-pulse rounded-[8px] bg-white p-[24px] [box-shadow:0px_3px_3px_-2px_rgba(0,0,0,0.1),0px_3px_4px_rgba(0,0,0,0.07),0px_1px_8px_rgba(0,0,0,0.06)]"
            aria-busy="true"
            aria-label="Loading profile"
        >
            <div className="grid grid-cols-2 gap-[26px] max-sm:grid-cols-1">
                {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={`profile-skel-${idx}`} className="h-[48px] rounded-[8px] bg-[#eef1f4]" />
                ))}
            </div>
            <div className="mt-[28px] flex justify-end">
                <div className="h-[36px] w-[88px] rounded-[6px] bg-[#eef1f4]" />
            </div>
        </div>
    )
}

const MyProfile = () => {
    const router = useRouter()
    const userData = useSelector(userSignUpData)
    const authRoot = useSelector(rootSignupData)
    const [contactName, setContactName] = useState('')
    const [communicationEmail, setCommunicationEmail] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [city, setCity] = useState('')
    const [pageLoading, setPageLoading] = useState(true)
    const [saveLoading, setSaveLoading] = useState(false)
    const [saveError, setSaveError] = useState('')

    useEffect(() => {
        const userId = resolveUserId(userData, authRoot)
        let cancelled = false

        const run = async () => {
            if (!userId) {
                setContactName('')
                setCommunicationEmail('')
                setPhoneNumber('')
                setCity('')
                setPageLoading(false)
                return
            }

            let personalOne = false
            try {
                const detailRes = await getUserDetailApi.getUserDetail({ user_id: userId })
                const parsedDetail = parseApiPayload(detailRes?.data)
                const detail =
                    parsedDetail?.data && typeof parsedDetail.data === 'object' && !Array.isArray(parsedDetail.data)
                        ? parsedDetail.data
                        : null
                if (detail) {
                    /* Prefill from API only when personal_profile is complete (1); otherwise empty fields */
                    personalOne = String(detail.personal_profile ?? '').trim() === '1'
                }
            } catch {
                /* detail unknown: still load page, treat as no server-side personal completion */
                personalOne = false
            }

            if (cancelled) return

            try {
                const profileRes = await jobDashboardProfileApi.getJobDashboardProfile({
                    user_id: userId,
                    type: 'personal',
                })
                const parsedProfile = parseApiPayload(profileRes?.data)
                const raw = parsedProfile?.data
                const row =
                    raw && typeof raw === 'object' && !Array.isArray(raw)
                        ? raw
                        : null
                if (!cancelled && personalOne && row) {
                    setContactName(String(row.personal_name ?? '').trim())
                    setCommunicationEmail(String(row.personal_email ?? '').trim())
                    setPhoneNumber(String(row.personal_number ?? '').trim())
                    setCity(String(row.city ?? '').trim())
                } else if (!cancelled) {
                    setContactName('')
                    setCommunicationEmail('')
                    setPhoneNumber('')
                    setCity('')
                }
            } catch {
                if (!cancelled) {
                    setContactName('')
                    setCommunicationEmail('')
                    setPhoneNumber('')
                    setCity('')
                }
            } finally {
                if (!cancelled) setPageLoading(false)
            }
        }

        run()
        return () => {
            cancelled = true
        }
    }, [
        userData?.id,
        userData?.data?.id,
        userData?.user?.id,
        authRoot?.data?.id,
        authRoot?.data?.data?.id,
        authRoot?.data?.user?.id,
    ])

    const handleSave = async (e) => {
        e.preventDefault()
        setSaveError('')
        const userId = resolveUserId(userData, authRoot)
        if (!userId) {
            setSaveError('You need to be signed in to save your profile.')
            return
        }
        setSaveLoading(true)
        try {
            const res = await jobDashboardProfileApi.addPersonalProfile({
                user_id: userId,
                personal_name: contactName,
                personal_email: communicationEmail,
                personal_number: phoneNumber,
                city,
            })
            const parsed = parseApiPayload(res?.data)
            const ok =
                parsed &&
                (parsed.error === false ||
                    parsed.error === 'false' ||
                    parsed.error == null) &&
                (parsed.code == null || Number(parsed.code) === 200)
            if (!ok) {
                setSaveError(String(parsed?.message || 'Could not save. Please try again.'))
                return
            }
            router.push('/jobdashboard')
        } catch (err) {
            const raw = err?.response?.data
            const parsedErr =
                typeof raw === 'string' ? parseApiPayload(raw) : raw && typeof raw === 'object' ? raw : {}
            setSaveError(
                String(parsedErr?.message || err?.message || 'Could not save. Please try again.')
            )
        } finally {
            setSaveLoading(false)
        }
    }

    return (
        <div className="px-[24px]">
            <h1 className="mb-[20px] text-[20px] font-[Inter-Bold] text-[#17191c]">Personal profile</h1>

            {pageLoading ? (
                <MyProfileFormSkeleton />
            ) : (
                <form
                    onSubmit={handleSave}
                    className="rounded-[8px] bg-white p-[24px] [box-shadow:0px_3px_3px_-2px_rgba(0,0,0,0.1),0px_3px_4px_rgba(0,0,0,0.07),0px_1px_8px_rgba(0,0,0,0.06)]"
                >
                    <div className="grid grid-cols-2 gap-[26px] max-sm:grid-cols-1">
                        <FloatingTextField
                            id="profile-contact-name"
                            label="Contact Name"
                            required
                            value={contactName}
                            onChange={setContactName}
                            autoComplete="name"
                            disabled={saveLoading}
                        />
                        <FloatingEmailField
                            id="profile-communication-email"
                            label="Communication Email"
                            value={communicationEmail}
                            onChange={setCommunicationEmail}
                            disabled={saveLoading}
                        />
                        <FloatingTextField
                            id="profile-phone"
                            label="Phone Number"
                            required
                            value={phoneNumber}
                            onChange={setPhoneNumber}
                            type="tel"
                            autoComplete="tel"
                            disabled={saveLoading}
                        />
                        <ProfileCityField
                            id="profile-city"
                            label="City"
                            value={city}
                            options={CITY_OPTIONS}
                            onChange={setCity}
                            disabled={saveLoading}
                        />
                    </div>

                    <div className="mt-[28px] flex flex-wrap items-center justify-end gap-[12px]">
                        {saveError ? (
                            <span className="mr-auto max-w-full text-[13px] font-[Inter-Regular] text-[#b91c1c]">
                                {saveError}
                            </span>
                        ) : null}
                        <button
                            type="submit"
                            disabled={saveLoading}
                            className="cursor-pointer rounded-[6px] bg-[#DC0000] p-[8px_20px] text-[14px] font-[Inter-Bold] text-white transition enabled:hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {saveLoading ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}

export default MyProfile
