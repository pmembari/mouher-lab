"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAnalyticsDashboardMiddlewares = void 0;
const http_1 = require("@medusajs/framework/http");
const validators_1 = require("./validators");
exports.adminAnalyticsDashboardMiddlewares = [
    {
        matcher: "/admin/analytics/dashboard",
        method: "GET",
        middlewares: [(0, http_1.validateAndTransformQuery)(validators_1.GetAnalyticsDashboardSchema, {})],
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlkZGxld2FyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2FuYWx5dGljcy9kYXNoYm9hcmQvbWlkZGxld2FyZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbURBR2lDO0FBRWpDLDZDQUEwRDtBQUU3QyxRQUFBLGtDQUFrQyxHQUFzQjtJQUNuRTtRQUNFLE9BQU8sRUFBRSw0QkFBNEI7UUFDckMsTUFBTSxFQUFFLEtBQUs7UUFDYixXQUFXLEVBQUUsQ0FBQyxJQUFBLGdDQUF5QixFQUFDLHdDQUEyQixFQUFFLEVBQUUsQ0FBQyxDQUFDO0tBQzFFO0NBQ0YsQ0FBQSJ9