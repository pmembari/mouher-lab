import { defineConfig } from "@medusajs/framework/utils"

const storefrontOrigins = [
  "http://localhost:5173",
  "https://pmembari.github.io",
]

function corsList(...values: Array<string | undefined>) {
  return [
    ...new Set(
      values
        .flatMap((value) => (value || "").split(","))
        .map((value) => value.trim())
        .filter(Boolean)
    ),
  ].join(",")
}

export default defineConfig({
  admin: {
    disable: true,
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: corsList(
        ...storefrontOrigins,
        process.env.STORE_CORS
      ),
      adminCors: process.env.ADMIN_CORS || "http://localhost:7000,http://localhost:7001",
      authCors: corsList(
        ...storefrontOrigins,
        "http://localhost:7000",
        "http://localhost:7001",
        process.env.AUTH_CORS
      ),
      jwtSecret: process.env.JWT_SECRET || "development-only-jwt-secret",
      cookieSecret: process.env.COOKIE_SECRET || "development-only-cookie-secret",
    },
  },
  modules: [
    {
      resolve: "./src/modules/analytics",
    },
  ],
})
