import { NextFunction, Request, Response } from 'express'
import prismadb from 'src/libs/prismadb'
import {
  channelExists,
  createChannel,
  fetchChannelProfile,
  fetchChannelVideos,
  getFollowCount,
  hasOwnChannel,
  isFollowed,
  removeFollow,
  saveFollow
} from 'src/repos/channel'
import { fetchChannelPlaylists, fetchPlaylistsMeta, totalPlaylistsInChannel } from 'src/repos/playlist'
import { totalVideosInChannel } from 'src/repos/video'
import { ChannelDashboardQuery } from 'src/types/custom'
import { APP_ENV } from '..'
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

  // private dashboard = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const videoList = await channelDashboardVideoList(req?.user)
  //     res.json(videoList)
  //   } catch (error) {
  //     next(error)
  //   }
  // }

  private getChannelDashboard = async (req: Request, res: Response, next: NextFunction) => {
    const { cid, sc, page } = req.query as unknown as ChannelDashboardQuery
    if (!cid) {
      res.status(404).send('Not found!')
      return
    }

    const availableSections = ['profile', 'videos', 'playlists']
    if (sc && !availableSections.includes(sc)) {
      res.status(404).send('Not found!')
      return
    }

    if (page && !+page) {
      res.status(404).send('Not found!')
      return
    }

    const canculateSkip = (+page === 1 ? 0 : +page * 10) || 0

    try {
      const hasOwn = req?.user ? await hasOwnChannel(req?.user, cid) : false
      switch (sc) {
        case 'profile': {
          // [ x ] fullname: '',
          // [ x ] username: '',
          // [ x ] totalFollowers: 0,
          // [ x ] totalVideos: 0,
          // [ - ] about: '',
          // [ x ] avatar: '',

          const [profile, totalVideos, totalFollowers, hasFollowed] = await Promise.all([
            fetchChannelProfile(cid),
            totalVideosInChannel(cid, !!hasOwn),
            getFollowCount(cid),
            req?.user ? isFollowed(cid, req?.user) : Promise.resolve(false)
          ])
          res.json({
            ...profile.user,
            totalVideos,
            totalFollowers,
            hasFollowed: !!hasFollowed,
            about: `This is a dummy description about this channel. it's static from VidApi, in the future it'll be dynamic (under development)`
          })
          return
        }

        case 'videos': {
          const total = await totalVideosInChannel(cid, !!hasOwn)
          const pages = Math.ceil(total / APP_ENV.PER_PAGE)
          const videos = await fetchChannelVideos(cid, !!hasOwn, canculateSkip)
          res.json({ page: +page || 1, pages, data: videos?.video || [] })
          return
        }

        case 'playlists': {
          const total = await totalPlaylistsInChannel(cid, !!hasOwn)
          const pages = Math.ceil(total / APP_ENV.PER_PAGE)
          const playlists = await fetchChannelPlaylists(cid, !!hasOwn, canculateSkip)
          res.json({ page: +page || 1, pages, data: playlists || [] })
          return
        }

        case 'pl': {
          /**
           * If the channel is not owner by requested user it will return "Not found!"
           */
          if (!hasOwn) {
            res.status(404).send('Not found!')
            return
          }
          const playlists = await fetchPlaylistsMeta(cid)
          res.json(playlists || [])
          return
        }

        default:
          res.status(503).json('Temporary unavailable service!')
          return
      }
    } catch (error) {
      next(error)
    }
  }

  private getChannelPlaylistsMeta = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const cid = res.locals.channelId
      const playlists = await fetchPlaylistsMeta(cid)
      res.json(playlists || [])
    } catch (error) {
      next(error)
    }
  }

  /**
   * configure router
   */
  public routes() {
    this.router.get('/dashboard', this.freeAuth, this.getChannelDashboard)
    this.router.use(this.auth)
    this.router.post('/new', this.newChannel)
    this.router.post('/auto-new', this.autoNewChannel)
    this.router.post('/follow', this.follow)
    this.router.get('/playlists', this.checkChannelExists, this.getChannelPlaylistsMeta)

    // -------------------------

    // this._showRoutes()
  }
}

export default new ChannelController()
