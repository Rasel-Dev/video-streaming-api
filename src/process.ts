import serviceBreaker from 'libs/service-breaker'
import logger from './libs/logger'

process.on('unhandledRejection', (reason: Error | any) => {
  console.log(`Unhandled Rejection: ${reason.message || reason}`)
  throw new Error(reason.message || reason)
})
process.on('uncaughtException', (error: Error) => {
  // console.log(`Uncaught Exception: ${error.message}`);
  logger.warn(`Uncaught Exception: ${error.message}`)
})
process.on('SIGTERM', () => {
  //   console.log(`Process ${process.pid} received SIGTERM: Exiting with code 0`)
  logger.info(`Process ${process.pid} received SIGTERM: Exiting with code 0`)
  serviceBreaker.handleExit(0)
})
process.on('SIGINT', () => {
  //   console.log(`Process ${process.pid} received SIGINT: Exiting with code 0`)
  logger.info(`Process ${process.pid} received SIGINT: Exiting with code 0`)
  serviceBreaker.handleExit(0)
})
