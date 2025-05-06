import express from 'express'
import userRoute from './admin.user.route'

const router = express.Router()
const defaultRoutes = [
  {
    path: '/user',
    route: userRoute,
  },
]

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route)
})

export default router
