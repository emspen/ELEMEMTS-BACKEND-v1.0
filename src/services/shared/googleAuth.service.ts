import qs from 'querystring'
import {envConfig} from '@/config'
import userService from '@/services/shared/user.service'
import axios from 'axios'

import {generateTotp} from '@/utils/totp.utils'
import authService from '@/services/shared/auth.service'
import ApiError from '@/utils/apiError.utils'
import httpStatus from 'http-status'

interface GoogleTokenResponse {
  accessToken: string
  expiresIn: number
  refreshToken?: string
  scope: string
  tokenType: string
  idToken?: string
}

// Define expected structure of user data
interface GoogleUserResponse {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name?: string
  family_name?: string
  picture: string
  locale?: string
}

export const googleAuthHandler = async (code: string, inviteToken?: string) => {
  const GOOGLE_CLIENT_ID = envConfig.google.clientId
  const GOOGLE_CLIENT_SECRET = envConfig.google.clientSecret
  const GOOGLE_REDIRECT_URI = envConfig.google.redirectUri

  console.log('💥:', GOOGLE_REDIRECT_URI)

  if (!code) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Code not found')
  }

  try {
    // Step 1: Exchange authorization code for access token
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      qs.stringify({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
      {
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      }
    )
    const tokenData = tokenResponse.data as GoogleTokenResponse
    console.log('🚀 tokenData from google : ', tokenData)
    if (!tokenData.accessToken) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Access Token from google not found')
    }

    // Step 2: Fetch user info from Google
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {Authorization: `Bearer ${tokenData.accessToken}`},
    })

    const userData = userResponse.data as GoogleUserResponse

    if (!userData.email) {
      throw new ApiError(httpStatus.NOT_FOUND, 'No User Data Fetched')
    }
    console.log('😂 userData : ', userData)
    // Step 3: Check if user exists
    const existingUser = await userService.getUserByEmail(userData.email)

    let user
    if (existingUser) {
      user = existingUser
    } else {
      user = await userService.createUser(
        userData.email,
        userData.name,
        'googlePassword',
        userData.id,
        userData.verified_email
      )
    }

    // Step 4: Authenticate user and create a session
    const loggedInUser = await authService.loginUserWithEmailAndPassword(
      user.email,
      user.password ?? 'googlePassword',
      user.googleId || undefined
    )

    return loggedInUser

    throw new ApiError(httpStatus.BAD_REQUEST, 'Authentication Failed')
  } catch (error) {
    console.error('OAuth error:', error)
    throw new ApiError(httpStatus.BAD_REQUEST, 'Authentication Failed')
  }
}
