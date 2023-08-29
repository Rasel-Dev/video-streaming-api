import { NextFunction, Request, Response } from 'express'
import prismadb from 'src/libs/prismadb'
import { channelExists, createChannel, isFollowed, removeFollow, saveFollow } from 'src/repos/channel'
import { channelDashboardVideoList } from 'src/repos/dashboard'
import BaseController from './base.controller'

class ChannelController extends BaseController {
  constructor() {
    super()
    this.routes()
  }

  private newChannel = async (req: Request, res: Response, next: NextFunction) => {
    const errors: { [index: string]: string } = {}
    const { channel_name, channel_about } = req.body

    // 1st layer validation
    if (!channel_name) errors.channel_name = 'Channel name is required!'
    if (channel_about && channel_about.length > 100) errors.channel_about = 'About length!'

    if (Object.keys(errors).length) {
      res.status(400).json(errors).end()
      return
    }

    try {
      const haveChannel = await channelExists(req?.user)

      if (haveChannel) {
        res.status(400).json({
          message: 'You already have a channel!'
        })
        return
      }

      const newChannel = await createChannel({
        userId: req?.user,
        name: channel_name,
        about: channel_about
      })

      res.json(newChannel)
    } catch (error) {
      next(error)
    }
  }

  private autoNewChannel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const haveChannel = await channelExists(req?.user)

      if (haveChannel) {
        res.status(400).json({
          message: 'You already have a channel!'
        })
        return
      }

      const userInfo = await prismadb.user.findUnique({
        where: { userId: req?.user },
        select: {
          fullname: true
        }
      })

      const newChannel = await createChannel({
        userId: req?.user,
        name: userInfo?.fullname || '',
        about: ''
      })

      res.json(newChannel)
    } catch (error) {
      next(error)
    }
  }

  private follow = async (req: Request, res: Response, next: NextFunction) => {
    const { channel_id } = req.body

    if (!channel_id) {
      res.status(400).json({
        message: 'Invalid request!'
      })
      return
    }

    try {
      const haveChannel = await channelExists(req?.user)

      if (!haveChannel) {
        res.status(400).json({
          message: 'You have no channel yet!',
          code: 998
        })
        return
      }

      if (haveChannel.channelId === channel_id) {
        res.status(400).json({
          message: "You can't follow your own channel!"
        })
        return
      }

      const isFollowing = await isFollowed(channel_id, req?.user)

      if (!isFollowing) {
        await saveFollow({
          userId: req?.user,
          channelId: channel_id
        })
        res.json({ message: 'followed' })
        return
      }
      await removeFollow(isFollowing.followId)
      res.json({ message: 'unfollowed' })
    } catch (error) {
      next(error)
    }
  }

  private dashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const videoList = await channelDashboardVideoList(req?.user)
      res.json(videoList)
    } catch (error) {
      next(error)
    }
  }

  /**
   * configure router
   */
  public routes() {
    this.router.use(this.auth)
    this.router.get('/dashboard', this.dashboard)
    this.router.post('/new', this.newChannel)
    this.router.post('/auto-new', this.autoNewChannel)
    this.router.post('/follow', this.follow)

    // -------------------------

    // this._showRoutes()
  }
}

export default new ChannelController()
