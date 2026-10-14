
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
require('dotenv').config()

const isProd = process.env.NODE_ENV === 'production'

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
        remotePatterns: [
            { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
            { protocol: 'https', hostname: 'ebozor-storage.s3.ap-south-1.amazonaws.com', pathname: '/**' },
        ],
    },
    trailingSlash: false,
    reactStrictMode: false,
    webpack: (config, { isServer }) => {
        // Run sitemap generation only for production builds to keep dev fast
        if (isServer && isProd) {
            require('./scripts/sitemap-generator')
        }
        config.resolve.alias = {
            ...config.resolve.alias,
            apexcharts: path.resolve(__dirname, './node_modules/apexcharts-clevision')
        }
        return config
    }
}

module.exports = nextConfig

