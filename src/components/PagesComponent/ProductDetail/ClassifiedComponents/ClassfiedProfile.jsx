/* eslint-disable react/prop-types */
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import { VerifiedBadge, StarIcon } from '@/components/CustomFile/icons'
import chatwhite from '../../../../../public/assets/img/icons/chatwhite.svg'
import client1 from '../../../../../public/assets/img/jobs/client/1.png'
import verifiedbusiness from '../../../../../public/assets/img/icons/verifiedbusiness.svg'
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

export default function ClassfiedProfile({ productData, onChat, showChatWithSeller = true }) {
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
    item?.user?.verified_business,
    item?.user?.is_verified_business,
    item?.user?.is_business_verified
  )

  return (
    <div className="flex w-full flex-col gap-[20px]">
      <div className='border-b border-[rgba(143,143,143,0.18)] pb-[24px]'>
        <div className="rounded-[16px] bg-white p-[24px] shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.02),0px_3px_8px_rgba(0,0,0,0.02),0px_1px_10px_rgba(0,0,0,0.04)] ">
          <div className="mb-[18px] flex gap-[10px]">
            <div className="relative h-[56px] w-[56px] shrink-0 overflow-hidden">
              <Image src={profile.avatar} alt={profile.name} width={56} height={56} className="w-[56px] h-[56px] object-cover rounded-full " />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="mb-[2px] text-[18px] font-[Inter-SemiBold] text-[#23262A]">{profile.name}</h3>
              <div className="mb-[8px] flex flex-wrap items-center gap-[8px]">
                <div className="inline-flex items-center gap-[6px] rounded-[6px] border border-[rgba(143,143,143,0.35)] p-[3px_6px]">
                  <StarIcon className="h-[10px] w-[10px]" fill="#000" />
                  <p className="text-[12px] font-[Inter-SemiBold] text-[#23262A]">{profile.rating}</p>
                </div>
                {showVerifiedBusiness ? (
                  <div className="rounded-[6px] flex items-center gap-[4px] bg-[#f1f8f1] border border-[#dcedc8] p-[3px_5px]">
                    <Image src={verifiedbusiness} alt="verifiedbusiness" className="h-[18px] w-[18px]" />
                    <p className="text-[10px] font-[Inter-Bold] text-[#059f01] uppercase">VERIFIED BUSINESS</p>
                  </div>
                ) : profile.verified ? (
                  <div className="inline-flex items-center gap-[4px] rounded-[6px] border border-[#b0d0f9] bg-[#F5F9FE] p-[4px_6px]">
                    <div className="w-[14px] h-[14px]">
                      <VerifiedBadge className="h-[14px] w-[14px]" fill="#3A88EF" />
                    </div>
                    <p className="text-[10px] font-[Inter-Bold] uppercase tracking-wide text-[#3A88EF]">
                      Verified user
                    </p>
                  </div>
                ) : null}
              </div>
              <Link href={{ pathname: '/publicprofile', query: { user_id: profile.userId } }} className="text-[14px] font-[Inter-SemiBold] text-[#3A88EF]">
                {profile.liveCount} items live
              </Link>
            </div>
          </div>
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
        </div>
      </div>

      <div>
        <VerifiedMain showTickBadge={false} />
      </div>

      <div className="rounded-[6px] border border-[#eef0f1] bg-white p-[16px]">
        <div className='mb-[4px] text-right'>
          <p className="shrink-0 text-[12px] font-[Inter-Regular] text-[#B6B8B9]">Ad</p>
        </div>
        <div className="mb-[10px] flex flex-col items-start justify-between gap-[12px]">
          <h4 className="text-[16px] font-[Inter-SemiBold] text-[#23262A]">The Wilds Residences By Aldar</h4>
          <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
            1-3 BR apartments & duplexes from AED 1.6M || 65/35 payment plan | Located in Dubai
          </p>
        </div>
        <div className="flex items-center justify-between gap-[12px]">
          <div>
            <Image src={client1} alt="client1" className='w-[60px] h-[50px] object-contain' />
          </div>
          <button
            type="button"
            className="cursor-pointer rounded-[10px] bg-[#DC0000] p-[14px_20px] text-[14px] font-[Inter-Medium] text-white "
          >
            Discover More
          </button>
        </div>
      </div>
    </div>
  )
}
