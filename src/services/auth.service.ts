import httpStatus from 'http-status'
import tokenService from '@/services/token.service'
import userService from '@/services/user.service'
import emailService from './email.service'
import ApiError from '@/utils/apiError'
import exclude from '@/utils/exclude'
import {encryptPassword, isPasswordMatch} from '@/utils/encryption'
import {generateTotp} from '@/utils/totp'
import {logger} from '@/config'
import {TokenType, User} from '@prisma/client'
import prisma from '@/prisma/client'

/**
 * Register with email and password, name
 * @param {string} email
 * @param {string} password
 * @param {string} name
 * @returns {Promise<Omit<User, 'password'>>}
 */
const register = async (
  email: string,
  password: string,
  name: string
): Promise<
  Omit<
    User,
    | 'password'
    | 'google_id'
    | 'carts'
    | 'downloads'
    | 'created_at'
    | 'updated_at'
    | 'projects'
    | 'is_active'
    | 'user_name'
  >
> => {
  try {
    const {token, secret} = generateTotp()
    const user = await userService.createUser(email, name, password, secret.base32)

    await emailService.sendVerificationEmail(email, token)
    logger.info(`❤️ Email Verification Code: ${token} `)
    return user
  } catch (error: any) {
    logger.error(`Failed to register user with email ${email}: ${error.message}`)
    throw new ApiError(httpStatus.BAD_REQUEST, `User registration failed: ${error.message}`)
  }
}

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Omit<User, 'password'>>}
 */
const loginUserWithEmailAndPassword = async (
  email: string,
  password: string,
  google_id?: string
): Promise<
  Omit<
    User,
    | 'password'
    | 'google_id'
    | 'carts'
    | 'downloads'
    | 'created_at'
    | 'updated_at'
    | 'projects'
    | 'is_active'
    | 'user_name'
  >
> => {
  const user = await userService.getUserByEmail(email, [
    'id',
    'email',
    'name',
    'google_id',
    'password',
    'secret',
    'role',
    'avatar_url',
    'is_email_verified',
    'is_suspended',
  ])
  if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password')

  if (user?.google_id === undefined)
    if (!(await isPasswordMatch(password, user.password as string))) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password')
    } else if (user?.google_id !== google_id || user?.is_email_verified === false) {
      console.log(
        '😮 User ',
        user.google_id,
        '\n',
        user.is_email_verified,
        '\n',
        'Input',
        google_id
      )
      throw new ApiError(httpStatus.NOT_FOUND, 'Authorization Failed')
    }
  return exclude(user, ['password'])
}
/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise<void>}
 */
const logout = async (refreshToken: string): Promise<void> => {
  const refreshTokenData = await tokenService.verifyToken(refreshToken, TokenType.REFRESH)
  if (!refreshTokenData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found')
  }
}

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<AuthTokensResponse>}
 */
const refreshAuth = async (refreshToken: string): Promise<any> => {
  try {
    console.log('👌👌👌', refreshToken)
    const refreshTokenData = await tokenService.verifyToken(refreshToken, TokenType.REFRESH)
    if (refreshTokenData.user_id) {
      const user = await userService.getUserById(refreshTokenData.user_id, ['id'])
      if (!user) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User Not Found ')
      }
      return tokenService.generateAuthTokens({id: user.id})
    }
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate')
  }
}

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
const resetPassword = async (resetPasswordToken: string, newPassword: string): Promise<void> => {
  try {
    const resetPasswordTokenData = await tokenService.verifyToken(
      resetPasswordToken,
      TokenType.RESET_PASSWORD
    )
    if (resetPasswordTokenData.user_id) {
      const user = await userService.getUserById(resetPasswordTokenData.user_id)
      if (!user) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User Not Found ')
      }
      const encryptedPassword = await encryptPassword(newPassword)
      await userService.updateUserById(
        user.id,
        {
          password: encryptedPassword,
        },
        ['id']
      )
    }
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed')
  }
}

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise<void>}
 */
const verifyEmail = async (verifyEmailToken: string): Promise<void> => {
  try {
    const verifyEmailTokenData = await tokenService.verifyToken(
      verifyEmailToken,
      TokenType.VERIFY_EMAIL
    )

    if (verifyEmailTokenData.user_id)
      await userService.updateUserById(verifyEmailTokenData.user_id, {
        is_email_verified: true,
      })
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed')
  }
}

export default {
  register,
  loginUserWithEmailAndPassword,
  isPasswordMatch,
  encryptPassword,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
}
