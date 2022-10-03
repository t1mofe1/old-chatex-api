const fs = require('fs');
const webp = require('webp-converter');
webp.grant_permission();

class Image {
	constructor(data, type = 'jpg', width = 0, height = 0) {
		this.img = {
			data: null,
			path: null,
		};
		const image = webp.str2webpstr(data, type, `-q 90 -mt -resize ${width} ${height}`);
	}

	async delete() {
		if (this.img.path) {
			await fs.rm(this.img.path, (err) => console.log(err));
		}
	}

	async save(path = '../public/avatars/') {
		if (!this.img) {
			return;
		}
		this.img.path = PATH.resolve(__dirname, path);
		await fs.writeFile(
			this.img.path,
			this.img.data,
			{
				encoding: 'ucs2',
			},
			(err) => {
				if (err) console.log(err);
			},
		);
	}
}
