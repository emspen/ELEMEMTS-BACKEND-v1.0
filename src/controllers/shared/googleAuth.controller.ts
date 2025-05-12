import httpStatus from 'http-status'
import {PrismaClient} from '@prisma/client'
import {googleAuthHandler} from '@/services/shared/googleAuth.service'
import tokenService from '@/services/shared/token.service'
import catchAsync from '@/utils/catchAsync.utils'

const prisma = new PrismaClient()

const registerOrLogin = catchAsync(async (req, res) => {
  try {
    const {code, inviteToken} = req.body
    const user = await googleAuthHandler(code, inviteToken)

    if (inviteToken) {
      res.cookie('inviteToken', inviteToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      })
    }

    const tokens = await tokenService.generateAuthTokens(user)
    const userData = encodeURIComponent(JSON.stringify(user))

    res.cookie('refreshToken', tokens.refresh.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: tokens.refresh.expires,
      sameSite: 'strict',
      path: '/api/v1/auth/refresh-tokens', // Restrict refresh token to specific path
    })

    res
      .status(httpStatus.OK)
      .send({status: 'success', data: {user: userData, accessToken: tokens.access.token}})
  } catch (error: any) {
    res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
      status: 'error',
      message: error.message || 'An error occurred during Google authentication',
    })
  }
})
export default {registerOrLogin}
