/* eslint-disable react/prop-types */
'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { FavouriteIcon, ShareIcon, CategoryIcon } from '@/components/CustomFile/icons'
import { placeholderImage } from '@/utils'
import ProductSliderLightbox from '../components/ProductSliderLightbox'
import mailOutline from '../../../../../public/assets/img/icons/mailOutline.svg'
import phoneOutline from '../../../../../public/assets/img/icons/phoneOutline.svg'
import whatsapp from '../../../../../public/assets/img/icons/whatsapp.svg'
import Email from '@/components/PagesComponent/CommonComponents/Email'
import Call from '@/components/PagesComponent/CommonComponents/Call'
import SaveAdsModal from '@/components/PagesComponent/Products/components/SaveAds'
import SharePopup from '@/components/PagesComponent/Products/components/SharePopup'
import { buildWhatsAppMeUrl } from '@/utils/whatsapp'
import { useLoginModalGuard } from '@/hooks/useLoginModalGuard'
const SAVE_ADS_LISTS = [
  { name: 'All Favorites', count: 154, isDefault: true },
  { name: 'Cars Wishlist', count: 12 },
]

export default function PhotoTourModal({
  open,
  onClose,
  images,
  activeImageIndex,
  onActiveImageChange,
  agentName,
  agentCompany,
  agentImage,
  price,
  beds,
  baths,
  sqft,
  location,
  referenceCode,
  itemId,
  slug,
  title = 'Listing',
  whatsappNumber,
  whatsappMessage,
  phoneNumber,
  userName,
  userEmail,
  userPhone,
}) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isEmailOpen, setIsEmailOpen] = useState(false)
  const [isCallOpen, setIsCallOpen] = useState(false)
  const [isSaveAdsOpen, setIsSaveAdsOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const { requireLogin, loginModal } = useLoginModalGuard()

  const groupedTourImages = useMemo(() => {
    const groups = []
    for (let i = 0; i < images.length; i += 3) {
      groups.push(images.slice(i, i + 3))
    }
    return groups
  }, [images])

  useEffect(() => {
    if (!open) return undefined
    const { body } = document
    const prevOverflow = body.style.overflow
    body.style.overflow = 'hidden'
    return () => {
      body.style.overflow = prevOverflow
    }
  }, [open])

  const canPrev = activeImageIndex > 0
  const canNext = activeImageIndex < images.length - 1

  const goPrev = () => {
    if (!canPrev) return
    onActiveImageChange(activeImageIndex - 1)
  }

  const goNext = () => {
    if (!canNext) return
    onActiveImageChange(activeImageIndex + 1)
  }

  if (!open) return null

  const detailSlug = slug || ''
  const shareBase = process.env.NEXT_PUBLIC_WEB_URL || ''
  const shareUrl = detailSlug
    ? `${shareBase.replace(/\/$/, '')}/productdetail?slug=${encodeURIComponent(String(detailSlug))}`
    : (typeof window !== 'undefined' ? window.location.href : '')
  const waLink = buildWhatsAppMeUrl(whatsappNumber, whatsappMessage || `Hi, I'm interested in ${title || 'this listing'}`)
  const displayAgentName = String(agentName || '').trim() || '-'
  const displayAgentCompany = String(agentCompany || '').trim() || '-'
  const displayAgentImage = String(agentImage || '').trim()


  return (
    <div className="fixed inset-0 z-[220] bg-[#fff]">
      <div className="sticky top-0 z-[2] flex items-center justify-between bg-white p-[10px_14px] shadow-[0px_2px_4px_rgba(0,0,0,0.2)]">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-[6px] cursor-pointer"
        >
          <CategoryIcon className="w-[20px] h-[20px] rotate-180" fill="#23262A" />
        </button>
        <div className="flex items-center gap-[24px]">
          <button type="button" className="cursor-pointer inline-flex items-center gap-[6px]" onClick={() => setIsSaveAdsOpen(true)}>
            <FavouriteIcon className="h-[20px] w-[20px]" fill="#fff" stroke="#23262A" />
            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Favorite</p>
          </button>
          <button type="button" className="cursor-pointer inline-flex items-center gap-[6px]" onClick={() => setIsShareOpen(true)}>
            <ShareIcon className="h-[20px] w-[20px]" fill="#23262A" />
            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Share</p>
          </button>
        </div>
      </div>
      <div className="mx-auto h-[calc(100vh-56px)] max-w-[824px] overflow-y-auto px-[16px] py-[20px] hide_scrollbar flex flex-col gap-[12px]">
        <div className="">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="group relative h-[500px] w-full overflow-hidden rounded-[8px] max-md:h-[360px] cursor-pointer"
          >
            <Image
              src={images[activeImageIndex] || images[0]}
              alt="Active property photo"
              fill
              className="object-cover"
              onErrorCapture={placeholderImage}
            />
            <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
          </button>
        </div>

        {groupedTourImages.map((group, groupIdx) => (
          <div key={`tour-group-${groupIdx}`} className="relative">
            <div className="grid grid-cols-2 gap-[12px] max-sm:grid-cols-1">
              <button
                type="button"
                className="group relative h-[500px] overflow-hidden rounded-[8px] text-left max-sm:h-[260px] cursor-pointer"
                onClick={() => {
                  onActiveImageChange(groupIdx * 3)
                  setIsLightboxOpen(true)
                }}
              >
                <Image src={group[0] || images[0]} alt="Tour main" fill className="object-cover" onErrorCapture={placeholderImage} />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
              </button>
              <div className="grid grid-rows-2 gap-[12px] max-sm:grid-cols-2 max-sm:grid-rows-1">
                <button
                  type="button"
                  className="group relative h-[246px] overflow-hidden rounded-[8px] text-left max-sm:h-[180px] cursor-pointer"
                  onClick={() => {
                    onActiveImageChange(groupIdx * 3 + 1)
                    setIsLightboxOpen(true)
                  }}
                >
                  <Image src={group[1] || group[0] || images[0]} alt="Tour sub 1" fill className="object-cover" onErrorCapture={placeholderImage} />
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
                </button>
                <button
                  type="button"
                  className="group relative h-[246px] overflow-hidden rounded-[8px] text-left max-sm:h-[180px] cursor-pointer"
                  onClick={() => {
                    onActiveImageChange(groupIdx * 3 + 2)
                    setIsLightboxOpen(true)
                  }}
                >
                  <Image src={group[2] || group[1] || group[0] || images[0]} alt="Tour sub 2" fill className="object-cover" onErrorCapture={placeholderImage} />
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
                </button>
              </div>
            </div>
            <div className="fixed bottom-[50px] max-w-[750px] left-0 right-0 mx-auto rounded-[16px] bg-white p-[12px_16px] shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
              <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-[12px] items-center justify-between gap-[12px] max-sm:flex-col max-sm:items-start">
                <div className="flex items-center gap-[16px]">
                  {displayAgentImage ? (
                    <Image src={displayAgentImage} alt={displayAgentName} width={48} height={48} className="h-[48px] w-[48px] rounded-[6px] object-cover" onErrorCapture={placeholderImage} />
                  ) : (
                    <div className="flex h-[48px] w-[48px] items-center justify-center rounded-[6px] bg-[#EEF2F7] text-[14px] font-[Inter-SemiBold] text-[#23262A]">
                      -
                    </div>
                  )}
                  <div className="flex flex-col gap-[4px]">
                    <h4 className="text-[20px] font-[Inter-Medium] text-[#23262A]">{displayAgentName}</h4>
                    <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">{displayAgentCompany}</p>
                  </div>
                </div>
                <div className="flex items-center gap-[8px]">
                  <button type="button" className="inline-flex cursor-pointer items-center justify-center gap-[6px] rounded-[8px] bg-[#EAF3FE] w-full py-[12px]" onClick={() => requireLogin(() => setIsEmailOpen(true))}>
                    <Image src={mailOutline} alt="email" width={18} height={18} />
                    <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Email</p>
                  </button>
                  <button type="button" className="inline-flex cursor-pointer items-center justify-center gap-[6px] rounded-[8px] bg-[#FFEFEF] w-full py-[12px]" onClick={() => requireLogin(() => setIsCallOpen(true))}>
                    <Image src={phoneOutline} alt="call" width={18} height={18} />
                    <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Call</p>
                  </button>
                  {waLink ? (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex cursor-pointer items-center justify-center gap-[6px] rounded-[8px] bg-[#EAF6EA] w-full py-[12px]"
                      onClick={(e) => {
                        if (!requireLogin(() => {})) e.preventDefault()
                      }}
                    >
                      <Image src={whatsapp} alt="whatsapp" width={18} height={18} />
                    </a>
                  ) : (
                    <button type="button" disabled className="inline-flex cursor-not-allowed items-center justify-center gap-[6px] rounded-[8px] bg-[#EAF6EA] w-full py-[12px] opacity-50">
                      <Image src={whatsapp} alt="whatsapp" width={18} height={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ProductSliderLightbox
        images={images}
        activeIndex={activeImageIndex}
        canPrev={canPrev}
        canNext={canNext}
        onPrev={goPrev}
        onNext={goNext}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        isSaved={false}
        onToggleSave={() => { }}
        onShare={() => { }}
      />
      <Call
        open={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        agentName={displayAgentName}
        agencyName={displayAgentCompany}
        agentImage={displayAgentImage}
        referenceCode={referenceCode || '-'}
        phoneNumber={phoneNumber || '-'}
      />
      <Email
        open={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        itemId={itemId}
        image={images[activeImageIndex] || images[0]}
        price={price}
        beds={beds}
        baths={baths}
        sqft={sqft}
        location={location}
        referenceCode={referenceCode}
        userName={userName}
        userEmail={userEmail}
        userPhone={userPhone}
      />
      <SaveAdsModal
        open={isSaveAdsOpen}
        onClose={() => setIsSaveAdsOpen(false)}
        onConfirm={() => { }}
        onNewList={() => { }}
        lists={SAVE_ADS_LISTS}
        currentListIndex={0}
      />
      <SharePopup isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} shareUrl={shareUrl} title={title} />

      {loginModal}
    </div>
  )
}
