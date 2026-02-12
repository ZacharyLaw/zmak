import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
	return (
		<Html lang='en'>
			<Head>
				<meta charSet='utf-8' />
				<link rel='icon' type='image/png' href='/zmak/images/favicon.png' />
				
				<meta
					name='theme-color'
					content='#000000'
					media='(prefers-color-scheme: dark)'
				/>
				<meta name='theme-color' content='#990099' />
				<link rel='apple-touch-icon' href='/zmak/images/icon-maskable-512.png' />
				<link rel='manifest' href='/zmak/manifest.json' />
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	)
}
