import { user } from '@prisma/client'
import prismadb from 'src/libs/prismadb'

export const checkUniqueUsername = (username: string) =>
  prismadb.user.findFirst({
    select: { userId: true },
    where: {
      username
    }
  })

export const checkUniqueEmail = (email: string) =>
  prismadb.user.findFirst({
    select: { userId: true },
    where: {
      email
    }
  })

export const getUserByUsername = (username: string) =>
  prismadb.user.findFirst({
    select: { userId: true, hashedPassword: true },
    where: {
      username
    }
  })

export const getAvaterByUserId = (userId: string) =>
  prismadb.user.findFirst({
    select: {
      avater: true
    },
    where: {
      userId
    }
  })

export const getCurrentUser = (userId: string) =>
  prismadb.user.findFirst({
    where: {
      userId
    },
    select: {
      fullname: true,
      username: true,
      email: true,
      avater: true
    }
  })

export const createNewUser = (body: Omit<user, 'userId' | 'avater' | 'isActive' | 'createdAt'>) =>
  prismadb.user.create({
    data: body,
    select: {
      userId: true
    }
  })
