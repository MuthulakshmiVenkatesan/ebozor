'use client'
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { CurrentLanguageData } from "@/redux/reuducer/languageSlice";
import { settingsData } from "@/redux/reuducer/settingSlice";
import { CategoryIcon } from "@/components/CustomFile/icons";
import sellcar from "../../../public/assets/img/sellcar.png";
import Image from "next/image";
import { getHomeCategoriesApi } from "@/utils/api";
import {
    getMotorsMenuItemPath,
    isMotorsCarVerticalMenuItem,
    MOTORS_LISTING_PATH_TO_QUERY,
} from "@/utils/motorsListingPaths";
import { getJobsMenuHref } from "@/utils/jobsListingContext";

const MEGA_MENU_LEFT_ITEMS = [
    { label: "For Rent", section: true },
    { label: "Residential", key: "residential" },
    { label: "Commercial", key: "commercial" },
    { label: "Rooms For Rent", key: "rooms_for_rent" },
    { label: "Monthly Short Term", key: "monthly_short_term" },
    { label: "Daily Short Term", key: "daily_short_term" },
    { label: "For Sale", section: true },
    { label: "New Projects", key: "new_projects" },
    { label: "Residential", key: "sale_residential" },
    { label: "Commercial", key: "sale_commercial" },
    { label: "Off-Plan", key: "off_plan" },
    { label: "Land", key: "land" },
    { label: "Multiple Units", key: "multiple_units" },
    { label: "Agent & Agency Search", section: true },
];

const MEGA_MENU_RIGHT_ITEMS = {
    residential: ["All in Residential", "Apartment", "Villa", "Townhouse", "Penthouse", "Hotel Apartment", "Residential Building", "Villa Compound", "Residential Floor"],
    commercial: ["All in Commercial", "Office", "Industrial", "Retail", "Staff Accommodation", "Shop", "Warehouse", "Commercial Floor", "Commercial Villa", "Bulk Unit", "Commercial Plot", "Factory", "Industrial Land", "Mixed Use Land", "Showroom", "Commercial Building"],
    rooms_for_rent: ["All Rooms", "Partition", "Shared Room", "Private Room", "Master Room", "Studio Room"],
    monthly_short_term: ["Monthly Apartments", "Monthly Villas", "Monthly Studio", "Monthly Hotel Apartment"],
    daily_short_term: ["Daily Apartments", "Daily Villas", "Daily Studio", "Daily Hotel Apartment"],
    new_projects: ["All New Projects", "Apartments", "Townhouses", "Villas", "Penthouses"],
    sale_residential: ["All in Residential", "Apartment", "Villa", "Townhouse", "Penthouse", "Hotel Apartment", "Residential Building", "Residential Floor"],
    sale_commercial: ["All in Commercial", "Office", "Retail", "Warehouse", "Commercial Building", "Commercial Floor", "Shop"],
    off_plan: ["All Off-Plan", "Off-Plan Apartment", "Off-Plan Villa", "Off-Plan Townhouse"],
    land: ["Residential Land", "Commercial Land", "Industrial Land", "Mixed Use Land"],
    multiple_units: ["Bulk Units", "Whole Building", "Floors", "Compounds"],
};

const COMMUNITY_MENU_ITEMS = [
    "Auto Services",
    "Consultancy Services",
    "Domestic",
    "Event & Entertainment",
    "Freelancers",
    "Health & Wellbeing Services",
    "Home Maintenance",
    "Movers & Removals",
    "Other Services",
    "Restoration & Repairs",
    "Tutors & Classes",
    "Web & Computer Services",
];

const JOBS_LEFT_ITEMS = [
    { label: "Jobs Seekers", section: true },
    { label: "Jobs by Categories", key: "jobs_by_categories" },
    { label: "Jobs by Types", key: "jobs_by_types" },
    { label: "Jobs by Qualifications", key: "jobs_by_qualifications" },
    { label: "Recruiters", section: true },
    { label: "Jobs Seeker by Categories", key: "recruiter_by_categories" },
    { label: "Jobs Seeker by Types", key: "recruiter_by_types" },
    { label: "Jobs Seeker by Qualifications", key: "recruiter_by_qualifications" },
    { label: "Hire with Us", section: true },
];

const JOBS_RIGHT_ITEMS = {
    jobs_by_categories: [
        "Accounting / Finance", "Automobile", "Beauty / Salon", "Cleaner / Housekeeper",
        "Construction", "Cook / Chef", "Customer Service / Call Centre", "Data Management & Analysis",
        "Design", "Driver / Delivery", "Education", "Engineering", "Event Management & Operations",
        "HR / Admin", "Handyman / Technician", "Information Technology", "Legal Services",
        "Logistics & Distribution", "Manufacturing / Warehouse", "Marine Captain / Crew",
    ],
    jobs_by_types: ["Full Time", "Part Time", "Contract", "Temporary", "Internship", "Freelance"],
    jobs_by_qualifications: ["High School", "Diploma", "Bachelor's Degree", "Master's Degree", "PhD", "Professional Certification"],
    recruiter_by_categories: ["Post Jobs by Category", "Browse Candidates by Category", "Featured Recruiters"],
    recruiter_by_types: ["Hire Full Time", "Hire Part Time", "Hire Contract", "Hire Temporary"],
    recruiter_by_qualifications: ["Candidates by Education", "Candidates by Skill Level", "Candidates by Experience"],
};

const CLASSIFIEDS_LEFT_ITEMS = [
    { label: "Electronics", key: "electronics" },
    { label: "Computers & Networking", key: "computers_networking" },
    { label: "Business & Industrial", key: "business_industrial" },
    { label: "Home Appliances", key: "home_appliances" },
    { label: "Sports Equipment", key: "sports_equipment" },
    { label: "Clothing & Accessories", key: "clothing_accessories" },
    { label: "Cameras & Imaging", key: "cameras_imaging" },
    { label: "Jewelry & Watches", key: "jewelry_watches" },
    { label: "Pets", key: "pets" },
    { label: "Musical Instruments", key: "musical_instruments" },
    { label: "Gaming", key: "gaming" },
    { label: "Baby Items", key: "baby_items" },
    { label: "Toys", key: "toys" },
];

const CLASSIFIEDS_RIGHT_ITEMS = {
    electronics: ["Mobiles", "Tablets", "TV / Audio", "Headphones", "Smart Home Devices"],
    computers_networking: ["Laptops", "Desktops", "Monitors", "Printers", "Networking Equipment"],
    business_industrial: [
        "Businesses for Sale", "Construction", "Food & Beverage", "Industrial Supplies", "Office Furniture & Equipment",
        "Manufacturing", "Electrical Equipment", "Retail & Services", "Healthcare & Lab", "Commercial Printing & Copy Machines",
        "Packing & Shipping", "Agriculture & Forestry", "Other",
    ],
    home_appliances: ["Refrigerators", "Washing Machines", "Cookers", "Microwaves", "Small Kitchen Appliances"],
    sports_equipment: ["Gym Equipment", "Bicycles", "Outdoor Gear", "Team Sports", "Water Sports"],
    clothing_accessories: ["Men's Clothing", "Women's Clothing", "Bags", "Shoes", "Accessories"],
    cameras_imaging: ["DSLR Cameras", "Lenses", "Action Cameras", "Drones", "Tripods"],
    jewelry_watches: ["Gold Jewelry", "Diamond Jewelry", "Fashion Jewelry", "Men's Watches", "Women's Watches"],
    pets: ["Cats", "Dogs", "Birds", "Fish", "Pet Accessories"],
    musical_instruments: ["Guitars", "Keyboards", "Drums", "Studio Gear", "Traditional Instruments"],
    gaming: ["Consoles", "Games", "Controllers", "Gaming PCs", "VR"],
    baby_items: ["Strollers", "Car Seats", "Toys", "Furniture", "Feeding"],
    toys: ["Educational Toys", "Outdoor Toys", "Board Games", "Action Figures", "Dolls"],
};

