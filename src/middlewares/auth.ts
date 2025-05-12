import {NextFunction, Request, Response} from 'express'
import passport from 'passport'
import httpStatus from 'http-status'
import {User} from '@prisma/client'
import ApiError from '@/utils/apiError.utils'
import jwt from 'jsonwebtoken'
import config from '@/config/env.config'
import prisma from '@/prisma/client'
import tokenService from '@/services/shared/token.service'
import {VerifyToken} from '@/types/response'

// const verifyCallback =
//   (req: any, resolve: (value?: unknown) => void, reject: (reason?: unknown) => void) =>
//   async (err: unknown, user: User | false, info: unknown) => {
//     if (err || info || !user) {
//       return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'))
//     }
//     req.user = user
//     resolve()
//   }

const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate')
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify the token
    const payload = await tokenService.verifyToken(token, 'ACCESS')
    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: {id: payload.userId, isSuspended: false},
    })

    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found')
    }
    // Attach the user to the request
    req.user = user
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token'))
    } else {
      next(error)
    }
  }
}

const userRole = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as User
  if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found')

  try {
    if (user.role !== 'INDIVIDUAL' && user.role !== 'TEAM')
      next(new ApiError(httpStatus.UNAUTHORIZED, 'User not authorized'))
    else {
      next()
    }
  } catch (error) {
    next(error)
  }
}

export default {auth, userRole}
