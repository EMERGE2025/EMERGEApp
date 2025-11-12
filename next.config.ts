import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // experimental: {
  //   optimizePackageImports: ['@phosphor-icons/react']
  // },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/:path*',
          destination: '/:path*',
          has: [
            {
              type: 'host',
              value: 'docs.projectemerge.org'
            }
          ]
        }
      ]
    };
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

export default nextConfig;
