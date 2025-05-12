import {TokenType} from '@prisma/client'

export interface TokenResponse {
  token: string
  expires: Date
}

export interface AuthTokensResponse {
  access: TokenResponse
  refresh: TokenResponse
}

export interface VerifyToken {
  token: string
  expires: Date
  type: TokenType
  userId: string
}
