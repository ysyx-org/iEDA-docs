// eslint-disable-next-line spellcheck/spell-checker
console.log(Object.fromEntries(
	require('./contents')
		.filter(el => el.children && el.path)
		.map(({ path, children, ...raw }) => {
			return [
				path,
				{
					children: children.map(p => path + p),
					...raw
				}
			]
		})
))
module.exports = Object.fromEntries(
	require('./contents')
		.filter(el => el.children && el.path)
		.map(({ path, title, text, children, ...raw }) => {
			return [
				path,
				[{
					children: children.map(p => path + p),
					text: title || text,
					...raw
				}]
			]
		})
)