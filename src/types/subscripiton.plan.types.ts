export interface PlanCreate {
  name: string
  description: string
  interval_count: number
  currency_code: ['USD' | 'EUR']
  billing_cycles: [
    {
      interval_unit: ['MONTH' | 'YEAR']
      interval_count: number
      tenure_type: ['REGULAR' | 'TRIAL']
      total_cycles: number
      value: number
      currency_code: ['USD' | 'EUR']
      seat_size?: number
    },
  ]
  payment_preferences: {
    auto_bill_outstanding: boolean
    setup_fee?: {
      value: number
      currency_code: ['USD' | 'EUR']
    }
    setup_fee_failure_action?: ['CONTINUE' | 'CANCEL']
    payment_failure_threshold?: number
  }
  taxes?: {
    percentage: number
    inclusive: boolean
  }
}

export interface SubscriptionCreate {
  plan_id: string
  start_time: Date
  quantity: number
  subscriber: {
    name: {
      given_name: string
      surname: string
    }
    email_address: string
  }
  application_context: {
    brand_name: string
    shipping_preference: 'SET_PROVIDED_ADDRESS' | 'NO_SHIPPING' | 'GET_FROM_FILE'
    user_action: 'SUBSCRIBE_NOW' | 'CONTINUE'
  }
}
