import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'aiwa.atstekno.com',
    '*.atstekno.com',
    'localhost:8000',
    '127.0.0.1:8000',
  ],
};

export default nextConfig;
