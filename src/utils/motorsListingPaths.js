/**
 * Clean listing URLs for motors mega-menu verticals (HeaderCategories).
 * Query shape matches `/products?mode=&item=&slug=` used by MotorsCard / API.
 */
export const MOTORS_LISTING_PATH_TO_QUERY = {
    "/usedcars": { mode: "motors", item: "Used Cars", slug: "used-cars" },
    "/newcars": { mode: "motors", item: "New Cars", slug: "new-cars" },
    "/rentalcars": { mode: "motors", item: "Rental Cars", slug: "rental-cars" },
    "/exportcars": { mode: "motors", item: "Export Cars", slug: "export-cars" },
    "/motorcycles": { mode: "motors", item: "Motorcycles", slug: "motorcycles" },
    "/autoaccessories": { mode: "motors", item: "Auto Accessories & Parts", slug: "auto-accessories-and-parts" },
    "/numberplates": { mode: "motors", item: "Number Plates", slug: "number-plates" },
    "/boats": { mode: "motors", item: "Boats", slug: "boats" },
    "/vehicles": { mode: "motors", item: "Heavy Vehicles", slug: "heavy-vehicles" },
};

const normalizeMenuKey = (key) => String(key || "").toLowerCase().replace(/-/g, "_");

/** Static MOTORS_LEFT_KEYS + typical API slug forms → path */
const MOTORS_MENU_KEY_TO_PATH = {
    used_cars: "/usedcars",
    new_cars: "/newcars",
    rental_cars: "/rentalcars",
    export_cars: "/exportcars",
    motorcycles: "/motorcycles",
    auto_accessories_parts: "/autoaccessories",
    heavy_vehicles: "/vehicles",
    boats: "/boats",
    number_plates: "/numberplates",
};

/**
 * @param {string} pathname — from usePathname(), e.g. /usedcars
 * @returns {{ mode: string, item: string, slug: string } | null}
 */
export function getMotorsListingQueryFromPathname(pathname) {
    if (!pathname) return null;
    const key = pathname.replace(/\/$/, "") || "";
    return MOTORS_LISTING_PATH_TO_QUERY[key] ?? null;
}

const MOTORS_CAR_LISTING_PATHS = new Set(["/usedcars", "/newcars", "/exportcars", "/rentalcars"]);

/**
 * True when the motors mega-menu left item is a **cars** vertical (makes use `make_model` on the right pane).
 * @param {{ key?: string, label?: string }} menuItem
 */
export function isMotorsCarVerticalMenuItem(menuItem) {
    const path = getMotorsMenuItemPath(menuItem);
    if (path && MOTORS_CAR_LISTING_PATHS.has(path)) return true;
    const key = normalizeMenuKey(menuItem?.key);
    return (
        key === "used_cars" ||
        key === "new_cars" ||
        key === "export_cars" ||
        key === "rental_cars" ||
        key === "used-cars" ||
        key === "new-cars" ||
        key === "export-cars" ||
        key === "rental-cars"
    );
}

/**
 * Resolve motors mega-menu left item → listing path, or null if unknown.
 * @param {{ key?: string, label?: string }} menuItem
 */