const FURNITURE_LEFT_ITEMS = [
    { label: "Furniture", key: "furniture" },
    { label: "Home Accessories", key: "home_accessories" },
    { label: "Garden & Outdoor", key: "garden_outdoor" },
    { label: "Lighting & Fans", key: "lighting_fans" },
    { label: "Rugs & Carpets", key: "rugs_carpets" },
    { label: "Curtains & Blinds", key: "curtains_blinds" },
    { label: "Tools & Home Improvement", key: "tools_home_improvement" },
];

const FURNITURE_RIGHT_ITEMS = {
    furniture: [
        "Armoires & Wardrobes", "Office Furniture", "Bar Tables", "Sofas, Futons & Lounges",
        "Beds & Bed Sets", "Study Tables & Computer Tables", "Bookcases", "Tables",
        "Cabinets & Cupboards", "Other", "Chairs, Benches & Stools", "Children's Furniture",
        "Dining Sets", "Dressers & Vanities", "Entertainment Centers", "Kitchen Islands & Carts",
        "Nightstands",
    ],
    home_accessories: ["Wall Decor", "Mirrors", "Vases", "Artificial Plants", "Clocks", "Storage Baskets"],
    garden_outdoor: ["Outdoor Furniture", "BBQ Grills", "Garden Decor", "Outdoor Lighting", "Planters", "Swings"],
    lighting_fans: ["Ceiling Lights", "Floor Lamps", "Table Lamps", "Wall Lights", "Ceiling Fans", "Outdoor Lights"],
    rugs_carpets: ["Area Rugs", "Runner Rugs", "Carpets", "Door Mats", "Prayer Mats"],
    curtains_blinds: ["Blackout Curtains", "Sheer Curtains", "Roller Blinds", "Venetian Blinds", "Curtain Rods"],
    tools_home_improvement: ["Power Tools", "Hand Tools", "Paint Supplies", "Hardware", "Plumbing Tools", "Electrical Tools"],
};

const MOBILE_LEFT_ITEMS = [
    { label: "Mobile Phones", key: "mobile_phones" },
    { label: "Mobile Phone & Tablet Accessories", key: "phone_tablet_accessories" },
    { label: "Tablets", key: "tablets" },
    { label: "Other Mobile Phones & Tablets", key: "other_mobiles_tablets" },
];

const MOBILE_RIGHT_ITEMS = {
    mobile_phones: [
        "Apple", "Sony Ericsson", "Samsung", "ZTE Phones", "Google", "Vertu",
        "Huawei", "Asus", "Xiaomi", "Infinix", "Oppo", "Blackberry",
        "OnePlus", "Nothing Phone", "Honor", "Aquos", "Nokia", "Vivo",
        "Motorola", "Realme",
    ],
    phone_tablet_accessories: [
        "Chargers", "Phone Cases", "Screen Protectors", "Power Banks", "Cables",
        "Headsets", "Smartwatches", "Car Holders", "Wireless Chargers", "Memory Cards",
    ],
    tablets: ["Apple iPad", "Samsung Tablets", "Huawei Tablets", "Lenovo Tablets", "Microsoft Surface", "Other Tablets"],
    other_mobiles_tablets: ["Landline Phones", "Satellite Phones", "Vintage Phones", "Others"],
};

const TOP_NAV_HREF_BY_SLUG = {
    motors: "/motors",
    property: "/property",
    jobs: "/jobs",
    classified: "/classifieds",
    classifieds: "/classifieds",
    "furniture-garden": "/classifieds",
    "mobiles-tablets": "/classifieds",
    community: "/community",
};

const MOTORS_LEFT_ITEMS = [
    { label: "Used Cars", key: "used_cars" },
    { label: "New Cars", key: "new_cars" },
    { label: "Export Cars", key: "export_cars" },
    { label: "Rental Cars", key: "rental_cars", isNew: true },
    { label: "Motorcycles", key: "motorcycles" },
    { label: "Auto Accessories & Parts", key: "auto_accessories_parts" },
    { label: "Heavy Vehicles", key: "heavy_vehicles" },
    { label: "Boats", key: "boats" },
    { label: "Number Plates", key: "number_plates" },
];

const MOTORS_RIGHT_ITEMS = {
    used_cars: [
        "Toyota", "Jetour", "Mercedes-Benz", "Dodge", "BMW", "Rolls-Royce",
        "Nissan", "Bentley", "Lexus", "Hyundai", "Porsche", "Ford", "Audi",
        "Kia", "Land Rover", "Jeep", "Chevrolet", "Mitsubishi", "Honda", "Volkswagen",
    ],
    new_cars: ["Toyota", "Nissan", "Hyundai", "Kia", "Mitsubishi", "Ford", "Chevrolet", "Honda", "Mazda", "MG"],
    export_cars: ["Toyota", "Nissan", "Lexus", "Land Rover", "Mercedes-Benz", "BMW", "Porsche", "Audi"],
    rental_cars: ["Economy Cars", "SUV Rentals", "Luxury Rentals", "Monthly Rentals", "Daily Rentals", "Chauffeur Service"],
    motorcycles: ["Sport Bikes", "Cruisers", "Scooters", "Touring Bikes", "Off-road Bikes", "Electric Bikes"],
    auto_accessories_parts: ["Tyres", "Batteries", "Oil & Fluids", "Body Parts", "Car Care", "Audio Systems"],
    heavy_vehicles: ["Trucks", "Buses", "Cranes", "Trailers", "Construction Vehicles", "Forklifts"],
    boats: ["Fishing Boats", "Speed Boats", "Yachts", "Jet Skis", "Boat Parts"],
    number_plates: ["Dubai Plates", "Abu Dhabi Plates", "Sharjah Plates", "Special Plates"],
};
const MOTORS_NO_RIGHT_PANE_KEYS = new Set(["number_plates", "motors_services"]);

const isNewTagEnabled = (item) => Number(item?.newTag ?? item?.new_tag) === 1

