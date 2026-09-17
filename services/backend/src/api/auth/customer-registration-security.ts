import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify"
const REGISTRATION_ACTION = "customer-register"
const E164_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/

type TurnstileVerification = {
  success?: boolean
  action?: string
  hostname?: string
  "error-codes"?: string[]
}

function firstHeaderValue(value: string | string[] | undefined) {
  return String(Array.isArray(value) ? value[0] : value || "").trim()
}

export async function verifyCustomerRegistrationTurnstile(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const secret = String(process.env.TURNSTILE_SECRET_KEY || "").trim()

  if (!secret) {
    return res.status(503).json({
      message:
        "Customer registration is temporarily unavailable because CAPTCHA verification is not configured.",
    })
  }

  const phone = firstHeaderValue(req.headers["x-mouher-phone"])

  if (!E164_PHONE_PATTERN.test(phone)) {
    return res.status(400).json({
      message:
        "A valid mobile phone number in international format is required to create an account.",
      code: "mobile_phone_required",
    })
  }

  const token = firstHeaderValue(req.headers["x-turnstile-token"])

  if (!token) {
    return res.status(400).json({
      message: "Please complete the security check before creating an account.",
      code: "turnstile_required",
    })
  }

  const form = new URLSearchParams({
    secret,
    response: token,
  })

  if (req.ip) {
    form.set("remoteip", req.ip)
  }

  let verification: TurnstileVerification

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: form,
    })

    if (!response.ok) {
      throw new Error(`Turnstile verification returned ${response.status}`)
    }

    verification = (await response.json()) as TurnstileVerification
  } catch (error) {
    console.error("Turnstile verification failed:", error)
    return res.status(502).json({
      message: "The security check could not be verified. Please try again.",
      code: "turnstile_unavailable",
    })
  }

  if (!verification.success) {
    return res.status(400).json({
      message: "The security check was not accepted. Please try again.",
      code: "turnstile_failed",
    })
  }

  if (verification.action !== REGISTRATION_ACTION) {
    return res.status(400).json({
      message: "The security check was not valid for account registration.",
      code: "turnstile_action_mismatch",
    })
  }

  const expectedHostname = String(
    process.env.TURNSTILE_EXPECTED_HOSTNAME || ""
  ).trim()

  if (
    expectedHostname &&
    verification.hostname !== expectedHostname
  ) {
    return res.status(400).json({
      message: "The security check origin was not accepted.",
      code: "turnstile_hostname_mismatch",
    })
  }

  return next()
}

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
    matcher: "/auth/customer/emailpass/register",
    method: "POST",
    middlewares: [verifyCustomerRegistrationTurnstile],
  },
  {
    matcher: "/store/customers",
    method: "POST",
    middlewares: [requireCustomerRegistrationPhone],
  },
]
