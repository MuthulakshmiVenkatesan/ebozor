export const parseBannerApiPayload = (payload) => {
  if (typeof payload === "string") {
    const scriptIndex = payload.indexOf("<script");
    const jsonText =
      scriptIndex >= 0 ? payload.slice(0, scriptIndex).trim() : payload.trim();
    if (!jsonText) return {};
    try {
      return JSON.parse(jsonText);
    } catch (e) {
      console.error("Banner API parse failed:", e);
      return {};
    }
  }
  return payload || {};
};

export const getBannerImage = (banner) =>
  banner?.banner_image ?? banner?.image ?? null;

export const getImageUrl = (path, fallback) => {
  if (!path) return fallback;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `http://13.233.244.104${cleanPath.startsWith("/storage") ? "" : "/storage"}${cleanPath}`;
};

export const resolveCategoryHeroBanner = (fullBanner, fallbackImage, fallbackTitle) => {
  const apiImagePath = getBannerImage(fullBanner);
  const fallbackBg = fallbackImage?.src ?? fallbackImage ?? null;
  const heroBackground = apiImagePath
    ? getImageUrl(apiImagePath, null)
    : fallbackBg;
  const heroTitle = fullBanner?.title || fallbackTitle || "";

  return { heroBackground, heroTitle };
};
