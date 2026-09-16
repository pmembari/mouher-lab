import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework/http"

import { RecordAnalyticsEventSchema } from "./validators"

export const storeAnalyticsEventMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/analytics/events",
    method: "POST",
    middlewares: [validateAndTransformBody(RecordAnalyticsEventSchema)],
  },
]
