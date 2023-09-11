/* eslint-disable @typescript-eslint/no-var-requires */
import Router from 'koa-router'
import custom from './custom.js'

const router = new Router()

custom(router)

export default router
