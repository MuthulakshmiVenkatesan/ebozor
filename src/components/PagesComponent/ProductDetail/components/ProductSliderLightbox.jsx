/* eslint-disable react/prop-types */
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FavouriteIcon, ShareIcon, PaginationNextIcon, PaginationPrevIcon, CloseIcon } from '@/components/CustomFile/icons'
import SaveAdsModal from '@/components/PagesComponent/Products/components/SaveAds'
import SharePopup from '@/components/PagesComponent/Products/components/SharePopup'

const SAVE_ADS_LISTS = [
  { name: 'All Favorites', count: 154, isDefault: true },
  { name: 'Property Watchlist', count: 12 },
]

export default function ProductSliderLightbox({
  images,
  activeIndex,
  canPrev,
  canNext,
  onPrev,
  onNext,
  isOpen,
  onClose,
  isSaved,
  onToggleSave,
  onShare,
  shareUrl = '',
  title = 'Listing',
}) {
  const [isSaveAdsOpen, setIsSaveAdsOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  if (!isOpen) return null
  const activeImage = images[activeIndex] || images[0]

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#000]">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-[1] flex h-full w-full flex-col text-white">
        <div className="mb-[12px] flex items-center justify-between bg-[#ffffff1a] p-[14px_20px]">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer flex items-center gap-[10px]"
          >
            <CloseIcon className="w-[12px] h-[12px]" fill="#fff" fillOpacity="1" />
            <p className="text-[14px] font-[Inter-Regular] text-[#fff]">Close</p>
          </button>
          <div className="flex items-center gap-[10px]">
            <button
              type="button"
              onClick={() => {
                onToggleSave?.()
                setIsSaveAdsOpen(true)
              }}
              aria-label="Favourite"
              className="cursor-pointer inline-flex items-center gap-[8px] rounded-[6px] bg-[rgba(0,0,0,0.35)] p-[6px_12px]"
            >
              <FavouriteIcon
                className={`h-[18px] w-[18px] ${isSaved ? 'text-[#DC0000]' : 'text-white'}`}
                fill={isSaved ? '#DC0000' : '#000'}
                stroke="#fff"
              />
              <p className="text-[14px] font-[Inter-Regular] text-[#fff]">Favorite</p>
            </button>
            <button
              type="button"
              onClick={() => {
                onShare?.()
                setIsShareOpen(true)
              }}
              aria-label="Share"
              className="cursor-pointer inline-flex items-center gap-[8px] rounded-[6px] bg-[rgba(0,0,0,0.35)] p-[6px_12px]"
            >
              <ShareIcon className="h-[18px] w-[18px]" fill="#fff" />
              <p className="text-[14px] font-[Inter-Regular] text-[#fff]">Share</p>
            </button>
          </div>
        </div>

        <div className="relative flex-1 max-sm:p-[10px]">
          <div className="relative mx-auto h-[500px] max-sm:h-[300px] max-sm:w-full w-full max-w-[780px] overflow-hidden rounded-[4px] bg-black">
            <Image
              src={activeImage}
              alt="Listing large"
              className=" w-full h-full object-cover"
              fill
            />
            {/* {canPrev ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onPrev()
                }}
                aria-label="Previous image"
                className="cursor-pointer absolute left-[16px] top-1/2 inline-flex h-[40px] w-[40px] -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(0,0,0,0.75)] text-[22px] text-white"
              >
                <PaginationPrevIcon className="h-[12px] w-[12px]" stroke="#fff" />
              </button>
            ) : null}
            {canNext ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onNext()
                }}
                aria-label="Next image"
                className="cursor-pointer absolute right-[16px] top-1/2 inline-flex h-[40px] w-[40px] -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(0,0,0,0.75)] text-[22px] text-white"
              >
                <PaginationNextIcon className="h-[12px] w-[12px]" stroke="#fff" />
              </button>
            ) : null} */}
          </div>

          <div className="mt-[18px] flex items-center justify-center gap-[16px] rtl:flex-row-reverse">
            <button
              type="button"
              onClick={onPrev}
              disabled={!canPrev}
              className="cursor-pointer flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#1f2933] text-white disabled:opacity-40"
            >
              <PaginationPrevIcon className="h-[12px] w-[12px]" stroke="#fff" />
            </button>
            <p className="text-[14px] font-[Inter-Regular] text-[rgba(255,255,255,0.6)]">
              Showing {activeIndex + 1} of {images.length}
            </p>
            <button
              type="button"
              onClick={onNext}
              disabled={!canNext}
              className="cursor-pointer flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#1f2933] text-white disabled:opacity-40"
            >
              <PaginationNextIcon className="h-[12px] w-[12px]" stroke="#fff" />
            </button>
          </div>
        </div>
      </div>
      <SaveAdsModal
        open={isSaveAdsOpen}
        onClose={() => setIsSaveAdsOpen(false)}
        onConfirm={() => setIsSaveAdsOpen(false)}
        onNewList={() => {}}
        lists={SAVE_ADS_LISTS}
        currentListIndex={0}
      />
      <SharePopup
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        shareUrl={shareUrl || (typeof window !== 'undefined' ? window.location.href : '')}
        title={title}
      />
    </div>
  )
}

