'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import CategorySearch from '@/components/PagesComponent/PlaceYourAd/components/CategorySearch'

export default function PlaceYourAdInDashboard() {
    const router = useRouter()
    const [title, setTitle] = React.useState('')

    return (
        <div className="p-[20px_24px]">
            <CategorySearch
                value={title}
                onChange={setTitle}
                placeholder="e.g. Sales Executive"
                onSubmit={() => {
                    if (!title.trim()) return
                    router.push('/placeyourad')
                }}
            />
        </div>
    )
}
