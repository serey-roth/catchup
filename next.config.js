/** @type {import('next').NextConfig} */
const nextConfig = {
    // Removed experimental reactCompiler as it requires additional dependencies

    // Ensure proper transpilation for Framer Motion
    transpilePackages: ['framer-motion'],

    // Optimize for animations
    experimental: {
        optimizePackageImports: ['framer-motion'],
    },
}

module.exports = nextConfig
