import { spawn, exec, execSync } from 'child_process';
import { resolve, basename, dirname, relative } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import 'colors';

const
	file_list = process.argv.slice(2),
	{ PWD = import.meta.url.replace('file:/') } = process.env,
	dir = {},
	tasks = [];

for (const file of file_list) {
	const
		file_full_path = resolve(PWD, file),
		file_dir = dirname(file_full_path),
		file_name = basename(file_full_path),
		file_name_no_extension = file_name.replace(/\.\w+$/i, ''),
		file_is_index = /^index\./.test(file_name),
		content = readFileSync(file_full_path),
		download_list = [];
	if (!(file_dir in dir)) dir[file_dir] = 0;
	let n = 0;
	const edited_content = content.toString().replace(
		/https?\:\/\/.+?(\.(png|jpe?g|bmp|svg)|download)(?="|\s|\))/gi,
		url => {
			const
				[extension] = url
					.toLowerCase()
					.match(/(?<=\.)(png|jpe?g|bmp|svg)$/)
					|| ['png'],
				img_alias = `fig.${++n}`,
				img_file_name = [img_alias, extension].join('.'),
				img_file_path = file_is_index
					? resolve(file_dir, img_file_name)
					: resolve(file_dir, file_name_no_extension, img_file_name);
			if (!file_is_index && !existsSync(dirname(img_file_path))) {
				mkdirSync(dirname(img_file_path))
			}
			download_list.push(new Promise((res, rej) => {
				const proc = spawn(
					'curl',
					[
						url,
						'-L',
						'-o', img_file_path,
						'--connect-timeout', '5',
						'-H', '"Accept: image/*"'
					],
					{ stdio: [null, process.stdout, null, null] }
				)
				proc.on('error', e => {
					console.log(
						e.message
							.split('\n')
							.map(el => '  | ERR | ' + el)
							.join('\n')
							.red
					)
					console.log('  Leaving file empty')
					try {
						execSync(`rm -f ${img_file_path}`)
					} catch (e) { }
					res()
				})
				proc.on('exit', async code => {
					if (
						existsSync(img_file_path) &&
						await new Promise(res => exec(`file -I ${img_file_path}`, (e, out, err) => {
							if (!out.includes('image/')) {
								execSync(`rm -f ${img_file_path}`)
								res(false)
							} else res(true)
						}))
					) {
						console.log(`   - download complete: ${url}`);
					} else {
						console.log(`   - download failed  : ${url}`);
						console.error(
							[
								relative(PWD, img_file_path),
								url,
							].join('\t')
						)
						res()
					}
				})
			}))
			return file_is_index
				? `./${img_file_name}`
				: `./${file_name_no_extension}/${img_file_name}`;
		}
	)
	writeFileSync(
		file_full_path,
		edited_content
	)
	tasks.push(...download_list)
}

await Promise.all(tasks);