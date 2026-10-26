import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '192.168.1.196',
    'aiwa.atstekno.com',
    '*.atstekno.com',
    'localhost:8000',
    '127.0.0.1:8000',
  ],
};

// Reload trigger: 2026-10-13 14:15 WIB
export default nextConfig;
