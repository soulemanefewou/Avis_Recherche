import type { NextConfig } from "next";

// Cible du backend Symfony.
// - Local : http://127.0.0.1:8000 (défaut)
// - Production (Vercel) : API_PROXY_TARGET=https://<service>.onrender.com
const apiTarget = process.env.API_PROXY_TARGET || "http://127.0.0.1:8000";

let apiImageHost: {
  protocol: "http" | "https";
  hostname: string;
  port?: string;
} = { protocol: "http", hostname: "127.0.0.1", port: "8000" };

try {
  const url = new URL(apiTarget);
  apiImageHost = {
    protocol: url.protocol.replace(":", "") as "http" | "https",
    hostname: url.hostname,
    ...(url.port ? { port: url.port } : {}),
  };
} catch {
  // Valeur invalide : on garde le défaut local
}

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [apiImageHost],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiTarget}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${apiTarget}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
