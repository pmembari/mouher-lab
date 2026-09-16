import { z } from "@medusajs/framework/zod"

export const GetAnalyticsDashboardSchema = z.object({
  days: z.preprocess((value) => {
    if (typeof value === "string" && value) {
      return Number.parseInt(value, 10)
    }

    return value
  }, z.number().int().min(1).max(90).optional()),
})

export type GetAnalyticsDashboardSchema = z.infer<typeof GetAnalyticsDashboardSchema>
