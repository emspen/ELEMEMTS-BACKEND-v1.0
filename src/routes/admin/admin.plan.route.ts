import express from 'express'
import adminSubscriptionController from '@/controllers/admin/admin.plan.controller'
import auth from '@/middlewares/auth'
import adminRole from '@/middlewares/adminRole'
import adminPlanController from '@/controllers/admin/admin.plan.controller'

const router = express.Router()
router.post('/service', auth.auth, adminRole.adminRole, adminSubscriptionController.createService)
router.post('/:product_id/', auth.auth, adminRole.adminRole, adminSubscriptionController.createPlan)
router.post('/:product_id/plan', auth.auth, adminRole.adminRole, adminPlanController.getAllPlans)
router.get(
  '/:product_id/plan/:plan_id',
  auth.auth,
  adminRole.adminRole,
  adminPlanController.getPlanDetails
)
export default router
