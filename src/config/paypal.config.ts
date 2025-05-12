import {core} from '@paypal/checkout-server-sdk'
import {envConfig} from '@/config'

export const client = new core.PayPalHttpClient(
  new core.SandboxEnvironment(envConfig.paypal.clientId, envConfig.paypal.clientSecret)
)
