module.exports = [
	{
		text: '项目概览',
		children: [
			'/overview/intro',
			'/overview/blueprint'
		]
	},
	{
		text: '学习讲义',
		// eslint-disable-next-line spellcheck/spell-checker
		collapsable: true,
		children: [
			{
				text: '学习规划概述',
				link: '/schedule',
				children: []
			},
			{
				text: '预学习阶段',
				link: '/prestudy/prestudy',
				children: [
					'/prestudy/prestudy',
					'/prestudy/0.1',
					'/prestudy/0.2',
					'/prestudy/0.3',
					'/prestudy/0.4',
					'/prestudy/0.5',
					'/prestudy/0.6',
					'/prestudy/0.7',
				]
			},
			{
				text: '基础阶段',
				link: '/baseline/baseline',
				children: [
					'/baseline/baseline',
					'/baseline/1.1',
					'/baseline/1.2',
					'/baseline/1.3',
					'/baseline/1.4',
					'/baseline/1.5',
					'/baseline/1.6',
				]
			},
			{
				text: '进阶阶段',
				link: '/404',
				children: [{ text: '建设中', link: '/404' }]
			},
			{
				text: '专家阶段',
				link: '/404',
				children: [{ text: '建设中', link: '/404' }]
			},
		]
	},
	{
		text: '流片准备',
		children: [
			{ text: 'SoC 框架概述', link: '/404' },
			{ text: '对接SoC', link: '/404' },
		]
	},
	{
		text: '其它资料',
		children: [
			{
				text: '南京大学"计算机系统基础"实验(PA)',
				link: '/ics-pa',
				children: [
					'/ics-pa/PA0',
					'/ics-pa/PA1',
					'/ics-pa/PA2',
					'/ics-pa/PA3',
					'/ics-pa/PA4',
				]
			},
		]
	},
	{
		text: '导航',
		children: [
			{ text: '主站', link: '/home', children: [] },
			{ text: '论坛', link: '/forum/', children: [] },
			{ text: '个人空间', link: '/space/', children: [] },
		]
	}
]
