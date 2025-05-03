import express from 'express'
import helmet from 'helmet'
import compression from 'compression'
import cors from 'cors'
import passport from 'passport'
import httpStatus from 'http-status'
import config from '@/config/env.config'
import morgan from '@/config/morgan.config'
import {jwtStrategy} from '@/config'
import xss from '@/middlewares/xss'
import {authLimiter} from '@/middlewares/rateLimiter'
import {errorConverter, errorHandler} from '@/middlewares/error'
import ApiError from '@/utils/apiError'
import routes from '@/route'

const app = express()

if (config.env !== 'test') {
  app.use(morgan.successHandler)
  app.use(morgan.errorHandler)
}

app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(xss())
app.use(compression())

// enable cors
app.use(cors())
app.options('*', cors())

// jwt authentication
app.use(passport.initialize())
passport.use('jwt', jwtStrategy)

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter)
}

// v1 api routes
app.use('/api/v1', routes)

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'))
})

app.use(errorConverter)
app.use(errorHandler)

export default app
