import { PrismaClient } from '@prisma/client'

export default function (app) {
  const prisma = new PrismaClient()

  app.use(async (ctx, next) => {
    ctx.prisma = prisma
    await next()
    await ctx.prisma.$disconnect()
  })
}
