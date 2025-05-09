import express from 'express'
import auth from '@/middlewares/auth'
import validate from '@/middlewares/validate'
import authValidation from '@/validations/auth.validation'
import authController from '@/controllers/auth.controller'
import googleAuthController from '@/controllers/googleAuth.controller'
const router = express.Router()

router.post('/register', validate(authValidation.register), authController.registerUser)
router.post('/login', validate(authValidation.login), authController.login)
router.post('/logout', authController.logout)
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens)
router.post(
  '/forgot-password',
  validate(authValidation.forgotPassword),
  authController.forgotPassword
)
router.post('/verify-email', validate(authValidation.verifyEmail), authController.verifyEmail)
router.post('/reset-password', validate(authValidation.resetPassword), authController.resetPassword)
router.post('/resend-code', validate(authValidation.resendCode), authController.resendCode)
router.post(
  '/send-verification-email',
  validate(authValidation.sendVerificationEmail),
  authController.sendVerificationEmail
)
router.post('/google-auth', googleAuthController.registerOrLogin)

export default router
