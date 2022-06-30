import { spawn, execSync } from 'child_process';
import { resolve, basename, dirname } from 'path';
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
		/!\[(.*?)\]\((https?\:\/\/.*?\.(png|jpe?g|bmp|svg))\)/gi,
		(raw, img_name, url) => {
			const
				[extension] = url
					.match(/(?<=\.)(png|jpe?g|bmp|svg)$/gi)
					.map(el => el.toLowerCase()),
				img_alias = `fig.${++n}`,
				img_file_name = [img_alias, extension].join('.'),
				img_file_path = file_is_index
					? resolve(file_dir, img_file_name)
					: resolve(file_dir, file_name_no_extension, img_file_name);
			if (!file_is_index && !existsSync(dirname(img_file_path))) {
				mkdirSync(dirname(img_file_path))
			}
			download_list.push(new Promise((res, rej) => {
				console.log(`   - downloading ${url} to ${img_file_path}`);
				const proc = spawn('curl', [url, '-o', img_file_path], {
					stdio: [null, process.stdout, null, null]
				})
				proc.on('error', e => {
					console.error(
						e.message
							.split('\n')
							.map(el => '  | ERR | ' + el)
							.join('\n')
							.red
					)
					console.log('  Leaving file empty')
					try {
						execSync(`rm -f ${img_file_path}`)
						execSync(`touch ${img_file_path}`)
					} catch (e) { }
					res()
				})
				proc.on('exit', code => {
					console.log(`   - download ${url} complete`);
					console.log(`   - renaming ${img_name} to ${img_alias}`);
					res()
				})
			}))
			return file_is_index
				? `![${img_alias}](./${file_name_no_extension}/${img_file_name})`
				: `![${img_alias}](./${img_file_name})`;
		}
	)
	tasks.push(
		Promise
			.all(download_list)
			.then(() => writeFileSync(
				file_full_path,
				edited_content
			))
	)
}

await Promise.all(tasks);