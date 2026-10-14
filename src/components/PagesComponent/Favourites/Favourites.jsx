"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { isLogin, t } from "@/utils";
import { getFavouriteApi, manageFavouriteApi } from "@/utils/api";
import { userSignUpData } from "@/redux/reuducer/authSlice";
import { useSelector } from "react-redux";
import Emptydata from "./components/Emptydata";
import ProductCardSkeleton from "@/components/Skeleton/ProductCardSkeleton";
import { CurrentLanguageData } from "@/redux/reuducer/languageSlice";
import { SliderShareIcon, SearchIcon, MoreIcon, LocationIcon, DownArrowIcon, SortArrowIcon, FavouriteIcon, GalleryIcon, ShareIcon, InviteNotifyIcon, RightArrowIcon, DeleteIcon, EditIcon, PaginationPrevIcon, PaginationNextIcon } from "@/components/CustomFile/icons";
import FavouriteListsPanel from "./components/FavouriteListsPanel";
import SimilarCarsSlider from "./components/SimilarCarsSlider";
import CreateListModal from "./components/CreateListModal";
import DeleteListConfirmModal from "./components/DeleteListConfirmModal";
import InviteCollaboratorsModal from "./components/InviteCollaboratorsModal";
import MoveAdToAnotherListModal from "./components/MoveAdToAnotherListModal";
import call from '../../../../public/assets/img/icons/call.png'
import whatsapp from '../../../../public/assets/img/social/whatsapp.png'
import SharePopup from "./components/SharePopup";