const HeaderCategories = ({ headerCatSelected }) => {
    const currentLanguage = useSelector(CurrentLanguageData)
    const systemSettings = useSelector(settingsData)
    const homeCategoriesFetchGenRef = useRef(0)
    const [homeCategories, setHomeCategories] = useState([])
    const [hoveredSlug, setHoveredSlug] = useState("");
    const [hoveredMenuKey, setHoveredMenuKey] = useState("residential");
    const [hoveredJobsKey, setHoveredJobsKey] = useState("jobs_by_categories");
    const [hoveredClassifiedsKey, setHoveredClassifiedsKey] = useState("business_industrial");
    const [hoveredFurnitureKey, setHoveredFurnitureKey] = useState("furniture");
    const [hoveredMobileKey, setHoveredMobileKey] = useState("mobile_phones");
    const [hoveredMotorsKey, setHoveredMotorsKey] = useState("used_cars");
    const [isForSale, setIsForSale] = useState(false);
    const hoverCloseTimerRef = useRef(null)

    const cancelHoverClose = () => {
        if (hoverCloseTimerRef.current) {
            clearTimeout(hoverCloseTimerRef.current)
            hoverCloseTimerRef.current = null
        }
    }

    const closeHoverMenuNow = () => {
        cancelHoverClose()
        setHoveredSlug("")
        setHoveredMenuKey("residential")
        setHoveredMotorsKey("used_cars")
        setHoveredJobsKey("jobs_by_categories")
        setHoveredClassifiedsKey("business_industrial")
        setHoveredFurnitureKey("furniture")
        setHoveredMobileKey("mobile_phones")
        setIsForSale(false)
    }

    const scheduleHoverClose = () => {
        cancelHoverClose()
        hoverCloseTimerRef.current = setTimeout(() => {
            closeHoverMenuNow()
        }, 180)
    }

    const handleCategoryMenuLinkClick = (e) => {
        if (e.target.closest('a')) {
            closeHoverMenuNow()
        }
    }

    const parseApiPayload = (payload) => {
        if (typeof payload !== "string") return payload
        const debugAssetIndex = payload.indexOf("<link rel='stylesheet'")
        const sfDumpIndex = payload.indexOf("<script> Sfdump")
        const cutIndex = debugAssetIndex >= 0 ? debugAssetIndex : sfDumpIndex
        const safeJson = cutIndex >= 0 ? payload.slice(0, cutIndex) : payload
        try {
            return JSON.parse(safeJson)
        } catch (error) {
            console.log("Home categories parse error:", error)
            return {}
        }
    }

    const getCategoryLabel = (node) => node?.translated_name || node?.name || ""
    const toKey = (node, fallbackPrefix = "key") => node?.slug || `${fallbackPrefix}_${node?.id || Math.random()}`
    const getLeafNames = (node) => Array.isArray(node?.subcategories) ? node.subcategories.map(getCategoryLabel).filter(Boolean) : []
    const getLeafEntries = (node) => {
        const subs = Array.isArray(node?.subcategories) ? node.subcategories : []
        return subs
            .map((leaf) => ({
                label: getCategoryLabel(leaf),
                slug: String(leaf?.slug || "").trim(),
            }))
            .filter((x) => x.label)
    }

    const buildBasicMenu = (topCategory, keyPrefix, options = {}) => {
        const { useLeafEntries = false } = options
        const children = Array.isArray(topCategory?.subcategories) ? topCategory.subcategories : []
        const leftItems = children.map((child) => ({
            label: getCategoryLabel(child),
            key: toKey(child, keyPrefix),
        }))
        const rightItems = {}
        children.forEach((child) => {
            rightItems[toKey(child, keyPrefix)] = useLeafEntries ? getLeafEntries(child) : getLeafNames(child)
        })
        return { leftItems, rightItems }
    }

    const buildMotorsMenu = (motorsCategory) => {
        const children = Array.isArray(motorsCategory?.subcategories) ? motorsCategory.subcategories : []
        const leftItems = []
        const rightItems = {}

        children.forEach((child) => {
            const childSlug = child?.slug || ""
            const childKey = toKey(child, "motors")

            // Show Cars children directly in left menu instead of the Cars parent.
            if (childSlug === "cars") {
                const carSub = Array.isArray(child?.subcategories) ? child.subcategories : []
                carSub.forEach((carChild) => {
                    const carKey = toKey(carChild, "motors")
                    leftItems.push({
                        label: getCategoryLabel(carChild),
                        key: carKey,
                        newTag: isNewTagEnabled(carChild) ? 1 : 0,
                    })
                    rightItems[carKey] = getLeafNames(carChild)
                })
                return
            }

            leftItems.push({
                label: getCategoryLabel(child),
                key: childKey,
                newTag: isNewTagEnabled(child) ? 1 : 0,
            })
            rightItems[childKey] = getLeafEntries(child)
        })

        return { leftItems, rightItems }
    }

    const buildPropertyMenu = (propertyCategory) => {
        const children = Array.isArray(propertyCategory?.subcategories) ? propertyCategory.subcategories : []
        const rentNode = children.find((c) => c?.slug === "property-for-rent")
        const saleNode = children.find((c) => c?.slug === "property-for-sale")

        const makeItems = (parentNode, prefix) => {
            const sub = Array.isArray(parentNode?.subcategories) ? parentNode.subcategories : []
            return sub.map((entry) => ({
                label: getCategoryLabel(entry),
                key: toKey(entry, prefix),
                raw: entry,
            }))
        }

        const rentItems = makeItems(rentNode, "rent")
        const saleItems = makeItems(saleNode, "sale")
        const leftItems = [
            { label: "For Rent", section: true },
            ...rentItems.map(({ label, key }) => ({ label, key })),
            { label: "For Sale", section: true },
            ...saleItems.map(({ label, key }) => ({ label, key })),
        ]

        const rightItems = {}
        rentItems.forEach(({ key, raw }) => {
            rightItems[key] = getLeafEntries(raw)
        })
        saleItems.forEach(({ key, raw }) => {
            rightItems[key] = getLeafEntries(raw)
        })

        return {
            leftItems,
            rightItems,
            rentKeys: rentItems.map((x) => x.key),
            saleKeys: saleItems.map((x) => x.key),
            firstRentKey: rentItems[0]?.key || "",
            firstSaleKey: saleItems[0]?.key || "",
        }
    }

    const jobsCategoryHasNestedMegaStructure = (topJobsCategory) => {
        const ch = topJobsCategory?.subcategories || []
        const seekersNode = ch.find((c) => {
            const s = String(c?.slug || "").toLowerCase()
            return s === "jobs-jobs-seekers" || s === "jobs-seekers"
        })
        if (!seekersNode?.subcategories?.length) return false
        return seekersNode.subcategories.some((g) => Array.isArray(g?.subcategories) && g.subcategories.length > 0)
    }

    const buildJobsMenuFromApi = (topJobsCategory) => {
        const children = Array.isArray(topJobsCategory?.subcategories) ? topJobsCategory.subcategories : []
        const leftItems = []
        const rightItems = {}
        const parentSlugByKey = {}
        const parentLabelByKey = {}

        const seekersNode = children.find((c) => {
            const s = String(c?.slug || "").toLowerCase()
            return s === "jobs-jobs-seekers" || s === "jobs-seekers"
        })
        const recruitersNode = children.find((c) => String(c?.slug || "").toLowerCase() === "jobs-recruiters")
        const hireNode = children.find((c) => String(c?.slug || "").toLowerCase() === "jobs-hire-with-us")

        const pushMidLevel = (sectionLabel, parentSlug, parentLabel, groups) => {
            if (!Array.isArray(groups) || groups.length === 0) return
            leftItems.push({ label: sectionLabel, section: true })
            groups.forEach((group) => {
                const key = toKey(group, "jobs")
                leftItems.push({ label: getCategoryLabel(group), key })
                rightItems[key] = getLeafEntries(group)
                if (parentSlug) parentSlugByKey[key] = String(parentSlug)
                if (parentLabel) parentLabelByKey[key] = String(parentLabel)
            })
        }

        if (seekersNode) {
            pushMidLevel(
                getCategoryLabel(seekersNode) || "Jobs Seekers",
                seekersNode.slug,
                getCategoryLabel(seekersNode) || "Jobs Seekers",
                seekersNode.subcategories || []
            )
        }
        if (recruitersNode) {
            pushMidLevel(
                getCategoryLabel(recruitersNode) || "Recruiters",
                recruitersNode.slug,
                getCategoryLabel(recruitersNode) || "Recruiters",
                recruitersNode.subcategories || []
            )
        }
        if (hireNode) {
            const hireLabel = getCategoryLabel(hireNode) || "Hire with Us"
            leftItems.push({ label: hireLabel, section: true })
            const hireKey = toKey(hireNode, "jobs")
            leftItems.push({ label: hireLabel, key: hireKey })
            rightItems[hireKey] = []
            parentSlugByKey[hireKey] = String(hireNode.slug || hireKey)
            parentLabelByKey[hireKey] = hireLabel
        }

        return { leftItems, rightItems, parentSlugByKey, parentLabelByKey }
    }

    const languageReadyKey = useMemo(() => {
        if (currentLanguage?.id != null) return `id:${currentLanguage.id}`
        const code = currentLanguage?.language_code || currentLanguage?.code
        if (code) return `code:${code}`
        const defaultCode = systemSettings?.data?.default_language
        if (defaultCode) return `default:${defaultCode}`
        return ''
    }, [currentLanguage, systemSettings?.data?.default_language])

    useEffect(() => {
        if (!languageReadyKey) return undefined

        const fetchGeneration = ++homeCategoriesFetchGenRef.current
        let cancelled = false

        const fetchHomeCategories = async (attempt = 0) => {
            try {
                const response = await getHomeCategoriesApi.getHomeCategories()
                if (cancelled || fetchGeneration !== homeCategoriesFetchGenRef.current) return

                const parsed = parseApiPayload(response?.data)
                const categories = Array.isArray(parsed?.data) ? parsed.data : []

                if (categories.length === 0 && attempt < 1) {
                    await new Promise((resolve) => setTimeout(resolve, 400))
                    if (cancelled || fetchGeneration !== homeCategoriesFetchGenRef.current) return
                    return fetchHomeCategories(attempt + 1)
                }

                setHomeCategories(categories)
            } catch (error) {
                if (cancelled || fetchGeneration !== homeCategoriesFetchGenRef.current) return
                console.log(error)
                if (attempt < 1) {
                    await new Promise((resolve) => setTimeout(resolve, 400))
                    if (cancelled || fetchGeneration !== homeCategoriesFetchGenRef.current) return
                    return fetchHomeCategories(attempt + 1)
                }
                setHomeCategories([])
            }
        }

        fetchHomeCategories()
        return () => {
            cancelled = true
        }
    }, [languageReadyKey])

    const navItems = useMemo(() => {
        if (!homeCategories.length) return []

        const base = [...homeCategories]
        const classifieds = base.find((c) => c?.slug === "classified" || c?.slug === "classifieds")
        if (!classifieds) return base

        const promotedMap = [
            { sourceSlug: "classified-furniture-home-garden", navSlug: "furniture-garden", label: "Furniture & Garden" },
            { sourceSlug: "classified-mobile-phones-tablets", navSlug: "mobiles-tablets", label: "Mobiles & Tablets" },
        ]

        const promoted = promotedMap
            .map(({ sourceSlug, navSlug, label }) => {
                const node = (classifieds?.subcategories || []).find((x) => x?.slug === sourceSlug)
                if (!node) return null
                return {
                    id: `promoted-${node.id}`,
                    translated_name: label,
                    name: label,
                    slug: navSlug,
                    source_slug: node.slug,
                    newTag: isNewTagEnabled(node) ? 1 : 0,
                }
            })
            .filter(Boolean)

        const withoutPromotedInBase = base.filter((item) => item?.slug !== "furniture-garden" && item?.slug !== "mobiles-tablets")
        return [...withoutPromotedInBase, ...promoted]
    }, [homeCategories])
    const motorsCategory = homeCategories.find((c) => c?.slug === "motors")
    const propertyCategory = homeCategories.find((c) => c?.slug === "property")
    const jobsCategory = homeCategories.find((c) => c?.slug === "jobs")
    const classifiedsCategory = homeCategories.find((c) => c?.slug === "classified" || c?.slug === "classifieds")
    const furnitureCategory = (classifiedsCategory?.subcategories || []).find((c) => c?.slug === "classified-furniture-home-garden")
    const mobilesCategory = (classifiedsCategory?.subcategories || []).find((c) => c?.slug === "classified-mobile-phones-tablets")

    const motorsMenu = useMemo(() => buildMotorsMenu(motorsCategory), [motorsCategory])
    const propertyMenu = useMemo(() => buildPropertyMenu(propertyCategory), [propertyCategory])
    const jobsMenu = useMemo(() => {
        if (!jobsCategory) {
            return { leftItems: JOBS_LEFT_ITEMS, rightItems: JOBS_RIGHT_ITEMS, parentSlugByKey: {}, parentLabelByKey: {} }
        }
        if (jobsCategoryHasNestedMegaStructure(jobsCategory)) {
            return buildJobsMenuFromApi(jobsCategory)
        }
        return { ...buildBasicMenu(jobsCategory, "jobs"), parentSlugByKey: {}, parentLabelByKey: {} }
    }, [jobsCategory])
    const classifiedsMenu = useMemo(
        () => buildBasicMenu(classifiedsCategory, "classified", { useLeafEntries: true }),
        [classifiedsCategory]
    )
    const furnitureMenu = useMemo(
        () => buildBasicMenu(furnitureCategory, "furniture", { useLeafEntries: true }),
        [furnitureCategory]
    )
    const mobileMenu = useMemo(
        () => buildBasicMenu(mobilesCategory, "mobiles", { useLeafEntries: true }),
        [mobilesCategory]
    )

    const getFirstInteractiveKey = (items = []) => items.find((x) => !x?.section && x?.key)?.key || ""
    const defaultFurnitureKey = getFirstInteractiveKey(furnitureMenu.leftItems) || "furniture"
    const defaultMobileKey = getFirstInteractiveKey(mobileMenu.leftItems) || "mobile_phones"
    const defaultJobsHoverKey = useMemo(
        () => getFirstInteractiveKey(jobsMenu.leftItems) || "jobs_by_categories",
        [jobsMenu.leftItems]
    )

    const getTopNavHref = (cat) => {
        const slug = cat?.slug || "";
        const base = TOP_NAV_HREF_BY_SLUG[slug] || (slug ? `/category/${slug}` : "#");
        if (slug.includes("furniture-garden")) {
            const itemLabel = cat?.translated_name || cat?.name || "Furniture & Garden";
            return getMegaProductsHref("classified", itemLabel, cat?.source_slug);
        }
        if (slug.includes("mobiles-tablets")) {
            const itemLabel = cat?.translated_name || cat?.name || "Mobiles & Tablets";
            return getMegaProductsHref("classified", itemLabel, cat?.source_slug);
        }
        if (base === "/classifieds" && classifiedsCategory?.id != null) {
            const q = new URLSearchParams({ parent_category_id: String(classifiedsCategory.id) });
            return `/classifieds?${q.toString()}`;
        }
        if (base === "/jobs" && jobsCategory?.id != null) {
            const q = new URLSearchParams({ parent_category_id: String(jobsCategory.id) });
            return `/jobs?${q.toString()}`;
        }
        return base;
    };
    const slugifyLabel = (value = "") =>
        value
            .toLowerCase()
            .replace(/&/g, "and")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    const getMegaProductsHref = (parentSlug, itemLabel, slugOverride) =>
        `/products?mode=${encodeURIComponent(parentSlug)}&item=${encodeURIComponent(itemLabel)}&category_slug=${encodeURIComponent(slugOverride || slugifyLabel(itemLabel))}`;
    /** Motors listing `get-item` param: human-readable make / model / vertical label (motors only). */
    const withMotorsMakeModelParam = (href, displayName) => {
        const name = String(displayName ?? "").trim();
        if (!name || !href || href === "#") return href;
        const joiner = href.includes("?") ? "&" : "?";
        return `${href}${joiner}make_model=${encodeURIComponent(name)}`;
    };
    /** Slug for the hovered/selected motors vertical (left column) → `category_slug`. */
    const getMotorsParentCategorySlug = (menuItemForVertical) => {
        const path = getMotorsMenuItemPath(menuItemForVertical);
        const mapped = path ? MOTORS_LISTING_PATH_TO_QUERY[path]?.slug : "";
        if (mapped) return mapped;
        return slugifyLabel(menuItemForVertical?.label || "motors");
    };
    /** Left motors column: `category_slug` only (no `make_model`). */
    const getMotorsVerticalHref = (menuItem) => {
        const path = getMotorsMenuItemPath(menuItem);
        const parentCategorySlug = getMotorsParentCategorySlug(menuItem);
        if (path) {
            return `${path}?category_slug=${encodeURIComponent(parentCategorySlug)}`;
        }
        return getMegaProductsHref("motors", menuItem?.label || "Motors", parentCategorySlug || undefined);
    };
    const getMotorsMakeOrSubHref = (menuItemForVertical, subItem) => {
        const base = getMotorsMenuItemPath(menuItemForVertical);
        const parentCategorySlug = getMotorsParentCategorySlug(menuItemForVertical);
        const verticalLabel = menuItemForVertical?.label || "Motors";
        const isString = typeof subItem === "string";
        const subLabel = isString ? subItem : subItem?.label;
        const subSlug = isString ? "" : String(subItem?.slug || "").trim();
        const displayName = String(subLabel ?? "").trim() || verticalLabel;
        const childCategorySlug = subSlug || slugifyLabel(displayName);
        const isCarVertical = isMotorsCarVerticalMenuItem(menuItemForVertical);

        let href;
        if (base) {
            if (isCarVertical) {
                href = `${base}?category_slug=${encodeURIComponent(parentCategorySlug)}`;
                return withMotorsMakeModelParam(href, displayName);
            }
            href = `${base}?category_slug=${encodeURIComponent(childCategorySlug)}`;
            return href;
        }
        if (isCarVertical) {
            href = getMegaProductsHref("motors", verticalLabel, parentCategorySlug || undefined);
            return withMotorsMakeModelParam(href, displayName);
        }
        return getMegaProductsHref("motors", verticalLabel, childCategorySlug);
    };
    /** Sale types use DB slugs under `property-for-sale` (e.g. `property-for-sale-residential`). */
    const isPropertySaleCategorySlug = (slug = "") => {
        const s = String(slug || "").toLowerCase()
        return s === "property-for-sale" || s.startsWith("property-for-sale-")
    }
    const getPropertyMegaHref = (itemLabel, slugOverride, extraQuery = "") => {
        const categorySlug = String(slugOverride || slugifyLabel(itemLabel)).trim()
        const forSale = isPropertySaleCategorySlug(categorySlug)
        return `/products?mode=property&item=${encodeURIComponent(forSale ? 'property-for-sale' : 'property-for-rent')}&purpose=${forSale ? 'sale' : 'rent'}&propertyType=${encodeURIComponent(itemLabel)}&category_slug=${encodeURIComponent(categorySlug)}${extraQuery}`
    }

    /** API keys are slugs (e.g. `new-projects-for-sale`), not the literal `new_projects`. */
    const isNewProjectsPropertyMenuKey = (menuKey) => {
        if (!menuKey) return false
        if (menuKey === 'new_projects') return true
        const k = String(menuKey).toLowerCase()
        if (k.includes('new-project') || k.includes('new_project') || k.includes('newproject')) return true
        const entry = propertyMenu.leftItems?.find((x) => !x?.section && x.key === menuKey)
        const lbl = String(entry?.label || '').toLowerCase()
        return lbl.includes('new project')
    }

    const getNewProjectsListingHref = (itemLabel, slugOverride, parentSlugOverride) => {
        const trimmedCategorySlug = String(slugOverride || "").trim()
        const categorySlug = trimmedCategorySlug || slugifyLabel(itemLabel) || "all-new-projects"
        const parentSlug = String(parentSlugOverride || "").trim()
        const q = new URLSearchParams({
            mode: "property",
            segment: "new_projects",
            purpose: "sale",
            item: itemLabel,
            category_slug: categorySlug,
        })
        if (parentSlug) q.set('slug', parentSlug)
        return `/products?${q.toString()}`
    }

    return (
        <div className="relative w-full border border-[rgba(143,143,143,0.2)] bg-white mb-[10px]">
            {hoveredSlug ? (
                <div className="pointer-events-none absolute inset-x-0 top-full z-[100] hidden h-[100vh] bg-[rgba(0,0,0,0.14)] backdrop-blur-[1px] sm:block" />
            ) : null}
            <div className="max-w-[1170px] mx-auto px-[12px]">
                <div className="relative z-[120] flex items-center justify-between max-sm:justify-start gap-[26px] max-sm:gap-[18px] overflow-visible max-sm:overflow-x-auto whitespace-nowrap hide_scrollbar py-[14px]">
                    {navItems.map((cat) => {
                        const active = headerCatSelected === cat?.slug;
                        const isTopHovered = hoveredSlug === (cat?.slug || "");
                        const showNewBadge = isNewTagEnabled(cat);
                        const slug = cat?.slug || "";
                        const label = (cat?.translated_name || "").toLowerCase();
                        const isMegaMenuTarget =
                            slug.includes("property") ||
                            slug.includes("cars") ||
                            label === "property" ||
                            label === "cars";
                        const isMotorsTarget = slug.includes("motors") || label === "motors";
                        const megaParentSlug = slug.includes("cars") || label === "cars" ? "motors" : "property";
                        const isCommunityTarget = slug.includes("community") || label === "community";
                        const isJobsTarget = slug.includes("jobs") || label === "jobs";
                        const isClassifiedsTarget = slug.includes("classified") || label === "classifieds" || label === "classified";
                        const isFurnitureTarget = slug.includes("furniture-garden") || label === "furniture & garden";
                        const isMobilesTarget = slug.includes("mobiles-tablets") || label === "mobiles & tablets";

                        return (
                            <div
                                key={cat.id}
                                onMouseEnter={() => {
                                    cancelHoverClose()
                                    if (!isMegaMenuTarget && !isMotorsTarget && !isCommunityTarget && !isJobsTarget && !isClassifiedsTarget && !isFurnitureTarget && !isMobilesTarget) return;
                                    setHoveredSlug(slug);
                                    const defaultPropertyKey = isForSale
                                        ? (propertyMenu.firstSaleKey || getFirstInteractiveKey(propertyMenu.leftItems))
                                        : (propertyMenu.firstRentKey || getFirstInteractiveKey(propertyMenu.leftItems));
                                    setHoveredMenuKey(defaultPropertyKey || "residential");
                                    setHoveredMotorsKey(getFirstInteractiveKey(motorsMenu.leftItems) || "used_cars");
                                    setHoveredJobsKey(getFirstInteractiveKey(jobsMenu.leftItems) || "jobs_by_categories");
                                    setHoveredClassifiedsKey(getFirstInteractiveKey(classifiedsMenu.leftItems) || "business_industrial");
                                    setHoveredFurnitureKey(defaultFurnitureKey);
                                    setHoveredMobileKey(defaultMobileKey);
                                }}
                                onMouseLeave={() => {
                                    scheduleHoverClose()
                                }}
                                className="relative"
                            >
                                <Link
                                    href={getTopNavHref(cat)}
                                    className={`inline-flex items-center gap-[6px] border-b-2 pb-[2px] text-[14px] leading-[24px] font-[Inter-Medium] transition-colors ${active || isTopHovered ? "text-[#000] border-[#000]" : "text-[#23262A] border-transparent"
                                        }`}
                                >
                                    <span>{cat?.translated_name}</span>
                                    {showNewBadge ? (
                                        <span className="h-[18px] px-[7px] rounded-full bg-[#DC0000] text-white text-[10px] font-[Inter-Bold] leading-[18px] uppercase">
                                            New
                                        </span>
                                    ) : null}
                                </Link>

                                {isMegaMenuTarget && hoveredSlug === slug ? (
                                    (() => {
                                        const hoveredPropertyItems = propertyMenu.rightItems[hoveredMenuKey] || []
                                        const hasPropertyRightPane = hoveredPropertyItems.length > 0
                                        return (
                                            <div
                                                className={`absolute start-0 top-[34px] z-[200] rounded-[6px] border border-[rgba(143,143,143,0.24)] bg-white shadow-[0_10px_24px_rgba(0,0,0,0.14)] overflow-hidden max-sm:hidden ${hasPropertyRightPane ? 'w-[660px]' : 'w-[250px]'}`}
                                                onMouseEnter={cancelHoverClose}
                                                onMouseLeave={scheduleHoverClose}
                                                onClick={handleCategoryMenuLinkClick}
                                            >
                                                <div className={hasPropertyRightPane ? 'grid grid-cols-[250px_1fr]' : 'block'}>
                                                    <div className={`bg-[#fff] max-h-[440px] overflow-y-auto flex flex-col ${hasPropertyRightPane ? 'border-e border-[rgba(143,143,143,0.2)]' : ''}`}>
                                                        {propertyMenu.leftItems.map((item, idx) =>
                                                            item.section ? (
                                                                <button
                                                                    type="button"
                                                                    key={`${item.label}-${idx}`}
                                                                    onMouseEnter={() => {
                                                                        if (item.label === "For Sale") {
                                                                            setIsForSale(true);
                                                                            if (propertyMenu.firstSaleKey) setHoveredMenuKey(propertyMenu.firstSaleKey);
                                                                        } else if (item.label === "For Rent") {
                                                                            setIsForSale(false);
                                                                            if (propertyMenu.firstRentKey) setHoveredMenuKey(propertyMenu.firstRentKey);
                                                                        }
                                                                    }}
                                                                    className={`w-full cursor-pointer p-[6px_14px] text-left rtl:text-right text-[14px] font-[Inter-SemiBold] ${item.label === "For Sale" && isForSale
                                                                        ? "text-[#2167D9]"
                                                                        : item.label === "For Rent" && !isForSale
                                                                            ? "text-[#2167D9]"
                                                                            : "text-[#000]"
                                                                        }`}
                                                                >
                                                                    {item.label}
                                                                </button>
                                                            ) : (
                                                                <Link
                                                                    href={
                                                                        isNewProjectsPropertyMenuKey(item.key)
                                                                            ? getNewProjectsListingHref('All New Projects', item.key, item.key)
                                                                            : getPropertyMegaHref(item.label, item.key)
                                                                    }
                                                                    key={`${item.label}-${idx}`}
                                                                    onMouseEnter={() => {
                                                                        if (item.key) {
                                                                            setHoveredMenuKey(item.key);
                                                                            if (propertyMenu.saleKeys?.includes(item.key)) setIsForSale(true);
                                                                            if (propertyMenu.rentKeys?.includes(item.key)) setIsForSale(false);
                                                                        }
                                                                    }}
                                                                    className={`cursor-pointer p-[6px_14px] text-[14px] font-[Inter-Regular] ${item.key === hoveredMenuKey
                                                                        ? "hover:text-[#3A88EF] hover:bg-[#F5F5F5]"
                                                                        : "text-[#000]"
                                                                        }`}
                                                                >
                                                                    {item.label}
                                                                </Link>
                                                            )
                                                        )}
                                                    </div>
                                                    {hasPropertyRightPane ? (
                                                        <div className="bg-[#F5F5F5]">
                                                            <div className="grid gap-[8px] px-[14px] py-[8px] max-h-[380px] overflow-y-auto">
                                                                {hoveredPropertyItems.map((entry) => (
                                                                    <Link
                                                                        href={
                                                                            isNewProjectsPropertyMenuKey(hoveredMenuKey)
                                                                                ? getNewProjectsListingHref(
                                                                                      entry.label,
                                                                                      entry.slug || undefined,
                                                                                      hoveredMenuKey || undefined
                                                                                  )
                                                                                : getPropertyMegaHref(
                                                                                      entry.label,
                                                                                      entry.slug || undefined
                                                                                  )
                                                                        }
                                                                        key={entry.slug || entry.label}
                                                                        className="text-[14px] leading-[20px] font-[Inter-Regular] !text-[#666] truncate hover:!underline hover:!text-[#3A88EF]"
                                                                    >
                                                                        {entry.label}
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        )
                                    })()
                                ) : null}

                                {isMotorsTarget && hoveredSlug === slug ? (
                                    (() => {
                                        const hoveredMotorsItems = motorsMenu.rightItems[hoveredMotorsKey] || []
                                        const hasMotorsRightPane =
                                            hoveredMotorsItems.length > 0 && !MOTORS_NO_RIGHT_PANE_KEYS.has(hoveredMotorsKey)
                                        return (
                                            <div
                                                className={`absolute start-0 top-[34px] z-[200] rounded-[6px] border border-[rgba(143,143,143,0.24)] bg-white shadow-[0_10px_24px_rgba(0,0,0,0.14)] overflow-hidden max-sm:hidden ${hasMotorsRightPane ? 'w-[860px]' : 'w-[260px]'
                                                    }`}
                                                onMouseEnter={cancelHoverClose}
                                                onMouseLeave={scheduleHoverClose}
                                                onClick={handleCategoryMenuLinkClick}
                                            >
                                                <div className={hasMotorsRightPane ? 'grid grid-cols-[260px_1fr]' : 'block'}>
                                                    <div className="bg-[#fff] border-e border-[rgba(143,143,143,0.2)]">
                                                        {motorsMenu.leftItems.map((item) => (
                                                            <Link
                                                                href={getMotorsVerticalHref(item)}
                                                                key={item.key}
                                                                onMouseEnter={() => setHoveredMotorsKey(item.key)}
                                                                className={`cursor-pointer p-[8px_14px] text-[14px] leading-[20px] flex items-center gap-[8px] ${item.key === hoveredMotorsKey
                                                                    ? "text-[#000] font-[Inter-SemiBold] bg-[#F5F5F5]"
                                                                    : "text-[#23262A] font-[Inter-Regular]"
                                                                    }`}
                                                            >
                                                                {item.label}
                                                                {isNewTagEnabled(item) ? (
                                                                    <span className="h-[20px] px-[7px] rounded-full bg-[#DC0000] text-white text-[10px] font-[Inter-Bold] leading-[20px] uppercase">
                                                                        New
                                                                    </span>
                                                                ) : null}
                                                            </Link>
                                                        ))}
                                                        <Link href="/sellmycar"
                                                            className="cursor-pointer m-[10px] rounded-[8px] bg-[#e8eaf6] px-[14px] flex items-center justify-between"
                                                            onMouseEnter={() => setHoveredMotorsKey("motors_services")}
                                                        >
                                                            <p className="text-[14px] leading-[32px] font-[Inter-SemiBold] text-[#000]">Sell My Car</p>
                                                            <Image src={sellcar} alt="sellcar" width={60} height={45} className="w-[60px] h-[45px]" />
                                                        </Link>
                                                        <div
                                                            className="px-[10px] pb-[10px] border-t border-[rgba(143,143,143,0.2)]"
                                                            onMouseEnter={() => setHoveredMotorsKey("motors_services")}
                                                        >
                                                            <p className="pt-[10px] text-[14px] font-[Inter-SemiBold] text-[#000]">Services by ebozor cars</p>
                                                            <div className="mt-[10px] flex items-center gap-[8px] flex-wrap">
                                                                <Link href="/inception" className="p-[6px_10px] rounded-[6px] bg-[#FFEAEA] text-[#000] text-[12px] font-[Inter-Regular]">
                                                                    Car Inspection
                                                                </Link>
                                                                <Link href="/carfinance" className="p-[6px_10px] rounded-[6px] bg-[#E9F3FF] text-[#000] text-[12px] font-[Inter-Regular]">
                                                                    Car Finance
                                                                </Link>
                                                                 <Link href="/carevaluation" className="p-[6px_10px] rounded-[6px] bg-[#FFF2D9] text-[#000] text-[12px] font-[Inter-Regular]">
                                                                    Car Evaluation
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {hasMotorsRightPane ? (
                                                        <div className="bg-[#F5F5F5]">
                                                            <div className="p-[10px] border-b border-[rgba(143,143,143,0.2)] mb-[14px] flex items-center justify-between">
                                                                <h4 className="text-[14px] font-[Inter-SemiBold] text-[#000]">
                                                                    {motorsMenu.leftItems.find((x) => x.key === hoveredMotorsKey)?.label || "Motors"}
                                                                </h4>
                                                                <div className="cursor-pointer flex items-center gap-[4px]">
                                                                    <p className="text-[12px] leading-[20px] font-[Inter-SemiBold] text-[#DC0000] flex items-center gap-[4px]">
                                                                        View All
                                                                    </p>
                                                                    <CategoryIcon className="w-[16px] h-[16px]" />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-x-[24px] gap-y-[8px] px-[14px] py-[8px] max-h-[500px] overflow-y-auto">
                                                                {hoveredMotorsItems.map((entry, ri) => {
                                                                    const verticalMenuItem =
                                                                        motorsMenu.leftItems.find((x) => x.key === hoveredMotorsKey) || {
                                                                            label: "Motors",
                                                                        };
                                                                    const isString = typeof entry === "string";
                                                                    const label = isString ? entry : entry?.label;
                                                                    const rowKey = isString
                                                                        ? `${String(label)}-${ri}`
                                                                        : `${entry?.slug || ""}-${ri}`;
                                                                    return (
                                                                        <Link
                                                                            href={getMotorsMakeOrSubHref(verticalMenuItem, entry)}
                                                                            key={rowKey}
                                                                            className="text-[14px] leading-[20px] font-[Inter-Regular] !text-[#666] truncate hover:!underline hover:!text-[#3A88EF]"
                                                                        >
                                                                            {label}
                                                                        </Link>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        )
                                    })()
                                ) : null}

                                {isCommunityTarget && hoveredSlug === slug ? (
                                    <div
                                        className="absolute end-0 top-[34px] z-[200] w-[260px] rounded-[6px] border border-[rgba(143,143,143,0.24)] bg-white shadow-[0_10px_24px_rgba(0,0,0,0.14)] overflow-hidden max-sm:hidden"
                                        onMouseEnter={cancelHoverClose}
                                        onMouseLeave={scheduleHoverClose}
                                        onClick={handleCategoryMenuLinkClick}
                                    >
                                        <div className="bg-[#fff]">
                                            <div className="grid gap-[8px] max-h-[380px] overflow-y-auto overflow-x-hidden">
                                                {COMMUNITY_MENU_ITEMS.map((item) => (
                                                    <Link href={getMegaProductsHref("community", item)} key={item} className="p-[6px_14px] text-[14px] leading-[20px] font-[Inter-Regular] !text-[#666] truncate hover:!underline hover:!text-[#3A88EF]">
                                                        {item}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                {isJobsTarget && hoveredSlug === slug ? (
                                    (() => {
                                        const hoveredJobsItems = jobsMenu.rightItems[hoveredJobsKey] || []
                                        const hasJobsRightPane = hoveredJobsItems.length > 0
                                        return (
                                            <div
                                                className={`absolute start-[-200px] top-[34px] z-[200] rounded-[6px] border border-[rgba(143,143,143,0.24)] bg-white shadow-[0_10px_24px_rgba(0,0,0,0.14)] overflow-hidden max-sm:hidden ${hasJobsRightPane ? 'w-[660px]' : 'w-[250px]'}`}
                                                onMouseEnter={cancelHoverClose}
                                                onMouseLeave={scheduleHoverClose}
                                                onClick={handleCategoryMenuLinkClick}
                                            >
                                                <div className={hasJobsRightPane ? 'grid grid-cols-[250px_1fr]' : 'block'}>
                                                    <div className={`bg-[#fff] max-h-[440px] overflow-y-auto flex flex-col ${hasJobsRightPane ? 'border-e border-[rgba(143,143,143,0.2)]' : ''}`}>
                                                        {jobsMenu.leftItems.map((item, idx) =>
                                                            item.section ? (
                                                                <h4
                                                                    key={`${item.label}-${idx}`}
                                                                    className="p-[6px_14px] text-[14px] font-[Inter-SemiBold] text-[#000]"
                                                                >
                                                                    {item.label}
                                                                </h4>
                                                            ) : (
                                                                <Link
                                                                    href={(() => {
                                                                        const raw = item.key
                                                                        const mappedSlug = jobsMenu.parentSlugByKey?.[raw]
                                                                        const mappedLabel = jobsMenu.parentLabelByKey?.[raw]
                                                                        // Left column: item = API parent name, slug = grandparent slug, no category_slug
                                                                        return getJobsMenuHref(
                                                                            mappedLabel || item.label,
                                                                            mappedSlug || "",
                                                                            item.label,
                                                                            {}
                                                                        )
                                                                    })()}
                                                                    key={`${item.label}-${idx}`}
                                                                    onMouseEnter={() => {
                                                                        if (item.key) setHoveredJobsKey(item.key);
                                                                    }}
                                                                    className={`  cursor-pointer p-[6px_14px] text-[14px] font-[Inter-Regular]  ${item.key === hoveredJobsKey
                                                                        ? "hover:text-[#3A88EF] hover:bg-[#F5F5F5]"
                                                                        : "text-[#000]"
                                                                        }`}
                                                                >
                                                                    {item.label}
                                                                </Link>
                                                            )
                                                        )}
                                                    </div>
                                                    {hasJobsRightPane ? (
                                                        <div className="bg-[#F5F5F5] ">
                                                            <div className="p-[10px] border-b border-[rgba(143,143,143,0.2)] mb-[14px] flex items-center justify-between">
                                                                <h4 className="text-[14px] font-[Inter-SemiBold] text-[#000]">
                                                                    {jobsMenu.leftItems.find((x) => x.key === hoveredJobsKey)?.label || "Jobs"}
                                                                </h4>
                                                                <div className="cursor-pointer flex items-center gap-[4px]">
                                                                    <p className="text-[12px] leading-[20px] font-[Inter-SemiBold] text-[#DC0000] flex items-center gap-[4px]">
                                                                        View All
                                                                    </p>
                                                                    <CategoryIcon className="w-[16px] h-[16px]" />

                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-x-[24px] gap-y-[8px] px-[14px] py-[8px]">
                                                                {hoveredJobsItems.map((entry, ri) => {
                                                                    const isString = typeof entry === "string"
                                                                    const label = isString ? entry : entry?.label
                                                                    const leafSlug = isString ? undefined : entry?.slug
                                                                    const rowKey = isString ? `${String(label)}-${ri}` : `${entry?.slug || ""}-${ri}`
                                                                    const leftLabel = jobsMenu.leftItems.find((x) => x.key === hoveredJobsKey)?.label
                                                                    const rawParentKey = String(hoveredJobsKey || defaultJobsHoverKey || "")
                                                                    // For the legacy (non-API) mega-menu, left keys are like `jobs_by_categories`.
                                                                    // The listing expects a slug-like parent key, so normalize to `jobs-by-categories`.
                                                                    const normalizedParentKey = rawParentKey.includes("_")
                                                                        ? rawParentKey.toLowerCase().replace(/_/g, "-")
                                                                        : rawParentKey
                                                                    const parentItemKey =
                                                                        jobsMenu.parentSlugByKey?.[rawParentKey] ||
                                                                        normalizedParentKey
                                                                    const parentItemLabel =
                                                                        jobsMenu.parentLabelByKey?.[rawParentKey] ||
                                                                        leftLabel ||
                                                                        "Jobs"
                                                                    const groupKey = String(rawParentKey || "").trim()
                                                                    const leafValue =
                                                                        leafSlug ||
                                                                        (typeof label === "string"
                                                                            ? label
                                                                                .toLowerCase()
                                                                                .replace(/&/g, "and")
                                                                                .replace(/[^a-z0-9]+/g, "-")
                                                                                .replace(/(^-|-$)/g, "")
                                                                            : "")

                                                                    const normGroupKey = groupKey
                                                                        .toLowerCase()
                                                                        .replace(/[\s-]+/g, "_")
                                                                        .replace(/_+/g, "_")
                                                                        .trim()

                                                                    const isCategoryGroup =
                                                                        normGroupKey.includes("category") ||
                                                                        normGroupKey.includes("categories") ||
                                                                        /_by_categories?$/.test(normGroupKey)
                                                                    const isTypeGroup =
                                                                        normGroupKey.includes("type") ||
                                                                        /_by_types?$/.test(normGroupKey)
                                                                    const isQualificationGroup =
                                                                        normGroupKey.includes("qualification") ||
                                                                        normGroupKey.includes("education") ||
                                                                        /_by_qualifications?$/.test(normGroupKey)

                                                                    const extra = isCategoryGroup
                                                                        ? { category_slug: leafValue }
                                                                        : isTypeGroup
                                                                            ? { employment_type: leafValue }
                                                                            : isQualificationGroup
                                                                                ? { education: leafValue }
                                                                                : {}
                                                                    return (
                                                                        <Link
                                                                            href={getJobsMenuHref(
                                                                                parentItemLabel,
                                                                                parentItemKey,
                                                                                leftLabel,
                                                                                extra
                                                                            )}
                                                                            key={rowKey}
                                                                            className="text-[14px] leading-[20px] font-[Inter-Regular] !text-[#666] truncate hover:!underline hover:!text-[#3A88EF]"
                                                                        >
                                                                            {label}
                                                                        </Link>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        )
                                    })()
                                ) : null}

                                {isClassifiedsTarget && hoveredSlug === slug ? (
                                    (() => {
                                        const hoveredClassifiedItems = classifiedsMenu.rightItems[hoveredClassifiedsKey] || []
                                        const hasClassifiedRightPane = hoveredClassifiedItems.length > 0
                                        return (
                                            <div
                                                className={`absolute start-0 top-[34px] z-[200] rounded-[6px] border border-[rgba(143,143,143,0.24)] bg-white shadow-[0_10px_24px_rgba(0,0,0,0.14)] overflow-hidden max-sm:hidden ${hasClassifiedRightPane ? 'w-[660px]' : 'w-[250px]'}`}
                                                onMouseEnter={cancelHoverClose}
                                                onMouseLeave={scheduleHoverClose}
                                                onClick={handleCategoryMenuLinkClick}
                                            >
                                                <div className={hasClassifiedRightPane ? 'grid grid-cols-[250px_1fr]' : 'block'}>
                                                    <div className={`bg-[#fff] max-h-[440px] overflow-y-auto flex flex-col ${hasClassifiedRightPane ? 'border-e border-[rgba(143,143,143,0.2)]' : ''}`}>
                                                        {classifiedsMenu.leftItems.map((item) => (
                                                            <Link
                                                                href={getMegaProductsHref("classified", item.key)}
                                                                key={item.key}
                                                                onMouseEnter={() => setHoveredClassifiedsKey(item.key)}
                                                                className={`cursor-pointer p-[6px_14px] text-[14px] font-[Inter-Regular] ${item.key === hoveredClassifiedsKey
                                                                    ? "text-[#2167D9] font-[Inter-SemiBold] bg-[#F5F5F5]"
                                                                    : "text-[#000]"
                                                                    }`}
                                                            >
                                                                {item.label}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                    {hasClassifiedRightPane ? (
                                                        <div className="bg-[#F5F5F5]">
                                                            <div className="p-[10px] border-b border-[rgba(143,143,143,0.2)] mb-[14px] flex items-center justify-between">
                                                                <h4 className="text-[14px] font-[Inter-SemiBold] text-[#000]">
                                                                    {classifiedsMenu.leftItems.find((x) => x.key === hoveredClassifiedsKey)?.label || "Classifieds"}
                                                                </h4>
                                                                <div className="cursor-pointer flex items-center gap-[4px]">
                                                                    <p className="text-[12px] leading-[20px] font-[Inter-SemiBold] text-[#DC0000] flex items-center gap-[4px]">
                                                                        View All
                                                                    </p>
                                                                    <CategoryIcon className="w-[16px] h-[16px]" />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-x-[24px] gap-y-[8px] px-[14px] py-[8px] max-h-[380px] overflow-y-auto">
                                                                {hoveredClassifiedItems.map((item) => (
                                                                    <Link
                                                                        href={getMegaProductsHref("classified", item.label, item.slug || undefined)}
                                                                        key={item.slug || item.label}
                                                                        className="text-[14px] leading-[20px] font-[Inter-Regular] !text-[#666] truncate hover:!underline hover:!text-[#3A88EF]"
                                                                    >
                                                                        {item.label}
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        )
                                    })()
                                ) : null}

                                {isFurnitureTarget && hoveredSlug === slug ? (
                                    (() => {
                                        const hoveredFurnitureItems = furnitureMenu.rightItems[hoveredFurnitureKey] || []
                                        const hasFurnitureRightPane = hoveredFurnitureItems.length > 0
                                        return (
                                            <div
                                                className={`absolute start-[-300px] top-[34px] z-[200] rounded-[6px] border border-[rgba(143,143,143,0.24)] bg-white shadow-[0_10px_24px_rgba(0,0,0,0.14)] overflow-hidden max-sm:hidden ${hasFurnitureRightPane ? 'w-[660px]' : 'w-[250px]'}`}
                                                onMouseEnter={cancelHoverClose}
                                                onMouseLeave={scheduleHoverClose}
                                                onClick={handleCategoryMenuLinkClick}
                                            >
                                                <div className={hasFurnitureRightPane ? 'grid grid-cols-[250px_1fr]' : 'block'}>
                                                    <div className={`bg-[#fff] max-h-[440px] flex flex-col overflow-y-auto ${hasFurnitureRightPane ? 'border-e border-[rgba(143,143,143,0.2)]' : ''}`}>
                                                        {furnitureMenu.leftItems.map((item) => (
                                                            <Link
                                                                href={getMegaProductsHref("classified", item.key)}
                                                                key={item.key}
                                                                onMouseEnter={() => setHoveredFurnitureKey(item.key)}
                                                                className={`cursor-pointer block w-full truncate p-[6px_14px] text-[14px] ${item.key === hoveredFurnitureKey
                                                                    ? "text-[#000] font-[Inter-SemiBold] bg-[#F5F5F5]"
                                                                    : "text-[#000] font-[Inter-Regular]"
                                                                    }`}
                                                            >
                                                                {item.label}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                    {hasFurnitureRightPane ? (
                                                        <div className="bg-[#F5F5F5]">
                                                            <div className="p-[10px] border-b border-[rgba(143,143,143,0.2)] mb-[14px] flex items-center justify-between">
                                                                <h4 className="text-[14px] font-[Inter-SemiBold] text-[#000]">
                                                                    {furnitureMenu.leftItems.find((x) => x.key === hoveredFurnitureKey)?.label || "Furniture"}
                                                                </h4>
                                                                <div className="cursor-pointer flex items-center gap-[4px]">
                                                                    <p className="text-[12px] leading-[20px] font-[Inter-SemiBold] text-[#DC0000]">View All</p>
                                                                    <CategoryIcon className="w-[16px] h-[16px]" />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-x-[24px] gap-y-[8px] px-[14px] py-[8px] max-h-[380px] overflow-y-auto">
                                                                {hoveredFurnitureItems.map((item) => (
                                                                    <Link
                                                                        href={getMegaProductsHref("classified", item.label, item.slug || undefined)}
                                                                        key={item.slug || item.label}
                                                                        className="text-[14px] leading-[20px] font-[Inter-Regular] !text-[#666] truncate hover:!underline hover:!text-[#3A88EF]"
                                                                    >
                                                                        {item.label}
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        )
                                    })()
                                ) : null}

                                {isMobilesTarget && hoveredSlug === slug ? (
                                    (() => {
                                        const hoveredMobileItems = mobileMenu.rightItems[hoveredMobileKey] || []
                                        const hasMobileRightPane = hoveredMobileItems.length > 0
                                        return (
                                            <div
                                                className={`absolute start-[-490px] top-[34px] z-[200] rounded-[6px] border border-[rgba(143,143,143,0.24)] bg-white shadow-[0_10px_24px_rgba(0,0,0,0.14)] overflow-hidden max-sm:hidden ${hasMobileRightPane ? 'w-[660px]' : 'w-[250px]'}`}
                                                onMouseEnter={cancelHoverClose}
                                                onMouseLeave={scheduleHoverClose}
                                                onClick={handleCategoryMenuLinkClick}
                                            >
                                                <div className={hasMobileRightPane ? 'grid grid-cols-[250px_1fr]' : 'block'}>
                                                    <div className={`bg-[#fff] max-h-[440px] overflow-y-auto flex flex-col ${hasMobileRightPane ? 'border-e border-[rgba(143,143,143,0.2)]' : ''}`}>
                                                        {mobileMenu.leftItems.map((item) => (
                                                            <Link
                                                                href={getMegaProductsHref("classified", item.key)}
                                                                key={item.key}
                                                                onMouseEnter={() => setHoveredMobileKey(item.key)}
                                                                className={`cursor-pointer block w-full truncate p-[6px_14px] text-[14px] ${item.key === hoveredMobileKey
                                                                    ? "text-[#000] font-[Inter-SemiBold] bg-[#F5F5F5]"
                                                                    : "text-[#000] font-[Inter-Regular]"
                                                                    }`}
                                                            >
                                                                {item.label}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                    {hasMobileRightPane ? (
                                                        <div className="bg-[#F5F5F5]">
                                                            <div className="p-[10px] border-b border-[rgba(143,143,143,0.2)] mb-[14px] flex items-center justify-between">
                                                                <h4 className="text-[14px] font-[Inter-SemiBold] text-[#000]">
                                                                    {mobileMenu.leftItems.find((x) => x.key === hoveredMobileKey)?.label || "Mobile Phones"}
                                                                </h4>
                                                                <div className="cursor-pointer flex items-center gap-[4px]">
                                                                    <p className="text-[12px] leading-[20px] font-[Inter-SemiBold] text-[#DC0000]">View All</p>
                                                                    <CategoryIcon className="w-[16px] h-[16px]" />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-x-[24px] gap-y-[8px] px-[14px] py-[8px] max-h-[380px] overflow-y-auto">
                                                                {hoveredMobileItems.map((item) => (
                                                                    <Link
                                                                        href={getMegaProductsHref("classified", item.label, item.slug || undefined)}
                                                                        key={item.slug || item.label}
                                                                        className="text-[14px] leading-[20px] font-[Inter-Regular] !text-[#666] truncate hover:!underline hover:!text-[#3A88EF]"
                                                                    >
                                                                        {item.label}
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        )
                                    })()
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
export default HeaderCategories
