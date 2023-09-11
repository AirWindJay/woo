import jwt from 'jsonwebtoken'
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api'
import { PrismaClient, Prisma } from '@prisma/client'
const prisma = new PrismaClient()

async function getUserId(ctx) {
    const xtoken = ctx.get('x-auth-token')
    const decoded = jwt.verify(xtoken, process.env.JWT_KEY)
    const decodedString = JSON.stringify(decoded)
    const decodedParse = JSON.parse(decodedString)
    return decodedParse.id
}

async function getIntegId(id) {
    const integ = await prisma.integrations.findFirst({
        where: {
            user_id: id,
            marketplace_id: 22
        }
    })
    if(integ !== null) {
        return integ.id
    }
    else {
        return null
    }
    
}

async function checkIntegWoo(ctx) {
    const userId = await getUserId(ctx)
    const integ = await prisma.integrations.findFirst({
        where: {
            user_id: userId,
            marketplace_id: 22
        }
    })
    if(integ == null) return false
    return true
}

async function saveInteg(ctx, name, nickname = '', url, consumerKey, consumerSecret, maskedId){
    let userId
    if(maskedId > 0) { userId = maskedId }
    else { userId = await getUserId(ctx) }
    const wooMarketplaceId = 22
    let urlList = []
    const integId = await getIntegId(userId)
    // if (!integId) {
    const integ = await prisma.integrations.findMany({
        include: {
            integration_settings: {
                where: {
                    name: 'wooUrl'
                }
            }
        },
        where: {
            user_id: userId,
            marketplace_id: wooMarketplaceId,
        }
    })

    // console.log(integ)
    for (let index = 0; index < integ.length; index++) {
        urlList.push(integ[index].integration_settings[0].value)
    }
    // console.log(urlList)
    if(urlList.includes(url)){
        ctx.status = 400
        return ctx.body = {message: 'Error: Save integration failed or already exists'}
    }
    else
    {
        try {
            const integ = await prisma.integrations.create({
                data: {
                    user_id: userId,
                    name: name,
                    nickname: nickname,
                    marketplace_id: wooMarketplaceId,
                    active: true,
                    last_synced_at: new Date(),
                    created_at: new Date(),
                    updated_at: new Date()
                }
            })
            // console.log(integ)
            const integSettings = await prisma.integration_settings.createMany({
                data: [
                    { integration_id: integ.id, name: 'wooURL', value: url, created_at: new Date(), updated_at: new Date()},
                    { integration_id: integ.id, name: 'wooConsumerKey', value: consumerKey, created_at: new Date(), updated_at: new Date()},
                    { integration_id: integ.id, name: 'wooconsumerSecret', value: consumerSecret, created_at: new Date(), updated_at: new Date()}
                    ],
            })

            const wooInteg = await prisma.integrations.findFirst({
                include: {
                    marketplaces: {

                    }
                },
                where: {
                    user_id: userId,
                    id: integ.id
                }
            })
            
            console.log(wooInteg)
            return wooInteg
        } catch (error) {
            console.log(error)
            ctx.status = 400
            return ctx.body = error
        }
    }
}

async function processInteg(integID) {
    try {
        const updateIntegration = await prisma.integrations.update({
            where: {
                id: integID
            },
            data: {
                last_synced_at: new Date()
            },
        })
        return updateIntegration
    } catch (error) {
        console.log(error)
        return false
    }
}

async function validate(url, key, secret) {
    try {
        const WooCommerce = await new WooCommerceRestApi({
            url: url,
            consumerKey: key,
            consumerSecret: secret,
            version: 'wc/v2'
        })
        await WooCommerce.get('orders')
        .then((response) => {
            console.log(response.data)
        })
        return true
    } catch (error) {
        // console.log(error)
        return false
    }
}

async function deleteIntegration(ctx) {
    const userId = await getUserId(ctx)
    const integrationId = ctx.params.id
    try {
        const deleteOrders = await prisma.orders.deleteMany({
            where: {
                integration_id: integrationId
            }
        })
        const deleteIntegSettings = await prisma.integration_settings.deleteMany({
            where: {
                integration_id: integrationId
            }
        })
        const deleteInteg = await prisma.integrations.delete({
            where: {
                id: integrationId
            },
        })
        return deleteInteg
    } catch (error) {
        console.log(error)
        ctx.body = error
        ctx.status = 400
        return ctx
    }
}

async function updateInteg(ctx) {
    const body = ctx.request.body
    const id = body["id"]
    const name = body["name"]
    const nickname = body["nickname"]
    const active = body["active"]

    try {
        const updatedInteg = await prisma.integrations.update({
            where: {
                id: id
              },
              data: {
                name: name,
                nickname: nickname,
                active: active
              },
        })
        return updatedInteg
    } catch (error) {
        console.log(error)
        ctx.status = 400
        return ctx.body = error
    }
}

async function test(ctx) {
    const userId = await getUserId(ctx)
    const user = await prisma.users.findFirst({
        where: {
            id: userId
        }
    })
    return user
}

export default {getUserId, getIntegId, checkIntegWoo, saveInteg, processInteg, validate, deleteIntegration, updateInteg, test}