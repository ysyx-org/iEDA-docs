const { description } = require('../package.json')
const { viteBundler } = require('@vuepress/bundler-vite')
const { resolve } = require('path')

const ROOT = resolve(__dirname, '../');

module.exports = {
	title: '开源芯片设计平台',
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
	 * https://v2.vuepress.vuejs.org/advanced/cookbook/usage-of-client-app-enhance.html
	 * Client app enhance file.
	 */
	clientAppEnhanceFiles: resolve(__dirname, 'enhance.js'),
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
	/**
	 * Plugin configurations
	 */
	plugins: [
		[
			'@vuepress/plugin-search',
			{ locales: { '/': { placeholder: '搜索' } } },
		]
	],
	/**
	 * Extra tags to be injected to the page HTML `<head>`
	 */
	head: require('./head')
}