export function getMotorsMenuItemPath(menuItem) {
    const fromKey = MOTORS_MENU_KEY_TO_PATH[normalizeMenuKey(menuItem?.key)];
    if (fromKey) return fromKey;
    const label = String(menuItem?.label || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
    const byLabel = {
        "used cars": "/usedcars",
        "new cars": "/newcars",
        "export cars": "/exportcars",
        "rental cars": "/rentalcars",
        motorcycles: "/motorcycles",
        "auto accessories & parts": "/autoaccessories",
        "heavy vehicles": "/vehicles",
        boats: "/boats",
        "number plates": "/numberplates",
    };
    return byLabel[label] || null;
}

/** Motors mega-menu vertical slug → display label for `item` query / detail context. */
const MOTORS_VERTICAL_ITEM_BY_SLUG = Object.fromEntries(
    Object.values(MOTORS_LISTING_PATH_TO_QUERY).map((meta) => [meta.slug, meta.item])
);

const MOTORS_VERTICAL_ITEM_LABELS = new Set(
    Object.values(MOTORS_LISTING_PATH_TO_QUERY).map((meta) => meta.item.toLowerCase())
);

/**
 * @param {string} slug
 * @returns {string} vertical label (e.g. "Motorcycles") or ""
 */
export function getMotorsVerticalItemByCategorySlug(slug) {
    const s = String(slug || "").trim().toLowerCase();
    if (!s) return "";
    return MOTORS_VERTICAL_ITEM_BY_SLUG[s] || "";
}

/** True when `item` is already a motors vertical label (Used Cars, Motorcycles, …). */
export function isMotorsVerticalItemLabel(label) {
    const normalized = String(label || "").trim().toLowerCase();
    if (!normalized) return false;
    return MOTORS_VERTICAL_ITEM_LABELS.has(normalized);
}

/**
 * Infer parent motors vertical from a leaf / child category slug (banner search, legacy URLs).
 * @param {string} slug
 * @returns {string}
 */
export function inferMotorsParentVerticalItemFromChildSlug(slug) {
    const direct = getMotorsVerticalItemByCategorySlug(slug);
    if (direct) return direct;

    const s = String(slug || "").trim().toLowerCase();
    if (!s) return "";

    if (/\b(bike|scooter|cruiser|touring|off-?road|moped|motorcycle)\b/.test(s)) return "Motorcycles";
    if (/\b(tyre|tire|battery|oil|fluid|body-part|car-care|audio|accessory|accessories|parts)\b/.test(s)) {
        return "Auto Accessories & Parts";
    }
    if (/\b(truck|bus|crane|trailer|forklift|heavy|construction-vehicle)\b/.test(s)) return "Heavy Vehicles";
    if (/\b(boat|yacht|jet-?ski|marine)\b/.test(s)) return "Boats";
    if (/\b(plate|number-plate)\b/.test(s)) return "Number Plates";
    if (/\b(used-car|export-car|rental-car|new-car)\b/.test(s) || s === "cars") {
        return getMotorsVerticalItemByCategorySlug(s.replace(/s$/, "")) || "";
    }

    return "";
}

/**
 * Closest motors vertical label from a slug chain (leaf → root), skipping `motors` root.
 * @param {string[]} slugs
 * @returns {string}
 */
export function inferMotorsParentVerticalItemFromSlugChain(slugs) {
    const list = (Array.isArray(slugs) ? slugs : [])
        .map((x) => String(x || "").trim().toLowerCase())
        .filter(Boolean);
    for (let i = list.length - 1; i >= 0; i -= 1) {
        const slug = list[i];
        if (slug === "motors" || slug === "motor") continue;
        const direct = getMotorsVerticalItemByCategorySlug(slug);
        if (direct) return direct;
    }
    for (let i = list.length - 1; i >= 0; i -= 1) {
        const slug = list[i];
        if (slug === "motors" || slug === "motor") continue;
        const inferred = inferMotorsParentVerticalItemFromChildSlug(slug);
        if (inferred) return inferred;
    }
    return "";
}

/**
 * `item` query for motors listings / product detail — parent vertical, not leaf subcategory name.
 * @param {{ pathname?: string, categorySlug?: string, itemParam?: string, categorySlugs?: string[] }} opts
 * @returns {string}
 */
export function resolveMotorsListingItemLabel({
    pathname = "",
    categorySlug = "",
    itemParam = "",
    categorySlugs = [],
} = {}) {
    const fromPath = getMotorsListingQueryFromPathname(pathname);
    if (fromPath?.item) return fromPath.item;

    const fromChain = inferMotorsParentVerticalItemFromSlugChain(categorySlugs);
    if (fromChain) return fromChain;

    const slug = String(categorySlug || "").trim().toLowerCase();
    const fromSlug = getMotorsVerticalItemByCategorySlug(slug);
    if (fromSlug) return fromSlug;

    const inferred = inferMotorsParentVerticalItemFromChildSlug(slug);
    if (inferred) return inferred;

    const item = String(itemParam || "").trim();
    if (item && isMotorsVerticalItemLabel(item)) return item;

    return item;
}

/**
 * Same signals as {@link MotorDetail} `buildMotorsVerticalContext` — category + URL `item` + listing meta.
 * @param {object} productData
 * @param {string} listingItemFromUrl — `item` query from `/productdetail` (e.g. "Rental Cars")
 * @returns {string} space-joined lowercase haystack
 */
export function buildMotorsVerticalContextHaystack(productData, listingItemFromUrl) {
    const parts = [];
    const rawItem = String(listingItemFromUrl || "").trim();
    if (rawItem) {
        try {
            parts.push(decodeURIComponent(rawItem));
        } catch {
            parts.push(rawItem);
        }
    }
    const pd = productData || {};
    const push = (v) => {
        if (v == null || v === "") return;
        parts.push(String(v));
    };
    push(pd.category?.translated_name);
    push(pd.category?.name);
    push(pd.category?.slug);
    push(pd.subcategory?.translated_name);
    push(pd.subcategory?.name);
    push(pd.subcategory?.slug);
    push(pd.category_name);
    push(pd.parent_category_name);
    push(pd.motors_vertical);
    push(pd.vertical);
    push(pd.listing_type);
    push(pd.purpose);
    if (Array.isArray(pd.all_category)) {
        for (const c of pd.all_category) {
            push(c?.translated_name);
            push(c?.name);
            push(c?.slug);
        }
    }
    return parts.join(" ").toLowerCase();
}

/**
 * True when the user is in the Motors **Rental Cars** mega-menu vertical (HeaderCategories `rental_cars` / `/rentalcars`),
 * or the listing/product is tagged as rental.
 */
export function isMotorsRentalCarsListingContext(productData, listingItemFromUrl) {
    const pd = productData || {};
    const lt = String(pd.listing_type || "").toLowerCase();
    const pur = String(pd.purpose || "").toLowerCase();
    if (lt === "rent" || lt === "rental") return true;
    if (pur === "rent" || pur === "rental") return true;

    const s = buildMotorsVerticalContextHaystack(productData, listingItemFromUrl);
    if (!s.trim()) return false;
    if (s.includes("rental car") || s.includes("rental_cars") || s.includes("rental-cars")) return true;
    if (
        s.includes("suv rentals") ||
        s.includes("luxury rentals") ||
        s.includes("monthly rentals") ||
        s.includes("daily rentals")
    ) {
        return true;
    }
    if (s.includes("chauffeur")) return true;
    if (s.includes("economy cars") && s.includes("rental")) return true;
    return false;
}

function normalizeMotorsTruthyFlag(...vals) {
    for (const v of vals) {
        if (v === true) return true;
        if (typeof v === "string") {
            const s = v.trim().toLowerCase();
            if (s === "1" || s === "true" || s === "yes") return true;
        }
        if (typeof v === "number" && v === 1) return true;
    }
    return false;
}

/**
 * Same flags as MotorsCard `getTagState(item).isCarOfWeek` (Car of the Week row → detail finance CTA).
 */
export function isMotorsCarOfTheWeekItem(item) {
    if (!item || typeof item !== "object") return false;
    return normalizeMotorsTruthyFlag(
        item.car_of_the_week,
        item.is_car_of_the_week,
        item.carOfTheWeek,
        item.car_of_week,
        item.isCarOfTheWeek
    );
}
