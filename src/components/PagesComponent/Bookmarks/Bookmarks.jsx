'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { DeleteIcon, TickIcon } from '@/components/CustomFile/icons'
import { userSignUpData } from '@/redux/reuducer/authSlice'
import { deleteBookmarkCompaniesApi, getBookmarkCompaniesApi } from '@/utils/api'
import clientPlaceholder from '../../../../public/assets/img/client.png'

const BOOKMARK_SKELETON_COUNT = 3

function BookmarkRowSkeleton() {
    return (
        <li className="flex items-center justify-between gap-[12px] py-[12px] max-sm:flex-col max-sm:items-start animate-pulse">
            <div className='flex items-start gap-[18px] max-sm:flex-wrap w-full'>
                <div className="w-[20px] h-[20px] rounded bg-[#EAECEF]" />
                <div className="h-[48px] w-[48px] rounded-[4px] bg-[#EAECEF] shrink-0" />
                <div className="h-[18px] w-[60%] max-w-[280px] rounded bg-[#EAECEF]" />
            </div>
            <div className="flex shrink-0 items-center gap-[16px]">
                <div className="h-[16px] w-[60px] rounded bg-[#EAECEF]" />
            </div>
        </li>
    )
}

export default function Bookmarks() {
    const userData = useSelector(userSignUpData)
    const userId = useMemo(() => {
        const id = userData?.id
        return id != null && String(id).trim() !== '' ? id : null
    }, [userData?.id])

    const [bookmarks, setBookmarks] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedIds, setSelectedIds] = useState(() => new Set())
    const [pendingIds, setPendingIds] = useState(() => new Set())
    const [isBulkRemoving, setIsBulkRemoving] = useState(false)

    useEffect(() => {
        let cancelled = false
        const run = async () => {
            setIsLoading(true)
            try {
                const response = await getBookmarkCompaniesApi.getBookmarkCompanies({
                    ...(userId ? { user_id: userId } : {}),
                })
                const payload = response?.data
                const list = Array.isArray(payload?.data) ? payload.data : []
                const mapped = list.map((row) => {
                    const logoRaw =
                        typeof row?.company_logo === 'string' && row.company_logo.trim()
                            ? row.company_logo.trim()
                            : null
                    return {
                        id: String(row?.id ?? ''),
                        name: row?.company_name || '',
                        logoSrc: logoRaw,
                        listingCount: Number(row?.listing_count ?? 0),
                    }
                })
                if (!cancelled) setBookmarks(mapped)
            } catch (err) {
                console.error('Failed to fetch bookmark companies:', err)
                if (!cancelled) setBookmarks([])
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [userId])

    const isEmpty = bookmarks.length === 0

    const toggleSelect = useCallback((id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])

    const removeSelected = useCallback(async () => {
        if (selectedIds.size === 0 || isBulkRemoving) return
        if (!userId) {
            toast.error('Please login your account')
            return
        }
        const idsToRemove = Array.from(selectedIds)
        const previousBookmarks = bookmarks
        const previousSelected = selectedIds

        setIsBulkRemoving(true)
        setBookmarks((prev) => prev.filter((b) => !selectedIds.has(b.id)))
        setSelectedIds(new Set())
        try {
            await deleteBookmarkCompaniesApi.deleteBookmarkCompanies({
                user_id: userId,
                company_id: idsToRemove,
                type: 'multiple',
            })
        } catch (err) {
            console.error('Failed to remove bookmarks:', err)
            setBookmarks(previousBookmarks)
            setSelectedIds(previousSelected)
            toast.error('Failed to remove bookmarks. Please try again.')
        } finally {
            setIsBulkRemoving(false)
        }
    }, [selectedIds, bookmarks, userId, isBulkRemoving])

    const removeOne = useCallback(async (id) => {
        if (!id || pendingIds.has(id)) return
        if (!userId) {
            toast.error('Please login your account')
            return
        }
        const previousBookmarks = bookmarks
        const wasSelected = selectedIds.has(id)

        setPendingIds((prev) => {
            const next = new Set(prev)
            next.add(id)
            return next
        })
        setBookmarks((prev) => prev.filter((b) => b.id !== id))
        setSelectedIds((prev) => {
            const next = new Set(prev)
            next.delete(id)
            return next
        })
        try {
            await deleteBookmarkCompaniesApi.deleteBookmarkCompanies({
                user_id: userId,
                company_id: [id],
            })
        } catch (err) {
            console.error('Failed to remove bookmark:', err)
            setBookmarks(previousBookmarks)
            if (wasSelected) {
                setSelectedIds((prev) => {
                    const next = new Set(prev)
                    next.add(id)
                    return next
                })
            }
            toast.error('Failed to remove bookmark. Please try again.')
        } finally {
            setPendingIds((prev) => {
                const next = new Set(prev)
                next.delete(id)
                return next
            })
        }
    }, [bookmarks, selectedIds, pendingIds, userId])

    const canBulkRemove = useMemo(
        () => selectedIds.size > 0 && !isBulkRemoving,
        [selectedIds, isBulkRemoving]
    )

    return (
        <div className="w-full bg-white pb-[40px]">
            <div className="mx-auto max-w-[1170px] max-sm:max-w-full max-sm:px-[15px] common_container ">
                <h1 className="mb-[8px] text-[22px] font-[Inter-Bold] leading-tight text-[#23262A]">My Bookmarks</h1>

                {isLoading ? (
                    <div className='w-[80%] mx-auto max-sm:w-full mt-[40px]'>
                        <div className="overflow-hidden rounded-[4px] border border-[#e2e2e2] bg-white p-[24px_16px]">
                            <div className="bg-[#f6f6f6] py-[8px] mb-[14px] ">
                                <h2 className="text-[16px] font-[Inter-SemiBold] leading-none text-[#5b5b5b]">Jobs</h2>
                            </div>
                            <div className="bg-white">
                                <div className="mb-[6px] h-[28px] w-[150px] rounded-[4px] bg-[#EAECEF] animate-pulse" />
                                <ul className="divide-y divide-[#E0E0E0] pb-[16px] last:pb-0">
                                    {Array.from({ length: BOOKMARK_SKELETON_COUNT }).map((_, idx) => (
                                        <BookmarkRowSkeleton key={`bookmark-skeleton-${idx}`} />
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : isEmpty ? (
                    <div className="flex min-h-[min(520px,70vh)] flex-col items-center justify-center p-[30px]">
                        <div className="mb-[28px] flex justify-center">
                            <Image
                                src="/assets/img/icons/empty.svg"
                                alt=""
                                width={120}
                                height={130}
                                className="h-auto w-[110px]"
                                priority
                            />
                        </div>
                        <h2 className="mb-[8px] text-center text-[24px] font-[Inter-Bold] leading-snug text-[#23262A]">
                            It&apos;s like a desert out here!
                        </h2>
                        <p className="text-center text-[14px] font-[Inter-Regular] leading-relaxed text-[#23262A]">
                            You don&apos;t have any bookmarks
                        </p>
                    </div>
                ) : (
                    <div className='w-[80%] mx-auto max-sm:w-full mt-[40px]'>
                        <div className="overflow-hidden rounded-[4px] border border-[#e2e2e2] bg-white p-[24px_16px]">
                            <div className="bg-[#f6f6f6] py-[8px] mb-[14px] ">
                                <h2 className="text-[16px] font-[Inter-SemiBold] leading-none text-[#5b5b5b]">Jobs</h2>
                            </div>

                            <div className="bg-white">
                                <button
                                    type="button"
                                    disabled={!canBulkRemove}
                                    onClick={removeSelected}
                                    className={`mb-[6px] rounded-[4px] px-[16px] py-[8px] text-[10px] font-[Inter-Bold] text-white transition-colors cursor-pointer bg-[#ba0000] border border-[#700000] ${canBulkRemove ? '' : ''
                                        }`}
                                >
                                    Remove Bookmark
                                </button>

                                <ul className="divide-y divide-[#E0E0E0] pb-[16px] last:pb-0">
                                    {bookmarks.map((b) => (
                                        <li key={b.id} className="flex items-center justify-between gap-[12px] max-sm:flex-col max-sm:items-start">
                                            <div className='flex items-start gap-[18px] max-sm:flex-wrap'>
                                                <label className="flex cursor-pointer items-center relative">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(b.id)}
                                                        onChange={() => toggleSelect(b.id)}
                                                        className="w-[20px] h-[20px] appearance-none border-2 border-[rgba(143,143,143,0.5)] rounded 
                                         checked:bg-[#fff] checked:border-[#DC0000] cursor-pointer"
                                                    />
                                                    {selectedIds.has(b.id) ? (
                                                        <TickIcon
                                                            className="w-[24px] h-[22px] absolute left-[-2px]"
                                                            fill="#DC0000"
                                                        />
                                                    ) : null}
                                                </label>

                                                <div className="relative h-[48px] w-[48px] shrink-0 overflow-hidden rounded-[4px]">
                                                    {b.logoSrc ? (
                                                        <Image
                                                            src={b.logoSrc}
                                                            alt={b.name || ''}
                                                            fill
                                                            unoptimized
                                                            className="object-contain "
                                                            sizes="48px"
                                                        />
                                                    ) : (
                                                        <Image
                                                            src={clientPlaceholder}
                                                            alt={b.name || ''}
                                                            fill
                                                            className="object-contain "
                                                            sizes="48px"
                                                        />
                                                    )}
                                                </div>

                                                <span className="min-w-0 flex-1 text-[16px] font-[Inter-Medium] leading-snug text-[#23262a]">
                                                    {b.name}
                                                </span>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-[16px]">
                                                {/* <p className="whitespace-nowrap text-[14px] font-[Inter-Bold] text-[#0f5dc4]">
                                                    {b.listingCount} Listings
                                                </p> */}
                                                <button
                                                    type="button"
                                                    onClick={() => removeOne(b.id)}
                                                    disabled={pendingIds.has(b.id)}
                                                    className={`inline-flex cursor-pointer items-center gap-[2px] ${pendingIds.has(b.id) ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                >
                                                    <DeleteIcon className="h-[16px] w-[16px]" fill="#0f5dc4" stroke="#0f5dc4" />
                                                    <p className="text-[14px] font-[Inter-Bold] text-[#0f5dc4]">Delete</p>
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
