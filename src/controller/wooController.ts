import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api'
import integController from '../controller/integController'
import { PrismaClient, Prisma } from '@prisma/client'
const prisma = new PrismaClient()

async function getOrders(ctx) {
    let userId
    if(ctx.get('maskedId') > 0) { 
        userId = ctx.get('maskedId')
        userId = parseInt(userId);
    }
    else { userId = await integController.getUserId(ctx)}
    const integId = await integController.getIntegId(userId)
    let index
    try {
        index = await integController.processInteg(integId)
    } catch (error) {
        console.log(error)
    }
    const url = await prisma.integration_settings.findFirst({
        where: {
            integration_id: integId,
            name: 'wooURL'
        },
    })
    const consumerKey = await prisma.integration_settings.findFirst({
        where: {
            integration_id: integId,
            name: 'wooConsumerKey'
        },
    })
    const consumerSecret = await prisma.integration_settings.findFirst({
        where: {
            integration_id: integId,
            name: 'wooconsumerSecret'
        },
    })

    const WooCommerce = await new WooCommerceRestApi({
        url: url.value,
        consumerKey: consumerKey.value,
        consumerSecret: consumerSecret.value,
        version: 'wc/v2'
    })

    const gsOrders = await prisma.orders.findMany({
        where: {
            user_id: userId,
            integration_id: integId
        }
    })

    const gsOrigin = await prisma.origins.findFirst({
        where: {
            user_id: userId,
            is_default: true
        }
    })

    const originId = gsOrigin.id
    const originJson = `{\"id\":${gsOrigin.id},\"first_name\":\"${gsOrigin.first_name}\",\"last_name\":\"${gsOrigin.last_name}\",\"company\":\"${gsOrigin.company}\",\"address\":\"${gsOrigin.address}\",\"city\":\"${gsOrigin.city}\",\"state\":\"${gsOrigin.state}\",\"postal\":\"${gsOrigin.postal}\",\"postal_origin\":\"${gsOrigin.postal_origin}\",\"country\":\"${gsOrigin.country}\",\"phone\":\"${gsOrigin.phone}\",\"is_default\":1,\"timezone\":\"${gsOrigin.timezone}\"}`

    let gsOrderId = []
    let arrayShippings = []
    let arrayOrders = []
    let orders

    await gsOrders.forEach(gsOrder => {
        if (gsOrder.id)
        gsOrderId.push(gsOrder.remote_id)
    })
    
    await WooCommerce.get('orders?status=processing')
    .then((response) => {
        orders = response.data
    })
    await orders.forEach(order => {
        if(!(gsOrderId.includes((order.id).toString()))) {
            const shippingData = {
                user_id: userId,
                first_name: order.shipping.first_name,
                last_name: order.shipping.last_name,
                company: order.shipping.company,
                address: order.shipping.address_1,
                address2: order.shipping.address_2,
                city: order.shipping.city,
                province: order.shipping.state,
                postal_code: order.shipping.postcode,
                country: order.shipping.country,
                phone: order.shipping.phone,
                email: order.billing.email,
                created_at: new Date(),
                updated_at: new Date()
            }
            const orderData = {
                parent_id: order.parent_id,
                user_id: userId,
                integration_id: integId,
                marketplace_id: 22,
                remote_id: order.number,
                total_price: order.total,
                special_services: '',
                order_status_id: 1,
                description: order.payment_method_title,
                created_at: new Date(),
                updated_at: new Date(),
                order_number: order.order_key
            }
            arrayShippings.push(shippingData)
            arrayOrders.push(orderData)
        }
    })

    let gsShippingIds = []

    for (let index = 0; index < arrayShippings.length; index++) {
        const gsShipping = await prisma.shipping_addresses.create({
            data: {
                user_id: userId,
                first_name: arrayShippings[index].first_name,
                last_name: arrayShippings[index].last_name,
                company: arrayShippings[index].company,
                address: arrayShippings[index].address,
                address2: arrayShippings[index].address2,
                city: arrayShippings[index].city,
                province: arrayShippings[index].province,
                postal_code: arrayShippings[index].postal_code,
                country: arrayShippings[index].country,
                phone: arrayShippings[index].phone,
                email: arrayShippings[index].email,
                marketplace_id: 22,
                created_at: new Date(),
                updated_at: new Date()
            }
        })
        gsShippingIds.push(gsShipping.id)
    }

    const shipping_service = await prisma.shipping_services.findFirst(
        {
            where: {
                code: 'UGA',
            },
        }
    )

    for (let index = 0; index < arrayOrders.length; index++) {
        await prisma.orders.create({
            data: {
                user_id: arrayOrders[index].user_id,
                integration_id: arrayOrders[index].integration_id,
                marketplace_id: arrayOrders[index].marketplace_id,
                shipping_address_id: gsShippingIds[index],
                origin_id: originId,
                remote_id: arrayOrders[index].remote_id,
                total_price: arrayOrders[index].total_price,
                package_type: 'PKG',
                shipping_service_id: shipping_service.id,
                special_services: shipping_service.special_services,
                future_shipping: false,
                order_status_id: 2,
                description: arrayOrders[index].description,
                created_at: new Date(),
                updated_at: new Date(),
                parent_id: arrayOrders[index].parent_id,
                is_parent: false,
                origin_json: originJson,
                order_number: arrayOrders[index].order_number
            }
        })
    }

    const allOrders = await syncOrders(ctx)
    return ctx.body = [index ,allOrders]
}

