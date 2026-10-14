"use client";

import { useEffect, useState } from "react";
import { homepageBannerApi } from "@/utils/api";
import {
  parseBannerApiPayload,
  resolveCategoryHeroBanner,
} from "@/utils/categoryBanner";

export function useCategoryBanner(
  categoryId,
  { fallbackImage, fallbackTitle } = {}
) {
  const fallbackBg = fallbackImage?.src ?? fallbackImage ?? null;
  const [heroBackground, setHeroBackground] = useState(null);
  const [heroTitle, setHeroTitle] = useState("");
  const [bannersLoading, setBannersLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setBannersLoading(true);
    setHeroBackground(null);
    setHeroTitle("");

    const loadBanners = async () => {
      try {
        const response = await homepageBannerApi.getHomepageBanners(categoryId);
        const parsed = parseBannerApiPayload(response?.data);
        const { heroBackground: bg, heroTitle: title } = resolveCategoryHeroBanner(
          parsed?.data?.full_banner,
          fallbackImage,
          fallbackTitle
        );
        if (!cancelled) {
          setHeroBackground(bg);
          setHeroTitle(title);
        }
      } catch (e) {
        console.error("get-homepage-banners failed:", e);
        if (!cancelled) {
          setHeroBackground(fallbackBg);
          setHeroTitle(fallbackTitle || "");
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
  }, [categoryId, fallbackBg, fallbackImage, fallbackTitle]);

  return { heroBackground, heroTitle, bannersLoading };
}
