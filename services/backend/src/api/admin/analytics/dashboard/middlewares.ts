import {
  MiddlewareRoute,
  validateAndTransformQuery,
} from "@medusajs/framework/http"

import { GetAnalyticsDashboardSchema } from "./validators"

export const adminAnalyticsDashboardMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/analytics/dashboard",
    method: "GET",
    middlewares: [validateAndTransformQuery(GetAnalyticsDashboardSchema, {})],
  },
]
