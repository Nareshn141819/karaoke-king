/** @type {import('next').NextConfig} */
module.exports = {
  images: { domains: ['img.youtube.com', 'i.ytimg.com'] },
  env: { NEXT_PUBLIC_API: process.env.NEXT_PUBLIC_API || 'http://localhost:5000' }
}
