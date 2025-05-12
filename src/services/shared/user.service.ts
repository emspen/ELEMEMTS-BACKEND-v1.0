import httpStatus from 'http-status'
import ApiError from '@/utils/apiError.utils'
import {encryptPassword} from '@/utils/encryption.utils'

import prisma from '@/prisma/client'
import {User, Prisma} from '@prisma/client'
import {generateTotp} from '@/utils/totp.utils'
import emailService from './email.service'
import {logger} from '@/config' // Assuming you have a logger utility
import {generateUniqueUsername} from '@/utils/uniqueUsername.utils'

/**
 * Create a user
 * @param {string} email
 * @param {string} name
 * @param {string} password
 * @param {string} secret
 * @param {string} inviteToken
 * @returns {Promise<User>}
 */
const createUser = async (
  email: string,
  name: string,
  password: string,
  googleId?: string,
  isVerified?: boolean
): Promise<User> => {
  try {
    if (await getUserByEmail(email)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken')
    }
    const {token, secret} = generateTotp()
    console.log(email)
    await emailService.sendVerificationEmail(email, token)
    const userName = await generateUniqueUsername(email)

    const user = await prisma.user.create({
      data: {
        email,
        userName,
        googleId,
        isEmailVerified: isVerified,
        name,
        password: await encryptPassword(password),
        secret: secret.base32,
      },
    })
    logger.info(`❤️ Email Verification Code: ${token} `)
    return user
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    logger.error('Error creating user:', error)
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create user')
  }
}

/**
 * Query for users
 * @param {Object} filters - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async <Key extends keyof User>(
  filter: Record<string, any>,
  options: {
    limit?: number
    page?: number
    sortBy?: string
    sortType?: 'asc' | 'desc'
  },
  keys: Key[] = [
    'id',
    'email',
    'name',
    'avatarUrl',
    'role',
    'isEmailVerified',
    'isSuspended',
    'createdAt',
    'updatedAt',
  ] as Key[]
): Promise<[Pick<User, Key>[], number]> => {
  try {
    const {limit = 10, page = 1, sortBy = 'createdAt', sortType = 'desc'} = options
    console.log('filter', filter)
    // Process date filters if they exist
    const where: Record<string, any> = {...filter}

    // Handle createdAt date filter
    if (where.createdAt) {
      // Handle the case where createdAt is an object with operators like gte
      if (typeof where.createdAt === 'object') {
        // Convert date strings to proper ISO format for each operator
        Object.keys(where.createdAt).forEach((operator) => {
          const dateStr = where.createdAt[operator]
          if (typeof dateStr === 'string' && !dateStr.includes('T')) {
            where.createdAt[operator] = `${dateStr}T00:00:00.000Z`
          }
        })
      }
    }

    // Handle updatedAt date filter
    if (where.updatedAt) {
      // Handle the case where updatedAt is an object with operators like gte
      if (typeof where.updatedAt === 'object') {
        // Convert date strings to proper ISO format for each operator
        Object.keys(where.updatedAt).forEach((operator) => {
          const dateStr = where.updatedAt[operator]
          if (typeof dateStr === 'string' && !dateStr.includes('T')) {
            where.updatedAt[operator] = `${dateStr}T00:00:00.000Z`
          }
        })
      }
    }
    const [total, users] = await Promise.all([
      prisma.user.count({where}),
      prisma.user.findMany({
        where,
        select: keys.reduce((obj, k) => ({...obj, [k]: true}), {}),
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {[sortBy]: sortType},
      }),
    ])
    return [users as Pick<User, Key>[], total]
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        logger.error('User not found:', error.meta?.cause)
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
      }
    }
    logger.error('Error querying users:', error)
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to query users')
  }
}

/**
 * Get user by id
 * @param {Array<id>} id
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<User, Key> | null>}
 */

const getUserByIds = async <Key extends keyof User>(
  ids: Array<string>,
  keys: Key[] = [
    'id',
    'email',
    'userName',
    'name',
    'password',
    'secret',
    'role',
    'avatarUrl',
    'isEmailVerified',
    'isActive',
    'isSuspended',
    'updatedAt',
    'createdAt',
  ] as Key[]
): Promise<Pick<User, Key>[] | null> => {
  try {
    return (await prisma.user.findMany({
      where: {id: {in: ids}},
      select: keys.reduce((obj, k) => ({...obj, [k]: true}), {}),
    })) as Pick<User, Key>[] | null
  } catch (error) {
    logger.error(`Error getting user by ID ${ids}:`, error)
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get user by ID')
  }
} /**
 * Get user by email
 * @param {string} email
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<User, Key> | null>}
 */
const getUserByEmail = async <Key extends keyof User>(
  email: string,
  keys: Key[] = [
    'id',
    'email',
    'userName',
    'name',
    'password',
    'secret',
    'role',
    'avatarUrl',
    'isEmailVerified',
    'isActive',
    'isSuspended',
    'updatedAt',
    'createdAt',
  ] as Key[]
): Promise<Pick<User, Key> | null> => {
  try {
    return (await prisma.user.findUnique({
      where: {email},
      select: keys.reduce((obj, k) => ({...obj, [k]: true}), {}),
    })) as Pick<User, Key> | null
  } catch (error) {
    logger.error(`Error getting user by email ${email}:`, error)
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get user by email')
  }
}

/**
 * Update user by id
 * @param {string} id
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async <Key extends keyof User>(
  id: Array<string>,
  updateBody: Prisma.UserUpdateInput,
  keys: Key[] = ['id', 'email', 'name', 'secret', 'role', 'isSuspended', 'isActive'] as Key[]
) => {
  try {
    const user = await getUserByIds(id, keys)
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
    }
    console.log('updateBody', updateBody)
    const users = await prisma.user.updateMany({
      where: {id: {in: id}},
      data: updateBody,
    })
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    logger.error(`Error updating user ${id}:`, error)
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update user')
  }
}
/**
 * Delete user by id
 * @param {string} userId
 * @returns {Promise<User>}
 */
// const deleteUserById = async (userId: string): Promise<User> => {
//   try {
//     const user = await getUserById(userId)
//     if (!user) {
//       throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
//     }
//     await prisma.user.delete({where: {id: user.id}})
//     return user
//   } catch (error) {
//     if (error instanceof ApiError) {
//       throw error
//     }
//     logger.error(`Error deleting user ${userId}:`, error)
//     throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to delete user')
//   }
// }

export default {
  createUser,
  queryUsers,
  getUserByIds,
  getUserByEmail,
  updateUserById,
}
