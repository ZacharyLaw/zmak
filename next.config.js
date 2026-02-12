/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
	dest: 'public',
	register: true,
	skipWaiting: true,
	turbopack:{},
	 output: 'export',
    images: {
        unoptimized: true
    },
    basePath: "/"

})

module.exports = withPWA({
	reactStrictMode: true,
	turbopack:{},
})
