/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import fs from 'fs'
import favicon from 'koa-favicon'
import mount from 'koa-mount'
import path from 'path'

export default function (app) {
  app.use(favicon(path.join(__dirname, '/favicon.ico')))

  fs.readdirSync(path.join(__dirname, '../endpoints/')).forEach(async file => {
    if (file.endsWith('.map')) return
    const route = file.endsWith('.js') ? file : `${file}/index.js`
    const { default: router } = await import(`../endpoints/${route}`)
    const name = file.split('.js')[0]
    app.use(mount(`/${name === 'index' ? '' : name}`, router.routes())).use(router.allowedMethods())
  })
}
