'use client'

import React, { useEffect, useState } from 'react'
import { candidateNameApi, savedCandidateNameApi } from '@/utils/api'

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

const SaveSearchModal = ({ open, onClose, onSave, userId }) => {
    const [searchName, setSearchName] = useState('')
    const [selectedCandidateId, setSelectedCandidateId] = useState(null)
    const [nameOptions, setNameOptions] = useState([])
    const [isLoadingNames, setIsLoadingNames] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)

    useEffect(() => {
        if (!open) {
            setSearchName('')
            setSelectedCandidateId(null)
            setNameOptions([])
            setIsLoadingNames(false)
            setIsSaving(false)
            setShowDropdown(false)
        }
    }, [open])

    useEffect(() => {
        if (!open) return
        const query = String(searchName || '').trim()
        if (!query) {
            setNameOptions([])
            setIsLoadingNames(false)
            return
        }

        let cancelled = false
        const timer = window.setTimeout(async () => {
            setIsLoadingNames(true)
            try {
                const response = await candidateNameApi.getCandidateName({ search: query })
                const parsed = parseApiPayload(response?.data)
                const list = Array.isArray(parsed?.data) ? parsed.data : []
                const mapped = list.map((row) => ({
                    id: row?.id,
                    name: String(row?.name || '').trim(),
                })).filter((row) => row.id != null && row.name)
                if (!cancelled) setNameOptions(mapped)
            } catch {
                if (!cancelled) setNameOptions([])
            } finally {
                if (!cancelled) setIsLoadingNames(false)
            }
        }, 300)

        return () => {
            cancelled = true
            window.clearTimeout(timer)
        }
    }, [open, searchName])

    if (!open) return null

    const canSave = Boolean(userId && selectedCandidateId && String(searchName).trim().length > 0 && !isSaving)

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-[rgba(0,0,0,0.45)] p-[16px]">
            <div className="max-sm:w-full w-[440px] overflow-hidden rounded-[6px] bg-white [box-shadow:0px_3px_3px_-2px_rgba(0,0,0,0.1),0px_3px_4px_rgba(0,0,0,0.07),0px_1px_8px_rgba(0,0,0,0.06)]">
                <div className="border-b border-[rgba(143,143,143,0.25)] p-[20px_24px]">
                    <h3 className="text-[20px] font-[Inter-Medium] text-[#23262A]">Save Search</h3>
                </div>

                <div className="border-b border-[rgba(143,143,143,0.25)] p-[20px_24px]">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchName}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 120)}
                            onChange={(e) => {
                                setSearchName(e.target.value)
                                setSelectedCandidateId(null)
                            }}
                            placeholder="Name this search"
                            className="w-full rounded-[8px] border border-[rgba(143,143,143,0.45)] bg-white p-[14px_14px] text-[14px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#a3a6aa] max-sm:text-[14px]"
                        />
                        {showDropdown ? (
                            <div className="absolute left-0 top-[52px] z-20 w-full max-h-[240px] overflow-y-auto overflow-x-hidden rounded-[8px] border border-[rgba(143,143,143,0.2)] bg-white shadow-[0_6px_16px_rgba(0,0,0,0.12)] py-[4px]">
                                {isLoadingNames ? (
                                    <div className="px-[14px] py-[10px]">
                                        <div className="h-[12px] w-[70%] animate-pulse rounded bg-[#eef1f4]" />
                                    </div>
                                ) : nameOptions.length > 0 ? (
                                    nameOptions.map((option) => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault()
                                                setSearchName(option.name)
                                                setSelectedCandidateId(option.id)
                                                setShowDropdown(false)
                                            }}
                                            className="flex w-full cursor-pointer items-center px-[14px] py-[10px] text-left text-[14px] font-[Inter-Regular] text-[#23262A] transition hover:bg-[#e0000014]"
                                        >
                                            {option.name}
                                        </button>
                                    ))
                                ) : (
                                    <p className="px-[14px] py-[10px] text-[12px] font-[Inter-Regular] text-[#23262A]">
                                        No data found
                                    </p>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-[8px] p-[10px_8px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-[6px] border border-[rgba(143,143,143,0.6)] bg-white p-[8px_22px] text-[14px] font-[Inter-SemiBold] text-[#23262A] max-sm:text-[14px]"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={!canSave}
                        onClick={async () => {
                            if (!canSave) return
                            setIsSaving(true)
                            try {
                                await savedCandidateNameApi.savedCandidateName({
                                    user_id: userId,
                                    job_info_id: selectedCandidateId,
                                    full_name: searchName.trim(),
                                })
                                onSave?.(searchName.trim())
                                onClose?.()
                            } catch (e) {
                                console.error('Failed to save candidate name:', e)
                            } finally {
                                setIsSaving(false)
                            }
                        }}
                        className={`rounded-[6px] p-[8px_22px] text-[14px] font-[Inter-SemiBold] max-sm:text-[14px] ${canSave
                            ? 'cursor-pointer border border-[#DC0000] bg-[#DC0000] text-white'
                            : 'cursor-not-allowed border border-[#d1d5db] bg-[#e5e7eb] text-[#9ca3af]'
                            }`}
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SaveSearchModal
