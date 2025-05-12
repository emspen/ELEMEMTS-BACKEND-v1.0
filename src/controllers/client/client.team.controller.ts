import catchAsync from '@/utils/catchAsync.utils'
import httpStatus from 'http-status'
import e, {Request, Response} from 'express'
import {User} from '@prisma/client'
import teamService from '@/services/client/client.team.service'

const inviteTeamMember = catchAsync(async (req: Request, res: Response) => {
  try {
    const {teamId, email} = req.body
    const inviter = req.user as User
    const invitation = await teamService.inviteMember(inviter.id, teamId, email)
    res.status(httpStatus.CREATED).send({status: 'success', data: {invitation}})
  } catch (error: any) {
    res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
      status: 'error',
      message: error.message || 'An error occurred while inviting team member',
    })
  }
})

const acceptInvitation = catchAsync(async (req: Request, res: Response) => {
  try {
    const {token} = req.params
    const user = req.user as User
    await teamService.acceptInvitation(token, user.id)
    res.status(httpStatus.OK).send({status: 'success', message: 'Invitation accepted'})
  } catch (error: any) {
    res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
      status: 'error',
      message: error.message || 'An error occurred while accepting invitation',
    })
  }
})

const resendInvitation = catchAsync(async (req: Request, res: Response) => {
  try {
    const {invitationId} = req.params
    const inviter = req.user as User
    await teamService.resendInvitation(inviter.id, invitationId)
    res.status(httpStatus.OK).send({status: 'success', message: 'Invitation resent'})
  } catch (error: any) {
    res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
      status: 'error',
      message: error.message || 'An error occurred while resending invitation',
    })
  }
})

const denyInvitation = catchAsync(async (req: Request, res: Response) => {
  try {
    const {invitationId} = req.params
    const user = req.user as User
    await teamService.denyInvitation(user.id, invitationId)
    res.status(httpStatus.OK).send({status: 'success', message: 'Invitation denied'})
  } catch (error: any) {
    res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
      status: 'error',
      message: error.message || 'An error occurred while denying invitation',
    })
  }
})

const listTeams = catchAsync(async (req: Request, res: Response) => {
  try {
    const user = req.user as User
    const teams = await teamService.listUserTeams(user.id)
    res.status(httpStatus.OK).send({status: 'success', data: {teams}})
  } catch (error: any) {
    res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
      status: 'error',
      message: error.message || 'An error occurred while listing teams',
    })
  }
})

const listTeamInfo = catchAsync(async (req: Request, res: Response) => {
  try {
    const {teamId} = req.params
    const user = req.user as User
    const members = await teamService.listTeamInfo(user.id, teamId)
    res.status(httpStatus.OK).send({status: 'success', data: {members}})
  } catch (error: any) {
    res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
      status: 'error',
      message: error.message || 'An error occurred while listing team members',
    })
  }
})

const removeMember = catchAsync(async (req: Request, res: Response) => {
  try {
    const {teamId, memberId} = req.params
    const user = req.user as User
    await teamService.removeMember(user.id, teamId, memberId)
    res.status(httpStatus.OK).send({status: 'success', message: 'Member removed from team'})
  } catch (error: any) {
    res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
      status: 'error',
      message: error.message || 'An error occurred while removing member from team',
    })
  }
})

export default {
  inviteTeamMember,
  acceptInvitation,
  resendInvitation,
  denyInvitation,
  listTeams,
  listTeamInfo,
  removeMember,
}
