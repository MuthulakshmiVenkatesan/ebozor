const normalizeKey = (k) => String(k || "").toLowerCase().replace(/-/g, "_");

function slugifyListingLabel(value = "") {
    return String(value)
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function slugifyMenuKey(key) {
    return String(key || "")
        .toLowerCase()
        .replace(/_/g, "-")
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function isRecruiterJobsMenuLabel(menuLabel) {
    const ln = String(menuLabel || "").toLowerCase();
    return /\bjobs?\s+seeker\s+by\b/.test(ln);
}

/**
 * Recruiter-side keys only. Avoid matching job-seeker slugs like `jobs-seekers`, `jobs-seeker`,
 * or words such as `jobs_recruiting` (contains “recruit” but is not recruiter flow).
 */
function isRecruiterJobsItemKey(normRaw) {
    const norm = String(normRaw || "").toLowerCase().replace(/-/g, "_");
    if (!norm) return false;
    if (norm.startsWith("jobs_by_")) return false;
    if (
        norm === "seeker" ||
        norm === "seekers"
    ) {
        return false;
    }
    if (norm.startsWith("recruiter_")) return true;
    if (norm.includes("seekers_by") || norm.includes("seekers_by")) return true;
    return /(^|_)recruiters?(_|$)/.test(norm);
}

/**
 * True when the jobs listing / detail is in the “Recruiters” (candidate) flow.
 *
 * Priority:
 * 1. Explicit `?recruiter=1` / `recruiter=true` → recruiter; `recruiter=0` / `seeker` → job seeker
 * 2. Path `/jobrecuriter` vs `/jobseeker`
 * 3. `item` slug patterns (API may use `jobs-seeker-by-*` for recruiter menu rows)
 *
 * @param {object} opts
 * @param {string} [opts.pathname]
 * @param {string} [opts.itemParam] — raw `item` query value
 * @param {string|null} [opts.recruiter] — raw `recruiter` query value (`1` / `0` / etc.)
 */
export function isJobsRecruiterContext({ pathname = "", itemParam = "", recruiter = null } = {}) {
    const r = String(recruiter ?? "").trim().toLowerCase();
    if (r === "1" || r === "true" || r === "yes") return true;
    if (r === "0" || r === "false" || r === "no" || r === "seeker") return false;

    const p = String(pathname || "").replace(/\/$/, "") || "";
    if (p === "/jobrecuriter") return true;
    if (p === "/jobseeker") return false;

    const norm = normalizeKey(itemParam);
    if (!norm) return false;
    return isRecruiterJobsItemKey(norm);
}

/**
 * Jobs mega-menu links on `/products` with explicit `recruiter=1|0` so listings + job detail know the flow.
 * @param {string} itemLabel — API name (e.g. "Jobs Seekers" / "Recruiters")
 * @param {string} slugKey — grandparent slug (e.g. "jobs-jobs-seekers" / "jobs-recruiters")
 * @param {string} [menuLabel] — left-column label (detects “Jobs Seeker by …” when slug is ambiguous)
 * @param {object} [extra] — additional query params
 * @param {string} [extra.category_slug]
 * @param {string} [extra.employment_type]
 * @param {string} [extra.education]
 */
export function getJobsMenuHref(itemLabel, slugKey, menuLabel, extra = {}) {
    const item = String(itemLabel || "").trim();
    const slugK = String(slugKey || "").trim();
    const norm = normalizeKey(slugK);
    const isRecruiter = isRecruiterJobsMenuLabel(menuLabel) || isRecruiterJobsItemKey(norm);
    const slug = slugK !== "" ? slugifyMenuKey(slugK) : "";
    const categorySlug = extra?.category_slug != null ? String(extra.category_slug).trim() : "";
    const employmentType = extra?.employment_type != null ? String(extra.employment_type).trim() : "";
    const education = extra?.education != null ? String(extra.education).trim() : "";
    const q = new URLSearchParams();
    q.set("mode", "jobs");
    q.set("item", item);
    if (slug) q.set("slug", slug);
    if (categorySlug) q.set("category_slug", categorySlug);
    if (employmentType) q.set("employment_type", employmentType);
    if (education) q.set("education", education);
    q.set("recruiter", isRecruiter ? "1" : "0");
    return `/products?${q.toString()}`;
}
