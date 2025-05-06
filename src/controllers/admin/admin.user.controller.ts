import httpStatus from 'http-status'

import catchAsync from '@/utils/catchAsync'
import userService from '@/services/shared/user.service'

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
      const users = await userService.queryUsers(filters, {limit, page, sortBy, sortType}, keys)
      res.status(httpStatus.OK).send({status: 'success', data: {user: users}})
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
      const users = await userService.updateUserById(ids, {isSuspended: true})
      res.status(httpStatus.NO_CONTENT).send({status: 'success', data: {}})
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while suspending users',
      })
    }
  })

export default {
  getUsers,
  suspendUsers,
}
