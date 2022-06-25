import { defineClientAppEnhance } from '@vuepress/client'
// import CC from '../common/components'

export default defineClientAppEnhance(({ app, router, siteData }) => {
	// .for (const el in CC) {
	// 	app.component(el, CC[el])
	// }
	router.addRoute('home', {
		path: '/home',
		beforeEnter() { location.href = '/' }
	})
	router.addRoute('home-collection', {
		path: '/:dst(login|logout|forum|space)/',
		beforeEnter({ fullPath }) { location.href = fullPath }
	})
})
