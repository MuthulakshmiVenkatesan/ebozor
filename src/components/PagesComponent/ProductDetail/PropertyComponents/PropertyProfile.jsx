/* eslint-disable react/prop-types */
'use client'
import { useState } from 'react'
import Image from 'next/image'
import mailOutline from '../../../../../public/assets/img/icons/mailOutline.svg'
import phoneOutline from '../../../../../public/assets/img/icons/phoneOutline.svg'
import whatsapp from '../../../../../public/assets/img/icons/whatsapp.svg'
import Link from 'next/link'
import { RightArrowIcon } from '@/components/CustomFile/icons'
import client1 from '../../../../../public/assets/img/client.png'
import Call from '@/components/PagesComponent/CommonComponents/Call'
import Email from '@/components/PagesComponent/CommonComponents/Email'
import { buildWhatsAppMeUrl } from '@/utils/whatsapp'
import { useLoginModalGuard } from '@/hooks/useLoginModalGuard'

function firstTruthy(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== '') return v
  }
  return ''
}

export default function PropertyProfile({
  productData,
  contactBeds,
  contactBaths,
  contactSqft,
  contactLocation,
}) {
  const item = productData || {}
  const user = item?.user || {}
  const profileName = firstTruthy(
    user?.name,
    item?.seller_name,
    item?.agent_name,
    item?.user_name,
    item?.listed_by,
    item?.company_name,
    'Mohamed Sonbol'
  )
  const profileImage = firstTruthy(
    user?.profile,
    item?.seller_image,
    item?.agent_image,
    item?.user_image,
    item?.profile_image,
    '/assets/img/user.jpeg'
  )
  const [isCallOpen, setIsCallOpen] = useState(false)
  const [isEmailOpen, setIsEmailOpen] = useState(false)
  const { requireLogin, loginModal } = useLoginModalGuard()
  const waLink = buildWhatsAppMeUrl(
    firstTruthy(item?.whatsapp, item?.whatsapp_number, user?.mobile, user?.phone),
    firstTruthy(item?.whatsapp_message, `Hi, I'm interested in ${item?.name || item?.title || 'this listing'}`)
  )
  return (
    <div className="flex w-full flex-col gap-[14px]">
      <div className="rounded-[16px] bg-white p-[16px] shadow-[0px_4px_8px_-2px_rgba(0,0,0,0.02),0px_3px_8px_rgba(0,0,0,0.02),0px_1px_10px_rgba(0,0,0,0.04)]">
        <div className="mb-[14px] flex items-center gap-[12px]">
          <Link href="#">
            <div className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-[12px] border border-[#0000001f]">
              <Image src={profileImage} alt={profileName} fill className="object-cover" />
            </div>
          </Link>
          <div className="min-w-0 flex-1 flex flex-col gap-[10px] ">
            <h3 className="truncate text-[16px] font-[Inter-SemiBold] text-[#23262A]">{profileName}</h3>
            <button type="button" className="text-left cursor-pointer text-[16px] font-[Inter-SemiBold] text-[#3A88EF]">
              View All Properties
            </button>
            <button type="button" className="text-left cursor-pointer flex items-center gap-[1px]">
              <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">View Agency Profile</p>
              <RightArrowIcon className="w-[20px] h-[20px] text-[#23262A]" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-[8px]">
          <button type="button" className="inline-flex cursor-pointer items-center justify-center gap-[6px] rounded-[8px] bg-[#EAF3FE] px-[10px] py-[10px]" onClick={() => requireLogin(() => setIsEmailOpen(true))}>
            <Image src={mailOutline} alt="email" width={18} height={18} />
            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Email</p>
          </button>
          <button type="button" className="inline-flex cursor-pointer items-center justify-center gap-[6px] rounded-[8px] bg-[#FFEFEF] px-[10px] py-[10px]" onClick={() => requireLogin(() => setIsCallOpen(true))}>
            <Image src={phoneOutline} alt="call" width={18} height={18} />
            <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">Call</p>
          </button>
          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex cursor-pointer items-center justify-center gap-[6px] rounded-[8px] bg-[#EAF6EA] px-[10px] py-[10px]"
              onClick={(e) => {
                if (!requireLogin(() => {})) e.preventDefault()
              }}
            >
              <Image src={whatsapp} alt="whatsapp" width={18} height={18} />
            </a>
          ) : (
            <button type="button" disabled className="inline-flex cursor-not-allowed items-center justify-center gap-[6px] rounded-[8px] bg-[#EAF6EA] px-[10px] py-[10px] opacity-50">
              <Image src={whatsapp} alt="whatsapp" width={18} height={18} />
            </button>
          )}
        </div>
      </div>

      {/* <div className="rounded-[6px] border border-[#eef0f1] bg-white p-[16px]">
        <div className='mb-[4px] text-right'>
          <p className="shrink-0 text-[12px] font-[Inter-Regular] text-[#B6B8B9]">Ad</p>
        </div>
        <div className="mb-[10px] flex flex-col items-start justify-between gap-[12px]">
          <h4 className="text-[16px] font-[Inter-SemiBold] text-[#23262A]"> Luxury Villas and Townhouses by DAMAC</h4>
          <p className="text-[14px] font-[Inter-Regular] text-[#23262A]">
            Off-plan Townhouses from AED 2.9M | Flexible payment plan options
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
            Enquire Now
          </button>
        </div>
      </div> */}
      <Call
        open={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        agentName={profileName || '-'}
        agencyName={firstTruthy(item?.agency_name, item?.company_name, item?.category?.name, '-')}
        agentImage={firstTruthy(profileImage, '')}
        referenceCode={firstTruthy(item?.reference_code, '-')}
        phoneNumber={firstTruthy(item?.phone, item?.mobile, user?.mobile, user?.phone, '-')}
      />
      <Email
        open={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        itemId={item?.id}
        image={item?.image}
        price={item?.price}
        beds={contactBeds ?? item?.beds}
        baths={contactBaths ?? item?.baths}
        sqft={contactSqft ?? item?.sqft}
        location={contactLocation ?? item?.location}
        referenceCode={item?.reference_code}
        userName={firstTruthy(user?.name, '-')}
        userEmail={firstTruthy(user?.email, '-')}
        userPhone={firstTruthy(user?.mobile, user?.phone, '-')}
      />
      {loginModal}
    </div>
  )
}
