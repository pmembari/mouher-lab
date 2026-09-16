import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { ANALYTICS_MODULE } from "../../modules/analytics"
import { AnalyticsEventRecord } from "../../lib/analytics"

export const createAnalyticsEventStep = createStep(
  "create-analytics-event",
  async (input: AnalyticsEventRecord, { container }) => {
    const analyticsService = container.resolve(ANALYTICS_MODULE) as unknown as {
      createAnalyticsEvents: (data: AnalyticsEventRecord) => Promise<{ id: string }>
      deleteAnalyticsEvents: (id: string) => Promise<void>
    }

    const event = await analyticsService.createAnalyticsEvents(input)

    return new StepResponse(event, event.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }

    const analyticsService = container.resolve(ANALYTICS_MODULE) as unknown as {
      deleteAnalyticsEvents: (id: string) => Promise<void>
    }

    await analyticsService.deleteAnalyticsEvents(id)
  }
)
