import { NextFunction, Request, Response } from 'express'
import { channelExists } from 'src/repos/channel'
import { getCurrentUser } from 'src/repos/user'
import BaseController from './base.controller'

class UserController extends BaseController {
  constructor() {
    super()
    this.routes()
  }

  private profile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user
      const [profile, channel] = await Promise.all([getCurrentUser(userId), channelExists(userId)])
      res.json({ id: userId, ...profile, channelId: channel.channelId })
    } catch (error) {
      next(error)
    }
  }

  /**
   * configure router
   */
  public routes() {
    // user
    this.router.get('/', this.auth, this.profile)

    // this._showRoutes()
  }
}

export default new UserController()
