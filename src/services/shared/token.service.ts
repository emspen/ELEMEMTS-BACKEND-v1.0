import jwt, {JwtPayload} from 'jsonwebtoken'
import moment, {Moment} from 'moment'
import httpStatus from 'http-status'

import {AuthTokensResponse} from '@/types/response'
import {envConfig} from '@/config'
import ApiError from '@/utils/apiError'
import userService from '@/services/shared/user.service'
import {TokenType} from '@prisma/client'
import {VerifyToken} from '@/types/response'

/**
 * Generate token
 * @param {string} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (
  userId: string,
  expires: Moment,
  type: TokenType,
  secret: string = envConfig.jwt.secret
): string => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  }
  return jwt.sign(payload, secret)
}

/**
 * Save a token
 * @param {string} token
 * @param {string} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
// const saveToken = async (
//   token: string,
//   expires: Moment,
//   type: TokenType,
//   userId: string | null,
//   teamId: string | null,
//   blacklisted: boolean = false
// ): Promise<any> => {
//   if (type !== TokenType.INVITATION && userId) {
//     return await prisma.token.create({
//       data: {
//         token,
//         user: {
//           connect: { id: userId },
//         },
//         expires: expires.toDate(),
//         type,
//       },
//     })
//   } else if (teamId) {
//     return await prisma.token.create({
//       data: {
//         token,
//         team: {
//           connect: { id: teamId },
//         },
//         expires: expires.toDate(),
//         type,
//       },
//     })
//   }
// }

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<VerifyToken>}
 */
const verifyToken = async (token: string, type: TokenType): Promise<VerifyToken> => {
  const payload = jwt.verify(token, envConfig.jwt.secret) as JwtPayload
  const userId = String(payload.sub)
  if (!payload.exp) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Invalid token: missing expiration')
  }
  const expirationTime = new Date(payload.exp * 1000)
  if (expirationTime < new Date()) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Token has been expired')
  }
  return {
    token,
    expires: expirationTime,
    type,
    userId,
  } as VerifyToken
}

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<AuthTokensResponse>}
 */
const generateAuthTokens = async (user: {id: string}): Promise<AuthTokensResponse> => {
  const accessTokenExpires = moment().add(envConfig.jwt.accessExpirationMinutes, 'minutes')
  const accessToken = generateToken(user.id, accessTokenExpires, TokenType.ACCESS)

  const refreshTokenExpires = moment().add(envConfig.jwt.refreshExpirationDays, 'days')
  const refreshToken = generateToken(user.id, refreshTokenExpires, TokenType.REFRESH)
  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  }
}

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (email: string): Promise<string> => {
  const user = await userService.getUserByEmail(email)
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email')
  }
  const expires = moment().add(envConfig.jwt.resetPasswordExpirationMinutes, 'minutes')
  const resetPasswordToken = generateToken(user.id as string, expires, TokenType.RESET_PASSWORD)
  return resetPasswordToken
}

/**
 * Generate verify email token
 * @param {User} user
 * @returns {Promise<string>}
 */
const generateVerifyEmailToken = async (user: {id: string}): Promise<string> => {
  const expires = moment().add(envConfig.jwt.verifyEmailExpirationMinutes, 'minutes')
  const verifyEmailToken = generateToken(user.id, expires, TokenType.VERIFY_EMAIL)
  return verifyEmailToken
}

export default {
  generateToken,
  verifyToken,
  generateAuthTokens,
  generateResetPasswordToken,
  generateVerifyEmailToken,
}
