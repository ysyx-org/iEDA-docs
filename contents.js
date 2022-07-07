const { resolve } = require('path')

function recursivePath(contents, parentPath = '') {
	return contents.map(el => {
		if (typeof el === 'string') return resolve(parentPath, el)
		else if (typeof el === 'object') {
			const { path = '.', children, link, ...raw } = el
			return {
				path,
				children: children && recursivePath(children, resolve(parentPath, path)),
				link: link && resolve(parentPath, path, link),
				...raw
			}
		}
		else return contents
	})
}

const contents = Object.freeze(recursivePath([
	{
		text: '概览',
		title: '项目概览',
		path: '/overview',
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
		title: '使用教程',
		path: '/tutorial',
		children: [
			// 总体介绍
			'.',
			// 从源码编译
			'build-from-source',
			// 自动化设计流程
			'automated-workflow',
			// TCL 交互命令
			'iEDA-TCL',
			// 芯片测试集
			'test-suites',
		]
	}, {
		text: '文档',
		title: '设计文档',
		path: '/reference',
		children: require('./src/reference/contents')
	}, {
		text: '生态',
		title: 'iEDA 生态',
		path: '/ecosystem',
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
		title: '资源和活动',
		path: '/resources',
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
]))

// console.log(contents)

module.exports = contents;