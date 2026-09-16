import { defineMiddlewares } from "@medusajs/framework/http"

import { adminAnalyticsDashboardMiddlewares } from "./admin/analytics/dashboard/middlewares"
import { storeAnalyticsEventMiddlewares } from "./store/analytics/events/middlewares"

export default defineMiddlewares({
  routes: [
    ...storeAnalyticsEventMiddlewares,
    ...adminAnalyticsDashboardMiddlewares,
  ],
})
