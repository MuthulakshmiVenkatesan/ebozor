'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { allItemApi } from '@/utils/api'
import { PaginationNextIcon, PaginationPrevIcon, LocationIcon } from '@/components/CustomFile/icons'
import whatsapp from '../../../../../public/assets/img/icons/whatsapp.svg'
import bed from '../../../../../public/assets/img/icons/bed.svg'
import { placeholderImage } from '@/utils'
import { getProductPromotionBadge, promotionBadgeOverlayAppearance } from '@/utils/productPromotionBadge'
export const NEW_PROJECTS_DEMO = [
    {
        id: 2,
        slug: 'binghatti-ghost',
        title: 'Binghatti Ghost',
        priceLine: 'Launch Price AED 888.9K',
        ads_count: 225,
        whatsapp: '971500000000',
        downPayment: '20% Down Payment',
        beds: 'Studio-3 beds',
        location: 'Binghatti Ghost, Dubai Healthcare City Phase 2, Al Jaddaf, Dubai',
        unitType: 'Apartments',
        handover: 'Delivery by Q1 2026',
        developer: 'Binghatti Developers',
        status: 'Under Construction',
        promotionBadge: { label: 'Featured', variant: 'featured', promotionTagKey: 'featured' },
        cta: 'WhatsApp',
        logo: '/assets/img/client.png',
        images: ['/assets/img/property/2.png', '/assets/img/property/3.png', '/assets/img/property/1.png'],
    },
]

/** Demo row for `/productdetail?slug=…&mode=new-project` when the API has no match. */
export function getNewProjectDemoBySlug(rawSlug) {
    const s = String(rawSlug || '')
        .trim()
        .toLowerCase()
    if (!s) return null
    return NEW_PROJECTS_DEMO.find((p) => String(p.slug || '').toLowerCase() === s) || null
}

const COMMON_PROJECTS = [
    {
        id: 1,
        title: 'Rise by Aldar Properties',
        priceLine: 'Starting from AED 1.35M | 10% Down Payment',
        points: ['1-3 bedroom apartments', '60/40 payment plan'],
        cta: 'Register Now',
        logo: '/assets/img/client.png',
        image: '/assets/img/property/1.png',
    },
    {
        id: 2,
        title: 'The Wilds Residences by Aldar',
        priceLine: 'Starting from AED 1.6M',
        points: ['1-3 BR apartments & duplexes', '65/35 payment plan | Located in Dubai'],
        cta: 'Discover More',
        logo: '/assets/img/client.png',
        image: '/assets/img/property/3.png',
    },
]

function digitsOnly(v) {
    return String(v ?? '').replace(/\D/g, '')
}

function toMoney(v) {
    const n = Number(String(v ?? '').replace(/[^\d.]/g, ''))
    if (!Number.isFinite(n) || n <= 0) return ''
    return `AED ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)}`
}

