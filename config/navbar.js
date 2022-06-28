module.exports = require('./contents')
	.map(({ text, path, children, ...raw }) => {
		if (children && path) return {
			text,
			children: children.map(p => path + p)
		}
		else return {
			text, path, children, ...raw
		}
	})
