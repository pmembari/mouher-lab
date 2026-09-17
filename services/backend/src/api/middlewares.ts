import { defineMiddlewares } from "@medusajs/framework/http"

import { adminAnalyticsDashboardMiddlewares } from "./admin/analytics/dashboard/middlewares"
import { customerRegistrationSecurityMiddlewares } from "./auth/customer-registration-security"
import { storeAnalyticsEventMiddlewares } from "./store/analytics/events/middlewares"

export default defineMiddlewares({
  routes: [
    ...customerRegistrationSecurityMiddlewares,
    ...storeAnalyticsEventMiddlewares,
    ...adminAnalyticsDashboardMiddlewares,
  ],
})
