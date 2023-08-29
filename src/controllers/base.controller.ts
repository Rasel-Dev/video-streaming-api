import { NextFunction, Request, Response, Router } from 'express'
import { verifyToken } from 'src/libs'

export default class BaseController {
  public router: Router

  constructor() {
    this.router = Router()
  }

  protected _showRoutes() {
    let routePaths = []
    this.router.stack.forEach((stack: any) => {
      routePaths.push({
        controller: this.constructor.name,
        path: stack.route?.path,
        method: stack.route?.stack[0]?.method?.toUpperCase()
      })
    })
    console.table(routePaths, ['controller', 'method', 'path'])
  }

  protected auth = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.body.token || req.query.token || req.headers['authorization'] || req.headers['x-access-token']

    if (!token) {
      res.status(403).send('Unauthorized!')
      return
    }
    try {
      const decoded = verifyToken(token)
      req.user = decoded.aud
    } catch (err) {
      res.status(401).send('Invalid Token')
      return
    }
    next()
  }

  protected freeAuth = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.body.token || req.query.token || req.headers['authorization'] || req.headers['x-access-token']

    if (!token) {
      next()
      return
    }
    try {
      const decoded = verifyToken(token)
      req.user = decoded.aud
    } catch (err) {
      res.status(401).send('Invalid Token')
      return
    }
    next()
  }
}
