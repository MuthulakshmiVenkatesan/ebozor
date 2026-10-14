'use client'

import { useEffect, useMemo, useState } from 'react'
import { resolveMotorsListingItemLabel } from '@/utils/motorsListingPaths'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { allItemApi, chanegItemStatusApi, getMyItemsApi } from '@/utils/api'
import { isLogin } from '@/utils'
import { inferModeFromListing } from '@/utils/buildItemDetailHref'
import Loader from '@/components/Loader/Loader'
import JobDetail from './Pages/JobDetail'
import ProductDetailBreadcrumb from './components/Breadcrumb'
import ClassifiedDetail from './Pages/ClassifiedDetail'
import PropertyDetail from './Pages/PropertyDetail'
import NewProjectDetail from './Pages/NewProjectDetail'
import MotorDetail from './Pages/MotorDetail'
import { getNewProjectDemoBySlug } from '@/components/PagesComponent/Products/components/Newprojectcard'
import { userSignUpData } from '@/redux/reuducer/authSlice'
import DetailActionFooter from './components/DetailActionFooter'

function DeactivateConfirmModal({ open, loading, onClose, onConfirm }) {
    useEffect(() => {
        if (!open) return
        const onKeyDown = (event) => {
            if (event.key === 'Escape' && !loading) onClose?.()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [open, loading, onClose])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-[260] flex items-center justify-center bg-black/40 px-[12px]"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !loading) onClose?.()
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="deactivate-item-title"
        >
            <div
                className="w-[520px] max-w-full rounded-[10px] bg-white p-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <h3 id="deactivate-item-title" className="mb-[10px] text-[20px] font-[Inter-SemiBold] text-[#DC0000]">
                    Deactivate item?
                </h3>
                <p className="mb-[18px] text-[14px] font-[Inter-Regular] leading-[22px] text-[#000000CC]">
                    Are you sure you want to deactivate this item? It will no longer be visible to users until you activate it again.
                </p>
                <div className="flex items-center justify-end gap-[12px]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="cursor-pointer rounded-[4px] border border-[#8F8F8F] p-[10px_26px] text-[14px] font-[Inter-Medium] text-[#000000CC] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="cursor-pointer rounded-[4px] bg-[#DC0000] p-[10px_26px] text-[14px] font-[Inter-Medium] text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? 'Deactivating...' : 'Deactivate'}
                    </button>
                </div>
            </div>
        </div>
    )
}

/** Matches `get-item` list responses (same shape as {@link allItemApi.getItems}). */
function parseItemFromGetItemsResponse(response) {
    const payload = response?.data
    if (!payload || payload.error === true) return null
    const inner = payload.data
    if (!inner) return null
    const block = inner.data
    if (Array.isArray(block)) return block[0] ?? null
    if (block && typeof block === 'object' && (block.id != null || block.slug != null)) return block
    return null
}

/** Owner listings from `GET /my-items` (includes pending / under-review ads). */
function parseItemFromMyItemsResponse(response) {
    const payload = response?.data
    if (!payload || payload.error === true) return null
    const inner = payload.data
    if (inner && Array.isArray(inner.data)) return inner.data[0] ?? null
    if (Array.isArray(inner)) return inner[0] ?? null
    if (inner && typeof inner === 'object' && (inner.id != null || inner.slug != null)) return inner
    return null
}

async function fetchMyItemBySlug(slug) {
    if (!slug || !isLogin()) return null
    try {
        const bySlug = await getMyItemsApi.getMyItems({ slug })
        let row = parseItemFromMyItemsResponse(bySlug)
        if (!row && /^\d+$/.test(slug)) {
            const byId = await getMyItemsApi.getMyItems({ id: Number(slug) })
            row = parseItemFromMyItemsResponse(byId)
        }
        return row
    } catch {
        return null
    }
}

/**
 * When the jobs list shows demo rows (`demo-job-*`), the API has no matching item — use the same
 * stub data so `/productdetail?slug=demo-job-1` still renders {@link JobDetail}.
 */
function getDemoJobBySlug(rawSlug) {
    const slug = String(rawSlug || '').trim()
    if (!slug) return null

    const fixed = [
        {
            id: 1,
            slug: 'demo-job-1',
            title: 'Real Estate Consultant',
            name: 'Real Estate Consultant',
            company_name: 'Sterling Keys Real Estate',
            salary: 'Negotiable salary + Commission',
            employment_type: 'Full Time',
            experience: '1-2 Years',
            education_level: 'Bachelors Degree',
            location: 'Business Bay, Dubai',
            created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            is_feature: true,
            verified_user: true,
            company_logo: '/assets/img/user.jpeg',
            description:
                '<p>We are seeking an experienced real estate consultant to join our team. Strong communication skills and UAE market knowledge required.</p>',
        },
        {
            id: 2,
            slug: 'demo-job-2',
            title: 'Supermarket Staffs',
            name: 'Supermarket Staffs',
            company_name: 'Confidential',
            salary: 'AED 2,000 - 3,999 per month + Commission',
            employment_type: 'Full Time',
            experience: '0-1 Years',
            education_level: 'N/A',
            location: 'Deira, Dubai',
            created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            is_feature: true,
            verified_user: false,
            company_logo: '/assets/img/user.jpeg',
            description:
                '<p>Supermarket staff positions available. Previous retail experience preferred. Flexible shifts.</p>',
        },
    ]

    const hitFixed = fixed.find((j) => j.slug === slug || String(j.id) === slug)
    if (hitFixed) return { ...hitFixed }

    const m = slug.match(/^demo-job-(\d+)$/i)
    if (!m) return null
    const n = parseInt(m[1], 10)
    if (Number.isNaN(n) || n < 3 || n > 30) return null

    const i = n - 3
    return {
        id: n,
        slug: `demo-job-${n}`,
        title: i % 2 === 0 ? 'Marketing Specialist' : 'Sales Associate',
        name: i % 2 === 0 ? 'Marketing Specialist' : 'Sales Associate',
        company_name: i % 2 === 0 ? 'Confidential' : 'Ebozor',
        salary: i % 2 === 0 ? 'Negotiable' : 'AED 3,000 - 5,000 per month',
        employment_type: i % 3 === 0 ? 'Full Time' : 'Contract',
        experience: i % 2 === 0 ? '1-2 Years' : '0-1 Years',
        education_level: i % 2 === 0 ? 'High-School / Secondary' : 'N/A',
        location: i % 2 === 0 ? 'Dubai Marina' : 'Al Quoz, Dubai',
        created_at: new Date(Date.now() - (i + 6) * 60 * 60 * 1000).toISOString(),
        is_feature: i % 4 === 0,
        verified_user: i % 5 === 0,
        company_logo: '/assets/img/user.jpeg',
        description: `<p>Demo listing for <strong>demo-job-${n}</strong>. Apply through the employer contact when using live data.</p>`,
    }
}

function getDemoMotorBySlug(rawSlug) {
    const slug = String(rawSlug || '').trim().toLowerCase()
    if (!slug || !slug.startsWith('demo-motor-')) return null
    const n = parseInt(slug.replace(/^demo-motor-/, ''), 10)
    if (Number.isNaN(n) || n < 1) return null
    const idx = ((n - 1) % 6) + 1
    const km = [1200, 19714, 33000, 55000][idx % 4]
    const year = 2020 + (idx % 4)
    return {
        id: n,
        slug: rawSlug.trim(),
        name: `Demo Motorcycle ${n}`,
        title: `Demo Motorcycle ${n}`,
        category: { name: 'Motorcycles', slug: 'motorcycles' },
        km: String(km),
        year: String(year),
        final_drive: 'Chain',
        usage: 'Used very rarely since it was purchased',
        wheels: '2 wheels',
        engine_size: '1,000cc or more',
        seller_type: 'Owner',
        warranty: 'Yes',
        location: 'Emaar Beachfront, Dubai Harbour, Dubai, UAE',
        latitude: '25.0892',
        longitude: '55.1414',
        description: `<p>2022 Ducati Panigale V4 SP2 – The Pinnacle of Italian Superbike Engineering</p><p>This is not your average Panigale V4. The SP2 is the closest thing to a MotoGP machine you can legally ride on the road — produced in limited numbers and built for those who demand the absolute best.</p><p><strong>Why this one stands out:</strong></p><ul><li>Only 1,200 km on the clock — barely run in and meticulously maintained.</li><li>Never tracked or raced; strictly road use in perfect conditions.</li><li>Full Ducati service history with all records available.</li><li>Carbon fibre components and premium Öhlins suspension as standard on the SP2.</li></ul>`,
    }
}

function getDemoClassifiedBySlug(rawSlug, variant = 'classified') {
    const slug = String(rawSlug || '').trim()
    if (!slug) return null
    const baseName = variant === 'mobile' ? 'Demo Mobile Listing' : variant === 'furniture' ? 'Demo Furniture Listing' : 'Demo Classified Listing'
    return {
        id: undefined,
        slug,
        name: baseName,
        title: baseName,
        category_name: variant === 'mobile' ? 'Mobiles & Tablets' : variant === 'furniture' ? 'Furniture & Garden' : 'Classifieds',
        sub_category_name: variant === 'mobile' ? 'Mobile Phones' : variant === 'furniture' ? 'Home Furniture' : 'General',
        price: 2220,
        location: 'Dubai',
        created_at: new Date().toISOString(),
        images:
            variant === 'mobile'
                ? ['/assets/img/mobile/1.png', '/assets/img/mobile/2.png']
                : variant === 'furniture'
                    ? ['/assets/img/furniture/1.png', '/assets/img/furniture/2.png']
                    : ['/assets/img/classified/1.png', '/assets/img/classified/2.png'],
        custom_fields:
            variant === 'mobile'
                ? [
                    { name: 'Age', value: '2-5 years' },
                    { name: 'Condition', value: 'Excellent' },
                    { name: 'Usage', value: 'Normal Usage' },
                    { name: 'Warranty', value: 'Yes' },
                ]
                : variant === 'furniture'
                    ? [
                        { name: 'Age', value: '2-5 years' },
                        { name: 'Condition', value: 'Excellent' },
                        { name: 'Color', value: 'Black' },
                        { name: 'Number of Doors', value: '2' },
                    ]
                    : [
                        { name: 'Age', value: '2-5 years' },
                        { name: 'Condition', value: 'Excellent' },
                        { name: 'Usage', value: 'Normal Usage' },
                        { name: 'Warranty', value: 'Yes' },
                    ],
    }
}

function inferClassifiedDetailMode(mode, row, variantParam = '') {
    const m = String(mode || '').trim().toLowerCase()
    if (m === 'mobile' || m === 'furniture') return m
    const v = String(variantParam || '').trim().toLowerCase()
    if (v === 'mobile' || v === 'furniture') return v

    const tokens = [
        row?.category_name,
        row?.sub_category_name,
        row?.subcategory_name,
        row?.category?.name,
        row?.category?.translated_name,
        row?.category?.slug,
        row?.subcategory?.name,
        row?.subcategory?.translated_name,
        row?.subcategory?.slug,
        row?.subCategory?.name,
        row?.subCategory?.translated_name,
        row?.subCategory?.slug,
        row?.category_slug,
    ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
        .join(' ')

    if (tokens.includes('mobile') || tokens.includes('tablet') || tokens.includes('phone')) return 'mobile'
    if (tokens.includes('furniture') || tokens.includes('garden') || tokens.includes('home')) return 'furniture'
    return 'classified'
}

/**
 * `/productdetail?slug=your-listing-slug` loads the listing and renders the job-style layout in {@link JobDetail}.
 */
export default function ProductDetail() {
    const userData = useSelector(userSignUpData)
    const router = useRouter()
    const searchParams = useSearchParams()
    const slug = (searchParams?.get('slug') || '').trim()
    const mode = (searchParams?.get('mode') || '').trim().toLowerCase()
    const variantParam = (searchParams?.get('variant') || '').trim().toLowerCase()
    const motorsListingItem = useMemo(
        () =>
            resolveMotorsListingItemLabel({
                categorySlug: searchParams?.get('category_slug') || searchParams?.get('slug') || '',
                itemParam: searchParams?.get('item') || '',
            }),
        [searchParams]
    )
    const motorsCarOfWeekFromQuery = ['1', 'true', 'yes'].includes(
        String(searchParams?.get('carOfWeek') || '').trim().toLowerCase()
    )

    const [productData, setProductData] = useState(null)
    const [isLoading, setIsLoading] = useState(!!slug)
    const [loadError, setLoadError] = useState(false)
    const [isDeactivating, setIsDeactivating] = useState(false)
    const [isDeactivateConfirmOpen, setIsDeactivateConfirmOpen] = useState(false)

    useEffect(() => {
        if (!slug) {
            setIsLoading(false)
            setProductData(null)
            setLoadError(false)
            return
        }

        let cancelled = false
        setIsLoading(true)
        setLoadError(false)

        const run = async () => {
            try {
                const response = await allItemApi.getItems({ slug })
                let row = parseItemFromGetItemsResponse(response)

                if (!row && /^\d+$/.test(slug)) {
                    const byId = await allItemApi.getItems({ id: slug })
                    row = parseItemFromGetItemsResponse(byId)
                }

                if (!row) {
                    row = await fetchMyItemBySlug(slug)
                }

                if (!row) {
                    if (mode === 'new-project' || mode === 'newproject') {
                        row = getNewProjectDemoBySlug(slug)
                    }
                }
                if (!row && (mode === 'motors' || mode === 'motor')) {
                    row = getDemoMotorBySlug(slug)
                }
                if (!row && mode === 'classified' && (variantParam === 'mobile' || variantParam === 'furniture')) {
                    row = getDemoClassifiedBySlug(slug, variantParam)
                }
                if (!row) {
                    row = getDemoJobBySlug(slug)
                }

                if (!cancelled) {
                    setProductData(row || null)
                    setLoadError(!row)
                }
            } catch {
                let fallback = null
                if (mode === 'new-project' || mode === 'newproject') {
                    fallback = getNewProjectDemoBySlug(slug)
                }
                if (!fallback && (mode === 'motors' || mode === 'motor')) {
                    fallback = getDemoMotorBySlug(slug)
                }
                if (!fallback && mode === 'classified' && (variantParam === 'mobile' || variantParam === 'furniture')) {
                    fallback = getDemoClassifiedBySlug(slug, variantParam)
                }
                if (!fallback) fallback = getDemoJobBySlug(slug)
                if (!cancelled) {
                    setProductData(fallback || null)
                    setLoadError(!fallback)
                }
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }

        run()
        return () => {
            cancelled = true
        }
    }, [slug, mode])

    const effectiveMode = useMemo(() => {
        if (mode) return mode
        if (!productData) return ''
        return inferModeFromListing(
            productData?.property_type,
            productData?.category?.slug || productData?.category_slug || '',
            productData?.item_category ||
                productData?.category?.translated_name ||
                productData?.category?.name ||
                '',
        )
    }, [mode, productData])

    if (!slug) {
        return (
            <div className="max-w-[1170px] mx-auto px-[15px] py-[28px]">
                <p className="text-[14px] font-[Inter-Regular] text-[#666666]">
                    Open a job listing by adding a slug to the URL, for example:{' '}
                    <code className="rounded bg-[#F5F5F5] px-[6px] py-[2px] text-[13px] text-[#1a1a1a]">
                        /productdetail?slug=your-job-slug
                    </code>
                </p>
            </div>
        )
    }

    if (isLoading) {
        return <Loader />
    }

    const fallbackDetailData = {
        id: /^\d+$/.test(slug) ? Number(slug) : undefined,
        slug,
        title: 'Listing',
        name: 'Listing',
    }
    const resolvedProductData = productData || fallbackDetailData
    const currentUserId = userData?.id ?? userData?.data?.id ?? userData?.user?.id ?? null
    const ownerUserId =
        resolvedProductData?.user_id ??
        resolvedProductData?.user?.id ??
        resolvedProductData?.owner_id ??
        resolvedProductData?.seller_id ??
        null
    const shouldShowOwnerFooter =
        currentUserId != null &&
        ownerUserId != null &&
        String(currentUserId) === String(ownerUserId)
    const handleEditItem = () => {
        const itemId = resolvedProductData?.id
        if (!itemId) {
            toast.error('Item id is missing.')
            return
        }
        const next = new URLSearchParams()
        next.set('editItemId', String(itemId))
        if (effectiveMode) next.set('mode', effectiveMode)
        if (variantParam) next.set('variant', variantParam)
        if (motorsListingItem) next.set('item', motorsListingItem)
        router.push(`/placeyourad?${next.toString()}`)
    }
    const handleUpgradeItem = () => {
        const itemId = resolvedProductData?.id
        if (!itemId) {
            toast.error('Item id is missing.')
            return
        }
        router.push(`/placeyourad?paymentItemId=${encodeURIComponent(String(itemId))}`)
    }
    const handleDeactivateItem = async () => {
        const itemId = resolvedProductData?.id
        if (!itemId) {
            toast.error('Item id is missing.')
            return
        }

        try {
            setIsDeactivating(true)
            const response = await chanegItemStatusApi.changeItemStatus({
                item_id: itemId,
                status: 'inactive',
            })
            if (response?.data?.error === false) {
                toast.success(response?.data?.message || 'Item deactivated successfully.')
                setIsDeactivateConfirmOpen(false)
                setProductData((prev) => (prev ? { ...prev, status: 'inactive' } : prev))
                router.push('/myads')
                return
            }
            toast.error(response?.data?.message || 'Could not deactivate item.')
        } catch (error) {
            console.error(error)
            toast.error('Could not deactivate item.')
        } finally {
            setIsDeactivating(false)
        }
    }
    const isNewProjectMode = effectiveMode === 'new-project' || effectiveMode === 'newproject'
    const isPropertyMode = effectiveMode === 'property'
    const isMotorsMode = effectiveMode === 'motors' || effectiveMode === 'motor'
    const isClassifiedMode =
        effectiveMode === 'classified' || effectiveMode === 'furniture' || effectiveMode === 'mobile'
    const classifiedDetailMode = inferClassifiedDetailMode(effectiveMode, resolvedProductData, variantParam)
    const breadcrumbMode = isPropertyMode
        ? 'property'
        : isClassifiedMode
            ? effectiveMode || 'classified'
            : isNewProjectMode
                ? 'new-project'
                : isMotorsMode
                    ? 'motors'
                    : 'jobs'
    const newProjectsListingHref =
        '/products?mode=property&segment=new_projects&item=All%20New%20Projects&slug=all-new-projects&purpose=sale'

    return (
        <>
        <div className="w-full mx-auto">
            {isNewProjectMode ? (
                <>
                    <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
                        <div className="min-w-0">
                            <ProductDetailBreadcrumb
                                productData={resolvedProductData}
                                backHref={newProjectsListingHref}
                                mode={breadcrumbMode}
                            />
                        </div>
                    </div>
                    <NewProjectDetail productData={resolvedProductData} />
                </>
            ) : (
                <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
                    <div className="min-w-0">
                        <ProductDetailBreadcrumb
                            productData={resolvedProductData}
                            backHref={`/products?mode=${breadcrumbMode}`}
                            mode={breadcrumbMode}
                        />
                        {isPropertyMode ? (
                            <PropertyDetail productData={resolvedProductData} slug={slug} />
                        ) : isClassifiedMode ? (
                            <ClassifiedDetail productData={resolvedProductData} slug={slug} mode={classifiedDetailMode} />
                        ) : isMotorsMode ? (
                            <MotorDetail
                                productData={resolvedProductData}
                                listingItem={motorsListingItem}
                                mode={effectiveMode}
                                slug={slug}
                                carOfWeekFromQuery={motorsCarOfWeekFromQuery}
                            />
                        ) : (
                            <JobDetail productData={resolvedProductData} slug={slug} />
                        )}
                    </div>
                </div>
            )}
        </div>
        {shouldShowOwnerFooter ? (
            <DetailActionFooter
                onEdit={handleEditItem}
                onDeactivate={isDeactivating ? undefined : () => setIsDeactivateConfirmOpen(true)}
                onUpgrade={handleUpgradeItem}
            />
        ) : null}
        <DeactivateConfirmModal
            open={isDeactivateConfirmOpen}
            loading={isDeactivating}
            onClose={() => setIsDeactivateConfirmOpen(false)}
            onConfirm={handleDeactivateItem}
        />
        </>
    )
}
