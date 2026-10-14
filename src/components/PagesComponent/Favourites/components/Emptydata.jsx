import React from "react";
import postads from "../../../../../public/assets/img/postads.png";
import Image from "next/image";

const Emptydata = ({name}) => {
    return (
        <div className="mt-[20px] flex flex-col items-center justify-center gap-[40px] text-center">
            <div>
                <Image loading="lazy" src={postads} alt="no_img" width={200} height={200} />
            </div>
            <div className="flex flex-col items-center gap-[10px]">
                <h3 className="text-[18px] font-[Inter-Medium] text-[#000]">You have no favorites yet</h3>
                <div className="text-[14px] font-[Inter-SemiBold] text-[#000000BF] leading-[30px]">
                    <p>Use the favorite icon to save ads that you want to check later</p>
                    <p>Select your preferred list to organize your favorites.</p>
                </div>
                <button className="text-[#3A88EF] text-[14px] font-[Inter-SemiBold] cursor-pointer">Continue searching</button>
            </div>
        </div>
    );
};

export default Emptydata;
