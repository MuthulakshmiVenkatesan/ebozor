'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { SearchIcon, TickIcon } from '@/components/CustomFile/icons'
import Api from '@/api/AxiosInterceptors'
import { categoryApi, jobRolesApi } from '@/utils/api'

const EDUCATION_OPTIONS = ['N/A', 'High-School / Secondary', 'Bachelors Degree', 'Masters Degree', 'PhD']
const EMPLOYMENT_TYPES = ['Full Time', 'Part Time', 'Contract', 'Temporary', 'Other']
const REMOTE_JOB = ['Yes', 'No']
const ADS_POSTED = ['Past 24 Hours', 'Past 7 Days', 'Past 30 Days']

const JOB_CATEGORY_SUGGESTIONS = [
    'IT & Software',
    'Sales & Business Development',
    'Marketing',
    'Accounting & Finance',
    'Operations',
    'Customer Service',
    'Human Resources',
    'Driver & Logistics',
]

const JOB_ROLE_SUGGESTIONS = [
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Sales Executive',
    'Accountant',
    'Customer Support',
    'Operations Coordinator',
    'HR Specialist',
    'Driver',
    'Logistics Coordinator',
]

function Chip({ active, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`cursor-pointer rounded-full border px-[14px] py-[8px] text-[14px] leading-[18px] ${
                active
                    ? 'border-[#3A88EF] bg-[rgb(242,247,254)] font-[Inter-SemiBold] text-[#23262A]'
                    : 'border-[rgba(143,143,143,0.45)] bg-white font-[Inter-Regular] text-[#23262A]'
            }`}
        >
            {children}
        </button>
    )
}

function pickApiFilterOptions(def) {
    const vObj = Array.isArray(def?.values_obj) ? def.values_obj : []
    if (vObj.length) return vObj.map((x) => String(x?.option_value || x?.value || x?.name || '')).filter(Boolean)
    const v = Array.isArray(def?.values) ? def.values : []
    return v.map((x) => String(x || '')).filter(Boolean)
}

/** Same shape as Place Your Ad `dropdown_api` + job-roles listing. */
function parseDropdownApiListPayload(res) {
    let payload = res?.data?.data ?? res?.data
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        const inner = payload.roles ?? payload.job_roles ?? payload.items ?? payload.list ?? payload.records
        if (Array.isArray(inner)) payload = inner
    }
    if (!Array.isArray(payload)) return []
    return payload
        .map((row) => {
            if (typeof row === 'string') return String(row).trim()
            const label = row?.name ?? row?.title ?? row?.label ?? row?.role_name ?? row?.job_role
            return String(label ?? '').trim()
        })
        .filter(Boolean)
}

