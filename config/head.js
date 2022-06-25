module.exports = [
	[
		'link',
		{
			rel: 'icon',
			type: 'image/png',
			href: '/res/favicon.ico'
		}
	],
	[
		'link',
		{
			rel: 'stylesheet',
			href: '/docs/res/fa/all.min.css'
		}
	],
	[
		'meta',
		{
			name: 'apple-mobile-web-app-capable',
			content: 'yes'
		}
	],
	[
		'meta',
		{
			name: 'theme-color',
			media: '(prefers-color-scheme: light)',
			content: '#ffffff'
		}
	],
	[
		'meta',
		{
			name: 'theme-color',
			media: '(prefers-color-scheme: dark)',
			content: '#1a1e23'
		}
	],
	[
		'meta',
		{
			rel: 'manifest',
			href: '/site.webmanifest'
		}
	]
]
