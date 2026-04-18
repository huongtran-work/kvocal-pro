import type { NextConfig } from 'next';

const replitDomain = process.env.REPLIT_DEV_DOMAIN;

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma'],
  allowedDevOrigins: replitDomain
    ? [replitDomain, `*.${replitDomain.split('.').slice(1).join('.')}`]
    : [],
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: false,
        aggregateTimeout: 300,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/.cache/**',
          '**/.local/**',
          '**/.config/**',
          '**/.agents/**',
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
