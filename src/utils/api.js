'use client'
import Api from "@/api/AxiosInterceptors"
import { store } from "@/redux/store"

/** Strip debug `<script>` suffix some API responses include after JSON. */
const parseJsonApiResponse = (data) => {
    if (typeof data !== 'string') return data
    const clean = data.split('<script')[0].split('<link')[0].trim()
    if (!clean) return data
    try {
        return JSON.parse(clean)
    } catch {
        return data
    }
}

const jsonApiGetConfig = {
    transformResponse: [(data) => parseJsonApiResponse(data)],
}
export const GET_SETTINGS = "get-system-settings"
export const GET_SEO_SETTINGS = "seo-settings"
export const GET_SLIDER = "get-slider"
export const GET_HOMEPAGE_BANNERS = "get-homepage-banners"
export const GET_CATEGORIES = "get-categories"
export const GET_CATEGORY_CHILDREN_BY_PARENT = "get-category-children-by-parent"
export const GET_CATEGORY_FILTERS = "get-category-filters"
export const SEARCH_CAR_MAKE_MODEL = "search-car-make-model"
export const GET_CAR_MODELS = "get-car-models"
export const CAR_EVALUATIONS = "car-evaluations"
export const GET_CATEGORY_TREE_BY_SLUG = "get-category-tree-by-slug"
export const SEARCH_CATEGORIES_UNDER_SLUG = "search-categories-under-slug"
export const SEARCH_JOB_SUGGESTION = "search-job-suggestion"
export const SEARCH_BANNER_SUGGESTION = "search-banner-suggestion"
export const GET_PARENT_CATEGORIES = "get-parent-categories"
export const GET_PARENT_CATEGORY_LIST = "get-parent-category-list"
export const CATEGORY_HOME = 'categoryhome'
export const JOB_QUALIFICATION_COUNT = 'job-qualification-count'
export const JOB_TYPE_COUNT = 'job-type-count'
export const GET_ITEM = "get-item"
export const GET_SIMILAR_PRODUCT = "get-similar-product"
export const GET_PROPERTY_PLAN = "get-property-plan"
export const GET_PROPERTY_PLANS = "get-property-plans"
export const GET_PACKAGE = 'get-package'
export const GET_BLOGS = 'blogs'
export const GET_BLOG_TAGS = 'blog-tags'
export const GET_FEATURED_SECTION = "get-featured-section"
export const GET_HOME_CATEGORIES = "get-home-categories"
export const GET_POPULAR_CATEGORIES = "get-popular-categories"
export const GET_POPULAR_JOB = "get-popular-job"
export const GET_FAQ = 'faq'
export const GET_COUNTRIES = 'countries'
export const GET_STATES = 'states'
export const GET_CITIES = 'cities'
export const GET_AREA = 'areas'
export const GET_BUILDINGS = 'buildings'
export const GET_LOCATIONS = 'locations'
export const GET_LOCATION_ITEM_COUNT = 'location-item-count'
export const GET_LANGUAGE = 'get-languages'
export const GET_CUSTOM_FIELDS = 'get-customfields'
export const GET_CUSTOM_FIELDS_BY_CATEGORY_ID = 'get-customfields-by-category-id'
export const GET_JOB_ROLES = 'job-roles'
export const GET_CATEGORY_SUBDATA = 'category-subdata'
export const GET_CATEGORY_SUBDATA_ITEM_COUNT = 'category-subdata-item-count'
export const MANAGE_FAVOURITE = 'manage-favourite'
export const GET_FAVOURITE_ITEMS = 'get-favourite-item'
export const GET_FAVOURITE_LISTING = 'get-favourite-listing'
export const CREATE_FAVOURITE_LISTING = 'favourite-listing'
export const GET_SAVED_SEARCHES = 'saved-search'
export const EDIT_SAVED_SEARCH = 'edit-saved-search'
export const DELETE_SAVED_SEARCH = 'delete-saved-search'
export const GET_MY_ITEMS = 'my-items'
export const GET_MY_ITEMS_COUNT = 'my-items-count'
export const GET_LIMITS = 'get-limits'
export const DELETE_ITEM = 'delete-item'
export const UPDATE_ITEM_STATUS = 'update-item-status'
export const CREATE_FEATURED_ITEM = 'make-item-featured'
export const CONTACT_US = 'contact-us'
export const ADD_HELP_ME_BUY = 'add-helpme-buy'
export const SEND_ITEM_INQUIRY = 'send-item-inquiry'
export const UPDATE_LISTING = 'update-item'
export const USER_SIGNUP = 'user-signup'
export const UPDATE_PROFILE = 'update-profile'
export const DELETE_USER = 'delete-user'
export const GET_REPORT_REASONS = 'get-report-reasons'
export const ADD_REPORT = 'add-reports'
export const GET_NOTIFICATION_LIST = 'get-notification-list'
export const CHAT_LIST = 'chat-list'
export const CHAT_MESSAGES = 'chat-messages'
export const SEND_MESSAGE = 'send-message'
export const BLOCK_USER = 'block-user'
export const UNBLOCK_USER = 'unblock-user'
export const BLOCKED_USERS = 'blocked-users'
export const ASSIGN_FREE_PACKAGE = 'assign-free-package'
export const GET_PAYMENT_SETTINGS = 'get-payment-settings'
export const PAYMENT_INTENT = 'payment-intent'
export const CONFIRM_PAYMENT_INTENT = 'confirm-payment-intent'
export const PAYMENT_TRANSACTIONS = 'payment-transactions'
export const CAR_INSPECTION = 'car-inspection'
export const GET_CAR_INSPECTION = 'get-car-inspection'
export const CAR_FINANCE = 'car-finance'
export const TIPS = 'tips'
export const ITEM_OFFER = 'item-offer'
export const ADD_ITEM = 'add-item'
export const GET_SELLER = 'get-seller'
export const ITEM_BUYER_LIST = 'item-buyer-list'
export const AD_ITEM_REVIEW = 'add-item-review'
export const GET_VERIFICATION_FIELDS = 'verification-fields'
export const SEND_VERIFICATION_REQUEST = 'send-verification-request'
export const GET_VERIFICATION_STATUS = 'verification-request'
export const SEND_VERIFIED_BUSINESS_REQUEST = 'send-verified-business-request'
export const GET_VERIFIED_BUSINESS_STATUS = 'verified-business-status'
export const MY_REVIEWS = 'my-review'
export const RENEW_ITEM = 'renew-item'
export const ADD_REPORT_REVIEW = 'add-review-report'
export const AD_REPORT = 'ad-report'
export const ADD_JOB_APPLICATION_INFO = 'add-job-application-info'
export const GET_JOB_APPLICATION_INFO = 'get-job-application-info'
export const ADD_USER_DETAIL = 'add-user-detail'
export const GET_APPLY_INFO = 'get-apply-info'
export const GET_MY_JOB_APPLICATION = 'get-my-job-application'
export const GET_USER_DETAIL = 'get-user-detail'
export const GET_JOB_DASHBOARD_PROFILE = 'get-job-dashboard-profile'
export const ADD_PERSONAL_PROFILE = 'add-personal-profile'
export const ADD_COMPANY_PROFILE = 'add-company-profile'
export const GET_USER_REJECTION_RULE = 'get-user-rejection-rule'
export const USER_REJECTION_RULE = 'user-rejection-rule'
export const GET_CANDIDATE_DETAILS = 'get-candidate-details'
export const SAVED_CANDIDATE_DETAILS = 'saved-candidate-details'
export const GET_SAVED_CANDIDATE_DETAILS = 'get-saved-candidate-details'
export const GET_UNSAVED_CANDIDATE_DETAILS = 'get-unsaved-candidate-details'
export const GET_CANDIDATE_NAME = 'get-candidate-name'
export const SAVED_CANDIDATE_NAME = 'saved-candidate-name'
export const GET_SAVED_CANDIDATE_NAME = 'get-saved-candidate-name'
export const GET_PUBLIC_PROFILE_DATA = 'get-public-profile-data'
export const GET_USER_ADDRESS = 'get-user-address'
export const USER_ADDRESS_CHANGES = 'user-address-changes'
export const SET_USER_PHONENUMBER = 'set-user-phonenumber'
export const GET_DEVICES = 'get-devices'
export const LOGOUT_DEVICE = 'logout-device'
export const GET_CAR_APPOINTMENT_DETAILS = 'get-car-appointment-details'
export const GET_FEATURED_COMPANIES = 'get-featured-companies'
export const COMPANY_BOOKMARK = 'company-bookmark'
export const GET_BOOKMARK_COMPANIES = 'get-bookmark-companies'
export const DELETE_BOOKMARK_COMPANIES = 'delete-bookmark-companies'

const getStoredCityParam = () => {
    const city = store?.getState?.()?.Location?.cityData?.city
    const normalized = String(city || "").trim()
    return normalized || null
}




// 1. SETTINGS API
export const settingsApi = {
    getSettings: ({ type } = {}) => {
        return Api.get(GET_SETTINGS, {
            params: { type }
        })
    },
}

