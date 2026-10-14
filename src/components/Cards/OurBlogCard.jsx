'use client'
import Image from 'next/image'
import Link from 'next/link'
import { placeholderImage, t } from '@/utils'
import { CategoryIcon } from '@/components/CustomFile/icons'

const OurBlogCard = ({ data }) => {

    const maxLength = 100;
    const stripHtmlAndTruncate = (html, maxLength) => {
        const div = document.createElement('div');
        div.innerHTML = html;
        const text = div.innerText;
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    return (

        <div className='border border-[rgba(143,143,143,0.45)] bg-white p-[16px] rounded-[8px]'>
            <Image src={data?.image} width={200} height={200} alt={data?.title} className='object-cover w-full h-[150px]' onErrorCapture={placeholderImage} />
            <h4 className='mb-[10px] text-[16px] font-[Inter-Medium] text-[#23262A]'>
                {data?.title}
            </h4>
            <div className='text-[14px] font-[Inter-Regular] text-[#23262A] line-clamp-2 mb-[10px]' dangerouslySetInnerHTML={{ __html: data?.description }} />
            <Link href={`/blogs/${data?.slug}`} className='flex items-center gap-[10px]' >
                <p className='text-[14px] font-[Inter-Regular] text-[#DC0000]'>
                    {t('readArticle')}
                </p>
                <CategoryIcon className='w-[20px] h-[20px]' fill='#DC0000' />
            </Link>
        </div>

    )
}

export default OurBlogCard