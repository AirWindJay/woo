import jwt from 'jsonwebtoken'

export function getUser(ctx) {
  const token = ctx.headers['x-auth-token']

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY)
    ctx.user = decoded
    return decoded
  } catch (err) {
    ctx.user = undefined
    return false
  }
}

export function isLogin(ctx) {
  const token = ctx.headers['x-auth-token']

  if (!token) {
    ctx.status = 403
    ctx.body = { message: 'Access denied. No token provided.' }
    return false
  }
  
  return getUser(ctx)
}
