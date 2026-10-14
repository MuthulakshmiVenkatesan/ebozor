'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { categoryApi } from '@/utils/api'
import PlaceAdSubcategoryStep from './PlaceAdSubcategoryStep'
import PlaceAdAnotherSubcategory from './PlaceAdAnotherSubcategory'

/**
 * After title search: lists categories from get-category-children-by-parent.
 * First request uses parent_category_id (root) + title; drill-down uses parent_category_id only.
 */
export default function CategorySearchPage({
    rootParentCategory,
    titleText,
    onChooseElse,
    onLeafSelect,
}) {
    const [listItems, setListItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(null)
    const [navStack, setNavStack] = useState([])
    const [pathNames, setPathNames] = useState([])
    const [pathNodes, setPathNodes] = useState([])
    const [useTitleFilter, setUseTitleFilter] = useState(false)

    const rootId = rootParentCategory?.category_id

    const loadInitial = useCallback(() => {
        if (rootId == null) return
        setLoading(true)
        setLoadError(null)
        categoryApi
            .getCategoryChildrenByParent({
                parent_category_id: rootId,
                title: useTitleFilter ? String(titleText || '').trim() || undefined : undefined,
            })
            .then((res) => {
                setListItems(res?.data?.data ?? [])
            })
            .catch((err) => {
                setLoadError(err)
                setListItems([])
            })
            .finally(() => setLoading(false))
    }, [rootId, titleText, useTitleFilter])

    useEffect(() => {
        setUseTitleFilter(Boolean(String(titleText || '').trim()))
        setNavStack([])
        setPathNames([])
        setPathNodes([])
    }, [titleText, rootId])

    useEffect(() => {
        loadInitial()
    }, [loadInitial])

    const goBackLevel = () => {
        if (navStack.length === 0) return
        const prev = navStack[navStack.length - 1]
        setNavStack((s) => s.slice(0, -1))
        setPathNames((p) => p.slice(0, -1))
        setPathNodes((p) => p.slice(0, -1))
        setListItems(prev.items)
    }

    const handleItemClick = async (item) => {
        setLoading(true)
        setLoadError(null)
        try {
            const res = await categoryApi.getCategoryChildrenByParent({
                parent_category_id: item.category_id,
            })
            const children = res?.data?.data ?? []
            if (!children.length) {
                onLeafSelect?.({
                    leaf: item,
                    pathNames: [rootParentCategory?.name, ...pathNames, item.name].filter(Boolean),
                    pathNodes: [rootParentCategory, ...pathNodes, item].filter(Boolean),
                    rootCategory: rootParentCategory,
                })
                return
            }
            setNavStack((s) => [...s, { items: listItems }])
            setPathNames((p) => [...p, item.name])
            setPathNodes((p) => [...p, item])
            setListItems(children)
        } catch (err) {
            setLoadError(err)
        } finally {
            setLoading(false)
        }
    }

    const showBack = navStack.length > 0
    const showChooseElse = useTitleFilter && navStack.length === 0
    const uiRows = (listItems || []).map((item) => ({
        key: String(item.category_id),
        label: item.name,
        raw: item,
    }))

    const handleChooseElse = () => {
        if (showChooseElse) {
            setUseTitleFilter(false)
            setNavStack([])
            setPathNames([])
            setPathNodes([])
            return
        }
        onChooseElse?.()
    }

    const goToSearchRoot = () => {
        if (navStack.length === 0) return
        setNavStack([])
        setPathNames([])
        setPathNodes([])
        loadInitial()
    }

    if (loading) {
        return (
            <div className="mx-auto w-[480px] max-sm:w-full py-[36px] max-sm:p-[20px_15px]">
                <p className="py-[24px] text-center text-[14px] font-[Inter-Regular] text-[#666]">Loading…</p>
            </div>
        )
    }

    if (loadError) {
        return (
            <div className="mx-auto w-[480px] max-sm:w-full py-[36px] max-sm:p-[20px_15px]">
                <p className="py-[24px] text-center text-[14px] font-[Inter-Regular] text-[#DC0000]">
                    Could not load categories. Please try again.
                </p>
            </div>
        )
    }

    if (listItems.length === 0) {
        return (
            <div className="mx-auto w-[480px] max-sm:w-full py-[36px] max-sm:p-[20px_15px]">
                <p className="py-[24px] text-center text-[14px] font-[Inter-Regular] text-[#666]">
                    No categories found. Try a different title or choose something else below.
                </p>
                {showChooseElse ? (
                    <p className="mt-[14px] text-center text-[14px] text-[#23262A]">
                        or{' '}
                        <button
                            type="button"
                            onClick={handleChooseElse}
                            className="cursor-pointer text-[#3a88ef]"
                        >
                            Choose something else
                        </button>
                    </p>
                ) : null}
            </div>
        )
    }

    return (
        <div>
            {useTitleFilter ? (
                <PlaceAdAnotherSubcategory
                    variant="api-search-list"
                    apiRootLabel={rootParentCategory?.name || 'Category'}
                    apiParentLabel={pathNames[pathNames.length - 1] || rootParentCategory?.name || 'Category'}
                    apiCurrentLabel={pathNames[pathNames.length - 1] || ''}
                    apiRows={uiRows}
                    onSelectApiRow={(row) => handleItemClick(row.raw)}
                    onBackToApiRoot={goToSearchRoot}
                    onBackToMain={showBack ? goBackLevel : onChooseElse}
                />
            ) : (
                <PlaceAdSubcategoryStep
                    parentLabel={pathNames[pathNames.length - 1] || rootParentCategory?.name || 'Category'}
                    items={uiRows}
                    onBackToMain={showBack ? goBackLevel : onChooseElse}
                    onSelect={(row) => handleItemClick(row.raw)}
                />
            )}

            {showChooseElse ? (
                <p className="mt-[4px] text-center text-[14px] text-[#23262A]">
                    or{' '}
                    <button
                        type="button"
                        onClick={handleChooseElse}
                        className="cursor-pointer text-[#3a88ef]"
                    >
                        Choose something else
                    </button>
                </p>
            ) : null}
        </div>
    )
}
