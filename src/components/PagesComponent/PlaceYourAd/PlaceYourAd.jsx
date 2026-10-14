'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { allItemApi, categoryApi, getParentCategoriesApi } from '@/utils/api'
import AdsHeader from './components/AdsHeader'
import PlaceAdUniversalListingForm from './PlaceAdUniversalListingForm'
import PlaceAdJobsListingForm from './PlaceAdJobsListingForm'
import PlaceAdNewProjectsListingForm from './PlaceAdNewProjectsListingForm'
import SelectPackageOrder from './Payment/SelectPackageOrder'
import PostAdPaymentSuccessPage from './Payment/PostAdPaymentSuccessPage'
import CategorySearch from './components/CategorySearch'
import CategorySearchPage from './components/CategorySearchPage'
import PlaceAdMotorsCarForm from './MotorsForm/PlaceAdMotorsCarForm'
import PlaceAdMotorForm from './MotorsForm/PlaceAdMotorForm'
import { shouldShowPlanPaymentAfterEdit } from '@/utils/productPromotionBadge'

function parseItemFromGetItemResponse(response) {
    const payload = response?.data
    if (!payload || payload?.error === true) return null
    const data = payload?.data
    if (Array.isArray(data)) return data[0] || null
    if (data && typeof data === 'object') {
        if (Array.isArray(data?.data)) return data.data[0] || null
        if (data?.id != null || data?.slug != null) return data
    }
    return null
}

function normalizeCategoryNode(node) {
    if (!node || typeof node !== 'object') return null
    const categoryId = node.category_id ?? node.id
    return {
        ...node,
        id: node.id ?? categoryId,
        category_id: categoryId,
        name: node.name || node.translated_name || node.category_name || 'Category',
        slug: node.slug || '',
    }
}

function parseCategoryPathFromResponse(response) {
    const data = response?.data?.data
    const rawPath = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
    return rawPath.map(normalizeCategoryNode).filter(Boolean)
}

function buildFallbackEditPath(item) {
    const leaf = normalizeCategoryNode({
        category_id: item?.category_id,
        name: item?.category?.name || item?.category_name || 'Category',
        slug: item?.category?.slug || '',
    })
    return leaf ? [leaf] : []
}

