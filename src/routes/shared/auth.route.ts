import express from 'express'
import auth from '@/middlewares/auth'
import validate from '@/middlewares/validate'
import authValidation from '@/validations/shared/auth.validation'
import authController from '@/controllers/shared/auth.controller'
import googleAuthController from '@/controllers/shared/googleAuth.controller'
const router = express.Router()

router.post('/register', validate(authValidation.register), authController.registerUser)
router.post('/login', validate(authValidation.login), authController.login)
router.patch('/logout', auth.auth, authController.logout)
router.get('/refresh-tokens', authController.refreshTokens)
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
router.get('/me', auth.auth, authController.getSession)
export default router
