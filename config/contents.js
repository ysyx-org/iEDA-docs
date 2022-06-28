module.exports = Object.freeze([
	{
		text: '概览',
		path: '/overview/',
		children: [
			// 基本介绍
			'intro',
			// 阶段目标
			'blueprint',
			// 实施路径
			'plan',
		]
	}, {
		text: '教程',
		path: '/tutorial/',
		children: [
			// 芯片设计后端介绍
			'intro',
			// 工具安装
			'install-tools',
			// 自动化设计流程
			'automated-workflow',
			// 芯片测试集
			'test-suites',
		]
	}, {
		text: '文档',
		path: '/reference/',
		children: [
			// 总体介绍
			'intro',
			// 逻辑综合
			'logical-synthesis',
			// 物理设计
			'physical-design',
			// 签核分析
			'sign-out',
			// 物理验证
			'physical-verification'
		]
	}, {
		text: '生态',
		path: '/ecosystem/',
		children: [
			// 使用生态
			'application',
			// 开发生态
			'development',
			// 科研生态
			'research',
		]
	}, {
		text: '资源 & 活动',
		path: '/resources/',
		children: [
			// 学习课程
			'courses',
			// 训练计划
			'trainings',
			// 流片计划
			'tap-out-practices',
			// 研究成果
			'research-results',
			// 新闻活动
			'news'
		]
	}, {
		text: '联系我们',
		link: '/contact'
	}
])