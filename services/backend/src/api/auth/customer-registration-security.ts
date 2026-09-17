import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify"
const REGISTRATION_ACTION = "customer-register"

type TurnstileVerification = {
  success?: boolean
  action?: string
  hostname?: string
  "error-codes"?: string[]
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

  const tokenHeader = req.headers["x-turnstile-token"]
  const token = String(
    Array.isArray(tokenHeader) ? tokenHeader[0] : tokenHeader || ""
  ).trim()

  if (!token) {
    return res.status(400).json({
      message: "Please complete the security check before creating an account.",
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
    })
  }

  if (!verification.success) {
    return res.status(400).json({
      message: "The security check was not accepted. Please try again.",
      code: "turnstile_failed",
    })
  }

  if (
    verification.action &&
    verification.action !== REGISTRATION_ACTION
  ) {
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
    verification.hostname &&
    verification.hostname !== expectedHostname
  ) {
    return res.status(400).json({
      message: "The security check origin was not accepted.",
      code: "turnstile_hostname_mismatch",
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
]
