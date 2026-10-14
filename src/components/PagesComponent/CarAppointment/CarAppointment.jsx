'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useSelector } from 'react-redux'
import Emptydata from './components/Emptydata'
import carplaceholder from '../../../../public/assets/img/carplaceholder.png'
import { rootSignupData, userSignUpData } from '@/redux/reuducer/authSlice'
import { getCarAppointmentDetailsApi } from '@/utils/api'

const NA = 'N / A'

const toDisplayValue = (value) => {
    if (value === null || value === undefined) return NA
    const str = String(value).trim()
    return str === '' ? NA : str
}

function combineAppointmentDateTime(dateValue, timeValue) {
    if (!dateValue) return null
    try {
        const datePart = String(dateValue).split('T')[0]
        if (!datePart) return null
        const timePart = timeValue ? String(timeValue).slice(0, 8) : '00:00:00'
        const composed = `${datePart}T${timePart}`
        const d = new Date(composed)
        if (Number.isNaN(d.getTime())) return null
        return d
    } catch {
        return null
    }
}

function formatAppointmentDateTime(dateValue, timeValue) {
    const d = combineAppointmentDateTime(dateValue, timeValue)
    if (!d) return NA
    const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const hasTime = Boolean(timeValue)
    if (!hasTime) return date
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    return `${date} • ${time}`
}

function getStatusPresentation(status, isUpcoming) {
    const normalized = String(status || '').toLowerCase().trim()
    if (normalized === 'completed') {
        return { text: 'Completed', cls: 'bg-[#E7F8ED] text-[#0A8F5C]' }
    }
    if (normalized === 'cancelled' || normalized === 'canceled') {
        return { text: 'Cancelled', cls: 'bg-[#FDECEC] text-[#DC0000]' }
    }
    if (normalized === 'pending') {
        return { text: 'Pending', cls: 'bg-[#FFF6E5] text-[#B26A00]' }
    }
    if (normalized === 'scheduled' || normalized === 'upcoming') {
        return { text: 'Upcoming', cls: 'bg-[#EAF3FE] text-[#2F80ED]' }
    }
    if (normalized) {
        const label = normalized.charAt(0).toUpperCase() + normalized.slice(1)
        return {
            text: label,
            cls: isUpcoming ? 'bg-[#EAF3FE] text-[#2F80ED]' : 'bg-[#E7F8ED] text-[#0A8F5C]',
        }
    }
    return isUpcoming
        ? { text: 'Upcoming', cls: 'bg-[#EAF3FE] text-[#2F80ED]' }
        : { text: 'Completed', cls: 'bg-[#E7F8ED] text-[#0A8F5C]' }
}

function AppointmentCardSkeleton() {
    return (
        <div className="rounded-[8px] border border-[rgba(143,143,143,0.2)] bg-white p-[14px] [box-shadow:0px_1px_10px_0px_rgba(0,0,0,0.04)] animate-pulse">
            <div className="flex items-center justify-between gap-[14px] max-sm:flex-col max-sm:items-start">
                <div className="flex items-start gap-[12px]">
                    <div className="w-[104px] h-[120px] rounded-[6px] bg-[#E5E7EB]" />
                    <div className="min-w-0 flex flex-col gap-[8px]">
                        <div className="h-[16px] w-[180px] rounded-[4px] bg-[#E5E7EB]" />
                        <div className="h-[14px] w-[120px] rounded-[4px] bg-[#EDEEF0]" />
                        <div className="h-[14px] w-[160px] rounded-[4px] bg-[#EDEEF0]" />
                        <div className="h-[12px] w-[140px] rounded-[4px] bg-[#EDEEF0]" />
                        <div className="h-[12px] w-[110px] rounded-[4px] bg-[#EDEEF0]" />
                    </div>
                </div>
                <div className="h-[24px] w-[80px] rounded-[14px] bg-[#E5E7EB]" />
            </div>
        </div>
    )
}

