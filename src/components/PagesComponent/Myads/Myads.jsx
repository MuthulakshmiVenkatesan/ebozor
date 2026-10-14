"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MoreIcon } from "@/components/CustomFile/icons";
import search1 from "../../../../public/assets/img/search/1.png";
import ratinggraph from "../../../../public/assets/img/icons/ratinggraph.svg";
import { DeleteIcon, TickIcon } from "@/components/CustomFile/icons";
import clock from "../../../../public/assets/img/icons/clock.svg";
import DeleteAdConfirmModal from "./components/DeleteAdConfirmModal";
import EmptyAdsState from "./components/EmptyAdsState";
import { chanegItemStatusApi, getMyItemsApi, getMyItemsCountApi } from "@/utils/api";
import { isLogin } from "@/utils";
import VerifiedMain from '../GetVerified/VerifiedMain'
import toast from "react-hot-toast";
import { MdKeyboardArrowDown } from "react-icons/md";
import { PaginationPrevIcon, PaginationNextIcon } from "@/components/CustomFile/icons";
import SoldOutModal from "../SingleListing/SoldOutModal";
import SoldOutConfirmModal from "../SingleListing/SoldOutConfirmModal";
import { useRouter } from "next/navigation";
import { buildItemDetailHref } from "@/utils/buildItemDetailHref";

