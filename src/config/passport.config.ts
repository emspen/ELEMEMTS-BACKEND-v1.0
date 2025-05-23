import {Strategy as JwtStrategy, ExtractJwt, VerifyCallback} from 'passport-jwt'
import prisma from '@/prisma/client'
import {envConfig} from '@/config'

enum TokenType {
  ACCESS = 'ACCESS',
  REFRESH = 'REFRESH',
}

const jwtOptions = {
  secretOrKey: envConfig.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
}

const jwtVerify: VerifyCallback = async (payload, done) => {
  try {
    if (payload.type !== TokenType.ACCESS) {
      throw new Error('Invalid token type')
    }
    const user = await prisma.user.findUnique({
      select: {
        id: true,
        email: true,
        name: true,
      },
      where: {id: payload.sub},
    })
    if (!user) {
      return done(null, false)
    }
    done(null, user)
  } catch (error) {
    done(error, false)
  }
}

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify)

export default jwtStrategy
