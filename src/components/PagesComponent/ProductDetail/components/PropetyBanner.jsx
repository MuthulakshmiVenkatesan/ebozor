/* eslint-disable react/prop-types */
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { GalleryIcon } from '@/components/CustomFile/icons'
import { placeholderImage } from '@/utils'
import verifiedicon from '../../../../../public/assets/img/icons/verifiedicon.svg'
import PhotoTourModal from './PhotoTourModal'
import Verified from '../../CommonComponents/Verified'

function getItemImages(item) {
  const imgs =
    item?.images ||
    item?.image_gallery ||
    item?.gallery_images ||
    item?.photos ||
    item?.image_urls ||
    []

  const arr = Array.isArray(imgs) ? imgs : []
  const normalized = arr
    .map((v) => {
      if (!v) return ''
      if (typeof v === 'string') return v.trim()
      if (typeof v === 'object') {
        const guess =
          v?.url ||
          v?.image ||
          v?.src ||
          v?.path ||
          v?.photo ||
          v?.image_url ||
          v?.imageUrl ||
          ''
        return typeof guess === 'string' ? guess.trim() : ''
      }
      return ''
    })
    .filter(Boolean)

  if (normalized.length) return normalized
  if (typeof item?.image === 'string' && item.image.trim()) return [item.image.trim()]
  return []
}

const PROPERTY_FALLBACK = ['/assets/img/property/1.png', '/assets/img/property/2.png', '/assets/img/property/3.png']
const MOTORS_FALLBACK = ['/assets/img/car.png', '/assets/img/anothercar.png', '/assets/img/sellcar.png']

/**
 * @param {object} productData
 * @param {'property' | 'motors'} [variant='property'] — motors: car fallbacks, no property “Verified” chip, light gallery count pill
 */
export default function PropetyBanner({ productData, variant = 'property' }) {
  const isMotors = variant === 'motors'
  const [isTourOpen, setIsTourOpen] = useState(false)
  const [isVerifiedOpen, setIsVerifiedOpen] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const images = getItemImages(productData || {})
  const fallback = isMotors ? MOTORS_FALLBACK : PROPERTY_FALLBACK
  const allImages = images.length ? images : fallback

  const mainImage = allImages[0] || fallback[0]
  const rightTopImage = allImages[1] || mainImage
  const rightBottomImage = allImages[2] || rightTopImage
  const user = productData?.user || {}
  const agentName =
    user?.name ||
    productData?.agent_name ||
    productData?.dealer_name ||
    productData?.company_name ||
    productData?.agent?.name ||
    productData?.owner_name ||
    ''
  const agentCompany =
    productData?.agency_name ||
    productData?.dealer_name ||
    productData?.company_name ||
    productData?.agent?.company ||
    productData?.category?.name ||
    ''
  const agentImage =
    user?.profile ||
    productData?.agent_image ||
    productData?.agent?.image ||
    productData?.agent?.avatar ||
    ''

  const openTour = (index = 0) => {
    setActiveImageIndex(index)
    setIsTourOpen(true)
  }

  return (
    <>
      <div className="w-full">
        <div className="grid grid-cols-[2fr_1fr] gap-[8px] max-sm:grid-cols-1 mb-[30px]">
          <div
            className="group relative h-[500px] overflow-hidden rounded-[16px_0px_0px_16px] max-sm:h-[260px] cursor-pointer"
            onClick={() => openTour(0)}
          >
            <Image
              src={mainImage}
              alt={isMotors ? String(productData?.title || productData?.name || 'Vehicle') : 'Property'}
              fill
              sizes="(max-width: 640px) 100vw, 66vw"
              className="object-cover"
              onErrorCapture={placeholderImage}
            />
            {!isMotors ? (
              <button
                type="button"
                className="absolute left-[10px] top-[10px] z-[2] rounded-[6px] bg-[#fff] px-[6px] py-[3px] flex items-center gap-[4px] cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsVerifiedOpen(true)
                }}
              >
                <Image src={verifiedicon} alt="verified" width={14} height={14} />
                <p className="text-[14px] font-[Inter-Medium] text-[#23262A]">Verified</p>
              </button>
            ) : null}
            <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
          </div>

          <div className="grid grid-rows-2 gap-[8px] max-sm:grid-rows-1 max-sm:grid-cols-2">
            <div
              className="group relative h-[246px] overflow-hidden rounded-[0px_16px_0px_0px] max-sm:h-[180px] cursor-pointer"
              onClick={() => openTour(1)}
            >
              <Image
                src={rightTopImage}
                alt={isMotors ? 'Vehicle preview 1' : 'Property preview 1'}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover"
                onErrorCapture={placeholderImage}
              />
              <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
            </div>
            <div
              className="group relative h-[246px] overflow-hidden rounded-[0px_0px_16px_0px] max-sm:h-[180px] cursor-pointer"
              onClick={() => openTour(2)}
            >
              <Image
                src={rightBottomImage}
                alt={isMotors ? 'Vehicle preview 2' : 'Property preview 2'}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover"
                onErrorCapture={placeholderImage}
              />
              <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  openTour(2)
                }}
                className={`z-[9] absolute bottom-[10px] right-[10px] flex items-center justify-center gap-[4px]
                    rounded-[6px] bg-[rgba(0,0,0,0.6)] p-[4px_6px]
                }`}
              >
                <GalleryIcon className={`w-[16px] h-[16px] text-white`} />
                <p className={`text-[12px] font-[Inter-SemiBold] text-white`}>
                  {allImages.length}
                </p>
              </button>
            </div>
          </div>
        </div>

      </div>
      <PhotoTourModal
        open={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        images={allImages}
        activeImageIndex={activeImageIndex}
        onActiveImageChange={setActiveImageIndex}
        title={productData?.title || productData?.name || 'Listing'}
        agentName={agentName}
        agentCompany={agentCompany}
        agentImage={agentImage}
        price={productData?.price}
        beds={productData?.beds}
        baths={productData?.baths}
        sqft={productData?.sqft}
        location={productData?.address || productData?.location || productData?.city || productData?.state || ''}
        referenceCode={productData?.reference_code}
        itemId={productData?.id}
        slug={productData?.slug || productData?.id}
        whatsappNumber={productData?.whatsapp || productData?.whatsapp_number || user?.mobile}
        whatsappMessage={productData?.whatsapp_message}
        phoneNumber={productData?.phone || productData?.mobile || user?.mobile || user?.phone}
        userName={user?.name}
        userEmail={user?.email}
        userPhone={user?.mobile || user?.phone}
      />
      {!isMotors ? (
        <Verified
          open={isVerifiedOpen}
          onClose={() => setIsVerifiedOpen(false)}
          title="Verified"
        />
      ) : null}
    </>
  )
}
