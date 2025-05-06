import Joi from 'joi'
import {password} from '@/validations/shared/custom.validation'
import {Role} from '@prisma/client'

const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
  }),
}

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
}

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string(),
  }),
}

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.string(),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      name: Joi.string(),
      username: Joi.string(),
      role: Joi.string().valid(...Object.values(Role)),
    })
    .min(1),
}

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string(),
  }),
}

export default {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
}
