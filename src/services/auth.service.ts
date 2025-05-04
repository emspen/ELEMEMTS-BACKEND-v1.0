import httpStatus from 'http-status'
import tokenService from '@/services/token.service'
import userService from '@/services/user.service'
import emailService from './email.service'
import ApiError from '@/utils/apiError'
import exclude from '@/utils/exclude'
import {encryptPassword, isPasswordMatch} from '@/utils/encryption'
import {generateTotp, regenerateTotp, verifyTotp} from '@/utils/totp'
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
    const user = await userService.createUser(email, name, password)

    return user
  } catch (error: any) {
    logger.error(`Failed to register user with email ${email}: ${error.message}`)
    throw new ApiError(httpStatus.BAD_REQUEST, `User registration failed: ${error.message}`)
  }
}

const login = async (
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
  const user = await loginUserWithEmailAndPassword(email, password, google_id)
  if (!user.is_email_verified) {
    const {token} = regenerateTotp(user.secret as string)
    await emailService.sendVerificationCode(email, token)
    console.log('❤️ Email Verification Code: ', token)
    throw new ApiError(httpStatus.FORBIDDEN, 'Please verify your email first')
  }
  return user
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
 * @param {string} accessToken
 * @returns {Promise<void>}
 */
const logout = async (accessToken: string): Promise<void> => {
  const accessTokenData = await tokenService.verifyToken(accessToken, TokenType.ACCESS)
  if (!accessTokenData) {
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
      const user = await userService.getUserById([refreshTokenData.user_id], ['id'])
      if (!user) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User Not Found ')
      }
      return tokenService.generateAuthTokens({id: user[0].id})
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
      const user = await userService.getUserById([resetPasswordTokenData.user_id])
      if (!user) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User Not Found ')
      }
      const encryptedPassword = await encryptPassword(newPassword)
      await userService.updateUserById([user[0].id], {
        password: encryptedPassword,
      })
    }
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed')
  }
}

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @param {string} email
 * @param {string} inviteToken
 * @returns {Promise<void>}
 */
const verifyEmail = async (
  email: string,
  verifyEmailToken: string,
  inviteToken?: string
): Promise<void> => {
  try {
    const user = await userService.getUserByEmail(email)

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
    }

    if (!user.is_email_verified) {
      if (verifyTotp(verifyEmailToken, user.secret)) {
        await userService.updateUserById([user.id], {is_email_verified: true})
      }
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already verified')
    }
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed')
  }
}

const resendCode = async (email: string, type: string): Promise<void> => {
  try {
    const user = await userService.getUserByEmail(email, ['is_email_verified', 'secret'])

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
    }
    const {token} = regenerateTotp(user.secret as string)
    if (type === 'email-verification') {
      if (!user.is_email_verified) {
        await emailService.sendVerificationEmail(email, token)
        console.log('❤️ Email Verification Code: ', token)
      }
    } else if (type === 'forgot-password') {
      await emailService.sendResetPasswordEmail(email, token)
      console.log('❤️ Reset Password Code: ', token)
    }
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed')
  }
}

const forgotPassword = async (email: string): Promise<string> => {
  try {
    const user = await userService.getUserByEmail(email, ['email', 'secret'])
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
    }
    const {token} = regenerateTotp(user.secret as string)
    await emailService.sendVerificationEmail(email, token)
    console.log('❤️ Reset Password Code: ', token)
    return user.email
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Forgot Password Code Failed')
  }
}

const sendVerificationEmail = async (email: string, token: string): Promise<string> => {
  try {
    const user = await userService.getUserByEmail(email, ['email', 'secret'])
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
    }
    if (verifyTotp(token, user.secret)) {
      const resetToken = await tokenService.generateResetPasswordToken(email)
      console.log('❤️ Reset Password Token: ', resetToken)
      await emailService.sendResetPasswordEmail(email, resetToken)
    }
    return user.email
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid verification code')
  }
}

export default {
  register,
  login,
  loginUserWithEmailAndPassword,
  isPasswordMatch,
  encryptPassword,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
  resendCode,
  forgotPassword,
  sendVerificationEmail,
}
