import { channel, follow } from '@prisma/client'
import prismadb from 'src/libs/prismadb'

export const channelExists = (userId: string) =>
  prismadb.channel.findUnique({
    where: {
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
