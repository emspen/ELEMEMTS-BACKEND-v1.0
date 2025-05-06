import express from 'express'
import teamController from '@/controllers/client/client.team.controller'
import auth from '@/middlewares/auth'

const router = express.Router()
router.post('/invite', auth.auth, auth.userRole, teamController.inviteTeamMember)
router.post('/deny/:invitationId', auth.auth, auth.userRole, teamController.denyInvitation)
router.post('/accept/:token', auth.auth, auth.userRole, teamController.acceptInvitation)
router.get('/', auth.auth, auth.userRole, teamController.listTeams)
router.get('/:teamId', auth.auth, auth.userRole, teamController.listTeamInfo)
router.delete('/:teamId/members/:memberId', auth.auth, auth.userRole, teamController.removeMember)
router.post('/resend/:invitationId', auth.auth, auth.userRole, teamController.resendInvitation)

export default router
