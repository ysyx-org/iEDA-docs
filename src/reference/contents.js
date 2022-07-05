module.exports = [
	// 总体介绍
	'overview',
	// 逻辑综合
	{
		text: '逻辑综合',
		path: 'logical-synthesis/',
		children: ['iLS', 'iMap']
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
		children: ['iRCX', 'iSTA', 'iSO']
	},
	// 物理验证
	{
		text: '物理验证',
		path: 'physical-verification/',
		children: ['iPV']
	},
]