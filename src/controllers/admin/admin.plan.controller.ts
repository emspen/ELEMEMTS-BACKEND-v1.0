import httpStatus from 'http-status'

import catchAsync from '@/utils/catchAsync.utils'
import planService from '@/services/admin/admin.plan.service'
import ApiError from '@/utils/apiError.utils'
import {get} from 'http'
import pick from '@/utils/pick.utils'

const /**
   * Create Service
   *
   * @param {*} req
   * @param {*} res
   */
  createService = catchAsync(async (req, res) => {
    try {
      const product_id = await planService.createService()
      res.status(httpStatus.CREATED).send({status: 'success', data: {product_id}})
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while creating Service',
      })
    }
  })

const /**
   * Create plan
   *
   * @param {*} req
   * @param {*} res
   */
  createPlan = catchAsync(async (req, res) => {
    try {
      const product_id = req.params.product_id
      const planData = req.body
      console.log('🐢 planData', planData)
      await planService.createPlan(product_id, planData)
      res.status(httpStatus.CREATED).send({status: 'success', data: {}})
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while creating plan',
      })
    }
  })

const /**
   * Get plan lists
   *
   * @param {*} req
   * @param {*} res
   */
  getAllPlans = catchAsync(async (req, res) => {
    try {
      console.log('🐢 req.query', req.params)
      const product_id = req.params.product_id as string
      if (!product_id) throw new ApiError(httpStatus.BAD_REQUEST, 'Product id is required')
      const {filters, options} = req.body
      const plans = await planService.getAllPlans(product_id, options, filters)
      res.status(httpStatus.OK).send({status: 'success', data: {plans}})
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while getting plan lists',
      })
    }
  })

const /**
   * Get plan details
   *
   * @param {*} req
   * @param {*} res
   */
  getPlanDetails = catchAsync(async (req, res) => {
    try {
      const planId = req.params.plan_id
      const plan = await planService.getPlanById(planId)
      res.status(httpStatus.OK).send({status: 'success', data: {plan}})
      console.log('🐢 plan', plan)
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
        status: 'error',
        message: error.message || 'An error occurred while getting plan details',
      })
    }
  })

export default {
  createPlan,
  getAllPlans,
  getPlanDetails,
  createService,
}
