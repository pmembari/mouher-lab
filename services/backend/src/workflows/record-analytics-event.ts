import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { AnalyticsEventRecord } from "../lib/analytics"
import { createAnalyticsEventStep } from "./steps/create-analytics-event"

export const recordAnalyticsEventWorkflow = createWorkflow(
  "record-analytics-event",
  function (input: AnalyticsEventRecord) {
    const event = createAnalyticsEventStep(input)

    return new WorkflowResponse({ event })
  }
)
