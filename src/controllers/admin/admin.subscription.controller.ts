import httpStatus from 'http-status'
import catchAsync from '@/utils/catchAsync.utils'

import subscriptionService from '@/services/admin/admin.subscription.service'

const /**
   * Create subscription
   *
   * @param {*} req
   * @param {*} res
   */
  createSubscription = catchAsync(async (req, res) => {
    try {
      const subscriptionData = req.body
      const subscription = await subscriptionService.createSubscription(subscriptionData)
      res.status(httpStatus.CREATED).send({status: 'success', data: {subscription}})
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while creating subscription',
      })
    }
  })

const /**
   * Get subscription details by id
   *
   * @param {*} req
   * @param {*} res
   */
  getSubscriptionById = catchAsync(async (req, res) => {
    try {
      const id = req.params.id
      const subscription = await subscriptionService.getSubscriptionById(id)
      res.status(httpStatus.OK).send({status: 'success', data: {subscription}})
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while creating subscription',
      })
    }
  })

export default {
  createSubscription,
  getSubscriptionById,
}
