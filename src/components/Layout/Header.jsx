"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import "swiper/css";
import { getSlug, isEmptyObject, placeholderImage, t, truncate } from "@/utils";
import { useDispatch, useSelector } from "react-redux";
import { MdClose } from "react-icons/md";
import { logoutSuccess, userSignUpData } from "../../redux/reuducer/userSlice";
import { setCityData } from "@/redux/reuducer/locationSlice";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import FirebaseData from "@/utils/Firebase";
import { settingsData } from "@/redux/reuducer/settingSlice";
import { CloseIcon } from "../CustomFile/icons";
import {
  getCitiesApi,
  getLanguageApi,
  getLimitsApi,
  chatListApi,
  getVerificationStatusApi,
} from "@/utils/api";
import {
  CurrentLanguageData,
  setCurrentLanguage,
} from "@/redux/reuducer/languageSlice";
import LanguageDropdown from "../HeaderDropdowns/LanguageDropdown";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { isLogin } from "@/utils";
import {
  CategoryData,
  CurrentPage,
  LastPage,
  setCatCurrentPage,
  setCatLastPage,
  setCateData,
  setTreeData,
} from "@/redux/reuducer/categorySlice";
import { categoryApi } from "@/utils/api";
import FilterTree from "../Category/FilterTree";
import LocationModal from "../LandingPage/LocationModal";
import { saveOfferData } from "@/redux/reuducer/offerSlice";
import HeaderCategories from "./HeaderCategories";
const ProfileDropdown = dynamic(() => import("../Profile/ProfileDropdown.jsx"));
const MailSentSucessfully = dynamic(
  () => import("../Auth/MailSentSucessfully.jsx"),
  { ssr: false },
);
const LoginModal = dynamic(() => import("../Auth/LoginModal.jsx"), {
  ssr: false,
});
import {
  HamburgerIcon,
  NotificationIcon,
  MySearchIcon,
  FavouriteIcon,
  ChatIcon,
  AdsIcon,
  DownArrowIcon,
} from "../CustomFile/icons";
import NotificationPopup from "../HeaderComponents/NotificationPopup";
import SearchPopup from "../HeaderComponents/SearchPopup";
import FavouritesPopup from "../HeaderComponents/Favouritespopup";
import ChatPopup from "../HeaderComponents/ChatPopup";
import verifiedbadgewhite from "../../../public/assets/img/icons/verifiedbadgewhite.svg";
import GetVerifiedModal from "@/components/PagesComponent/GetVerified/GetVerifiedModal";

