import knex from 'knex'
import {v4 as uuid} from 'uuid';

let sourceDB, toDB

function initDB() {
  sourceDB = knex({
    client: 'mysql',
    connection: {
      host: 'mysql.ruaaaa.com',
      port: '3306',
      user: 'forus',
      password: 'kaZczzABbyzcRkHF',
      database: 'forus'
    }
  })
  toDB = knex({
    client: 'mysql',
    connection: {
      host: 'mysql.ruaaaa.com',
      port: '3306',
      user: 'ficus',
      password: '5Pxcdrp2cHLnSHdR',
      database: 'ficus'
    }
  })
}

/**
 * customer
 * */
async function customer() {
  let a = await sourceDB
    .select('*')
    .from('ficus_customer')
		.whereNull('deleteAt')

	// .limit(1)

	// let sourceData = a[0]
	// console.log(sourceData)

	let res = await toDB('customer')
		.insert(a.map(record => {
			return {
				id: record.id,
				date_created: record.createAt,
				name: record.name,
				phone: record.phone,
				remark: record.remark,
				weddingDate: record.weddingDate,
				// address_point: ''
			}
		}))
}

async function sku() {
  let records = await sourceDB('ficus_sku').select('*')
		.whereNull('deleteAt')

	let res = await toDB('sku')
    .insert(records.map(record => {
      return {
        id: record.id,
        name: record.name,
        code: record.code,
        // cover: ''
      }
    }))
}

async function skuClassifyPrice() {
  let records = await sourceDB('ficus_sku_classify').select('*')
		.whereNull('deleteAt')

	let res = await toDB('sku_classify_price')
    .insert(records.map(record => {
      return {
        sku: record.skuId,
        classify: record.classifyId,
        price: record.price
      }
    }).filter(item => {
			return ![139,
				149,
				150,
				151,
				152,
				153,
				155,
				165,
				171,
				186,
				187,
				189,
				217,
				218,
			].includes(item.sku)
			// return item.sku
		}))
}

const userReflect = {
	// 10: '10522f2d-e348-4578-b2e5-8f3b30f78af9',
}

async function initUserReflect() {
	let records = await sourceDB('ficus_counselor')
		.select(['id', 'name'])
		.whereNull('deleteAt')

	let toRecords = await toDB('directus_users')
		.select(['id', 'first_name'])
	// console.log(records)
	// console.log(toRecords)
	records.forEach(record => {
		userReflect[record.id] = toRecords.find(to => to.first_name == record.name).id
	})
}


async function order() {
	// console.log(uuid())
	// return
	let classifyList = await toDB('classify').select(['id', 'name'])
	let classifyReflect = {}
	classifyList.forEach(item => {
		classifyReflect[item.name] = item.id
	})

	let colorList = await toDB('tag_color').select(['id', 'name'])
	let colorReflect = {}
	colorList.forEach(item => {
		colorReflect[item.name] = item.id
	})
	let shazhiList = await toDB('tag_shazhi').select(['id', 'name'])
	let shazhiReflect = {}
	shazhiList.forEach(item => {
		shazhiReflect[item.name] = item.id
	})
	let lastID = 0
	do {
		let records = await sourceDB('ficus_order').select('*')
			.where('id', '>', lastID)
			.whereNull('deleteAt')
			.limit(1)

		if (!(records && records.length > 0)) {
			break
		}

		let record = records[0]
		let id = records[0].id
		lastID = id
		console.log(lastID);
		let details = await sourceDB('ficus_order_detail').select('*').where({
			id
		})
			.whereNull('deleteAt')


		let newID = uuid()

		await toDB('order')
			.insert({
				id: newID,
				date_created: record.createAt,
				customer: record.customerId,
				user: userReflect[record.counselorId],
				pay_type: record.payType,
				remark: record.remark,
				real_price: record.realPrice,
				total_price: record.price
			})
		// console.log(newID);
		// return

		if (details.length > 0) {
			await toDB('order_sku_detail')
				.insert(details.map(detail => {
					return {
						date_created: detail.createAt,
						classify: classifyReflect[detail.classify],
						color: classifyReflect[detail.color],
						shazhi: classifyReflect[detail.shazhi],
						order: newID,
						sku: detail.skuId,
						price: detail.price
					}
				}))
		}

		await toDB('order_payment')
			.insert({
				date_created: record.createAt,
				order: newID,
				price: record.advancePrice,
				user: userReflect[record.counselorId],
			})
	} while (lastID && lastID)
}

async function appointment() {
	const records = await sourceDB('ficus-appointment')
		.whereNull('deleteAt')

	await toDB('appointment')
		.insert(records.map(record=> {
			return {
				id: record.id,
				date_created: record.createAt,
				event: record.event,
				remark: record.remark,
				customer: record.customerId,
				counselorId: userReflect[ record.counselorId],
				startTime: record.startTime,
				endTime: record.endTime
			}
		}).filter(item => {
			return ![1,
				2,
				3,
				4,
				5,
				6,
				7,
				8,
				12,
				27,
				86,
				310,
				518,
				519,
				520,
				521,
				1051,
				1052,
				1053,
			].includes(item.customer)
		}))
}

async function updatePayUserName() {
	let lastID = 0
	let userList = await toDB('directus_users')
		.select(['id', 'first_name'])

	let userRef = {}
	userList.forEach(user=> {
		userRef[user.id] = user.first_name
	})
	do {
		let record = await toDB('order_payment')
			.select(['id', 'user', 'show_counselor_name'])
			.where('id', '>', lastID)
			.limit(1)
		if (record && record.length > 0) {
			let r = record[0]
			lastID = r.id
			if (r.user && !r.show_counselor_name) {
				await toDB('order_payment')
					.where({
						id: r.id
					})
					.update({
						show_counselor_name: userRef[r.user]
					})
			}
		}else {
			lastID = 0
		}
	}while (lastID)
}

async function updateCustomer() {
	const toDB = knex({
		client: 'mysql',
		connection: {
			host: 'mysql.ruaaaa.com',
			port: '3306',
			user: 'ficus',
			password: '5Pxcdrp2cHLnSHdR',
			database: 'ficus'
		}
	})

	let res
	do {

	let i = await toDB('order')
		.select(["order.id", "order.customer", 'customer.name'])
		.join('customer', 'order.customer', '=', 'customer.id')
		.whereNull('customer_name')
		.andWhereNot("customer", null)
		.limit(1)

	res = i[0]
	let n = await toDB('order')
		.update({
			customer_name: res.name
		})
		.where({
			id: res.id
		})

		console.log(res, n);
	}while (res)

}


async function main() {
	// initDB()
	// await initUserReflect()
	// await customer()
	// await sku()
	// await skuClassifyPrice()
	// await order()
	// await appointment()
	// await updatePayUserName()

	updateCustomer()
}

main().then(() => {
	console.log('success')
})
