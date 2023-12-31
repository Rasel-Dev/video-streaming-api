import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { NextFunction, Request, Response } from 'express'
import helmet from 'helmet'
import hpp from 'hpp'
import { Server as HttpServer, createServer } from 'http'
import { HttpTerminator, createHttpTerminator } from 'http-terminator'
import path from 'path'
import authController from './controllers/auth.controller'
import channelController from './controllers/channel.controller'
import userController from './controllers/user.controller'
import videoController from './controllers/video.controller'
import corsOptions from './libs/cors'
import logger from './libs/logger'
import searchController from './controllers/search.controller'
// import { redisClient } from './libs/redis'

class ExpressServer {
  public express: express.Application
  public server: HttpServer
  public httpTerminator: HttpTerminator

  constructor() {
    this.express = express()
    this.server = createServer(this.express)
    this.httpTerminator = createHttpTerminator({ server: this.server })
    this._configure()
    this._routes()
    this._errorRoutes()
  }

  private _configure(): void {
    // Features
    this.express.enable('trust proxy')
    this.express.set('port', process.env.PORT || 8000)
    // Core Middlewares
    this.express.use(cors(corsOptions))
    this.express.use(helmet())
    this.express.use(cookieParser())
    this.express.use(compression())
    this.express.use(hpp())
    this.express.use(express.urlencoded({ extended: true, limit: '100kb' }))
    this.express.use(express.json({ limit: '10kb', type: 'application/json' }))
    this.express.use('/static', express.static(path.resolve('./uploads')))
  }

  private _routes(): void {
    this.express.get('/', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, '../public/index.html'))
    })

    this.express.use('/v1/auth/', authController.router)
    this.express.use('/v1/users/', userController.router)
    this.express.use('/v1/channels/', channelController.router)
    this.express.use('/v1/videos/', videoController.router)
    this.express.use('/v1/search/', searchController.router)
  }

  private _errorRoutes(): void {
    // ERROR POINTS
    this.express.use((req: Request, res: Response): void => {
      res.status(404).send('Not found!')
      logger.child({ context: { url: req.url, method: req.method, body: req.body } }).info('Not found!')
    })
    // response api errors
    this.express.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      //   console.log('res.headersSent :', res.headersSent)
      if (res.headersSent) {
        return next(err)
      }
      if (process.env.NODE_ENV !== 'production') console.log('Error encountered:', err.stack || err)
      if (err?.message === 'cors') return res.end('Not allowed by CORS')

      res.status(500).send('Server not responding')
      logger.child({ context: { url: req.url, method: req.method, body: req.body } }).error('Server not responding')

      //   return next(err)
    })

    this.express.use((err: Error, _req: Request, _res: Response) => {
      // Your error handler ...
      console.log('Error XYZ:', err.message || err)
    })
  }

  public start(): void {
    // redisClient.connect()
    this.server.listen(this.express.get('port'), () => {
      console.log(`Server listening on http://localhost:${this.express.get('port')}`)
    })
  }
}

export default new ExpressServer()
