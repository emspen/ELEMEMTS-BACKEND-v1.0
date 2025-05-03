import httpStatus from 'http-status'
import ApiError from '@/utils/apiError'
import {encryptPassword} from '@/utils/encryption'

import prisma from '@/prisma/client'
import {User, Prisma} from '@prisma/client'
import slugify from 'slugify'

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
  secret: string,
  google_id?: string,
  isVerified?: boolean
): Promise<User> => {
  if (await getUserByEmail(email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken')
  }
  const user_name = await generateUniqueUsername(email)
  const user = await prisma.user.create({
    data: {
      email,
      user_name,
      google_id,
      is_email_verified: isVerified,
      name,
      password: await encryptPassword(password),
      secret,
    },
  })

  return user
}
/**
 * Query for users
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async <Key extends keyof User>(
  filter: object,
  options: {
    limit?: number
    page?: number
    sortBy?: string
    sortType?: 'asc' | 'desc'
  },
  keys: Key[] = ['id', 'email', 'name', 'is_email_verified', 'createdAt', 'updatedAt'] as Key[]
): Promise<Pick<User, Key>[]> => {
  const {limit = 10, page = 1, sortBy = 'createdAt', sortType = 'desc'} = options
  console.log(filter)
  const users = await prisma.user.findMany({
    where: filter,
    select: keys.reduce((obj, k) => ({...obj, [k]: true}), {}),
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {[sortBy]: sortType},
  })
  return users as Pick<User, Key>[]
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
  return (await prisma.user.findUnique({
    where: {id},
    select: keys.reduce((obj, k) => ({...obj, [k]: true}), {}),
  })) as Pick<User, Key> | null
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
  return (await prisma.user.findUnique({
    where: {email},
    select: keys.reduce((obj, k) => ({...obj, [k]: true}), {}),
  })) as Pick<User, Key> | null
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
}

/**
 * Delete user by id
 * @param {string} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId: string): Promise<User> => {
  const user = await getUserById(userId)
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
  }
  await prisma.user.delete({where: {id: user.id}})
  return user
}

const generateUniqueUsername = async (email: string): Promise<string> => {
  const base = slugify(email.split('@')[0], {lower: true, strict: true})
  let user_name = base
  let count = 1

  while (await prisma.user.findUnique({where: {user_name}})) {
    user_name = `${base}-${count}`
    count++
  }
  return user_name
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
