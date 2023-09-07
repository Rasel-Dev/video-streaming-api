import { NextFunction, Request, Response } from 'express'
import { fetchSearhedVideos } from 'src/repos/search'
import BaseController from './base.controller'

class SearchController extends BaseController {
  constructor() {
    super()
    this.routes()
  }

  private searchBody = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // const userId = req.user
      const { q } = req.query as unknown as { q: string }
      const [videoFounds] = await Promise.all([fetchSearhedVideos(q)])

      res.json({ videos: videoFounds })
    } catch (error) {
      next(error)
    }
  }

  /**
   * configure router
   */
  public routes() {
    // user
    this.router.get('/', this.auth, this.searchBody)

    // this._showRoutes()
  }
}

export default new SearchController()
