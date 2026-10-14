/* eslint-disable react/prop-types */
'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { FavouriteIcon, ShareIcon, PaginationNextIcon, PaginationPrevIcon } from '@/components/CustomFile/icons'
import ProductSliderLightbox from '../components/ProductSliderLightbox'
import SaveAdsModal from '@/components/PagesComponent/Products/components/SaveAds'
import SharePopup from '@/components/PagesComponent/Products/components/SharePopup'
import { manageFavouriteApi } from '@/utils/api'
import LoginModal from '@/components/Auth/LoginModal'
import { isLogin } from '@/utils'

const SAVE_ADS_LISTS = [
  { name: 'All Favorites', count: 154, isDefault: true },
  { name: 'Classified Watchlist', count: 12 },
]

function normalizeImages(item, mode) {
  const normalizedMode = (mode || '').toLowerCase()
  const fallbackImages =
    normalizedMode === 'furniture'
      ? ['/assets/img/furniture/1.png', '/assets/img/furniture/2.png', '/assets/img/furniture/3.png']
      : normalizedMode === 'mobile'
        ? ['/assets/img/mobile/1.png', '/assets/img/mobile/2.png', '/assets/img/mobile/3.png']
        : ['/assets/img/classified/1.png', '/assets/img/classified/2.png', '/assets/img/classified/3.png']

  const imgs = item?.images || item?.gallery_images || item?.image_gallery || item?.photos || item?.image_urls || []
  const arr = Array.isArray(imgs) ? imgs : []
  const normalized = arr
    .map((v) => {
      if (!v) return ''
      if (typeof v === 'string') return v.trim()
      if (typeof v === 'object') {
        const guess = v?.url || v?.image || v?.src || v?.path || v?.photo || v?.image_url || v?.imageUrl || ''
        return typeof guess === 'string' ? guess.trim() : ''
      }
      return ''
    })
    .filter(Boolean)

  if (normalized.length > 0) return normalized

  if (typeof item?.image === 'string' && item.image.trim()) {
    return [item.image.trim()]
  }

  return fallbackImages
}