// 2. SLIDER API
export const sliderApi = {
    getSlider: () => {
        return Api.get(GET_SLIDER, { params: {} });
    },
}

/** Homepage banners: GET get-homepage-banners (optional category_id). */
export const homepageBannerApi = {
    getHomepageBanners: (category_id) => {
        const params = {}
        if (category_id != null && category_id !== "") params.category_id = category_id
        return Api.get(GET_HOMEPAGE_BANNERS, {
            params,
            headers: { Accept: "application/json" },
        })
    },
}

// 3. CATEGORY API
export const categoryApi = {
    getCategory: ({ category_id, page } = {}) => {
        return Api.get(GET_CATEGORIES, {
            params: { category_id, page },
        })
    },
    /** Place Your Ad: roots with no params; drill-down with parent_category_id; optional title filter. */
    getCategoryChildrenByParent: ({ parent_category_id, title, category_slug } = {}) => {
        const params = {}
        if (parent_category_id != null && parent_category_id !== '') {
            params.parent_category_id = parent_category_id
        }
        if (title != null && String(title).trim() !== '') {
            params.title = String(title).trim()
        }
        if (category_slug != null && String(category_slug).trim() !== '') {
            params.category_slug = String(category_slug).trim()
        }
        return Api.get(GET_CATEGORY_CHILDREN_BY_PARENT, {
            params,
            headers: { Accept: "application/json" },
        })
    },
    getCategoryFilters: ({ slug } = {}) => {
        return Api.get(GET_CATEGORY_FILTERS, {
            params: { slug },
            headers: { Accept: "application/json" },
        })
    },
    getCategoryTreeBySlug: ({ category_slug } = {}) => {
        return Api.get(GET_CATEGORY_TREE_BY_SLUG, {
            params: { category_slug },
            headers: { Accept: "application/json" },
        })
    },
    /** Optional `category_slug` (breadcrumb / scoped search); `q` when refining by make or model name; `make_id` lists models for that make. */
    searchCarMakeModel: ({ q, category_slug, make_id } = {}) => {
        const params = {}
        const cat = String(category_slug ?? "").trim()
        if (cat) params.category_slug = cat
        const query = String(q ?? "").trim()
        if (query) params.q = query
        const makeId = String(make_id ?? "").trim()
        if (makeId) params.make_id = makeId
        return Api.get(SEARCH_CAR_MAKE_MODEL, {
            params,
            headers: { Accept: "application/json" },
        })
    },
    /**
     * Jobs keyword autocomplete: search categories under a slug.
     * API: /api/search-categories-under-slug?category_slug=<slug>&text=<keyword>
     */
    searchCategoriesUnderSlug: ({ category_slug, text } = {}) => {
        const params = {}
        const slug = String(category_slug ?? "").trim()
        const q = String(text ?? "").trim()
        if (slug) params.category_slug = slug
        if (q) params.text = q
        return Api.get(SEARCH_CATEGORIES_UNDER_SLUG, {
            params,
            headers: { Accept: "application/json" },
        })
    },
    /** Jobs keyword autocomplete: /api/search-job-suggestion?text=<keyword> */
    searchJobSuggestion: ({ text } = {}) => {
        const params = {}
        const q = String(text ?? "").trim()
        if (q) params.text = q
        return Api.get(SEARCH_JOB_SUGGESTION, {
            params,
            headers: { Accept: "application/json" },
        })
    },
}

/** Property hero: tabs, sub-types, and filter definitions by listing slug (e.g. property-for-rent). */
export const categoryFiltersApi = {
    getCategoryFilters: ({ slug } = {}) => {
        return Api.get(GET_CATEGORY_FILTERS, {
            params: { slug },
            headers: { Accept: "application/json" },
        })
    },
}

export const categoryHomeApi = {
    getCategoryHome: ({ parent_category_id, category_slug } = {}) => {
        const params = {}
        if (parent_category_id != null && parent_category_id !== '') params.parent_category_id = parent_category_id
        if (category_slug) params.category_slug = category_slug
        return Api.get(CATEGORY_HOME, {
            params,
            headers: { Accept: "application/json" },
        })
    },
}

/** Jobs By Qualification: custom-field options + item counts for a city. */
export const jobQualificationCountApi = {
    getJobQualificationCount: ({ parent_category_id, city } = {}) => {
        const params = {}
        if (parent_category_id != null && parent_category_id !== '') params.parent_category_id = parent_category_id
        const cityName = String(city || '').trim()
        if (cityName) params.city = cityName
        return Api.get(JOB_QUALIFICATION_COUNT, {
            params,
            headers: { Accept: 'application/json' },
            ...jsonApiGetConfig,
        })
    },
}

/** Jobs By Type: Employment Type custom-field options + item counts for a city. */
export const jobTypeCountApi = {
    getJobTypeCount: ({ parent_category_id, city } = {}) => {
        const params = {}
        if (parent_category_id != null && parent_category_id !== '') params.parent_category_id = parent_category_id
        const cityName = String(city || '').trim()
        if (cityName) params.city = cityName
        return Api.get(JOB_TYPE_COUNT, {
            params,
            headers: { Accept: 'application/json' },
            ...jsonApiGetConfig,
        })
    },
}

/** Locations with items_count > 0: country→states, state→cities, city→areas, area→buildings. */
export const locationsApi = {
    getLocations: ({ country, state, city, area, area_id } = {}) => {
        const params = {}
        const countryVal = String(country || '').trim()
        const stateVal = String(state || '').trim()
        const cityVal = String(city || '').trim()
        const areaVal = String(area || '').trim()
        if (countryVal) params.country = countryVal
        if (stateVal) params.state = stateVal
        if (cityVal) params.city = cityVal
        if (areaVal) params.area = areaVal
        if (area_id) params.area_id = area_id
        return Api.get(GET_LOCATIONS, {
            params,
            headers: { Accept: 'application/json' },
            ...jsonApiGetConfig,
        })
    },
}

/** Property breadcrumb: cities/states/areas with listing counts (only locations with count >= 1). */
export const locationItemCountApi = {
    getLocationItemCount: ({ country, state, city, area, area_id, category_slug, limit } = {}) => {
        const params = {}
        const countryVal = String(country || '').trim()
        const stateVal = String(state || '').trim()
        const cityVal = String(city || '').trim()
        const areaVal = String(area || '').trim()
        if (countryVal) params.country = countryVal
        if (stateVal) params.state = stateVal
        if (cityVal) params.city = cityVal
        if (areaVal) params.area = areaVal
        if (area_id) params.area_id = area_id
        if (category_slug) params.category_slug = category_slug
        if (limit != null && limit !== '') params.limit = limit
        return Api.get(GET_LOCATION_ITEM_COUNT, {
            params,
            headers: { Accept: 'application/json' },
            ...jsonApiGetConfig,
        })
    },
}

export const getParentCategoryListApi = {
    getParentCategoryList: () => {
        return Api.get(GET_PARENT_CATEGORY_LIST, {
            params: {},
            headers: { Accept: "application/json" },
        })
    },
}
// 3. MY ITEMS API
export const getMyItemsApi = {
    getMyItems: ({ sort_by, page, per_page, status, id, category_id, slug, category_slug } = {}) => {
        return Api.get(GET_MY_ITEMS, {
            params: { page, per_page, sort_by, status, id, category_id, slug, category_slug },
            ...jsonApiGetConfig,
        })
    },
}
export const getMyItemsCountApi = {
    getMyItemsCount: ({ category_slug } = {}) => {
        return Api.get(GET_MY_ITEMS_COUNT, {
            params: { category_slug },
            ...jsonApiGetConfig,
        })
    },
}
export const getLimitsApi = {
    getLimits: ({ package_type } = {}) => {
        return Api.get(GET_LIMITS, {
            params: { package_type },
        })
    },
}
export const getSellerApi = {
    getSeller: ({ id, page } = {}) => {
        return Api.get(GET_SELLER, {
            params: { id, page },
        })
    },
}
export const getVerificationStatusApi = {
    getVerificationStatus: () => {
        return Api.get(GET_VERIFICATION_STATUS, {
        })
    },
}
export const getItemBuyerListApi = {
    getItemBuyerList: ({ item_id } = {}) => {
        return Api.get(ITEM_BUYER_LIST, {
            params: { item_id },
        })
    },
}
export const getVerificationFiledsApi = {
    getVerificationFileds: () => {
        return Api.get(GET_VERIFICATION_FIELDS, {

        })
    },
}

// 4. ITEM API
export const allItemApi = {
    getItems: ({
        id, custom_fileds, category_id, min_price, max_price, sort_by,
        posted_since, featured_section_id, status, page, search,
        country, state, city, slug, category_slug, featured_section_slug, area_id, building_id, latitude, longitude, radius, user_id, popular_items,
        purpose, area, property_type, per_page, limit, agency,
        make_id, model_id, make_model,
        seller_account_type, verified_business,
        filterQuery,
    } = {}) => {
        const normalizedCity = String(city || '').trim()
        return Api.get(GET_ITEM, {
            params: {
                id, custom_fileds, category_id, min_price, max_price, sort_by,
                posted_since, featured_section_id, status, page, search,
                country, state, city: normalizedCity || undefined, slug, category_slug, featured_section_slug, area_id, building_id, latitude, longitude, radius, user_id, popular_items,
                purpose, area, property_type, per_page, limit, agency,
                make_id,
                model_id,
                make_model,
                seller_account_type,
                verified_business,
                ...(filterQuery && typeof filterQuery === 'object' ? filterQuery : {}),
            }
        })
    },
}