const UAE_CITIES_BASE = [{ id: "all", label: "All Cities(UAE)" }];

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const headerSearchParams = useSearchParams();
  const dispatch = useDispatch();
  const UserData = useSelector(userSignUpData);
  const authToken = useSelector((state) => state?.UserSignup?.data?.token);
  const systemSettings = useSelector(settingsData);
  const settings = systemSettings?.data;
  const cateData = useSelector(CategoryData);
  const catCurrentPage = useSelector(CurrentPage);
  const catLastPage = useSelector(LastPage);
  const { signOut } = FirebaseData();
  const [IsRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [IsLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [IsMailSentOpen, setIsMailSentOpen] = useState(false);
  const [IsLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const cityData = useSelector((state) => state?.Location?.cityData);
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const headerCatSelected = getSlug(pathname);
  const [loading, setLoading] = useState(false);
  const [isAdListingClicked, setIsAdListingClicked] = useState(false);
  const [selectedCity, setSelectedCity] = useState("All Cities(UAE)");
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const cityDropdownRef = useRef(null);
  const mobileCityDropdownRef = useRef(null);
  const desktopCityMenuRef = useRef(null);
  const mobileCityMenuRef = useRef(null);
  const [cities, setCities] = useState(UAE_CITIES_BASE);
  const [cityCurrentPage, setCityCurrentPage] = useState(1);
  const [cityLastPage, setCityLastPage] = useState(1);
  const [isCitiesLoading, setIsCitiesLoading] = useState(false);
  const [isCitiesFirstLoadDone, setIsCitiesFirstLoadDone] = useState(false);
  const cityCurrentPageRef = useRef(0);
  const cityLastPageRef = useRef(1);
  const isCitiesLoadingRef = useRef(false);
  const requestedCityPagesRef = useRef(new Set());
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFavouritesOpen, setIsFavouritesOpen] = useState(false);
  const [isChatsOpen, setIsChatsOpen] = useState(false);
  const [isTopBannerVisible, setIsTopBannerVisible] = useState(true);
  const [isGetVerifiedModalOpen, setIsGetVerifiedModalOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("not_applied");
  const notificationPopupRef = useRef(null);
  const searchPopupRef = useRef(null);
  const favouritesPopupRef = useRef(null);
  const chatsPopupRef = useRef(null);
  const [chatPopupMessages, setChatPopupMessages] = useState([]);
  // Hide main site header on Jobs pages (jobs listing and recruiter flow)
  const hideHeaderForJobs =
    pathname?.startsWith("/recuriter") ||
    pathname?.startsWith("/sellmycar") ||
    pathname?.startsWith("/helpbuy") ||
    pathname?.startsWith("/jobdashboard") ||
    pathname?.startsWith("/inceptionpackage") ||
    pathname?.startsWith("/about-us") ||
    pathname?.startsWith("/contact-us") ||
    pathname?.startsWith("/terms-and-condition") ||
    pathname?.startsWith("/legalhub") ||
    pathname?.startsWith("/privacy-policy") ||
    pathname?.startsWith("/blogs") ||
    pathname?.startsWith("/faqs");

  const getCategoriesData = async (page) => {
    try {
      setLoading(true);
      const response = await categoryApi.getCategory({ page: `${page}` });
      const { data } = response.data;

      if (data && Array.isArray(data.data)) {
        if (page > 1) {
          dispatch(setCateData([...cateData, ...data.data]));
        } else {
          dispatch(setCateData(data.data));
          dispatch(setTreeData([]));
        }
      }
      dispatch(setCatLastPage(data?.last_page));
      dispatch(setCatCurrentPage(data?.current_page));
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const closeAll = () => {
      setIsNotificationOpen(false);
      setIsSearchOpen(false);
      setIsFavouritesOpen(false);
      setIsChatsOpen(false);
    };

    const onMouseDown = (event) => {
      const t = event.target;
      if (
        notificationPopupRef.current?.contains(t) ||
        searchPopupRef.current?.contains(t) ||
        favouritesPopupRef.current?.contains(t) ||
        chatsPopupRef.current?.contains(t)
      ) {
        return;
      }
      closeAll();
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") closeAll();
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (hideHeaderForJobs) {
      return;
    }
    if (pathname === "/" || cateData.length === 0) {
      getCategoriesData(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const outsideDesktop = !cityDropdownRef.current?.contains(e.target);
      const outsideMobile = !mobileCityDropdownRef.current?.contains(e.target);
      if (outsideDesktop && outsideMobile) setIsCityDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadCities = useCallback(async (page = null) => {
    const pageKey = page == null ? "initial" : String(page);
    if (isCitiesLoadingRef.current) return;
    if (page != null && requestedCityPagesRef.current.has(pageKey)) return;
    if (page != null && page > 1 && page > cityLastPageRef.current) return;
    try {
      if (page != null) requestedCityPagesRef.current.add(pageKey);
      isCitiesLoadingRef.current = true;
      setIsCitiesLoading(true);
      const res = await getCitiesApi.getCities(page == null ? {} : { page });
      const rows = res?.data?.data?.data || [];
      const current = Number(res?.data?.data?.current_page || page || 1);
      const last = Number(res?.data?.data?.last_page || current || 1);
      const mapped = Array.isArray(rows)
        ? rows
            .map((city) => ({
              id: city?.id ?? city?.name,
              label: city?.name || "",
            }))
            .filter((x) => x.label)
        : [];

      const nextCurrent = page == null ? 0 : current;
      cityCurrentPageRef.current = nextCurrent;
      cityLastPageRef.current = last;
      setCityCurrentPage(nextCurrent);
      setCityLastPage(last);
      setCities((prev) => {
        if (page == null || page === 1) return [...UAE_CITIES_BASE, ...mapped];
        const existing = new Set(prev.map((x) => String(x.id)));
        const merged = [...prev];
        mapped.forEach((item) => {
          if (!existing.has(String(item.id))) {
            merged.push(item);
            existing.add(String(item.id));
          }
        });
        return merged;
      });
    } catch (error) {
      if (page != null) requestedCityPagesRef.current.delete(pageKey);
      console.error("Error fetching cities data:", error);
    } finally {
      isCitiesLoadingRef.current = false;
      setIsCitiesLoading(false);
      setIsCitiesFirstLoadDone(true);
    }
  }, []);

  useEffect(() => {
    loadCities();
  }, [loadCities]);

  const handleCitiesScroll = useCallback(
    (e) => {
      if (isCitiesLoadingRef.current) return;
      const el = e.currentTarget;
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
      if (nearBottom) {
        const nextPage = cityCurrentPageRef.current + 1;
        if (nextPage > cityLastPageRef.current) return;
        loadCities(nextPage);
      }
    },
    [loadCities],
  );

  const translateCategories = (categories) => {
    return categories.map((category) => {
      const translation = category.translations?.find(
        (trans) => trans.language_id === CurrentLanguage.id,
      );

      return {
        ...category,
        translated_name: translation ? translation.name : category.name,
        subcategories:
          category.subcategories?.length > 0
            ? translateCategories(category.subcategories)
            : [],
      };
    });
  };

  useEffect(() => {
    if (cateData.length > 0) {
      const updatedCateData = translateCategories(cateData);
      dispatch(setCateData(updatedCateData));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [CurrentLanguage]);

  const getLanguageData = useCallback(
    async (language_code) => {
      try {
        const res = await getLanguageApi.getLanguage({
          language_code,
          type: "web",
        });
        if (res?.data?.error === true) {
          toast.error(res?.data?.message);
          return false;
        }
        if (show) {
          setShow(false);
        }
        dispatch(setCurrentLanguage(res?.data?.data));
        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
    [dispatch, show],
  );

  const setDefaultLanguage = async () => {
    try {
      const language_code = settings?.default_language;
      const res = await getLanguageApi.getLanguage({
        language_code,
        type: "web",
      });
      if (res?.data?.error === true) {
        toast.error(res?.data?.message);
      } else {
        dispatch(setCurrentLanguage(res?.data?.data));
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const q = (headerSearchParams?.get("lang") || "").trim().toLowerCase();
    if (q === "ar" || q === "en") return;
    if (!isEmptyObject(CurrentLanguage)) return;
    if (!settings?.default_language) return;
    void setDefaultLanguage();
  }, [settings?.default_language, headerSearchParams?.toString(), CurrentLanguage]);

  useEffect(() => {
    const q = (headerSearchParams?.get("lang") || "").trim().toLowerCase();
    if (q !== "ar" && q !== "en") return;
    let cancelled = false;
    void (async () => {
      const ok = await getLanguageData(q);
      if (cancelled || !ok) return;
      const next = new URLSearchParams(headerSearchParams.toString());
      next.delete("lang");
      const qs = next.toString();
      const p = pathname || "/";
      router.replace(qs ? `${p}?${qs}` : p, { scroll: false });
    })();
    return () => {
      cancelled = true;
    };
  }, [getLanguageData, headerSearchParams?.toString(), pathname, router]);

  const closeDrawer = () => {
    if (show) {
      setShow(false);
    }
  };

  const openRegisterModal = () => {
    if (show) {
      setShow(false);
    }
    setIsLoginModalOpen(true);
    setIsRegisterModalOpen(true);
  };

  const openLoginModal = () => {
    if (show) {
      setShow(false);
    }
    if (IsRegisterModalOpen) {
      setIsRegisterModalOpen(false);
    }
    setIsLoginModalOpen(true);
  };

  const openSentMailModal = () => {
    setIsLoginModalOpen(false);
    setIsMailSentOpen(true);
  };

  const openLocationEditModal = () => {
    if (show) {
      setShow(false);
    }
    setIsLocationModalOpen(true);
  };

  const handleLogout = () => {
    if (show) {
      setShow(false);
    }
    Swal.fire({
      title: `${t("areYouSure")} \u200E`,
      text: `${t("logoutConfirmation")} \u200E`,
      icon: "warning",
      showCancelButton: true,
      customClass: {
        confirmButton: "Swal-confirm-buttons",
        cancelButton: "Swal-cancel-buttons",
      },
      confirmButtonText: t("yes"),
    }).then((result) => {
      if (result.isConfirmed) {
        logoutSuccess();
        signOut();
        router.push("/");
        saveOfferData([]);
        toast.success(t("signOutSuccess"));
      } else {
        toast.error(t("signOutCancelled"));
      }
    });
  };

  const handleCheckLogin = (e) => {
    e.preventDefault();
    if (isLogin()) {
      if (UserData?.name && UserData?.email) {
        // getLimitsData()
        router.push("/placeyourad");
      } else {
        Swal.fire({
          title: t("oops"),
          text: t("youNeedToUpdateProfile"),
          icon: "warning",
          showCancelButton: false,
          customClass: {
            confirmButton: "Swal-confirm-buttons",
          },
          confirmButtonText: "Ok",
        }).then((result) => {
          if (result.isConfirmed) {
            router.push("/profilesetting");
          }
        });
      }
    } else {
      openLoginModal();
    }
    handleClose();
  };

  const closeMobileDrawer = () => setIsMobileDrawerOpen(false);

  const navLinkClick = (fn) => {
    closeMobileDrawer();
    if (typeof fn === "function") fn();
  };

  const handleProtectedHeaderAction = (action) => {
    if (!isLogin()) {
      setIsNotificationOpen(false);
      setIsSearchOpen(false);
      setIsFavouritesOpen(false);
      setIsChatsOpen(false);
      openLoginModal();
      return;
    }

    if (typeof action === "function") action();
  };

  const handleVerifiedBannerCTA = () => {
    if (!isLogin()) {
      openLoginModal();
      return;
    }
    setIsGetVerifiedModalOpen(true);
  };

  const isVerifiedUser =
    Number(
      UserData?.is_verified ??
        UserData?.data?.is_verified ??
        UserData?.user?.is_verified ??
        UserData?.data?.data?.is_verified ??
        UserData?.user?.data?.is_verified ??
        0,
    ) === 1 || verificationStatus === "approved";

  useEffect(() => {
    if (!authToken) {
      setVerificationStatus("not_applied");
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        const res = await getVerificationStatusApi.getVerificationStatus();
        if (cancelled) return;
        if (res?.data?.error === true) {
          setVerificationStatus("not_applied");
          return;
        }
        const status = String(res?.data?.data?.status || "")
          .trim()
          .toLowerCase();
        setVerificationStatus(status || "not_applied");
      } catch {
        if (!cancelled) setVerificationStatus("not_applied");
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [authToken]);

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInSeconds < 60) return t("now");
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return t("yesterday");
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    return `${diffInYears}y ago`;
  };

  const mapChatForPopup = (chat, currentUserId) => {
    if (!chat) return null;
    const isBuyer = Number(chat?.buyer_id) === Number(currentUserId);
    const peer = isBuyer ? chat?.seller : chat?.buyer;
    const preview =
      chat?.last_message?.message ||
      chat?.last_message ||
      chat?.message ||
      t("typeMessageHere");

    return {
      id: chat?.id,
      title: chat?.item?.name || t("chat"),
      senderName: peer?.name || t("user"),
      preview: String(preview),
      timestamp: formatRelativeTime(chat?.last_message_time),
      timestampIsTime: true,
      unread: Number(chat?.unread_count || 0) > 0,
      verified: Boolean(peer?.is_verified),
      avatarUrl: peer?.profile || "",
      productImageUrl: chat?.item?.image || "",
      offerData: chat,
    };
  };

  useEffect(() => {
    const fetchChatPopupData = async () => {
      if (!isChatsOpen || !isLogin()) return;
      try {
        const currentUserId = UserData?.id;
        const [buyerRes, sellerRes] = await Promise.allSettled([
          chatListApi.chatList({ type: "buyer", page: 1 }),
          chatListApi.chatList({ type: "seller", page: 1 }),
        ]);

        const buyerList =
          buyerRes.status === "fulfilled"
            ? buyerRes.value?.data?.data?.data || []
            : [];
        const sellerList =
          sellerRes.status === "fulfilled"
            ? sellerRes.value?.data?.data?.data || []
            : [];
        const merged = [...buyerList, ...sellerList];
        const uniqueById = Array.from(
          new Map(merged.map((chat) => [chat?.id, chat])).values(),
        );
        const sorted = uniqueById.sort(
          (a, b) =>
            new Date(b?.last_message_time || 0) -
            new Date(a?.last_message_time || 0),
        );
        const popupItems = sorted
          .map((chat) => mapChatForPopup(chat, currentUserId))
          .filter(Boolean)
          .slice(0, 8);

        setChatPopupMessages(popupItems);
      } catch (error) {
        console.log(error);
        setChatPopupMessages([]);
      }
    };

    fetchChatPopupData();
  }, [isChatsOpen, UserData?.id]);

  const handleSelectCity = (city) => {
    const isAll = city?.id === "all";
    const label = isAll ? "All Cities(UAE)" : city?.label || "";
    setSelectedCity(label || "All Cities(UAE)");
    setIsCityDropdownOpen(false);
    dispatch(
      setCityData({
        data: {
          ...(cityData || {}),
          city: isAll ? "" : city?.label || "",
          country:
            String(cityData?.country || "").trim() || "United Arab Emirates",
        },
      }),
    );

    const normalizedPath = String(pathname || "").replace(/\/$/, "") || "/";
    if (normalizedPath === "/products") {
      const next = new URLSearchParams(headerSearchParams?.toString() || "");
      if (isAll) {
        next.delete("city");
      } else {
        const cityName = String(city?.label || "").trim();
        if (cityName) next.set("city", cityName);
      }
      next.delete("area");
      next.delete("area_id");
      next.delete("building");
      next.delete("building_id");
      next.set("page", "1");
      const country =
        String(cityData?.country || "").trim() || "United Arab Emirates";
      next.set("country", country);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  };

  useEffect(() => {
    const stored = String(cityData?.city || "").trim();
    setSelectedCity(stored || "All Cities(UAE)");
  }, [cityData?.city]);

  if (hideHeaderForJobs) {
    return null;
  }

  return (
    <>
      <div className="">
        {isTopBannerVisible && !isVerifiedUser && (
          <div className="relative bg-[#3a88ef] py-[10px]">
            <div
              role="button"
              tabIndex={0}
              onClick={handleVerifiedBannerCTA}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleVerifiedBannerCTA();
                }
              }}
              className="relative max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container flex items-center justify-center gap-[20px] flex-wrap cursor-pointer"
            >
              <div>
                <Image
                  src={verifiedbadgewhite}
                  alt="verified badge"
                  width={22}
                  height={22}
                />
              </div>
              <h4 className="text-[15px] font-[Inter-Regular] text-[#fff]">
                Join us in building a safer community. Get verified to boost your
                credibility and assist us in creating trust amongst our users!
              </h4>
              <span className="text-[12px] font-[Inter-Medium] text-[#fff] cursor-pointer rounded-[6px] p-[4px_26px] bg-transparent text-white border border-white inline-block">
                Verify Now
              </span>
            </div>
            <div className="absolute right-[10px] top-[10px]">
              <button
                type="button"
                onClick={() => setIsTopBannerVisible(false)}
                className="cursor-pointer"
              >
                <CloseIcon className="w-[10px] h-[10px]" fill="#fff" />
              </button>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
          <div className="flex items-center gap-2 md:gap-[6px]">
            <Link href="/" className="flex-shrink-0">
              <Image
                src={settings?.header_logo}
                alt="logo"
                width={100}
                height={80}
                className="h-12 md:h-[80px] w-auto"
                onErrorCapture={placeholderImage}
              />
            </Link>
            <div className="relative hidden md:block" ref={cityDropdownRef}>
              <button
                type="button"
                onClick={() => setIsCityDropdownOpen((prev) => !prev)}
                className="cursor-pointer flex items-center gap-[4px] bg-transparent border-none"
              >
                <p className="text-[14px] font-[Inter-Regular] text-[#000000CC] max-w-[130px] truncate">
                  {selectedCity}
                </p>
                <DownArrowIcon className="w-[16px] h-[16px] [&_path]:stroke-[#000]" />
              </button>
              {isCityDropdownOpen && (
                <div
                  ref={desktopCityMenuRef}
                  onScroll={handleCitiesScroll}
                  className="absolute left-0 top-full mt-[4px] min-w-[200px] max-h-[280px] overflow-y-auto bg-white rounded-[8px] z-[999] border border-[rgba(0,0,0,0.06)]"
                >
                  {cities.map((city) => {
                    const isSelected = city.label === selectedCity;
                    return (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => handleSelectCity(city)}
                        className={`cursor-pointer border-b border-[rgba(0,0,0,0.08)] w-full text-left px-[16px] py-[10px] text-[14px] font-[Inter-Regular] text-[#000] hover:bg-[#F5F5F5] transition-colors ${isSelected ? "font-[Inter-SemiBold]" : ""}`}
                      >
                        <span className="block truncate">{city.label}</span>
                      </button>
                    );
                  })}
                  {isCitiesLoading && (
                    <div className="px-[16px] py-[10px] text-[13px] text-[#8F8F8F]">
                      Loading...
                    </div>
                  )}
                  {isCitiesFirstLoadDone &&
                    !isCitiesLoading &&
                    cities.length === 1 && (
                      <div className="px-[16px] py-[10px] text-[13px] text-[#8F8F8F]">
                        No cities found
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Desktop nav - hidden on mobile */}
          <div className="flex items-center lg:gap-[50px] gap-[24px]">
            <div className="max-sm:hidden flex items-center gap-[24px] header_center">
              <div className="relative" ref={notificationPopupRef}>
                <button
                  onClick={() =>
                    handleProtectedHeaderAction(() => {
                      setIsSearchOpen(false);
                      setIsFavouritesOpen(false);
                      setIsChatsOpen(false);
                      setIsNotificationOpen((prev) => !prev);
                    })
                  }
                  className="cursor-pointer flex items-center gap-[2px] flex-col"
                >
                  <NotificationIcon />
                  <h4 className="text-[14px] font-[Inter-Regular] text-[#000000CC]">
                    Notification
                  </h4>
                </button>
                <NotificationPopup
                  isOpen={isNotificationOpen}
                  onClose={() => setIsNotificationOpen(false)}
                  onViewAll={() => {
                    setIsNotificationOpen(false);
                    router.push("/notifications");
                  }}
                />
              </div>
              <div className="relative" ref={searchPopupRef}>
                <button
                  onClick={() =>
                    handleProtectedHeaderAction(() => {
                      setIsNotificationOpen(false);
                      setIsFavouritesOpen(false);
                      setIsChatsOpen(false);
                      setIsSearchOpen((prev) => !prev);
                    })
                  }
                  className="cursor-pointer flex items-center gap-[2px] flex-col"
                >
                  <MySearchIcon />
                  <h4 className="text-[14px] font-[Inter-Regular] text-[#000000CC]">
                    My Searches
                  </h4>
                </button>
                <SearchPopup
                  isOpen={isSearchOpen}
                  onClose={() => setIsSearchOpen(false)}
                  onViewAll={() => {
                    setIsSearchOpen(false);
                    router.push("/mysearch");
                  }}
                />
              </div>
              <div className="relative" ref={favouritesPopupRef}>
                <button
                  onClick={() =>
                    handleProtectedHeaderAction(() => {
                      setIsNotificationOpen(false);
                      setIsSearchOpen(false);
                      setIsChatsOpen(false);
                      setIsFavouritesOpen((prev) => !prev);
                    })
                  }
                  className="cursor-pointer flex items-center gap-[2px] flex-col"
                >
                  <FavouriteIcon />
                  <h4 className="text-[14px] font-[Inter-Regular] text-[#000000CC]">
                    Favorites
                  </h4>
                </button>
                <FavouritesPopup
                  isOpen={isFavouritesOpen}
                  onClose={() => setIsFavouritesOpen(false)}
                  onViewAll={() => {
                    setIsFavouritesOpen(false);
                    router.push("/favourites");
                  }}
                />
              </div>
              <div className="relative" ref={chatsPopupRef}>
                <button
                  onClick={() =>
                    handleProtectedHeaderAction(() => {
                      setIsNotificationOpen(false);
                      setIsSearchOpen(false);
                      setIsFavouritesOpen(false);
                      setIsChatsOpen((prev) => !prev);
                    })
                  }
                  className="cursor-pointer flex items-center gap-[2px] flex-col"
                >
                  <ChatIcon />
                  <h4 className="text-[14px] font-[Inter-Regular] text-[#000000CC]">
                    Chats
                  </h4>
                </button>
                <ChatPopup
                  isOpen={isChatsOpen}
                  onClose={() => setIsChatsOpen(false)}
                  messages={chatPopupMessages}
                  onMarkAllRead={() => {
                    setChatPopupMessages((prev) =>
                      prev.map((item) => ({ ...item, unread: false })),
                    );
                  }}
                  onMessageClick={(item) => {
                    if (item?.offerData) {
                      saveOfferData(item.offerData);
                    }
                    setIsChatsOpen(false);
                    router.push("/chat");
                  }}
                  onViewAll={() => {
                    setIsChatsOpen(false);
                    router.push("/chat");
                  }}
                />
              </div>
              <button
                onClick={() =>
                  handleProtectedHeaderAction(() => router.push("/myads"))
                }
                className="cursor-pointer flex items-center gap-[2px] flex-col"
              >
                <AdsIcon />
                <h4 className="text-[14px] font-[Inter-Regular] text-[#000000CC]">
                  My Ads
                </h4>
              </button>
            </div>
            <div className="flex items-center lg:gap-[50px] gap-[24px]">
              {!authToken ? (
                <button
                  onClick={openLoginModal}
                  className="text-[14px] font-[Inter-Medium] text-[#000] cursor-pointer"
                >
                  Log in or sign up
                </button>
              ) : (
                <ProfileDropdown
                  closeDrawer={closeDrawer}
                  settings={settings}
                  handleLogout={handleLogout}
                  isDrawer={false}
                />
              )}
              <button
                disabled={isAdListingClicked}
                onClick={handleCheckLogin}
                className="text-[14px] font-[Inter-SemiBold] text-[#fff] cursor-pointer rounded-[5px] p-[8px_20px] bg-[#DC0000] max-sm:text-[10px] max-sm:p-[10px]"
              >
                Place Your Ad
              </button>
            </div>
          </div>

          {/* Mobile: hamburger button */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="md:hidden p-2 rounded-lg text-[#000000CC] hover:bg-gray-100"
            aria-label="Open menu"
          >
            <HamburgerIcon />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-[9999] md:hidden transition-opacity duration-300 ${isMobileDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        aria-hidden={!isMobileDrawerOpen}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={closeMobileDrawer}
        />
        {/* Drawer panel - slide from left */}
        <div
          className={`absolute top-0 left-0 h-full w-[min(300px,85vw)] max-w-[300px] bg-white shadow-xl flex flex-col transition-transform duration-300 ease-out ${isMobileDrawerOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex items-center justify-end p-[4px]">
            <button
              type="button"
              onClick={closeMobileDrawer}
              className="p-2 rounded-lg text-[#000] hover:bg-gray-100"
              aria-label="Close menu"
            >
              <MdClose size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-[20px]">
            {/* City selector in drawer */}
            <div className="">
              <div className="relative mb-[10px]" ref={mobileCityDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsCityDropdownOpen((prev) => !prev)}
                  className="w-full flex items-center gap-[4px]py-2 text-[14px] font-[Inter-Regular] text-[#000]"
                >
                  <span className="max-w-[220px] truncate">{selectedCity}</span>
                  <DownArrowIcon className="w-[16px] h-[16px] [&_path]:stroke-[#000]" />
                </button>
                {isCityDropdownOpen && (
                  <div
                    ref={mobileCityMenuRef}
                    onScroll={handleCitiesScroll}
                    className="absolute left-0 top-full mt-1 w-full min-w-[200px] max-h-[280px] overflow-y-auto bg-white rounded-[8px] border border-gray-200 shadow-lg py-2 z-10"
                  >
                    {cities.map((city) => {
                      const isSelected = city.label === selectedCity;
                      return (
                        <button
                          key={city.id}
                          type="button"
                          onClick={() => handleSelectCity(city)}
                          className={`w-full text-left px-4 py-2.5 text-[14px] font-[Inter-Regular] text-[#000] hover:bg-gray-50 ${isSelected ? "font-[Inter-SemiBold] bg-gray-50" : ""}`}
                        >
                          <span className="block truncate">{city.label}</span>
                        </button>
                      );
                    })}
                    {isCitiesLoading && (
                      <div className="px-4 py-2 text-[13px] text-[#8F8F8F]">
                        Loading...
                      </div>
                    )}
                    {isCitiesFirstLoadDone &&
                      !isCitiesLoading &&
                      cities.length === 1 && (
                        <div className="px-4 py-2 text-[13px] text-[#8F8F8F]">
                          No cities found
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
            {/* Nav links */}
            <div className="flex flex-col gap-[10px]">
              {[
                {
                  label: "Notification",
                  icon: <NotificationIcon />,
                  path: "/notifications",
                },
                {
                  label: "My Searches",
                  icon: <MySearchIcon />,
                  path: "/mysearch",
                },
                {
                  label: "Favorites",
                  icon: <FavouriteIcon />,
                  path: "/favourites",
                },
                { label: "Chats", icon: <ChatIcon />, path: "/chat" },
                { label: "My Ads", icon: <AdsIcon />, path: "/myads" },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() =>
                    navLinkClick(() =>
                      handleProtectedHeaderAction(() => router.push(item.path)),
                    )
                  }
                  className="w-full flex items-center gap-3  rounded-lg text-[14px] font-[Inter-Regular] text-[#000000CC] hover:bg-gray-100 text-left"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <HeaderCategories headerCatSelected={headerCatSelected} />

      <LoginModal
        IsLoginModalOpen={IsLoginModalOpen}
        setIsLoginModalOpen={setIsLoginModalOpen}
        setIsRegisterModalOpen={setIsRegisterModalOpen}
        IsMailSentOpen={IsMailSentOpen}
        setIsMailSentOpen={setIsMailSentOpen}
        IsRegisterModalOpen={IsRegisterModalOpen}
        openSentMailModal={openSentMailModal}
      />

      <MailSentSucessfully
        IsMailSentOpen={IsMailSentOpen}
        OnHide={() => setIsMailSentOpen(false)}
        IsLoginModalOpen={() => setIsLoginModalOpen(true)}
      />

      <LocationModal
        IsLocationModalOpen={IsLocationModalOpen}
        OnHide={() => setIsLocationModalOpen(false)}
      />

      <GetVerifiedModal
        isOpen={isGetVerifiedModalOpen}
        onClose={() => setIsGetVerifiedModalOpen(false)}
        onMaybeLater={() => setIsGetVerifiedModalOpen(false)}
        nextModalType="safety"
        onVerifiedSuccess={() => {
          setIsGetVerifiedModalOpen(false);
        }}
      />
    </>
  );
};

export default Header;
