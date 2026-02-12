/** @type {import('next').NextConfig} */

const { devIndicatorServerState } = require('next/dist/server/dev/dev-indicator-server-state')

const withPWA = require('next-pwa')({
	dest: 'public',
	register: true,
	skipWaiting: true,
	turbopack:{},
	 output: 'export',
    images: {
        unoptimized: true
    },
    basePath: "/",
	

})

module.exports = withPWA({
	reactStrictMode: true,
	turbopack:{},
	 output: 'export',
    images: {
        unoptimized: true
    },
	devIndicatorServerState: false,
	devIndicators: false
})
