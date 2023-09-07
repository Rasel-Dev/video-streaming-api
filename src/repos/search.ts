import prismadb from 'src/libs/prismadb'

export const fetchSearhedVideos = (searchQuery: string) =>
  prismadb.video.findMany({
    where: {
      OR: [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
        { tags: { contains: searchQuery, mode: 'insensitive' } }
      ]
    },
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
