/* eslint-disable react/prop-types */
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { RightArrowIcon } from '@/components/CustomFile/icons'
import { getParentCategoriesApi } from '@/utils/api'
import {
    buildTrailItems,
    normalizeCategoryNode,
    parseCategoryPathFromResponse,
    resolveModeKey,
} from '@/utils/productDetailBreadcrumb'

function buildFallbackCategoryPath(productData) {
    const pd = productData || {}
    const leaf = normalizeCategoryNode({
        category_id: pd?.category_id ?? pd?.category?.id,
        name: pd?.category?.translated_name || pd?.category?.name || pd?.category_name,
        slug: pd?.category?.slug,
    })
    return leaf ? [leaf] : []
}

/**
 * Product detail: “Back To Search” and location → category path → listing title.
 * Location click opens /products with the parent category of the leaf + city/country filter.
 */
export default function ProductDetailBreadcrumb({ productData, backHref = '/products?mode=jobs', mode = 'jobs' }) {
    const [categoryPath, setCategoryPath] = useState([])

    const leafCategoryId = productData?.category_id ?? productData?.category?.id

    useEffect(() => {
        if (!leafCategoryId) {
            setCategoryPath(buildFallbackCategoryPath(productData))
            return
        }
        let cancelled = false
        ;(async () => {
            try {
                const response = await getParentCategoriesApi.getPaymentCategories({
                    child_category_id: leafCategoryId,
                })
                const path = parseCategoryPathFromResponse(response)
                if (!cancelled) {
                    setCategoryPath(path.length > 0 ? path : buildFallbackCategoryPath(productData))
                }
            } catch {
                if (!cancelled) setCategoryPath(buildFallbackCategoryPath(productData))
            }
        })()
        return () => {
            cancelled = true
        }
    }, [leafCategoryId, productData])

    const trail = useMemo(() => buildTrailItems(productData, mode, categoryPath), [productData, mode, categoryPath])

    const defaultBackHref = useMemo(() => {
        const modeKey = resolveModeKey(mode)
        if (modeKey === 'new-project') {
            return '/products?mode=property&segment=new_projects&item=All%20New%20Projects&slug=all-new-projects&purpose=sale'
        }
        return `/products?mode=${modeKey}`
    }, [mode])

    const resolvedBackHref = backHref || defaultBackHref

    return (
        <nav className="mb-[18px] flex gap-[20px] flex-wrap" aria-label="Breadcrumb">
            <Link href={resolvedBackHref} className="inline-flex items-center gap-[4px]">
                <RightArrowIcon className="h-[24px] w-[24px] rotate-180 rtl:rotate-0" stroke="#4294ff" />
                <p className="text-[14px] font-[Inter-Medium] text-[#4294ff] hover:bg-[#4294ff] hover:text-white px-[10px] rounded-[20px]">
                    Back To Search
                </p>
            </Link>

            <ol className="flex min-w-0 flex-wrap items-center gap-[6px]">
                {trail.map((item, index) => (
                    <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-[6px]">
                        {index > 0 ? <RightArrowIcon className="h-[16px] w-[16px]" stroke="#000" /> : null}
                        {item.href && index < trail.length - 1 ? (
                            <Link
                                href={item.href}
                                className="truncate text-[14px] font-[Inter-Regular] text-[#23262A] hover:text-[#4294ff]"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <p className="truncate text-[14px] font-[Inter-Regular] text-[#23262A]">{item.label}</p>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    )
}
