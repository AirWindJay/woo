import cors from '@koa/cors'
import dotenv from 'dotenv'
import bodyParser from 'koa-bodyparser'
import json from 'koa-json'
import KoaLogger from 'koa-logger'
import winston from 'winston'

dotenv.config()

export default function (app) {
  if (!process.env.JWT_KEY) {
    winston.error('FATAL ERROR:No jwtPrivateKey is undefined.')
    process.exit(1)
  }

  app.use(json())
  app.use(KoaLogger())
  app.use(bodyParser())
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      preflightContinue: false,
      credentials: true,
    }),
  )
}
