import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin workspace root to this folder — กัน Next.js หลงไปใช้ ~/yarn.lock
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
