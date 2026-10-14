'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { FavouriteIcon, ShareIcon } from '@/components/CustomFile/icons'
import ProductSlider from '../ClassifiedComponents/ProductSlider'
import MapComponent from '../ClassifiedComponents/MapComponent'
import ClassfiedProfile from '../ClassifiedComponents/ClassfiedProfile'
import SimilarProducts from '../components/SimilarProducts'
import { ReportAdFlagIcon } from '@/components/CustomFile/icons'
import ReportListingModal from '../components/ReportListingModal'
import chatwhite from '../../../../../public/assets/img/icons/chatwhite.svg'
import SaveAdsModal from '@/components/PagesComponent/Products/components/SaveAds'
import SharePopup from '@/components/PagesComponent/Products/components/SharePopup'
import { manageFavouriteApi } from '@/utils/api'
import LoginModal from '@/components/Auth/LoginModal'
import { isLogin } from '@/utils'
import { itemOfferApi } from '@/utils/api'
import { saveOfferData } from '@/redux/reuducer/offerSlice'
import { userSignUpData } from '@/redux/reuducer/authSlice'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const SAVE_ADS_LISTS = [
  { name: 'All Favorites', count: 154, isDefault: true },
  { name: 'Classified Watchlist', count: 12 },
]
function firstTruthy(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== '') return v
  }
  return ''
}

function customFieldValue(productData, ...names) {
  const fields = productData?.custom_fields
  if (!Array.isArray(fields)) return ''
  const lower = names.map((n) => n.toLowerCase())
  const row = fields.find((f) => lower.includes(String(f?.name || '').toLowerCase()))
  if (!row) return ''
  const v = row?.custom_field_value?.value ?? row?.value
  if (Array.isArray(v)) return v.filter(Boolean).join(', ') || ''
  return v != null && v !== '' ? String(v) : ''
}

