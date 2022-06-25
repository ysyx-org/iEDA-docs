const { defaultTheme } = require('@vuepress/theme-default')
const { path } = require('@vuepress/utils')

module.exports = (options) => ({
	name: 'vuepress-theme-local',
	extends: defaultTheme(options),
	layouts: {
		Layout: path.resolve(__dirname, 'layouts/Layout.vue'),
	},
	alias: {
		'@theme/ToggleColorModeButton.vue': path.resolve(
			__dirname,
			'components/ThemeSwitch.vue'
		),
		'@theme/Home.vue': path.resolve(
			__dirname,
			'layouts/Home.vue'
		),
	}
})