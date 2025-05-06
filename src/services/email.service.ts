import nodemailer from 'nodemailer'
import {envConfig} from '@/config'
import {logger} from '@/config'
import ApiError from '@/utils/apiError'
import httpStatus from 'http-status'

const transport = nodemailer.createTransport(envConfig.email.smtp)
/* istanbul ignore next */
if (envConfig.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() =>
      logger.warn(
        'Unable to connect to email server. Make sure you have configured the SMTP options in .env'
      )
    )
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    console.log('💥:', to)
    const msg = {from: envConfig.email.from, to, subject, text}
    await transport.sendMail(msg)
    logger.info(`Email sent successfully to ${to}`)
  } catch (error: any) {
    logger.error(`Failed to send email to ${to}: ${error.message}`)
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to send email: ${error.message}`)
  }
}
/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to: string, token: string) => {
  try {
    const subject = 'Reset password'
    // replace this url with the link to the reset password page of your front-end app
    const resetPasswordUrl = envConfig.resetPasswordUrl + `/${token}`
    const text = `Dear user,
    To reset your password, click on this link: ${resetPasswordUrl}
    If you did not request any password resets, then ignore this email.`
    await sendEmail(to, subject, text)
    logger.info(`Reset password email sent successfully to ${to}`)
    return token
  } catch (error: any) {
    logger.error(`Failed to send reset password email to ${to}: ${error.message}`)
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to send reset password email: ${error.message}`
    )
  }
}
/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise<void>}
 */
const sendVerificationEmail = async (to: string, token: string): Promise<void> => {
  try {
    const subject = 'Email Verification'
    // replace this url with the link to the email verification page of your front-end app
    const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`
    const text = `Dear user,
    To verify your email verification code: ${token}`
    await sendEmail(to, subject, text)
    logger.info(`Verification email sent successfully to ${to}`)
  } catch (error: any) {
    logger.error(`Failed to send verification email to ${to}: ${error.message}`)
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to send verification email: ${error.message}`
    )
  }
}
/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise<void>}
 */
const sendVerificationCode = async (to: string, token: string): Promise<void> => {
  try {
    const subject = 'Code Verification'
    // replace this url with the link to the email verification page of your front-end app
    const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`
    const text = `Dear user,
    To verify your email verification code: ${token}`
    await sendEmail(to, subject, text)
    logger.info(`Verification code sent successfully to ${to}`)
  } catch (error: any) {
    logger.error(`Failed to send verification code to ${to}: ${error.message}`)
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to send verification code: ${error.message}`
    )
  }
}

/**
 * Send team invitation email
 * @param {string} to
 * @param {string} token
 * @returns {Promise<void>}
 */
const sendTeamInvitationEmail = async (from: string, to: string, token: string): Promise<void> => {
  try {
    const subject = 'Team Invitation'
    const text = `Dear user,
    To join the team ${from}, click on this link: ${envConfig.teamInvitation.url}?token=${token}`
    await sendEmail(to, subject, text)
    logger.info(`Team invitation email sent successfully to ${to}`)
  } catch (error: any) {
    logger.error(`Failed to send team invitation email to ${to}: ${error.message}`)
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to send team invitation email: ${error.message}`
    )
  }
}

export default {
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendVerificationCode,
  sendTeamInvitationEmail,
}
