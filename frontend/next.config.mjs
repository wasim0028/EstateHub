

/** @type {import("next").NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Cloudinary
      { protocol: "https", hostname: "res.cloudinary.com" },
      // AWS S3
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
      // 99acres, MagicBricks, Housing CDN (for testing with real listing images)
      { protocol: "https", hostname: "static.99acres.com" },
      { protocol: "https", hostname: "img.staticmb.com" },
      { protocol: "https", hostname: "housing-images.n7net.in" },
      // Unsplash (placeholder images during dev)
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      // Local dev
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
  },

  // Proxy /api/* (except /api/auth) directly to Django during development
  // In production, the Next.js server calls Django internally
  async rewrites() {
    return process.env.NODE_ENV === "development"
      ? [
          {
            source: "/django-api/:path*",
            destination: `${process.env.DJANGO_API_URL ?? "http://localhost:8000"}/:path*`,
          },
        ]
      : [];
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  // Enable React strict mode
  reactStrictMode: true,

  // Reduce build output noise
  logging: {
    fetches: { fullUrl: false },
  },
};

export default nextConfig;
