import { playlistStatus } from '@prisma/client'
import prismadb from 'src/libs/prismadb'
import { APP_ENV } from '..'

export const createNewPlaylist = (channelId: string, title: string, description: string) =>
  prismadb.playlist.create({
    data: {
      channelId,
      title,
      description
    },
    select: {
      playlistId: true
    }
  })

export const checkPlaylist = (playlistId: string, channelId: string) =>
  prismadb.playlist.findFirst({
    where: { playlistId, channelId },
    select: { playlistId: true }
  })

export const addToPlaylist = (playlistId: string, videoId: string, status = playlistStatus.PUBLIC) =>
  prismadb.playlist_video.create({
    data: {
      playlistId,
      videoId,
      status
    }
  })

export const totalPlaylistsInChannel = (channelId: string, hasOwn = false) =>
  hasOwn
    ? prismadb.playlist.count({ where: { channelId } })
    : prismadb.playlist.count({ where: { channelId, status: 'PUBLIC' } })

// export const totalVideosInPlaylist = (playlistIds: string) =>
//   prismadb.$queryRaw<
//     PlaylistRow[]
//   >`SELECT "playlistId", "totalvideos" FROM pl_view WHERE "playlistId" IN (${playlistIds})`

export const totalVideosInPlaylist = (playlistIds: string[]) =>
  prismadb.playlist.findMany({
    where: {
      playlistId: { in: playlistIds }
    },
    distinct: ['playlistId'],
    select: {
      playlistId: true,
      playlist_video: {
        select: {
          videoId: true
        }
      }
    }
  })

export const fetchPlaylist = (playlistId: string) =>
  prismadb.playlist.findMany({
    where: {
      playlistId
    },
    select: {
      title: true,
      description: true,
      playlist_video: {
        select: {
          video: {
            select: {
              channelId: true,
              videoId: true,
              thumbnail: true,
              title: true,
              duration: true,
              createdAt: true,
              channel: {
                select: {
                  name: true
                  // user: { select: { avater: true } }
                }
              }
            }
          }
        }
      }
    }
  })

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
        description: true,
        playlist_video: {
          select: {
            videoId: true,
            video: {
              select: {
                thumbnail: true
              }
            }
          },
          distinct: ['playlistId'],
          orderBy: {
            createdAt: 'asc'
          },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
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
        description: true,
        playlist_video: {
          select: {
            videoId: true,
            video: {
              select: {
                thumbnail: true
              }
            }
          },
          distinct: ['playlistId'],
          orderBy: {
            createdAt: 'asc'
          },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
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
      description: true,
      playlist_video: {
        select: {
          videoId: true,
          video: {
            select: {
              thumbnail: true
            }
          }
        },
        distinct: ['playlistId'],
        orderBy: {
          createdAt: 'asc'
        },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' },
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
    orderBy: { createdAt: 'desc' }
  })
