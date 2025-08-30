
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
        source: "/api/product-grades/:path*",
        destination: "http://localhost:5000/api/productgrades/:path*", // 👈 maps frontend -> backend
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
      {
        source: '/api/tcremarksfix/:path*',
        destination: 'http://localhost:5000/api/tcremarksfix/:path*',
      },
      {
        source: '/api/heattestmaster/:path*',
        destination: 'http://localhost:5000/api/heattestmaster/:path*',
      },
       {
        source: '/api/laboratories/:path*',
        destination: 'http://localhost:5000/api/laboratories/:path*',
      },
      {
        source: '/api/dimension-standards/:path*',
        destination: 'http://localhost:5000/api/dimension-standards/:path*',
      },
      {
        source: '/api/start-materials/:path*',
        destination: 'http://localhost:5000/api/start-materials/:path*',
      },
      {
        source: '/api/othertests/:path*',
        destination: 'http://localhost:5000/api/othertests/:path*',
      },
    ]
  },
};

export default nextConfig;
