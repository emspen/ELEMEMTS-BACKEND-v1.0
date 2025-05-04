import httpStatus from 'http-status'
import ApiError from '@/utils/apiError'
import {encryptPassword} from '@/utils/encryption'

import prisma from '@/prisma/client'
import {User, Prisma} from '@prisma/client'
import slugify from 'slugify'
import {generateTotp} from '@/utils/totp'
import emailService from './email.service'
import {logger} from '@/config' // Assuming you have a logger utility

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
  google_id?: string,
  isVerified?: boolean
): Promise<User> => {
  try {
    if (await getUserByEmail(email)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken')
    }
    const {token, secret} = generateTotp()
    console.log(email)
    await emailService.sendVerificationEmail(email, token)
    const user_name = await generateUniqueUsername(email)

    const user = await prisma.user.create({
      data: {
        email,
        user_name,
        google_id,
        is_email_verified: isVerified,
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
  keys: Key[] = ['id', 'email', 'name', 'is_email_verified', 'created_at', 'updated_at'] as Key[]
): Promise<Pick<User, Key>[]> => {
  try {
    const {limit = 10, page = 1, sortBy = 'created_at', sortType = 'desc'} = options

    // Process date filters if they exist
    const where: Record<string, any> = {...filter}

    // Handle created_at date filter
    if (where.created_at) {
      // Handle the case where created_at is an object with operators like gte
      if (typeof where.created_at === 'object') {
        // Convert date strings to proper ISO format for each operator
        Object.keys(where.created_at).forEach((operator) => {
          const dateStr = where.created_at[operator]
          if (typeof dateStr === 'string' && !dateStr.includes('T')) {
            where.created_at[operator] = `${dateStr}T00:00:00.000Z`
          }
        })
      }
    }

    // Handle updated_at date filter
    if (where.updated_at) {
      // Handle the case where updated_at is an object with operators like gte
      if (typeof where.updated_at === 'object') {
        // Convert date strings to proper ISO format for each operator
        Object.keys(where.updated_at).forEach((operator) => {
          const dateStr = where.updated_at[operator]
          if (typeof dateStr === 'string' && !dateStr.includes('T')) {
            where.updated_at[operator] = `${dateStr}T00:00:00.000Z`
          }
        })
      }
    }
    const users = await prisma.user.findMany({
      where,
      select: keys.reduce((obj, k) => ({...obj, [k]: true}), {}),
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {[sortBy]: sortType},
    })
    return users as Pick<User, Key>[]
  } catch (error) {
    logger.error('Error querying users:', error)
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to query users')
  }
}

/**
 * Get user by id
 * @param {ObjectId} id
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<User, Key> | null>}
 */
const getUserById = async <Key extends keyof User>(
  id: string,
  keys: Key[] = [
    'id',
    'email',
    'user_name',
    'name',
    'password',
    'secret',
    'role',
    'avatar_url',
    'is_email_verified',
    'is_active',
    'is_suspended',
    'updated_at',
    'created_at',
  ] as Key[]
): Promise<Pick<User, Key> | null> => {
  try {
    return (await prisma.user.findUnique({
      where: {id},
      select: keys.reduce((obj, k) => ({...obj, [k]: true}), {}),
    })) as Pick<User, Key> | null
  } catch (error) {
    logger.error(`Error getting user by ID ${id}:`, error)
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get user by ID')
  }
}

/**
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
    'user_name',
    'name',
    'password',
    'secret',
    'role',
    'avatar_url',
    'is_email_verified',
    'is_active',
    'is_suspended',
    'updated_at',
    'created_at',
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
 * @param {string} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async <Key extends keyof User>(
  userId: string,
  updateBody: Prisma.UserUpdateInput,
  keys: Key[] = ['id', 'email', 'name', 'secret', 'role'] as Key[]
): Promise<Pick<User, Key> | null> => {
  try {
    const user = await getUserById(userId, keys)
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
    }
    const updatedUser = await prisma.user.update({
      where: {id: userId},
      data: updateBody,
      select: keys.reduce((obj, k) => ({...obj, [k]: true}), {}),
    })
    return updatedUser as Pick<User, Key> | null
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    logger.error(`Error updating user ${userId}:`, error)
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update user')
  }
}

/**
 * Delete user by id
 * @param {string} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId: string): Promise<User> => {
  try {
    const user = await getUserById(userId)
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
    }
    await prisma.user.delete({where: {id: user.id}})
    return user
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    logger.error(`Error deleting user ${userId}:`, error)
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to delete user')
  }
}

const generateUniqueUsername = async (email: string): Promise<string> => {
  try {
    const base = slugify(email.split('@')[0], {lower: true, strict: true})
    let user_name = base
    let count = 1

    while (await prisma.user.findUnique({where: {user_name}})) {
      user_name = `${base}-${count}`
      count++
    }
    return user_name
  } catch (error) {
    logger.error(`Error generating unique username for ${email}:`, error)
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to generate unique username')
  }
}

export default {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  generateUniqueUsername,
}
