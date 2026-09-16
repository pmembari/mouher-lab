import { z } from "@medusajs/framework/zod"

export const RecordAnalyticsEventSchema = z.object({
  event_name: z.string().max(64),
  consent: z.boolean(),
  anonymous_id: z.string().max(64).optional(),
  session_id: z.string().max(64).optional(),
  customer_id: z.string().max(128).optional(),
  path: z.string().max(512).optional(),
  product_id: z.string().max(128).optional(),
  product_name: z.string().max(255).optional(),
  value: z.union([z.number(), z.string()]).nullable().optional(),
  currency: z.string().max(8).optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
  occurred_at: z.string().optional(),
})

export type RecordAnalyticsEventSchema = z.infer<typeof RecordAnalyticsEventSchema>
