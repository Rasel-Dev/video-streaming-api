import prismadb from 'src/libs/prismadb'

export const getDashboardVideos = () =>
  prismadb.video.findMany({
    select: {
      videoId: true,
      thumbnail: true,
      title: true,
      duration: true,
      createdAt: true,
      channel: {
        select: { channelId: true, name: true }
      }
    }
  })

export const channelDashboardVideoList = (userId: string) =>
  prismadb.channel.findUnique({
    where: {
      userId
    },
    include: {
      video: {
        select: {
          videoId: true,
          title: true,
          duration: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })
