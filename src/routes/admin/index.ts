import express from 'express'
import userRoute from './admin.user.route'
import teamRoute from './admin.team.route'
import productRoute from './admin.product.route'
import categoryRoute from './admin.category.route'
import planRoute from './admin.plan.route'
import subscriptionRoute from './admin.subscription.route'

const router = express.Router()
const defaultRoutes = [
  {
    path: '/user',
    route: userRoute,
  },
  {
    path: '/teams',
    route: teamRoute,
  },
  {
    path: '/plan',
    route: planRoute,
  },
  {
    path: '/subscription',
    route: subscriptionRoute,
  },
  {
    path: '/product',
    route: productRoute,
  },
  {
    path: '/category',
    route: categoryRoute,
  },
]

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route)
})

export default router
