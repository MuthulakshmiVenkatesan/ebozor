'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useSelector } from 'react-redux'
import { SearchIcon, FormDownArrowIcon, DeleteIcon } from '@/components/CustomFile/icons'
import savedsearch from '../../../../../public/assets/img/jobdashboard/savedsearch.svg'
import { getSavedCandidateNameApi, savedCandidateNameApi } from '@/utils/api'
import { rootSignupData, userSignUpData } from '@/redux/reuducer/authSlice'

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

function SavedSearchSkeleton() {
    return (
        <div className="flex flex-col gap-[12px]">
            {Array.from({ length: 3 }).map((_, idx) => (
                <div
                    key={`saved-search-skeleton-${idx}`}
                    className="rounded-[6px] bg-white p-[24px] animate-pulse [box-shadow:0px_3px_3px_-2px_rgba(0,0,0,0.1),0px_3px_4px_rgba(0,0,0,0.07),0px_1px_8px_rgba(0,0,0,0.06)]"
                >
                    <div className="h-[14px] w-[220px] rounded bg-[#eef1f4] mb-[10px]" />
                    <div className="h-[12px] w-[180px] rounded bg-[#eef1f4]" />
                </div>
            ))}
        </div>
    )
}


const SavedSearch = () => {
    const userData = useSelector(userSignUpData)
    const authRoot = useSelector(rootSignupData)
    const [nameQuery, setNameQuery] = useState('')
    const [sortBy, setSortBy] = useState('latest_first')
    const [sortOpen, setSortOpen] = useState(false)
    const [savedSearches, setSavedSearches] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const SORT_OPTIONS = [
        { value: 'latest_first', label: 'Latest first' },
        { value: 'oldest_first', label: 'Oldest first' },
    ]
    const selectedSortLabel = SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label || 'Latest first'
    const resolvedUserId = useMemo(
        () =>
            userData?.id ??
            userData?.data?.id ??
            userData?.user?.id ??
            authRoot?.data?.id ??
            authRoot?.data?.data?.id ??
            authRoot?.data?.user?.id ??
            null,
        [userData?.id, userData?.data?.id, userData?.user?.id, authRoot?.data?.id, authRoot?.data?.data?.id, authRoot?.data?.user?.id]
    )
    const filteredSearches = useMemo(() => {
        const query = String(nameQuery || '').trim().toLowerCase()
        const base = savedSearches.filter((item) =>
            query ? String(item?.name || '').toLowerCase().includes(query) : true
        )
        if (sortBy === 'oldest_first') {
            return [...base].sort((a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0))
        }
        return [...base].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
    }, [nameQuery, savedSearches, sortBy])

    useEffect(() => {
        const userId = resolvedUserId
        if (!userId) {
            setSavedSearches([])
            setIsLoading(false)
            return
        }

        let cancelled = false
        const run = async () => {
            setIsLoading(true)
            try {
                const response = await getSavedCandidateNameApi.getSavedCandidateName({
                    user_id: userId,
                    filter: sortBy,
                })
                const parsed = parseApiPayload(response?.data)
                const list = Array.isArray(parsed?.data) ? parsed.data : []
                const mapped = list.map((item) => ({
                    id: item?.id,
                    name: String(item?.full_name || '').trim() || 'N / A',
                    createdAt: new Date().toISOString(),
                }))
                if (!cancelled) setSavedSearches(mapped)
            } catch {
                if (!cancelled) setSavedSearches([])
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [resolvedUserId, sortBy])

    const handleDeleteSavedSearch = async (searchId) => {
        if (!resolvedUserId) return
        try {
            await savedCandidateNameApi.savedCandidateName({
                user_id: resolvedUserId,
                type: 'delete',
                saved_search_id: searchId,
            })
            setSavedSearches((prev) => prev.filter((item) => String(item.id) !== String(searchId)))
        } catch (e) {
            console.error('Failed to delete saved candidate name:', e)
        }
    }

    return (
        <div className="p-[0px_24px]">
            <div className="mb-[24px] ">
                <div>
                    <h1 className="text-[20px] font-[Inter-Medium] leading-tight text-[#141414]">Saved Searches</h1>
                </div>
                <div className='flex items-center gap-[10px] justify-between'>
                    <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
                        <span className="font-[Inter-SemiBold]">{filteredSearches.length}</span> Saved {filteredSearches.length === 1 ? 'Search' : 'Searches'}
                    </p>
                    <div className="flex w-full flex-col gap-[10px] sm:flex-row sm:items-center sm:justify-end lg:w-auto lg:min-w-[420px]">
                        <div className="relative w-full min-w-0 lg:max-w-[280px] lg:flex-1">
                            <input
                                type="search"
                                value={nameQuery}
                                onChange={(e) => setNameQuery(e.target.value)}
                                placeholder="Search by name"
                                className="w-full rounded-[6px] border border-[rgba(143,143,143,0.35)] bg-white p-[10px_12px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#8F8F8F]"
                            />
                            <div className="pointer-events-none absolute right-[12px] rtl:left-[12px] rtl:right-auto top-1/2 -translate-y-1/2">
                                <SearchIcon className="h-[18px] w-[18px] text-[#8F8F8F]" stroke="#23262A" />
                            </div>
                        </div>
                        <div className="relative w-full sm:w-[180px]">
                            <button
                                type="button"
                                onClick={() => setSortOpen((prev) => !prev)}
                                className="flex w-full cursor-pointer items-center justify-between rounded-[6px] border border-[rgba(143,143,143,0.35)] p-[10px_12px] outline-none"
                            >
                                <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{selectedSortLabel}</p>
                                <FormDownArrowIcon className={`h-[18px] w-[18px] text-[#6b7280] transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {sortOpen ? (
                                <div className="absolute right-0 top-[48px] z-20 w-full overflow-hidden rounded-[8px] border border-[rgba(143,143,143,0.2)] bg-white shadow-[0_6px_16px_rgba(0,0,0,0.12)] py-[4px]">
                                    {SORT_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => {
                                                setSortBy(option.value)
                                                setSortOpen(false)
                                            }}
                                            className={`flex w-full cursor-pointer items-center px-[14px] py-[10px] text-left text-[14px] font-[Inter-Regular] text-[#23262A] transition ${sortBy === option.value ? 'bg-[#e0000014]' : 'bg-white hover:bg-[#e0000014]'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <SavedSearchSkeleton />
            ) : filteredSearches.length > 0 ? (
                <div className="flex flex-col gap-[12px]">
                    {filteredSearches.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between rounded-[6px] bg-white p-[24px] [box-shadow:0px_3px_3px_-2px_rgba(0,0,0,0.1),0px_3px_4px_rgba(0,0,0,0.07),0px_1px_8px_rgba(0,0,0,0.06)]"
                        >
                            <div className="flex flex-col gap-[10px]">
                                <h4 className="text-[14px] font-[Inter-SemiBold] text-[#23262A]">{item.name}</h4>
                                <p className="text-[12px] font-[Inter-Regular] text-[#23262A]">
                                    Saved on {new Date(item.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteSavedSearch(item.id)}
                                    className="inline-flex w-full cursor-pointer items-center justify-center gap-[8px] rounded-[6px] border border-[#DC0000] bg-white p-[8px_50px] transition "
                                >
                                    <DeleteIcon className="w-[16px] h-[16px]" stroke='#DC0000' />
                                    <p className="leading-[24px] text-[14px] font-[Inter-SemiBold] text-[#DC0000]">Delete</p>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-[6px]  bg-white p-[24px] [box-shadow:0px_4px_8px_-2px_rgba(0,0,0,0.02),0px_3px_8px_rgba(0,0,0,0.02),0px_1px_10px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center">
                    <div>
                        <Image src={savedsearch} alt="savedsearch" className="h-[350px] w-[550px]" />
                    </div>
                    <p className="mb-[4px] text-center text-[14px] font-[Inter-Regular] text-[#464c55]">
                        We could not find anything that quite matches your search.
                    </p>
                    <p className="text-center text-[14px] font-[Inter-Regular] text-[#464c55]">
                        Please refine your search using the filters above.
                    </p>
                </div>
            )}
        </div>
    )
}

export default SavedSearch
