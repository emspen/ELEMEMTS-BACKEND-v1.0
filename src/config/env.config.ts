import dotenv from 'dotenv'
import path from 'path'
import Joi from 'joi'

dotenv.config({path: path.join(process.cwd(), '.env')})

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(8000),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number()
      .default(30)
      .description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number()
      .default(30)
      .description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which verify email token expires'),
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
    RESET_PASSWORD_URL: Joi.string().description('url to redirect user to reset password'),
    PAYPAL_CLIENT_ID: Joi.string().description('PayPal client ID'),
    PAYPAL_CLIENT_SECRET: Joi.string().description('PayPal client secret'),
    PAYPAL_BASE_URL: Joi.string().description('PayPal base URL'),
    PAYPAL_SUCCESS_URL: Joi.string().description('PayPal success URL'),
    PAYPAL_CANCEL_URL: Joi.string().description('PayPal cancel URL'),
    GOOGLE_CLIENT_ID: Joi.string().description('Google client ID'),
    GOOGLE_CLIENT_SECRET: Joi.string().description('Google Client Secret'),
    GOOGLE_REDIRECT_URI: Joi.string().description('Google Redirect URI'),
    TEAM_INVITATION_EXPIRATION_HOURS: Joi.number()
      .default(24)
      .description('Hours after which team invitation token expires'),
    TEAM_INVITATION_URL: Joi.string().description('Invitation redirect url'),
  })
  .unknown()

const {value: envVars, error} = envVarsSchema.prefs({errors: {label: 'key'}}).validate(process.env)

if (error) {
  throw new Error(`Config validation error: ${error.message}`)
}

const envConfig = {
  env: envVars.NODE_ENV,
  host: envVars.HOST,
  port: envVars.PORT,
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  },
  teamInvitation: {
    expirationHours: envVars.TEAM_INVITATION_EXPIRATION_HOURS,
    url: envVars.TEAM_INVITATION_URL,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },
  google: {
    client_id: envVars.GOOGLE_CLIENT_ID,
    client_secret: envVars.GOOGLE_CLIENT_SECRET,
    redirect_uri: envVars.GOOGLE_REDIRECT_URI,
  },
  paypal: {
    clientId: envVars.PAYPAL_CLIENT_ID,
    clientSecret: envVars.PAYPAL_CLIENT_SECRET,
    baseUrl: envVars.PAYPAL_BASE_URL,
    successUrl: envVars.PAYPAL_SUCCESS_URL,
    cancelUrl: envVars.PAYPAL_CANCEL_URL,
  },
  resetPasswordUrl: envVars.RESET_PASSWORD_URL,
}

export default envConfig
