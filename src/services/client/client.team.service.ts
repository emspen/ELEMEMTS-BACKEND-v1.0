import prisma from '@/prisma/client'
import httpStatus from 'http-status'

import {generateToken} from '@/utils/token.utils'
import emailService from '@/services/shared/email.service'
import ApiError from '@/utils/apiError.utils'
import {envConfig} from '@/config'

const createTeam = async (ownerId: string, name: string, subscriptionId: string) => {
  const subscription = await prisma.subscription.findUnique({
    where: {
      id: subscriptionId,
    },
    select: {
      plan: true,
    },
  })
  if (!subscription) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Subscription not found')
  }
  if (!subscription.plan || subscription.plan.type !== 'TEAM') {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Subscription not valid')
  }
}

/**
 * Invite a user to a team
 *
 * @param {string} inviterId
 * @param {string} teamId
 * @param {string} email
 * @return {*}
 */
const inviteMember = async (inviterId: string, teamId: string, email: string) => {
  try {
    // check if user is already a member of the team
    const preInvited = await prisma.teamInvitation.findFirst({
      where: {
        teamId,
        email,
        OR: [
          {
            status: 'PENDING',
          },
          {
            status: 'ACCEPTED',
          },
          {
            expiresAt: {
              gte: new Date(),
            },
          },
        ],
      },
    })
    if (preInvited && preInvited.status === 'ACCEPTED')
      throw new ApiError(httpStatus.FORBIDDEN, 'User is already a member of this team')
    if (preInvited && preInvited.status === 'PENDING')
      throw new ApiError(httpStatus.FORBIDDEN, 'User is already invited to this team')
    // only owner can invite
    const owner = await prisma.team.findFirst({
      where: {
        id: teamId,
        ownerId: inviterId,
      },
    })
    if (!owner) throw new ApiError(httpStatus.FORBIDDEN, 'You are not the owner of this team')
    // create invitation
    const token = generateToken()
    const invitation = await prisma.teamInvitation.create({
      data: {
        email,
        teamId,
        invitedById: inviterId,
        token,
        status: 'PENDING',
        expiresAt: new Date(
          Date.now() + envConfig.teamInvitation.expirationDays * 24 * 60 * 60 * 1000 // 4 days
        ),
      },
      select: {
        team: true,
      },
    })
    // send invitation email
    await emailService.sendTeamInvitationEmail(invitation.team.name, email, token)
    return invitation
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    } else {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to invite user')
    }
  }
}

/**
 * Accept invitation to join a team
 *
 * @param {string} token
 * @param {string} userId
 */
const acceptInvitation = async (token: string, userId: string) => {
  try {
    const invitation = await prisma.teamInvitation.findFirst({
      where: {
        token,
      },
      select: {
        id: true,
        team: true,
        expiresAt: true,
        status: true,
      },
    })
    if (!invitation) throw new ApiError(httpStatus.NOT_FOUND, 'Invitation not found')
    if (invitation.status !== 'PENDING' || invitation.expiresAt < new Date())
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired token')
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    })
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
    await prisma.teamMember.create({
      data: {
        teamId: invitation.team.id,
        userId,
        role: 'MEMBER',
      },
    })
    await prisma.teamInvitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        userId,
      },
    })
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    } else {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to accept invitation')
    }
  }
}

const listUserTeams = async (userId: string) => {
  try {
    const teams = await prisma.team.findMany({
      where: {
        OR: [
          {ownerId: userId},
          {
            members: {
              some: {userId},
            },
          },
        ],
      },
      include: {
        owner: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    })
    return teams
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    } else {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to list teams')
    }
  }
}

