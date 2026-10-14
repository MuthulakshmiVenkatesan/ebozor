'use client'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import BreadcrumbComponent from '@/components/Breadcrumb/BreadcrumbComponent'
import OurBlogCard from '@/components/Cards/OurBlogCard'
import { t } from '@/utils'
import { getBlogTagsApi, getBlogsApi } from '@/utils/api'
import Tags from '@/components/OurBlogPage/Tags'
import { useSelector } from 'react-redux'
import { searchedTag } from '@/redux/reuducer/searchSlice'
import PopularPosts from '@/components/OurBlogPage/PopularPosts'
import NoData from '@/components/NoDataFound/NoDataFound'
import { CurrentLanguageData } from '@/redux/reuducer/languageSlice'
import logo from '../../../../public/assets/img/logo.png'
import legalbg from '../../../../public/assets/img/legalbg.png'

const Blogs = () => {

    const CurrentLanguage = useSelector(CurrentLanguageData)
    const tag = useSelector(searchedTag)
    const [Blogs, setBlogs] = useState([])
    const [blogTags, setBlogTags] = useState([])
    const [populerBlogs, setPopulerBlogs] = useState([])
    const getBlogsData = async () => {
        try {
            const res = await getBlogsApi.getBlogs({
                tag: tag ? tag : ""
            })
            setBlogs(res?.data?.data?.data)

        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        getBlogsData()
    }, [tag])

    const getBlogTagsData = async () => {
        try {
            const res = await getBlogTagsApi.getBlogs({})
            setBlogTags(res?.data?.data)
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        getBlogTagsData()
    }, [])
    const getPopulerBlogsData = async () => {
        try {
            const res = await getBlogsApi.getBlogs({ sort_by: "new-to-old" })
            setPopulerBlogs(res?.data?.data?.data)
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        getPopulerBlogsData()
    }, [])

    return (
    
        <div className="w-full mx-auto">
            <div className="bg-white">
                <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container flex items-center justify-between py-[8px]">
                    <Link href="/" className="inline-flex items-center">
                        <Image src={logo} alt="logo" width={120} height={60} className="h-[52px] w-auto" />
                    </Link>
                    <Link
                        href="/placeyourad"
                        className="inline-flex items-center justify-center rounded-[8px] bg-[#DC0000] px-[18px] py-[10px] text-[12px] font-[Inter-Bold] uppercase text-white"
                    >
                        Place your ad
                    </Link>
                </div>
            </div>
            <div className="relative border-t border-[rgba(143,143,143,0.2)] p-[30px_0] max-sm:px-[15px]"
                style={{
                    backgroundImage: `url(${legalbg.src})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'right',
                    backgroundRepeat: 'no-repeat',
                }}
            >

                <div className="max-w-[1170px] relative mx-auto max-sm:max-w-full">
                    <p className="text-[14px] font-[Inter-Regular] text-[#2A2C2D]">
                        <Link href="/" className="underline">
                            Legal Hub
                        </Link>{' '}
                        » Privacy Policy
                    </p>
                </div>
            </div>
            <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container py-[20px]">
                <div>
                    <h4 className="mb-[10px] text-[32px] font-[Inter-Medium] text-[#222]">
                        ebozor
                    </h4>
                    <h3 className="text-[40px] font-[Inter-Medium] text-[#222]">
                        Our Blogs
                    </h3>

                </div>
                <div className="page_content">
                    <div className="grid grid-cols-[1fr_300px] gap-[20px] max-sm:grid-cols-1">
                        <div className="">
                            {Blogs && Blogs?.length > 0 ? (
                                Blogs.map((item, index) => (
                                    <div className="" key={index}>
                                        <OurBlogCard data={item} />
                                    </div>
                                ))) : (
                                <div>
                                    <NoData name={t('blog')} />
                                </div>
                            )}
                        </div>
                        <div className="">
                            <div className="">
                                {blogTags && blogTags?.length > 0 &&
                                    <Tags data={blogTags} />
                                }
                            </div>
                            <div className="">
                                {populerBlogs && populerBlogs.length > 0 &&
                                    <PopularPosts data={populerBlogs} />
                                }
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default Blogs
