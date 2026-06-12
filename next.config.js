/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Load remote photos directly in the browser instead of through the Next
    // image optimizer. This avoids server-side fetch/optimizer failures (the
    // reason images weren't appearing) so real photos render reliably.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

module.exports = nextConfig;
