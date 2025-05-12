import httpStatus from 'http-status'
import tokenService from '@/services/shared/token.service'
import userService from '@/services/shared/user.service'
import emailService from './email.service'
import ApiError from '@/utils/apiError.utils'
import exclude from '@/utils/exclude.utils'
import {encryptPassword, isPasswordMatch} from '@/utils/encryption.utils'
import {regenerateTotp, verifyTotp} from '@/utils/totp.utils'
import {logger} from '@/config'
import {TokenType, User} from '@prisma/client'

/**
 * Register with email and password, name
 * @param {string} email
 * @param {string} password
 * @param {string} name
 * @returns {Promise<Omit<User, 'password'>>}
 */
const register = async (
  email: string,
  name: string,
  password: string
): Promise<
  Omit<
    User,
    | 'password'
    | 'googleId'
    | 'carts'
    | 'downloads'
    | 'createdAt'
    | 'updatedAt'
    | 'projects'
    | 'userName'
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
  googleId?: string
): Promise<
  Omit<
    User,
    | 'password'
    | 'googleId'
    | 'carts'
    | 'downloads'
    | 'createdAt'
    | 'updatedAt'
    | 'projects'
    | 'userName'
  >
> => {
  const user = await loginUserWithEmailAndPassword(email, password, googleId)
  if (!user.isEmailVerified) {
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
  googleId?: string
): Promise<
  Omit<
    User,
    | 'password'
    | 'googleId'
    | 'carts'
    | 'downloads'
    | 'createdAt'
    | 'updatedAt'
    | 'projects'
    | 'userName'
  >
> => {
  const user = await userService.getUserByEmail(email, [
    'id',
    'email',
    'name',
    'googleId',
    'password',
    'secret',
    'role',
    'avatarUrl',
    'isActive',
    'isEmailVerified',
    'isSuspended',
  ])
  if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email')
  if (user?.googleId === undefined || user?.googleId === null) {
    if (!(await isPasswordMatch(password, user.password as string))) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password')
    }
  } else if (user?.googleId !== googleId) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Authorization Failed')
  }
  return exclude(user, ['password'])
}

/**
 *
 *
 * @param {string} id
 * @return {*}  {Promise<void>}
 */
const logout = async (id: string): Promise<void> => {
  try {
    await userService.updateUserById([id], {isActive: false})
  } catch (error: any) {
    logger.error(`Failed to logout user with id ${id}: ${error.message}`)
    throw new ApiError(httpStatus.BAD_REQUEST, `Logout failed: ${error.message}`)
  }
}

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<AuthTokensResponse>}
 */
const refreshAuth = async (refreshToken: string): Promise<any> => {
  try {
    if (!refreshToken) throw new ApiError(httpStatus.BAD_REQUEST, 'Refresh token is required')
    const refreshTokenData = await tokenService.verifyToken(refreshToken, TokenType.REFRESH)
    if (refreshTokenData.userId) {
      const user = await userService.getUserByIds([refreshTokenData.userId], ['id'])
      if (!user) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User Not Found ')
      }
      return tokenService.generateAuthTokens({id: user[0].id})
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
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
    if (resetPasswordTokenData.userId) {
      const user = await userService.getUserByIds([resetPasswordTokenData.userId], ['id'])
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

    if (!user.isEmailVerified) {
      if (verifyTotp(verifyEmailToken, user.secret)) {
        await userService.updateUserById([user.id], {isEmailVerified: true})
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
    const user = await userService.getUserByEmail(email, ['isEmailVerified', 'secret'])

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
    }
    const {token} = regenerateTotp(user.secret as string)
    if (type === 'email-verification') {
      if (!user.isEmailVerified) {
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