function formatPostedDate(createdAt) {
  if (!createdAt) return ''
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function toPlainDescription(raw) {
  if (!raw) return ''
  const str = String(raw)
  return str
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function parseCoordinate(v) {
  const n = Number(v)
  if (Number.isNaN(n)) return null
  return n
}

function primaryImageFromItem(item, mode) {
  const normalizedMode = (mode || '').toLowerCase()
  const fallbackImage =
    normalizedMode === 'furniture'
      ? '/assets/img/furniture/1.png'
      : normalizedMode === 'mobile'
        ? '/assets/img/mobile/1.png'
        : '/assets/img/classified/1.png'
  if (!item) return fallbackImage
  const sources =
    item?.images ||
    item?.gallery_images ||
    item?.image_gallery ||
    item?.photos ||
    item?.image_urls ||
    []
  const arr = Array.isArray(sources) ? sources : []
  for (const v of arr) {
    if (!v) continue
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (typeof v === 'object') {
      const guess =
        v.url ||
        v.image ||
        v.src ||
        v.path ||
        v.photo ||
        v.image_url ||
        v.imageUrl
      if (typeof guess === 'string' && guess.trim()) return guess.trim()
    }
  }
  if (typeof item.image === 'string' && item.image.trim()) return item.image.trim()
  return fallbackImage
}

const ClassifiedDetail = ({ productData, slug, mode }) => {
  const item = productData || {}
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [isLocationMapOpen, setIsLocationMapOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [showFloatingHeader, setShowFloatingHeader] = useState(false)
  const [isSaveAdsOpen, setIsSaveAdsOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [isMailSentOpen, setIsMailSentOpen] = useState(false)
  const [isStartingChat, setIsStartingChat] = useState(false)
  const router = useRouter()
  const loggedInUser = useSelector(userSignUpData)
  const loggedInUserId = firstTruthy(loggedInUser?.id, loggedInUser?.data?.id, loggedInUser?.user?.id)
  const sellerUserId = useMemo(() => {
    const user = item?.user && typeof item.user === 'object' ? item.user : null
    return firstTruthy(item?.user_id, item?.seller_id, user?.id)
  }, [item])
  const showChatWithSeller = useMemo(() => {
    if (!loggedInUserId || !sellerUserId) return true
    return Number(loggedInUserId) !== Number(sellerUserId)
  }, [loggedInUserId, sellerUserId])
  const handleOpenSaveAds = async () => {
    const itemId = item?.id
    if (itemId) {
      try {
        await manageFavouriteApi.manageFavouriteApi({ item_id: itemId })
      } catch (e) {
        console.error('Failed to pre-save favourite:', e)
      }
    }
    setIsSaveAdsOpen(true)
  }
  const handleOpenSaveAdsWithLoginCheck = () => {
    if (isLogin()) {
      handleOpenSaveAds()
      return
    }
    setIsLoginModalOpen(true)
  }
  const postedOn = formatPostedDate(item?.created_at)
  const customFieldRows = useMemo(() => {
    const fields = Array.isArray(item?.custom_fields) ? item.custom_fields : []
    return fields.map((row, idx) => {
      const rawValue = row?.custom_field_value?.value ?? row?.value
      const value = Array.isArray(rawValue)
        ? rawValue.filter((v) => v != null && String(v).trim() !== '').join(', ')
        : rawValue != null && String(rawValue).trim() !== ''
          ? String(rawValue).trim()
          : ''
      const rawName = String(row?.name || '').trim()
      const label = rawName || `Field ${idx + 1}`
      return { label, value: value || '—' }
    })
  }, [item])

  const overviewCards = useMemo(() => {
    const firstFour = customFieldRows.slice(0, 4)
    if (firstFour.length === 4) return firstFour
    const padded = [...firstFour]
    while (padded.length < 4) {
      padded.push({ label: `Field ${padded.length + 1}`, value: '—' })
    }
    return padded
  }, [customFieldRows])

  const detailRows = useMemo(() => customFieldRows.slice(4), [customFieldRows])

  const fullDescription = toPlainDescription(
    firstTruthy(
      item?.description,
      item?.details,
      item?.content,
      item?.body,
      item?.short_description,
      item?.long_description,
      item?.desc,
      item?.ad_description,
      customFieldValue(item, 'Description', 'Ad Description')
    )
  )
  const fallbackDescription = `For serious professionals and rental companies only.

A complete and properly configured L-Acoustics ARCS system available for sale.
This system has been installed in a private indoor home environment and has never been used for touring, outdoor events, or heavy rental operations.

System Configuration:
• 2 x L-Acoustics ARCS Focus
• 2 x L-Acoustics ARCS Wide
• 1 x L-Acoustics SB28 Subwoofer
• 1 x L-Acoustics LA12X Amplified Controller
• 1 x L-Acoustics LA8 R3 Amplified Controller (AES3 Digital Card)
• Professional rack with power management and complete cabling

Manufactured in 2019.
All components are original L-Acoustics units and fully operational.`
  const effectiveDescription = fullDescription || fallbackDescription
  const hasLongDescription = effectiveDescription.length > 200
  const visibleDescription = hasLongDescription && !isDescriptionExpanded
    ? `${effectiveDescription.slice(0, 200).trim()}...`
    : effectiveDescription
  const locationText = firstTruthy(
    item?.address,
    item?.location,
    item?.full_address,
    customFieldValue(item, 'Address', 'Location')
  )
  const latitude = parseCoordinate(firstTruthy(item?.latitude, item?.lat, item?.location_lat))
  const longitude = parseCoordinate(firstTruthy(item?.longitude, item?.long, item?.lng, item?.location_lng))
  const canShowMap = latitude !== null && longitude !== null

  const title = firstTruthy(item?.title, item?.name, item?.listing_title)
  const rawPrice = firstTruthy(item?.price, item?.amount, item?.price_value, item?.amount_value)
  const priceValue =
    rawPrice !== '' && rawPrice !== null && rawPrice !== undefined ? Number(rawPrice) : null
  const priceLabel = priceValue !== null ? priceValue.toLocaleString('en-US') : ''
  const detailSlug = slug || item?.slug || item?.id || ''
  const shareBase = process.env.NEXT_PUBLIC_WEB_URL || ''
  const shareUrl = detailSlug
    ? `${shareBase.replace(/\/$/, '')}/productdetail?slug=${encodeURIComponent(String(detailSlug))}`
    : (typeof window !== 'undefined' ? window.location.href : '')

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0
      setShowFloatingHeader(y > 260)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleChatWithSeller = async () => {
    if (!isLogin()) {
      setIsLoginModalOpen(true)
      return
    }

    if (isStartingChat) return

    try {
      setIsStartingChat(true)
      if (!item?.is_already_offered) {
        const response = await itemOfferApi.offer({
          item_id: item?.id,
        })
        const data = response?.data?.data
        if (data) saveOfferData(data)
      } else {
        const existingOffers = Array.isArray(item?.item_offers) ? item.item_offers : []
        const offer = existingOffers.find((it) => Number(loggedInUserId) === Number(it?.buyer_id))
        const selectedChat = {
          amount: offer?.amount,
          id: offer?.id,
          item: {
            status: item?.status,
            price: item?.price,
            image: item?.image,
            name: item?.name,
            review: null,
          },
          user_blocked: false,
          item_id: item?.id,
          seller: {
            profile: item?.user?.profile,
            name: item?.user?.name,
            id: item?.user?.id,
          },
          tab: 'buying',
        }
        saveOfferData(selectedChat)
      }
      router.push('/chat')
    } catch (error) {
      toast.error('Unable to start the chat')
      // eslint-disable-next-line no-console
      console.error(error)
    } finally {
      setIsStartingChat(false)
    }
  }

  return (
    <div className="w-full">
      <div className='mb-[20px] flex items-center justify-between gap-[12px]'>
        <h1 className='text-[20px] font-[Inter-Bold] text-[#23262A] leading-[20px]'>{title}</h1>
        <p className='text-[18px] font-[Inter-Medium] text-[#DC0000]'>AED <span
          className="font-[Inter-Bold] text-[20px]">{priceLabel || '2220'}</span></p>
      </div>
      <div className="grid grid-cols-[1fr_350px] gap-[20px] max-sm:grid-cols-1 products_grid">
        <div className="min-w-0">
          <ProductSlider productData={productData} slug={slug} mode={mode} />
          <div className="pt-[10px]">
            <div className="mb-[22px] flex items-center justify-between gap-[12px] max-sm:flex-col max-sm:items-start">
              <h2 className="text-[20px] font-[Inter-Bold] text-[#23262A]">
                Item Overview
              </h2>
              {postedOn ? (
                <p className="text-[20px] max-sm:text-[18px] leading-[28px] text-[#23262A]">
                  <span className="font-[Inter-Bold]">Posted on:</span>{' '}
                  <span className="font-[Inter-Regular]">{postedOn}</span>
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-4 gap-[16px] max-lg:grid-cols-2 max-sm:grid-cols-1">
              {overviewCards.map((row) => (
                <div key={row.label} className="rounded-[12px] shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.02),_0px_3px_8px_rgba(0,0,0,0.02),_0px_1px_10px_rgba(0,0,0,0.04)] p-[16px] flex flex-col items-center justify-center gap-[8px]">
                  <p className="text-center text-[12px] font-[Inter-Bold] text-[#23262A] uppercase">{row.label}</p>
                  <p className="text-center text-[14px] font-[Inter-Regular] text-[#23262A]">{row.value}</p>
                </div>
              ))}
            </div>

            <div className="py-[40px] border-b border-[rgba(143,143,143,0.35)]">
              <h2 className="mb-[24px] text-[20px] max-sm:text-[32px] leading-[48px] max-sm:leading-[40px] font-[Inter-Bold] text-[#23262A]">
                Item Details
              </h2>
              <div className="flex flex-col gap-[16px]">
                {detailRows.map((row) => (
                  <div key={row.label} className="grid grid-cols-[240px_1fr] items-start gap-[18px] max-sm:grid-cols-1">
                    <h4 className="text-[16px] font-[Inter-Regular] text-[#23262A]">{row.label}</h4>
                    <h5 className="text-[16px] font-[Inter-SemiBold] text-[#23262A]">{row.value}</h5>
                  </div>
                ))}
              </div>
            </div>

            <div className="py-[40px] border-b border-[rgba(143,143,143,0.35)]">
              <h2 className="mb-[16px] text-[20px] font-[Inter-Bold] text-[#23262A]">
                Description
              </h2>
              <div className="rounded-[6px] bg-[#fff] p-[2px_0]">
                <p className="whitespace-pre-line text-[14px] font-[Inter-Regular] text-[#23262A]">
                  {visibleDescription}
                </p>
              </div>
              {hasLongDescription ? (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded((p) => !p)}
                  className="mt-[14px] cursor-pointer text-[14px] font-[Inter-Bold] text-[#3a88ef]"
                >
                  {isDescriptionExpanded ? 'Read Less' : 'Read More'}
                </button>
              ) : null}
            </div>

            <div className={`py-[40px] border-b border-[rgba(143,143,143,0.35)] `}>
              <div className={`flex items-center justify-between gap-[16px] max-sm:flex-col max-sm:items-start ${isLocationMapOpen ? 'flex-col items-start' : ''}`}>
                <div className="flex flex-col gap-[20px]">
                  <h2 className="text-[20px] font-[Inter-Bold] text-[#23262A]">Location</h2>
                  <p className="text-[16px] font-[Inter-Regular] text-[#23262A]">
                    {locationText || 'Al Barsha South, Al Barsha, Dubai, UAE'}
                  </p>
                </div>
                <div>
                  <MapComponent
                    latitude={latitude}
                    longitude={longitude}
                    onToggleShowMap={setIsLocationMapOpen}
                  />
                </div>
              </div>
            </div>

            <div className='mt-[50px] text-center w-full mb-[20px]'>
              <button
                type="button"
                onClick={() => setIsReportOpen(true)}
                className="flex w-full justify-center cursor-pointer items-center gap-[8px]"
              >
                <ReportAdFlagIcon className="w-[18px] h-[18px]" />
                <p className="text-[14px] font-[Inter-Medium] text-[#23262a]">Report This Ad</p>
              </button>
            </div>
          </div>
          <SimilarProducts productData={productData} mode={mode} />
        </div>
        <div className="w-[350px] max-sm:w-full shrink-0">
          <ClassfiedProfile
            productData={productData}
            onChat={handleChatWithSeller}
            showChatWithSeller={showChatWithSeller}
          />
        </div>
      </div>
      <ReportListingModal
        open={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        brandName="ebozor"
        onSubmitReport={() => { }}
        productData={productData}
      />
      {showFloatingHeader ? (
        <div className="fixed inset-x-0 top-[0px] bg-[#fff]  p-[20px]  z-[40] flex justify-center shadow-[0px_3px_3px_-2px_rgba(0,0,0,0.1),0px_3px_4px_rgba(0,0,0,0.07),0px_1px_8px_rgba(0,0,0,0.06)] ">
          <div className="flex w-full max-w-[1170px] items-start justify-between gap-[12px] max-sm:flex-col max-sm:items-start ">
            <div className="flex min-w-0 items-center gap-[20px] flex-1">
              <div className="relative h-[116px] w-[116px] shrink-0 overflow-hidden rounded-[8px]  ">
                <Image src={primaryImageFromItem(item, mode)} alt={title || 'Listing'} className='w-[116px] h-[116px] object-cover' width={116} height={116} />
              </div>
              <div className='flex flex-col gap-[12px] min-w-0'>
                <h1 className="text-[20px] font-[Inter-SemiBold] text-[#23262A] leading-[20px] truncate">{title}</h1>
                <p className="text-[18px] font-[Inter-Medium] text-[#DC0000] truncate">AED <span
                  className="font-[Inter-Bold] text-[20px]">{priceLabel || '2220'}</span></p>
                <div className='flex items-center gap-[8px] max-sm:flex-wrap'>
                  <button
                    type="button"
                    onClick={handleOpenSaveAdsWithLoginCheck}
                    aria-label="Favourite"
                    className="cursor-pointer inline-flex  items-center gap-[8px] rounded-[6px] border border-[#23262a80] bg-white p-[4px_10px]"
                  >
                    <FavouriteIcon
                      className={`h-[16px] w-[16px] ${item?.is_saved ? 'text-[#DC0000]' : 'text-[#8F8F8F]'}`}
                      fill={item?.is_saved ? '#DC0000' : '#fff'}
                      stroke={item?.is_saved ? '#DC0000' : '#000'}
                    />
                    <p className="text-[12px] font-[Inter-Medium] text-[#23262a]">Favorite</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsShareOpen(true)}
                    aria-label="Share"
                    className="cursor-pointer inline-flex  items-center gap-[8px] rounded-[6px] border border-[#23262a80] bg-white p-[4px_10px]"
                  >
                    <ShareIcon className="h-[16px] w-[16px]" fill="#000" />
                    <p className="text-[12px] font-[Inter-Medium] text-[#23262a]">Share</p>
                  </button>
                </div>
              </div>
            </div>
            {showChatWithSeller ? (
              <div className='max-sm:w-full'>
                <button
                  type="button"
                  onClick={handleChatWithSeller}
                  disabled={isStartingChat}
                  className="flex w-full cursor-pointer items-center justify-center gap-[10px] rounded-[8px] bg-[#DC0000] p-[12px_80px] text-[14px] font-[Inter-Bold] text-white transition-opacity hover:opacity-95 max-sm:p-[12px]"
                >
                  <Image src={chatwhite} alt="" width={18} height={18} />
                  Chat With Seller
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <SaveAdsModal
        open={isSaveAdsOpen}
        onClose={() => setIsSaveAdsOpen(false)}
        onConfirm={() => setIsSaveAdsOpen(false)}
        onNewList={() => { }}
        lists={SAVE_ADS_LISTS}
        currentListIndex={0}
        itemId={item?.id}
      />
      <SharePopup
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        shareUrl={shareUrl}
        title={title || 'Listing'}
      />
      <LoginModal
        IsLoginModalOpen={isLoginModalOpen}
        setIsLoginModalOpen={setIsLoginModalOpen}
        IsRegisterModalOpen={isRegisterModalOpen}
        setIsRegisterModalOpen={setIsRegisterModalOpen}
        IsMailSentOpen={isMailSentOpen}
        setIsMailSentOpen={setIsMailSentOpen}
        openSentMailModal={() => {
          setIsLoginModalOpen(false)
          setIsMailSentOpen(true)
        }}
      />
    </div>
  )
}

export default ClassifiedDetail