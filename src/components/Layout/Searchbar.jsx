"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IoSearchOutline } from "react-icons/io5";
import { t } from "@/utils";
import { setSearch } from "@/redux/reuducer/searchSlice";
import { SliderData } from "@/redux/reuducer/sliderSlice";
import { settingsData } from "@/redux/reuducer/settingSlice";
import homebanner from "../../../public/assets/img/homebanner.png";
import newprojectbanner from "../../../public/assets/img/newprojectbanner.png";
import bannercenter2 from "../../../public/assets/bannercenter2.png";
import Image from "next/image";
import {
  RightArrowIcon,
  SearchIcon,
  CloseIcon,
} from "@/components/CustomFile/icons";
import homebg from "../../../public/assets/img/home/homebg.png";
import { bannerSuggestionApi, getParentCategoryListApi, homepageBannerApi } from "@/utils/api";
import { getBannerImage, getImageUrl, resolveCategoryHeroBanner } from "@/utils/categoryBanner";
import { useLoginModalGuard } from "@/hooks/useLoginModalGuard";

const parseApiPayload = (payload) => {
  if (typeof payload === "string") {
    const scriptIndex = payload.indexOf("<script");
    const jsonText =
      scriptIndex >= 0 ? payload.slice(0, scriptIndex).trim() : payload.trim();
    if (!jsonText) return {};
    try {
      return JSON.parse(jsonText);
    } catch (e) {
      console.error("Searchbar parent categories parse failed:", e);
      return {};
    }
  }
  return payload || {};
};

/** Same as HeaderCategories.jsx — used for /products?mode=&item=&slug= */
const slugifyLabel = (value = "") =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Same query shape as HeaderCategories `getMegaProductsHref` (products listing, not product-details). */
const buildProductsFilterHref = (mode, itemLabel) => {
  const m = String(mode || "motors").trim() || "motors";
  const label = String(itemLabel || "").trim();
  const slug = slugifyLabel(label);
  const q = new URLSearchParams();
  q.set("mode", m);
  q.set("item", label);
  q.set("slug", slug);
  return `/products?${q.toString()}`;
};

/** Map get-parent-category-list row → `mode` query value (aligned with HeaderCategories getMegaProductsHref). */
const mapParentRowToProductsMode = (row) => {
  if (!row || typeof row !== "object") return "motors";
  const explicit = String(row.mode ?? row.products_mode ?? row.url_mode ?? "")
    .trim()
    .toLowerCase();
  if (explicit) {
    if (explicit === "classified") return "classifieds";
    return explicit;
  }
  const slug = String(row.slug ?? "")
    .trim()
    .toLowerCase();
  if (slug.includes("classified")) return "classifieds";
  if (slug.includes("motor")) return "motors";
  if (slug.includes("job")) return "jobs";
  if (slug.includes("property")) return "property";
  if (slug.includes("community")) return "community";
  if (slug.includes("furniture") || slug.includes("garden")) return "furniture";
  if (slug.includes("mobile")) return "mobiles";
  if (slug.includes("new-project") || slug.includes("newproject"))
    return "property";
  return slug || "motors";
};

const DEFAULT_FULL_BANNER = {
  title:
    "The best place in Dubai to buy a home, sell your car, or find a job.",
  banner_image: null,
};

const DEFAULT_CARD_BANNER_2 = {
  title: "Looking to sell or rent your home?",
  description: "Get started with a free home valuation and expert advice.",
  btn_text: "Get Started Now",
  btn_link: "/placeyourad",
  banner_image: null,
  position_order: 2,
};

const DEFAULT_CARD_BANNER_3 = {
  title: "Introducing New Projects",
  description: "Get Access to the Latest Property Development",
  btn_text: "Explore Now",
  btn_link: "/",
  banner_image: null,
  position_order: 3,
};

const getBtnText = (banner) =>
  banner?.btn_text ?? banner?.button_text ?? "";

const getBtnLink = (banner) =>
  banner?.btn_link ?? banner?.button_link ?? "/";

