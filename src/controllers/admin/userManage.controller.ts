import httpStatus from 'http-status'

import exclude from '@/utils/exclude'
import catchAsync from '@/utils/catchAsync'
import ApiError from '@/utils/apiError'
import userService from '@/services/user.service'

const getUsers = catchAsync(async (req, res) => {
  const {filters, options, keys} = req.body
  const {limit, page, sortBy, sortType} = options
  const users = await userService.queryUsers(filters, {limit, page, sortBy, sortType}, keys)
  res.status(httpStatus.OK).send(users)
})

export default {
  getUsers,
}
