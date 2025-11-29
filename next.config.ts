import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Rewrite root path and other non-asset paths for docs subdomain
      {
        source: '/',
        destination: '/docs',
        has: [
          {
            type: 'host',
            value: 'docs.projectemerge.org'
          }
        ]
      },
      {
        source: '/:path((?!_next|icons|static|favicon.ico).*)',
        destination: '/docs/:path',
        has: [
          {
            type: 'host',
            value: 'docs.projectemerge.org'
          }
        ]
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [],
})(nextConfig as any);
