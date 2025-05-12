import httpStatus from 'http-status'

import catchAsync from '@/utils/catchAsync.utils'
import teamService from '@/services/admin/admin.team.service'
import pick from '@/utils/pick.utils'
import ApiError from '@/utils/apiError.utils'

const /**
   * Get teams
   *
   * @param {*} req
   * @param {*} res
   */
  getTeams = catchAsync(async (req, res) => {
    try {
      const {filters, options, keys} = req.body
      const {limit, page, sortBy, sortType} = options
      const [teams, total] = await teamService.getTeams(
        filters,
        {limit, page, sortBy, sortType},
        keys
      )
      res.status(httpStatus.OK).send({status: 'success', data: {teams: teams, total: total}})
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while fetching teams',
      })
    }
  })

export default {
  getTeams,
}
