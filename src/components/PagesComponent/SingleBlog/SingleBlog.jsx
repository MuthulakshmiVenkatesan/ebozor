'use client'
import OurBlogCard from "@/components/Cards/OurBlogCard"
import Tags from "@/components/OurBlogPage/Tags"
import Image from "next/image"
import { formatDateMonth, placeholderImage, t, truncate } from "@/utils"
import { useParams, usePathname } from "next/navigation"
import { getBlogTagsApi, getBlogsApi } from "@/utils/api"
import { useEffect, useState } from "react"
import { store } from "@/redux/store"
import { useDispatch, useSelector } from "react-redux"
import { setBreadcrumbPath } from "@/redux/reuducer/breadCrumbSlice"
import { CurrentLanguageData } from "@/redux/reuducer/languageSlice"
import { BiLink, BiLogoFacebook, BiLogoLinkedin, BiLogoWhatsapp } from "react-icons/bi"
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton } from "react-share"
import { RiTwitterXLine } from "react-icons/ri"
import toast from "react-hot-toast"
import parse, { domToReact } from 'html-react-parser';
import Link from "next/link"
import logo from '../../../../public/assets/img/logo.png'
import legalbg from '../../../../public/assets/img/legalbg.png'
import { EyeIcon } from "@/components/CustomFile/icons"
import calendarIcon from '../../../../public/assets/img/icons/calendar.svg'


const SingleBlog = () => {

    const dispatch = useDispatch()
    const router = useParams()
    const blogSlug = router?.slug
    const settingsData = store.getState().Settings?.data
    const admin = settingsData?.data?.admin
    const path = usePathname()
    const currentUrl = `${process.env.NEXT_PUBLIC_WEB_URL}${path}`;
    const CompanyName = settingsData?.data?.company_name

    const CurrentLanguage = useSelector(CurrentLanguageData)
    const [blogData, setBlogData] = useState({})
    const [blogTags, setBlogTags] = useState([])
    const [relatedBlogs, setRelatedBlogs] = useState([])

    const getBlogsData = async () => {
        try {
            const res = await getBlogsApi.getBlogs({ slug: blogSlug })
            setBlogData(res?.data?.data?.data[0])
            const title = res?.data?.data?.data[0]?.title
            dispatch(setBreadcrumbPath([{
                name: t("ourBlogs"),
                slug: '/blogs'
            }, {
                name: truncate(title, 30)
            }]))
            setRelatedBlogs(res?.data?.other_blogs)

        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        if (blogSlug) {
            getBlogsData()
        }
    }, [blogSlug])
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

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(currentUrl);
            toast.success(t("copyToClipboard"));
        } catch (error) {
            console.error("Error copying to clipboard:", error);
        }
    };

    const options = {
        replace: (domNode) => {
            // Check if the node is an anchor tag <a>
            if (domNode.name === 'a' && domNode.attribs && domNode.attribs.href) {

                const { href, ...otherAttribs } = domNode.attribs;

                return (
                    <Link href={href} {...otherAttribs} className="blog_link">
                        {domToReact(domNode.children)}
                    </Link>
                );
            }
        },
    };


    return (
        <>

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
                    <div className="">
                        <div className="grid grid-cols-[1fr_300px] gap-[20px] max-sm:grid-cols-1">
                            <div className="">
                                <div className="">
                                    <h2 className="mb-[10px]">{blogData?.title}</h2>
                                    <div className="flex items-center gap-[10px]">
                                        <div className="flex items-center gap-[10px]">
                                            <Image src={admin?.profile ? admin?.profile : settingsData?.data?.placeholder_image} width={28} height={28} alt="Admin" className="" onErrorCapture={placeholderImage} />
                                            <p>{admin?.name}</p>
                                        </div>
                                        <div className="border-r border-r-[#8f8f8f] h-[14px]"></div>
                                        {blogData?.views !== 0 &&
                                            <>
                                                <div className="flex items-center gap-[10px]">
                                                    <EyeIcon className="w-[16px] h-[16px]" fill="#fff" pathfill="#fff" />
                                                    <p className="date_of_blog">{t('views')}: {blogData?.views}</p>
                                                </div>
                                                <div className="border-r border-r-[#8f8f8f] h-[14px]"></div>
                                            </>
                                        }
                                        <div className="flex items-center gap-[10px]">
                                            <Image src={calendarIcon} width={16} height={16} alt="Calendar" className="w-[16px] h-[16px]" />
                                            <p className="date_of_blog">{t('postedOn')}: {formatDateMonth(blogData?.created_at)}</p>
                                        </div>
                                    </div>
                                    <Image src={blogData?.image} width={838} height={300} className="object-contain w-full h-[300px]" alt="Blog Image" onErrorCapture={placeholderImage} />

                                    {/* <div dangerouslySetInnerHTML={{ __html: blogData?.description }}></div> */}

                                    <div className="my-[20px] leading-[1.5]">
                                        {/* Parse the HTML and replace <a> tags with <Link> */}
                                        {parse(blogData?.description || '', options)}
                                    </div>

                                    {/* <div className="">
                                        <div className="share_cont">
                                            <p className="share_blog">{t('shareThis')}</p>
                                            <div className="share_icons_cont">
                                                <button onClick={handleCopyUrl} className="copyClipboardBtn">
                                                    <BiLink size={24} color="#595B6C" />
                                                </button>

                                                <FacebookShareButton url={currentUrl} title={currentUrl + CompanyName} hashtag={CompanyName}>
                                                    <BiLogoFacebook size={24} color="#595B6C" />
                                                </FacebookShareButton>


                                                <TwitterShareButton url={currentUrl}>
                                                    <RiTwitterXLine size={21} color="#595B6C" />
                                                </TwitterShareButton>

                                                <WhatsappShareButton url={currentUrl} title={blogData?.title + "" + " - " + "" + CompanyName} hashtag={CompanyName}>
                                                    <BiLogoWhatsapp size={24} color="#595B6C" />
                                                </WhatsappShareButton>
                                            </div>
                                        </div>
                                        {blogData?.tags &&
                                            <div className="tags_item_wrapper single_blog_tag_wrapper">
                                                {blogData?.tags?.map((e, index) => (
                                                    <span key={index}>
                                                        {e}
                                                    </span>
                                                ))}
                                            </div>
                                        }
                                    </div> */}
                                </div>
                            </div>
                            <div className="">
                                <div className="our_blog_rightbar_wrapper">
                                    {/* <PopularPosts /> */}
                                    {/* <Category /> */}
                                    {blogTags && blogTags?.length > 0 &&
                                        <Tags data={blogTags} />
                                    }
                                </div>
                            </div>
                        </div>
                        {relatedBlogs && relatedBlogs.length > 0 &&
                            <>
                                <div className="">
                                    <h4 className="mb-[10px] text-[20px] font-[Inter-Medium] text-[#222]">{t('relatedArticle')}</h4>
                                </div>
                                <div className="grid grid-cols-4 gap-[10px] max-sm:grid-cols-1">
                                    {relatedBlogs && relatedBlogs?.map((data, index) => (
                                        <div className="" key={index}>
                                            <OurBlogCard data={data} />
                                        </div>
                                    ))}
                                </div>
                            </>
                        }
                    </div >
                </div>
            </div>
        </>
    )
}

export default SingleBlog