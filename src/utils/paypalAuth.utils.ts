import {envConfig} from '@/config'
import axios from 'axios'

const paypalAuth = async () => {
  const basicAuth = Buffer.from(
    `${envConfig.paypal.clientId}:${envConfig.paypal.clientSecret}`
  ).toString('base64')

  const response = await axios.post(
    'https://api-m.sandbox.paypal.com/v1/oauth2/token',
    new URLSearchParams({grant_type: 'client_credentials'}),
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )
  if (response.status !== 200) {
    throw new Error('Failed to authenticate with PayPal')
  }
  return response.data.access_token
}
export default paypalAuth