const Favourites = () => {

    const CurrentLanguage = useSelector(CurrentLanguageData)
    const [favoritesData, setFavoriteData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const userData = useSelector(userSignUpData);
    const [IsLoadMore, setIsLoadMore] = useState(false)
    const [activeListIndex, setActiveListIndex] = useState(0)
    const [query, setQuery] = useState("")
    const [isCategoryOpen, setIsCategoryOpen] = useState(false)
    const [isSortOpen, setIsSortOpen] = useState(false)
    const [categoryLabel, setCategoryLabel] = useState("All Categories")
    const [sortLabel, setSortLabel] = useState("Default")
    const [imageSlideById, setImageSlideById] = useState({})
    const [favouriteById, setFavouriteById] = useState({})
    const [showRenameListModal, setShowRenameListModal] = useState(false)
    const [showDeleteListModal, setShowDeleteListModal] = useState(false)
    const [showInviteCollaboratorsModal, setShowInviteCollaboratorsModal] = useState(false)
    const [showMoveAdModal, setShowMoveAdModal] = useState(false)
    const [openItemMenuId, setOpenItemMenuId] = useState(null)
    const [showSharePopup, setShowSharePopup] = useState(false)
    const [listsRefreshKey, setListsRefreshKey] = useState(0)
    const [listRefetchKey, setListRefetchKey] = useState(0)
    const [favouriteLists, setFavouriteLists] = useState([
        { name: "All Favorites", count: 0, isDefault: true },
        { name: "Saved Ads", count: 0, isDefault: false },
        { name: "Private List", count: 0, isDefault: false },
    ])
    const activeList = favouriteLists[activeListIndex]
    const selectedListId = activeList?.favouritelisting_id

    const LIST_CARD_IMG_W = 220

    // Use these to visually verify the slider UI even when API returns only 1 image.
    const demoSliderImages = [
        "/assets/img/car.png",
        "/assets/img/favourites.png",
        "/assets/img/emptydata.png",
        "/assets/img/data.png",
    ]

    const pickImageUrl = (entry) => {
        if (entry == null) return ""
        if (typeof entry === "string") return entry.trim()
        if (typeof entry === "object") {
            const u =
                entry.url ||
                entry.image ||
                entry.image_url ||
                entry.img ||
                entry.path ||
                entry.thumbnail ||
                entry.file ||
                ""
            return typeof u === "string" ? u.trim() : ""
        }
        return ""
    }

    const getItemImages = (item) => {
        const buckets = [
            item?.images,
            item?.image_gallery,
            item?.gallery,
            item?.photos,
            item?.image_urls,
            item?.attachments,
            item?.media,
            item?.gallery_images,
            item?.image
        ]
        for (const b of buckets) {
            if (!Array.isArray(b) || b.length === 0) continue
            const urls = b.map(pickImageUrl).filter(Boolean)
            const seen = new Set()
            const unique = urls.filter((u) => {
                if (seen.has(u)) return false
                seen.add(u)
                return true
            })
            if (unique.length > 0) return unique
        }
        const one = pickImageUrl(item?.image) || pickImageUrl(item?.thumbnail)
        if (one) return [one]
        return demoSliderImages
    }

    const getSlideIndex = (id) => imageSlideById?.[id] || 0

    const setSlideIndex = (id, next) => {
        setImageSlideById((prev) => ({ ...prev, [id]: next }))
    }

    const fetchFavoriteItems = async (page, selectedListId) => {
        try {

            if (page === 1) {
                setIsLoading(true);
            }

            const response = await getFavouriteApi.getFavouriteApi({
                page,
                favouritelisting_id: selectedListId,
            });
            let parsedPayload = response?.data
            if (typeof parsedPayload === "string") {
                const scriptTagIndex = parsedPayload.indexOf("<script")
                const safeJson = scriptTagIndex >= 0 ? parsedPayload.slice(0, scriptTagIndex) : parsedPayload
                try {
                    parsedPayload = JSON.parse(safeJson)
                } catch (parseError) {
                    console.log("Favourite API JSON parse error:", parseError)
                    parsedPayload = {}
                }
            }

            const responseData = parsedPayload?.data
            const data = Array.isArray(responseData?.data)
                ? responseData.data
                : Array.isArray(responseData)
                    ? responseData
                    : []
            if (page === 1) {
                setFavoriteData(data);
            } else {
                setFavoriteData((prevData) => [...prevData, ...data]);
            }
            const current = responseData?.current_page || page
            const last = responseData?.last_page || page
            if (current >= last) {
                setHasMore(false); // Check if there's more data
            } else {
                setHasMore(true)
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
            setIsLoadMore(false)
        }
    };

    useEffect(() => {
        if (!isLogin()) return
        setHasMore(true)
        setCurrentPage(1)
        fetchFavoriteItems(1, selectedListId);
    }, [selectedListId, listRefetchKey]);

    useEffect(() => {
        if (!isLogin()) return
        if (currentPage <= 1) return
        fetchFavoriteItems(currentPage, selectedListId);
    }, [currentPage, selectedListId]);

    const handleSelectList = (nextIndex) => {
        setHasMore(true)
        setFavoriteData([])
        setCurrentPage(1)
        setActiveListIndex(nextIndex)
        setListRefetchKey((prev) => prev + 1)
    }

    useEffect(() => {
        const onDocMouseDown = (e) => {
            if (e.target?.closest?.('[data-item-menu="true"]')) return
            setOpenItemMenuId(null)
        }
        document.addEventListener("mousedown", onDocMouseDown)
        return () => document.removeEventListener("mousedown", onDocMouseDown)
    }, [])



    const handleLoadMore = () => {
        setIsLoadMore(true)
        setCurrentPage((prevPage) => prevPage + 1);
    };

    const handleLike = (id) => {
        const updatedItems = favoritesData.map((item) => {
            if (item.id === id) {
                return { ...item, is_liked: !item.is_liked };
            }
            return item;
        });
        setFavoriteData(updatedItems);
    }

    const handleRemoveFromFavorites = async (id) => {
        try {
            await manageFavouriteApi.manageFavouriteApi({
                item_id: id,
                favouritelisting_id: selectedListId,
            })
            setFavoriteData((prev) => prev.filter((item) => item?.id !== id))
            setFavouriteById((prev) => ({ ...prev, [id]: false }))
            setListsRefreshKey((prev) => prev + 1)
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        setFavouriteLists((prev) =>
            prev.map((list, index) =>
                index === 0 ? { ...list, count: favoritesData?.length || 0 } : list
            )
        )
    }, [favoritesData])

    const activeListName = favouriteLists[activeListIndex]?.name || "All Favorites"
    const isDefaultActiveList = favouriteLists[activeListIndex]?.isDefault

    const handleDeleteActiveList = () => {
        if (isDefaultActiveList) return
        setFavouriteLists((prev) => prev.filter((_, idx) => idx !== activeListIndex))
        setActiveListIndex(0)
    }

    const handleRenameActiveList = (nextName) => {
        if (isDefaultActiveList || !nextName?.trim()) return
        setFavouriteLists((prev) =>
            prev.map((list, idx) =>
                idx === activeListIndex ? { ...list, name: nextName.trim() } : list
            )
        )
    }

    const isAllFavouritesList = activeList?.isDefault || activeList?.favouritelisting_id == null

    const filteredFavorites = favoritesData.filter((item) => {
        const byQuery = !query
            ? true
            : ((item?.title || item?.name || "").toString().toLowerCase()).includes(query.toLowerCase())

        // API already filters by favouritelisting_id when provided.
        // Keep only search filter here to avoid hiding valid API results.
        const byList = true

        return byQuery && byList
    })


    return (
        <>
            <div className="w-full mx-auto">
                <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
                    <div className="mb-[20px]">
                        <h4 className="text-[#000] text-[18px] font-[Inter-Bold]">{t("myFavorites")}</h4>
                    </div>
                    <div className="grid grid-cols-[400px_1fr] gap-[20px] max-md:grid-cols-1 fav_grid">
                        {/* Left lists */}
                        <FavouriteListsPanel
                            lists={favouriteLists}
                            activeListIndex={activeListIndex}
                            onSelectList={handleSelectList}
                            onListsChange={setFavouriteLists}
                            refreshKey={listsRefreshKey}
                        />

                        {/* Right content */}
                        <div className="">
                            <div className="mb-[12px]">
                                <div className="flex items-center justify-between gap-[12px]">
                                    <h5 className="text-[16px] font-[Inter-Medium] text-[#000]">{activeListName}</h5>

                                    {!isDefaultActiveList ? (
                                        <div className="flex items-center gap-[20px]">
                                            <button
                                                type="button"
                                                onClick={() => setShowInviteCollaboratorsModal(true)}
                                                className="cursor-pointer inline-flex items-center gap-[6px]"
                                            >
                                                <SliderShareIcon className="w-[24px] h-[24px]" fill="#000" />
                                                <p className="text-[14px] font-[Inter-Medium] text-[#000]">Share</p>
                                            </button>


                                            <div className="flex items-center gap-[16px]">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowDeleteListModal(true)}
                                                    aria-label="Delete list"
                                                    className="cursor-pointer inline-flex items-center justify-center w-[18px] h-[18px]"
                                                >
                                                    <DeleteIcon className="w-[18px] h-[18px]" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setShowRenameListModal(true)}
                                                    aria-label="Edit list"
                                                    className="cursor-pointer inline-flex items-center justify-center w-[18px] h-[18px]"
                                                >
                                                    <EditIcon className="w-[18px] h-[18px]" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>

                                {!isDefaultActiveList ? (
                                    <button
                                        type="button"
                                        className="mt-[16px] mb-[12px] w-full flex items-center justify-between gap-[14px] bg-[rgba(58,136,239,0.14)] rounded-[4px] p-[14px_14px] cursor-pointer"
                                    >
                                        <div className="flex items-center gap-[8px]">
                                            <InviteNotifyIcon className="w-[22px] h-[22px]" />
                                            <p className="text-[14px] font-[Inter-Regular] text-[#3A88EF]">
                                                Invite others to collaborate
                                            </p>
                                        </div>
                                        <RightArrowIcon className="w-[20px] h-[20px]" />
                                    </button>
                                ) : null}
                            </div>

                            <div className="flex-wrap flex items-center justify-between gap-[12px] mb-[12px] max-sm:flex-col max-sm:items-stretch">
                                {/* Search */}
                                <div className="">
                                    <div className="max-sm:w-full w_full rounded-[12px] border border-[rgba(143,143,143,0.24)] bg-white flex items-center gap-[8px] p-[12px_18px] w-[320px]">
                                        <SearchIcon className="" />
                                        <input
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            type="text"
                                            placeholder="Search..."
                                            className="bg-transparent outline-none text-[14px] font-[Inter-Regular] placeholder:text-[#8F8F8F] text-[#000]"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-[12px]">
                                    {/* Category */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCategoryOpen((v) => !v)
                                                setIsSortOpen(false)
                                            }}
                                            className="flex items-center gap-[8px] p-[12px_16px] rounded-[12px] border border-[rgba(143,143,143,0.24)] bg-white cursor-pointer"
                                        >
                                            <p className="text-[12px] font-[Inter-SemiBold] text-[#000000BF]">{categoryLabel}</p>
                                            <DownArrowIcon className="w-[18px] h-[18px]" stroke="rgba(0,0,0,0.60)" />
                                        </button>
                                        {isCategoryOpen ? (
                                            <div className="absolute right-0 mt-[8px] w-[200px] bg-white rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-[20] overflow-hidden">
                                                {["All Categories", "Motors", "Classifieds", "Jobs"].map((opt) => (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onClick={() => {
                                                            setCategoryLabel(opt)
                                                            setIsCategoryOpen(false)
                                                        }}
                                                        className={`w-full text-left p-[12px] text-[14px] cursor-pointer ${categoryLabel === opt
                                                            ? "text-[#000] font-[Inter-Medium]"
                                                            : "text-[#8F8F8F] font-[Inter-Regular]"
                                                            } hover:bg-[#F5F5F5]`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* Sort */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsSortOpen((v) => !v)
                                                setIsCategoryOpen(false)
                                            }}
                                            className="flex items-center gap-[8px] p-[12px_16px] rounded-[12px] border border-[rgba(143,143,143,0.24)] bg-white cursor-pointer"
                                        >
                                            <div className="flex-col flex items-center gap-[4px]">
                                                <SortArrowIcon className="rotate-180" stroke="" />
                                                <SortArrowIcon className=" " stroke="" />
                                            </div>
                                            <p className="text-[12px] font-[Inter-SemiBold] text-[#000]">{sortLabel}</p>
                                        </button>
                                        {isSortOpen ? (
                                            <div className="absolute end-0 mt-[8px] w-[180px] bg-white rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-[20] overflow-hidden">
                                                {["Default", "Newest", "Oldest"].map((opt) => (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onClick={() => {
                                                            setSortLabel(opt)
                                                            setIsSortOpen(false)
                                                        }}
                                                        className={`w-full text-left p-[12px] text-[14px] cursor-pointer ${sortLabel === opt
                                                            ? "text-[#000] font-[Inter-Medium]"
                                                            : "text-[#8F8F8F] font-[Inter-Regular]"
                                                            } hover:bg-[#F5F5F5]`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            {/* List */}
                            {isLoading ? (
                                <div className="grid grid-cols-1 gap-[12px]">
                                    {Array.from({ length: 4 }).map((_, idx) => (
                                        <ProductCardSkeleton key={idx} />
                                    ))}
                                </div>
                            ) : filteredFavorites?.length === 0 ? (
                                <Emptydata />
                            ) : (
                                <div className="flex flex-col gap-[12px]">
                                    {filteredFavorites.map((item) => {
                                        const images = getItemImages(item)
                                        const slideIndex = Math.min(getSlideIndex(item.id), Math.max(images.length - 1, 0))
                                        const imageSrc = pickImageUrl(images?.[slideIndex])
                                        const dotCount = Math.min(images.length, 5)
                                        const canGoPrevImage = slideIndex > 0
                                        const canGoNextImage = slideIndex < images.length - 1
                                        const imageTotal =
                                            item?.image_count ??
                                            item?.images_count ??
                                            item?.total_images ??
                                            images.length
                                        const isLiked =
                                            Object.prototype.hasOwnProperty.call(favouriteById, item.id)
                                                ? favouriteById[item.id]
                                                : Boolean(item?.is_liked)
                                        const title =
                                            item?.title || item?.name || t("item")
                                        const price = item?.price || item?.amount || ""
                                        const location = item?.location || item?.city || ""

                                        return (
                                            <div
                                                key={item.id}
                                                className="max-sm:flex-col w-full bg-white border border-[rgba(143,143,143,0.16)] rounded-[10px] p-[12px] flex gap-[12px]"
                                            >
                                                {/* Same image slider UI as SimilarCarsSlider */}
                                                <div className="max-sm:w-full w-[240px] flex-shrink-0">
                                                    <div className="relative h-[200px] w-full overflow-hidden rounded-[14px] bg-[#F5F5F5]">
                                                        {imageSrc ? (
                                                            <>
                                                                <Image
                                                                    key={`${item.id}-${slideIndex}-${imageSrc}`}
                                                                    src={imageSrc}
                                                                    alt={title}
                                                                    width={LIST_CARD_IMG_W}
                                                                    height={150}
                                                                    unoptimized={
                                                                        typeof imageSrc === "string" &&
                                                                        (imageSrc.startsWith("http://") ||
                                                                            imageSrc.startsWith("https://"))
                                                                    }
                                                                    className="h-[200px] w-full object-cover"
                                                                />

                                                                {images.length > 1 ? (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                e.preventDefault()
                                                                                if (!canGoPrevImage) return
                                                                                setSlideIndex(item.id, slideIndex - 1)
                                                                            }}
                                                                            disabled={!canGoPrevImage}
                                                                            className="absolute left-[8px] top-1/2 z-[2] -translate-y-1/2 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/90 shadow-[0_6px_14px_rgba(0,0,0,0.14)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                                            aria-label="Previous image"
                                                                        >
                                                                            <PaginationPrevIcon className="h-[10px] w-[10px]" stroke="#000" />
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                e.preventDefault()
                                                                                if (!canGoNextImage) return
                                                                                setSlideIndex(item.id, slideIndex + 1)
                                                                            }}
                                                                            disabled={!canGoNextImage}
                                                                            className="absolute right-[8px] top-1/2 z-[2] -translate-y-1/2 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/90 shadow-[0_6px_14px_rgba(0,0,0,0.14)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                                            aria-label="Next image"
                                                                        >
                                                                            <PaginationNextIcon className="h-[10px] w-[10px]" stroke="#000" />
                                                                        </button>
                                                                    </>
                                                                ) : null}

                                                                <div className="absolute top-[10px] right-[10px] flex items-center gap-[4px]">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            e.preventDefault()
                                                                            setFavouriteById((prev) => {
                                                                                const cur = Object.prototype.hasOwnProperty.call(
                                                                                    prev,
                                                                                    item.id
                                                                                )
                                                                                    ? prev[item.id]
                                                                                    : Boolean(item?.is_liked)
                                                                                return { ...prev, [item.id]: !cur }
                                                                            })
                                                                            handleLike(item.id)
                                                                        }}
                                                                        className="flex cursor-pointer items-center justify-center rounded-full transition-colors"
                                                                        aria-label={isLiked ? "Remove from favourites" : "Add to favourites"}
                                                                        aria-pressed={isLiked}
                                                                    >
                                                                        <FavouriteIcon
                                                                            className="h-[24px] w-[24px]"
                                                                            fill={isLiked ? "#DC0000" : "#ffffff"}
                                                                            fillOpacity={isLiked ? 1 : 0.95}
                                                                            stroke={isLiked ? "#DC0000" : "transparent"}
                                                                        />
                                                                    </button>

                                                                    <button type="button" 
                                                                    onClick={() => {
                                                                        setShowSharePopup(true)
                                                                        
                                                                    }}
                                                                    className="ss cursor-pointer flex items-center justify-center rounded-full transition-colors">
                                                                        <SliderShareIcon className="h-[30px] w-[30px]" />
                                                                    </button>
                                                                </div>

                                                                <div className="absolute bottom-[10px] left-[10px] flex items-center gap-[4px] rounded-[4px] bg-[rgba(35,38,42,0.75)] p-[3px_5px]">
                                                                    <GalleryIcon className="h-[14px] w-[14px]" />
                                                                    <p className="text-[12px] font-[Inter-Medium] text-white">
                                                                        {imageTotal}
                                                                    </p>
                                                                </div>

                                                                {dotCount > 1 ? (
                                                                    <div className="absolute bottom-[12px] left-1/2 z-[2] flex -translate-x-1/2 items-center gap-[6px]">
                                                                        {Array.from({ length: dotCount }).map((_, d) => (
                                                                            <button
                                                                                key={d}
                                                                                type="button"
                                                                                onClick={() => setSlideIndex(item.id, d)}
                                                                                className={`h-[7px] w-[7px] rounded-full ${d === slideIndex ? "bg-white" : "bg-white/40"
                                                                                    }`}
                                                                                aria-label={`Photo ${d + 1}`}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                ) : null}
                                                            </>
                                                        ) : (
                                                            <div className="h-full w-full" />
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="grid grid-cols-[1fr_24px] items-start gap-[12px]">
                                                        <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
                                                            <h3 className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-[Inter-Medium] text-[#000]">
                                                                {title}
                                                            </h3>
                                                            <h4 className="text-[12px] font-[Inter-Medium] text-[#000000BF] truncate">
                                                                {item?.subtitle || item?.sub_title || item?.model || item?.brand || "Kia . Sportage . Other"}
                                                            </h4>
                                                        </div>
                                                        <div className="relative shrink-0" data-item-menu="true">
                                                            <button
                                                                type="button"
                                                                onMouseDown={(e) => e.stopPropagation()}
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setOpenItemMenuId((prev) => (prev === item.id ? null : item.id))
                                                                }}
                                                                className="cursor-pointer rounded-[6px] p-[4px] hover:bg-black/5"
                                                            >
                                                                <MoreIcon className="w-[18px] h-[18px]" />
                                                            </button>

                                                            {openItemMenuId === item.id ? (
                                                                <div
                                                                    className="absolute end-0 top-[34px] w-[220px] rounded-[8px] border border-[rgba(143,143,143,0.18)] bg-white shadow-[0_6px_18px_rgba(0,0,0,0.14)] z-[50] overflow-hidden"
                                                                    onMouseDown={(e) => e.stopPropagation()}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    {/* Temporarily hidden as requested
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setShowMoveAdModal(true)
                                                                        }}
                                                                        className="w-full p-[12px_14px] flex items-center justify-between text-left text-[14px] font-[Inter-Regular] text-[#23262A] hover:bg-[#F5F5F5] border-b border-[rgba(143,143,143,0.18)]"
                                                                    >
                                                                        <span>Add ad to another list</span>
                                                                        <RightArrowIcon className="w-[16px] h-[16px]" stroke="#23262A" />
                                                                    </button>
                                                                    */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={async () => {
                                                                            await handleRemoveFromFavorites(item.id)
                                                                            setOpenItemMenuId(null)
                                                                        }}
                                                                        className="w-full p-[12px_14px] flex items-center justify-between text-left text-[14px] font-[Inter-Regular] text-[#23262A] hover:bg-[#F5F5F5]"
                                                                    >
                                                                        <span>Remove from favorites</span>
                                                                        <FavouriteIcon className="w-[18px] h-[18px]" fill="#ffffff" stroke="#23262A" />
                                                                    </button>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    <div className="mt-[8px] flex items-center justify-between gap-[12px]">
                                                        <h2 className="text-[14px] font-[Inter-SemiBold] text-[#000000BF]">
                                                            {price ? `${price}` : ""}
                                                        </h2>
                                                    </div>

                                                    {/* Specs row (as screenshot) */}
                                                    <div className="my-[8px] flex items-center gap-[12px] max-sm:w-[84vw] max-sm:overflow-x-auto max-sm:whitespace-nowrap hide_scrollbar fav_cat">
                                                        <div className="flex-1 rounded-[8px] bg-[rgba(143,143,143,0.24)] p-[8px_10px] text-center">
                                                            <h4 className="text-[10px] font-[Inter-Medium] text-[#000000B2] uppercase tracking-[0.5px]">
                                                                KILOMETERS
                                                            </h4>
                                                            <h3 className="text-[12px] font-[Inter-SemiBold] text-[#000000D9] truncate">
                                                                {item?.kilometers ?? item?.km ?? 0}
                                                            </h3>
                                                        </div>

                                                        <div className="flex-1 rounded-[8px] bg-[rgba(143,143,143,0.24)] p-[8px_10px] text-center">
                                                            <h4 className="text-[10px] font-[Inter-Medium] text-[#000000B2] uppercase tracking-[0.5px]">
                                                                YEAR
                                                            </h4>
                                                            <h3 className="text-[12px] font-[Inter-SemiBold] text-[#000000D9] truncate">
                                                                {item?.year ?? item?.model_year ?? "2025"}
                                                            </h3>
                                                        </div>

                                                        <div className="flex-1 rounded-[8px] bg-[rgba(143,143,143,0.24)] p-[8px_10px] text-center">
                                                            <h4 className="text-[10px] font-[Inter-Medium] text-[#000000B2] uppercase tracking-[0.5px]">
                                                                STEERING SIDE
                                                            </h4>
                                                            <h3 className="text-[12px] font-[Inter-SemiBold] text-[#000000D9] truncate">
                                                                {item?.steering_side ?? item?.steering ?? "Left Hand"}
                                                            </h3>
                                                        </div>

                                                        <div className="flex-1 rounded-[8px] bg-[rgba(143,143,143,0.24)] p-[8px_10px] text-center">
                                                            <h4 className="text-[10px] font-[Inter-Medium] text-[#000000B2] uppercase tracking-[0.5px]">
                                                                REGIONAL SPECS
                                                            </h4>
                                                            <h3 className="text-[12px] font-[Inter-SemiBold] text-[#000000D9] truncate">
                                                                {item?.regional_specs ?? item?.specs_region ?? "China"}
                                                            </h3>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-[8px] mb-[10px]">
                                                        <LocationIcon className="w-[20px] h-[20px]" stroke="#000" />
                                                        <h3 className="text-[12px] font-[Inter-SemiBold] text-[#000000BF] truncate">
                                                            RAS AL Khor , Dubai  <span className="text-[#8F8F8F]">. 22 January 2026</span>
                                                        </h3>
                                                    </div>

                                                    <div className="flex items-center gap-[8px]">
                                                        <button
                                                            type="button"
                                                            className="flex items-center gap-[8px] p-[8px_16px] rounded-[8px] bg-[#DC000024] cursor-pointer"
                                                        >
                                                            <Image src={call} alt="call" width={24} height={24} className="w-[24px] h-[24px]" />
                                                            <p className="text-[#000000BF] text-[12px] font-[Inter-Medium]">Call</p>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="flex items-center gap-[8px] p-[8px_16px] rounded-[8px] bg-[rgba(76,175,80,0.14)] text-[#2E7D32] text-[12px] font-[Inter-Medium] cursor-pointer"
                                                        >
                                                            <Image src={whatsapp} alt="whatsapp" width={24} height={24} className="w-[24px] h-[24px]" />
                                                            <p className="text-[#000000BF] text-[12px] font-[Inter-Medium]">Whatsapp</p>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {!isLoading && filteredFavorites.length > 0 ? (
                                <SimilarCarsSlider title="Similar Cars" />
                            ) : null}

                            {hasMore && !isLoading && filteredFavorites.length > 0 ? (
                                <div className="flex items-center justify-center mt-[16px]">
                                    <button
                                        type="button"
                                        onClick={handleLoadMore}
                                        disabled={IsLoadMore}
                                        className="h-[40px] px-[18px] rounded-[8px] bg-[#DC0000] text-white text-[13px] font-[Inter-Medium] cursor-pointer disabled:opacity-60"
                                    >
                                        {IsLoadMore ? "Loading..." : "Load more"}
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            <CreateListModal
                open={showRenameListModal}
                onClose={() => setShowRenameListModal(false)}
                onCreate={handleRenameActiveList}
                title="Edit List Name"
                description="Rename your favorite list"
                confirmLabel="Save"
                initialValue={activeListName}
            />

            <DeleteListConfirmModal
                open={showDeleteListModal}
                onClose={() => setShowDeleteListModal(false)}
                onConfirm={handleDeleteActiveList}
            />

            <InviteCollaboratorsModal
                open={showInviteCollaboratorsModal}
                onClose={() => setShowInviteCollaboratorsModal(false)}
                onInvite={() => { }}
                onShareViewOnly={() => { }}
                listName={activeListName}
                savedAdsLabel={`${favoritesData?.length || 0} Saved Ads`}
            />

            <MoveAdToAnotherListModal
                open={showMoveAdModal}
                onClose={() => setShowMoveAdModal(false)}
                lists={favouriteLists}
                currentListIndex={activeListIndex}
                onNewList={() => {
                    setShowMoveAdModal(false)
                }}
                onConfirm={() => { }}
            />

            <SharePopup
                isOpen={showSharePopup}
                onClose={() => setShowSharePopup(false)}
                onShare={() => { }}
            />
        </>
    );
};

export default Favourites;
