import express from 'express'
import userRoute from './client.user.route'
import teamRoute from './client.team.route'

const router = express.Router()
const defaultRoutes = [
  {
    path: '/user',
    route: userRoute,
  },
  {
    path: '/team',
    route: teamRoute,
  },
]

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route)
})

export default router
