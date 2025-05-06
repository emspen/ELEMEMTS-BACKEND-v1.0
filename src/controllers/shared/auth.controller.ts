import httpStatus from 'http-status'

import exclude from '@/utils/exclude'
import ApiError from '@/utils/apiError'

import authService from '@/services/shared/auth.service'
import userService from '@/services/shared/user.service'
import tokenService from '@/services/shared/token.service'

import {TokenType, User} from '@prisma/client'
import catchAsync from '@/utils/catchAsync'

const /**
   * Register a new user
   *
   * @param {*} req
   * @param {*} res
   */
  registerUser = catchAsync(async (req, res) => {
    try {
      const {name, email, password} = req.body
      const user = await authService.register(email, name, password)
      res.status(httpStatus.CREATED).send({
        status: 'success',
        data: {
          user: {
            email: user.email,
            name: user.name,
          },
        },
      })
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred during registration',
      })
    }
  })

const /**
   * Login a user
   *
   * @param {*} req
   * @param {*} res
   */
  login = catchAsync(async (req, res) => {
    try {
      const {email, password} = req.body
      const user = await authService.login(email, password)
      const tokens = await tokenService.generateAuthTokens(user)

      res.cookie('refreshToken', tokens.refresh.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: tokens.refresh.expires,
        sameSite: 'strict',
        path: '/api/v1/auth/refresh-tokens', // Restrict refresh token to specific path
      })
      res.status(httpStatus.OK).send({
        status: 'succcess',
        data: {
          accessToken: tokens.access.token,
          user: exclude(user, ['secret', 'isEmailVerified', 'id']),
        },
      })
    } catch (error: any) {
      res
        .status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR)
        .send({status: 'error', message: error.message || 'An error occurred during login'})
    }
  })

const /**
   * Logout a user
   *
   * @param {*} req
   * @param {*} res
   */
  logout = catchAsync(async (req, res) => {
    try {
      if (!req.user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized')
      }
      const user = req.user as User
      await authService.logout(user.id)
      res.status(httpStatus.NO_CONTENT).send({status: 'success'})
    } catch (error: any) {
      res
        .status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR)
        .send({status: 'error', message: error.message || 'An error occurred during logout'})
    }
  })

const /**
   * Refresh tokens
   *
   * @param {*} req
   * @param {*} res
   */
  refreshTokens = catchAsync(async (req, res) => {
    try {
      const tokens = await authService.refreshAuth(req.body.refreshToken)
      res.cookie('refreshToken', tokens.refresh.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: tokens.refresh.expires,
        sameSite: 'strict',
        path: '/api/v1/auth/refresh-tokens', // Restrict refresh token to specific path
      })
      res.status(httpStatus.OK).send({status: 'success', data: {accessToken: tokens.access.token}})
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while refreshing tokens',
      })
    }
  })

const /**
   * Forgot password
   *
   * @param {*} req
   * @param {*} res
   */
  forgotPassword = catchAsync(async (req, res) => {
    try {
      const {email} = req.body
      const user_email = await authService.forgotPassword(email)
      res.status(httpStatus.OK).send({
        status: 'success',
        data: {
          user: {email: user_email},
        },
      })
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred during password reset request',
      })
    }
  })

const /**
   * Reset password
   *
   * @param {*} req
   * @param {*} res
   */
  resetPassword = catchAsync(async (req, res) => {
    try {
      const {token, password} = req.body
      await authService.resetPassword(token, password)
      res.status(httpStatus.NO_CONTENT).send({status: 'success'})
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while resetting password',
      })
    }
  })
const /**
   * Send verification email
   *
   * @param {*} req
   * @param {*} res
   */
  sendVerificationEmail = catchAsync(async (req, res) => {
    try {
      const {email, token} = req.body
      const user_email = await authService.sendVerificationEmail(email, token)
      res.status(httpStatus.OK).send({
        status: 'success',
        data: {
          user: {email: user_email},
        },
      })
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while sending verification email',
      })
    }
  })
const /**
   * Verify email
   *
   * @param {*} req
   * @param {*} res
   */
  verifyEmail = catchAsync(async (req, res) => {
    try {
      const {email, token, inviteToken} = req.body
      await authService.verifyEmail(email, token, inviteToken)
      res.status(httpStatus.NO_CONTENT).send({status: 'success'})
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred during email verification',
      })
    }
  })

const /**
   * Resend code
   *
   * @param {*} req
   * @param {*} res
   */
  resendCode = catchAsync(async (req, res) => {
    try {
      const {email, type} = req.body
      await authService.resendCode(email, type)
      res.status(httpStatus.NO_CONTENT).send({status: 'success'})
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while resending code',
      })
    }
  })

const /**
   * Get session
   *
   * @param {*} req
   * @param {*} res
   */
  getSession = catchAsync(async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')
      if (token) {
        const decoded = await tokenService.verifyToken(token, TokenType.ACCESS)
        if (decoded.userId) {
          const user = await userService.getUserById(
            [decoded.userId],
            ['email', 'name', 'role', 'avatarUrl']
          )
          res.status(httpStatus.OK).send({status: 'success', user: {user}})
        } else {
          throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
        }
      } else {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'No token provided')
      }
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while getting session',
      })
    }
  })

export default {
  registerUser,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  resendCode,
  getSession,
}