const listTeamInfo = async (requesterId: string, teamId: string) => {
  try {
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
      include: {
        members: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        subscription: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        TeamInvitation: {
          where: {
            NOT: {
              status: 'ACCEPTED',
            },
          },
          select: {
            id: true,
            email: true,
            status: true,
            expiresAt: true,
            createdAt: true,
          },
        },
      },
    })
    if (!team) throw new ApiError(httpStatus.NOT_FOUND, 'Team not found')
    if (team.ownerId !== requesterId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You are not a owner of this team')
    }
    const expiredTeam = await prisma.subscription.update({
      where: {
        id: team.subscription.id,
        AND: {
          endDate: {
            lte: new Date(),
          },
        },
      },
      data: {
        status: 'EXPIRED',
      },
    })
    if (expiredTeam)
      throw new ApiError(httpStatus.BAD_REQUEST, 'Team Subscription is already expired')
    const date = new Date().getTime() - new Date(team.subscription.endDate).getTime()
    const daysLeft = Math.ceil(date / (1000 * 60 * 60 * 24))
    const expire_at = new Date(team.subscription.endDate)
    const expire_at_string = expire_at.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    return {team, daysLeft, expire_at_string}
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    } else {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to list team members')
    }
  }
}

const resendInvitation = async (requesterId: string, invitationId: string) => {
  try {
    // fetch invitation and permission check
    const invitation = await prisma.teamInvitation.findUnique({
      where: {id: invitationId},
      include: {team: true},
    })
    if (!invitation || invitation.status !== 'PENDING')
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot resend')
    // only original inviter can resend
    const isAllowed =
      invitation.invitedById === requesterId ||
      (await prisma.team.findFirst({
        where: {
          id: invitation.teamId,
          ownerId: requesterId,
        },
      }))
    if (!isAllowed) throw new ApiError(httpStatus.FORBIDDEN, 'You are not allowed to resend')
    // extend expiry
    const newExpiresAt = new Date(
      Date.now() + envConfig.teamInvitation.expirationDays * 24 * 60 * 60 * 1000
    )
    await prisma.teamInvitation.update({
      where: {id: invitationId},
      data: {
        expiresAt: newExpiresAt,
      },
    })
    // re-send email
    await emailService.sendTeamInvitationEmail(
      invitation.email,
      invitation.team.name,
      invitation.token
    )
  } catch (error) {
    if (error instanceof ApiError) throw error
    else {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to resend invitation')
    }
  }
}

const denyInvitation = async (requesterId: string, invitationId: string) => {
  try {
    // fetch invitation and permission check
    const invitation = await prisma.teamInvitation.findUnique({
      where: {id: invitationId},
    })
    if (!invitation || invitation.status !== 'PENDING')
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot deny')
    // only the invitee or team owner can deny
    const isOwnerOrAdmin = await prisma.team.findFirst({
      where: {
        id: invitation.teamId,
        ownerId: requesterId,
      },
    })
    if (!isOwnerOrAdmin) throw new ApiError(httpStatus.FORBIDDEN, 'You are not allowed to deny')
    await prisma.teamInvitation.update({
      where: {id: invitationId},
      data: {
        status: 'DENIED',
        expiresAt: new Date(),
      },
    })
  } catch (error) {
    if (error instanceof ApiError) throw error
    else {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to deny invitation')
    }
  }
}

const removeMember = async (requesterId: string, teamId: string, memberId: string) => {
  try {
    // only owner can remove member
    const actor = await prisma.team.findUnique({
      where: {
        id: teamId,
        ownerId: requesterId,
      },
    })
    if (!actor) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You are not the owner of this team')
    }
    // cannot remove owner
    const member = await prisma.teamMember.findUnique({
      where: {
        id: memberId,
      },
    })
    if (!member) throw new ApiError(httpStatus.NOT_FOUND, 'Member not found')
    await prisma.teamMember.update({
      where: {
        id: memberId,
      },
      data: {
        leftAt: new Date(),
      },
    })
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    } else {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to remove member')
    }
  }
}

export default {
  createTeam,
  inviteMember,
  acceptInvitation,
  listUserTeams,
  listTeamInfo,
  removeMember,
  resendInvitation,
  denyInvitation,
}
