import {PrismaClient} from '@prisma/client'
import {envConfig} from '@/config'

// add prisma to the NodeJS global type
interface CustomNodeJsGlobal extends Global {
  prisma: PrismaClient
}

// Prevent multiple instances of Prisma Client in development
declare const global: CustomNodeJsGlobal

const prisma = global.prisma || new PrismaClient()

if (envConfig.env === 'development') global.prisma = prisma

export default prisma