function getDropdownApiEndpointKey(def) {
    const v = Array.isArray(def?.values) ? def.values : []
    const raw = v[0]
    return String(raw ?? '')
        .trim()
        .replace(/^\//, '')
        .split('?')[0]
}

function parseJobsCategoryTreeChildren(res) {
    const body = res?.data
    if (!body) return []
    const d = body.data
    if (Array.isArray(d) && d[0]?.children?.length) return d[0].children
    if (d && typeof d === 'object' && !Array.isArray(d)) {
        const cat = d.categories?.[0]
        if (Array.isArray(cat?.children) && cat.children.length) return cat.children
        if (Array.isArray(d.children) && d.children.length) return d.children
    }
    return []
}

function getTreeNodeChildren(node) {
    if (!node) return []
    if (Array.isArray(node.children) && node.children.length) return node.children
    if (Array.isArray(node.subcategories) && node.subcategories.length) return node.subcategories
    return []
}

function treeNodeLabel(node) {
    return String(node?.translated_name || node?.name || '').trim()
}

function treeNodeSlug(node) {
    return String(node?.slug || '').trim()
}

function normalizeForUrlFilterMatch(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
}

function findSelectedJobsTreePath(nodes, slug) {
    const target = String(slug || '').trim()
    if (!target || !Array.isArray(nodes)) return null
    for (const node of nodes) {
        if (treeNodeSlug(node) === target) {
            return { categoryNode: node, subCategoryNode: null }
        }
        const child = getTreeNodeChildren(node).find((entry) => treeNodeSlug(entry) === target)
        if (child) {
            return { categoryNode: node, subCategoryNode: child }
        }
    }
    return null
}

export default function JobsProductsFiltersPanel({ open, onClose, onApply, apiFilters = [], hideEducation = false }) {
    const searchParams = useSearchParams()
    const [education, setEducation] = useState([])
    const [employmentType, setEmploymentType] = useState([])
    const [remoteJob, setRemoteJob] = useState([])
    const [adsPosted, setAdsPosted] = useState([])
    const [category, setCategory] = useState('')
    const [subCategory, setSubCategory] = useState('')
    const [englishOnly, setEnglishOnly] = useState(false)
    const [verifiedOnly, setVerifiedOnly] = useState(false)
    const [categoryOpen, setCategoryOpen] = useState(false)
    const [subCategoryOpen, setSubCategoryOpen] = useState(false)
    const categoryWrapRef = useRef(null)
    const subCategoryWrapRef = useRef(null)

    const [categoryTree, setCategoryTree] = useState([])
    const [categoryTreeLoading, setCategoryTreeLoading] = useState(false)
    const [selectedCategoryNode, setSelectedCategoryNode] = useState(null)
    /** null = do not change URL category_slug; '' = clear; string = set */
    const [categorySlugForUrl, setCategorySlugForUrl] = useState(null)

    const [dropdownApiOptionsByName, setDropdownApiOptionsByName] = useState({})
    const [dropdownApiLoading, setDropdownApiLoading] = useState(false)
    const [dropdownApiError, setDropdownApiError] = useState(null)
    const [dropdownApiSelected, setDropdownApiSelected] = useState({})

    const searchParamsKey = searchParams?.toString?.() ?? ''
    /** `get-category-tree-by-slug` must be scoped by URL `slug` only (not `category_slug`). */
    const jobsTreeSlugFromUrl = useMemo(() => searchParams?.get('slug')?.trim() || '', [searchParamsKey, searchParams])
    /** Prefill selection from URL `category_slug` (not `slug`). */
    const categorySlugSelectedFromUrl = useMemo(
        () => searchParams?.get('category_slug')?.trim() || '',
        [searchParamsKey, searchParams]
    )
    const employmentTypeFromUrl = useMemo(
        () => searchParams?.get('employment_type')?.trim() || '',
        [searchParamsKey, searchParams]
    )
    const educationFromUrl = useMemo(
        () => searchParams?.get('education')?.trim() || '',
        [searchParamsKey, searchParams]
    )

    const apiDefs = Array.isArray(apiFilters) ? apiFilters : []
    const educationDef = useMemo(
        () =>
            apiDefs.find((f) => String(f?.name || '').trim().toLowerCase() === 'education level') ||
            apiDefs.find((f) => String(f?.name || '').trim().toLowerCase().includes('education')),
        [apiDefs]
    )
    const apiEducationOptions = useMemo(() => pickApiFilterOptions(educationDef), [educationDef])
    const educationOptions = apiEducationOptions.length ? apiEducationOptions : EDUCATION_OPTIONS

    const employmentTypeDef = useMemo(
        () =>
            apiDefs.find((f) => String(f?.name || '').trim().toLowerCase() === 'employment type') ||
            apiDefs.find((f) => String(f?.name || '').trim().toLowerCase().includes('employment')),
        [apiDefs]
    )
    const apiEmploymentTypeOptions = useMemo(() => pickApiFilterOptions(employmentTypeDef), [employmentTypeDef])
    const employmentTypeOptions = apiEmploymentTypeOptions.length ? apiEmploymentTypeOptions : EMPLOYMENT_TYPES

    const remoteJobDef = useMemo(
        () =>
            apiDefs.find((f) => String(f?.name || '').trim().toLowerCase() === 'remote job') ||
            apiDefs.find((f) => String(f?.name || '').trim().toLowerCase().includes('remote')),
        [apiDefs]
    )
    const apiRemoteJobOptions = useMemo(() => pickApiFilterOptions(remoteJobDef), [remoteJobDef])
    const remoteJobOptions = apiRemoteJobOptions.length ? apiRemoteJobOptions : REMOTE_JOB

    const adsPostedDef = useMemo(
        () =>
            apiDefs.find((f) => String(f?.name || '').trim().toLowerCase() === 'ads posted') ||
            apiDefs.find((f) => String(f?.name || '').trim().toLowerCase().includes('posted')),
        [apiDefs]
    )
    const apiAdsPostedOptions = useMemo(() => pickApiFilterOptions(adsPostedDef), [adsPostedDef])
    const adsPostedOptions = apiAdsPostedOptions.length ? apiAdsPostedOptions : ADS_POSTED

    const englishOnlyDef = useMemo(
        () =>
            apiDefs.find((f) => String(f?.name || '').trim().toLowerCase().includes('english')) ||
            apiDefs.find((f) => String(f?.name || '').trim().toLowerCase().includes('language')),
        [apiDefs]
    )

    const verifiedOnlyDef = useMemo(
        () =>
            apiDefs.find((f) => String(f?.name || '').trim().toLowerCase().includes('verified')) ||
            apiDefs.find((f) => String(f?.name || '').trim().toLowerCase().includes('verification')),
        [apiDefs]
    )

    const dropdownApiDefs = useMemo(
        () => apiDefs.filter((f) => String(f?.type || '').trim().toLowerCase() === 'dropdown_api'),
        [apiDefs]
    )

    const apiCategoryLabels = useMemo(
        () => categoryTree.map((n) => treeNodeLabel(n)).filter(Boolean),
        [categoryTree]
    )

    const categoryQuery = category.trim().toLowerCase()
    const mergedCategoryPool = useMemo(() => {
        const fromApi = apiCategoryLabels
        const merged = [...fromApi, ...JOB_CATEGORY_SUGGESTIONS.filter((x) => !fromApi.includes(x))]
        return merged
    }, [apiCategoryLabels])

    const filteredCategorySuggestions = categoryQuery
        ? mergedCategoryPool.filter((x) => x.toLowerCase().includes(categoryQuery))
        : mergedCategoryPool.slice(0, 8)

    const subCategoryChildren = useMemo(() => getTreeNodeChildren(selectedCategoryNode), [selectedCategoryNode])
    const subCategoryQuery = subCategory.trim().toLowerCase()
    const filteredSubCategorySuggestions = subCategoryQuery
        ? subCategoryChildren
              .map((n) => treeNodeLabel(n))
              .filter((label) => label.toLowerCase().includes(subCategoryQuery))
        : subCategoryChildren.map((n) => treeNodeLabel(n)).filter(Boolean).slice(0, 12)

    /** Slug from the **Category** row (parent), passed as `category_slug` to `job-roles` and other dropdown APIs. */
    const parentCategorySlug = useMemo(() => treeNodeSlug(selectedCategoryNode), [selectedCategoryNode])

    useEffect(() => {
        setDropdownApiSelected({})
    }, [parentCategorySlug])

    useEffect(() => {
        if (!open || !dropdownApiDefs.length) {
            if (!open) {
                setDropdownApiOptionsByName({})
                setDropdownApiLoading(false)
                setDropdownApiError(null)
            }
            return undefined
        }
        if (!parentCategorySlug) {
            setDropdownApiOptionsByName({})
            setDropdownApiLoading(false)
            setDropdownApiError(null)
            return undefined
        }

        let cancelled = false
        setDropdownApiLoading(true)
        setDropdownApiError(null)

        ;(async () => {
            try {
                const pairs = await Promise.all(
                    dropdownApiDefs.map(async (def) => {
                        const name = String(def?.name || '').trim()
                        const ep = getDropdownApiEndpointKey(def).toLowerCase()
                        if (!name || !ep) return [name, []]

                        if (ep === 'job-roles') {
                            const res = await jobRolesApi.getByCategorySlug({ category_slug: parentCategorySlug })
                            return [name, parseDropdownApiListPayload(res)]
                        }

                        const res = await Api.get(ep, {
                            params: { category_slug: parentCategorySlug },
                            headers: { Accept: 'application/json' },
                        })
                        return [name, parseDropdownApiListPayload(res)]
                    })
                )
                if (cancelled) return
                const next = {}
                for (const [name, opts] of pairs) {
                    if (name) next[name] = Array.isArray(opts) ? opts : []
                }
                setDropdownApiOptionsByName(next)
            } catch {
                if (!cancelled) {
                    setDropdownApiError('Could not load options')
                    setDropdownApiOptionsByName({})
                }
            } finally {
                if (!cancelled) setDropdownApiLoading(false)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [open, parentCategorySlug, dropdownApiDefs])

    useEffect(() => {
        if (!open) return
        if (!categoryOpen) return
        const onDown = (e) => {
            if (!categoryWrapRef.current?.contains(e.target)) setCategoryOpen(false)
        }
        document.addEventListener('mousedown', onDown)
        return () => document.removeEventListener('mousedown', onDown)
    }, [open, categoryOpen])

    useEffect(() => {
        if (!open) return
        if (!subCategoryOpen) return
        const onDown = (e) => {
            if (!subCategoryWrapRef.current?.contains(e.target)) setSubCategoryOpen(false)
        }
        document.addEventListener('mousedown', onDown)
        return () => document.removeEventListener('mousedown', onDown)
    }, [open, subCategoryOpen])

    useEffect(() => {
        if (!open) return
        setCategoryOpen(false)
        setSubCategoryOpen(false)
    }, [open])

    useEffect(() => {
        if (!open || !jobsTreeSlugFromUrl) {
            if (!open) setCategoryTree([])
            return
        }
        let cancelled = false
        setCategoryTreeLoading(true)
        categoryApi
            .getCategoryTreeBySlug({ category_slug: jobsTreeSlugFromUrl })
            .then((res) => {
                if (cancelled) return
                setCategoryTree(parseJobsCategoryTreeChildren(res))
            })
            .catch(() => {
                if (cancelled) return
                setCategoryTree([])
            })
            .finally(() => {
                if (!cancelled) setCategoryTreeLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [open, jobsTreeSlugFromUrl])

    useEffect(() => {
        if (!open || !categoryTree.length) return
        const selected = findSelectedJobsTreePath(categoryTree, categorySlugSelectedFromUrl)
        if (!selected) return
        const categoryNode = selected.categoryNode
        const subCategoryNode = selected.subCategoryNode
        setSelectedCategoryNode(categoryNode)
        setCategory(treeNodeLabel(categoryNode))
        if (subCategoryNode) {
            setSubCategory(treeNodeLabel(subCategoryNode))
            setCategorySlugForUrl(treeNodeSlug(subCategoryNode) || treeNodeSlug(categoryNode) || null)
        } else {
            setSubCategory('')
            setCategorySlugForUrl(treeNodeSlug(categoryNode) || null)
        }
    }, [open, categoryTree, categorySlugSelectedFromUrl])

    useEffect(() => {
        if (!employmentTypeFromUrl) return
        const needle = normalizeForUrlFilterMatch(employmentTypeFromUrl)
        const matched = employmentTypeOptions.find((opt) => normalizeForUrlFilterMatch(opt) === needle)
        setEmploymentType(matched ? [matched] : [])
    }, [employmentTypeFromUrl, employmentTypeOptions])

    useEffect(() => {
        if (!educationFromUrl || hideEducation) return
        const needle = normalizeForUrlFilterMatch(educationFromUrl)
        const matched = educationOptions.find((opt) => normalizeForUrlFilterMatch(opt) === needle)
        setEducation(matched ? [matched] : [])
    }, [educationFromUrl, educationOptions, hideEducation])

    if (!open) return null

    const toggleMulti = (value, state, setter) => {
        setter(state.includes(value) ? state.filter((x) => x !== value) : [...state, value])
    }

    const handleClear = () => {
        setEducation([])
        setEmploymentType([])
        setRemoteJob([])
        setAdsPosted([])
        setCategory('')
        setSubCategory('')
        setSelectedCategoryNode(null)
        setCategorySlugForUrl('')
        setCategoryOpen(false)
        setSubCategoryOpen(false)
        setEnglishOnly(false)
        setVerifiedOnly(false)
        setDropdownApiSelected({})
        setDropdownApiOptionsByName({})
        setDropdownApiError(null)
    }

    const findTopCategoryNodeByLabel = (label) => {
        const t = String(label || '').trim()
        if (!t) return null
        return categoryTree.find((n) => treeNodeLabel(n) === t) || null
    }

    const findSubCategoryNodeByLabel = (label) => {
        const t = String(label || '').trim()
        if (!t) return null
        return subCategoryChildren.find((n) => treeNodeLabel(n) === t) || null
    }

    return (
        <div
            className="absolute right-0 rtl:left-0 rtl:right-auto top-[calc(100%+8px)] z-[95] flex max-h-[min(85vh,680px)] w-[min(100vw-20px,420px)] flex-col overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)] max-sm:w-full max-sm:right-0"
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
                {!hideEducation ? (
                    <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                        <h4 className="mb-[12px] text-[16px] font-[Inter-SemiBold] text-[#23262A]">Education</h4>
                        <div className="flex flex-wrap gap-[8px]">
                            {educationOptions.map((item) => (
                                <Chip key={item} active={education.includes(item)} onClick={() => toggleMulti(item, education, setEducation)}>
                                    {item}
                                </Chip>
                            ))}
                        </div>
                    </div>
                ) : null}

                <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                    <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Employment Type</h4>
                    <div className="flex flex-wrap gap-[8px]">
                        {employmentTypeOptions.map((item) => (
                            <Chip key={item} active={employmentType.includes(item)} onClick={() => toggleMulti(item, employmentType, setEmploymentType)}>
                                {item}
                            </Chip>
                        ))}
                    </div>
                </div>

                <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                    <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Remote Job</h4>
                    <div className="flex flex-wrap gap-[8px]">
                        {remoteJobOptions.map((item) => (
                            <Chip key={item} active={remoteJob.includes(item)} onClick={() => toggleMulti(item, remoteJob, setRemoteJob)}>
                                {item}
                            </Chip>
                        ))}
                    </div>
                </div>

                <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                    <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Ads Posted</h4>
                    <div className="flex flex-wrap gap-[8px]">
                        {adsPostedOptions.map((item) => (
                            <Chip key={item} active={adsPosted.includes(item)} onClick={() => toggleMulti(item, adsPosted, setAdsPosted)}>
                                {item}
                            </Chip>
                        ))}
                    </div>
                </div>

                <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                    <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Category</h4>
                    {categoryTreeLoading ? (
                        <p className="text-[13px] font-[Inter-Regular] text-[#8F8F8F]">Loading categories…</p>
                    ) : null}
                    <div ref={categoryWrapRef} className="relative">
                        <SearchIcon className="absolute left-[10px] top-1/2 h-[20px] w-[20px] -translate-y-1/2" stroke="#9CA3AF" />
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => {
                                setCategory(e.target.value)
                                setCategoryOpen(true)
                                const node = findTopCategoryNodeByLabel(e.target.value)
                                if (node) {
                                    setSelectedCategoryNode(node)
                                    const slug = treeNodeSlug(node)
                                    setCategorySlugForUrl(slug || null)
                                    setSubCategory('')
                                } else if (!e.target.value.trim()) {
                                    setSelectedCategoryNode(null)
                                    setSubCategory('')
                                    setCategorySlugForUrl('')
                                } else {
                                    setSelectedCategoryNode(null)
                                    setSubCategory('')
                                    setCategorySlugForUrl(null)
                                }
                            }}
                            onFocus={() => setCategoryOpen(true)}
                            placeholder="Search"
                            className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[12px_10px_12px_40px] text-[14px] text-[#23262A] outline-none placeholder:text-[#A9B1BB]"
                        />
                        {categoryOpen ? (
                            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[140] max-h-[280px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
                                <div className="max-h-[280px] overflow-y-auto [scrollbar-width:thin]">
                                    {filteredCategorySuggestions.length ? (
                                        filteredCategorySuggestions.map((item) => (
                                            <button
                                                key={item}
                                                type="button"
                                                className="block w-full px-[14px] py-[10px] text-left text-[14px] font-[Inter-Regular] text-[#23262A] hover:bg-[#F5F5F5]"
                                                onClick={() => {
                                                    setCategory(item)
                                                    setCategoryOpen(false)
                                                    const node = findTopCategoryNodeByLabel(item)
                                                    setSelectedCategoryNode(node)
                                                    setSubCategory('')
                                                    if (node) {
                                                        const slug = treeNodeSlug(node)
                                                        setCategorySlugForUrl(slug || null)
                                                    } else {
                                                        setCategorySlugForUrl(null)
                                                    }
                                                }}
                                            >
                                                {item}
                                            </button>
                                        ))
                                    ) : (
                                        <p className="px-[14px] py-[12px] text-[13px] font-[Inter-Regular] text-[#8F8F8F]">
                                            No categories found
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                {subCategoryChildren.length > 0 ? (
                    <div className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                        <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Sub-category</h4>
                        <div ref={subCategoryWrapRef} className="relative">
                            <SearchIcon className="absolute left-[10px] top-1/2 h-[20px] w-[20px] -translate-y-1/2" stroke="#9CA3AF" />
                            <input
                                type="text"
                                value={subCategory}
                                onChange={(e) => {
                                    setSubCategory(e.target.value)
                                    setSubCategoryOpen(true)
                                    const node = findSubCategoryNodeByLabel(e.target.value)
                                    if (node) {
                                        const slug = treeNodeSlug(node)
                                        setCategorySlugForUrl(slug || null)
                                    } else if (!e.target.value.trim()) {
                                        const p = selectedCategoryNode
                                        setCategorySlugForUrl(p ? treeNodeSlug(p) || null : null)
                                    } else {
                                        setCategorySlugForUrl(selectedCategoryNode ? treeNodeSlug(selectedCategoryNode) || null : null)
                                    }
                                }}
                                onFocus={() => setSubCategoryOpen(true)}
                                placeholder="Search"
                                className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] p-[12px_10px_12px_40px] text-[14px] text-[#23262A] outline-none placeholder:text-[#A9B1BB]"
                            />
                            {subCategoryOpen ? (
                                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[140] max-h-[280px] overflow-hidden rounded-[10px] border border-[rgba(143,143,143,0.22)] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
                                    <div className="max-h-[280px] overflow-y-auto [scrollbar-width:thin]">
                                        {filteredSubCategorySuggestions.length ? (
                                            filteredSubCategorySuggestions.map((item) => (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    className="block w-full px-[14px] py-[10px] text-left text-[14px] font-[Inter-Regular] text-[#23262A] hover:bg-[#F5F5F5]"
                                                    onClick={() => {
                                                        setSubCategory(item)
                                                        setSubCategoryOpen(false)
                                                        const node = findSubCategoryNodeByLabel(item)
                                                        if (node) {
                                                            const slug = treeNodeSlug(node)
                                                            setCategorySlugForUrl(slug || null)
                                                        }
                                                    }}
                                                >
                                                    {item}
                                                </button>
                                            ))
                                        ) : (
                                            <p className="px-[14px] py-[12px] text-[13px] font-[Inter-Regular] text-[#8F8F8F]">
                                                No sub-categories found
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {dropdownApiDefs.length > 0
                    ? dropdownApiDefs.map((def) => {
                          const name = String(def?.name || '').trim()
                          if (!name) return null
                          const options = dropdownApiOptionsByName[name] || []
                          const multiselect = Boolean(def.multiselect)
                          const selectedArr = multiselect
                              ? Array.isArray(dropdownApiSelected[name])
                                  ? dropdownApiSelected[name]
                                  : dropdownApiSelected[name]
                                    ? [dropdownApiSelected[name]]
                                    : []
                              : []
                          return (
                              <div key={name} className="border-b border-[rgba(143,143,143,0.2)] p-[16px]">
                                  <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">{name}</h4>
                                  {!parentCategorySlug ? (
                                      <p className="text-[13px] font-[Inter-Regular] text-[#8F8F8F]">
                                          Select a category above to load options.
                                      </p>
                                  ) : null}
                                  {dropdownApiError ? (
                                      <p className="mb-[8px] text-[13px] font-[Inter-Regular] text-[#DC0000]">{dropdownApiError}</p>
                                  ) : null}
                                  {parentCategorySlug && dropdownApiLoading ? (
                                      <p className="text-[13px] font-[Inter-Regular] text-[#8F8F8F]">Loading…</p>
                                  ) : null}
                                  {parentCategorySlug && !dropdownApiLoading && !dropdownApiError && options.length === 0 ? (
                                      <p className="text-[13px] font-[Inter-Regular] text-[#8F8F8F]">No options for this category.</p>
                                  ) : null}
                                  {multiselect ? (
                                      <div className="flex flex-wrap gap-[8px]">
                                          {options.map((item) => (
                                              <Chip
                                                  key={item}
                                                  active={selectedArr.includes(item)}
                                                  onClick={() => {
                                                      setDropdownApiSelected((prev) => {
                                                          const cur = Array.isArray(prev[name])
                                                              ? prev[name]
                                                              : prev[name]
                                                                ? [prev[name]]
                                                                : []
                                                          const next = cur.includes(item)
                                                              ? cur.filter((x) => x !== item)
                                                              : [...cur, item]
                                                          return { ...prev, [name]: next }
                                                      })
                                                  }}
                                              >
                                                  {item}
                                              </Chip>
                                          ))}
                                      </div>
                                  ) : (
                                      <select
                                          className="w-full rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white p-[12px_10px] text-[14px] text-[#23262A] outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                          disabled={!parentCategorySlug || dropdownApiLoading || Boolean(dropdownApiError)}
                                          value={
                                              dropdownApiSelected[name] != null && dropdownApiSelected[name] !== ''
                                                  ? String(dropdownApiSelected[name])
                                                  : ''
                                          }
                                          onChange={(e) => {
                                              const v = e.target.value
                                              setDropdownApiSelected((prev) => ({ ...prev, [name]: v }))
                                          }}
                                      >
                                          <option value="">Any</option>
                                          {options.map((opt) => (
                                              <option key={opt} value={opt}>
                                                  {opt}
                                              </option>
                                          ))}
                                      </select>
                                  )}
                              </div>
                          )
                      })
                    : null}

                <div className="p-[16px]">
                    <h4 className="mb-[12px] text-[14px] font-[Inter-SemiBold] text-[#23262A]">Other Filters</h4>
                    <label className="relative cursor-pointer mb-[10px] flex items-center gap-[10px] text-[14px] text-[#23262A]">
                        <input
                            type="checkbox"
                            checked={englishOnly}
                            onChange={() => setEnglishOnly((v) => !v)}
                            className="h-[22px] w-[22px] appearance-none checked:bg-[#fff] checked:border-[#DC0000] cursor-pointer border-2 border-[rgba(143,143,143,0.5)] rounded"
                        />
                        {englishOnly ? (
                            <TickIcon className="w-[24px] h-[22px] absolute left-[-1px] rtl:right-[-1px] rtl:left-auto" fill="#DC0000" />
                        ) : null}
                        <p className="text-[14px] font-[Inter-Regular] text-[#000]">Show ads in English only</p>
                    </label>
                    <label className="relative cursor-pointer flex items-center gap-[10px] text-[14px] text-[#23262A]">
                        <input
                            type="checkbox"
                            checked={verifiedOnly}
                            onChange={() => setVerifiedOnly((v) => !v)}
                            className="h-[22px] w-[22px] appearance-none checked:bg-[#fff] checked:border-[#DC0000] cursor-pointer border-2 border-[rgba(143,143,143,0.5)] rounded"
                        />
                        {verifiedOnly ? (
                            <TickIcon className="w-[24px] h-[22px] absolute left-[-1px] rtl:right-[-1px] rtl:left-auto" fill="#DC0000" />
                        ) : null}
                        <p className="text-[14px] font-[Inter-Regular] text-[#000]">Show ads by Verified Users</p>
                    </label>
                </div>
            </div>

            <div className="shrink-0 border-t border-[rgba(143,143,143,0.2)] p-[12px_16px]">
                <div className="flex items-stretch gap-[10px]">
                    <button
                        type="button"
                        className="cursor-pointer rounded-[6px] border border-[rgba(143,143,143,0.45)] bg-white p-[12px_26px] text-[14px] font-[Inter-SemiBold] text-[#23262A]"
                        onClick={handleClear}
                    >
                        Clear
                    </button>
                    <button
                        type="button"
                        className="flex-1 cursor-pointer rounded-[6px] bg-[#23262A] py-[12px] text-[14px] font-[Inter-Medium] text-white"
                        onClick={() => {
                            const dynamicFilters = {}
                            if (!hideEducation && educationDef?.name) dynamicFilters[educationDef.name] = education
                            if (employmentTypeDef?.name) dynamicFilters[employmentTypeDef.name] = employmentType
                            if (remoteJobDef?.name) dynamicFilters[remoteJobDef.name] = remoteJob
                            if (adsPostedDef?.name) dynamicFilters[adsPostedDef.name] = adsPosted
                            if (englishOnlyDef?.name && englishOnly) dynamicFilters[englishOnlyDef.name] = 'Yes'
                            if (verifiedOnlyDef?.name && verifiedOnly) dynamicFilters[verifiedOnlyDef.name] = 'Yes'
                            for (const d of dropdownApiDefs) {
                                const n = String(d?.name || '').trim()
                                if (!n) continue
                                const raw = dropdownApiSelected[n]
                                if (raw == null || raw === '') continue
                                if (d.multiselect) {
                                    const arr = Array.isArray(raw) ? raw : [raw]
                                    const cleaned = arr.map((x) => String(x).trim()).filter(Boolean)
                                    if (cleaned.length) dynamicFilters[n] = cleaned
                                } else {
                                    dynamicFilters[n] = String(raw).trim()
                                }
                            }
                            const payload = {
                                category,
                                subCategory,
                                dynamicFilters,
                                // Always replace URL `category_slug` with the latest selection:
                                // - sub-category slug when selected
                                // - parent category slug when only category is selected
                                // - '' when cleared
                                category_slug: categorySlugForUrl ?? '',
                            }
                            onApply?.(payload)
                            onClose?.()
                        }}
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    )
}

