import ApiError from '@/utils/apiError.utils'
import {User} from '@prisma/client'
import {Request, Response, NextFunction} from 'express'
import httpStatus from 'http-status'

// Mock admin check (replace with actual role-based check)
const adminRole = (req: Request, res: Response, next: NextFunction) => {
  // Assume req.user contains role information
  try {
    if (!req.user) throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate')
    const user = req.user as User
    if (user.role !== 'ADMIN') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Admin role required')
    }
    next()
  } catch (error) {
    if (error) {
      next(error)
    } else {
      next(new ApiError(httpStatus.BAD_REQUEST, 'Something went wrong'))
    }
  }
}

export default {adminRole}
