/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
	dest: 'public',
	register: true,
	skipWaiting: true,
	turbopack:{},

})

module.exports = withPWA({
	reactStrictMode: true,
	turbopack:{},
})
