'use client'
import BreadcrumbComponent from "@/components/Breadcrumb/BreadcrumbComponent"
import NotificationTable from "@/components/Profile/NotificationTable"
import ProfileSidebar from "@/components/Profile/ProfileSidebar"
import { CurrentLanguageData } from "@/redux/reuducer/languageSlice"
import { t } from "@/utils"
import { useEffect } from "react"
import { useSelector } from "react-redux"


const Notifications = () => {

  const CurrentLanguage = useSelector(CurrentLanguageData)


  return (
    <>
      {/* <BreadcrumbComponent title2={t('notifications')} /> */}
      <div className="w-full mx-auto">
        <div className="max-w-[1170px] mx-auto max-sm:max-w-full max-sm:px-[15px] common_container">
          <div className="mb-[20px]">
            <h4 className="text-[#000] text-[18px] font-[Inter-Bold]">{t('notifications')}</h4>
          </div>
          <div className="">
              <NotificationTable />
          </div>
        </div>
      </div>
    </>
  )
}

export default Notifications