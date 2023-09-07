import { channel, follow } from '@prisma/client'
import prismadb from 'src/libs/prismadb'
import { APP_ENV } from '..'

export const channelExists = (userId: string) =>
  prismadb.channel.findUnique({
    where: {
      userId
    },
    select: {
      channelId: true
    }
  })

export const hasOwnChannel = (userId: string, channelId: string) =>
  prismadb.channel.findFirst({
    where: {
      channelId,
      userId
    },
    select: {
      channelId: true
    }
  })

export const createChannel = (body: Omit<channel, 'channelId' | 'createdAt'>) =>
  prismadb.channel.create({
    data: body,
    select: {
      channelId: true,
      name: true
    }
  })

export const saveFollow = (body: Omit<follow, 'followId' | 'followedAt'>) =>
  prismadb.follow.create({
    data: body
  })

export const removeFollow = (followId: string) =>
  prismadb.follow.delete({
    where: {
      followId
    }
  })

export const getFollowCount = (channelId: string) =>
  prismadb.follow.count({
    where: {
      channelId
    }
  })

export const isFollowed = (channelId: string, userId: string) =>
  prismadb.follow.findFirst({
    where: { channelId, userId },
    select: {
      followId: true
    }
  })

export const fetchChannelVideos = (channelId: string, hasOwn = false, skip = 0, take = APP_ENV.PER_PAGE) =>
  hasOwn
    ? prismadb.channel.findUnique({
        where: {
          channelId
        },
        select: {
          video: {
            select: {
              videoId: true,
              title: true,
              duration: true,
              thumbnail: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            skip,
            take
          }
        }
      })
    : prismadb.channel.findUnique({
        where: {
          channelId,
          video: {
            some: {
              status: 'PUBLIC'
            }
          }
        },
        select: {
          video: {
            select: {
              videoId: true,
              title: true,
              duration: true,
              thumbnail: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            skip,
            take
          }
        }
      })

export const fetchChannelProfile = (channelId: string) =>
  prismadb.channel.findUnique({
    where: {
      channelId
    },
    select: {
      user: {
        select: {
          fullname: true,
          username: true,
          avater: true
        }
      }
    }
  })
