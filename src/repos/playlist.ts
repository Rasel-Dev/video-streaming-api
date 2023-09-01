import prismadb from 'src/libs/prismadb'
import { APP_ENV } from '..'

export const savePlaylist = (channelId: string, title: string) =>
  prismadb.playlist.create({
    data: {
      channelId,
      title
    },
    select: {
      playlistId: true
    }
  })

export const savePlaylistWithThumbnail = (channelId: string, title: string, defThumb: string, defVidId: string) =>
  prismadb.playlist.create({
    data: {
      channelId,
      title,
      defThumb,
      defVidId,
      totalVideos: 1
    },
    select: {
      playlistId: true
    }
  })

export const updatePlaylistCount = (playlistId: string) =>
  prismadb.playlist.update({
    where: {
      playlistId
    },
    data: { totalVideos: { increment: 1 } },
    select: { totalVideos: true }
  })

export const totalPlaylistsInChannel = (channelId: string, hasOwn = false) =>
  hasOwn ? prismadb.playlist.count({ where: { channelId } }) : prismadb.playlist.count({ where: { channelId } })

export const fetchChannelPlaylists = (
  channelId: string,
  hasOwn = false,
  skip = 0,
  take = APP_ENV.PER_PAGE,
  onSubs = false
) => {
  if (hasOwn)
    return prismadb.playlist.findMany({
      where: {
        channelId
      },
      select: {
        playlistId: true,
        title: true,
        totalVideos: true,
        defVidId: true,
        defThumb: true
      },
      orderBy: { playlistId: 'desc' },
      skip,
      take
    })

  if (onSubs)
    return prismadb.playlist.findMany({
      where: {
        channelId,
        status: 'FOLLOWER'
      },
      select: {
        playlistId: true,
        title: true,
        totalVideos: true,
        defThumb: true,
        defVidId: true
      },
      orderBy: { playlistId: 'desc' },
      skip,
      take
    })

  return prismadb.playlist.findMany({
    where: {
      channelId,
      status: 'PUBLIC'
    },
    select: {
      playlistId: true,
      title: true,
      totalVideos: true,
      defThumb: true,
      defVidId: true
    },
    orderBy: { playlistId: 'desc' },
    skip,
    take
  })
}

export const fetchPlaylistsMeta = (channelId: string) =>
  prismadb.playlist.findMany({
    where: {
      channelId
    },
    select: {
      playlistId: true,
      title: true
    },
    orderBy: { playlistId: 'desc' }
  })
