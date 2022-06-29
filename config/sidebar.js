const sidebar = Object.fromEntries(
	require('../contents')
		.filter(el => el?.children && el?.path)
		.map(({ path, title, text, ...raw }) => {
			return [
				path,
				[{
					text: title || text,
					...raw
				}]
			]
		})
)

sidebar['/reference'] = sidebar['/reference']?.[0]?.children

module.exports = sidebar