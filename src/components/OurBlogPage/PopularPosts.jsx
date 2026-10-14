'use client'
import Image from "next/image"
import { placeholderImage, t, truncate } from "@/utils"
import Link from "next/link"

const PopularPosts = ({ data }) => {
    return (

        <div className="border border-[rgba(143,143,143,0.45)] bg-white rounded-[8px]">
            <h6 className="mb-[10px] text-[16px] font-[Inter-Medium] text-[#23262A] p-[16px] border-b border-[rgba(143,143,143,0.45)]">{t('popularPosts')}</h6>
            <div className="flex flex-wrap gap-[10px] p-[16px]">
                {data?.map((data, index) => (
                    <Link href={`/blogs/${data?.slug}`} key={index}>
                        <div className="flex items-center gap-[10px]">
                            <Image src={data?.image} width={66} height={55} alt="Product" className="w-[66px] h-[55px] object-cover" onErrorCapture={placeholderImage} />
                            <h6 className="text-[14px] font-[Inter-Regular] text-[#23262A] line-clamp-2">{truncate(data?.title, 40)}</h6>
                        </div>
                    </Link>
                ))}
            </div>

        </div>
    )
}

export default PopularPosts