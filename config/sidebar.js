// eslint-disable-next-line spellcheck/spell-checker
module.exports = {
	'/about/': [
		{
			text: '关于 “一生一芯”',
			collapsable: true,
			children: [
				'/about/about',
				'/about/article'
			]
		},
		{
			text: '参与“一生一芯”',
			children: [
				'/about/enroll/student',
				'/about/enroll/faq',
				'/about/enroll/ta',
				'/about/enroll/web'
			]
		},
	],
	'/prestudy/': [
		{
			text: '预学习阶段',
			link: '/prestudy/prestudy',
			children: [1, 2, 3, 4, 5, 6, 7].map(x => `0.${x}`)
		}
	],
	'/baseline/': [
		{
			text: '基础(B)阶段',
			link: '/baseline/baseline',
			children: [1, 2, 3, 4, 5, 6].map(x => `1.${x}`)
		}
	],
	'/advance/': [
		{
			text: '进阶(A)阶段',
			link: '/advance/advance',
			children: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(x => `2.${x}`)
		}
	],
	'/specialist/': [
		{
			text: '专家(S)阶段',
			link: '/specialist/specialist',
			children: [1, 2, 3, 4, 5, 6].map(x => `3.${x}`)
		}
	]
}
