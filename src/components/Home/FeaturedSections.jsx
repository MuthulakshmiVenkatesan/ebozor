'use client';
import ProductCard from "../Cards/ProductCard";
import { t } from "@/utils";
import Link from "next/link";
import { userSignUpData } from "@/redux/reuducer/authSlice";
import { useSelector } from "react-redux";
import { Grid } from "@mui/material";

const LISTING_SLUG_BY_PURPOSE = {
    rent: 'property-for-rent',
    sale: 'property-for-sale',
}

/** Motors featured rows: map API `property_type` tokens to `item` query (see productdetail motors mode). */
const MOTOR_ITEM_LABEL_BY_TYPE = {
    usedcar: 'Used Cars',
    newcar: 'New Cars',
    exportcar: 'Export Cars',
    rentalcar: 'Rental Cars',
}

const MOTOR_SUBTYPE_KEYS = Object.keys(MOTOR_ITEM_LABEL_BY_TYPE)

function motorItemFromPropertyTypes(propertyTypes) {
    for (const key of MOTOR_SUBTYPE_KEYS) {
        if (propertyTypes.includes(key)) return MOTOR_ITEM_LABEL_BY_TYPE[key]
    }
    return ''
}

function isMotorSectionPropertyTypes(propertyTypes) {
    return (
        propertyTypes.includes('motor') ||
        propertyTypes.includes('motors') ||
        MOTOR_SUBTYPE_KEYS.some((k) => propertyTypes.includes(k))
    )
}

function normalizePropertyTypes(propertyTypeRaw) {
    const parts = Array.isArray(propertyTypeRaw) ? propertyTypeRaw : [propertyTypeRaw]
    return parts.map((x) => String(x ?? '').trim().toLowerCase()).filter(Boolean)
}

function resolveClassifiedVariant(propertyTypes) {
    if (propertyTypes.includes('furnituregarden')) return 'furniture'
    if (propertyTypes.includes('mobilestablets')) return 'mobile'
    return ''
}

function listingPurposeFromApiPropertyType(propertyTypes) {
    if (propertyTypes.includes('sale') || propertyTypes.includes('sell')) return 'sale'
    return 'rent'
}

/** URLSearchParams uses `+` for spaces; search page uses `%20` — normalize so links match. */
function toQueryString(params) {
    return params.toString().replace(/\+/g, '%20')
}

function buildItemDetailHref(slug, propertyTypeRaw, itemCategory = '') {
    const detailSlug = String(slug || '').trim()
    if (!detailSlug) return '/ads'

    const propertyTypes = normalizePropertyTypes(propertyTypeRaw)
    const hasNewProject = propertyTypes.includes('newproject')
    const hasPropertyListing = propertyTypes.includes('sale') || propertyTypes.includes('sell') || propertyTypes.includes('rent')
    const hasClassifiedListing =
        propertyTypes.includes('classified') ||
        propertyTypes.includes('furnituregarden') ||
        propertyTypes.includes('mobilestablets')
    const hasMotorListing = isMotorSectionPropertyTypes(propertyTypes)

    const q = new URLSearchParams()
    q.set('slug', detailSlug)

    if (hasNewProject) {
        q.set('mode', 'new-project')
        return `/productdetail?${toQueryString(q)}`
    }

    if (hasMotorListing) {
        q.set('mode', 'motors')
        const fromSubtype = motorItemFromPropertyTypes(propertyTypes)
        const fromCategory = String(itemCategory || '').trim()
        const item = fromSubtype || fromCategory
        if (item) q.set('item', item)
        q.set('carOfWeek', '1')
        return `/productdetail?${toQueryString(q)}`
    }

    if (hasPropertyListing) {
        const purpose = listingPurposeFromApiPropertyType(propertyTypes)
        q.set('mode', 'property')
        q.set('purpose', purpose)
        q.set('item', LISTING_SLUG_BY_PURPOSE[purpose] || LISTING_SLUG_BY_PURPOSE.rent)
        return `/productdetail?${toQueryString(q)}`
    }

    if (hasClassifiedListing) {
        q.set('mode', 'classified')
        const variant = resolveClassifiedVariant(propertyTypes)
        if (variant) q.set('variant', variant)
        return `/productdetail?${toQueryString(q)}`
    }

    return `/productdetail?${toQueryString(q)}`
}



const FeaturedSections = ({ featuredData, setFeaturedData, allEmpty }) => {

    const userData = useSelector(userSignUpData);

    const handleLike = (id) => {
        const updatedData = featuredData.map(section => {
            const updatedSectionData = section.section_data.map(item => {
                if (item.id === id) {
                    return { ...item, is_liked: !item.is_liked };
                }
                return item;
            });
            return { ...section, section_data: updatedSectionData };
        });
        setFeaturedData(updatedData);
    };



    return (

        <div className="w-full mx-auto">
            <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
                {featuredData && !allEmpty && (
                    featuredData.map((ele, index) => (
                        (ele?.section_data?.length || 0) > 0 && (
                            <div key={index} className="mb-[20px]">
                                <div className="flex items-center justify-between mb-[30px]">
                                    <h4 className="text-[24px] font-[Inter-SemiBold] text-[#000000]">{ele?.title}</h4>
                                    {/* {ele?.section_data.length > 4 &&
                                        <Link href={`/featured-sections/${ele?.slug}`} className="" prefetch={false}>
                                            <p className="">{t('viewAll')}</p>
                                        </Link>
                                    } */}
                                </div>
                                <div className="grid grid-cols-5 gap-[14px] max-sm:grid-cols-2">
                                    {ele?.section_data.slice(0, 4).map((data, index) => (
                                        <div key={index}>
                                            <Link
                                                href={
                                                    userData?.id == data?.user_id
                                                        ? buildItemDetailHref(data?.slug, data?.property_type, data?.item_category)
                                                        : buildItemDetailHref(data?.slug, data?.property_type, data?.item_category)
                                                }
                                                prefetch={false}
                                                className=""
                                            >
                                                <ProductCard data={data} handleLike={handleLike} />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    ))
                )}
            </div>
        </div>
    );
};

export default FeaturedSections;
