import httpStatus from 'http-status'

import catchAsync from '@/utils/catchAsync'
import userService from '@/services/user.service'

const getUsers = catchAsync(async (req, res) => {
  const {filters, options, keys} = req.body
  const {limit, page, sortBy, sortType} = options
  const users = await userService.queryUsers(filters, {limit, page, sortBy, sortType}, keys)
  res.status(httpStatus.OK).send(users)
})

const suspendUsers = catchAsync(async (req, res) => {
  const {ids}: {ids: Array<string>} = req.body
  const users = await userService.updateUserById(ids, {isSuspended: true})
  res.status(httpStatus.NO_CONTENT).send()
})

export default {
  getUsers,
  suspendUsers,
}
