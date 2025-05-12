import httpStatus from 'http-status'
import axios, {AxiosError} from 'axios'

import ApiError from '@/utils/apiError.utils'
import {envConfig, logger} from '@/config'
import {PlanCreate} from '@/types/subscripiton.plan.types'
import paypalAuth from '@/utils/paypalAuth.utils'

const createService = async () => {
  const accessToken = await paypalAuth()
  const serviceData = {
    name: 'Elememts',
    description: 'Digital Assets Download Service',
    type: 'DIGITAL',
    category: 'DIGITAL_MEDIA_BOOKS_MOVIES_MUSIC',
    image_url:
      'https://store.webkul.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/w/e/webkul_website_payment_paypal_recurring_ss-6.png',
    home_url: 'https://6665-154-9-205-81.ngrok-free.app',
  }
  try {
    const response = await axios.post(
      `${envConfig.paypal.baseUrl}/catalogs/products`,
      serviceData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )
    return response.data.id
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error(`Error creating service: , ${error.message}.`)
      throw new ApiError(httpStatus.BAD_REQUEST, 'Error creating service')
    } else {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Erroroccured while creating service')
    }
  }
}

const createPlan = async (product_id: string, planData: PlanCreate) => {
  const requestData = {
    product_id: product_id,
    name: planData.name,
    description: planData.description,
    status: 'ACTIVE',
    billing_cycles: planData.billing_cycles.map((cycle, index) => {
      return {
        frequency: {
          interval_unit: cycle.interval_unit,
          interval_count: cycle.interval_count,
        },
        tenure_type: cycle.tenure_type,
        sequence: index + 1,
        total_cycles: cycle.total_cycles,
        pricing_scheme: {
          fixed_price: {
            value: cycle.value,
            currency_code: cycle.currency_code,
          },
        },
      }
    }),
    payment_preferences: {
      auto_bill_outstanding: planData.payment_preferences.auto_bill_outstanding,
      payment_failure_threshold: planData.payment_preferences.payment_failure_threshold,
    },
  }
  console.log(requestData)
  try {
    const accessToken = await paypalAuth()
    console.log('🐢 Paypal auth', accessToken)
    const request = await axios.post(`${envConfig.paypal.baseUrl}/billing/plans`, requestData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    console.log('🐢 Paypal create paln', request)
    if (!request) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Paypal create plan failed')
    console.log('🐢 Paypal create paln', request)
  } catch (error) {
    if (error instanceof ApiError) throw error
    else throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Paypal create plan failed')
  }
}

const getAllPlans = async (
  product_id: string,
  options: {
    limit?: number
    page?: number
    sortBy?: string
    sortType?: 'asc' | 'desc'
  },
  filters: Array<{option: string; value: unknown}>
) => {
  try {
    const {limit = 10, page = 1, sortBy = 'createdAt', sortType = 'desc'} = options
    const accessToken = await paypalAuth()
    const response = await axios.get(`${envConfig.paypal.baseUrl}/billing/plans`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      params: {
        product_id,
        page,
        page_size: limit,
        total_required: true,
      },
    })
    console.log('🐢 Paypal get all plans', response)
    return response.data
  } catch (error) {
    logger.error('Error querying users:', error)
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to query users')
  }
}

const getPlanById = async (planId: string) => {
  try {
    const accessToken = await paypalAuth()
    const response = await axios.get(`${envConfig.paypal.baseUrl}/billing/plans/${planId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    console.log('🐢 Paypal get plan by id', response)
    return response.data
  } catch (error) {
    logger.error('Error querying users:', error)
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to query users')
  }
}

export default {
  createPlan,
  getAllPlans,
  createService,
  getPlanById,
}
