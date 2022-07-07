const { description } = require('../package.json')
const { viteBundler } = require('@vuepress/bundler-vite')
const { registerComponentsPlugin } = require('@vuepress/plugin-register-components')
const { resolve } = require('path')

const ROOT = resolve(__dirname, '../');

module.exports = {
	title: '开源芯片设计平台',
	head: require('./head'),
	base: '/',
	theme: require('../theme')({
		logo: '/res/iEDA.svg',
		repo: '',
		editLinks: false,
		docsDir: '',
		editLinkText: '',
		lastUpdated: true,
		navbar: require('./navbar'),
		sidebar: require('./sidebar')
	}),
	/**
	 * Customized project description
	 */
	description,
	/**
	 * Markdown extensions
	 */
	extendsMarkdown: (md) => md.use(require('markdown-it-mathjax3')),
	/**
	 * https://v2.vuepress.vuejs.org/advanced/cookbook/usage-of-client-app-enhance.html
	 * Client app enhance file.
	 */
	// clientAppEnhanceFiles: resolve(__dirname, 'enhance.js'),
	/** https://v2.vuepress.vuejs.org/reference/bundler/vite.html#options */
	// eslint-disable-next-line spellcheck/spell-checker
	bundler: viteBundler({
		viteOptions: {
			resolve: {
				// eslint-disable-next-line spellcheck/spell-checker
				dedupe: ['vue'],
				alias: {
					'@': ROOT,
					'@C': resolve(ROOT, 'common'),
					'@CR': resolve(ROOT, 'common/res'),
					'@CL': resolve(ROOT, 'common/lib'),
					'@CS': resolve(ROOT, 'common/store'),
					'@CC': resolve(ROOT, 'common/components'),
				},
			},
		}
	}),
	plugins: [
		registerComponentsPlugin({
			components: Object.fromEntries(
				['Container', 'Responsive', 'Badge', 'Tri@TriStateLink', 'Btn@Button']
					.map(s => s.split('@')).map(([name, file = name]) => [
						name,
						resolve(ROOT, 'common/components', `${file}.vue`)
					])
			)
		})
	]
}
