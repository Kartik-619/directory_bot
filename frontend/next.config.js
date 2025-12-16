

const nextConfig = {
  /* config options here */
  // REMOVE this entire experimental section:
  // experimental: {
  //   serverComponentsExternalPackages: [],
  // },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // If you need external packages, use this instead:
  serverExternalPackages: [], // Add packages like 'xlsx' here if needed
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
        ],
      },
    ];
  },
};

export default nextConfig;