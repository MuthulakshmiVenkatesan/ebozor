'use client'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { SearchIcon, ShareIcon, NotificationIcon, DownArrowIcon, MoreIcon, SortArrowIcon } from '@/components/CustomFile/icons'
import SharePopup from './components/SharePopup'
import NotificationSettingsPopup from './components/NotificationSettingsPopup'
import RenameSearchModal from './components/RenameSearchModal'
import search1 from '../../../../public/assets/img/search/1.png'
import search2 from '../../../../public/assets/img/search/2.png'
import search3 from '../../../../public/assets/img/search/3.png'
import search from '../../../../public/assets/img/search.png'
import car from '../../../../public/assets/img/car.png'
import { isLogin } from '@/utils'
import { getDefaultMysearchShareUrl } from '@/utils/siteUrl'
import { savedSearchApi } from '@/utils/api'
import toast from 'react-hot-toast'

const tabs = [
    'All',
    'Classified',
    'Motors',
    'Jobs',
    'Property for Rent',
    'Property for Sale',
    'Community',
]

const defaultCategorySuggestions = [
    'Motors',
    'Property for Rent',
    'Property for Sale',
    'Classifieds',
    'Furniture & Garden',
    'Mobile & Tablet',
    'Jobs',
    'Community',
]

const Mysearch = () => {

    const [activeTab, setActiveTab] = useState('All')
    const [openMenuIndex, setOpenMenuIndex] = useState(null)
    const [isSortOpen, setIsSortOpen] = useState(false)
    const [sortLabel, setSortLabel] = useState('Searches recently viewed')
    const [sharePopupOpen, setSharePopupOpen] = useState(null) // null = closed, index = open for that row
    const [notificationPopupIndex, setNotificationPopupIndex] = useState(null)
    const [savedSearches, setSavedSearches] = useState([]) // [] => show empty state, non-empty => show list
    const [parentCategories, setParentCategories] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [renameTarget, setRenameTarget] = useState(null)
    const [isRenaming, setIsRenaming] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const defaultShareUrl = getDefaultMysearchShareUrl()
    const activeRenameItem = renameTarget

    useEffect(() => {
        if (!isLogin()) return

        const fetchSavedSearches = async () => {
            try {
                setIsLoading(true)
                const response = await savedSearchApi.getSavedSearches({ page: 1 })
                const payload = response?.data
                setSavedSearches(payload?.data?.data || [])
                setParentCategories(payload?.parent_category || [])
            } catch (error) {
                console.error('Failed to fetch saved searches', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchSavedSearches()
    }, [])

    const categoriesToShow = parentCategories?.length ? parentCategories : defaultCategorySuggestions
    const tabItems = parentCategories?.length
        ? [
            {
                name: 'All',
                count: parentCategories.reduce((sum, cat) => sum + (Number(cat?.count) || 0), 0),
                id: 'all',
            },
            ...parentCategories.map((cat) => ({
                name: cat?.name,
                count: cat?.count,
                id: cat?.id || cat?.name,
            }))
        ]
        : tabs.map((name) => ({ name, count: 0, id: name }))

    const activeCategoryId = parentCategories.find((cat) => cat?.name === activeTab)?.id
    const filteredSearches = savedSearches.filter((item) =>
        activeCategoryId ? item?.parent_category_id === activeCategoryId : true
    )

    const findCategoryName = (id) => parentCategories.find((cat) => cat?.id === id)?.name

    const getSearchHref = (row) => {
        const raw = String(row?.search_url || '').trim()
        if (!raw) return '/products'
        try {
            const isAbsolute = /^https?:\/\//i.test(raw)
            const parsed = new URL(raw, isAbsolute ? undefined : 'http://localhost')
            const query = parsed.searchParams.toString()
            return query ? `/products?${query}` : '/products'
        } catch (e) {
            const idx = raw.indexOf('?')
            if (idx >= 0) {
                const query = raw.slice(idx + 1).trim()
                return query ? `/products?${query}` : '/products'
            }
            return '/products'
        }
    }

    const formatDate = (value) => {
        if (!value) return ''
        const d = new Date(value)
        if (Number.isNaN(d.getTime())) return ''
        return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    }

    const handleRenameSearch = async (title) => {
        if (!activeRenameItem?.id || !title) return
        try {
            setIsRenaming(true)
            await savedSearchApi.editSavedSearch({ id: activeRenameItem.id, title })
            setSavedSearches((prev) =>
                prev.map((item) => (
                    item?.id === activeRenameItem.id ? { ...item, title } : item
                ))
            )
            toast.success('Saved search renamed successfully')
            setRenameTarget(null)
            setOpenMenuIndex(null)
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to rename saved search')
        } finally {
            setIsRenaming(false)
        }
    }

    const handleDeleteSearch = async (id) => {
        if (!id) return
        try {
            setDeletingId(id)
            await savedSearchApi.deleteSavedSearch({ id })
            setSavedSearches((prev) => prev.filter((item) => item?.id !== id))
            toast.success('Saved search deleted successfully')
            setOpenMenuIndex(null)
            if (activeRenameItem?.id === id) {
                setRenameTarget(null)
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to delete saved search')
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <>
            <div className="w-full mx-auto">
                <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
                    <div className="mb-[30px]">
                        <h4 className="text-[#000] text-[20px] font-[Inter-Bold]">My Saved Searches</h4>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-[24px] mb-[30px] overflow-x-auto whitespace-nowrap flex-nowrap hide_scrollbar" >
                        {tabItems.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.name)}
                                className={`flex items-center gap-[8px] relative p-[15px_20px] border-b cursor-pointer whitespace-nowrap ${activeTab === tab.name ? 'border-[#DC0000]' : 'border-[#fff]'
                                    }`}
                            >
                                <p className={`text-[14px] font-[Inter-Medium] ${activeTab === tab.name ? 'text-[#000]' : 'text-[#8F8F8F] '}`}>{tab.name}</p>
                                <span className='w-[20px] h-[20px] rounded-[2px] bg-[#F5F5F5] text-[#8F8F8F] text-[12px] font-[Inter-Regular] flex items-center justify-center'>{Number(tab.count) || 0}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-[40px]">
                            <p className="text-[14px] font-[Inter-Regular] text-[#8F8F8F]">Loading saved searches...</p>
                        </div>
                    ) : savedSearches.length === 0 ? (
                        // Empty state
                        <div className="">
                            <div className="flex items-end justify-between w-full mb-[30px] max-sm:flex-col">
                                <div className="">
                                    <div className='mb-[20px]'>
                                        <h3 className="text-[20px] font-[Inter-Medium] text-[#000] mb-[4px]">
                                            You Have No Saved Searches Yet
                                        </h3>
                                        <p className="text-[16px] font-[Inter-Medium] text-[#000]">
                                            Saving a search helps you find your item faster.
                                        </p>
                                    </div>
                                    <ul className="flex flex-col gap-[40px]">
                                        <li className='text-[14px] font-[Inter-Regular] text-[#000000CC]'>1. searching an item</li>
                                        <li className='text-[14px] font-[Inter-Regular] text-[#000000CC]'>2. Select Save Search</li>
                                        <li className='text-[14px] font-[Inter-Regular] text-[#000000CC]'>3. Return back to your search anytime using My Searches</li>
                                    </ul>
                                </div>
                                <div className="flex-1 flex justify-end min-w-[220px]">
                                    <Image
                                        src={search}
                                        alt="No saved searches illustration"
                                        className="max-w-[260px] w-full h-auto object-contain"
                                    />
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[14px] font-[Inter-Medium] text-[#000000] mb-[8px]">
                                    Start Searching
                                </h4>
                                <div className="flex flex-wrap gap-[8px]">
                                    {categoriesToShow.map((category) => {
                                        const label = typeof category === 'string' ? category : category?.name
                                        const imageSrc = typeof category === 'string' ? car : category?.image || car
                                        const key = typeof category === 'string' ? category : category?.id || category?.name

                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                className="flex items-center gap-[8px] p-[8px_12px] border border-[rgba(143,143,143,0.24)] rounded-[8px] cursor-pointer"
                                            >
                                                <Image src={imageSrc} alt="category" width={22} height={22} className="w-[22px] h-[22px] object-contain" />
                                                <p className='text-[14px] font-[Inter-Medium] text-[#000000CC] hover:text-[#DC0000] hover:underline'> {label}</p>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* Search + Sort */}
                            {/* <div className="flex items-center justify-between gap-[16px] mb-[24px] max-sm:flex-col max-sm:items-stretch">
                                <div className="">
                                    <div className="w_full max-sm:w-full w-[480px] rounded-[6px] border border-[rgba(0,0,0,0.50)] bg-[#fff] flex items-center gap-[10px] p-[14px_20px]">
                                        <SearchIcon className="w-[24px] h-[24px]" />
                                        <input
                                            type="text"
                                            placeholder="Find your saved search"
                                            className="text-[#00] outline-none border-none shadow-none focus:outline-none focus:border-none bg-transparent text-[14px] font-[Inter-Regular] placeholder:text-[#8F8F8F]"
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsSortOpen((prev) => !prev)}
                                        className="p-[12px] rounded-[6px] border border-[rgba(0,0,0,0.50)] bg-white flex items-center gap-[8px] text-[12px] font-[Inter-Medium] text-[#000] cursor-pointer"
                                    >

                                        <div className='flex-col flex items-center gap-[4px]'>
                                            <SortArrowIcon className="rotate-180" stroke="#00000099" />
                                            <SortArrowIcon className="" stroke="#00000099" />
                                        </div>
                                        <p className='text-[14px] font-[Inter-Regular] text-[rgba(0,0,0,0.75]'>Sort : <span className='text-[#000]'>{sortLabel}</span></p>
                                    </button>
                                    {isSortOpen && (
                                        <div className="absolute right-0 mt-[8px] w-[260px] bg-white rounded-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-[20] ">
                                            {[
                                                'Searches recently viewed',
                                                'Searches recently saved',
                                                'Searches with new ads first',
                                            ].map((option) => (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    onClick={() => {
                                                        setSortLabel(option)
                                                        setIsSortOpen(false)
                                                    }}
                                                    className={`cursor-pointer w-full text-left p-[12px] text-[14px]  ${sortLabel === option
                                                        ? 'text-[#000] font-[Inter-Medium]'
                                                        : 'text-[#8F8F8F] font-[Inter-Regular]'
                                                        } hover:bg-[#F5F5F5]`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div> */}
                            { /* List */}
                            <div className="flex flex-col gap-[12px] mb-[30px]">
                                {filteredSearches.length === 0 ? (
                                    <div className="w-full rounded-[12px] bg-[rgba(143,143,143,0.06)] p-[20px] text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
                                        No saved searches in this category yet.
                                    </div>
                                ) : (
                                    filteredSearches.map((item, idx) => {
                                        const images = Array.isArray(item?.photos) && item.photos.length > 0
                                            ? item.photos.slice(0, 3)
                                            : []
                                        const city =
                                            item?.city ||
                                            item?.location ||
                                            ''
                                        const savedOn = formatDate(item?.created_at)
                                        const categoryName = findCategoryName(item?.parent_category_id)

                                        const href = getSearchHref(item)
                                        return (
                                            <Link
                                                key={item?.id || idx}
                                                href={href}
                                                className="hover:bg-[#fff] hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] cursor-pointer w-full rounded-[12px] bg-[rgba(143,143,143,0.06)] p-[20px] flex items-center justify-between gap-[16px]  max-sm:flex-col"
                                            >
                                                <div className="flex-1">
                                                    <div className='flex items-center gap-[4px] mb-[4px]'>
                                                        {Array.isArray(item?.category_hierarchy) && item.category_hierarchy.length > 0 ? (
                                                            item.category_hierarchy.map((category, categoryIdx) => (
                                                                <React.Fragment key={`${category?.id || categoryIdx}`}>
                                                                    {categoryIdx > 0 && <div className='bg-[#000000CC] p-[2px] rounded-full'></div>}
                                                                    <h4 className="text-[14px] font-[Inter-Regular] text-[#000000CC]">
                                                                        {category?.name}
                                                                    </h4>
                                                                </React.Fragment>
                                                            ))
                                                        ) : (
                                                            <h4 className="text-[14px] font-[Inter-Regular] text-[#000000CC]">
                                                                {categoryName || 'Saved Search'}
                                                            </h4>
                                                        )}
                                                    </div>
                                                    <h3 className="text-[14px] font-[Inter-SemiBold] text-[#000000CC] mb-[4px]">
                                                        {item?.title} ({item?.total_listing_count || 0})
                                                    </h3>
                                                    {city && (
                                                        <p className="text-[12px] font-[Inter-Regular] text-[#000000] mb-[10px]">
                                                            {city}
                                                        </p>
                                                    )}
                                                    <p className="text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
                                                        {savedOn ? `Saved on ${savedOn}` : ''}
                                                    </p>

                                                </div>

                                                <div className="flex flex-col items-end gap-[10px]">
                                                    {images.length > 0 && (
                                                        <div className="flex relative flex-shrink-0 min-w-[80px] min-h-[80px]">
                                                            {images.map((imgSrc, imageIdx) => {
                                                                const positions = ['end-[78px] z-[1]', 'end-[38px]', 'end-0']
                                                                return (
                                                                    <Image
                                                                        key={imageIdx}
                                                                        src={imgSrc}
                                                                        alt="Saved search"
                                                                        width={80}
                                                                        height={80}
                                                                        className={`w-[80px] h-[80px] object-cover absolute top-0 ${positions[imageIdx] || 'right-0'} border-[2px] border-[#fff]`}
                                                                    />
                                                                )
                                                            })}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-[20px] max-sm:flex-wrap">
                                                        {/* <div
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                setNotificationPopupIndex(idx)
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault()
                                                                    e.stopPropagation()
                                                                    setNotificationPopupIndex(idx)
                                                                }
                                                            }}
                                                            className="cursor-pointer flex items-center gap-[2px]"
                                                        >
                                                            <div className="flex items-center gap-[8px]">
                                                                <NotificationIcon className="w-[16px] h-[16px]" />
                                                                <p className='text-[14px] font-[Inter-Regular] text-[#000]'>
                                                                    {item?.notification ? 'Notification: On' : 'Notification: Off'}
                                                                </p>
                                                            </div>
                                                            <DownArrowIcon className="w-[16px] h-[16px]" stroke="#00000099" />
                                                        </div>
                                                        <div
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                setSharePopupOpen(idx)
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault()
                                                                    e.stopPropagation()
                                                                    setSharePopupOpen(idx)
                                                                }
                                                            }}
                                                            className="cursor-pointer flex items-center gap-[8px] text-[12px] font-[Inter-Medium] text-[#8F8F8F] cursor-pointer"
                                                        >
                                                            <ShareIcon className="w-[16px] h-[16px]" />
                                                            <p className='text-[14px] font-[Inter-Regular] text-[#000]'>Share</p>
                                                        </div> */}
                                                        <div
                                                            className='relative cursor-pointer'
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                setOpenMenuIndex((prev) => (prev === idx ? null : idx))
                                                            }}
                                                        >
                                                            <MoreIcon className="w-[16px] h-[16px]" />
                                                            {openMenuIndex === idx && (
                                                                <div className="absolute end-0 top-full mt-1 w-[150px] bg-white border border-[rgba(143,143,143,0.16)] rounded-[4px] z-[10000]">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.preventDefault()
                                                                            e.stopPropagation()
                                                                            setRenameTarget(item)
                                                                        }}
                                                                        type="button"
                                                                        className="cursor-pointer w-full text-left p-[16px] text-[14px] font-[Inter-Regular] text-[#000] hover:bg-[#F5F5F5] border-b border-[rgba(143,143,143,0.16)]"
                                                                    >
                                                                        Rename Search
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.preventDefault()
                                                                            e.stopPropagation()
                                                                            handleDeleteSearch(item?.id)
                                                                        }}
                                                                        disabled={deletingId === item?.id}
                                                                        className="cursor-pointer w-full text-left p-[16px] text-[14px] font-[Inter-Regular] text-[#000] hover:bg-[#F5F5F5]"
                                                                    >
                                                                        {deletingId === item?.id ? 'Deleting...' : 'Delete'}
                                                                    </button>
                                                                </div>
                                                            )}

                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            <SharePopup
                isOpen={sharePopupOpen !== null}
                onClose={() => setSharePopupOpen(null)}
                shareUrl={defaultShareUrl}
                title="My Saved Search"
            />

            <NotificationSettingsPopup
                isOpen={notificationPopupIndex !== null}
                onClose={() => setNotificationPopupIndex(null)}
                searchCategory="Motor . Usedcar "
                searchName="My Used Cars search"
                newAdsCount={4567}
                thumbnail={search1}
            />

            <RenameSearchModal
                isOpen={!!activeRenameItem}
                onClose={() => setRenameTarget(null)}
                searchCategory={activeRenameItem?.category || 'Motors • Boats'}
                renameItem={activeRenameItem}
                initialName={activeRenameItem?.name || 'My Boats Search'}
                isSubmitting={isRenaming}
                onUpdate={handleRenameSearch}
            />
        </>
    )
}

export default Mysearch