'use client'
import TopAd from "@/components/Advertisements/TopAd"
import BreadcrumbComponent from "@/components/Breadcrumb/BreadcrumbComponent"
import ProdcutHorizontalCard from "@/components/Cards/ProdcutHorizontalCard"
import ProductCard from "@/components/Cards/ProductCard"
import FilterCard from "@/components/ProductPageUI/FilterCard"
import { useEffect, useMemo, useState } from "react"
import { IoCloseCircle, IoGrid } from "react-icons/io5"
import { CgArrowsExchangeAltV } from "react-icons/cg";
import { Select, MenuItem } from '@mui/material';
import { useDispatch, useSelector } from "react-redux"
import { t } from "@/utils"
import { SearchData } from "@/redux/reuducer/searchSlice"
import { allItemApi } from "@/utils/api"
import ProductHorizontalCardSkeleton from "@/components/Skeleton/ProductHorizontalCardSkeleton"
import ProductCardSkeleton from "@/components/Skeleton/ProductCardSkeleton"
import NoData from "@/components/NoDataFound/NoDataFound";
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import Link from "next/link"
import { userSignUpData } from "@/redux/reuducer/authSlice"
import { setBreadcrumbPath } from "@/redux/reuducer/breadCrumbSlice"
import { ViewCategory, setCategoryView } from "@/redux/reuducer/categorySlice"
import { getCityData } from "@/redux/reuducer/locationSlice"
import { usePathname, useSearchParams } from "next/navigation"
import { getMotorsListingQueryFromPathname } from "@/utils/motorsListingPaths"
import MainFiterPage from './Filter/MainFilterPage'
import MotorsCard from "./components/MotorsCard"
import JobsCard from "./components/JobsCard"
import CommunityCard from "./components/CommunityCard"
import ClassifiedCard from "./components/ClassifiedCard"
import PropertyCard from "./components/PropertyCard"
import Newprojectcard from "./components/Newprojectcard"
import ProductsBreadcrumb from "./components/Breadcrumb"
const Products = () => {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const motorsPathQuery = getMotorsListingQueryFromPathname(pathname)

    const cityData = useSelector(getCityData)
    const { lat, long } = cityData || {}
    const dispatch = useDispatch()
    const search = useSelector(SearchData)
    const userData = useSelector(userSignUpData);
    const [IsLoading, setIsLoading] = useState(false)
    const [searchedData, setSearchedData] = useState([])
    const [sortBy, setSortBy] = useState('new-to-old');
    // const [view, setView] = useState('list');
    const view = useSelector(ViewCategory)
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const [selectedLocationKey, setSelectedLocationKey] = useState([])
    const [MinMaxPrice, setMinMaxPrice] = useState({
        min_price: '',
        max_price: '',
    })
    const [Country, setCountry] = useState('')
    const [State, setState] = useState('')
    const [City, setCity] = useState('')
    const [Area, setArea] = useState('')
    const [IsShowBudget, setIsShowBudget] = useState(false)
    const [DatePosted, setDatePosted] = useState('')
    const [IsFetchSingleCatItem, setIsFetchSingleCatItem] = useState(false)
    const [KmRange, setKmRange] = useState(0)
    const [IsShowKmRange, setIsShowKmRange] = useState(false)
    const [IsLoadMore, setIsLoadMore] = useState(false)
    const [listItemsTotal, setListItemsTotal] = useState(null)


    const searchParamsKey = searchParams?.toString?.() ?? ''

    const urlGetItemParams = useMemo(() => {
        const sp = searchParams
        const filterQuery = {}
        if (sp?.forEach) {
            sp.forEach((v, k) => {
                if (k.startsWith('filters[') && k.endsWith(']')) {
                    // Backend expects these exact keys, so pass through.
                    filterQuery[k] = v
                }
            })
        }
        const category_slug = sp?.get?.('category_slug') || ''
        const employment_type = sp?.get?.('employment_type') || ''
        const education = sp?.get?.('education') || ''
        return {
            category_slug: String(category_slug || '').trim() || undefined,
            filterQuery: {
                ...(Object.keys(filterQuery).length ? filterQuery : {}),
                ...(employment_type ? { employment_type } : {}),
                ...(education ? { education } : {}),
            },
        }
    }, [searchParamsKey, searchParams])

    const getProducts = async (page) => {
        let data = "";
        try {
            const urlCity = searchParams?.get?.('city')?.trim() || undefined
            const reduxCity = String(cityData?.city || '').trim() || undefined
            const urlCountry = searchParams?.get?.('country')?.trim() || undefined
            const params = {
                sort_by: sortBy,
                min_price: MinMaxPrice?.min_price,
                max_price: MinMaxPrice?.max_price,
                area_id: Area?.id,
                posted_since: DatePosted,
                page,
            };

            // Conditionally add latitude, longitude, and radius if IsShowKmRange is true
            if (IsShowKmRange) {
                params.latitude = lat;
                params.longitude = long;
                params.radius = KmRange;
                setCountry('')
                setState('')
                setCity('')
                setArea('')
                setSelectedLocationKey([])
            } else {
                // If KmRange is 0, only add country, state, city if they are selected
                if (urlCity || City || reduxCity) {
                    params.city = urlCity || City || reduxCity;
                    if (urlCountry) params.country = urlCountry
                    setKmRange(0)
                } else if (State) {
                    params.state = State;
                    setKmRange(0)
                } else if (urlCountry || Country) {
                    params.country = urlCountry || Country;
                    setKmRange(0)
                }
            }

            if (search !== "") {
                params.search = search;
            }

            if (page === 1) {
                setIsLoading(true);
            }
            const res = await allItemApi.getItems({
                ...params,
                ...(urlGetItemParams.category_slug ? { category_slug: urlGetItemParams.category_slug } : {}),
                filterQuery: urlGetItemParams.filterQuery,
            });
            data = res?.data;
            if (data.error !== true) {
                if (page > 1) {
                    setSearchedData([...searchedData, ...data?.data?.data]);
                } else {
                    setSearchedData(data?.data?.data);
                }
                setCurrentPage(data?.data?.current_page)
                setLastPage(data?.data?.last_page)
            } else {
                setIsLoading(false)
            }
        } catch (error) {
            console.log(error)
        }
        finally {
            setIsLoading(false);
            setIsLoadMore(false)
        }
    }
    // Default view

    const handleChange = (event) => {
        setSortBy(event.target.value);
    };

    const handleGridClick = (viewType) => {
        dispatch(setCategoryView(viewType))
    };

    useEffect(() => {
        const modeInUrl = (searchParams?.get?.('mode') || motorsPathQuery?.mode || '').toLowerCase()
        const slugInUrl = (searchParams?.get?.('slug') || '').toLowerCase()
        const itemInUrl = (searchParams?.get?.('item') || '').toLowerCase()
        const isJobsContext =
            modeInUrl.includes('jobs') ||
            modeInUrl.includes('recruiter') ||
            slugInUrl.includes('jobs') ||
            itemInUrl.includes('jobs')
        if (isJobsContext) return
        getProducts(1)
    }, [search, sortBy, IsFetchSingleCatItem, searchParamsKey, searchParams, motorsPathQuery, cityData?.city])

    useEffect(() => {
        dispatch(setBreadcrumbPath([{ name: t('allCategories'), slug: '/products' }]))
    }, [])


    const clearLocation = () => {
        setCountry('')
        setState('')
        setCity('')
        setArea('')
        setSelectedLocationKey([])
        setIsFetchSingleCatItem((prev) => !prev)
    }

    const clearBudget = () => {
        setIsShowBudget(false)
        setMinMaxPrice({
            min_price: '',
            max_price: '',
        })
        setIsFetchSingleCatItem((prev) => !prev)
    }

    const clearDatePosted = () => {
        setDatePosted('');
        setIsFetchSingleCatItem((prev) => !prev)
    }

    const clearAll = () => {

        setSelectedLocationKey([]);
        setCountry('');
        setState('');
        setCity('');
        setArea('')
        setMinMaxPrice({
            min_price: '',
            max_price: '',
        });
        setIsShowBudget(false);
        setIsShowKmRange(false)
        setSortBy('new-to-old');
        setDatePosted('');
        setKmRange(0)
        setIsFetchSingleCatItem((prev) => !prev);
    };

    const postedSince = DatePosted === 'all-time' ? t('allTime') :
        DatePosted === 'today' ? t('today') :
            DatePosted === 'within-1-week' ? t('within1Week') :
                DatePosted === 'within-2-week' ? t('within2Weeks') :
                    DatePosted === 'within-1-month' ? t('within1Month') :
                        DatePosted === 'within-3-month' ? t('within3Months') : '';

    const isClearAll = selectedLocationKey.length === 0 && !IsShowBudget && DatePosted === '' && sortBy === 'new-to-old' && !IsShowKmRange



    const handleLike = (id) => {
        const updatedItems = searchedData.map((item) => {
            if (item.id === id) {
                return { ...item, is_liked: !item.is_liked };
            }
            return item;
        });
        setSearchedData(updatedItems);
    }

    const handleLoadMore = () => {
        setIsLoadMore(true)
        getProducts(currentPage + 1); // Pass current sorting option

    };

    // Sorting the searchedData to prioritize items with is_feature set to true
    const sortedSearchedData = searchedData?.sort((a, b) => {
        const rank = (item) => (item?.is_premium ? 0 : item?.is_feature ? 1 : 2)
        return rank(a) - rank(b)
    })

    const clearKmRange = () => {
        setKmRange(0)
        setIsShowKmRange(false)
        setIsFetchSingleCatItem((prev) => !prev)
    }
    const modeParam = (searchParams?.get('mode') || motorsPathQuery?.mode || '').toLowerCase()
    const slugParam = (searchParams?.get('slug') || motorsPathQuery?.slug || '').toLowerCase()
    const purposeParam = (searchParams?.get('purpose') || '').toLowerCase()
    const segmentParam = (searchParams?.get('segment') || '').toLowerCase()

    // Map URL mode → which card component to render
    const isClassifiedFamilyMode =
        modeParam.includes('classified') ||
        modeParam.includes('furniture') ||
        modeParam.includes('mobile')

    const pillMode = modeParam.includes('property')
        ? 'property'
        : modeParam.includes('jobs')
            ? 'jobs'
            : modeParam.includes('motors')
                ? 'motors'
                : modeParam.includes('community')
                    ? 'community'
                    : isClassifiedFamilyMode
                        ? 'classified'
                        : 'motors'
    const itemParam = ((searchParams?.get('item') || motorsPathQuery?.item || '').toLowerCase()) || (
        pillMode === 'property'
            ? (purposeParam === 'sale' || purposeParam === 'buy' ? 'property-for-sale' : 'property-for-rent')
            : ''
    )

    const isNewProjectsMode =
        pillMode === 'property' &&
        (segmentParam === 'new_projects' ||
            slugParam.includes('new-project') ||
            itemParam.includes('new project') ||
            itemParam.includes('new projects'))

    const listingQueryKey = searchParams?.toString() ?? ''
    useEffect(() => {
        setListItemsTotal(null)
    }, [pillMode, listingQueryKey])

    return (
        <>
            <div className="w-full mx-auto">
                <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
                    <div className="mb-[20px]">
                        <MainFiterPage mode={pillMode} sourceMode={modeParam} />
                    </div>
                    <ProductsBreadcrumb
                        mode={pillMode}
                        sourceMode={modeParam}
                        itemParam={itemParam}
                        slugParam={slugParam}
                        segmentParam={segmentParam}
                        itemsTotal={listItemsTotal}
                    />
                    <div className="grid grid-cols-[1fr_300px] gap-[20px] max-sm:grid-cols-1 products_grid">
                        <div className="min-w-0">
                            {pillMode === 'property' ? (
                                isNewProjectsMode ? (
                                    <Newprojectcard />
                                ) : (
                                    <PropertyCard perPage={15} onItemsTotalChange={setListItemsTotal} />
                                )
                            ) : null}
                            {pillMode === 'motors' ? (
                                <MotorsCard perPage={15} onItemsTotalChange={setListItemsTotal} />
                            ) : null}
                            {pillMode === 'jobs' ? <JobsCard perPage={15} onItemsTotalChange={setListItemsTotal} /> : null}
                            {pillMode === 'community' ? (
                                <CommunityCard perPage={15} onItemsTotalChange={setListItemsTotal} />
                            ) : null}
                            {pillMode === 'classified' ? (
                                <ClassifiedCard
                                    perPage={15}
                                    onItemsTotalChange={setListItemsTotal}
                                />
                            ) : null}
                        </div>
                        <div className="w-[300px] max-sm:w-full">

                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Products