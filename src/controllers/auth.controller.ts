import httpStatus from 'http-status'
import exclude from '@/utils/exclude'
import catchAsync from '@/utils/catchAsync'
import ApiError from '@/utils/apiError'
import {encryptPassword} from '@/utils/encryption'
import {generateTotp, verifyTotp, regenerateTotp} from '@/utils/totp'

import authService from '@/services/auth.service'
import userService from '@/services/user.service'
import tokenService from '@/services/token.service'
import emailService from '@/services/email.service'

import {TokenType} from '@prisma/client'
import {PrismaClient} from '@prisma/client'

const prisma = new PrismaClient()

const registerUser = catchAsync(async (req, res) => {
  const {name, email, password} = req.body
  const user = await authService.register(name, email, password)
  res.status(httpStatus.CREATED).send({
    email: user.email,
    name: user.name,
    message: 'Registration successful',
  })
})

const login = catchAsync(async (req, res) => {
  const {email, password} = req.body
  const user = await authService.loginUserWithEmailAndPassword(email, password)
  if (!user.is_email_verified) {
    const {token} = regenerateTotp(user.secret as string)
    await emailService.sendVerificationEmail(email, token)
    console.log('❤️ Email Verification Code: ', token)
    throw new ApiError(httpStatus.FORBIDDEN, 'Please verify your email first')
  }

  const tokens = await tokenService.generateAuthTokens(user)
  res.send({user: exclude(user, ['secret']), tokens})
})

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.cookies.refreshToken)
  res.status(httpStatus.NO_CONTENT).send()
})

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken)
  res.send(tokens)
})

const forgotPassword = catchAsync(async (req, res) => {
  console.log(req.body)
  const user = await userService.getUserByEmail(req.body.email)
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
  }
  const {token} = regenerateTotp(user.secret as string)
  await emailService.sendVerificationEmail(req.body.email, token)
  console.log('❤️ Reset Password Code: ', token)
  res.status(httpStatus.OK).send({email: req.body.email})
})

const resetPassword = catchAsync(async (req, res) => {
  const {email, token, password} = req.body
  const user = await userService.getUserByEmail(email)

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
  }

  const tokenDoc = await tokenService.verifyToken(token, TokenType.RESET_PASSWORD)
  if (tokenDoc && tokenDoc.user_id === user.id) {
    const encryptedPassword = await encryptPassword(password)
    await userService.updateUserById(user.id, {password: encryptedPassword})
    res.status(httpStatus.NO_CONTENT).send()
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid reset token')
  }
})

const sendVerificationEmail = catchAsync(async (req, res) => {
  const {email, token} = req.body
  const user = await userService.getUserByEmail(email)

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
  }

  if (verifyTotp(token, user.secret)) {
    const resetToken = await tokenService.generateResetPasswordToken(email)
    console.log('❤️ Reset Password Token: ', resetToken)
    res.status(httpStatus.OK).send({email: email, token: resetToken})
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid verification code')
  }
})

const verifyEmail = catchAsync(async (req, res) => {
  const {email, token, inviteToken} = req.body
  const user = await userService.getUserByEmail(email)

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
  }

  if (user.is_email_verified) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already verified')
  }

  if (verifyTotp(token, user.secret)) {
    await userService.updateUserById(user.id, {is_email_verified: true})
    const tokens = await tokenService.generateAuthTokens(user)

    res.send({user: exclude(user, ['password', 'secret']), tokens})
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid verification code')
  }
})

const resendCode = catchAsync(async (req, res) => {
  const {email, type} = req.body
  const user = await userService.getUserByEmail(email)

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
  }
  const {token} = regenerateTotp(user.secret as string)
  if (type === 'email-verification') {
    if (!user.is_email_verified) {
      await emailService.sendVerificationEmail(email, token)
      console.log('❤️ Email Verification Code: ', token)
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already verified')
    }
  } else if (type === 'forgot-password') {
    await emailService.sendResetPasswordEmail(email, token)
    console.log('❤️ Reset Password Code: ', token)
  }

  res.status(httpStatus.NO_CONTENT).send()
})

const getSession = catchAsync(async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (token) {
    const decoded = await tokenService.verifyToken(token, TokenType.ACCESS)
    if (decoded.user_id) {
      const user = await userService.getUserById(decoded.user_id)
      res.send({user})
    } else {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
    }
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