export default function CarAppointment() {
    const userData = useSelector(userSignUpData)
    const authRoot = useSelector(rootSignupData)
    const [activeTab, setActiveTab] = useState('upcoming')
    const [appointments, setAppointments] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    const resolvedUserId = useMemo(
        () =>
            userData?.id ??
            userData?.data?.id ??
            userData?.user?.id ??
            authRoot?.data?.id ??
            authRoot?.data?.data?.id ??
            authRoot?.data?.user?.id ??
            null,
        [
            userData?.id,
            userData?.data?.id,
            userData?.user?.id,
            authRoot?.data?.id,
            authRoot?.data?.data?.id,
            authRoot?.data?.user?.id,
        ]
    )

    useEffect(() => {
        if (!resolvedUserId) {
            setAppointments([])
            setIsLoading(false)
            return undefined
        }

        let cancelled = false
        const run = async () => {
            setIsLoading(true)
            try {
                const response = await getCarAppointmentDetailsApi.getCarAppointmentDetails({
                    user_id: resolvedUserId,
                })
                const payload = response?.data
                const list = Array.isArray(payload?.data) ? payload.data : []
                if (!cancelled) setAppointments(list)
            } catch (err) {
                console.error('Failed to fetch car appointments:', err)
                if (!cancelled) setAppointments([])
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [resolvedUserId])

    const { upcomingRows, pastRows } = useMemo(() => {
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const upcoming = []
        const past = []

        appointments.forEach((item) => {
            const dateObj = combineAppointmentDateTime(item?.appointment_date, item?.appointment_time)
            const dayOnly = dateObj
                ? new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate())
                : null
            const isPastByDate = dayOnly ? dayOnly < todayStart : false

            if (isPastByDate) {
                past.push(item)
            } else {
                upcoming.push(item)
            }
        })

        return { upcomingRows: upcoming, pastRows: past }
    }, [appointments])

    const rows = activeTab === 'upcoming' ? upcomingRows : pastRows
    const isUpcomingTab = activeTab === 'upcoming'

    return (
        <div className="w-full">
            <div className='relative w-full border-b border-[rgba(143,143,143,0.2)] bg-white'>
                <div className="mx-auto max-w-[1170px] max-sm:max-w-full max-sm:px-[15px] common_container">
                    <div className="mb-[30px] mx-auto max-w-[1170px] max-sm:max-w-full max-sm:px-[15px] common_container ">
                        <h1 className="text-[22px] font-[Inter-Bold] leading-tight text-[#23262A]">Car Appointments</h1>
                    </div>

                    <div className="flex gap-[32px] border-b border-[rgba(143,143,143,0.22)]">
                        <button
                            type="button"
                            onClick={() => setActiveTab('upcoming')}
                            className={`relative p-[12px_24px] text-[14px] transition-colors cursor-pointer border-b-[2px] ${activeTab === 'upcoming' ? 'font-[Inter-SemiBold] text-[#23262A] border-[#DC0000]' : 'font-[Inter-Regular] text-[#9CA3AF] border-transparent'
                                }`}
                        >
                            Upcoming

                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('past')}
                            className={`relative p-[12px_24px] text-[14px] transition-colors cursor-pointer border-b-[2px] ${activeTab === 'past' ? 'font-[Inter-SemiBold] text-[#23262A] border-[#DC0000]' : 'font-[Inter-Regular] text-[#9CA3AF] border-transparent'
                                }`}
                        >
                            Past

                        </button>
                    </div>
                </div>
            </div>

            <div className='bg-[#f7f7f8b3]'>
                <div className="mx-auto max-w-[1170px] max-sm:max-w-full max-sm:px-[15px] common_container !py-[24px]">
                    <div className="grid grid-cols-1 gap-[12px]">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                                <AppointmentCardSkeleton key={`appointment-skeleton-${index}`} />
                            ))
                        ) : rows.length > 0 ? (
                            rows.map((item) => {
                                const inspectionStatus = item?.inspection?.status
                                const statusValue = item?.status || inspectionStatus
                                const { text: statusText, cls: statusClass } = getStatusPresentation(
                                    statusValue,
                                    isUpcomingTab
                                )
                                const carName = toDisplayValue(item?.car_name)
                                const appointmentType = item?.inspection ? 'Inspection' : NA
                                const locationLabel = toDisplayValue(item?.location)
                                const phoneLabel = toDisplayValue(item?.phone_no)
                                const dateTimeLabel = formatAppointmentDateTime(
                                    item?.appointment_date,
                                    item?.appointment_time
                                )
                                const carImage =
                                    typeof item?.car_image === 'string' && item.car_image.trim()
                                        ? item.car_image.trim()
                                        : null

                                return (
                                    <div
                                        key={item?.id}
                                        className="rounded-[8px] border border-[rgba(143,143,143,0.2)] bg-white p-[14px] [box-shadow:0px_1px_10px_0px_rgba(0,0,0,0.04)]"
                                    >
                                        <div className="flex items-center justify-between gap-[14px] max-sm:flex-col max-sm:items-start">
                                            <div className="flex items-start gap-[12px]">
                                                {carImage ? (
                                                    <Image
                                                        src={carImage}
                                                        alt={carName}
                                                        width={104}
                                                        height={92}
                                                        unoptimized
                                                        className="w-[104px] h-[120px] object-cover rounded-[6px]"
                                                    />
                                                ) : (
                                                    <Image
                                                        src={carplaceholder}
                                                        alt={carName}
                                                        width={104}
                                                        height={92}
                                                        className="w-[104px] h-[120px] object-cover rounded-[6px]"
                                                    />
                                                )}
                                                <div className="min-w-0">
                                                    <h4 className="truncate text-[16px] font-[Inter-SemiBold] text-[#23262A]">{carName}</h4>
                                                    <p className="mt-[4px] text-[14px] font-[Inter-Regular] text-[#666b72]">{appointmentType}</p>
                                                    <p className="mt-[6px] text-[14px] font-[Inter-Regular] text-[#23262A]">{locationLabel}</p>
                                                    <p className="mt-[4px] text-[12px] font-[Inter-Regular] text-[#8F8F8F]">{dateTimeLabel}</p>
                                                    <p className="mt-[4px] text-[12px] font-[Inter-Regular] text-[#8F8F8F]">{phoneLabel}</p>
                                                </div>
                                            </div>
                                            <span className={`rounded-[14px] px-[10px] py-[5px] text-[12px] font-[Inter-SemiBold] ${statusClass}`}>
                                                {statusText}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <Emptydata />
                        )}
                    </div>
                </div>
            </div>

        </div>
    )
}
