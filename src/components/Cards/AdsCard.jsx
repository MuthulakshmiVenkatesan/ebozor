'use client'

import Image from 'next/image'
import Link from 'next/link'
import { placeholderImage } from '@/utils'

const normalizePrice = (value) => {
    if (value == null || value === '') return 'Price on request'
    const n = Number(String(value).replace(/,/g, ''))
    if (Number.isFinite(n)) return `AED ${n.toLocaleString('en-AE')}`
    return `AED ${value}`
}

export default function AdsCard({ data }) {
    const title = String(data?.name || data?.title || 'Untitled ad')
    const imageSrc = data?.image || data?.main_image || '/assets/img/no_img.svg'
    const priceLabel = normalizePrice(data?.price)
    const status = String(data?.status || '').trim()
    const detailHref = data?.slug ? `/productdetail?slug=${encodeURIComponent(String(data.slug))}` : '#'

    return (
        <div className="h-full overflow-hidden rounded-[8px] border border-[rgba(143,143,143,0.2)] bg-white">
            <Link href={detailHref} className="block">
                <div className="relative h-[170px] w-full bg-[#f6f7f8]">
                    <Image
                        src={imageSrc}
                        alt={title}
                        fill
                        className="object-cover"
                        onError={placeholderImage}
                        unoptimized={String(imageSrc).startsWith('http')}
                    />
                </div>
            </Link>
            <div className="p-[10px]">
                <p className="mb-[6px] line-clamp-2 text-[14px] font-[Inter-SemiBold] text-[#23262A]">{title}</p>
                <p className="mb-[4px] text-[14px] font-[Inter-Bold] text-[#23262A]">{priceLabel}</p>
                {status ? <p className="text-[12px] font-[Inter-Regular] capitalize text-[#8F8F8F]">{status}</p> : null}
            </div>
        </div>
    )
}
