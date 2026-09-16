"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
exports.default = (0, utils_1.defineConfig)({
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVkdXNhLWNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL21lZHVzYS1jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxxREFBd0Q7QUFFeEQsa0JBQWUsSUFBQSxvQkFBWSxFQUFDO0lBQzFCLEtBQUssRUFBRTtRQUNMLE9BQU8sRUFBRSxJQUFJO0tBQ2Q7SUFDRCxhQUFhLEVBQUU7UUFDYixXQUFXLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZO1FBQ3JDLElBQUksRUFBRTtZQUNKLFNBQVMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSx1QkFBdUI7WUFDNUQsU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLDZDQUE2QztZQUNsRixRQUFRLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLElBQUksNkNBQTZDO1lBQ2hGLFNBQVMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSw2QkFBNkI7WUFDbEUsWUFBWSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxJQUFJLGdDQUFnQztTQUM1RTtLQUNGO0lBQ0QsT0FBTyxFQUFFO1FBQ1A7WUFDRSxPQUFPLEVBQUUseUJBQXlCO1NBQ25DO0tBQ0Y7Q0FDRixDQUFDLENBQUEifQ==