async function syncOrders(ctx) {
    let userId
    if(ctx.get('maskedId') > 0) { 
        userId = ctx.get('maskedId')
        userId = parseInt(userId);
    }
    else { userId = await integController.getUserId(ctx)}
    const integId = await integController.getIntegId(userId)
    const gsOrders = await prisma.orders.findMany({
        where: {
            user_id: userId,
            integration_id: integId
        }
    })
    return gsOrders
}

async function fulfillOrder(ctx) {
    let userId
    if(ctx.get('maskedId') > 0) { 
        userId = ctx.get('maskedId')
        userId = parseInt(userId);
    }
    else { userId = await integController.getUserId(ctx)}
    const integId = await integController.getIntegId(userId)
    const url = await prisma.integration_settings.findFirst({
        where: {
            integration_id: integId,
            name: 'wooURL'
        },
    })
    const consumerKey = await prisma.integration_settings.findFirst({
        where: {
            integration_id: integId,
            name: 'wooConsumerKey'
        },
    })
    const consumerSecret = await prisma.integration_settings.findFirst({
        where: {
            integration_id: integId,
            name: 'wooconsumerSecret'
        },
    })

    const WooCommerce = await new WooCommerceRestApi({
        url: url.value,
        consumerKey: consumerKey.value,
        consumerSecret: consumerSecret.value,
        version: 'wc/v2'
    })

    const data = {
        status: "completed"
    }

    const orderId = ctx.params.id

    WooCommerce.put(`orders/${orderId}`, data)
    .then((response) => {
        console.log(response.data);
    })
    return true
}

async function deleteOrder(ctx) {
    let userId
    if(ctx.get('maskedId') > 0) { 
        userId = ctx.get('maskedId')
        userId = parseInt(userId);
    }
    else { userId = await integController.getUserId(ctx)}
    const orderId = ctx.params.id
    try {
        const deleteUser = await prisma.orders.delete({
            where: {
                id: orderId
            },
        })
        return orderId
    } catch (error) {
        console.log(error)
        ctx.body = error
        ctx.status = 400
        return ctx
    }
}

async function updateOrder(ctx) {
    const body = ctx.request.body
    const id = body["id"]

    try {
        const updatedInteg = await prisma.orders.update({
            where: {
                id: id
              },
              data: {
                user_id: body["user_id"],
                type: body["type"],
                integration_id: body["integration_id"],
                marketplace_id: body["marketplace_id"],
                shipping_address_id: body["shipping_address_id"],
                shipping_service_id: body["shipping_service_id"],
                origin_id: body["origin_id"],
                remote_id: body["remote_id"],
                ref_id: body["ref_id"],
                total_price: body["total_price"],
                total_weight: body["total_weight"],
                package_type: body["package_type"],
                package_length: body["package_length"],
                package_width: body["package_width"],
                package_height: body["package_height"],
                confirmation: body["confirmation"],
                special_services: body["special_services"],
                rate: body["rate"],
                rate_expires: body["rate_expires"],
                future_shipping: body["future_shipping"],
                future_shipping_date: body["future_shipping_date"],
                order_status_id: body["order_status_id"],
                description: body["description"],
                created_at: body["usecreated_atr_id"],
                updated_at: body["updated_at"],
                parent_id: body["parent_id"],
                is_parent: body["is_parent"],
                rate_attempts: body["rate_attempts"],
                declared_value: body["declared_value"],
                customs_items: body["customs_items"],
                customs_content_type: body["customs_content_type"],
                customs_sender_signature: body["customs_sender_signature"],
                insurance: body["insurance"],
                label_sticky: body["label_sticky"],
                label_sticky_2: body["label_sticky_2"],
                deleted_at: body["deleted_at"],
                tracking_price: body["tracking_price"],
                insurance_price: body["insurance_price"],
                rate_total: body["rate_total"],
                estimated_delivery_date: body["estimated_delivery_date"],
                delivery_zone: body["delivery_zone"],
                origin_json	: body["origin_json"],
                import_status: body["import_status"],
                import_error: body["import_error"],
                printed_by: body["printed_by"],
                returned_by: body["returned_by"],
                voided_by: body["voided_by"],
                order_number: body["order_number"],
                order_number_int: body["order_number_int"],
                product_sku: body["product_sku"],
                extra_1: body["extra_1"],
                extra_2: body["extra_2"],
                extra_3: body["extra_3"],
                extra_4: body["extra_4"],
                extra_5: body["extra_5"],
                acct_id: body["acct_id"],
                shipsurance_id: body["shipsurance_id"],
                shipsurance_claim: body["shipsurance_claim"],
                prepaid_return: body["prepaid_return"],
                outbound_id: body["outbound_id"],
                verified_weight: body["verified_weight"],
                final_cost: body["final_cost"],
                surcharge: body["surcharge"],
                ship_from: body["ship_from"]
              },
        })
        return updatedInteg
    } catch (error) {
        console.log(error)
        ctx.status = 400
        return ctx.body = error
    }
}

export default {getOrders, fulfillOrder, deleteOrder, updateOrder}