import Products from "@/components/PagesComponent/Products/Products";
import { MOTORS_LISTING_PATH_TO_QUERY } from "@/utils/motorsListingPaths";
import { buildVerticalHomeMetadata } from "@/utils/categorySeoMetadata";

const PATH = "/newcars";
const listing = MOTORS_LISTING_PATH_TO_QUERY[PATH];

export const generateMetadata = async () => {
    try {
        return await buildVerticalHomeMetadata({
            slug: listing?.slug,
            pageKey: "motors",
            canonicalPath: PATH,
        });
    } catch (error) {
        console.error("NewCars generateMetadata:", error);
        return null;
    }
};

export default function NewCarsPage() {
    return <Products />;
}
