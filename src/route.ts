import express from 'express'
import {envConfig} from '@/config'
import adminRoute from '@/routes/admin'
import clientRoute from '@/routes/client'
import authRoute from '@/routes/auth.route'

const router = express.Router()

const defaultRoutes = [
  {
    path: '/admin',
    route: adminRoute,
  },
  // {
  //   path: '/client',
  //   route: clientRoute,
  // },
  {
    path: '/auth',
    route: authRoute,
  },
]

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route)
})

export default router
