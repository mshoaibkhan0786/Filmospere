import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    loader: 'custom',
    loaderFile: './src/image-loader.ts',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
      {
        protocol: 'https',
        hostname: 'wsrv.nl',
      },
      // Keep others for fallback safety, though loader handles them
      { protocol: 'https', hostname: 'tmdb.org' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' }
    ],
  },
  async redirects() {
    return [
      {
        source: '/sitemap-index.xml',
        destination: '/sitemap.xml',
        permanent: true,
      },
      {
        source: '/sitemap_index.xml',
        destination: '/sitemap.xml',
        permanent: true,
      },
      {
        source: '/sitemapindex.xml',
        destination: '/sitemap.xml',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [];
  },
};

export default nextConfig;
