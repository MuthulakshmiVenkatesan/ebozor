/* eslint-disable react/prop-types */
'use client'

import React, { useEffect, useRef, useState } from 'react'
import { MoreIcon } from '@/components/CustomFile/icons'
import Image from 'next/image'
import favourites from '../../../../../public/assets/img/favourites.png'
import CreateListModal from './CreateListModal'
import ListCreatedModal from './ListCreatedModal'
import SelectAdsModal from './SelectAdsModal'
import InviteCollaboratorsModal from './InviteCollaboratorsModal'
import DeleteListConfirmModal from './DeleteListConfirmModal'
import { createFavouriteListingApi, getFavouriteApi, getFavouriteListingApi } from '@/utils/api'
import { useSelector } from 'react-redux'
import { userSignUpData } from '@/redux/reuducer/authSlice'
import { store } from '@/redux/store'

const FavouriteListsPanel = ({ lists, activeListIndex, onSelectList, onListsChange, refreshKey = 0 }) => {
    const [openMenuIndex, setOpenMenuIndex] = useState(null)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isCreatedOpen, setIsCreatedOpen] = useState(false)
    const [isSelectAdsOpen, setIsSelectAdsOpen] = useState(false)
    const [isSelectAdsLoading, setIsSelectAdsLoading] = useState(false)
    const [isInviteOpen, setIsInviteOpen] = useState(false)
    const [renameIndex, setRenameIndex] = useState(null)
    const [deleteIndex, setDeleteIndex] = useState(null)
    const [dynamicLists, setDynamicLists] = useState(lists || [])
    const [allFavouriteItems, setAllFavouriteItems] = useState([])
    const panelRef = useRef(null)
    const userData = useSelector(userSignUpData)
    const resolveUserId = () => {
        const storeUser = store.getState()?.UserSignup?.data?.data
        return userData?.id || userData?.user_id || storeUser?.id || storeUser?.user_id
    }

    const fetchFavouriteListings = async () => {
        try {
            const userId = resolveUserId()
            if (!userId) return

            const response = await getFavouriteListingApi.getFavouriteListing({ user_id: userId })
            const listings = response?.data?.data?.listings || []

            const normalizedListings = listings.map((item, index) => ({
                favouritelisting_id: item?.favouritelisting_id ?? null,
                name: item?.title || '',
                count: Number(item?.count || 0),
                image: item?.latest_item?.image || '',
                isDefault: index === 0
            }))

            setDynamicLists(normalizedListings)
            if (typeof onListsChange === 'function') onListsChange(normalizedListings)
        } catch (error) {
            console.log(error)
        }
    }

    const parseApiPayload = (payload) => {
        if (typeof payload !== 'string') return payload
        const scriptTagIndex = payload.indexOf('<script')
        const safeJson = scriptTagIndex >= 0 ? payload.slice(0, scriptTagIndex) : payload
        try {
            return JSON.parse(safeJson)
        } catch (error) {
            console.log('Favourite item parse error:', error)
            return {}
        }
    }

    const fetchAllFavouriteItems = async () => {
        try {
            const response = await getFavouriteApi.getFavouriteApi({ page: 1 })
            const parsed = parseApiPayload(response?.data)
            const items = parsed?.data?.data || []
            const normalizedItems = Array.isArray(items)
                ? items.map((item) => ({
                    id: item?.id,
                    image: item?.image || '',
                    price: item?.price ? `AED ${item.price}` : '',
                    name: item?.title || item?.name || '',
                }))
                : []
            setAllFavouriteItems(normalizedItems)
        } catch (error) {
            console.log(error)
            setAllFavouriteItems([])
        }
    }

    useEffect(() => {
        const onDocMouseDown = (e) => {
            if (!panelRef.current) return
            if (!panelRef.current.contains(e.target)) {
                setOpenMenuIndex(null)
            }
        }
        document.addEventListener('mousedown', onDocMouseDown)
        return () => document.removeEventListener('mousedown', onDocMouseDown)
    }, [])

    useEffect(() => {
        fetchFavouriteListings()
    }, [userData?.data?.id, userData?.id])

    useEffect(() => {
        if (!refreshKey) return
        fetchFavouriteListings()
    }, [refreshKey])

    useEffect(() => {
        if (!dynamicLists?.length && lists?.length) {
            setDynamicLists(lists)
        }
    }, [lists, dynamicLists?.length])

    const renderLists = dynamicLists?.length ? dynamicLists : lists
    const shouldOpenMenuUp = (idx) => idx >= Math.max(renderLists.length - 2, 0)

    return (
        <div ref={panelRef} className="h-fit bg-white border border-[rgba(143,143,143,0.24)] rounded-[12px] ">
            <div className="flex items-center justify-between p-[16px_12px] border-b border-[rgba(143,143,143,0.36)]">
                <h5 className="text-[16px] font-[Inter-Medium] text-[#000]">
                    Favorite Lists
                </h5>
                <button
                    type="button"
                    onClick={() => setIsCreateOpen(true)}
                    className="text-[12px] font-[Inter-Medium] text-[#000000CC] cursor-pointer"
                >
                    + Create a List
                </button>
            </div>
            <div className="flex flex-col max-h-[520px] overflow-y-auto">
                {renderLists.map((l, idx) => (
                    <button
                        key={`${l.name}-${idx}`}
                        type="button"
                        onClick={() => onSelectList(idx)}
                        className={`w-full bg-[rgba(143,143,143,0.06)] text-left p-[16px] border-l border-l-[6px] rtl:border-r rtl:border-r-[6px] rtl:border-l-0 flex items-end justify-between cursor-pointer ${activeListIndex === idx
                            ? 'border-[#DC0000]'
                            : 'border-[rgba(143,143,143,0.06)]'
                            }`}
                    >
                        <div className="flex items-center gap-[10px]">
                            <div className="flex-shrink-0">
                                <Image
                                    src={l?.image || favourites}
                                    alt={l?.name || 'favourite-list'}
                                    width={110}
                                    height={80}
                                    unoptimized={typeof l?.image === 'string' && (l.image.startsWith('http://') || l.image.startsWith('https://'))}
                                    className="w-[100px] h-[80px] object-cover rounded-[8px]"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-[8px] mb-[4px]">
                                    <h4 className="text-[14px] font-[Inter-Medium] text-[#000] truncate">
                                        {l.name}
                                    </h4>
                                    {l.isDefault ? (
                                        <p className="text-[10px] font-[Inter-Medium] text-[#fff] bg-[#3A88EF] p-[2px_8px] rounded-full">
                                            Default
                                        </p>
                                    ) : null}
                                </div>
                                <p className="text-[12px] font-[Inter-Regular] text-[#000] mb-[8px]">
                                    {l.count} Saved Ads
                                </p>
                                <p className="text-[12px] font-[Inter-Medium] text-[#000000CC]">
                                    Private
                                </p>
                            </div>
                        </div>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    setOpenMenuIndex((prev) => (prev === idx ? null : idx))
                                }}
                                className="w-[28px] h-[28px] rounded-[6px] hover:bg-black/5 flex items-center justify-center cursor-pointer"
                            >
                                <MoreIcon className="w-[16px] h-[16px]" />
                            </button>

                            {openMenuIndex === idx ? (
                                <div
                                    className={`absolute end-0 w-[140px] bg-white rounded-[12px] shadow-[0_10px_24px_rgba(0,0,0,0.12)] border border-black/5 overflow-hidden z-[30] ${shouldOpenMenuUp(idx) ? 'bottom-[32px]' : 'top-[32px]'}`}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        e.preventDefault()
                                    }}
                                >
                                    {['Share list', 'Rename list', 'Delete list'].map((label, i) => (
                                        <button
                                            key={label}
                                            type="button"
                                            className={`text-[#000000B2] w-full text-left p-[12px] text-[14px] font-[Inter-Medium] cursor-pointer hover:bg-black/5 ${i !== 2 ? 'border-b border-black/5' : ''
                                                }`}
                                            onClick={() => {
                                                if (label === 'Share list') {
                                                    setIsInviteOpen(true)
                                                    onSelectList(idx)
                                                }
                                                if (label === 'Rename list') {
                                                    setRenameIndex(idx)
                                                }
                                                if (label === 'Delete list') {
                                                    setDeleteIndex(idx)
                                                }
                                                setOpenMenuIndex(null)
                                            }}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </button>
                ))}
            </div>

            <CreateListModal
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onCreate={async (name) => {
                    try {
                        const userId = resolveUserId()
                        if (!userId || !name?.trim()) return

                        await createFavouriteListingApi.createFavouriteListing({
                            user_id: userId,
                            listing_name: name.trim()
                        })

                        await fetchFavouriteListings()
                        setIsCreatedOpen(true)
                    } catch (error) {
                        console.log(error)
                    }
                }}
            />

            <CreateListModal
                open={renameIndex !== null}
                onClose={() => setRenameIndex(null)}
                title="Rename list"
                description="Favorite lists help to keep saved ads organised"
                confirmLabel="Save"
                initialValue={renameIndex !== null ? (renderLists?.[renameIndex]?.name || '') : ''}
                onCreate={async (newName) => {
                    try {
                        const userId = resolveUserId()
                        const listingId = renameIndex !== null ? renderLists?.[renameIndex]?.favouritelisting_id : null
                        if (!userId || !listingId || !newName?.trim()) return

                        await createFavouriteListingApi.createFavouriteListing({
                            user_id: userId,
                            listing_id: listingId,
                            listing_name: newName.trim()
                        })
                        await fetchFavouriteListings()
                    } catch (error) {
                        console.log(error)
                    } finally {
                        setRenameIndex(null)
                    }
                }}
            />

            <ListCreatedModal
                open={isCreatedOpen}
                onClose={() => setIsCreatedOpen(false)}
                onSelectAds={() => {
                    setIsSelectAdsLoading(true)
                    setAllFavouriteItems([])
                    setIsCreatedOpen(false)
                    setIsSelectAdsOpen(true)
                    fetchAllFavouriteItems().finally(() => {
                        setIsSelectAdsLoading(false)
                    })
                }}
                onInvite={() => {
                    setIsCreatedOpen(false)
                    setIsInviteOpen(true)
                }}
            />

            <SelectAdsModal
                open={isSelectAdsOpen}
                onClose={() => setIsSelectAdsOpen(false)}
                isLoading={isSelectAdsLoading}
                items={allFavouriteItems}
                onAddToList={(ids) => {
                    // TODO: connect API for adding selected ads into the created list
                    console.log('Add to list selected ids:', ids)
                }}
            />

            <InviteCollaboratorsModal
                open={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
                // onShareViewOnly={() => {
                //     setIsInviteOpen(false)
                //     setIsShareLinkOpen(true)
                // }}
                onInvite={() => {
                    // TODO: invite collaborators
                    console.log('Invite collaborators')
                }}
            />


            <DeleteListConfirmModal
                open={deleteIndex !== null}
                onClose={() => setDeleteIndex(null)}
                onConfirm={async () => {
                    try {
                        const userId = resolveUserId()
                        const listingId = deleteIndex !== null ? renderLists?.[deleteIndex]?.favouritelisting_id : null
                        if (!userId || !listingId) return

                        await createFavouriteListingApi.createFavouriteListing({
                            user_id: userId,
                            listing_id: listingId,
                            type: 'delete'
                        })
                        await fetchFavouriteListings()
                    } catch (error) {
                        console.log(error)
                    } finally {
                        setDeleteIndex(null)
                    }
                }}
            />
        </div>
    )
}

export default FavouriteListsPanel

