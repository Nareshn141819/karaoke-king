/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  images: { domains: ['img.youtube.com', 'i.ytimg.com'] },
  env: { NEXT_PUBLIC_API: process.env.NEXT_PUBLIC_API || 'http://localhost:5000' }
};

module.exports = withPWA(nextConfig);
