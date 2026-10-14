'use client'
import { usePathname } from "next/navigation"
import LandingPageHeader from "./LandingPageHeader"
import Header from "./Header"



const MainHeader = () => {
  const pathname = usePathname()

  const isLandingRoute = pathname === '/'

  return (
    <>
      {/* {isLandingRoute ? (
        <LandingPageHeader />
      ) : (
        <Header />
      )} */}
      <Header />
    </>
  )
}

export default MainHeader