function normalizeName(v) {
    return String(v || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
}

function readCustomFieldValue(item, names = []) {
    const list = Array.isArray(item?.custom_fields) ? item.custom_fields : []
    const target = names.map((n) => normalizeName(n))
    const row = list.find((f) => target.includes(normalizeName(f?.name)))
    if (!row) return ''
    const value = row?.value
    if (Array.isArray(value)) return String(value[0] ?? '').trim()
    return String(value ?? '').trim()
}

function getItemImages(item) {
    const gallery = Array.isArray(item?.gallery_images) ? item.gallery_images : []
    const urls = gallery
        .map((g) => String(g?.image || g?.url || '').trim())
        .filter(Boolean)
    const hero = String(item?.image || '').trim()
    if (hero) {
        if (!urls.length || urls[0] !== hero) urls.unshift(hero)
    }
    return urls.length ? urls : ['/assets/img/property/1.png']
}

function mapGetItemRowToProject(item) {
    const launchPrice = readCustomFieldValue(item, ['Launch price'])
    const downPaymentRaw = readCustomFieldValue(item, ['Down Payment'])
    const bedsRaw = String(item?.bed || '').trim() || readCustomFieldValue(item, ['Bedrooms'])
    const projectStatus = readCustomFieldValue(item, ['Project Status']) || String(item?.status || '').trim()
    const handover = readCustomFieldValue(item, ['Handover'])
    const unitType = readCustomFieldValue(item, ['Unit Type']) || String(item?.category?.translated_name || item?.category?.name || '').trim()
    const developer =
        readCustomFieldValue(item, ['Developer']) ||
        String(item?.user?.name || '').trim() ||
        'Developer'
    const companyIcon = readCustomFieldValue(item, ['Company icon'])
    const location = String(item?.address || item?.location || item?.city || '').trim()
    const promotionBadge = getProductPromotionBadge(item)

    return {
        id: item?.id,
        slug: String(item?.slug || item?.id || '').trim(),
        title: String(item?.name || item?.title || '').trim() || 'New Project',
        priceLine: launchPrice ? `Launch Price ${toMoney(launchPrice) || launchPrice}` : `Launch Price ${toMoney(item?.price) || ''}`.trim(),
        downPayment: downPaymentRaw ? `${downPaymentRaw}% Down Payment` : 'Down Payment N/A',
        beds: bedsRaw || 'N/A',
        location: location || 'Location N/A',
        unitType: unitType || 'Unit Type',
        handover: handover ? `Delivery by ${handover}` : 'Delivery TBA',
        developer,
        status: projectStatus || 'N/A',
        promotionBadge,
        cta: 'WhatsApp',
        logo: companyIcon || '/assets/img/client.png',
        images: getItemImages(item),
        whatsapp: digitsOnly(item?.contact || item?.user?.mobile),
    }
}

function NewProjectCardRow({ project }) {
    const [imgIndex, setImgIndex] = useState(0)
    const totalImages = project.images.length
    const canPrev = imgIndex > 0
    const canNext = imgIndex < totalImages - 1

    return (
        <Link
            href={`/productdetail?slug=${encodeURIComponent(project.slug || '')}&mode=new-project`}
            className="block"
        >
            <div className="w-full overflow-hidden rounded-[14px] border border-[rgba(143,143,143,0.24)] bg-white shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
                <div className="flex min-w-0 items-stretch max-sm:flex-col">
                    <div className="relative w-[350px] max-w-[350px] shrink-0 max-sm:w-full">
                        <div className="relative overflow-hidden rounded-[12px_0_0_12px] bg-[#F5F5F5]">
                            <Image
                                src={project.images[imgIndex] || '/assets/img/property/1.png'}
                                alt={project.title}
                                width={350}
                                height={340}
                                className="h-[340px] w-full object-cover"
                                onError={placeholderImage}
                            />

                            <p className="absolute left-[10px] top-[10px] z-[2] rounded-[6px] bg-white px-[8px] py-[3px] text-[12px] font-[Inter-Regular] text-[#23262A]">
                                {project.status}
                            </p>
                            {project.promotionBadge?.label ? (
                                <p {...promotionBadgeOverlayAppearance(project.promotionBadge)}>{project.promotionBadge.label}</p>
                            ) : null}

                            <button
                                type="button"
                                disabled={!canPrev}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setImgIndex((prev) => Math.max(0, prev - 1))
                                }}
                                className="disabled:opacity-0 disabled:cursor-not-allowed cursor-pointer absolute left-[10px] top-1/2 z-[2] -translate-y-1/2 flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-[rgba(0,0,0,0.35)]"
                                aria-label="Previous image"
                            >
                                <PaginationPrevIcon className="w-[10px] h-[10px] text-white" stroke="#fff" />
                            </button>

                            <button
                                type="button"
                                disabled={!canNext}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setImgIndex((prev) => Math.min(totalImages - 1, prev + 1))
                                }}
                                className="disabled:opacity-0 disabled:cursor-not-allowed cursor-pointer absolute right-[10px] top-1/2 z-[2] -translate-y-1/2 flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-[rgba(0,0,0,0.35)]"
                                aria-label="Next image"
                            >
                                <PaginationNextIcon className="w-[10px] h-[10px] text-white" stroke="#fff" />
                            </button>

                            <p className="absolute bottom-[10px] left-[10px] z-[2] rounded-[6px] bg-[rgba(0,0,0,0.45)] px-[6px] py-[2px] text-[12px] font-[Inter-Regular] text-white">
                                {imgIndex + 1}/{totalImages}
                            </p>

                            <div className="absolute bottom-[12px] left-1/2 z-[2] flex -translate-x-1/2 items-center gap-[6px]">
                                {Array.from({ length: totalImages }).map((_, idx) => (
                                    <span
                                        key={`${project.id}-dot-${idx}`}
                                        className={`h-[7px] w-[7px] rounded-full ${idx === imgIndex ? 'bg-white' : 'bg-[rgba(255,255,255,0.6)]'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0 p-[20px_22px] flex flex-col justify-between gap-[12px]">
                        <div className="flex min-w-0 flex-col gap-[8px]">
                            <h3 className="text-[20px] font-[Inter-SemiBold] text-[#23262A]">
                                {project.title}
                            </h3>
                            <p className="w-full min-w-0 truncate text-[16px] leading-[24px] font-[Inter-SemiBold] text-[#23262A]">
                                {project.priceLine}
                                <span className="mx-[8px] text-[rgba(35,38,42,0.45)]">|</span>
                                {project.downPayment}
                            </p>
                            <div className="flex items-center gap-[6px]">
                                <Image src={bed} alt="bed" width={16} height={16} />
                                <p className="text-[16px] font-[Inter-Regular] text-[#23262A]">
                                    {project.beds}
                                </p>
                            </div>
                            <div className="flex w-full min-w-0 items-center gap-[6px]">
                                <LocationIcon className="h-[16px] w-[16px] shrink-0" />
                                <p className="min-w-0 flex-1 truncate text-[14px] font-[Inter-Regular] text-[#23262A]">{project.location}</p>
                            </div>
                        </div>
                        <div className="border-t border-[rgba(143,143,143,0.2)] pt-[10px] flex items-start justify-between gap-[12px]">
                            <div className="min-w-0">
                                <div className="flex items-center gap-[8px]">
                                    <div className="relative h-[46px] w-[104px] rounded-[10px] bg-[#fff] shadow-[0px_3px_3px_-2px_rgba(0,0,0,0.1),_0px_3px_4px_rgba(0,0,0,0.07),_0px_1px_8px_rgba(0,0,0,0.06)] p-[4px]">
                                        {project.images.slice(0, 3).map((img, idx) => {
                                            const isActiveThumb = idx === imgIndex
                                            const extraCount = project.images.length - 3
                                            const showExtraBadge = idx === 2 && extraCount > 0

                                            return (
                                                <button
                                                    key={`${project.id}-thumb-${idx}`}
                                                    type="button"
                                                    onClick={() => setImgIndex(idx)}
                                                    className={`absolute top-[4px] cursor-pointer rounded-[6px] overflow-hidden border-2 border-[#fff] ${isActiveThumb ? '' : ''}`}
                                                    style={{
                                                        left: idx === 0 ? '4px' : idx === 1 ? '33px' : '59px',
                                                        zIndex: idx === 0 ? 3 : idx === 1 ? 2 : 1,
                                                    }}
                                                    aria-label={`Show thumbnail ${idx + 1}`}
                                                >
                                                    <Image
                                                        src={img}
                                                        alt="thumb"
                                                        width={38}
                                                        height={38}
                                                        className="h-[38px] w-[38px] object-cover"
                                                        onError={placeholderImage}
                                                    />
                                                    {showExtraBadge ? (
                                                        <div className="absolute inset-0 bg-[rgba(35,38,42,0.45)] flex items-center justify-center">
                                                            <p className="text-[16px] font-[Inter-SemiBold] text-white">+{extraCount}</p>
                                                        </div>
                                                    ) : null}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <div>
                                        <p className="mb-[4px] text-[16px] leading-[22px] font-[Inter-SemiBold] text-[#23262A]">{project.unitType}</p>
                                        <p className="text-[14px] leading-[20px] font-[Inter-Regular] text-[#23262A]">{project.handover}</p>
                                    </div>
                                </div>

                            </div>

                        </div>
                        <div className="flex items-end justify-between gap-[12px]">
                            <div className="flex flex-col items-start gap-[16px]">
                                <p className="text-[14px] leading-[20px] font-[Inter-Regular] text-[#23262A]">
                                    Developer: <span className="font-[Inter-SemiBold]">{project.developer}</span>
                                </p>
                                <button
                                    type="button"
                                    className="cursor-pointer flex items-center gap-[8px] rounded-[10px] bg-[#43bb3f1a] px-[16px] py-[10px]"
                                >
                                    <Image src={whatsapp} alt="WhatsApp" width={18} height={18} />
                                    <p className="text-[14px] font-[Inter-Regular] text-[#2b2d2e]">{project.cta}</p>
                                </button>
                            </div>
                            <Image
                                src={project.logo}
                                alt="developer logo"
                                width={80}
                                height={80}
                                className="h-[80px] w-[80px] object-contain"
                                onError={placeholderImage}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default function Newprojectcard() {
    const searchParams = useSearchParams()
    const searchParamsKey = searchParams?.toString?.() ?? ''
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(false)

    const getItemParams = useMemo(() => {
        const sp = searchParams
        const filterQuery = {}
        if (sp?.forEach) {
            sp.forEach((v, k) => {
                if (k.startsWith('filters[') && k.endsWith(']')) {
                    filterQuery[k] = v
                }
            })
        }

        const category_slug = String(sp?.get?.('category_slug') || '').trim()
        const search = String(sp?.get?.('search') || sp?.get?.('keyword') || '').trim()
        const city = String(sp?.get?.('city') || '').trim()
        const country = String(sp?.get?.('country') || '').trim()
        const state = String(sp?.get?.('state') || '').trim()
        const area_id = String(sp?.get?.('area_id') || '').trim()
        const building_id = String(sp?.get?.('building_id') || '').trim()
        const min_price = String(sp?.get?.('minPrice') || '').trim()
        const max_price = String(sp?.get?.('maxPrice') || '').trim()
        const hasVideo = sp?.get?.('hasVideo') === '1'
        const has360 = sp?.get?.('has360') === '1'
        const agency = String(sp?.get?.('agency') || '').trim()
        const sort_by = String(sp?.get?.('sort_by') || '').trim()

        return {
            category_slug: category_slug || undefined,
            search: search || undefined,
            city: city || undefined,
            country: country || undefined,
            state: state || undefined,
            area_id: area_id || undefined,
            building_id: building_id || undefined,
            min_price: min_price || undefined,
            max_price: max_price || undefined,
            agency: agency || undefined,
            sort_by: sort_by || undefined,
            filterQuery,
            hasVideo,
            has360,
        }
    }, [searchParamsKey, searchParams])

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            try {
                setLoading(true)
                const res = await allItemApi.getItems({
                    page: 1,
                    per_page: 15,
                    category_slug: getItemParams.category_slug,
                    search: getItemParams.search,
                    city: getItemParams.city,
                    country: getItemParams.country,
                    state: getItemParams.state,
                    area_id: getItemParams.area_id,
                    building_id: getItemParams.building_id,
                    min_price: getItemParams.min_price,
                    max_price: getItemParams.max_price,
                    agency: getItemParams.agency,
                    sort_by: getItemParams.sort_by,
                    filterQuery: {
                        ...(getItemParams.filterQuery || {}),
                        ...(getItemParams.hasVideo ? { hasVideo: '1' } : {}),
                        ...(getItemParams.has360 ? { has360: '1' } : {}),
                    },
                })
                const rows = Array.isArray(res?.data?.data?.data) ? res.data.data.data : []
                if (cancelled) return
                setProjects(rows.map(mapGetItemRowToProject))
            } catch (e) {
                if (cancelled) return
                setProjects([])
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [getItemParams])

    return (
        <div className="flex flex-col gap-[26px]">
            {loading ? (
                <div className="rounded-[12px] border border-[rgba(143,143,143,0.24)] bg-white p-[18px] text-[14px] text-[#666]">
                    Loading projects...
                </div>
            ) : null}
            {!loading && projects.length === 0 ? (
                <div className="rounded-[12px] border border-[rgba(143,143,143,0.24)] bg-white p-[18px] text-[14px] text-[#666]">
                    No new projects found.
                </div>
            ) : null}
            {projects.map((project) => (
                <NewProjectCardRow key={project.id} project={project} />
            ))}
        </div>
    )
}
