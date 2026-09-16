import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import {
  analyticsHeadersContext,
  AnalyticsInputError,
  buildAnalyticsEventRecord,
} from "../../../../lib/analytics"
import { recordAnalyticsEventWorkflow } from "../../../../workflows/record-analytics-event"
import { RecordAnalyticsEventSchema } from "./validators"

export async function POST(
  req: MedusaRequest<RecordAnalyticsEventSchema>,
  res: MedusaResponse
) {
  try {
    const record = buildAnalyticsEventRecord(req.validatedBody, {
      ...analyticsHeadersContext(req.headers),
    })

    const { result } = await recordAnalyticsEventWorkflow(req.scope).run({
      input: record,
    })

    return res.status(202).json({
      accepted: true,
      event_id: result.event.id,
    })
  } catch (error) {
    if (error instanceof AnalyticsInputError) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, error.message)
    }

    throw error
  }
}
