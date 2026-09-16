import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { GetAnalyticsDashboardSchema } from "./validators"
import { ANALYTICS_MODULE } from "../../../../modules/analytics"
import {
  AnalyticsEventRecord,
  buildAnalyticsDashboardSummary,
} from "../../../../lib/analytics"

type StoredAnalyticsEvent = Omit<AnalyticsEventRecord, "occurred_at"> & {
  occurred_at: string | Date
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const query = req.validatedQuery as GetAnalyticsDashboardSchema
  const days = query.days || 30
  const analyticsService = req.scope.resolve(ANALYTICS_MODULE) as unknown as {
    listAnalyticsEvents: (
      filters: Record<string, unknown>,
      config: Record<string, unknown>
    ) => Promise<StoredAnalyticsEvent[]>
  }

  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const events = await analyticsService.listAnalyticsEvents(
    {
      occurred_at: {
        $gte: start,
      },
    },
    {
      order: {
        occurred_at: "ASC",
      },
    }
  )

  return res.status(200).json({
    data: buildAnalyticsDashboardSummary(
      events.map((event) => ({
        ...event,
        occurred_at: new Date(event.occurred_at),
        properties: event.properties || {},
      })),
      days
    ),
  })
}