export const recruiterItemsApi = {
    getRecruiterItems: ({ page = 1, limit = 10, category_slug = 'jobs-recruiters', user_id, type } = {}) => {
        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''
        const params = {
            page,
            limit,
            category_slug,
        }
        if (user_id != null && user_id !== '') params.user_id = String(user_id)
        if (type != null && type !== '') params.type = String(type)
        return Api.get(GET_ITEM, {
            params,
            headers: {
                Accept: 'application/json',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const similarProductApi = {
    getSimilarProducts: ({ category_id, item_id } = {}) => {
        const formData = new FormData()
        if (category_id != null && category_id !== '') formData.append('category_id', String(category_id))
        if (item_id != null && item_id !== '') formData.append('item_id', String(item_id))
        return Api.post(GET_SIMILAR_PRODUCT, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    },
}

export const propertyPlanApi = {
    getPropertyPlan: ({ item_id } = {}) => {
        const formData = new FormData()
        if (item_id != null && item_id !== '') formData.append('item_id', String(item_id))

        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.post(GET_PROPERTY_PLAN, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
    getPropertyPlans: ({ item_id } = {}) => {
        return Api.get(GET_PROPERTY_PLANS, {
            params: {
                item_id,
            },
        })
    },
}

/** Homepage search bar: GET get-item with search (+ optional category_id for parent tab). */
export const searchItemsApi = {
    searchItems: ({ search, category_id, city, page = 1 } = {}) => {
        const params = { page }
        if (search != null && String(search).trim() !== "") params.search = String(search).trim()
        if (category_id != null && category_id !== "") params.category_id = category_id
        const resolvedCity = String(city ?? getStoredCityParam() ?? "").trim()
        if (resolvedCity) params.city = resolvedCity
        return Api.get(GET_ITEM, {
            params,
            headers: { Accept: "application/json" },
        })
    },
}

/** Homepage banner search suggestion API (URL-ready rows). */
export const bannerSuggestionApi = {
    getSuggestions: ({ search, category_id, limit = 12, city } = {}) => {
        const params = {}
        const q = String(search ?? "").trim()
        if (q) params.search = q
        if (category_id != null && category_id !== "") params.category_id = category_id
        if (limit != null && String(limit).trim() !== "") params.limit = limit
        const cityName = String(city ?? "").trim()
        if (cityName) params.city = cityName
        return Api.get(SEARCH_BANNER_SUGGESTION, {
            params,
            headers: { Accept: "application/json" },
        })
    },
}

// carModelsApi
export const carModelsApi = {
    getCarModels: ({ search } = {}) => {
        const params = {}
        const query = String(search ?? "").trim()
        if (query) params.search = query
        return Api.get(GET_CAR_MODELS, {
            params,
            headers: { Accept: "application/json" },
        })
    },
}

// carEvaluationsApi
export const carEvaluationsApi = {
    createEvaluation: ({ user_id, user_name, user_number, user_email, car_name, car_make_id, car_model_id, car_trim_id, car_year, year } = {}) => {
        const formData = new FormData()
        if (user_id) formData.append('user_id', user_id)
        if (user_name) formData.append('user_name', user_name)
        if (user_number) formData.append('user_number', user_number)
        if (user_email) formData.append('user_email', user_email)
        if (car_name) formData.append('car_name', car_name)
        if (car_make_id != null && car_make_id !== '') formData.append('car_make_id', car_make_id)
        if (car_model_id != null && car_model_id !== '') formData.append('car_model_id', car_model_id)
        if (car_trim_id != null && car_trim_id !== '') formData.append('car_trim_id', car_trim_id)
        const resolvedCarYear = car_year ?? year
        if (resolvedCarYear != null && resolvedCarYear !== '') formData.append('car_year', resolvedCarYear)

        return Api.post(CAR_EVALUATIONS, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },
}

// carFinanceApi
export const carFinanceApi = {
    createFinance: ({ user_id, user_name, user_number, user_email, car_name, car_make_id, car_model_id, car_trim_id, car_year, year } = {}) => {
        const formData = new FormData()
        if (user_id) formData.append('user_id', user_id)
        if (user_name) formData.append('user_name', user_name)
        if (user_number) formData.append('user_number', user_number)
        if (user_email) formData.append('user_email', user_email)
        if (car_name) formData.append('car_name', car_name)
        if (car_make_id != null && car_make_id !== '') formData.append('car_make_id', car_make_id)
        if (car_model_id != null && car_model_id !== '') formData.append('car_model_id', car_model_id)
        if (car_trim_id != null && car_trim_id !== '') formData.append('car_trim_id', car_trim_id)
        const resolvedCarYear = car_year ?? year
        if (resolvedCarYear != null && resolvedCarYear !== '') formData.append('car_year', resolvedCarYear)

        return Api.post(CAR_FINANCE, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },
}

// PACKAGE API


export const getPackageApi = {
    getPackage: ({ type } = {}) => {
        return Api.get(GET_PACKAGE, {
            params: {
                type
            }
        });
    },
}

// BLOGS API 
export const getBlogsApi = {
    getBlogs: ({
        slug, category_id, sort_by, tag
    } = {}) => {
        return Api.get(GET_BLOGS, {
            params: {
                slug,
                category_id,
                sort_by,
                tag
            }
        });
    },
}
// BLOGS API 
export const getBlogTagsApi = {
    getBlogs: ({

    } = {}) => {
        return Api.get(GET_BLOG_TAGS, {
            params: {

            }
        });
    },
}
export const getMyReviewsApi = {
    getMyReviews: ({ page } = {}) => {
        return Api.get(MY_REVIEWS, {
            params: {
                page
            }
        });
    },
}

// 5. GET_FEATURED_SECTION
export const FeaturedSectionApi = {
    getFeaturedSections: ({
        city, state, country, slug, category_id, filter
    } = {}) => {
        const resolvedCity = String(city ?? getStoredCityParam() ?? "").trim()
        return Api.get(GET_FEATURED_SECTION, {
            params: {
                city: resolvedCity || undefined,
                state,
                country,
                slug,
                category_id,
                filter,
            }
        })
    }
}

export const getHomeCategoriesApi = {
    getHomeCategories: () => {
        return Api.get(GET_HOME_CATEGORIES, {
            params: {}
        })
    },
}

export const getPopularCategoriesApi = {
    getPopularCategories: () => {
        return Api.get(GET_POPULAR_CATEGORIES, {
            params: {}
        })
    },
}

export const getPopularJobApi = {
    getPopularJob: ({ category_id, city, user_id } = {}) => {
        const resolvedCity = String(city ?? getStoredCityParam() ?? "").trim()
        const resolvedUserId = String(user_id ?? '').trim()
        return Api.get(GET_POPULAR_JOB, {
            params: {
                category_id,
                city: resolvedCity || undefined,
                user_id: resolvedUserId || undefined,
            },
        })
    },
}
// FAQ API

export const getFaqApi = {
    getFaq: () => {
        return Api.get(GET_FAQ, {
            params: {
            }
        });
    },
}


// COUNTRY API 

export const getCoutriesApi = {
    getCoutries: ({ search, page } = {}) => {
        return Api.get(GET_COUNTRIES, {
            params: {
                search, page
            }
        })
    }
}

// STATES API 

export const getStatesApi = {
    getStates: ({ country_id, search, page } = {}) => {
        return Api.get(GET_STATES, {
            params: {
                country_id,
                search,
                page
            }
        })
    }
}

// CITIES API 

export const getCitiesApi = {
    getCities: ({ state_id, search, page } = {}) => {
        return Api.get(GET_CITIES, {
            params: {
                state_id,
                search,
                page
            }
        })
    }
}
export const getAreasApi = {
    getAreas: ({ city_id, search, page } = {}) => {
        return Api.get(GET_AREA, {
            params: {
                city_id,
                search,
                page
            }
        })
    }
}
export const getBuildingsApi = {
    getBuildings: ({ area_id, city_id, search, page } = {}) => {
        return Api.get(GET_BUILDINGS, {
            params: {
                area_id,
                city_id,
                search,
                page
            }
        })
    }
}

// language api 


export const getLanguageApi = {
    getLanguage: ({
        language_code, type
    } = {}) => {
        return Api.get(GET_LANGUAGE, {
            params: {
                language_code, type
            }
        })
    }
}


export const userSignUpApi = {
    userSignup: ({ name, email, mobile, fcm_id, firebase_id, type, profile, country_code, registration, device_name } = {}) => {
        const formData = new FormData();

        // Append only if the value is defined and not an empty string
        if (name) formData.append('name', name);
        if (email) formData.append('email', email);
        if (mobile) formData.append('mobile', mobile);
        if (fcm_id) formData.append('fcm_id', fcm_id);
        if (firebase_id) formData.append('firebase_id', firebase_id);
        if (type) formData.append('type', type);

        // Assuming `profile` is a file object. If it's a URL or other type, handle accordingly.
        if (profile) {
            formData.append('profile', profile);
        }
        if (country_code) formData.append('country_code', country_code);
        if (registration) formData.append('registration', registration);
        if (device_name) formData.append('device_name', device_name);

        return Api.post(USER_SIGNUP, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
}



export const sendVerificationReqApi = {
    sendVerificationReq: ({ Details } = {}) => {
        const formData = new FormData();

        if (Details && typeof Details === 'object') {
            Object.entries(Details).forEach(([id, value]) => {
                if (value instanceof File || value instanceof Blob) {
                    // If the value is a file, append it with the proper key
                    formData.append(`verification_field_files[${id}]`, value);
                } else {
                    // If value is not a file, append it normally
                    formData.append(`verification_field[${id}]`, value);
                }
            });
        }

        return Api.post(SEND_VERIFICATION_REQUEST, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
}

export const verifiedBusinessApi = {
    getStatus: () => {
        return Api.get(GET_VERIFIED_BUSINESS_STATUS, jsonApiGetConfig)
    },
    sendRequest: ({ email, has_trade_license, mobile_number, subject, description, attachments } = {}) => {
        const formData = new FormData()
        if (email) formData.append('email', email)
        formData.append('has_trade_license', has_trade_license ? '1' : '0')
        if (mobile_number) formData.append('mobile_number', mobile_number)
        if (subject) formData.append('subject', subject)
        if (description) formData.append('description', description)
        if (Array.isArray(attachments)) {
            attachments.forEach((file) => {
                if (file instanceof File || file instanceof Blob) {
                    formData.append('attachments[]', file)
                }
            })
        }
        return Api.post(SEND_VERIFIED_BUSINESS_REQUEST, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    },
}
export const updateProfileApi = {
    updateProfile: ({ name, email, mobile, fcm_id, address, profile, notification, show_personal_details } = {}) => {
        const formData = new FormData();

        // Append only if the value is defined and not an empty string
        if (name) formData.append('name', name);
        if (email) formData.append('email', email);
        if (mobile) formData.append('mobile', mobile);
        if (fcm_id) formData.append('fcm_id', fcm_id);
        if (address) formData.append('address', address);


        // Assuming `profile` is a file object. If it's a URL or other type, handle accordingly.
        if (profile) {
            formData.append('profile', profile);
        }
        formData.append('notification', notification);
        formData.append('show_personal_details', show_personal_details);

        return Api.post(UPDATE_PROFILE, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
}

// GET NOTIFICATION API 

export const getNotificationList = {
    getNotification: ({ page } = {}) => {
        return Api.get(GET_NOTIFICATION_LIST, {
            params: {
                page: page
            }
        })
    }
}

// ASSIGN FREE PACKAGE 
export const assigFreePackageApi = {
    assignFreePackage: ({ package_id } = {}) => {
        const formData = new FormData();

        // Append only if the value is defined and not an empty string
        if (package_id) formData.append('package_id', package_id);

        return Api.post(ASSIGN_FREE_PACKAGE, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
}

export const addItemReviewApi = {
    addItemReview: ({ review, ratings, item_id } = {}) => {
        const formData = new FormData();

        // Append only if the value is defined and not an empty string
        if (review) formData.append('review', review);
        if (ratings) formData.append('ratings', ratings);
        if (item_id) formData.append('item_id', item_id);

        return Api.post(AD_ITEM_REVIEW, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
}
export const renewItemApi = {
    renewItem: ({ item_id, package_id } = {}) => {
        const formData = new FormData();

        // Append only if the value is defined and not an empty string
        if (item_id) formData.append('item_id', item_id);
        if (package_id) formData.append('package_id', package_id);


        return Api.post(RENEW_ITEM, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
}

// DELETE ITEM API 

export const deleteItemApi = {
    deleteItem: ({ id } = {}) => {
        const formData = new FormData();

        // Append only if the value is defined and not an empty string
        if (id) formData.append('id', id);

        return Api.post(DELETE_ITEM, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
}

export const chanegItemStatusApi = {
    changeItemStatus: ({ item_id, status, sold_to } = {}) => {
        const formData = new FormData();

        // Append only if the value is defined and not an empty string
        if (item_id) formData.append('item_id', item_id);
        if (status) formData.append('status', status);
        if (sold_to) formData.append('sold_to', sold_to);

        return Api.post(UPDATE_ITEM_STATUS, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
}
export const createFeaturedItemApi = {
    createFeaturedItem: ({ item_id, positions } = {}) => {
        const formData = new FormData();

        // Append only if the value is defined and not an empty string
        if (item_id) formData.append('item_id', item_id);
        if (positions) formData.append('positions', positions);

        return Api.post(CREATE_FEATURED_ITEM, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
}
// getPackageSettingsApi
export const getPackageSettingsApi = {
    getPackageSettings: () => {
        return Api.get(GET_PAYMENT_SETTINGS, {
            params: {
            }
        })
    },
}
// createPaymentIntentApi
export const createPaymentIntentApi = {
    createIntent: ({ package_id, basePackageRecordId, selectedAddonPackageIds, item_id, payment_method, platform_type } = {}) => {
        const formData = new FormData();

        // Append only if the value is defined and not an empty string
        if (package_id) formData.append('package_id', package_id);
        if (basePackageRecordId) formData.append('basePackageRecordId', basePackageRecordId);
        if (Array.isArray(selectedAddonPackageIds) && selectedAddonPackageIds.length > 0) {
            formData.append('selectedAddonPackageIds', JSON.stringify(selectedAddonPackageIds));
        }
        if (item_id) formData.append('item_id', item_id);
        if (payment_method) formData.append('payment_method', payment_method);
        if (platform_type) formData.append('platform_type', platform_type);

        return Api.post(PAYMENT_INTENT, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    confirmIntent: ({ payment_intent_id, item_id } = {}) => {
        const formData = new FormData();
        if (payment_intent_id) formData.append('payment_intent_id', payment_intent_id);
        if (item_id) formData.append('item_id', item_id);

        return Api.post(CONFIRM_PAYMENT_INTENT, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
}
// deleteUserApi
export const deleteUserApi = {
    deleteUser: () => {
        return Api.delete(DELETE_USER, {
            params: {
            }
        })
    },
}
// paymentTransactionApi
export const paymentTransactionApi = {
    transaction: () => {
        return Api.get(PAYMENT_TRANSACTIONS, {
            params: {
            }
        })
    },
}

// carInspectionApi
export const carInspectionApi = {
    createInspection: ({ user_id, user_number, seller_number, package_id, price, email, payment_type, payment_status } = {}) => {
        const formData = new FormData()
        if (user_id) formData.append('user_id', user_id)
        if (user_number) formData.append('user_number', user_number)
        if (seller_number) formData.append('seller_number', seller_number)
        if (package_id) formData.append('package_id', package_id)
        if (price) formData.append('price', price)
        if (email) formData.append('email', email)
        if (payment_type) formData.append('payment_type', payment_type)
        if (payment_status) formData.append('payment_status', payment_status)

        return Api.post(CAR_INSPECTION, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },
    getInspection: ({ user_id } = {}) => {
        const formData = new FormData()
        if (user_id) formData.append('user_id', user_id)
        return Api.post(GET_CAR_INSPECTION, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },
}

// custom field api 

export const getCustomFieldsApi = {
    getCustomFields: ({ category_ids } = {}) => {
        return Api.get(GET_CUSTOM_FIELDS, {
            params: {
                category_ids
            }
        })
    },
    /** Place Your Ad: custom fields for a single leaf category. */
    getCustomFieldsByCategoryId: ({ category_id } = {}) => {
        return Api.get(GET_CUSTOM_FIELDS_BY_CATEGORY_ID, {
            params: { category_id },
            headers: { Accept: "application/json" },
        })
    },
}

/** Place Your Ad — job branch: options for `dropdown_api` + job_roles marker. */
export const jobRolesApi = {
    getByCategorySlug: ({ category_slug } = {}) => {
        return Api.get(GET_JOB_ROLES, {
            params: { category_slug },
            headers: { Accept: 'application/json' },
        })
    },
}

/** Place Your Ad — classifieds: options for `dropdown_api` + category-subdata marker. */
export const categorySubdataApi = {
    getByCategoryId: ({ category_id } = {}) => {
        return Api.get(GET_CATEGORY_SUBDATA, {
            params: { category_id },
            headers: { Accept: 'application/json' },
        })
    },
    getItemCountsByCategoryId: ({ category_id, category_slug } = {}) => {
        return Api.get(GET_CATEGORY_SUBDATA_ITEM_COUNT, {
            params: { category_id, category_slug },
            headers: { Accept: 'application/json' },
        })
    },
}

export const tipsApi = {
    tips: ({ } = {}) => {
        return Api.get(TIPS, {
            params: {

            }
        })
    },
}

export const itemOfferApi = {
    offer: ({ item_id, amount } = {}) => {
        const formData = new FormData();

        // Append only if the value is defined and not an empty string
        if (item_id) formData.append('item_id', item_id);
        if (amount) formData.append('amount', amount);

        return Api.post(ITEM_OFFER, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
}


export const chatListApi = {
    chatList: ({ type, page } = {}) => {
        return Api.get(CHAT_LIST, {
            params: {
                type,
                page
            }
        })
    },
}


export const getMessagesApi = {
    chatMessages: ({ item_offer_id, page } = {}) => {
        return Api.get(CHAT_MESSAGES, {
            params: {
                item_offer_id,
                page
            }
        })
    },
}
// add item api 

export const addItemApi = {
    addItem: ({ name, slug, description, category_id, all_category_ids, price, contact, video_link, tour_360_link, custom_fields, image, gallery_images = [], address, latitude, longitude, custom_field_files = [], show_only_to_premium, hide_phone_number, country, state, city, area, area_id, building, building_id, car_make, car_model, car_trim, unit_types } = {}) => {
        const formData = new FormData();
        // Append only if the value is defined and not an empty string

        if (name) formData.append('name', name);
        if (slug) formData.append('slug', slug);
        if (description) formData.append('description', description);
        if (category_id) formData.append('category_id', category_id);
        if (all_category_ids) formData.append('all_category_ids', all_category_ids);
        if (car_make !== undefined && car_make !== null && String(car_make).trim() !== '') formData.append('car_make', String(car_make).trim());
        if (car_model !== undefined && car_model !== null && String(car_model).trim() !== '') formData.append('car_model', String(car_model).trim());
        if (car_trim !== undefined && car_trim !== null && String(car_trim).trim() !== '') formData.append('car_trim', String(car_trim).trim());
        if (price) formData.append('price', price);
        if (contact) formData.append('contact', contact);
        if (video_link) formData.append('video_link', video_link);
        if (tour_360_link) formData.append('tour_360_link', tour_360_link);

        if (custom_fields) formData.append('custom_fields', JSON.stringify(custom_fields));

        if (image) formData.append('image', image);
        if (gallery_images.length > 0) {
            gallery_images.forEach((gallery_image, index) => {
                formData.append(`gallery_images[${index}]`, gallery_image);
            });
        }
        if (address) formData.append('address', address);
        if (latitude) formData.append('latitude', latitude);
        if (longitude) formData.append('longitude', longitude);

        // Append custom field files
        custom_field_files.forEach(({ key, files }) => {
            if (Array.isArray(files)) {
                files.forEach((file, index) => formData.append(`custom_field_files[${key}]`, file));
            } else {
                formData.append(`custom_field_files[${key}]`, files);
            }
        });

        if (show_only_to_premium) formData.append('show_only_to_premium', show_only_to_premium);
        if (hide_phone_number !== undefined && hide_phone_number !== null) {
            formData.append('hide_phone_number', hide_phone_number ? 'true' : 'false');
        }
        if (country) formData.append('country', country);
        if (state) formData.append('state', state);
        if (city) formData.append('city', city);
        if (area) formData.append('area', area);
        if (area_id) formData.append('area_id', area_id);
        if (building) formData.append('building', building);
        if (building_id) formData.append('building_id', building_id);

        if (Array.isArray(unit_types) && unit_types.length > 0) {
            unit_types.forEach((ut, i) => {
                const typeVal = ut?.type != null ? String(ut.type) : ''
                formData.append(`unit_types[${i}][type]`, typeVal)
                const plans = Array.isArray(ut?.plans) ? ut.plans : []
                plans.forEach((plan, j) => {
                    formData.append(`unit_types[${i}][plans][${j}][category]`, plan?.category != null ? String(plan.category) : '')
                    formData.append(`unit_types[${i}][plans][${j}][layout_type]`, plan?.layout_type != null ? String(plan.layout_type).trim() : '')
                    formData.append(`unit_types[${i}][plans][${j}][size_sqft]`, plan?.size_sqft != null ? String(plan.size_sqft).trim() : '')
                    formData.append(
                        `unit_types[${i}][plans][${j}][price]`,
                        plan?.price !== '' && plan?.price != null ? String(plan.price) : ''
                    )
                    if (plan?.floor_plan instanceof File) {
                        formData.append(`unit_types[${i}][plans][${j}][floor_plan]`, plan.floor_plan)
                    } else if (typeof plan?.floor_plan === 'string' && plan.floor_plan.trim() !== '') {
                        formData.append(`unit_types[${i}][plans][${j}][floor_plan]`, plan.floor_plan.trim())
                    }
                })
            })
        }

        return Api.post(ADD_ITEM, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
}


// Edit item API
export const editItemApi = {
    editItem: ({ id, name, slug, description, category_id, all_category_ids, price, contact, video_link, tour_360_link, custom_fields, image, gallery_images = [], address, latitude, longitude, custom_field_files = [], show_only_to_premium, hide_phone_number, country, state, city, area, area_id, building, building_id, delete_item_image_id, unit_types } = {}) => {
        const formData = new FormData();
        // Append only if the value is defined and not an empty string
        if (id) formData.append('id', id)
        if (name) formData.append('name', name);
        if (slug) formData.append('slug', slug);
        if (description) formData.append('description', description);
        if (category_id) formData.append('category_id', category_id);
        if (all_category_ids) formData.append('all_category_ids', all_category_ids);
        if (price) formData.append('price', price);
        if (delete_item_image_id) formData.append('delete_item_image_id', delete_item_image_id)
        if (contact) formData.append('contact', contact);
        if (video_link) formData.append('video_link', video_link);
        if (tour_360_link) formData.append('tour_360_link', tour_360_link);
        if (latitude) formData.append('latitude', latitude);
        if (longitude) formData.append('longitude', longitude);
        if (custom_fields) formData.append('custom_fields', JSON.stringify(custom_fields));
        if (address) formData.append('address', address);
        if (contact) formData.append('contact', contact);
        if (country) formData.append('country', country);
        if (state) formData.append('state', state);
        // if (custom_field_files) formData.append("custom_field_files", custom_field_files)
        if (city) formData.append('city', city);
        if (area) formData.append('area', area);
        if (area_id) formData.append('area_id', area_id);
        if (building) formData.append('building', building);
        if (building_id) formData.append('building_id', building_id);
        if (hide_phone_number !== undefined && hide_phone_number !== null) {
            formData.append('hide_phone_number', hide_phone_number ? 'true' : 'false');
        }
        if (image != null) formData.append('image', image);
        if (gallery_images.length > 0) {
            gallery_images.forEach((gallery_image, index) => {
                formData.append(`gallery_images[${index}]`, gallery_image);
            });
        }
        custom_field_files.forEach(({ key, files }) => {
            if (Array.isArray(files)) {
                files.forEach((file, index) => formData.append(`custom_field_files[${key}]`, file));
            } else {
                formData.append(`custom_field_files[${key}]`, files);
            }
        });

        if (Array.isArray(unit_types) && unit_types.length > 0) {
            unit_types.forEach((ut, i) => {
                const typeVal = ut?.type != null ? String(ut.type) : ''
                formData.append(`unit_types[${i}][type]`, typeVal)
                const plans = Array.isArray(ut?.plans) ? ut.plans : []
                plans.forEach((plan, j) => {
                    formData.append(`unit_types[${i}][plans][${j}][category]`, plan?.category != null ? String(plan.category) : '')
                    formData.append(`unit_types[${i}][plans][${j}][layout_type]`, plan?.layout_type != null ? String(plan.layout_type).trim() : '')
                    formData.append(`unit_types[${i}][plans][${j}][size_sqft]`, plan?.size_sqft != null ? String(plan.size_sqft).trim() : '')
                    formData.append(
                        `unit_types[${i}][plans][${j}][price]`,
                        plan?.price !== '' && plan?.price != null ? String(plan.price) : ''
                    )
                    if (plan?.floor_plan instanceof File) {
                        formData.append(`unit_types[${i}][plans][${j}][floor_plan]`, plan.floor_plan)
                    } else if (typeof plan?.floor_plan === 'string' && plan.floor_plan.trim() !== '') {
                        formData.append(`unit_types[${i}][plans][${j}][floor_plan]`, plan.floor_plan.trim())
                    }
                })
            })
        }
        return Api.post(UPDATE_LISTING, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
}




export const sendMessageApi = {
    sendMessage: ({ item_offer_id, message, file, audio } = {}) => {
        const formData = new FormData();

        // Append only if the value is defined; allow empty string for message so file-only works
        if (item_offer_id) formData.append('item_offer_id', item_offer_id);
        if (message !== undefined) formData.append('message', message);
        if (file) formData.append('file', file);
        if (audio) formData.append('audio', audio);

        return Api.post(SEND_MESSAGE, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
}

// favorite API
export const manageFavouriteApi = {
    manageFavouriteApi: ({ item_id, favouritelisting_id } = {}) => {
        const formData = new FormData();

        // Append only if the value is defined and not an empty string
        if (item_id) formData.append('item_id', item_id);
        if (favouritelisting_id !== undefined && favouritelisting_id !== null && favouritelisting_id !== '') {
            formData.append('favouritelisting_id', favouritelisting_id);
        }

        return Api.post(MANAGE_FAVOURITE, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
}

export const getFavouriteApi = {
    getFavouriteApi: ({ page, favouritelisting_id } = {}) => {
        const params = { page }
        if (favouritelisting_id !== undefined && favouritelisting_id !== null && favouritelisting_id !== '') {
            params.favouritelisting_id = favouritelisting_id
        }
        return Api.get(GET_FAVOURITE_ITEMS, {
            params,
            headers: {
                Accept: 'application/json'
            }
        })
    }
}

export const getFavouriteListingApi = {
    getFavouriteListing: ({ user_id } = {}) => {
        const formData = new FormData()
        if (user_id) formData.append('user_id', user_id)

        return Api.post(GET_FAVOURITE_LISTING, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    }
}

export const createFavouriteListingApi = {
    createFavouriteListing: ({ user_id, listing_id, listing_name, type } = {}) => {
        const formData = new FormData()
        if (user_id) formData.append('user_id', user_id)
        if (listing_id) formData.append('listing_id', listing_id)
        if (listing_name) formData.append('listing_name', listing_name)
        if (type) formData.append('type', type)

        return Api.post(CREATE_FAVOURITE_LISTING, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    }
}

export const savedSearchApi = {
    getSavedSearches: ({ page } = {}) => {
        return Api.get(GET_SAVED_SEARCHES, {
            params: {
                page
            }
        })
    },
    // search_url = site path + query; api_search_url = get-item path + query only (no origin).
    createSavedSearch: ({
        title,
        category_slug,
        search_url,
        api_search_url,
        subscribe_email,
        notification,
        location,
    } = {}) => {
        const formData = new FormData()
        if (title) formData.append('title', title)
        if (category_slug) formData.append('category_slug', category_slug)
        if (search_url) formData.append('search_url', search_url)
        if (api_search_url) formData.append('api_search_url', api_search_url)
        if (typeof subscribe_email === 'boolean') {
            formData.append('subscribe_email', subscribe_email ? '1' : '0')
        }
        if (typeof notification === 'boolean') {
            formData.append('notification', notification ? '1' : '0')
        }
        if (location) formData.append('location', location)

        return Api.post(GET_SAVED_SEARCHES, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },
    editSavedSearch: ({ id, title } = {}) => {
        const formData = new FormData()
        if (id) formData.append('id', id)
        if (title) formData.append('title', title)
        return Api.post(EDIT_SAVED_SEARCH, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },
    deleteSavedSearch: ({ id } = {}) => {
        const formData = new FormData()
        if (id) formData.append('id', id)
        return Api.post(DELETE_SAVED_SEARCH, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    }
}


export const getReportReasonsApi = {
    reportReasons: ({ } = {}) => {
        return Api.get(GET_REPORT_REASONS, {
            params: {}
        })
    },
}




export const addReportReasonApi = {
    addReport: ({ item_id, report_reason_id, other_message } = {}) => {
        const formData = new FormData();

        // Append only if the value is defined and not an empty string
        if (item_id) formData.append('item_id', item_id);
        if (report_reason_id) formData.append('report_reason_id', report_reason_id);
        if (other_message) formData.append('other_message', other_message);

        return Api.post(ADD_REPORT, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
}

export const adReportApi = {
    addReport: ({ user_id, item_id, report_type, report_text, spam_type } = {}) => {
        const formData = new FormData()
        if (user_id != null && user_id !== '') formData.append('user_id', String(user_id))
        if (item_id != null && item_id !== '') formData.append('item_id', String(item_id))
        if (report_type) formData.append('report_type', String(report_type))
        if (report_text) formData.append('report_text', String(report_text))
        if (spam_type) formData.append('spam_type', String(spam_type))

        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.post(AD_REPORT, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const addJobApplicationInfoApi = {
    addJobApplicationInfo: ({
        item_id,
        user_id,
        full_name,
        email_id,
        nationality,
        phone_no,
        gender,
        visa_status,
        education_level,
        total_experience,
        currentlt_locate,
        job_status,
        job_category,
        current_company,
        current_position,
        industry,
        notice_period,
        resume,
    } = {}) => {
        const formData = new FormData()
        if (item_id != null && item_id !== '') formData.append('item_id', String(item_id))
        if (user_id != null && user_id !== '') formData.append('user_id', String(user_id))
        if (full_name != null && full_name !== '') formData.append('full_name', String(full_name))
        if (email_id != null && email_id !== '') formData.append('email_id', String(email_id))
        if (nationality != null && nationality !== '') formData.append('nationality', String(nationality))
        if (phone_no != null && phone_no !== '') formData.append('phone_no', String(phone_no))
        if (gender != null && gender !== '') formData.append('gender', String(gender))
        if (visa_status != null && visa_status !== '') formData.append('visa_status', String(visa_status))
        if (education_level != null && education_level !== '') formData.append('education_level', String(education_level))
        if (total_experience != null && total_experience !== '') formData.append('total_experience', String(total_experience))
        if (currentlt_locate != null && currentlt_locate !== '') formData.append('currentlt_locate', String(currentlt_locate))
        if (job_status != null && job_status !== '') formData.append('job_status', String(job_status))
        if (job_category != null && job_category !== '') formData.append('job_category', String(job_category))
        if (current_company != null && current_company !== '') formData.append('current_company', String(current_company))
        if (current_position != null && current_position !== '') formData.append('current_position', String(current_position))
        if (industry != null && industry !== '') formData.append('industry', String(industry))
        if (notice_period != null && notice_period !== '') formData.append('notice_period', String(notice_period))
        if (resume) formData.append('resume', resume)

        return Api.post(ADD_JOB_APPLICATION_INFO, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    },
}

export const getJobApplicationInfoApi = {
    getJobApplicationInfo: ({ user_id } = {}) => {
        const formData = new FormData()
        if (user_id != null && user_id !== '') formData.append('user_id', String(user_id))

        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.post(GET_JOB_APPLICATION_INFO, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const getApplyInfoApi = {
    getApplyInfo: ({ user_id, item_id } = {}) => {
        const formData = new FormData()
        if (user_id != null && user_id !== '') formData.append('user_id', String(user_id))
        if (item_id != null && item_id !== '') formData.append('item_id', String(item_id))

        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.post(GET_APPLY_INFO, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const getMyJobApplicationApi = {
    getMyJobApplication: ({ user_id } = {}) => {
        const formData = new FormData()
        if (user_id != null && user_id !== '') formData.append('user_id', String(user_id))

        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.post(GET_MY_JOB_APPLICATION, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const getUserDetailApi = {
    getUserDetail: ({ user_id } = {}) => {
        const formData = new FormData()
        if (user_id != null && user_id !== '') formData.append('user_id', String(user_id))

        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.post(GET_USER_DETAIL, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const userRejectionRuleApi = {
    getUserRejectionRule: ({ user_id } = {}) => {
        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''
        const params = {}
        if (user_id != null && user_id !== '') params.user_id = String(user_id)

        return Api.get(GET_USER_REJECTION_RULE, {
            params,
            headers: {
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
    saveUserRejectionRule: ({
        user_id,
        local_candidate,
        screening_question,
        experience,
        minimum_education,
        gender,
        nationality,
    } = {}) => {
        const formData = new FormData()
        if (user_id != null && user_id !== '') formData.append('user_id', String(user_id))
        if (local_candidate != null) formData.append('local_candidate', String(local_candidate))
        if (screening_question != null) formData.append('screening_question', String(screening_question))
        if (experience != null) formData.append('experience', String(experience))
        if (minimum_education != null) formData.append('minimum_education', String(minimum_education))
        if (gender != null) formData.append('gender', String(gender))
        if (nationality != null) formData.append('nationality', String(nationality))

        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.post(USER_REJECTION_RULE, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const jobDashboardProfileApi = {
    getJobDashboardProfile: ({ user_id, type = 'personal' } = {}) => {
        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        const params = {}
        if (user_id != null && user_id !== '') params.user_id = String(user_id)
        if (type != null && type !== '') params.type = String(type)

        return Api.get(GET_JOB_DASHBOARD_PROFILE, {
            params,
            headers: {
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
    addPersonalProfile: ({ user_id, personal_name, personal_email, personal_number, city } = {}) => {
        const formData = new FormData()
        if (user_id != null && user_id !== '') formData.append('user_id', String(user_id))
        if (personal_name != null) formData.append('personal_name', String(personal_name))
        if (personal_email != null) formData.append('personal_email', String(personal_email))
        if (personal_number != null) formData.append('personal_number', String(personal_number))
        if (city != null) formData.append('city', String(city))

        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.post(ADD_PERSONAL_PROFILE, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
    addCompanyProfile: ({
        user_id,
        company_name,
        company_type,
        company_logo,
        city,
        industry,
        license_no,
        company_size,
        description,
        contact_name,
        phone_number,
        website,
        youtube,
        email,
        facebook,
        twitter,
        linkedin,
        instagram,
    } = {}) => {
        const formData = new FormData()
        if (user_id != null && user_id !== '') formData.append('user_id', String(user_id))
        if (company_name != null) formData.append('company_name', String(company_name))
        if (company_type != null) formData.append('company_type', String(company_type))
        if (company_logo != null) formData.append('company_logo', company_logo)
        if (city != null) formData.append('city', String(city))
        if (industry != null) formData.append('industry', String(industry))
        if (license_no != null) formData.append('license_no', String(license_no))
        if (company_size != null) formData.append('company_size', String(company_size))
        if (description != null) formData.append('description', String(description))
        if (contact_name != null) formData.append('contact_name', String(contact_name))
        if (phone_number != null) formData.append('phone_number', String(phone_number))
        if (website != null) formData.append('website', String(website))
        if (youtube != null) formData.append('youtube', String(youtube))
        if (email != null) formData.append('email', String(email))
        if (facebook != null) formData.append('facebook', String(facebook))
        if (twitter != null) formData.append('twitter', String(twitter))
        if (linkedin != null) formData.append('linkedin', String(linkedin))
        if (instagram != null) formData.append('instagram', String(instagram))

        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.post(ADD_COMPANY_PROFILE, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const candidateDetailsApi = {
    getCandidateDetails: ({ user_id, offset, limit } = {}) => {
        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        const params = {}
        if (user_id != null && user_id !== '') params.user_id = String(user_id)
        if (offset != null && offset !== '') params.offset = String(offset)
        if (limit != null && limit !== '') params.limit = String(limit)

        return Api.get(GET_CANDIDATE_DETAILS, {
            params,
            headers: {
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const savedCandidateDetailsApi = {
    savedCandidateDetails: ({ user_id, job_info_id, item_id, type } = {}) => {
        const formData = new FormData()
        if (user_id != null && user_id !== '') formData.append('user_id', String(user_id))
        if (job_info_id != null && job_info_id !== '') formData.append('job_info_id', String(job_info_id))
        if (item_id != null && item_id !== '') formData.append('item_id', String(item_id))
        if (type != null && type !== '') formData.append('type', String(type))

        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.post(SAVED_CANDIDATE_DETAILS, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const getSavedCandidateDetailsApi = {
    getSavedCandidateDetails: ({ user_id, offset, limit, include_listing_saves } = {}) => {
        const formData = new FormData()
        if (user_id != null && user_id !== '') formData.append('user_id', String(user_id))
        if (offset != null && offset !== '') formData.append('offset', String(offset))
        if (limit != null && limit !== '') formData.append('limit', String(limit))
        if (include_listing_saves) formData.append('include_listing_saves', '1')

        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.post(GET_SAVED_CANDIDATE_DETAILS, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const getUnsavedCandidateDetailsApi = {
    getUnsavedCandidateDetails: ({ user_id, offset, limit } = {}) => {
        const formData = new FormData()
        if (user_id != null && user_id !== '') formData.append('user_id', String(user_id))
        if (offset != null && offset !== '') formData.append('offset', String(offset))
        if (limit != null && limit !== '') formData.append('limit', String(limit))

        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.post(GET_UNSAVED_CANDIDATE_DETAILS, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const candidateNameApi = {
    getCandidateName: ({ search } = {}) => {
        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        const params = {}
        if (search != null && String(search).trim() !== '') params.search = String(search).trim()

        return Api.get(GET_CANDIDATE_NAME, {
            params,
            headers: {
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const savedCandidateNameApi = {
    savedCandidateName: ({ user_id, job_info_id, full_name, type, saved_search_id } = {}) => {
        const formData = new FormData()
        if (user_id != null && user_id !== '') formData.append('user_id', String(user_id))
        if (job_info_id != null && job_info_id !== '') formData.append('job_info_id', String(job_info_id))
        if (full_name != null && full_name !== '') formData.append('full_name', String(full_name))
        if (type != null && type !== '') formData.append('type', String(type))
        if (saved_search_id != null && saved_search_id !== '') formData.append('saved_search_id', String(saved_search_id))

        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.post(SAVED_CANDIDATE_NAME, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const getSavedCandidateNameApi = {
    getSavedCandidateName: ({ user_id, filter } = {}) => {
        const formData = new FormData()
        if (user_id != null && user_id !== '') formData.append('user_id', String(user_id))
        if (filter != null && filter !== '') formData.append('filter', String(filter))

        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.post(GET_SAVED_CANDIDATE_NAME, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const getPublicProfileDataApi = {
    getPublicProfileData: ({ user_id } = {}) => {
        const formData = new FormData()
        if (user_id != null && user_id !== '') formData.append('user_id', String(user_id))

        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.post(GET_PUBLIC_PROFILE_DATA, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const getUserAddressApi = {
    getUserAddress: ({ user_id } = {}) => {
        const formData = new FormData()
        if (user_id != null && user_id !== '') formData.append('user_id', String(user_id))

        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.post(GET_USER_ADDRESS, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const userAddressChangesApi = {
    userAddressChanges: ({
        address_id,
        user_id,
        type,
        neighbourhood,
        street_name,
        apartment_number,
        label,
        default: isDefault,
        lat,
        lan,
    } = {}) => {
        const formData = new FormData()
        if (address_id != null && address_id !== '') formData.append('address_id', String(address_id))
        if (user_id != null && user_id !== '') formData.append('user_id', String(user_id))
        if (type != null && type !== '') formData.append('type', String(type))
        if (neighbourhood != null && neighbourhood !== '') formData.append('neighbourhood', String(neighbourhood))
        if (street_name != null && street_name !== '') formData.append('street_name', String(street_name))
        if (apartment_number != null && apartment_number !== '') formData.append('apartment_number', String(apartment_number))
        if (label != null && label !== '') formData.append('label', String(label))
        if (isDefault !== undefined && isDefault !== null) {
            formData.append('default', String(Number(isDefault) === 1 ? 1 : 0))
        }
        if (lat != null && lat !== '') formData.append('lat', String(lat))
        if (lan != null && lan !== '') formData.append('lan', String(lan))

        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.post(USER_ADDRESS_CHANGES, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const setUserPhoneNumberApi = {
    setUserPhoneNumber: ({ user_id, phone_number } = {}) => {
        const formData = new FormData()
        if (user_id != null && user_id !== '') formData.append('user_id', String(user_id))
        if (phone_number != null && phone_number !== '') formData.append('phone_number', String(phone_number))

        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.post(SET_USER_PHONENUMBER, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const getDevicesApi = {
    getDevices: () => {
        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.get(GET_DEVICES, {
            headers: {
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const logoutDeviceApi = {
    logoutDevice: ({ device_id } = {}) => {
        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.delete(`${LOGOUT_DEVICE}/${device_id}`, {
            headers: {
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const addUserDetailApi = {
    addUserDetail: ({
        user_id,
        name,
        last_name,
        email_id,
        mobile,
        date_of_birth,
        gender,
        language,
        nationality,
        profile,
        current_location,
        visa_status,
        career_level,
        desired_salary,
        degree,
        specialization,
        university_name,
        country,
        graduation_from,
        graduation_to,
        qualification_id,
        fresher,
        experience_id,
        experience_job_titel,
        experience_job_category,
        experience_industry,
        experience_company,
        experience_country,
        experience_job_description,
        experience_start_date,
        experience_end_date,
        currently_working,
        skills,
        job_status,
        profile_summary,
        resume,
        type,
        licenses_certificates_id,
        course_name,
        issuing_organization,
        user_portfolio_id,
        portfolio_name,
        portfolio_link,
        user_reference_id,
        reference_name,
        reference_company_name,
        reference_email,
    } = {}) => {
        const formData = new FormData()
        if (user_id != null && user_id !== '') formData.append('user_id', String(user_id))
        if (name != null && name !== '') formData.append('name', String(name))
        if (last_name != null && last_name !== '') formData.append('last_name', String(last_name))
        if (email_id != null && email_id !== '') formData.append('email_id', String(email_id))
        if (mobile != null && mobile !== '') formData.append('mobile', String(mobile))
        if (date_of_birth != null && date_of_birth !== '') formData.append('date_of_birth', String(date_of_birth))
        if (gender != null && gender !== '') formData.append('gender', String(gender))
        if (language != null && language !== '') formData.append('language', String(language))
        if (nationality != null && nationality !== '') formData.append('nationality', String(nationality))
        if (profile) formData.append('profile', profile)
        if (current_location != null && current_location !== '') formData.append('current_location', String(current_location))
        if (visa_status != null && visa_status !== '') formData.append('visa_status', String(visa_status))
        if (career_level != null && career_level !== '') formData.append('career_level', String(career_level))
        if (desired_salary != null && desired_salary !== '') formData.append('desired_salary', String(desired_salary))
        if (degree != null && degree !== '') formData.append('degree', String(degree))
        if (specialization != null && specialization !== '') formData.append('specialization', String(specialization))
        if (university_name != null && university_name !== '') formData.append('university_name', String(university_name))
        if (country != null && country !== '') formData.append('country', String(country))
        if (graduation_from != null && graduation_from !== '') formData.append('graduation_from', String(graduation_from))
        if (graduation_to != null && graduation_to !== '') formData.append('graduation_to', String(graduation_to))
        if (qualification_id != null && qualification_id !== '') formData.append('qualification_id', String(qualification_id))
        if (fresher != null && fresher !== '') formData.append('fresher', String(fresher))
        if (experience_id != null && experience_id !== '') formData.append('experience_id', String(experience_id))
        if (experience_job_titel != null && experience_job_titel !== '') formData.append('experience_job_titel', String(experience_job_titel))
        if (experience_job_category != null && experience_job_category !== '') formData.append('experience_job_category', String(experience_job_category))
        if (experience_industry != null && experience_industry !== '') formData.append('experience_industry', String(experience_industry))
        if (experience_company != null && experience_company !== '') formData.append('experience_company', String(experience_company))
        if (experience_country != null && experience_country !== '') formData.append('experience_country', String(experience_country))
        if (experience_job_description != null && experience_job_description !== '') formData.append('experience_job_description', String(experience_job_description))
        if (experience_start_date != null && experience_start_date !== '') formData.append('experience_start_date', String(experience_start_date))
        if (experience_end_date != null && experience_end_date !== '') formData.append('experience_end_date', String(experience_end_date))
        if (currently_working != null && currently_working !== '') formData.append('currently_working', String(currently_working))
        if (skills != null && skills !== '') formData.append('skills', String(skills))
        if (job_status != null && job_status !== '') formData.append('job_status', String(job_status))
        if (profile_summary != null && profile_summary !== '') formData.append('profile_summary', String(profile_summary))
        if (resume) formData.append('resume', resume)
        if (type != null && type !== '') formData.append('type', String(type))
        if (licenses_certificates_id != null && licenses_certificates_id !== '') formData.append('licenses_certificates_id', String(licenses_certificates_id))
        if (course_name != null && course_name !== '') formData.append('course_name', String(course_name))
        if (issuing_organization != null && issuing_organization !== '') formData.append('issuing_organization', String(issuing_organization))
        if (user_portfolio_id != null && user_portfolio_id !== '') formData.append('user_portfolio_id', String(user_portfolio_id))
        if (portfolio_name != null && portfolio_name !== '') formData.append('portfolio_name', String(portfolio_name))
        if (portfolio_link != null && portfolio_link !== '') formData.append('portfolio_link', String(portfolio_link))
        if (user_reference_id != null && user_reference_id !== '') formData.append('user_reference_id', String(user_reference_id))
        if (reference_name != null && reference_name !== '') formData.append('reference_name', String(reference_name))
        if (reference_company_name != null && reference_company_name !== '') formData.append('reference_company_name', String(reference_company_name))
        if (reference_email != null && reference_email !== '') formData.append('reference_email', String(reference_email))

        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.post(ADD_USER_DETAIL, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}
export const addReportReviewApi = {
    addReportReview: ({ seller_review_id, report_reason } = {}) => {
        const formData = new FormData();

        // Append only if the value is defined and not an empty string
        if (seller_review_id) formData.append('seller_review_id', seller_review_id);
        if (report_reason) formData.append('report_reason', report_reason);

        return Api.post(ADD_REPORT_REVIEW, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
}


export const blockUserApi = {
    blockUser: ({ blocked_user_id } = {}) => {
        const formData = new FormData();

        // Append only if the value is defined and not an empty string
        if (blocked_user_id) formData.append('blocked_user_id', blocked_user_id);

        return Api.post(BLOCK_USER, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
}
export const unBlockUserApi = {
    unBlockUser: ({ blocked_user_id } = {}) => {
        const formData = new FormData();

        // Append only if the value is defined and not an empty string
        if (blocked_user_id) formData.append('blocked_user_id', blocked_user_id);

        return Api.post(UNBLOCK_USER, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
}

export const getBlockedUsers = {
    blockedUsers: ({ } = {}) => {
        return Api.get(BLOCKED_USERS, {
            params: {}
        })
    },
}

export const contactUsApi = {
    contactUs: ({ name, email, subject, message } = {}) => {
        const formData = new FormData();
        // Append only if the value is defined and not an empty string
        if (name) formData.append('name', name);
        if (email) formData.append('email', email);
        if (subject) formData.append('subject', subject);
        if (message) formData.append('message', message);
        return Api.post(CONTACT_US, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
}

export const addHelpMeBuyApi = {
    addHelpMeBuy: ({ name, email, phone_no, service_type, message } = {}) => {
        const formData = new FormData()
        if (name != null && name !== '') formData.append('name', String(name))
        if (email != null && email !== '') formData.append('email', String(email))
        if (phone_no != null && phone_no !== '') formData.append('phone_no', String(phone_no))
        if (service_type != null && service_type !== '') formData.append('service_type', String(service_type))
        if (message != null && message !== '') formData.append('message', String(message))
        return Api.post(ADD_HELP_ME_BUY, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    },
}

export const itemInquiryApi = {
    sendItemInquiry: ({ item_id, name, email, phone, message, listing_url, reference_code } = {}) => {
        const formData = new FormData()
        if (item_id != null && item_id !== '') formData.append('item_id', String(item_id))
        if (name != null && name !== '') formData.append('name', String(name))
        if (email != null && email !== '') formData.append('email', String(email))
        if (phone != null && phone !== '') formData.append('phone', String(phone))
        if (message != null && message !== '') formData.append('message', String(message))
        if (listing_url != null && listing_url !== '') formData.append('listing_url', String(listing_url))
        if (reference_code != null && reference_code !== '') formData.append('reference_code', String(reference_code))

        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.post(SEND_ITEM_INQUIRY, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}
// get parent cate api
export const getParentCategoriesApi = {
    getPaymentCategories: ({ child_category_id, tree, slug } = {}) => {
        return Api.get(GET_PARENT_CATEGORIES, {
            params: {
                child_category_id,
                tree,
                slug
            }
        })
    },
}

export const getCarAppointmentDetailsApi = {
    getCarAppointmentDetails: ({ user_id } = {}) => {
        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        const params = {}
        if (user_id != null && user_id !== '') params.user_id = String(user_id)

        return Api.get(GET_CAR_APPOINTMENT_DETAILS, {
            params,
            headers: {
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const getFeaturedCompaniesApi = {
    getFeaturedCompanies: ({ user_id } = {}) => {
        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        const params = {}
        if (user_id != null && user_id !== '') params.user_id = String(user_id)

        return Api.get(GET_FEATURED_COMPANIES, {
            params,
            headers: {
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const companyBookmarkApi = {
    companyBookmark: ({ user_id, company_id } = {}) => {
        const formData = new FormData()
        if (user_id != null && user_id !== '') formData.append('user_id', String(user_id))
        if (company_id != null && company_id !== '') formData.append('company_id', String(company_id))

        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.post(COMPANY_BOOKMARK, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const getBookmarkCompaniesApi = {
    getBookmarkCompanies: ({ user_id } = {}) => {
        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        const params = {}
        if (user_id != null && user_id !== '') params.user_id = String(user_id)

        return Api.get(GET_BOOKMARK_COMPANIES, {
            params,
            headers: {
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}

export const deleteBookmarkCompaniesApi = {
    deleteBookmarkCompanies: ({ user_id, company_id, type } = {}) => {
        const formData = new FormData()
        if (user_id != null && user_id !== '') formData.append('user_id', String(user_id))
        const ids = Array.isArray(company_id)
            ? company_id
            : company_id != null && company_id !== ''
                ? [company_id]
                : []
        ids.forEach((id) => {
            if (id != null && id !== '') formData.append('company_id[]', String(id))
        })
        if (type != null && type !== '') formData.append('type', String(type))

        const token =
            store?.getState?.()?.UserSignup?.data?.token ||
            store?.getState?.()?.UserSignup?.data?.data?.token ||
            ''

        return Api.post(DELETE_BOOKMARK_COMPANIES, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
        })
    },
}
// --- Hiring Pipeline API ---

export const hiringPipelinesApi = {
    getHiringPipelines: () => {
        return Api.get('get-hiring-pipelines', {
            headers: {
                Accept: 'application/json',
            },
        })
    },
    updateHiringPipelines: ({ pipelines }) => {
        return Api.post('update-hiring-pipelines', { pipelines }, {
            headers: {
                Accept: 'application/json',
            },
        })
    },
    getJobPipelineCandidates: ({ item_id }) => {
        const formData = new FormData()
        formData.append('item_id', item_id)
        return Api.post('get-job-pipeline-candidates', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Accept: 'application/json',
            },
        })
    },
    updateApplicationStatus: ({ application_id, application_status, item_id }) => {
        const formData = new FormData()
        formData.append('application_id', application_id)
        formData.append('application_status', application_status)
        if (item_id != null && item_id !== '') formData.append('item_id', item_id)
        return Api.post('update-application-status', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Accept: 'application/json',
            },
        })
    },
}
