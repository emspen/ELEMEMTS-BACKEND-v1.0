import Joi from 'joi'
import {password} from '@/validations/shared/custom.validation'

enum CodeType {
  'email-verification',
  'forgot-password',
}

const register = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    inviteToken: Joi.string(),
  }),
}

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
    inviteToken: Joi.string(),
  }),
}
const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
}

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
}

const resetPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    token: Joi.string().required(),
    password: Joi.string().required().custom(password),
  }),
}

const verifyEmail = {
  body: Joi.object().keys({
    token: Joi.string().required(),
    email: Joi.string().email().required(),
    inviteToken: Joi.string(),
  }),
}
const sendVerificationEmail = {
  body: Joi.object().keys({
    token: Joi.string().required(),
    email: Joi.string().email().required(),
  }),
}

const resendCode = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    type: Joi.string().valid(...Object.values(CodeType)),
  }),
}

export default {
  register,
  login,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail,
  sendVerificationEmail,
  resendCode,
}
