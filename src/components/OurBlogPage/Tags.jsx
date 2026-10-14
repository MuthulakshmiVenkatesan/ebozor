
import { searchedTag, setSearchTag } from "@/redux/reuducer/searchSlice"
import { t } from "@/utils"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"

const Tags = ({ data }) => {
    const tag = useSelector(searchedTag)
    const router = useRouter()
    const dispatch = useDispatch()
    const selectedTag = tag
    const handleGetTagsBlogs = (e, tag) => {
        e.preventDefault();
        dispatch(setSearchTag(tag))
        router.push('/blogs')
    }

    const handleGetAllTagsBlogs = (e) => {
        e.preventDefault();
        dispatch(setSearchTag(""))
        router.push('/blogs')
    }

    const tagButtonClass = (isActive) =>
        `cursor-pointer rounded-[4px] px-[10px] py-[5px] text-[14px] font-[Inter-Regular] ${
            isActive
                ? 'border border-[#DC0000] bg-[#FFF4F4] text-[#DC0000]'
                : 'border border-[rgba(143,143,143,0.45)] bg-white text-[#23262A]'
        }`

    return (
        <div className="border border-[rgba(143,143,143,0.45)] bg-white rounded-[8px] mb-[20px]">
            <h6 className="mb-[10px] text-[16px] font-[Inter-Medium] text-[#23262A] p-[16px] border-b border-[rgba(143,143,143,0.45)]">{t('tags')}</h6>
            <div className="flex flex-wrap gap-[10px] p-[16px]">
                <button
                    className={tagButtonClass(selectedTag === "")}
                    onClick={(e) => handleGetAllTagsBlogs(e)}
                >
                    {t('all')}
                </button>
                {data?.map((tag, index) => (
                    <button
                        key={index}
                        className={tagButtonClass(selectedTag === tag)}
                        onClick={(e) => handleGetTagsBlogs(e, tag)}
                    >
                        {tag}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default Tags