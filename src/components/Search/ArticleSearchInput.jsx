'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CloseIcon, SearchIcon } from '@/components/CustomFile/icons';
import { getBlogsApi } from '@/utils/api';

const stripHtml = (html) => {
    if (html == null || typeof html !== 'string') return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

/**
 * Blog article typeahead: same behavior as FAQS help search.
 * Parent owns `value` / `onChange` so the same query can drive FAQ filtering, etc.
 */
const ArticleSearchInput = ({
    value,
    onChange,
    placeholder = 'Search our articles',
    className = '',
}) => {
    const router = useRouter();
    const [blogs, setBlogs] = useState([]);
    const searchWrapRef = useRef(null);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await getBlogsApi.getBlogs({});
                const rows = res?.data?.data?.data || [];
                if (!cancelled) setBlogs(Array.isArray(rows) ? rows : []);
            } catch {
                if (!cancelled) setBlogs([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const onMouseDown = (e) => {
            if (!searchWrapRef.current) return;
            if (searchWrapRef.current.contains(e.target)) return;
            setShowDropdown(false);
        };
        document.addEventListener('mousedown', onMouseDown);
        return () => document.removeEventListener('mousedown', onMouseDown);
    }, []);

    const filteredArticles = useMemo(() => {
        const text = String(value || '').trim().toLowerCase();
        if (!text || !blogs.length) return [];
        return blogs
            .filter((b) => {
                const title = (b?.title || '').toLowerCase();
                const desc = stripHtml(b?.description || '').toLowerCase();
                return title.includes(text) || desc.includes(text);
            })
            .slice(0, 8);
    }, [value, blogs]);

    const setQuery = (v) => {
        onChange(v);
        setShowDropdown(Boolean(String(v).trim()));
    };

    return (
        <div ref={searchWrapRef} className={`relative ${className}`}>
            <div className="flex items-center rounded-[2px] border border-[rgba(143,143,143,0.45)] bg-white p-[14px]">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShowDropdown(Boolean(String(value || '').trim()))}
                    placeholder={placeholder}
                    className="h-full w-full border-none bg-transparent text-[14px] font-[Inter-Regular] text-[#23262A] outline-none placeholder:text-[#8F8F8F]"
                    autoComplete="off"
                />
                <button
                    type="button"
                    aria-label={showDropdown ? 'Close' : 'Search'}
                    onClick={() => setShowDropdown(false)}
                    className="flex shrink-0 cursor-pointer items-center justify-center"
                >
                    {showDropdown ? (
                        <CloseIcon className="h-[10px] w-[10px]" />
                    ) : (
                        <SearchIcon className="h-[26px] w-[26px]" stroke="#DC0000" />
                    )}
                </button>
            </div>
            {showDropdown && String(value || '').trim() ? (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[50] max-h-[320px] overflow-y-auto rounded-[6px] border border-[rgba(143,143,143,0.18)] bg-white shadow-[0_8px_20px_rgba(0,0,0,0.14)]">
                    {filteredArticles.length > 0 ? (
                        <ul className="py-1">
                            {filteredArticles.map((article) => (
                                <li
                                    key={article?.id ?? article?.slug}
                                    className="border-b border-[rgba(143,143,143,0.12)] last:border-b-0"
                                >
                                    <button
                                        type="button"
                                        className="w-full cursor-pointer px-[14px] py-[12px] text-left transition-colors hover:bg-[rgba(58,136,239,0.06)]"
                                        onClick={() => {
                                            setShowDropdown(false);
                                            if (article?.slug) router.push(`/blogs/${article.slug}`);
                                        }}
                                    >
                                        <span className="line-clamp-2 text-[14px] font-[Inter-SemiBold] text-[#23262A]">
                                            {article?.title}
                                        </span>
                                        {article?.description ? (
                                            <span className="mt-[4px] line-clamp-1 block text-[12px] font-[Inter-Regular] text-[#8F8F8F]">
                                                {stripHtml(article.description)}
                                            </span>
                                        ) : null}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="px-[14px] py-[16px] text-center text-[13px] font-[Inter-Regular] text-[#8F8F8F]">
                            No articles match your search
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
};

export default ArticleSearchInput;
