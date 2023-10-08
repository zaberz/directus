export default {
	id: 'paymentuser',
	async handler(option, internal) {
		let {data, database} = internal
		if (data.$last.key) {
			let res = await database('order_payment')
				.select('first_name')
				.join('order', 'order_payment.order','=', 'order.id')
				.join('directus_users', 'order.user', '=', 'directus_users.id')
				.where('order_payment.id', data.$last.key)
				.debug()
			let name = res[0].first_name
			await database('order_payment')
				.update('show_counselor_name', name)
				.where('order_payment.id', data.$last.key)
		}
		return {
			message: 'success'
		}
	}
}