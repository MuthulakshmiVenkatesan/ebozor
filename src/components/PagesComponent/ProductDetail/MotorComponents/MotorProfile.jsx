/* eslint-disable react/prop-types */
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import { VerifiedBadge, StarIcon } from '@/components/CustomFile/icons'
import chatwhite from '../../../../../public/assets/img/icons/chatwhite.svg'
import verifiedbusiness from '../../../../../public/assets/img/icons/verifiedbusiness.svg'
import phoneOutline from '../../../../../public/assets/img/icons/phoneOutline.svg'
import VerifiedMain from '../../GetVerified/VerifiedMain'
function firstTruthy(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== '') return v
  }
  return ''
}

function normalizeVerified(...vals) {
  for (const v of vals) {
    if (v === true) return true
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase()
      if (s === '1' || s === 'true' || s === 'yes') return true
    }
    if (typeof v === 'number' && v === 1) return true
  }
  return false
}

export default function MotorProfile({ productData, onChat, onShowPhone, showChatWithSeller = true }) {
  const item = productData || {}

  const profile = useMemo(() => {
    const user = item?.user && typeof item.user === 'object' ? item.user : null
    const userId = firstTruthy(item?.user_id, item?.seller_id, user?.id)
    const name = firstTruthy(
      item?.seller_name,
      item?.user_name,
      item?.listed_by,
      item?.company_name,
      user?.name,
      user?.full_name,
      'Seller'
    )
    const avatar = firstTruthy(
      item?.seller_image,
      item?.user_image,
      item?.profile_image,
      user?.profile,
      user?.image,
      user?.profile_image,
      user?.avatar,
      '/assets/img/user.jpeg'
    )
    const ratingRaw = firstTruthy(item?.seller_rating, item?.rating, user?.rating, '5.0')
    const rating = typeof ratingRaw === 'number' ? ratingRaw.toFixed(1) : String(ratingRaw)
    const verified = normalizeVerified(
      item?.verified_user,
      item?.is_verified_user,
      user?.verified,
      user?.is_verified
    )
    const liveCount = firstTruthy(
      item?.overall_count,
      user?.overall_count,
      item?.items_live,
      item?.active_listings,
      user?.items_count,
      user?.listings_count
    )

    return { name, avatar, rating, verified, liveCount, userId }
  }, [item])

  const showVerifiedBusiness = normalizeVerified(
    item?.verified_business,
    item?.is_verified_business,
    item?.business_verified,
    item?.user?.is_business_verified
  )
  const isVerifiedUser = profile.verified

  return (
    <div className="flex w-full flex-col gap-[20px]">
      <div className='border-b border-[rgba(143,143,143,0.18)] pb-[24px]'>
        <div className="rounded-[6px] border border-[#EAEBED] bg-white p-[16px] shadow-[0_4px_16px_rgba(0,0,0,0.03)] ">
          <div className="mb-[18px] flex gap-[16px]">
            {/* <p className="text-[12px] font-[Inter-Regular] text-[#666]">Posted by</p> */}
            <div>
              <Image src={profile.avatar} alt={profile.name} width={56} height={56} className="w-[56px] h-[56px] object-cover rounded-full " />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="mb-[2px] text-[18px] font-[Inter-SemiBold] text-[#23262A]">{profile.name}</h3>
              <div className="mb-[6px] flex flex-wrap items-center gap-[8px]">
                <div className="inline-flex items-center gap-[6px] rounded-[6px] border border-[rgba(143,143,143,0.35)] p-[3px_6px]">
                  <StarIcon className="h-[10px] w-[10px]" fill="#000" />
                  <p className="text-[12px] font-[Inter-SemiBold] text-[#23262A]">{profile.rating}</p>
                </div>
                {showVerifiedBusiness ? (
                  <div className="rounded-[6px] flex items-center gap-[4px] bg-[#f1f8f1] border border-[#dcedc8] p-[3px_5px]">
                    <Image src={verifiedbusiness} alt="verifiedbusiness" className="h-[18px] w-[18px]" />
                    <p className="text-[10px] font-[Inter-Bold] text-[#059f01] uppercase">VERIFIED BUSINESS</p>
                  </div>
                ) : isVerifiedUser ? (
                  <div className="rounded-[6px] flex items-center gap-[4px] bg-[#F5F9FE] border border-[#B0D0F9] p-[3px_5px]">
                    <div className="w-[18px] h-[18px]">
                      <VerifiedBadge className="w-[18px] h-[18px]" fill="#3A88EF" />
                    </div>
                    <p className='text-[10px] font-[Inter-Bold] text-[#3A88EF] uppercase'>VERIFIED USER</p>
                  </div>
                ) : null}
              </div>
              {/* <h4 className="mb-[16px] text-[16px] font-[Inter-Regular] text-[#23262A]">
                Joined on December 2025
              </h4> */}
              <Link href={{ pathname: '/publicprofile', query: { user_id: profile.userId } }} className="text-[14px] font-[Inter-SemiBold] text-[#3a88ef]">
                {profile.liveCount} items live
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-[14px]">
            {showChatWithSeller ? (
              <button
                type="button"
                onClick={onChat}
                className="flex w-full cursor-pointer items-center justify-center gap-[10px] rounded-[8px] bg-[#DC0000] py-[12px] text-[14px] font-[Inter-Bold] text-white transition-opacity hover:opacity-95"
              >
                <Image src={chatwhite} alt="" width={18} height={18} />
                Chat With Seller
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onShowPhone?.()}
              className="flex w-full cursor-pointer items-center justify-center gap-[10px] rounded-[8px] bg-[#fff] py-[12px] text-[14px] font-[Inter-Bold] text-[#23262A] border border-[#23262A]"
            >
              <Image src={phoneOutline} alt="" width={18} height={18} />
              Show Number
            </button>
          </div>

        </div>
      </div>

      <div>
        <VerifiedMain showTickBadge={false} />
      </div>
    </div>
  )
}
