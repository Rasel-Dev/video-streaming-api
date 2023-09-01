import { video } from '@prisma/client'
import prismadb from 'src/libs/prismadb'

export const getVideoSource = (videoId: string) =>
  prismadb.video.findFirst({
    where: {
      videoId
    },
    select: {
      source: true
    }
  })

export const saveVideo = (body: Omit<video, 'videoId' | 'createdAt' | 'playlistId' | 'status' | 'thumbnail'>) =>
  prismadb.video.create({
    data: body,
    select: {
      videoId: true
    }
  })

export const getMetadata = (videoId: string) =>
  prismadb.video.findUnique({
    where: { videoId },
    select: {
      channelId: true,
      thumbnail: true,
      title: true,
      description: true,
      createdAt: true,
      channel: {
        select: {
          name: true,
          user: { select: { avater: true } }
        }
      }
    }
  })

export const totalVideosInChannel = (channelId: string, hasOwn = false) =>
  hasOwn
    ? prismadb.video.count({ where: { channelId } })
    : prismadb.video.count({ where: { channelId, status: 'PUBLIC' } })
