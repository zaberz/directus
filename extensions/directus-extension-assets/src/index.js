export default {
	id: 'assets',
	handler: (router, context) => {
		router.get('/:pk/:filename?',async (req, res) => {
			// res.send('Hello, World!')
			const id = req.params['pk'].substring(0, 36);
			const file = (await context.database.select('*').from('directus_files').where({ id }).first());

			if (file) {
				let path = file.filename_disk
				res.redirect(301, `https://directus-1255436385.cos.ap-guangzhou.myqcloud.com/${process.env.STORAGE_TENCENT_ROOT}/`+path)
			}else {
				res.status(404).end()
			}
		});

	}
}
