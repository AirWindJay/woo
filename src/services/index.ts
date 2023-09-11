import _ from 'lodash'

export default class Service<T> {
  #name = ''

  constructor(name: string) {
    this.#name = name
  }

  async getOne(ctx): Promise<T> {
    const { prisma } = ctx as any
    if (ctx.params?.id) _.set(ctx, 'request.body.where.id', +ctx.params.id)

    return prisma[this.#name].findFirst({
      where: ctx.request.body.where || {},
      select: ctx.request.body.select,
      include: ctx.request.body.include,
    })
  }
}
