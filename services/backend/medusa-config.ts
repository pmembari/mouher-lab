import { defineConfig } from "@medusajs/framework/utils"

export default defineConfig({
  admin: {
    disable: true,
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:5173",
      adminCors: process.env.ADMIN_CORS || "http://localhost:7000,http://localhost:7001",
      authCors: process.env.AUTH_CORS || "http://localhost:7000,http://localhost:7001",
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