const PlaceYourAd = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [rootCategories, setRootCategories] = useState([])
    const [rootsLoading, setRootsLoading] = useState(true)
    const [rootsError, setRootsError] = useState(null)

    /** Selected top-level category from API: { category_id, name, image, slug } */
    const [selectedMain, setSelectedMain] = useState(null)
    const [categorySearchTitle, setCategorySearchTitle] = useState('')
    const [titleStep, setTitleStep] = useState(false)
    const [categoryPickStep, setCategoryPickStep] = useState(false)

    /** After leaf pick: universal listing form */
    const [listingDraft, setListingDraft] = useState(null)
    /** { leaf, pathNames, rootCategory } */
    const [paymentStep, setPaymentStep] = useState(false)
    const [paymentSuccessStep, setPaymentSuccessStep] = useState(false)
    const [paymentItemId, setPaymentItemId] = useState(null)
    const [motorsDraft, setMotorsDraft] = useState(null)
    const [editItemId, setEditItemId] = useState('')
    const [editItemData, setEditItemData] = useState(null)
    const [editCategoryPath, setEditCategoryPath] = useState([])
    const [editLoading, setEditLoading] = useState(false)
    /** Jobs root card: first click expands to "I'm hiring" / "I want a job" */
    const [expandedJobsCategoryId, setExpandedJobsCategoryId] = useState(null)

    useEffect(() => {
        let cancelled = false
        setRootsLoading(true)
        setRootsError(null)
        categoryApi
            .getCategoryChildrenByParent({})
            .then((res) => {
                const data = res?.data?.data ?? []
                if (!cancelled) setRootCategories(Array.isArray(data) ? data : [])
            })
            .catch((err) => {
                if (!cancelled) setRootsError(err)
            })
            .finally(() => {
                if (!cancelled) setRootsLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [])

    // Resume checkout flow (e.g. from My Ads → "Complete Payment")
    useEffect(() => {
        const raw =
            searchParams?.get?.('paymentItemId') ||
            searchParams?.get?.('itemId') ||
            searchParams?.get?.('item_id') ||
            ''
        const itemId = String(raw || '').trim()
        if (!itemId) return

        // Jump straight to package checkout for an existing item.
        setSelectedMain(null)
        setTitleStep(false)
        setCategoryPickStep(false)
        setCategorySearchTitle('')
        setListingDraft(null)
        setMotorsDraft(null)
        setPaymentSuccessStep(false)
        setPaymentItemId(itemId)
        setPaymentStep(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams?.toString?.()])

    // Edit listing flow: load existing item by id and open form prefilled.
    useEffect(() => {
        const rawEditId = searchParams?.get?.('editItemId') || ''
        const eid = String(rawEditId || '').trim()
        if (!eid) {
            setEditItemId('')
            setEditItemData(null)
            setEditCategoryPath([])
            setEditLoading(false)
            return
        }
        let cancelled = false
        setEditItemId(eid)
        setEditLoading(true)
        setEditItemData(null)
        setEditCategoryPath([])
        ;(async () => {
            try {
                const response = await allItemApi.getItems({ id: eid })
                const row = parseItemFromGetItemResponse(response)
                let categoryPath = []
                if (row?.category_id) {
                    try {
                        const pathResponse = await getParentCategoriesApi.getPaymentCategories({
                            child_category_id: row.category_id,
                        })
                        categoryPath = parseCategoryPathFromResponse(pathResponse)
                    } catch {
                        categoryPath = []
                    }
                }
                if (cancelled) return
                setEditItemData(row || null)
                setEditCategoryPath(categoryPath.length > 0 ? categoryPath : buildFallbackEditPath(row))
                setSelectedMain(null)
                setTitleStep(false)
                setCategoryPickStep(false)
                setCategorySearchTitle('')
                setListingDraft(null)
                setMotorsDraft(null)
                setPaymentStep(false)
                setPaymentSuccessStep(false)
            } catch {
                if (!cancelled) setEditItemData(null)
            } finally {
                if (!cancelled) setEditLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [searchParams?.toString?.()])

    const resetListingFlow = () => {
        setListingDraft(null)
        setPaymentStep(false)
        setPaymentSuccessStep(false)
        setPaymentItemId(null)
        setMotorsDraft(null)
    }

    const resetEditFlow = () => {
        setEditItemId('')
        setEditItemData(null)
        setEditCategoryPath([])
        router.replace('/placeyourad', { scroll: false })
    }

    /** After successful add/edit: create always goes to plans; edit only if featured/premium expired (or unpaid). */
    const handleListingAddItemSuccess = useCallback(
        (payload = {}) => {
            const itemId = payload?.itemId ?? null
            const isEditFlow = Boolean(editItemId || editItemData)

            if (isEditFlow && !shouldShowPlanPaymentAfterEdit(editItemData)) {
                setListingDraft(null)
                setPaymentStep(false)
                setPaymentSuccessStep(false)
                setPaymentItemId(null)
                router.push('/myads')
                return
            }

            setListingDraft(null)
            setPaymentItemId(itemId)
            setPaymentStep(true)
        },
        [editItemId, editItemData, router]
    )

    const isJobsRootCategory = (item) => {
        const slug = String(item?.slug || '').toLowerCase()
        const name = String(item?.name || '').toLowerCase().trim()
        return slug === 'jobs' || name === 'jobs' || slug === 'job'
    }

    const isJobsCategory = (item) => {
        const slug = String(item?.slug || '').toLowerCase()
        const name = String(item?.name || '').toLowerCase().trim()
        return slug === 'jobs' || name === 'jobs' || slug.startsWith('jobs-')
    }

    const PLACEHOLDER_TITLE_STEP_DEFAULT = 'e.g. 1 Bedroom available in Al-Barsha'

    const titleStepPlaceholderForRoot = (rootCategory) => {
        if (!rootCategory) return PLACEHOLDER_TITLE_STEP_DEFAULT
        if (isJobsCategory(rootCategory)) return 'e.g. Sales Executive'
        const slug = String(rootCategory.slug || '').toLowerCase()
        const name = String(rootCategory.name || '').toLowerCase()
        const blob = `${slug} ${name}`
        if (slug === 'property-for-rent' || slug.includes('property-for-rent')) {
            return 'e.g. Studio apt. available for monthly rental in Gardens'
        }
        const hasProperty = blob.includes('property') || blob.includes('properties')
        const hasRent = /\brent\b/.test(blob) || blob.includes('for rent') || blob.includes('rental')
        if (hasProperty && hasRent) return 'e.g. Studio apt. available for monthly rental in Gardens'
        if (blob.includes('classified')) return 'e.g. MacBook Pro for sale'
        return PLACEHOLDER_TITLE_STEP_DEFAULT
    }

    /**
     * @param {object} item - root category
     * @param {{ jobsSkipTitleForSeeker?: boolean }} [options] - "I want a job" → go straight to PlaceAdSubcategoryStep (skip title search)
     */
    const handleMainCategoryPick = (item, options = {}) => {
        const { jobsSkipTitleForSeeker = false } = options
        setExpandedJobsCategoryId(null)
        setSelectedMain(item)
        const isMotors = String(item?.slug || '').toLowerCase() === 'motors'

        if (jobsSkipTitleForSeeker && isJobsCategory(item)) {
            setTitleStep(false)
            setCategoryPickStep(true)
            setCategorySearchTitle('')
            resetListingFlow()
            return
        }

        setTitleStep(!isMotors)
        setCategoryPickStep(isMotors)
        setCategorySearchTitle('')
        resetListingFlow()
    }

    const handleRootCategoryCardClick = (item) => {
        if (isJobsRootCategory(item)) {
            setExpandedJobsCategoryId(item.category_id)
            return
        }
        handleMainCategoryPick(item)
    }

    const exitTitleAndPickFlow = () => {
        setExpandedJobsCategoryId(null)
        setTitleStep(false)
        setCategoryPickStep(false)
        setCategorySearchTitle('')
        setSelectedMain(null)
    }

    const handleLeafSelect = ({ leaf, pathNames, pathNodes, rootCategory }) => {
        const initialTitle = String(categorySearchTitle || '').trim()
        setCategoryPickStep(false)
        setTitleStep(false)
        setCategorySearchTitle('')
        setSelectedMain(null)
        if (String(rootCategory?.slug || '').toLowerCase() === 'motors') {
            setListingDraft(null)
            setMotorsDraft({ leaf, pathNames, pathNodes, rootCategory, initialTitle })
            return
        }
        setListingDraft({ leaf, pathNames, pathNodes, rootCategory, initialTitle })
    }

    const isCarsCategory = (leaf) => {
        const slug = String(leaf?.slug || '')
            .toLowerCase()
            .replace(/[-_]+/g, ' ')
            .trim()
        const name = String(leaf?.name || '')
            .toLowerCase()
            .replace(/[-_]+/g, ' ')
            .trim()
        return /\bcars?\b/.test(slug) || /\bcars?\b/.test(name)
    }

    const hasCarsCategoryInPath = (nodes = []) => {
        return (Array.isArray(nodes) ? nodes : []).some((node) => isCarsCategory(node))
    }

    /** Jobs “I’m hiring” / “I want a job” branches use a dedicated listing form. */
    const isJobsRecruitersOrSeekersBranch = (draft) => {
        if (!draft) return false
        const nodes = [draft.rootCategory, ...(Array.isArray(draft.pathNodes) ? draft.pathNodes : [])].filter(Boolean)
        return nodes.some((n) => {
            const s = String(n?.slug || '').toLowerCase()
            return s === 'jobs-jobs-seekers' || s === 'jobs-recruiters'
        })
    }

    /**
     * Property for Sale -> New Projects -> <child category>.
     * New Projects path can arrive as slug/name variants from API nodes.
     */
    const isNewProjectsSaleBranch = (draft) => {
        if (!draft) return false
        const nodes = [draft.rootCategory, ...(Array.isArray(draft.pathNodes) ? draft.pathNodes : [])].filter(Boolean)
        const hasPropertyForSale = nodes.some((n) => {
            const slug = String(n?.slug || '').toLowerCase()
            return slug === 'property-for-sale'
        })
        if (!hasPropertyForSale) return false
        return nodes.some((n) => {
            const slug = String(n?.slug || '').toLowerCase().replace(/_/g, '-')
            const name = String(n?.name || '').toLowerCase().replace(/_/g, '-')
            return slug.includes('new-project') || name.includes('new project')
        })
    }

    const renderEditForm = () => {
        if (!editItemData) {
            return (
                <p className="py-[40px] text-center text-[14px] font-[Inter-Regular] text-[#DC0000]">Could not load listing for edit.</p>
            )
        }

        const fallbackPath = buildFallbackEditPath(editItemData)
        const pathNodes = editCategoryPath.length > 0 ? editCategoryPath : fallbackPath
        const leaf = pathNodes[pathNodes.length - 1] || fallbackPath[0]
        const rootCategory = pathNodes[0] || leaf
        const pathNames = pathNodes.map((node) => node?.name).filter(Boolean)
        const commonProps = {
            leafCategory: leaf,
            pathNames,
            pathNodes,
            rootCategory,
            initialTitle: String(editItemData?.name || editItemData?.title || '').trim(),
            editingItemId: editItemId,
            editItemData,
            onBack: resetEditFlow,
            onComplete: handleListingAddItemSuccess,
        }

        const editDraft = { leaf, pathNames, pathNodes, rootCategory }
        const rootSlug = String(rootCategory?.slug || '').toLowerCase()

        if (rootSlug === 'motors') {
            if (isCarsCategory(leaf) || hasCarsCategoryInPath(pathNodes)) {
                return (
                    <PlaceAdMotorsCarForm
                        leafCategory={leaf}
                        editingItemId={editItemId}
                        editItemData={editItemData}
                        onBackToSubcategories={resetEditFlow}
                    />
                )
            }
            return (
                <PlaceAdMotorForm
                    parentLabel={pathNames[0] || rootCategory?.name || 'Motors'}
                    subtypeLabel={leaf?.name || 'Motorcycle'}
                    leafCategory={leaf}
                    pathNodes={pathNodes}
                    editingItemId={editItemId}
                    editItemData={editItemData}
                    onBack={resetEditFlow}
                />
            )
        }

        if (isJobsCategory(rootCategory) || isJobsRecruitersOrSeekersBranch(editDraft)) {
            return <PlaceAdJobsListingForm {...commonProps} />
        }

        if (isNewProjectsSaleBranch(editDraft)) {
            return <PlaceAdNewProjectsListingForm {...commonProps} />
        }

        return (
            <PlaceAdUniversalListingForm
                {...commonProps}
                onNavigateToCategory={undefined}
            />
        )
    }

    return (
        <div>
            <AdsHeader />
            <div className="mx-auto w-full">
                {paymentStep ? (
                    <SelectPackageOrder
                        itemId={paymentItemId}
                        onConfirm={() => {
                            setPaymentStep(false)
                            setPaymentSuccessStep(true)
                        }}
                    />
                ) : paymentSuccessStep ? (
                    <PostAdPaymentSuccessPage isCarsCategory={false} />
                ) : editItemId ? (
                    editLoading ? (
                        <p className="py-[40px] text-center text-[14px] font-[Inter-Regular] text-[#666]">Loading listing details…</p>
                    ) : (
                        renderEditForm()
                    )
                ) : motorsDraft ? (
                    isCarsCategory(motorsDraft?.leaf) ? (
                        <PlaceAdMotorsCarForm
                            leafCategory={motorsDraft.leaf}
                            onBackToSubcategories={() => {
                                setMotorsDraft(null)
                                setSelectedMain(motorsDraft.rootCategory)
                                setCategorySearchTitle('')
                                setTitleStep(false)
                                setCategoryPickStep(true)
                            }}
                        />
                    ) : (
                        <PlaceAdMotorForm
                            parentLabel={motorsDraft.pathNames?.[0] || motorsDraft.rootCategory?.name || 'Motors'}
                            subtypeLabel={motorsDraft.leaf?.name || 'Motorcycle'}
                            leafCategory={motorsDraft.leaf}
                            pathNodes={motorsDraft.pathNodes}
                            onBack={() => {
                                setMotorsDraft(null)
                                setSelectedMain(motorsDraft.rootCategory)
                                setCategorySearchTitle('')
                                setTitleStep(false)
                                setCategoryPickStep(true)
                            }}
                        />
                    )
                ) : listingDraft ? (
                    isJobsRecruitersOrSeekersBranch(listingDraft) ? (
                        <PlaceAdJobsListingForm
                            leafCategory={listingDraft.leaf}
                            pathNames={listingDraft.pathNames}
                            pathNodes={listingDraft.pathNodes}
                            rootCategory={listingDraft.rootCategory}
                            initialTitle={listingDraft.initialTitle}
                            onNavigateToCategory={(node) => {
                                setListingDraft(null)
                                setSelectedMain(node)
                                setCategorySearchTitle('')
                                setTitleStep(false)
                                setCategoryPickStep(true)
                            }}
                            onBack={resetListingFlow}
                            onComplete={handleListingAddItemSuccess}
                        />
                    ) : isNewProjectsSaleBranch(listingDraft) ? (
                        <PlaceAdNewProjectsListingForm
                            leafCategory={listingDraft.leaf}
                            pathNames={listingDraft.pathNames}
                            pathNodes={listingDraft.pathNodes}
                            rootCategory={listingDraft.rootCategory}
                            initialTitle={listingDraft.initialTitle}
                            onNavigateToCategory={(node) => {
                                setListingDraft(null)
                                setSelectedMain(node)
                                setCategorySearchTitle('')
                                setTitleStep(false)
                                setCategoryPickStep(true)
                            }}
                            onBack={resetListingFlow}
                            onComplete={handleListingAddItemSuccess}
                        />
                    ) : (
                        <PlaceAdUniversalListingForm
                            leafCategory={listingDraft.leaf}
                            pathNames={listingDraft.pathNames}
                            pathNodes={listingDraft.pathNodes}
                            rootCategory={listingDraft.rootCategory}
                            initialTitle={listingDraft.initialTitle}
                            onNavigateToCategory={(node) => {
                                setListingDraft(null)
                                setSelectedMain(node)
                                setCategorySearchTitle('')
                                setTitleStep(false)
                                setCategoryPickStep(true)
                            }}
                            onBack={resetListingFlow}
                            onComplete={handleListingAddItemSuccess}
                        />
                    )
                ) : categoryPickStep && selectedMain ? (
                    <CategorySearchPage
                        rootParentCategory={selectedMain}
                        titleText={categorySearchTitle}
                        onChooseElse={exitTitleAndPickFlow}
                        onLeafSelect={handleLeafSelect}
                    />
                ) : titleStep && selectedMain ? (
                    <CategorySearch
                        value={categorySearchTitle}
                        onChange={setCategorySearchTitle}
                        placeholder={titleStepPlaceholderForRoot(selectedMain)}
                        onSubmit={() => {
                            if (!String(categorySearchTitle).trim()) return
                            setTitleStep(false)
                            setCategoryPickStep(true)
                        }}
                    />
                ) : (
                    <div className="mx-auto w-[480px] max-sm:w-full py-[36px] max-sm:p-[20px_15px]">
                        <div className="mb-[32px] text-center">
                            <h4 className="mb-[8px] text-[22px] font-[Inter-Bold] text-[#23262A]">
                                Hello, what are you listing today?
                            </h4>
                            <p className="text-[14px] font-[Inter-Regular] text-[#000]">
                                Select the area that best suits your ad
                            </p>
                        </div>

                        {rootsLoading && (
                            <p className="py-[40px] text-center text-[14px] font-[Inter-Regular] text-[#666]">
                                Loading categories…
                            </p>
                        )}

                        {!rootsLoading && rootsError && (
                            <p className="py-[40px] text-center text-[14px] font-[Inter-Regular] text-[#DC0000]">
                                Could not load categories. Please refresh the page.
                            </p>
                        )}

                        {!rootsLoading && !rootsError && rootCategories.length === 0 && (
                            <p className="py-[40px] text-center text-[14px] font-[Inter-Regular] text-[#666]">
                                No categories available.
                            </p>
                        )}

                        {!rootsLoading && !rootsError && rootCategories.length > 0 && (
                            <div className="mb-[32px] grid grid-cols-1 gap-[16px] sm:grid-cols-3">
                                {rootCategories.map((item) =>
                                    isJobsRootCategory(item) && expandedJobsCategoryId === item.category_id ? (
                                        <div
                                            key={item.category_id}
                                            className="flex min-h-[140px] flex-col overflow-hidden rounded-[12px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)]"                                        >
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const seekers =
                                                        item?.children?.find?.(
                                                            (c) =>
                                                                String(c?.slug || '').toLowerCase().includes('jobs-seekers') ||
                                                                String(c?.name || '').toLowerCase().includes('seek')
                                                        ) || null
                                                    handleMainCategoryPick(seekers || item)
                                                }}
                                                className="flex flex-1 cursor-pointer items-center justify-center px-[16px] py-[20px] text-center text-[14px] font-[Inter-Bold] text-[#23262A] transition-colors duration-300 hover:bg-[#f7f7f7]"
                                            >
                                                I&apos;m hiring
                                            </button>
                                            <div className="h-px shrink-0 bg-[rgba(143,143,143,0.25)]" aria-hidden />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const recruiters =
                                                        item?.children?.find?.(
                                                            (c) =>
                                                                String(c?.slug || '').toLowerCase().includes('jobs-recruiters') ||
                                                                String(c?.name || '').toLowerCase().includes('recruit')
                                                        ) || null
                                                    handleMainCategoryPick(recruiters || item, { jobsSkipTitleForSeeker: true })
                                                }}
                                                className="flex flex-1 cursor-pointer items-center justify-center px-[16px] py-[20px] text-center text-[14px] font-[Inter-Bold] text-[#23262A] transition-colors duration-300 hover:bg-[#f7f7f7]"
                                            >
                                                I want a job
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            key={item.category_id}
                                            type="button"
                                            onClick={() => handleRootCategoryCardClick(item)}
                                            className="cursor-pointer flex flex-col items-center justify-center rounded-[12px] bg-white p-[40px_20px_20px] shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all duration-300 hover:bg-[#f7f7f7]"
                                        >
                                            <div className="mb-[16px] flex h-[48px] w-[48px] items-center justify-center">
                                                {item.image ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={item.image}
                                                        alt=""
                                                        className="h-[48px] w-[48px] object-contain"
                                                    />
                                                ) : (
                                                    <span className="flex h-[48px] w-[48px] items-center justify-center rounded-[8px] bg-[#f0f0f0] text-[20px] font-[Inter-Bold] text-[#999]">
                                                        {String(item.name || '?').charAt(0)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-center text-[14px] font-[Inter-Bold] text-[#23262A]">
                                                {item.name}
                                            </p>
                                        </button>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default PlaceYourAd
