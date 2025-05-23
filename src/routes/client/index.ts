import express from 'express'
import userRoute from './user.route'
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