const Searchbar = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const selectedCity = useSelector((state) => state?.Location?.cityData?.city || "");
  const { requireLogin, loginModal } = useLoginModalGuard();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [parentCategoryTabs, setParentCategoryTabs] = useState([]);
  const [tabsLoading, setTabsLoading] = useState(true);
  const slider = useSelector(SliderData);
  const settings = useSelector(settingsData)?.data;
  const searchWrapRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [apiSuggestions, setApiSuggestions] = useState([]);
  const [relatedSearches, setRelatedSearches] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [homepageBanners, setHomepageBanners] = useState(null);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const searchDebounceRef = useRef(null);
  const searchReqIdRef = useRef(0);
  const prevSearchScopeRef = useRef(null);
  const latestSearchParamsRef = useRef({
    q: "",
    categoryId: null,
    city: "",
  });

  const isCategorySuggestion = (item) =>
    String(item?.suggestion_type || "").trim().toLowerCase() === "category";

  const isValidSuggestion = (item) => {
    const title = String(item?.name || item?.translated_name || "").trim();
    if (!title) return false;
    const route = item?.route;
    if (!route || typeof route !== "object") return false;
    return Object.values(route).some((val) => String(val ?? "").trim() !== "");
  };

  const formatSuggestionAdsCount = (item) => {
    const raw = item?.category?.adscount ?? item?.adscount;
    if (raw == null || raw === "") return "—";
    const n = Number(raw);
    if (Number.isNaN(n)) return "—";
    return `${n.toLocaleString()} Ads`;
  };

  const categoryTitleForItem = (item) =>
    item?.category?.translated_name || item?.category?.name || "";

  useEffect(() => {
    let cancelled = false;
    const loadBanners = async () => {
      try {
        setBannersLoading(true);
        setHomepageBanners(null);
        const response = await homepageBannerApi.getHomepageBanners(selectedCategoryId);
        const parsed = parseApiPayload(response?.data);
        if (!cancelled) {
          setHomepageBanners(parsed?.data ?? null);
        }
      } catch (e) {
        console.error("get-homepage-banners failed:", e);
        if (!cancelled) {
          setHomepageBanners(null);
        }
      } finally {
        if (!cancelled) {
          setBannersLoading(false);
        }
      }
    };
    loadBanners();
    return () => {
      cancelled = true;
    };
  }, [selectedCategoryId]);

  const handleSearchTabClick = (tab) => {
    setActiveTab(tab.id);
    setSelectedCategoryId(tab.id === "all" ? null : tab.categoryId ?? null);
    if (searchQuery.trim()) {
      setShowSearchDropdown(true);
    }
  };

  const fullBanner = homepageBanners?.full_banner;

  const cardBanners = useMemo(() => {
    const rows = homepageBanners?.card_banners;
    if (!Array.isArray(rows)) return [];
    return [...rows].sort(
      (a, b) => Number(a?.position_order ?? 0) - Number(b?.position_order ?? 0)
    );
  }, [homepageBanners]);

  const cardBanner2 = useMemo(() => {
    if (bannersLoading) return null;
    return (
      cardBanners.find((banner) => Number(banner?.position_order) === 2) ??
      DEFAULT_CARD_BANNER_2
    );
  }, [bannersLoading, cardBanners]);

  const cardBanner3 = useMemo(() => {
    if (bannersLoading) return null;
    return (
      cardBanners.find((banner) => Number(banner?.position_order) === 3) ??
      DEFAULT_CARD_BANNER_3
    );
  }, [bannersLoading, cardBanners]);

  const { heroBackground, heroTitle } = useMemo(() => {
    if (bannersLoading) {
      return { heroBackground: null, heroTitle: "" };
    }
    return resolveCategoryHeroBanner(
      fullBanner,
      homebg,
      DEFAULT_FULL_BANNER.title
    );
  }, [bannersLoading, fullBanner]);

  const handleCardBannerNavigate = (banner) => {
    const href = getBtnLink(banner);
    if (String(href).includes("placeyourad")) {
      requireLogin(() => router.push(href));
      return;
    }
    router.push(href);
  };

  const renderCardBannerImage = (banner, fallbackImage, className) => {
    const imageUrl = getImageUrl(getBannerImage(banner), null);
    if (imageUrl) {
      return (
        <img
          src={imageUrl}
          alt={banner?.title || "banner"}
          className={className}
        />
      );
    }

    return (
      <Image
        src={fallbackImage}
        alt={banner?.title || "banner"}
        width={fallbackImage === newprojectbanner ? 135 : 213}
        height={fallbackImage === newprojectbanner ? 90 : 96}
        className={className}
      />
    );
  };

  useEffect(() => {
    const onMouseDown = (e) => {
      if (!searchWrapRef.current) return;
      if (searchWrapRef.current.contains(e.target)) return;
      setShowSearchDropdown(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setTabsLoading(true);
        const response = await getParentCategoryListApi.getParentCategoryList();
        const parsed = parseApiPayload(response?.data);
        const rows = parsed?.data;
        if (!cancelled && Array.isArray(rows) && rows.length > 0) {
          setParentCategoryTabs(rows);
        } else if (!cancelled) {
          setParentCategoryTabs([]);
        }
      } catch (e) {
        console.error("get-parent-category-list failed:", e);
      } finally {
        if (!cancelled) setTabsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const searchTabs = useMemo(() => {
    return [
      { id: "all", label: "All", categoryId: null, productsMode: null },
      ...parentCategoryTabs.map((c) => ({
        id:
          String(c?.slug || "")
            .trim()
            .toLowerCase() || `id-${c?.id}`,
        label: c?.translated_name || c?.name || "",
        categoryId: c?.id != null ? Number(c.id) : null,
        productsMode: mapParentRowToProductsMode(c),
      })),
    ];
  }, [parentCategoryTabs]);

  const activeCategoryId = useMemo(() => {
    const tab = searchTabs.find((x) => x.id === activeTab);
    if (tab?.categoryId == null || tab?.categoryId === "") return null;
    return tab.categoryId;
  }, [searchTabs, activeTab]);

  const activeProductsMode = useMemo(() => {
    const tab = searchTabs.find((x) => x.id === activeTab);
    return tab?.productsMode ?? null;
  }, [searchTabs, activeTab]);

  latestSearchParamsRef.current = {
    q: searchQuery.trim(),
    categoryId: activeCategoryId,
    city: selectedCity,
  };

  const resolveProductsModeForItem = (item) => {
    const idsStr = item?.all_category_ids;
    if (idsStr && parentCategoryTabs.length) {
      const parts = String(idsStr)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const part of parts) {
        const numId = Number(part);
        if (Number.isNaN(numId)) continue;
        const parent = parentCategoryTabs.find((p) => Number(p?.id) === numId);
        if (parent) return mapParentRowToProductsMode(parent);
      }
    }
    return mapParentRowToProductsMode({ slug: item?.category?.slug || "" });
  };

  const getSuggestionProductsPath = (item, { includeSearch = false } = {}) => {
    const route = item?.route;
    const typedSearch = searchQuery.trim();
    if (route && typeof route === "object") {
      const params = new URLSearchParams();
      Object.entries(route).forEach(([key, val]) => {
        const normalized = String(val ?? "").trim();
        if (!normalized) return;
        params.set(key, normalized);
      });
      if (includeSearch && typedSearch) {
        params.set("search", typedSearch);
      }
      if (selectedCity) params.set("city", selectedCity);
      const q = params.toString();
      if (q) return `/products?${q}`;
    }
    const itemLabel = categoryTitleForItem(item) || item?.name || "";
    const mode =
      activeTab === "all"
        ? resolveProductsModeForItem(item)
        : activeProductsMode || resolveProductsModeForItem(item);
    const fallback = buildProductsFilterHref(mode, itemLabel);
    if (!includeSearch || !typedSearch) return fallback;
    const params = new URLSearchParams(fallback.split("?")[1] || "");
    params.set("search", typedSearch);
    if (selectedCity) params.set("city", selectedCity);
    return `/products?${params.toString()}`;
  };

  const navigateToSuggestion = (item) => {
    const path = getSuggestionProductsPath(item, {
      includeSearch: !isCategorySuggestion(item),
    });
    router.push(path);
    setSearchQuery(item?.name || searchQuery);
    setShowSearchDropdown(false);
  };

  const submitHeroSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    dispatch(setSearch(q));
    const params = new URLSearchParams();
    params.set("mode", activeProductsMode || "motors");
    params.set("search", q);
    if (selectedCity) params.set("city", selectedCity);
    router.push(`/products?${params.toString()}`);
    setShowSearchDropdown(false);
  };

  const submitRelatedSearch = (keyword) => {
    if (!keyword) return;
    dispatch(setSearch(keyword));
    const params = new URLSearchParams();
    params.set("mode", activeProductsMode || "motors");
    params.set("search", keyword);
    if (selectedCity) params.set("city", selectedCity);
    router.push(`/products?${params.toString()}`);
    setSearchQuery(keyword);
    setShowSearchDropdown(false);
  };

  useEffect(() => {
    const ids = new Set(searchTabs.map((x) => x.id));
    if (!ids.has(activeTab)) {
      setActiveTab("all");
      setSelectedCategoryId(null);
    }
  }, [searchTabs, activeTab]);

  const activeTabLabel = useMemo(() => {
    const row = searchTabs.find((x) => x.id === activeTab);
    return row?.label || "";
  }, [searchTabs, activeTab]);

  const getPlaceholder = () => {
    if (activeTab === "all") return t("searchItem");
    if (activeTabLabel) return `Search for ${activeTabLabel}`;
    return t("searchItem");
  };

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setApiSuggestions([]);
      setRelatedSearches([]);
      setSearchLoading(false);
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
      prevSearchScopeRef.current = {
        tab: activeTab,
        catId: activeCategoryId,
        city: selectedCity,
      };
      return;
    }

    const prev = prevSearchScopeRef.current;
    const scopeChanged =
      prev != null &&
      (prev.tab !== activeTab ||
        prev.catId !== activeCategoryId ||
        prev.city !== selectedCity);
    prevSearchScopeRef.current = {
      tab: activeTab,
      catId: activeCategoryId,
      city: selectedCity,
    };

    searchReqIdRef.current += 1;
    const fetchGeneration = searchReqIdRef.current;

    if (scopeChanged) {
      setApiSuggestions([]);
      setRelatedSearches([]);
      setSearchLoading(true);
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      if (!scopeChanged) setSearchLoading(true);
      const { q: liveQ, categoryId: liveCategoryId, city: liveCity } =
        latestSearchParamsRef.current;
      const trimmed = String(liveQ || "").trim();
      if (!trimmed) {
        if (fetchGeneration === searchReqIdRef.current) {
          setApiSuggestions([]);
          setRelatedSearches([]);
          setSearchLoading(false);
        }
        return;
      }
      try {
        const res = await bannerSuggestionApi.getSuggestions({
          search: trimmed,
          limit: 12,
          ...(liveCategoryId != null ? { category_id: liveCategoryId } : {}),
          ...(liveCity ? { city: liveCity } : {}),
        });
        const parsed = parseApiPayload(res?.data);
        const rows = parsed?.data;
        if (fetchGeneration !== searchReqIdRef.current) return;
        const raw = Array.isArray(rows) ? rows : [];
        const validSuggestions = raw.filter(isValidSuggestion);
        // Trust backend ranking/filtering for suggestions; avoid over-filtering client-side.
        setApiSuggestions(validSuggestions);
        const related = parsed?.related_searches;
        setRelatedSearches(Array.isArray(related) ? related : []);
      } catch (e) {
        console.error("get-item search failed:", e);
        if (fetchGeneration === searchReqIdRef.current) {
          setApiSuggestions([]);
          setRelatedSearches([]);
        }
      } finally {
        if (fetchGeneration === searchReqIdRef.current) setSearchLoading(false);
      }
    }, 320);
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
    };
  }, [searchQuery, activeCategoryId, activeTab, selectedCity]);

  return (
    <>
    <div className="w-full mx-auto">
      <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
        <div className="flex flex-col gap-[20px] mb-[20px]">
          <div
            className="max-sm:h-[100%] w-full h-[250px] rounded-[6px] overflow-visible"
            style={{
              ...(heroBackground && !bannersLoading
                ? {
                    backgroundImage: `url(${heroBackground})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }
                : {}),
            }}
          >
            <div className="relative h-full p-[20px] flex flex-col items-center justify-center text-center">
              {bannersLoading ? (
                <span className="mb-[40px] h-[28px] w-[min(100%,640px)] animate-pulse rounded-[6px] bg-[rgba(255,255,255,0.35)]" />
              ) : (
                <h3 className="text-center text-[20px] font-[Inter-Bold] text-[#fff] mb-[40px]">
                  {heroTitle}
                </h3>
              )}

              <div className="w-full max-w-[980px] bg-[#00000066] rounded-[6px] p-[12px_20px] flex flex-col gap-[14px]">
                <div className="max-sm:gap-[30px] flex flex-wrap items-center justify-between max-sm:w-[84vw] max-sm:overflow-x-auto max-sm:whitespace-nowrap max-sm:flex-nowrap hide_scrollbar">
                  <p className="text-[#FFF] font-[Inter-SemiBold] text-[14px] ">
                    Searching in
                  </p>
                  {tabsLoading
                    ? Array.from({ length: 6 }).map((_, idx) => (
                        <span
                          key={`tab-skeleton-${idx}`}
                          className="h-[34px] w-[90px] animate-pulse rounded-full bg-[rgba(255,255,255,0.28)]"
                        />
                      ))
                    : searchTabs.map((tab) => {
                        const isActive = tab.id === activeTab;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleSearchTabClick(tab)}
                            className={`cursor-pointer p-[4px_14px] rounded-[6px] text-[#FFF] font-[Inter-SemiBold] text-[14px] rounded-full border transition-colors hover:bg-[#DE2D33] hover:border-[#DE2D33] ${
                              isActive
                                ? "bg-[#DC0000] border-[#DE2D33] "
                                : "bg-transparent border-transparent"
                            }`}
                          >
                            {tab.id === "all" ? "All" : tab.label}
                          </button>
                        );
                      })}
                </div>

                <div className="w-full flex items-center justify-between gap-[12px]">
                  <div
                    ref={searchWrapRef}
                    className="flex-1 relative w-full flex items-center justify-between bg-[#FFF] rounded-[6px] p-[14px_16px] shadow-[0px_0px_14px_0px_rgba(0,0,0,0.1)]"
                  >
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSearchDropdown(Boolean(e.target.value.trim()));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          submitHeroSearch();
                        }
                      }}
                      placeholder={getPlaceholder()}
                      className="w-full outline-none border-none focus:outline-none focus:border-none w-full text-[#000] font-[Inter-Regular] text-[14px] placeholder:text-[#66666666]"
                      onFocus={() =>
                        setShowSearchDropdown(Boolean(searchQuery.trim()))
                      }
                    />
                    <button
                      type="button"
                      aria-label={showSearchDropdown ? "Close" : "Search"}
                      onClick={() => {
                        if (showSearchDropdown) {
                          setShowSearchDropdown(false);
                          return;
                        }
                        submitHeroSearch();
                      }}
                      className="cursor-pointer flex items-center justify-center"
                    >
                      {showSearchDropdown ? (
                        <CloseIcon className="w-[10px] h-[10px]" />
                      ) : (
                        <SearchIcon stroke="#8F8F8F" />
                      )}
                    </button>
                    {showSearchDropdown ? (
                      <div className="absolute left-0 right-0 top-[56px] bg-white rounded-[6px] shadow-[0_8px_20px_rgba(0,0,0,0.14)] border border-[rgba(143,143,143,0.18)] overflow-hidden z-[999]">
                        <div className="p-[12px_14px] border-b border-[rgba(143,143,143,0.18)]">
                          <p className="text-left text-[14px] font-[Inter-Regular] text-[#000] truncate">
                            {searchQuery.trim()}
                          </p>
                        </div>

                        {searchLoading && !apiSuggestions.length && !relatedSearches.length ? (
                          <div className="px-[14px] py-[14px] text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
                            Searching…
                          </div>
                        ) : apiSuggestions.length || relatedSearches.length ? (
                          <div className="max-h-[320px] overflow-y-auto">
                            {apiSuggestions.map((item, idx) => {
                              const title = item?.name || "";
                              return (
                                <button
                                  key={`${item?.id ?? title}-${idx}`}
                                  type="button"
                                  className="w-full flex items-center justify-between gap-[12px] px-[14px] py-[12px] hover:bg-[#F5F5F5] cursor-pointer border-0 bg-transparent text-left relative z-[1000]"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigateToSuggestion(item);
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigateToSuggestion(item);
                                  }}
                                >
                                  <span className="flex items-start flex-col gap-[4px] min-w-0 pointer-events-none">
                                    <span className="text-[14px] font-[Inter-Regular] text-[#000] truncate block w-full text-left">
                                      {title}
                                    </span>
                                    {categoryTitleForItem(item) ? (
                                      <span className="text-[12px] font-[Inter-Regular] text-[#8F8F8F] whitespace-nowrap text-left">
                                        {categoryTitleForItem(item)}
                                      </span>
                                    ) : null}
                                  </span>
                                  <span className="text-[14px] font-[Inter-Regular] text-[#3A88EF] whitespace-nowrap shrink-0 pointer-events-none">
                                    {formatSuggestionAdsCount(item)}
                                  </span>
                                </button>
                              );
                            })}
                            {relatedSearches.length > 0 && (
                              <div className="p-[12px_14px]">
                                <p className="text-[12px] font-[Inter-SemiBold] text-[#8F8F8F] uppercase mb-[10px]">
                                  Related Searches
                                </p>
                                <div className="flex flex-wrap gap-[8px]">
                                  {relatedSearches.map((item, idx) => (
                                    <button
                                      key={`rs-${idx}`}
                                      type="button"
                                      className="cursor-pointer border border-[#E0E0E0] rounded-[16px] bg-[#F5F5F5] px-[12px] py-[6px] text-[13px] font-[Inter-Regular] text-[#000] hover:bg-[#EBEBEB] transition-colors relative z-[1000]"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        submitRelatedSearch(item.keyword);
                                      }}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        submitRelatedSearch(item.keyword);
                                      }}
                                    >
                                      {item.keyword}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="px-[14px] py-[14px] text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
                            No results
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                  <button
                    className="cursor-pointer bg-[#DC0000] rounded-[6px] p-[16px_50px] text-[#FFF] font-[Inter-SemiBold] text-[14px] capitalize"
                    type="button"
                    onClick={submitHeroSearch}
                  >
                    {t("search")}
                  </button>
                </div>

                {/* <form className="w-full flex items-center gap-[12px]" onSubmit={handleSubmit}>
                <div className="w-full flex items-center justify-between bg-[#FFF] rounded-[6px] p-[16px_16px] shadow-[0px_0px_14px_0px_rgba(0,0,0,0.1)]">
                  <input
                    className="outline-none border-none focus:outline-none focus:border-none w-full text-[#000] font-[Inter-Regular] text-[14px] placeholder:text-[#66666666]"
                    type="text"
                    placeholder={getPlaceholder()}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <SearchIcon stroke="#8F8F8F"  />
                </div>
                <div className="">
                  <button className="cursor-pointer bg-[#DC0000] rounded-[6px] p-[16px_50px] w-full text-[#FFF] font-[Inter-SemiBold] text-[14px] capitalize" type="submit">
                    {t("search")}
                  </button>
                </div>
              </form> */}
              </div>
            </div>
          </div>
          {bannersLoading ? (
            <>
              <div className="max-sm:gap-[10px] max-sm:flex-wrap flex items-center justify-between pr-[32px] bg-[linear-gradient(110deg,_rgba(255,188,188,0.6),_rgba(252,227,180,0.6))] rounded-[6px] rtl:pl-[32px] rtl:pr-0 p-[16px]">
                <span className="h-[96px] w-[213px] animate-pulse rounded-[6px] bg-[rgba(255,255,255,0.55)]" />
                <span className="h-[52px] w-[min(100%,320px)] animate-pulse rounded-[6px] bg-[rgba(255,255,255,0.55)]" />
                <span className="h-[40px] w-[160px] animate-pulse rounded-[8px] bg-[rgba(255,255,255,0.55)]" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-[14px] bg-[#EEF6FC] rounded-[6px] p-[16px]">
                <span className="h-[90px] w-[135px] animate-pulse rounded-[6px] bg-[rgba(255,255,255,0.7)]" />
                <span className="h-[52px] w-[min(100%,320px)] animate-pulse rounded-[6px] bg-[rgba(255,255,255,0.7)]" />
                <span className="h-[40px] w-[150px] animate-pulse rounded-[5px] bg-[rgba(255,255,255,0.7)]" />
              </div>
            </>
          ) : (
            <>
              <div className="max-sm:gap-[10px] max-sm:flex-wrap flex items-center justify-between pr-[32px] bg-[linear-gradient(110deg,_rgba(255,188,188,0.6),_rgba(252,227,180,0.6))] rounded-[6px] rtl:pl-[32px] rtl:pr-0">
                <div>
                  {renderCardBannerImage(
                    cardBanner2,
                    homebanner,
                    "w-[213px] h-[96px]"
                  )}
                </div>
                <div className="flex flex-col gap-[4px] items-center justify-center text-center">
                  <h4 className="text-[18px] font-[Inter-SemiBold] text-[#000]">
                    {cardBanner2.title}
                  </h4>
                  <p className="text-[14px] font-[Inter-Regular] text-[#000]">
                    {cardBanner2.description}
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => handleCardBannerNavigate(cardBanner2)}
                    className="flex cursor-pointer items-center gap-[4px] bg-[#fff] p-[8px_24px] rounded-[8px]"
                  >
                    <p className="text-[14px] font-[Inter-SemiBold] text-[#000000CC]">
                      {getBtnText(cardBanner2) || "Get Started Now"}{" "}
                    </p>
                    <RightArrowIcon className="rtl:rotate-180" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-[14px] bg-[#EEF6FC] rounded-[6px] p-[16px]">
                <div>
                  {renderCardBannerImage(
                    cardBanner3,
                    newprojectbanner,
                    "w-[135px] h-[90px]"
                  )}
                </div>
                <div className="h-full flex flex-col gap-[6px] items-center justify-center">
                  <h5 className="text-[16px] font-[Inter-SemiBold] text-[#000]">
                    {cardBanner3.title}
                  </h5>
                  <p className="text-center text-[14px] font-[Inter-Regular] text-[#000]">
                    {cardBanner3.description}
                  </p>
                </div>
                {String(getBtnLink(cardBanner3)).includes("placeyourad") ? (
                  <button
                    type="button"
                    onClick={() => handleCardBannerNavigate(cardBanner3)}
                    className="flex items-center gap-[4px] bg-[#fff] rounded-[5px] p-[8px_24px] cursor-pointer"
                  >
                    <p className="text-[14px] font-[Inter-SemiBold] text-[#000]">
                      {getBtnText(cardBanner3) || "Explore Now"}
                    </p>
                    <RightArrowIcon className="rtl:rotate-180" />
                  </button>
                ) : (
                  <Link
                    href={getBtnLink(cardBanner3)}
                    className="flex items-center gap-[4px] bg-[#fff] rounded-[5px] p-[8px_24px] cursor-pointer"
                  >
                    <p className="text-[14px] font-[Inter-SemiBold] text-[#000]">
                      {getBtnText(cardBanner3) || "Explore Now"}
                    </p>
                    <RightArrowIcon className="rtl:rotate-180" />
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    {loginModal}
    </>
  );
};

export default Searchbar;
