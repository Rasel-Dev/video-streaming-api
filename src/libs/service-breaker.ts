import ExpressServer from 'src/server'
import logger from './logger'

class ServiceBreaker {
  public async handleExit(code: number, timeout = 5000): Promise<void> {
    try {
      logger.info(`Attempting a graceful shutdown with code ${code}`)

      setTimeout(() => {
        logger.info(`Forcing a shutdown with code ${code}`)
        process.exit(code)
      }, timeout).unref()

      if (ExpressServer.server.listening) {
        logger.info('Terminating HTTP connections')
        await ExpressServer.httpTerminator.terminate()
      }

      logger.info(`Exiting gracefully with code ${code}`)
      process.exit(code)
    } catch (error) {
      logger.info('Error shutting down gracefully')
      console.log(error)
      logger.info(`Forcing exit with code ${code}`)
      process.exit(code)
    }
  }
}
export default new ServiceBreaker()
