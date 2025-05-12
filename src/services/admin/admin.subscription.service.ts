import httpStatus from 'http-status'
import paypal from '@paypal/checkout-server-sdk'
import axios, {AxiosError} from 'axios'

import prisma from '@/prisma/client'
import ApiError from '@/utils/apiError.utils'
import {envConfig, logger} from '@/config'
import {client} from '@/config/paypal.config'
import {PlanCreate, SubscriptionCreate} from '@/types/subscripiton.plan.types'
import paypalAuth from '@/utils/paypalAuth.utils'
import {get} from 'http'

const createSubscription = async (request: SubscriptionCreate) => {
  try {
    const accessToken = await paypalAuth()

    const requestData = {
      plan_id: request.plan_id,
      start_time: new Date(),
      subscriber: request.subscriber,
      application_context: request.application_context,
    }
    const response = await axios.post(
      `${envConfig.paypal.baseUrl}/billing/subscriptions`,
      requestData,
      {headers: {Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json'}}
    )
    return response.data
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error(error.response?.data)
      throw error
    }
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'An error occurred while creating subscription'
    )
  }
}

const getSubscriptionById = async (id: string) => {
  try {
    if (!id) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Subscription ID is required')
    }
    const accessToken = await paypalAuth()
    const subscription = await axios.get(
      `${envConfig.paypal.baseUrl}/billing/subscriptions/${id}`,
      {
        headers: {Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json'},
      }
    )
  } catch (error) {
    if (error instanceof AxiosError) {
      logger.error(error.response?.data)
      throw error
    }
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'An error occurred while creating subscription'
    )
  }
}

export default {
  createSubscription,
  getSubscriptionById,
}
