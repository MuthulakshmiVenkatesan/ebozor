/* eslint-disable react/prop-types */
'use client'

import Image from 'next/image'
import whatsapp from '../../../../../public/assets/img/icons/whatsapp.svg'
import download from '../../../../../public/assets/img/icons/download.svg'
function firstTruthy(...vals) {
    for (const v of vals) {
        if (v !== undefined && v !== null && v !== '') return v
    }
    return ''
}

function getProjectImage(item) {
    const imgs = item?.images || item?.gallery_images || item?.image_gallery || []
    const arr = Array.isArray(imgs) ? imgs : []
    for (const v of arr) {
        if (!v) continue
        if (typeof v === 'string' && v.trim()) return v.trim()
        if (typeof v === 'object') {
            const g = v?.url || v?.image || v?.src || v?.path || v?.image_url || v?.imageUrl
            if (typeof g === 'string' && g.trim()) return g.trim()
        }
    }
    if (typeof item?.image === 'string' && item.image.trim()) return item.image.trim()
    return '/assets/img/property/1.png'
}

export default function NewProjectRight({ productData = {}, onWhatsApp, onDownloadBrochure }) {
    const title = firstTruthy(productData?.title, productData?.name, 'Binghatti Apex')
    const brochureUrl = firstTruthy(productData?.brochure_url, productData?.brochureUrl, '#')
    const hasBrochure = Boolean(String(brochureUrl || '').trim() && String(brochureUrl).trim() !== '#')
    const imageUrl = getProjectImage(productData)

    return (
        <div className="flex w-full flex-col gap-[18px]">
            <div className="rounded-[8px] border border-[#e0e1e3] bg-white p-[16px] flex flex-col gap-[16px]">
                <h3 className="text-center text-[18px] font-[Inter-Bold] text-[#23262A]">Contact Us</h3>
                <p className="text-center text-[14px] font-[Inter-Regular] text-[#23262A]">
                    Register your interest for <span className="font-[Inter-SemiBold]">{title}</span>
                </p>
                {/* <button
                    type="button"
                    onClick={() => onWhatsApp?.()}
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-[8px] rounded-[8px] bg-[#EAF9EF] py-[10px]"
                >
                    <Image src={whatsapp} alt="whatsapp" width={20} height={20} />
                    <p className="text-[16px] font-[Inter-SemiBold] text-[#23262A]">WhatsApp</p>
                </button> */}
            </div>

            <div className="rounded-[8px] border border-[#e0e1e3] bg-white p-[40px_16px] flex flex-col gap-[16px]">
                <div className=" flex justify-center">
                    <div className="relative h-[120px] w-[96px] overflow-hidden rounded-[8px]">
                        <Image src={imageUrl} alt={title} fill className="object-cover" />
                    </div>
                </div>
                <p className="px-[24px] leading-[22px] text-center text-[14px] font-[Inter-Regular] text-[#23262A]">
                    Learn more about {title}
                </p>
                {/* <button
                    type="button"
                    disabled={!hasBrochure}
                    onClick={() => onDownloadBrochure?.()}
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-[8px] rounded-[6px] bg-[#3a88ef14] py-[10px] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Image src={download} alt="download" width={14} height={14} />
                    <span className="text-[14px] font-[Inter-Medium] text-[#23262A]">Download Brochure</span>
                </button> */}
            </div>
        </div>
    )
}
