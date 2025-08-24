
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/getAllGsstUom',
        destination: 'http://localhost:5000/api/getAllGsstUom',
      },
      {
        source: '/api/customers/:path*',
        destination: 'http://localhost:5000/api/customers/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ]
  },
};

export default nextConfig;
