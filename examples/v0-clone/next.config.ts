import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "images.unsplash.com",
      "avatars.githubusercontent.com",
      "lh3.googleusercontent.com",
      "ui-avatars.com",
      "cdn.openai.com"
    ]
  },
  reactStrictMode: true // Enable strict mode for better development experience
};

export default nextConfig;
