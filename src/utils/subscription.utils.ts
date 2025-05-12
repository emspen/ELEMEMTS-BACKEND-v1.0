import {Interval} from '@prisma/client'

export const calculateEndDate = (interval: Interval): Date => {
  const date = new Date()
  date.setMonth(date.getMonth() + (interval === Interval.ANNUAL ? 12 : 1))
  return date
}
