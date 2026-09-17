import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"

const E164_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/

export function requireCustomerRegistrationPhone(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const body = (req.body || {}) as Record<string, unknown>
  const phone = String(body.phone || "").trim()

  if (!E164_PHONE_PATTERN.test(phone)) {
    return res.status(400).json({
      message:
        "A valid mobile phone number in international format is required to create an account.",
      code: "mobile_phone_required",
    })
  }

  return next()
}

export const customerRegistrationSecurityMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/customers",
    method: "POST",
    middlewares: [requireCustomerRegistrationPhone],
  },
]