export default function ProductSlider({ productData, isSaved, onToggleSave, onShare, mode, slug }) {
  const images = useMemo(() => normalizeImages(productData, mode), [productData, mode])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isSaveAdsOpen, setIsSaveAdsOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [isMailSentOpen, setIsMailSentOpen] = useState(false)
  const [isSavingFavourite, setIsSavingFavourite] = useState(false)
  const [touchStartX, setTouchStartX] = useState(null)
  const [touchEndX, setTouchEndX] = useState(null)

  useEffect(() => {
    setActiveIndex(0)
  }, [images.length])

  const canSlide = images.length > 1
  const activeImage = images[activeIndex] || images[0]
  const thumbImages = images.length
    ? images
    : ['/assets/img/classified/1.png', '/assets/img/classified/2.png', '/assets/img/classified/3.png', '/assets/img/classified/4.png', '/assets/img/classified/5.png']

  const canPrev = canSlide && activeIndex > 0
  const canNext = canSlide && activeIndex < images.length - 1
  const detailSlug = slug || productData?.slug || productData?.id || ''
  const shareBase = process.env.NEXT_PUBLIC_WEB_URL || ''
  const shareUrl = detailSlug
    ? `${shareBase.replace(/\/$/, '')}/productdetail?slug=${encodeURIComponent(String(detailSlug))}`
    : (typeof window !== 'undefined' ? window.location.href : '')

  const goPrev = () => {
    if (!canPrev) return
    setActiveIndex((prev) => Math.max(0, prev - 1))
  }

  const goNext = () => {
    if (!canNext) return
    setActiveIndex((prev) => Math.min(images.length - 1, prev + 1))
  }

  const onTouchStart = (event) => {
    setTouchEndX(null)
    setTouchStartX(event?.targetTouches?.[0]?.clientX ?? null)
  }

  const onTouchMove = (event) => {
    setTouchEndX(event?.targetTouches?.[0]?.clientX ?? null)
  }

  const onTouchEnd = () => {
    if (!canSlide || touchStartX === null || touchEndX === null) return
    const distance = touchStartX - touchEndX
    const minSwipeDistance = 50
    if (distance > minSwipeDistance) goNext()
    if (distance < -minSwipeDistance) goPrev()
  }

  const handleOpenSaveAds = async () => {
    if (isSavingFavourite) return
    const itemId = productData?.id
    if (!itemId) {
      setIsSaveAdsOpen(true)
      return
    }
    setIsSavingFavourite(true)
    try {
      await manageFavouriteApi.manageFavouriteApi({ item_id: itemId })
      // Update favorite icon state only after API success.
      onToggleSave?.()
      setIsSaveAdsOpen(true)
    } catch (e) {
      console.error('Failed to pre-save favourite:', e)
    } finally {
      setIsSavingFavourite(false)
    }
  }

  const handleOpenSaveAdsWithLoginCheck = () => {
    if (isLogin()) {
      handleOpenSaveAds()
      return
    }
    setIsLoginModalOpen(true)
  }

  return (
    <div className="mb-[24px]">
      <div className="relative overflow-hidden rounded-[12px] bg-white ">
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="cursor-pointer relative block h-[500px] w-full overflow-hidden rounded-[12px] max-sm:h-[300px]"
        >
          <Image
            src={activeImage}
            alt="Listing"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 760px"
          />
        </button>

        <div className="absolute right-[20px] top-[16px] flex items-center gap-[8px]">
          <button
            type="button"
            onClick={() => {
              handleOpenSaveAdsWithLoginCheck()
            }}
            aria-label="Favourite"
            className="cursor-pointer inline-flex  items-center gap-[8px] rounded-[6px] border border-[#23262a80] bg-white p-[4px_10px]"
          >
            <FavouriteIcon
              className={`h-[16px] w-[16px] ${isSaved ? 'text-[#DC0000]' : 'text-[#8F8F8F]'}`}
              fill={isSaved ? '#DC0000' : '#fff'}
              stroke={isSaved ? '#DC0000' : '#000'}
            />
            <p className="text-[12px] font-[Inter-Medium] text-[#23262a]">Favorite</p>
          </button>
          <button
            type="button"
            onClick={() => {
              onShare?.()
              setIsShareOpen(true)
            }}
            aria-label="Share"
            className="cursor-pointer inline-flex  items-center gap-[8px] rounded-[6px] border border-[#23262a80] bg-white p-[4px_10px]"
          >
            <ShareIcon className="h-[16px] w-[16px]" fill="#000" />
            <p className="text-[12px] font-[Inter-Medium] text-[#23262a]">Share</p>
          </button>
        </div>

        {canPrev ? (
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous image"
            className="cursor-pointer absolute left-[16px] top-1/2 inline-flex h-[40px] w-[40px] -translate-y-1/2 items-center justify-center rounded-full bg-white text-[22px] text-[#23262A] shadow-[0_8px_18px_rgba(15,23,42,0.25)] max-sm:hidden"
          >
            <PaginationPrevIcon className="h-[10px] w-[10px]" stroke="#000" />
          </button>
        ) : null}
        {canNext ? (
          <button
            type="button"
            onClick={goNext}
            aria-label="Next image"
            className="cursor-pointer absolute right-[16px] top-1/2 inline-flex h-[40px] w-[40px] -translate-y-1/2 items-center justify-center rounded-full bg-white text-[22px] text-[#23262A] shadow-[0_8px_18px_rgba(15,23,42,0.25)] max-sm:hidden"
          >
            <PaginationNextIcon className="h-[10px] w-[10px]" stroke="#000" />
          </button>
        ) : null}
      </div>

      {canSlide ? (
        <div className="mt-[10px] hidden items-center justify-center gap-[6px] max-sm:flex">
          {images.map((img, idx) => (
            <button
              key={`dot-${img}-${idx}`}
              type="button"
              aria-label={`Go to image ${idx + 1}`}
              onClick={() => setActiveIndex(idx)}
              className={`h-[7px] rounded-full transition-all ${idx === activeIndex ? 'w-[18px] bg-[#23262A]' : 'w-[7px] bg-[#cfd4dc]'}`}
            />
          ))}
        </div>
      ) : null}

      {thumbImages.length ? (
        <div className="mt-[10px] flex items-center gap-[10px] overflow-x-auto pb-[2px] max-sm:hidden">
          {thumbImages.map((img, idx) => {
            const active = img === activeImage
            return (
              <button
                key={`${img}-${idx}`}
                type="button"
                aria-label={`Image ${idx + 1}`}
                onClick={() => {
                  const hitIndex = images.indexOf(img)
                  if (hitIndex >= 0) setActiveIndex(hitIndex)
                }}
                className={`cursor-pointer relative h-[82px] w-[82px] shrink-0 overflow-hidden rounded-[10px] border ${active ? 'border-[rgba(0,0,0,0.5)]' : 'border-transparent'}`}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  width={82}
                  height={82}
                  className={`${active ? 'opacity-[1]' : 'opacity-[0.6]'} h-[82px] w-[82px] object-cover transition hover:opacity-[1]`}
                />
              </button>
            )
          })}
        </div>
      ) : null}

      <ProductSliderLightbox
        images={images}
        activeIndex={activeIndex}
        canPrev={canPrev}
        canNext={canNext}
        onPrev={goPrev}
        onNext={goNext}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        isSaved={isSaved}
        onToggleSave={onToggleSave}
        onShare={onShare}
        shareUrl={shareUrl}
        title={productData?.title || productData?.name || 'Listing'}
      />
      <SaveAdsModal
        open={isSaveAdsOpen}
        onClose={() => setIsSaveAdsOpen(false)}
        onConfirm={() => setIsSaveAdsOpen(false)}
        onNewList={() => { }}
        lists={SAVE_ADS_LISTS}
        currentListIndex={0}
        itemId={productData?.id}
      />
      <SharePopup
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        shareUrl={shareUrl}
        title={productData?.title || productData?.name || 'Listing'}
      />
      <LoginModal
        IsLoginModalOpen={isLoginModalOpen}
        setIsLoginModalOpen={setIsLoginModalOpen}
        IsRegisterModalOpen={isRegisterModalOpen}
        setIsRegisterModalOpen={setIsRegisterModalOpen}
        IsMailSentOpen={isMailSentOpen}
        setIsMailSentOpen={setIsMailSentOpen}
        openSentMailModal={() => { }}
      />
    </div>
  )
}
