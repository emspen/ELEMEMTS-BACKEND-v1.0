import prisma from '@/prisma/client'
import slugify from 'slugify'
import {logger} from '@/config'
import ApiError from '@/utils/apiError'
import httpStatus from 'http-status'

export const generateUniqueUsername = async (email: string): Promise<string> => {
  try {
    const base = slugify(email.split('@')[0], {lower: true, strict: true})
    let userName = base
    let count = 1

    while (await prisma.user.findUnique({where: {userName}})) {
      userName = `${base}-${count}`
      count++
    }
    return userName
  } catch (error) {
    logger.error(`Error generating unique username for ${email}:`, error)
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to generate unique username')
  }
}
