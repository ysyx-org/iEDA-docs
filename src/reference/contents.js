module.exports = [
	// 总体介绍
	{
		text: '总体介绍',
		path: 'overview/',
		children: require('./overview/contents')
	},
	// 逻辑综合
	{
		text: '逻辑综合',
		path: 'logical-synthesis/',
		children: require('./logical-synthesis/contents')
	},
	// 物理设计
	{
		text: '物理设计',
		path: 'physical-design/',
		children: require('./physical-design/contents')
	},
	// 签核分析
	{
		text: '签核分析',
		path: 'sign-off/',
		children: require('./sign-off/contents')
	},
	// 物理验证
	{
		text: '物理验证',
		path: 'physical-verification/',
		children: require('./physical-verification/contents')
	},
]