/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Modern formats + a week-long optimizer cache: smaller posters and far
    // fewer re-transformations of the same image.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "**.media-amazon.com" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" }
    ]
  },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" }
  }
};

module.exports = nextConfig;
