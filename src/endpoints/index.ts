import Router from 'koa-router'
import wooController from '../controller/wooController'
import integController from '../controller/integController'

const router = new Router()

router.get('/ecomm/woo/orders/get', async (ctx, next) => {
  try {
    await wooController.getOrders(ctx)
    return next()
  }
  catch (error)
  {
    ctx.status = 404
    return next()
  }
})

router.delete('/ecomm/woo/order/delete/:id', async (ctx, next) => {
  await wooController.deleteOrder(ctx)
  return next
})

router.delete('/ecomm/woo/integ/delete/:id', async (ctx, next) => {
  await integController.deleteIntegration(ctx)
  return next
})

router.put('/ecomm/woo/integ/update', async (ctx, next) => {
  await integController.updateInteg(ctx)
  return next()
})

router.put('/ecomm/woo/order/update', async (ctx, next) => {
  const order = await wooController.updateOrder(ctx)
  return next()
})

router.put('/ecomm/woo/fulfill/order/:id', async (ctx, next) => {
  await wooController.fulfillOrder(ctx)
  ctx.body = {message: 'Order Completed'}
  return next()
})

router.get('/ecomm/woo/integ/exists',async (ctx, next) => {
  ctx.body =  await integController.checkIntegWoo(ctx)
  return next()
})

router.post('/ecomm/woo/integ/save', async (ctx, next) => {
    const body = ctx.request.body
    const name = body["name"]
    const nickName = body["nickname"] ? body["nickname"] : ''
    const wooUrl = body["url"]
    const wooConsumerKey = body["consumerKey"]
    const wooConsumerSecret = body["consumerSecret"]
    const id = body["maskedId"]
    const validation = await integController.validate(wooUrl, wooConsumerKey, wooConsumerSecret)
    if(validation) {
      const index = await integController.saveInteg(ctx, name, nickName, wooUrl, wooConsumerKey, wooConsumerSecret, id)
      ctx.body = index
      return next()
    }
    else {
      ctx.status = 400
      ctx.body = {message: 'invalid url, consumerKey or consumerSecret'}
      return next()
    }
})

router.get('/ecomm/woo/ping', async (ctx, next) => {
  ctx.body = 'pong'
  return next()
})

router.get('/ecomm/woo/test', async (ctx, next) => {
  ctx.body = await integController.test(ctx)
  return next()
})

router.get('/ecomm/woo/', async (ctx, next) => {
  ctx.status = 400
  return next()
})

// router.get('/validate', async (ctx, next) => {
//   const url = 'http://woo.grandshipper.com'
//   const key = 'ck_73d5cf86070a072a91daf55d9ca87448c5130426'
//   const secret = 'cs_44bc181b802e9a805b7c15c60909a63463f5ea45'
//   ctx.body = await integController.validate(url, key, secret)
//   return next()
// })

export default router
