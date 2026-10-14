import React, { useEffect, useMemo, useState } from "react";
import { t } from "@/utils";
import { getPopularCategoriesApi } from "@/utils/api";
import Link from "next/link";
import Image from "next/image";
import { placeholderImage } from "@/utils";
import { CategoryIcon } from "../CustomFile/icons";
import { getMotorsMenuItemPath, MOTORS_LISTING_PATH_TO_QUERY } from "@/utils/motorsListingPaths";
import { getJobsMenuHref } from "@/utils/jobsListingContext";

const PopularCategories = () => {
  const [apiCategories, setApiCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const FALLBACK_ICON = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

  const parseApiPayload = (payload) => {
    if (typeof payload === "string") {
      const scriptIndex = payload.indexOf("<script");
      const jsonText = scriptIndex >= 0 ? payload.slice(0, scriptIndex).trim() : payload.trim();
      if (!jsonText) return {};
      try {
        return JSON.parse(jsonText);
      } catch (error) {
        console.error("Popular categories JSON parse failed:", error);
        return {};
      }
    }
    return payload || {};
  };

  const normalizeLabel = (node) => node?.translated_name || node?.name || "";
  const slugifyLabel = (value = "") =>
    String(value)
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  const getCategoryBySlug = (slug) => apiCategories.find((x) => x?.slug === slug);
  const resolveSectionImage = (node, fallbackNode, allowParentFallback = true) => {
    const nodeImage = node?.image;
    if (nodeImage) return nodeImage;

    const nodeChildImage = (node?.subcategories || []).find((x) => x?.image)?.image;
    if (nodeChildImage) return nodeChildImage;

    if (!allowParentFallback) return "";

    const fallbackImage = fallbackNode?.image;
    if (fallbackImage) return fallbackImage;

    return (fallbackNode?.subcategories || []).find((x) => x?.image)?.image || "";
  };
  const toItems = (list = []) =>
    (Array.isArray(list) ? list : [])
      .slice(0, 4)
      .map((x) => ({
        id: x?.id,
        slug: x?.slug,
        name: normalizeLabel(x),
      }));
  const getMegaProductsHref = (mode, itemLabel, slugOverride) =>
    `/products?mode=${encodeURIComponent(mode)}&item=${encodeURIComponent(itemLabel)}&category_slug=${encodeURIComponent(
      slugOverride || slugifyLabel(itemLabel)
    )}`;
  const getPopularSubcategoryHref = (cat, sub) => {
    const sectionSlug = String(cat?.slug || "").toLowerCase();
    const subLabel = sub?.name || "";
    const subSlug = sub?.slug || "";
    const isNewProjectsSubcategory =
      subSlug.toLowerCase().includes("new-project") || subLabel.toLowerCase().includes("new project");

    if (sectionSlug === "property-for-rent" || sectionSlug === "property-for-sale") {
      const purpose = sectionSlug.includes("sale") ? "sale" : "rent";
      if (purpose === "sale" && isNewProjectsSubcategory) {
        const newProjectsSlug = subSlug || slugifyLabel(subLabel) || "all-new-projects";
        return `/products?mode=property&segment=new_projects&purpose=sale&item=${encodeURIComponent(
          "All New Projects"
        )}&category_slug=${encodeURIComponent(newProjectsSlug)}&slug=${encodeURIComponent(newProjectsSlug)}`;
      }
      return `/products?mode=property&item=${encodeURIComponent(
        sectionSlug
      )}&purpose=${encodeURIComponent(purpose)}&propertyType=${encodeURIComponent(
        subLabel
      )}&category_slug=${encodeURIComponent(subSlug || slugifyLabel(subLabel))}`;
    }

    if (sectionSlug === "jobs") {
      return getJobsMenuHref("Jobs Seekers", "jobs-jobs-seekers", "Jobs by Categories", {
        category_slug: subSlug || slugifyLabel(subLabel),
      });
    }

    if (sectionSlug === "motors" || sectionSlug === "auto-accessories-parts" || sectionSlug === "heavy-vehicles") {
      const menuItemForVertical = { key: subSlug, label: subLabel };
      const listingPath = getMotorsMenuItemPath(menuItemForVertical);
      const mappedSlug = listingPath ? MOTORS_LISTING_PATH_TO_QUERY[listingPath]?.slug : "";
      const categorySlug = mappedSlug || subSlug || slugifyLabel(subLabel);
      if (listingPath) {
        return `${listingPath}?category_slug=${encodeURIComponent(categorySlug)}`;
      }
      return getMegaProductsHref("motors", subLabel, categorySlug);
    }

    return getMegaProductsHref("classified", subLabel, subSlug || undefined);
  };
  const getPopularCategoryHref = (cat) => {
    const sectionSlug = String(cat?.slug || "").toLowerCase();
    const sectionLabel = cat?.translated_name || cat?.name || "";

    if (sectionSlug === "property-for-rent" || sectionSlug === "property-for-sale") {
      const purpose = sectionSlug.includes("sale") ? "sale" : "rent";
      return `/products?mode=property&item=${encodeURIComponent(sectionSlug)}&purpose=${encodeURIComponent(purpose)}`;
    }

    if (sectionSlug === "jobs") {
      return getJobsMenuHref("Jobs Seekers", "jobs-jobs-seekers", "Jobs by Categories");
    }

    if (sectionSlug === "motors" || sectionSlug === "auto-accessories-parts" || sectionSlug === "heavy-vehicles") {
      const menuItemForVertical = { key: sectionSlug, label: sectionLabel };
      const listingPath = getMotorsMenuItemPath(menuItemForVertical);
      const mappedSlug = listingPath ? MOTORS_LISTING_PATH_TO_QUERY[listingPath]?.slug : "";
      const categorySlug = mappedSlug || sectionSlug || slugifyLabel(sectionLabel);
      if (listingPath) {
        return `${listingPath}?category_slug=${encodeURIComponent(categorySlug)}`;
      }
      return getMegaProductsHref("motors", sectionLabel || "Motors", categorySlug);
    }

    return getMegaProductsHref("classified", sectionLabel, sectionSlug || undefined);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchPopularCategories = async () => {
      setIsLoading(true);
      try {
        const response = await getPopularCategoriesApi.getPopularCategories();
        const parsed = parseApiPayload(response?.data);
        const list = Array.isArray(parsed?.data) ? parsed?.data : [];
        if (isMounted) {
          setApiCategories(list);
        }
      } catch (error) {
        console.error("Failed to fetch popular categories:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    fetchPopularCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const cateData = useMemo(() => {
    const motors = getCategoryBySlug("motors");
    const motorsCars = motors?.subcategories?.find((x) => x?.slug === "cars");
    const property = getCategoryBySlug("property");
    const classified = getCategoryBySlug("classified");
    const jobs = getCategoryBySlug("jobs");
    const jobsSeekers = jobs?.subcategories?.find((x) => x?.slug === "jobs-jobs-seekers");
    const jobsByCategories = jobsSeekers?.subcategories?.find((x) => x?.slug === "jobs-jobs-seekers-jobs-by-categories");

    const propertyForRent = property?.subcategories?.find((x) => x?.slug === "property-for-rent");
    const propertyForSale = property?.subcategories?.find((x) => x?.slug === "property-for-sale");

    const classifiedHomeAppliances = classified?.subcategories?.find((x) => x?.slug === "classified-home-appliances");
    const classifiedFurniture = classified?.subcategories?.find((x) => x?.slug === "classified-furniture-home-garden");
    const classifiedMobiles = classified?.subcategories?.find((x) => x?.slug === "classified-mobile-phones-tablets");

    const autoAccessories = motors?.subcategories?.find((x) => x?.slug === "auto-accessories-parts");
    const heavyVehicles = motors?.subcategories?.find((x) => x?.slug === "heavy-vehicles");

    const sections = [
      {
        id: motors?.id || "motors",
        slug: motors?.slug || "motors",
        image: resolveSectionImage(motorsCars, motors),
        translated_name: normalizeLabel(motors) || "Motors",
        subcategories: toItems(motorsCars?.subcategories),
      },
      {
        id: propertyForRent?.id || "property-for-rent",
        slug: propertyForRent?.slug || "property-for-rent",
        image: resolveSectionImage(propertyForRent, property, false),
        translated_name: "Property for Rent",
        subcategories: toItems(propertyForRent?.subcategories),
      },
      {
        id: propertyForSale?.id || "property-for-sale",
        slug: propertyForSale?.slug || "property-for-sale",
        image: resolveSectionImage(propertyForSale, property, false),
        translated_name: "Property for Sale",
        subcategories: toItems(propertyForSale?.subcategories),
      },
      {
        id: classified?.id || "classified",
        slug: classified?.slug || "classified",
        image: resolveSectionImage(classified),
        translated_name: normalizeLabel(classified) || "Classifieds",
        subcategories: toItems((classified?.subcategories || []).filter((x) => x?.slug !== "classified-home-appliances")),
      },
      {
        id: classifiedHomeAppliances?.id || "classified-home-appliances",
        slug: classifiedHomeAppliances?.slug || "classified-home-appliances",
        image: resolveSectionImage(classifiedHomeAppliances, classified, false),
        translated_name: "Home Appliances",
        subcategories: toItems(classifiedHomeAppliances?.subcategories),
      },
      {
        id: classifiedFurniture?.id || "classified-furniture-home-garden",
        slug: classifiedFurniture?.slug || "classified-furniture-home-garden",
        image: resolveSectionImage(classifiedFurniture, classified, false),
        translated_name: "Furniture, Home & Garden",
        subcategories: toItems(classifiedFurniture?.subcategories),
      },
      {
        id: classifiedMobiles?.id || "classified-mobile-phones-tablets",
        slug: classifiedMobiles?.slug || "classified-mobile-phones-tablets",
        image: resolveSectionImage(classifiedMobiles, classified, false),
        translated_name: "Mobile Phones & Tablets",
        subcategories: toItems(classifiedMobiles?.subcategories),
      },
      {
        id: autoAccessories?.id || "auto-accessories-parts",
        slug: autoAccessories?.slug || "auto-accessories-parts",
        image: resolveSectionImage(autoAccessories, motors, false),
        translated_name: "Auto Accessories & Parts",
        subcategories: toItems(autoAccessories?.subcategories),
      },
      {
        id: heavyVehicles?.id || "heavy-vehicles",
        slug: heavyVehicles?.slug || "heavy-vehicles",
        image: resolveSectionImage(heavyVehicles, motors, false),
        translated_name: "Heavy Vehicles",
        subcategories: toItems(heavyVehicles?.subcategories),
      },
      {
        id: jobs?.id || "jobs",
        slug: jobs?.slug || "jobs",
        image: jobs?.image || "",
        translated_name: normalizeLabel(jobs) || "Jobs",
        subcategories: toItems(jobsByCategories?.subcategories),
      },
    ];

    return sections.filter((x) => Array.isArray(x?.subcategories) && x.subcategories.length > 0);
  }, [apiCategories]);

  return (
      <div className="w-full mx-auto">
        <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
          {!isLoading && cateData?.length > 0 &&
            <div className="mb-[20px]">
              <div className="mb-[14px]">
                <h4 className="text-[24px] font-[Inter-SemiBold] text-[#000000]">{t('popularCategories')}</h4>
              </div>
              <div className="grid grid-cols-5 gap-[15px] max-sm:grid-cols-3 max-sm:gap-[4px_10px]">
                {cateData.map((cat) => (
                  <div key={cat?.id}>
                    <div className="max-sm:flex-col max-sm:justify-center flex items-center gap-[5px] mb-[14px] max-sm:shadow-[0_2px_8px_0_rgba(0,0,0,0.2)] max-sm:h-[110px] max-sm:rounded-[8px]">
                      <div>
                        <Image src={cat?.image || FALLBACK_ICON} alt={cat?.translated_name} width={16} height={16} className='w-[16px] h-[16px]' onErrorCapture={placeholderImage} />
                      </div>
                      <h4 className="text-[16px] font-[Inter-SemiBold] text-[#000000] max-sm:text-center max-sm:text-[12px] max-sm:whitespace-normal max-sm:overflow-visible max-sm:text-clip max-sm:break-all truncate max-sm:w-[74px]">{cat?.translated_name}</h4>
                    </div>
                    <ul className="max-sm:hidden flex flex-col gap-[10px] mb-[10px]">
                      {cat?.subcategories?.map((sub) => (
                        <li key={sub?.id}>
                          <Link href={getPopularSubcategoryHref(cat, sub)} prefetch={false} className="">
                            <h4 className="text-[12px] font-[Inter-Regular] text-[#000000]">
                              {sub?.translated_name || sub?.name}
                            </h4>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link href={getPopularCategoryHref(cat)} prefetch={false} className="max-sm:hidden ">
                      <div className="flex items-center gap-[6px]">
                        <h4 className="text-[14px] font-[Inter-Regular] text-[#DC0000] truncate">
                          {t('seeAllIn')} {cat?.translated_name}
                        </h4>
                        <CategoryIcon className="w-[16px] h-[16px]" />
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          }
        </div>
      </div>
  );
};

export default PopularCategories;