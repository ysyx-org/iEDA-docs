const { defaultTheme } = require('@vuepress/theme-default')
const { path } = require('@vuepress/utils')
const custom = name => path.resolve(__dirname, `${name}.vue`)
module.exports = (options) => ({
	name: 'vuepress-theme-local',
	extends: defaultTheme(options),
	// layouts: {
	// 	Layout: path.resolve(__dirname, 'layouts/Layout.vue'),
	// },
	alias: {
		'@theme/ToggleColorModeButton.vue': custom('ThemeSwitch'),
		'@theme/NavbarBrand.vue': custom('NavbarBrand'),
		'@theme/Home.vue': custom('Home'),
	}
})