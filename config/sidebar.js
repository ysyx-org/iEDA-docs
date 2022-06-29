module.exports = Object.fromEntries(
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