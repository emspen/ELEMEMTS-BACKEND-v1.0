import httpStatus from 'http-status'

import exclude from '@/utils/exclude'
import ApiError from '@/utils/apiError'

import authService from '@/services/auth.service'
import userService from '@/services/user.service'
import tokenService from '@/services/token.service'

import {TokenType} from '@prisma/client'
import catchAsync from '@/utils/catchAsync'

const registerUser = catchAsync(async (req, res) => {
  try {
    const {name, email, password} = req.body
    const user = await authService.register(email, name, password)
    res.status(httpStatus.CREATED).send({
      email: user.email,
      name: user.name,
      message: 'Registration successful',
    })
  } catch (error: any) {
    res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
      message: error.message || 'An error occurred during registration',
    })
  }
})

const login = catchAsync(async (req, res) => {
  try {
    const {email, password} = req.body
    const user = await authService.login(email, password)
    const tokens = await tokenService.generateAuthTokens(user)
    res.cookie('accessToken', tokens.access.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: tokens.access.expires,
      sameSite: 'strict',
    })

    res.cookie('refreshToken', tokens.refresh.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: tokens.refresh.expires,
      sameSite: 'strict',
      path: '/api/v1/auth/refresh-tokens', // Restrict refresh token to specific path
    })
    res.status(httpStatus.OK).send(exclude(user, ['secret']))
  } catch (error: any) {
    res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
      message: error.message || 'An error occurred during login',
    })
  }
})

const logout = catchAsync(async (req, res) => {
  try {
    console.log(req.headers.cookie)
    const accessToken = req.headers.cookie as string
    await authService.logout(accessToken.replace('accessToken=', ''))
    res.status(httpStatus.NO_CONTENT).send()
  } catch (error: any) {
    res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
      message: error.message || 'An error occurred during logout',
    })
  }
})

const refreshTokens = catchAsync(async (req, res) => {
  try {
    const tokens = await authService.refreshAuth(req.body.refreshToken)
    res.cookie('token', tokens.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(tokens.expires),
      sameSite: 'strict',
    })
    res.status(httpStatus.NO_CONTENT).send()
  } catch (error: any) {
    res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
      message: error.message || 'An error occurred while refreshing tokens',
    })
  }
})

const forgotPassword = catchAsync(async (req, res) => {
  try {
    const {email} = req.body
    const user_email = await authService.forgotPassword(email)
    res.status(httpStatus.OK).send({email: user_email})
  } catch (error: any) {
    res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
      message: error.message || 'An error occurred during password reset request',
    })
  }
})

const resetPassword = catchAsync(async (req, res) => {
  try {
    const {token, password} = req.body
    await authService.resetPassword(token, password)
    res.status(httpStatus.NO_CONTENT).send()
  } catch (error: any) {
    res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
      message: error.message || 'An error occurred while resetting password',
    })
  }
})
const sendVerificationEmail = catchAsync(async (req, res) => {
  try {
    const {email, token} = req.body
    const user_email = await authService.sendVerificationEmail(email, token)
    res.status(httpStatus.OK).send({email: user_email})
  } catch (error: any) {
    res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
      message: error.message || 'An error occurred while sending verification email',
    })
  }
})
const verifyEmail = catchAsync(async (req, res) => {
  try {
    const {email, token, inviteToken} = req.body
    await authService.verifyEmail(email, token, inviteToken)
    res.status(httpStatus.NO_CONTENT).send()
  } catch (error: any) {
    res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
      message: error.message || 'An error occurred during email verification',
    })
  }
})

const resendCode = catchAsync(async (req, res) => {
  try {
    const {email, type} = req.body
    await authService.resendCode(email, type)
    res.status(httpStatus.NO_CONTENT).send()
  } catch (error: any) {
    res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
      message: error.message || 'An error occurred while resending code',
    })
  }
})

const getSession = catchAsync(async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      const decoded = await tokenService.verifyToken(token, TokenType.ACCESS)
      if (decoded.user_id) {
        const user = await userService.getUserById([decoded.user_id])
        res.status(httpStatus.OK).send({user})
      } else {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
      }
    } else {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'No token provided')
    }
  } catch (error: any) {
    res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
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
