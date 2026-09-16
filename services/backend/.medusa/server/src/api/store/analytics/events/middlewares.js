"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeAnalyticsEventMiddlewares = void 0;
const http_1 = require("@medusajs/framework/http");
const validators_1 = require("./validators");
exports.storeAnalyticsEventMiddlewares = [
    {
        matcher: "/store/analytics/events",
        method: "POST",
        middlewares: [(0, http_1.validateAndTransformBody)(validators_1.RecordAnalyticsEventSchema)],
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlkZGxld2FyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2FuYWx5dGljcy9ldmVudHMvbWlkZGxld2FyZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbURBR2lDO0FBRWpDLDZDQUF5RDtBQUU1QyxRQUFBLDhCQUE4QixHQUFzQjtJQUMvRDtRQUNFLE9BQU8sRUFBRSx5QkFBeUI7UUFDbEMsTUFBTSxFQUFFLE1BQU07UUFDZCxXQUFXLEVBQUUsQ0FBQyxJQUFBLCtCQUF3QixFQUFDLHVDQUEwQixDQUFDLENBQUM7S0FDcEU7Q0FDRixDQUFBIn0=