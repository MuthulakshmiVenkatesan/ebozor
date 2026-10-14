import React from "react";
import NoDataFound from "../../../public/assets/no_data_found_illustrator.svg";
import Image from "next/image";
import { placeholderImage, t } from "@/utils";

const NoData = ({name}) => {
    return (
        <div className="flex flex-col items-center justify-center gap-[20px] text-center p-[20px]">
            <div>
                <Image loading="lazy" src={NoDataFound} alt="no_img" width={200} height={200}  onError={placeholderImage}/>
            </div>
            <div className="flex flex-col gap-[6px]">
                <h3 className="text-[18px] font-[Inter-Bold] text-[#23262A]">{t('no')} {name} {t('found')}</h3>
                <span className="text-[14px] font-[Inter-Regular] text-[#23262A]">{t('sorryTryAnotherWay')}</span>
            </div>
        </div>
    );
};

export default NoData;
