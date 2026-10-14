'use client'
import Image from "next/image"
import {LocationIcon} from "@/components/CustomFile/icons"
import { FaRegHeart } from "react-icons/fa";
import { formatDate, formatPriceAbbreviated, placeholderImage, t } from "@/utils";
import { BiBadgeCheck } from "react-icons/bi";
import { FaHeart } from "react-icons/fa6";
import { manageFavouriteApi } from "@/utils/api";
import toast from "react-hot-toast";
import { userSignUpData } from '../../redux/reuducer/authSlice';
import { useSelector } from "react-redux";
import Swal from "sweetalert2";


const ProductCard = ({ data, handleLike }) => {
    const userData = useSelector(userSignUpData)
    const systemSettingsData = useSelector((state) => state?.Settings)
    const CurrencySymbol = systemSettingsData?.data?.data?.currency_symbol


    const handleLikeItem = async (e) => {

        e.preventDefault();
        e.stopPropagation();

        try {
            if (!userData) {
                Swal.fire({
                    icon: "error",
                    title: t('oops'),
                    text: t("loginToAddOrRemove"),
                    allowOutsideClick: false,
                    customClass: {
                        confirmButton: 'Swal-confirm-buttons',
                    },

                })
                return
            }
            const response = await manageFavouriteApi.manageFavouriteApi({ item_id: data?.id })
            if (response?.data?.error === false) {
                toast.success(response?.data?.message)
                handleLike(data?.id)
            }
            else {
                toast.success(t('failedToLike'))
            }

        } catch (error) {
            console.log(error)
            toast.success(t('failedToLike'))
        }
    }


    return (
        <div className="rounded-[6px] hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.12)] transition-all duration-300">
            <div className="">
                <div className="relative">
                    <Image src={data?.image} width={220} height={190} alt="Product" className="rounded-[5px_5px_0px_0px] h-[170px] w-full object-cover max-sm:h-[130px] product_card_img" onErrorCapture={placeholderImage} />
                    <p className="absolute bottom-[10px] right-[10px] text-[12px] font-[Inter-SemiBold] text-[#FFF]">{formatDate(data?.created_at)}&lrm;</p>
                </div>
                {/* {data?.is_feature ? (
                    <div className="">
                        <BiBadgeCheck size={16} color="white" />
                        <p className="">{t('featured')}</p>
                    </div>
                ) : null} */}

                {/* <div className="" onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLikeItem(e);
                }}>
                    {data?.is_liked ? (
                        <button className="isLiked">
                            <FaHeart size={24} className="" />
                        </button>
                    ) : (

                        <button>
                            <FaRegHeart size={24} className="" />
                        </button>
                    )}
                </div> */}
            </div>
            <div className="p-[10px]">
                <h4 className="text-[16px] font-[Inter-SemiBold] text-[#DC0000] mb-[4px]">{CurrencySymbol} {formatPriceAbbreviated(data?.price)}</h4>
                <p className="text-[14px] font-[Inter-Medium] text-[#000000] mb-[4px] truncate">{data?.name}</p>
                <div className="flex items-center gap-[4px]">
                    <LocationIcon className="flex-shrink-0" />
                    <p className="text-[14px] font-[Inter-Regular] text-[#666] truncate">
                        {data?.city}{data?.city ? "," : null}{data?.state}{data?.state ? "," : null}{data?.country}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ProductCard