/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Server Actions are used for file uploads (attachments) — raise the
    // default 1MB body limit so reasonably sized documents/images can be sent.
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
