import httpStatus from 'http-status'
import catchAsync from '@/utils/catchAsync'

import {PrismaClient} from '@prisma/client'
import googleAuthHandler from '@/services/googleAuth.service'
import tokenService from '@/services/token.service'

const prisma = new PrismaClient()

const registerOrLogin = catchAsync(async (req, res) => {
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

  res.status(httpStatus.CREATED).send({userData, tokens})
})

export default {registerOrLogin}
