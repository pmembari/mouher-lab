import { model } from "@medusajs/framework/utils"

const AnalyticsEvent = model.define("analytics_event", {
  id: model.id().primaryKey(),
  event_name: model.text(),
  anonymous_id: model.text().default(""),
  session_id: model.text().default(""),
  customer_id: model.text().default(""),
  path: model.text().default(""),
  product_id: model.text().default(""),
  product_name: model.text().default(""),
  value: model.bigNumber().nullable(),
  currency: model.text().default(""),
  country_code: model.text().default(""),
  region: model.text().default(""),
  city: model.text().default(""),
  device_type: model.text().default(""),
  properties: model.json().nullable(),
  occurred_at: model.dateTime(),
})

export default AnalyticsEvent
