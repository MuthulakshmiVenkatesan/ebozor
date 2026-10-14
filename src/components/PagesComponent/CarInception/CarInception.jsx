'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import carinceptionempty from '../../../../public/assets/img/carinceptionempty.svg'
import carplaceholder from '../../../../public/assets/img/carplaceholder.png'
import { LocationIcon, DownloadIcon } from '@/components/CustomFile/icons'
import { useSelector } from 'react-redux'
import { userSignUpData } from '@/redux/reuducer/authSlice'
import { carInspectionApi } from '@/utils/api'

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

export default function CarInception() {
    const userData = useSelector(userSignUpData)
    const [inspectionRows, setInspectionRows] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        const run = async () => {
            const currentUserId = userData?.id ?? userData?.data?.id ?? userData?.user?.id ?? null
            if (!currentUserId) {
                if (!cancelled) setIsLoading(false)
                if (!cancelled) setInspectionRows([])
                return
            }
            try {
                if (!cancelled) setIsLoading(true)
                const response = await carInspectionApi.getInspection({ user_id: currentUserId })
                const parsed = parseApiPayload(response?.data)
                const rows = Array.isArray(parsed?.data) ? parsed.data : []
                if (!cancelled) setInspectionRows(rows)
            } catch {
                if (!cancelled) setInspectionRows([])
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [userData?.id, userData?.data?.id, userData?.user?.id])

    const isEmpty = useMemo(() => inspectionRows.length === 0, [inspectionRows])

    return (
        <div className="w-full ">
            <div className="mb-[30px] mx-auto max-w-[1170px] max-sm:max-w-full max-sm:px-[15px] common_container flex items-center justify-between flex-wrap gap-[10px] ">
                <h1 className="text-[22px] font-[Inter-Bold] leading-tight text-[#23262A]">Car Inception</h1>
                {/* <button className='flex items-center gap-[8px] bg-[#DC0000] text-white rounded-[6px] px-[16px] py-[8px] cursor-pointer'>
                    <p className='text-[14px] font-[Inter-SemiBold]'>Review Report</p>
                    <DownloadIcon className="w-[16px] h-[16px]" />
                </button> */}
            </div>
            <div className="bg-[#f7f7f8] py-[24px]">
                <div className="mx-auto max-w-[1170px] max-sm:max-w-full max-sm:px-[15px] common_container ">
                    {isLoading ? (
                        <div className='grid grid-cols-1 gap-[10px]'>
                            {[0, 1].map((idx) => (
                                <div key={`car-inception-skeleton-${idx}`} className='bg-white [box-shadow:0px_4px_8px_-2px_rgba(0,0,0,0.02),0px_3px_8px_rgba(0,0,0,0.02),0px_1px_10px_rgba(0,0,0,0.04)] rounded-[6px] p-[16px] grid grid-cols-2 gap-[16px] max-sm:grid-cols-1'>
                                    <div className='flex items-start gap-[10px] max-sm:flex-col'>
                                        <div className="w-[104px] h-[92px] animate-pulse rounded-[6px] bg-[#ECECEC]" />
                                        <div className='flex flex-col items-start gap-[8px] w-full'>
                                            <div className="h-[18px] w-[90px] animate-pulse rounded-[4px] bg-[#ECECEC]" />
                                            <div className="h-[16px] w-[180px] animate-pulse rounded-[4px] bg-[#ECECEC]" />
                                        </div>
                                    </div>
                                    <div className='flex flex-col items-start gap-[8px]'>
                                        <div className="h-[16px] w-[120px] animate-pulse rounded-[4px] bg-[#ECECEC]" />
                                        <div className="h-[16px] w-[80px] animate-pulse rounded-[4px] bg-[#ECECEC]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : isEmpty ? (
                        <div className="flex min-h-[min(520px,70vh)] flex-col items-center justify-center p-[30px]">
                            <div className="mb-[28px] flex justify-center">
                                <Image
                                    src={carinceptionempty}
                                    alt=""
                                    width={120}
                                    height={266}
                                    className="h-[266px] w-auto"
                                    priority
                                />
                            </div>
                            <h2 className="text-center text-[24px] font-[Inter-Bold] leading-snug text-[#23262A]">
                                You have no inspections yet
                            </h2>
                        </div>
                    ) : (
                        <div className='grid grid-cols-1 gap-[10px]'>
                            {inspectionRows.map((row) => (
                                (() => {
                                    const rawStatus = String(row?.payment_status || 'pending').trim().toLowerCase()
                                    const statusLabel = rawStatus ? rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1) : 'Pending'
                                    const statusDotClass = rawStatus === 'success' ? 'bg-[#10B910]' : 'bg-[#ffbf2d]'
                                    const reportUrl = String(row?.inspection_report || '').trim()
                                    const hasReport = reportUrl.length > 0
                                    return (
                                        <div key={row?.id} className='bg-white [box-shadow:0px_4px_8px_-2px_rgba(0,0,0,0.02),0px_3px_8px_rgba(0,0,0,0.02),0px_1px_10px_rgba(0,0,0,0.04)] rounded-[6px] p-[16px] grid grid-cols-2 gap-[16px] max-sm:grid-cols-1'>
                                            <div className='flex items-start gap-[10px] max-sm:flex-col'>
                                                <Image
                                                    src={carplaceholder}
                                                    alt=""
                                                    width={104}
                                                    height={92}
                                                    className="w-[104px] h-[92px] object-cover"
                                                />
                                                <div className='flex flex-col items-start gap-[4px]'>
                                                    <p className='bg-[#f2f2f2] rounded-[4px] px-[6px] py-[2px] text-[10px] font-[Inter-SemiBold] text-[#23262a] uppercase'>Inception</p>
                                                    <div className='flex items-center gap-[10px]'>
                                                        <h4 className='text-[14px] font-[Inter-SemiBold] text-[#23262a]'>Make</h4>
                                                        <div className='bg-[#23262a] rounded-full p-[2px]'></div>
                                                        <h4 className='text-[14px] font-[Inter-SemiBold] text-[#23262a]'>Model</h4>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='flex justify-between items-start gap-[8px]'>
                                                <div className='flex flex-col items-start gap-[8px]'>
                                                    <div className='flex items-center gap-[8px]'>
                                                        <div className={`${statusDotClass} rounded-full p-[5px]`}></div>
                                                        <p className='text-[14px] font-[Inter-Regular] text-[#23262a]'>
                                                            {statusLabel}
                                                        </p>
                                                    </div>
                                                    <div className='flex items-center gap-[4px]'>
                                                        <LocationIcon className='w-[16px] h-[16px]' />
                                                        <p className='text-[16px] font-[Inter-Regular] text-[#23262a]'>Dubai</p>
                                                    </div>

                                                </div>
                                                {hasReport ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => window.open(reportUrl, '_blank', 'noopener,noreferrer')}
                                                        className='flex items-center gap-[8px] bg-[#DC0000] text-white rounded-[6px] px-[16px] py-[8px] cursor-pointer'
                                                    >
                                                        <p className='text-[14px] font-[Inter-SemiBold]'>Download Report</p>
                                                        <DownloadIcon className="w-[16px] h-[16px]" />
                                                    </button>
                                                ) : (
                                                    <p className='text-[14px] font-[Inter-SemiBold] text-[#DC0000]'>Report not available</p>
                                                )}
                                            </div>

                                        </div>
                                    )
                                })()
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div >
    )
}
