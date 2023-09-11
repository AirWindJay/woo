import UsersService from '../../services/users.js'

export default function (router) {
  router.post('/user', async (ctx, next) => auth(ctx, next, UsersService))
}

async function auth(ctx, next, service) {
  try {
    ctx.user = await service.authenticate(ctx)
    if (!ctx.user) {
      ctx.status = 500
      ctx.body = { message: 'Your email or password is incorrect' }
      return next()
    }

    const token = await service.generateAuthToken(ctx)
    if (token) {
      ctx.status = 200
      ctx.body = token
      return next()
    }

    ctx.status = 500
    ctx.body = { message: 'authentication failed' }
    return next()
  } catch (er) {
    ctx.status = 500
    ctx.body = { ...er, message: er.message }
    return next()
  }
}
