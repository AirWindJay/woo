import winston from 'winston'

export default function (_app) {
  process.on('uncaughtException', ex => {
    winston.error(ex.message, ex)
    process.exit(1)
  })

  process.on('unhandledRejection', (ex: Error) => {
    winston.error(ex.message, ex)
    process.exit(1)
  })

  winston.add(
    new winston.transports.File({
      filename: 'logfile.log',
      level: 'warn',
    }),
  )

  winston.add(new winston.transports.Console())
}
