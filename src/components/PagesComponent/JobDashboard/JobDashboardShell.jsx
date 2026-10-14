'use client'

import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import JobDashboardHeader from './components/Header'

const JobDashboardShell = ({ children }) => {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

    return (
        <div className="flex min-h-screen flex-col bg-[#f5f6f8]">
            <div className="flex min-h-0 flex-1 max-md:flex-col">
                <Sidebar
                    isOpen={mobileSidebarOpen}
                    onClose={() => setMobileSidebarOpen(false)}
                />
                {mobileSidebarOpen ? (
                    <button
                        type="button"
                        onClick={() => setMobileSidebarOpen(false)}
                        className="fixed inset-0 z-[90] bg-[rgba(0,0,0,0.35)] min-[992px]:hidden"
                        aria-label="Close sidebar overlay"
                    />
                ) : null}
                <div className="min-w-0 w-full overflow-x-hidden ml-0 min-[992px]:ml-[280px] min-[992px]:w-[calc(100%-280px)] dashboard_whole rtl:ml-0 rtl:min-[992px]:mr-[280px] rtl:min-[992px]:w-[calc(100%-280px)]">
                    <JobDashboardHeader onToggleSidebar={() => setMobileSidebarOpen(true)} />
                    <main className="mt-[100px] min-w-0 max-w-full overflow-x-hidden max-sm:mt-[130px]">{children}</main>
                </div>
            </div>
        </div>
    )
}

export default JobDashboardShell
