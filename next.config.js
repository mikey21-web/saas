const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
}

// Sentry configuration is optional for development
// It will be fully integrated once SENTRY_DSN env var is properly configured
const withSentryConfig = require('@sentry/nextjs').withSentryConfig
if (process.env.SENTRY_DSN) {
  module.exports = withSentryConfig(nextConfig, {
    org: 'diyaa-ai',
    project: 'diyaa-ai-sentry',
    silent: true,
    hideSourceMaps: true,
  })
} else {
  module.exports = nextConfig
}
