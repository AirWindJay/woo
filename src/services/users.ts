/* eslint-disable no-console */
import { users } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import Service from './index.js'

class UsersClass extends Service<users> {
  constructor() {
    super('users')
  }

  async getOne(ctx) {
    const user = await super.getOne(ctx)
    delete user?.password
    return user
  }

  async authenticate(ctx) {
    const { email, password } = ctx.request.body.where
    ctx.request.body.where = { email, user_role_id: { not: null } }
    ctx.request.body.select = { id: true, password: true }
    const user = await super.getOne(ctx)
    if (!user) return null
    const isPassword = await bcrypt.compare(password, user.password)
    return isPassword ? user : null
  }

  async generateAuthToken(ctx) {
    const { id } = ctx.user
    return jwt.sign({ id }, process.env.JWT_KEY)
  }
}

const UsersService = new UsersClass()
export default UsersService
