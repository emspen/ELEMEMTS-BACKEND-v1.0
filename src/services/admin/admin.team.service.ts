import prisma from '@/prisma/client'
import httpStatus from 'http-status'

import ApiError from '@/utils/apiError.utils'
import {envConfig} from '@/config'
import {http} from 'winston'
import {Team} from '@prisma/client'

const /**
   * Get Teams
   *
   * @param {*} filters
   * @param {*} options
   * @param {*} keys
   * @returns
   */
  getTeams = async <Key extends keyof Team>(
    filter: Record<string, any>,
    options: {
      limit?: number
      page?: number
      sortBy?: string
      sortType?: 'asc' | 'desc'
    },
    keys: Key[] = ['id', 'name', 'teamSize', 'ownerId', 'createdAt'] as Key[]
  ) => {
    try {
      const {limit = 10, page = 1, sortBy = 'createdAt', sortType = 'desc'} = options
      console.log('filter', filter)
      // Process date filters if they exist
      const where: Record<string, any> = {...filter}

      // Handle createdAt date filter
      if (where.createdAt) {
        // Handle the case where createdAt is an object with operators like gte
        if (typeof where.createdAt === 'object') {
          // Convert date strings to proper ISO format for each operator
          Object.keys(where.createdAt).forEach((operator) => {
            const dateStr = where.createdAt[operator]
            if (typeof dateStr === 'string' && !dateStr.includes('T')) {
              where.createdAt[operator] = `${dateStr}T00:00:00.000Z`
            }
          })
        }
      }

      // Handle updatedAt date filter
      if (where.updatedAt) {
        // Handle the case where updatedAt is an object with operators like gte
        if (typeof where.updatedAt === 'object') {
          // Convert date strings to proper ISO format for each operator
          Object.keys(where.updatedAt).forEach((operator) => {
            const dateStr = where.updatedAt[operator]
            if (typeof dateStr === 'string' && !dateStr.includes('T')) {
              where.updatedAt[operator] = `${dateStr}T00:00:00.000Z`
            }
          })
        }
      }
      const [total, teams] = await Promise.all([
        prisma.team.count({where}),
        prisma.team.findMany({
          where,
          select: {
            ...keys.reduce((obj, k) => ({...obj, [k]: true}), {}),
            owner: true,
            TeamInvitation: true,
            members: true,
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {[sortBy]: sortType},
        }),
      ])
      return [teams, total]
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'An error occurred while fetching teams')
    }
  }

export default {
  getTeams,
}
