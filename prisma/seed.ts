// import { PrismaClient } from '@prisma/client'
// const prisma = new PrismaClient()
// async function main() {
//   const alice = await prisma.user.create({
//     data:{}
//   })
//   const bob = await prisma.user.create({
//     // where: { email: 'bob@prisma.io' },
//     // update: {},
//     create: {
//       email: 'bob@prisma.io',
//       name: 'Bob',
//       posts: {
//         create: [
//           {
//             title: 'Follow Prisma on Twitter',
//             content: 'https://twitter.com/prisma',
//             published: true
//           },
//           {
//             title: 'Follow Nexus on Twitter',
//             content: 'https://twitter.com/nexusgql',
//             published: true
//           }
//         ]
//       }
//     }
//   })
//   console.log({ alice, bob })
// }
// main()
//   .then(async () => {
//     await prisma.$disconnect()
//   })
//   .catch(async (e) => {
//     console.error(e)
//     await prisma.$disconnect()
//     process.exit(1)
//   })
