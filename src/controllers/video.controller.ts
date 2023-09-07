import { NextFunction, Request, Response } from 'express'
import ffprobe from 'ffprobe'
import ffprobeStatic from 'ffprobe-static'
import fs from 'fs'
import path from 'path'
import multer, { thumbnail } from 'src/libs/multer'
import prismadb from 'src/libs/prismadb'
import { getFollowCount } from 'src/repos/channel'
import { getDashboardVideos } from 'src/repos/dashboard'
import { addToPlaylist, checkPlaylist, createNewPlaylist, fetchPlaylist } from 'src/repos/playlist'
import { getMetadata, getVideoSource, saveVideo } from 'src/repos/video'
import { FormErr, VideoMetaQuery } from 'src/types/custom'
import BaseController from './base.controller'

class VideoController extends BaseController {
  constructor() {
    super()
    this.routes()
  }

  private getDashboard = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const videos = await getDashboardVideos()
      res.json(videos)
    } catch (error) {
      next(error)
    }
  }

  private getVideo__Stream = async (req: Request, res: Response, next: NextFunction) => {
    const range = req.headers.range
    const videoId = req.params.videoId

    if (!range || !videoId) {
      res.status(404).send()
      return
    }

    try {
      const video = await getVideoSource(videoId)
      if (!video) {
        res.status(404).send()
        return
      }

      const videoPath = path.resolve(`./uploads/${video?.source}`)
      const videoSize = fs.statSync(videoPath).size
      const chunkSize = (1 * 1e6) / 10 // 100kb of 1MB
      const start = Number(range.replace(/\D/g, ''))
      const end = Math.min(start + chunkSize, videoSize - 1)
      const contentLength = end - start + 1
      const headers = {
        'Content-Range': `bytes ${start}-${end}/${videoSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': contentLength,
        'Content-Type': 'video/mp4'
      }
      res.writeHead(206, headers)
      const stream = fs.createReadStream(videoPath, {
        start,
        end
      })
      stream.pipe(res)

      // const dur = await getResourceDuration('./uploads/video.mp4')
      // console.log('dur :', dur)
    } catch (error) {
      next(error)
    }
  }

  private getVideo__Metadata = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { v, p } = req.query as unknown as VideoMetaQuery

      if (!v || (v && v.split('-').length !== 5)) {
        res.status(503).send('Content missing!')
        return
      }
      if (p && p.split('-').length !== 5) {
        res.status(503).send('Content missing!')
        return
      }

      const metadata = await getMetadata(v)
      const followers = await getFollowCount(metadata.channelId)
      if (p) {
        /**
         * This playlist section have 1 bug and that's playlistId can not check if this current videoId belongs to this playlist or not
         * it will be just response playlist videos
         */
        const playlist = (await fetchPlaylist(p)).map((pl) => ({
          ...pl,
          playlist_video: pl.playlist_video.map((v) => v.video)
        }))?.[0]
        // const playlist = await fetchPlaylist(p)
        res.json({ ...metadata, followers, playlist })
        return
      }
      res.json({ ...metadata, followers })
    } catch (error) {
      next(error)
    }
  }

  private uploadVideoFile = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      res.status(400).json({ message: 'Content file is mission!' })
      return
    }
    try {
      const { filename } = req.file
      const vidInfo = await ffprobe(path.resolve('./uploads', filename), { path: ffprobeStatic.path })
      const duration = +vidInfo.streams[0].duration
      const info = {
        channelId: res.locals.channelId,
        title: 'Untitled content',
        description: 'No description',
        tags: '',
        source: filename,
        duration
      }
      const uploaded = await saveVideo(info)
      res.json(uploaded)
    } catch (error) {
      next(error)
    }
  }

  private patchUploadedVideoMetaData = async (req: Request, res: Response, next: NextFunction) => {
    const errors: FormErr = {}
    const { videoId, title, description, tags, status, playlist, newPlaylist } = req.body

    if (!req.file) {
      res.status(400).json({ message: 'Thumbnail is mission!' })
      return
    }

    if (!videoId) errors.videoId = 'Your content file missing!'
    if (!title) errors.title = 'Title is required!'
    if (!description) errors.description = 'Description is required!'
    if (!tags) errors.tags = 'Tags is required!'
    if (status && !['PUBLIC', 'PRIVATE'].includes(status)) errors.status = 'Status is required!'

    if (!errors?.title && title.length < 10) errors.title = 'Title should be minimum 10 character!'
    if (!errors?.description && description.length < 20)
      errors.description = 'Description should be minimum 20 character!'
    // if (!errors?.tags && tags?.split(',')) errors.tags = 'Tags is required!'
    if (newPlaylist && newPlaylist.length < 10) errors.newPlaylist = 'Title should be minimum 10 character!'

    if (Object.keys(errors).length) {
      res.status(400).json(errors)
      return
    }

    try {
      const { filename } = req.file
      const patch: Record<string, string | number> = {}
      patch.title = title
      patch.description = description
      patch.tags = tags
      patch.status = status
      if (filename) patch.thumbnail = filename

      if (newPlaylist) {
        const createdNewPlaylist = await createNewPlaylist(res.locals.channelId, newPlaylist, 'No Description')
        await addToPlaylist(createdNewPlaylist.playlistId, videoId)
      }

      if (playlist) {
        const checkPll = await checkPlaylist(playlist, res.locals.channelId)
        if (!checkPll) {
          res.status(400).json({ message: 'Playlisy not available!' })
          return
        }
        await addToPlaylist(playlist, videoId)
      }

      const patched = await prismadb.video.update({
        where: {
          videoId
        },
        data: patch
      })

      res.send(patched)
    } catch (error) {
      next(error)
    }
  }

  private updateWatchedDuration = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(req.body, req.params?.videoId)
      res.send('OK')
    } catch (error) {
      next(error)
    }
  }

  /**
   * configure router
   */
  public routes() {
    this.router.get('/', this.getDashboard)
    this.router.get('/str/:videoId', this.getVideo__Stream)
    this.router.get('/metadata', this.freeAuth, this.getVideo__Metadata)
    this.router.post('/duration', this.freeAuth, this.updateWatchedDuration)

    this.router.use(this.auth)
    this.router.post('/upload', this.checkChannelExists, multer.single('content'), this.uploadVideoFile)
    this.router.post('/publish', this.checkChannelExists, thumbnail, this.patchUploadedVideoMetaData)

    // -------------------------
    // this._showRoutes()
  }
}

export default new VideoController()
