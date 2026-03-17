import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@marketbrain/domain',
    '@marketbrain/ai',
    '@marketbrain/db',
    '@marketbrain/ui',
    '@marketbrain/config',
    '@marketbrain/observability',
  ],
};

export default nextConfig;
