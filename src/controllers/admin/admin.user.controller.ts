import httpStatus from 'http-status'

import catchAsync from '@/utils/catchAsync.utils'
import userService from '@/services/shared/user.service'
import pick from '@/utils/pick.utils'
import {User} from '@prisma/client'
import ApiError from '@/utils/apiError.utils'

const /**
   * Get users
   *
   * @param {*} req
   * @param {*} res
   */
  getUsers = catchAsync(async (req, res) => {
    try {
      const {filters, options, keys} = req.body
      const {limit, page, sortBy, sortType} = options
      const [users, total] = await userService.queryUsers(
        filters,
        {limit, page, sortBy, sortType},
        keys
      )
      res.status(httpStatus.OK).send({status: 'success', data: {users: users, total: total}})
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while fetching users',
      })
    }
  })

const /**
   * Get user by id
   *
   * @param {*} req
   * @param {*} res
   */
  getUserById = catchAsync(async (req, res) => {
    try {
      const id = req.params.id
      if (!id || id === undefined) throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required')
      const keys = req.body.keys
      console.log('controller keys', keys)
      const user = await userService.getUserByIds([id], keys)
      res.status(httpStatus.OK).send({status: 'success', data: {user}})
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while fetching users',
      })
    }
  })

const /**
   * Suspend users
   *
   * @param {*} req
   * @param {*} res
   */
  suspendUsers = catchAsync(async (req, res) => {
    try {
      const {ids}: {ids: Array<string>} = req.body
      const users = await userService.updateUserById(ids, {isSuspended: true}, ['id'])
      res.status(httpStatus.NO_CONTENT).send({status: 'success', data: {}})
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while suspending users',
      })
    }
  })

const /**
   * Unsuspend users
   * @param {*} req
   * @param {*} res
   */
  activateUsers = catchAsync(async (req, res) => {
    try {
      const {ids}: {ids: Array<string>} = req.body
      const users = await userService.updateUserById(ids, {isSuspended: false})
      res.status(httpStatus.NO_CONTENT).send({status: 'success', data: {}})
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while unsuspending users',
      })
    }
  })

export default {
  getUsers,
  getUserById,
  suspendUsers,
  activateUsers,
}
