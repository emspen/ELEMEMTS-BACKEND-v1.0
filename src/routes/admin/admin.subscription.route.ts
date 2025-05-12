import express from 'express'
import subscriptionController from '@/controllers/admin/admin.subscription.controller'

import auth from '@/middlewares/auth'
import adminRole from '@/middlewares/adminRole'

const router = express.Router()
router.post('/', auth.auth, adminRole.adminRole, subscriptionController.createSubscription)
router.get('/:id', auth.auth, adminRole.adminRole, subscriptionController.getSubscriptionById)
export default router
