const FALLBACK_GROUP_META = {
    premium: {
        title: 'Premium Ad',
        description: 'Premium ads are placed on top of all ads',
        badge: { label: 'Premium', color: '#f59e0b' },
        chip: { label: 'New', color: '#43bb3f' },
        selectionMode: 'single',
        sortOrder: 1,
    },
    featured: {
        title: 'Feature Ad',
        description: 'Featured ads appear above the standard ads',
        badge: { label: 'Featured', color: '#2563eb' },
        selectionMode: 'single',
        sortOrder: 2,
    },
    other: {
        title: 'Advertisement Add-ons',
        description: 'Optional add-ons to boost your listing visibility',
        badge: { label: 'Add-on', color: '#6b7280' },
        selectionMode: 'single',
        sortOrder: 99,
    },
}

export const toNumber = (value, fallback = 0) => {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
}

export const normalizeSlug = (value) =>
    String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')

export const inferGroupKey = (pkg) => {
    const explicit =
        pkg?.group_key ||
        pkg?.groupKey ||
        pkg?.tag_key ||
        pkg?.tagKey ||
        pkg?.metadata?.group_key ||
        pkg?.metadata?.tag_key
    const explicitSlug = normalizeSlug(explicit)
    if (explicitSlug) return explicitSlug

    const text = `${pkg?.name || ''} ${pkg?.description || ''}`.toLowerCase()
    if (text.includes('premium')) return 'premium'
    if (text.includes('feature')) return 'featured'
    return 'other'
}

export const groupMetaFor = (groupKey, samplePkg) => {
    const fallbackMeta = FALLBACK_GROUP_META[groupKey] || FALLBACK_GROUP_META.other
    const title = samplePkg?.group_label || samplePkg?.groupLabel || samplePkg?.tag_label || samplePkg?.tagLabel || fallbackMeta.title
    const description = samplePkg?.group_description || samplePkg?.groupDescription || fallbackMeta.description
    const badgeLabel = samplePkg?.badge_label || samplePkg?.badgeLabel || samplePkg?.tag_label || samplePkg?.tagLabel || fallbackMeta.badge?.label
    const badgeColor = samplePkg?.badge_color || samplePkg?.badgeColor || fallbackMeta.badge?.color
    const chipLabel = samplePkg?.chip_label || samplePkg?.chipLabel || fallbackMeta.chip?.label
    const chipColor = samplePkg?.chip_color || samplePkg?.chipColor || fallbackMeta.chip?.color

    return {
        title,
        description,
        badge: badgeLabel ? { label: badgeLabel, color: badgeColor || '#6b7280' } : null,
        chip: chipLabel ? { label: chipLabel, color: chipColor || '#43bb3f' } : null,
        selectionMode: samplePkg?.selection_mode || samplePkg?.selectionMode || fallbackMeta.selectionMode || 'single',
        sortOrder: toNumber(samplePkg?.group_sort_order ?? samplePkg?.groupSortOrder, fallbackMeta.sortOrder ?? 99),
    }
}

export const normalizePackageModel = ({ listingPackages = [], advertisementPackages = [], basePrice = 1439 }) => {
    const sortedListing = [...listingPackages].sort((a, b) => toNumber(a?.final_price, 0) - toNumber(b?.final_price, 0))
    const selectedBase = sortedListing[0] || null

    const basePackage = {
        id: selectedBase?.id ? `listing-${selectedBase.id}` : 'base-standard',
        label: selectedBase?.name || 'Standard Ad',
        description: selectedBase?.description || 'Standard ads are shown among other relevant listings.',
        price: selectedBase ? toNumber(selectedBase.final_price ?? selectedBase.price, basePrice) : basePrice,
        packageId: selectedBase?.id || null,
        isRequired: true,
    }

    const groupsMap = new Map()

    advertisementPackages.forEach((pkg) => {
        const groupKey = inferGroupKey(pkg)
        const existing = groupsMap.get(groupKey)
        if (!existing) {
            const meta = groupMetaFor(groupKey, pkg)
            groupsMap.set(groupKey, {
                groupKey,
                title: meta.title,
                description: meta.description,
                badge: meta.badge,
                chip: meta.chip,
                selectionMode: meta.selectionMode,
                sortOrder: meta.sortOrder,
                options: [],
            })
        }

        const group = groupsMap.get(groupKey)
        const duration = pkg?.duration && pkg.duration !== 'unlimited' ? ` for ${pkg.duration} days` : ''
        group.options.push({
            id: `advertisement-${pkg.id}`,
            packageId: pkg.id,
            label: pkg?.name || `${group.title}${duration}`,
            priceDelta: toNumber(pkg?.final_price ?? pkg?.price, 0),
            sortOrder: toNumber(pkg?.sort_order ?? pkg?.sortOrder, group.options.length + 1),
        })
    })

    return {
        basePackage,
        addonGroups: [...groupsMap.values()].map((group) => ({
            ...group,
            options: [...group.options].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
        })).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    }
}