const Myads = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("All Ads");
  const [selectedAds, setSelectedAds] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const hasSelected = selectedAds.length > 0;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetIds, setDeleteTargetIds] = useState([]);
  const deleteCount = deleteTargetIds?.length || 0;
  const [adItems, setAdItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusDraftById, setStatusDraftById] = useState({});
  const [statusSavingById, setStatusSavingById] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [tabCounts, setTabCounts] = useState({
    "All Ads": 0,
    Live: 0,
    // Drafts: 0,
    "Payment Pending": 0,
    "Under Review": 0,
    Rejected: 0,
    Expired: 0,
  });
  const [isSoldOutModalOpen, setIsSoldOutModalOpen] = useState(false);
  const [isSoldOutConfirmModalOpen, setIsSoldOutConfirmModalOpen] = useState(false);
  const [selectedSoldToUserId, setSelectedSoldToUserId] = useState(null);
  const [soldOutTargetAd, setSoldOutTargetAd] = useState(null);

  const normalizeStatusRaw = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ");

  const toDisplayStatus = (status) => {
    const value = normalizeStatusRaw(status);
    if (value === "approved") return "Live";
    // if (value === "draft") return "Draft";
    if (value === "pending payment" || value === "payment pending")
      return "Payment Pending";
    if (value === "under review" || value === "review")
      return "Under Review";
    if (value === "rejected") return "Rejected";
    if (value === "expired") return "Expired";
    if (value === "inactive") return "Inactive";
    if (value === "sold out") return "Sold Out";
    return status || "Live";
  };

  const statusBadgeClass = (statusRaw) => {
    switch (toDisplayStatus(statusRaw)) {
      case "Live":
        return "bg-[#3A88EF]";
      case "Payment Pending":
        return "bg-[#e96b2b]";
      case "Under Review":
        return "bg-[#008000cc]";
      case "Rejected":
        return "bg-[#ff000099]";
      case "Expired":
        return "bg-[#DC0000]";
      case "Draft":
        return "bg-[#6B7280]";
      case "Sold Out":
        return "bg-[#6B7280]";
      case "Inactive":
        return "bg-[#6B7280]";
      default:
        return "bg-[#3A88EF]";
    }
  };

  const formatUpdatedAt = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const getExpiresIn = (expiryDate) => {
    if (!expiryDate) return "N/A";
    const expiry = new Date(expiryDate);
    if (Number.isNaN(expiry.getTime())) return "N/A";
    const today = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / msPerDay);
    if (diffDays <= 0) return "0 days";
    return `${diffDays} days`;
  };

  const tabToApiStatus = (tab) => {
    switch (tab) {
      case "Live":
        return "approved";
      // case "Drafts":
      //   return "draft";
      case "Payment Pending":
        return "pending payment";
      case "Under Review":
        return "review";
      case "Rejected":
        return "rejected";
      case "Expired":
        return "expired";
      case "All Ads":
      default:
        return "";
    }
  };

  const fetchMyItems = async (page = 1, tab = activeTab) => {
    try {
      setIsLoading(true);
      const status = tabToApiStatus(tab);
      const response = await getMyItemsApi.getMyItems({ page, per_page: 10, status: status || undefined });
      const body = response?.data;
      const payload = body?.data;
      const items = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
      const mapped = items.map((item) => {
        const statusRaw = normalizeStatusRaw(item?.status);
        return {
          statusRaw,
          id: item?.id,
          slug: item?.slug || (item?.id != null ? String(item.id) : ""),
          propertyType: item?.property_type,
          categorySlug: item?.category?.slug || item?.category_slug || "",
          itemCategory:
            item?.item_category ||
            item?.category?.translated_name ||
            item?.category?.name ||
            item?.category_name ||
            "",
          title: item?.name || "Untitled",
          price: `${item?.currency || ""} ${item?.price ?? ""}`.trim(),
          status: toDisplayStatus(item?.status),
          updatedAt: formatUpdatedAt(item?.updated_at),
          expiresIn: getExpiresIn(item?.expiry_date),
          showPayment:
            statusRaw === "pending payment" || statusRaw === "payment pending",
          image: item?.image || "",
        };
      });
      setAdItems(mapped);
      const pageMeta = Array.isArray(payload?.data) ? payload : Array.isArray(payload) ? {} : payload || {};
      setCurrentPage(pageMeta?.current_page || page || 1);
      setLastPage(pageMeta?.last_page || 1);
      const listTotal = Number(pageMeta?.total);
      if (Number.isFinite(listTotal) && listTotal >= 0) {
        setTabCounts((prev) => ({
          ...prev,
          [tab]: listTotal,
        }));
      }
    } catch {
      setAdItems([]);
      setCurrentPage(1);
      setLastPage(1);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTabCounts = async () => {
    if (!isLogin()) return;
    try {
      const res = await getMyItemsCountApi.getMyItemsCount();
      const data = res?.data?.data || {};
      setTabCounts({
        "All Ads": Number(data?.all_ads || 0),
        Live: Number(data?.live || 0),
        // Drafts: Number(data?.drafts || 0),
        "Payment Pending": Number(data?.payment_pending || 0),
        "Under Review": Number(data?.under_review || 0),
        Rejected: Number(data?.rejected || 0),
        Expired: Number(data?.expired || 0),
      });
    } catch {
      // no-op: keep previous counts
    }
  };

  useEffect(() => {
    if (!isLogin()) return;
    let cancelled = false;
    (async () => {
      await refreshTabCounts();
      if (cancelled) return;
      await fetchMyItems(currentPage, activeTab);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, currentPage]);

  const tabs = [
    { label: "All Ads", count: tabCounts["All Ads"] },
    { label: "Live", count: tabCounts["Live"] },
    // { label: "Drafts", count: tabCounts["Drafts"] },
    { label: "Payment Pending", count: tabCounts["Payment Pending"] },
    { label: "Under Review", count: tabCounts["Under Review"] },
    { label: "Rejected", count: tabCounts["Rejected"] },
    { label: "Expired", count: tabCounts["Expired"] },
  ];

  const activeTabCount = adItems.length;
  const totalPages = Math.max(1, Number(lastPage) || 1);
  const emptyTitle = `You don't have any ads that are ${activeTab.replace(/Ads$/i, "").trim().toLowerCase()}`;

  const toggleAdSelection = (id) => {
    setSelectedAds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const requestDelete = (ids) => {
    const normalized = Array.isArray(ids) ? ids : [ids];
    if (!normalized || normalized.length === 0) return;
    setDeleteTargetIds(normalized);
    setOpenMenuId(null);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTargetIds || deleteTargetIds.length === 0) return;
    setAdItems((prev) => prev.filter((ad) => !deleteTargetIds.includes(ad.id)));
    setSelectedAds((prev) =>
      prev.filter((id) => !deleteTargetIds.includes(id)),
    );
    setIsDeleteModalOpen(false);
    setDeleteTargetIds([]);
  };

  const updateAdStatus = async (ad, options = {}) => {
    const nextStatus = options?.status || statusDraftById?.[ad.id] || ad.statusRaw;
    const soldTo = options?.sold_to ?? null;
    if (!ad?.id) return;
    if (nextStatus === ad.statusRaw) {
      toast.error("Change status to save");
      return;
    }
    try {
      setStatusSavingById((prev) => ({ ...prev, [ad.id]: true }));
      const res = await chanegItemStatusApi.changeItemStatus({
        item_id: ad.id,
        status: nextStatus,
        sold_to: soldTo || undefined,
      });
      if (res?.data?.error === false) {
        setAdItems((prev) =>
          prev.map((item) =>
            item.id === ad.id
              ? {
                  ...item,
                  statusRaw: String(nextStatus).toLowerCase(),
                  status: toDisplayStatus(nextStatus),
                }
              : item,
          ),
        );
        toast.success("Status updated");
        refreshTabCounts();
        setOpenMenuId(null);
      } else {
        toast.error(res?.data?.message || "Failed to update status");
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusSavingById((prev) => ({ ...prev, [ad.id]: false }));
    }
  };

  const openChangeStatusModal = (ad) => {
    if (!ad) return;
    setSoldOutTargetAd(ad);
    setOpenMenuId(null);
    setIsSoldOutModalOpen(true);
  };

  const handleEditAd = (ad) => {
    if (!ad?.id) return;
    setOpenMenuId(null);
    router.push(`/placeyourad?editItemId=${encodeURIComponent(String(ad.id))}`);
  };

  const getAdDetailHref = (ad) =>
    buildItemDetailHref(
      ad?.slug || ad?.id,
      ad?.propertyType,
      ad?.itemCategory,
      ad?.categorySlug,
    );

  const handleSoldOutSelectionNext = () => {
    setIsSoldOutModalOpen(false);
    setIsSoldOutConfirmModalOpen(true);
  };

  const makeItemSoldOutFromMyAds = async () => {
    if (!soldOutTargetAd?.id) return;
    await updateAdStatus(soldOutTargetAd, {
      status: "sold out",
      sold_to: selectedSoldToUserId || undefined,
    });
    setIsSoldOutConfirmModalOpen(false);
    setSelectedSoldToUserId(null);
    setSoldOutTargetAd(null);
  };

  useEffect(() => {
    if (!isDeleteModalOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsDeleteModalOpen(false);
        setDeleteTargetIds([]);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isDeleteModalOpen]);

  return (
    <>
      <div className="w-full mx-auto">
        <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
          <div className="mb-[16px]">
            <h4 className="text-[#000] text-[20px] font-[Inter-Bold]">
              My Ads
            </h4>
          </div>

          <div className="flex items-center gap-[10px] overflow-x-auto whitespace-nowrap hide_scrollbar pb-[4px]">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.label;
              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.label);
                    setCurrentPage(1);
                    setSelectedAds([]);
                    setOpenMenuId(null);
                  }}
                  className={`p-[6px_16px] rounded-full border text-[14px] font-[Inter-SemiBold] cursor-pointer ${
                    isActive
                      ? "bg-[#000000CC] text-white border-[#000000CC]"
                      : "bg-[#F8F8F8] text-[#000] border-[rgba(143,143,143,0.24)]"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              );
            })}
          </div>

          <div className="border-b border-[rgba(143,143,143,0.22)] mt-[14px] mb-[14px]" />

          <div className="mb-[18px] flex flex-col gap-[16px] md:flex-row md:items-stretch">
            <div className="min-w-0 flex-1">
              <VerifiedMain showTickBadge={false} showVerifiedBadge={false} />
            </div>

            <div className="relative min-w-0 flex-1 overflow-hidden rounded-[10px] bg-[rgba(58,136,239,0.14)] pl-[16px] rtl:pl-0 rtl:pr-[16px]">
              <div className="flex h-full items-center justify-between gap-[12px]">
                <div className="py-[16px]">
                  <div className="mb-[2px] flex flex-wrap items-center gap-[8px]">
                    <h5 className="text-[16px] font-[Inter-SemiBold] text-[#000000B2]">
                      Get detailed insights for your ads
                    </h5>
                    <span className="rounded-full bg-[#3A88EF] p-[2px_8px] text-[10px] font-[Inter-SemiBold] text-white">
                      NEW
                    </span>
                  </div>
                  <p className="text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
                    See how many people are interested in your ad
                  </p>
                </div>
                <div>
                  <Image
                    src={ratinggraph}
                    alt="ratinggraph"
                    className="h-[88px] w-[100px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="mb-[30px] text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
              Loading ads...
            </div>
          ) : activeTabCount === 0 ? (
            <EmptyAdsState
              title={emptyTitle}
              onButtonClick={() => {
                // TODO: navigate to post ad page
                console.log("Post ad now");
              }}
            />
          ) : (
            <div className="overflow-hidden mb-[30px]">
              <div className="mb-[14px] flex items-center justify-between gap-[12px]">
                <div className="flex items-center gap-[12px]">
                  <label className="relative flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAds.length > 0}
                      onChange={(e) =>
                        setSelectedAds(
                          e.target.checked
                            ? adItems.map((ad) => ad.id)
                            : [],
                        )
                      }
                      className="w-[22px] h-[22px] appearance-none border-2 border-[rgba(143,143,143,0.5)] rounded 
                                         checked:bg-[#fff] checked:border-[#DC0000] cursor-pointer"
                    />
                    {selectedAds.length > 0 ? (
                      <TickIcon
                        className="w-[24px] h-[22px] absolute left-[-1px]"
                        fill="#DC0000"
                      />
                    ) : null}
                  </label>
                  <p className="text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
                    {selectedAds.length} ads selected
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!hasSelected}
                  className={`flex items-center gap-[4px] p-[6px_14px] rounded-[8px] bg-[#F5F5F5] text-[14px] font-[Inter-Regular] cursor-pointer border border-[rgba(143,143,143,0.24)] ${
                    hasSelected
                      ? "text-[#000000CC] hover:bg-black/5"
                      : "text-[#B6B6B6] cursor-not-allowed"
                  }`}
                  onClick={() => {
                    if (!hasSelected) return;
                    requestDelete(selectedAds);
                  }}
                >
                  <DeleteIcon
                    className={`w-[20px] h-[20px] ${hasSelected ? "block" : "hidden"}`}
                  />
                  <p
                    className={`text-[14px] font-[Inter-Regular] leading-[24px] ${hasSelected ? "text-[#000000CC]" : "text-[#8F8F8F]"}`}
                  >
                    Delete
                  </p>
                </button>
              </div>

              <div className="p-[14px_16px] bg-[#F3F4F6]">
                <h5 className="text-[14px] font-[Inter-SemiBold] text-[#000]">
                  {activeTab} ({tabCounts[activeTab] ?? adItems.length})
                </h5>
              </div>

              <div className="p-[14px_16px] border-b border-[rgba(143,143,143,0.18)] text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
                Motorcycle
              </div>

              <div className="divide-y divide-[rgba(143,143,143,0.18)]">
                {adItems.map((ad) => {
                  const detailHref = getAdDetailHref(ad);
                  return (
                  <div
                    key={ad.id}
                    className="p-[14px_16px] flex items-center justify-between gap-[16px]"
                  >
                    <div className="max-sm:flex-wrap flex min-w-0 flex-1 items-center gap-[14px]">
                      <div className="flex min-w-0 flex-1 items-center gap-[14px]">
                        <label className="relative flex shrink-0 items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedAds.includes(ad.id)}
                            onChange={() => toggleAdSelection(ad.id)}
                            className="w-[22px] h-[22px] appearance-none border-2 border-[rgba(143,143,143,0.5)] rounded 
                                         checked:bg-[#fff] checked:border-[#DC0000] cursor-pointer"
                          />
                          {selectedAds.includes(ad.id) ? (
                            <TickIcon
                              className="w-[24px] h-[22px] absolute left-[-1px]"
                              fill="#DC0000"
                            />
                          ) : null}
                        </label>
                        {detailHref ? (
                          <Link
                            href={detailHref}
                            prefetch={false}
                            className="flex min-w-0 flex-1 items-center gap-[14px] hover:opacity-90"
                          >
                            <Image
                              src={ad.image || search1}
                              alt="ad thumbnail"
                              width={74}
                              height={74}
                              className="w-[100px] h-[100px] shrink-0 rounded-[8px] object-cover border border-[rgba(143,143,143,0.24)]"
                            />
                            <div className="flex min-w-0 flex-col gap-[4px]">
                              <span
                                className={`inline-flex w-fit p-[2px_8px] text-white rounded-full text-[12px] font-[Inter-SemiBold] items-center ${statusBadgeClass(ad.statusRaw)}`}
                              >
                                {toDisplayStatus(ad.statusRaw)}
                              </span>
                              <h6 className="text-[16px] font-[Inter-SemiBold] text-[#000000CC] truncate">
                                {ad.title}
                              </h6>
                              <div className="max-sm:flex-wrap max-sm:gap-[4px] flex items-center gap-[14px]">
                                <p className="text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
                                  {ad.price}
                                </p>
                                <div className="p-[2px] rounded-full bg-[#8F8F8F]"></div>
                                <p className="text-[14px] font-[Inter-Regular] text-[#8F8F8F]">
                                  Last Updated: {ad.updatedAt}
                                </p>
                              </div>
                              <div className="flex items-center gap-[4px]">
                                <Image
                                  src={clock}
                                  alt="clock"
                                  className="w-[16px] h-[16px]"
                                />
                                <p className="text-[14px] font-[Inter-Medium] text-[#000000CC] mt-[2px]">
                                  Ad expires in {ad.expiresIn}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ) : (
                          <>
                            <Image
                              src={ad.image || search1}
                              alt="ad thumbnail"
                              width={74}
                              height={74}
                              className="w-[100px] h-[100px] shrink-0 rounded-[8px] object-cover border border-[rgba(143,143,143,0.24)]"
                            />
                            <div className="flex min-w-0 flex-col gap-[4px]">
                              <span
                                className={`inline-flex w-fit p-[2px_8px] text-white rounded-full text-[12px] font-[Inter-SemiBold] items-center ${statusBadgeClass(ad.statusRaw)}`}
                              >
                                {toDisplayStatus(ad.statusRaw)}
                              </span>
                              <h6 className="text-[16px] font-[Inter-SemiBold] text-[#000000CC] truncate">
                                {ad.title}
                              </h6>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-end gap-[34px] flex-col">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId((prev) =>
                              prev === ad.id ? null : ad.id,
                            );
                          }}
                          className="cursor-pointer"
                        >
                          <MoreIcon className="w-[20px] h-[20px] rotate-90" />
                        </button>
                        {openMenuId === ad.id ? (
                          <div
                            className="absolute end-0 top-[30px] w-[140px] bg-white border border-[rgba(143,143,143,0.2)] rounded-[6px] shadow-[0_8px_20px_rgba(0,0,0,0.1)] overflow-hidden z-[10]"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className="cursor-pointer w-full p-[10px] text-left text-[12px] font-[Inter-Regular] text-[#23262A] hover:bg-[#F5F5F5]"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAd(ad);
                              }}
                            >
                              Edit
                            </button>
                            {ad.statusRaw === "approved" ? (
                              <button
                                type="button"
                                className="cursor-pointer w-full p-[10px] text-left text-[12px] font-[Inter-Regular] text-[#23262A] hover:bg-[#F5F5F5]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateAdStatus(ad, { status: "inactive" });
                                }}
                              >
                                Deactivate
                              </button>
                            ) : null}
                            {ad.statusRaw === "approved" ? (
                              <button
                                type="button"
                                className="cursor-pointer w-full p-[10px] text-left text-[12px] font-[Inter-Regular] text-[#23262A] hover:bg-[#F5F5F5]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openChangeStatusModal(ad);
                                }}
                              >
                                Sold Out
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="cursor-pointer w-full p-[10px] text-left text-[12px] font-[Inter-Regular] text-[#23262A] hover:bg-[#F5F5F5]"
                              onClick={(e) => {
                                e.stopPropagation();
                                requestDelete([ad.id]);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>

                      {ad.showPayment ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!ad?.id) return;
                            router.push(
                              `/placeyourad?paymentItemId=${encodeURIComponent(String(ad.id))}`
                            );
                          }}
                          className="w-full p-[6px_14px] rounded-[8px] border border-[#DC0000] text-[#DC0000] text-[14px] font-[Inter-SemiBold] cursor-pointer"
                        >
                          Complete Payment
                        </button>
                      ) : null}
                    </div>
                  </div>
                  );
                })}
              </div>
              {lastPage > 1 ? (
                <>
                               <div className="mt-[20px] flex items-center justify-end">
                            <div className="flex items-center gap-[10px]">
                                <button
                                    type="button"
                                    disabled={currentPage <= 1 || isLoading}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    className="bg-[rgba(143,143,143,0.12)] rounded-[6px] w-[32px] h-[32px] flex items-center justify-center cursor-pointer"
                                >
                                    <PaginationPrevIcon
                                        className='rtl:rotate-180'
                                        stroke={currentPage <= 1 ? '#8F8F8F' : '#000'}
                                    />
                                </button>
                                <div className="flex items-center gap-[10px]">
                                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                                        (page) => (
                                            <button
                                                key={page}
                                                type="button"
                                                onClick={() => setCurrentPage(page)}
                                                className={` rounded-[6px] w-[32px] h-[32px] flex items-center justify-center cursor-pointer text-[12px] font-[Inter-Medium] ${
                                                    currentPage === page
                                                        ? 'bg-[#DE2D33] text-white'
                                                        : 'bg-[rgba(143,143,143,0.12)] text-[#8F8F8F]'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    )}
                                </div>
                                <button
                                    type="button"
                                    disabled={currentPage >= lastPage || isLoading}
                                    onClick={() =>
                                      setCurrentPage((prev) => Math.min(lastPage, prev + 1))
                                    }
                                    className="bg-[rgba(143,143,143,0.12)] rounded-[6px] w-[32px] h-[32px] flex items-center justify-center cursor-pointer"
                                >
                                    <PaginationNextIcon
                                        className='rtl:rotate-180'
                                        stroke={currentPage >= totalPages ? '#8F8F8F' : '#000'}
                                    />
                                </button>
                            </div>
                        </div>
                        </>
              ) : null}


            </div>
          )}
        </div>
      </div>

      <DeleteAdConfirmModal
        open={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteTargetIds([]);
        }}
        onConfirm={confirmDelete}
        selectedCount={deleteCount}
      />
      <SoldOutModal
        SingleListing={soldOutTargetAd || {}}
        IsSoldOutModalOpen={isSoldOutModalOpen}
        OnHide={() => {
          setIsSoldOutModalOpen(false);
          setSelectedSoldToUserId(null);
          setSoldOutTargetAd(null);
        }}
        handleSoldOut={handleSoldOutSelectionNext}
        selectedRadioValue={selectedSoldToUserId}
        setSelectedRadioValue={setSelectedSoldToUserId}
      />
      <SoldOutConfirmModal
        isOpen={isSoldOutConfirmModalOpen}
        OnHide={() => {
          setIsSoldOutConfirmModalOpen(false);
          setSelectedSoldToUserId(null);
          setSoldOutTargetAd(null);
        }}
        makeItemSoldOut={makeItemSoldOutFromMyAds}
      />
    </>
  );
};

export default Myads;
