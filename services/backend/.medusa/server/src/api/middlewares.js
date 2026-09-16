"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("@medusajs/framework/http");
const middlewares_1 = require("./admin/analytics/dashboard/middlewares");
const middlewares_2 = require("./store/analytics/events/middlewares");
exports.default = (0, http_1.defineMiddlewares)({
    routes: [
        ...middlewares_2.storeAnalyticsEventMiddlewares,
        ...middlewares_1.adminAnalyticsDashboardMiddlewares,
    ],
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlkZGxld2FyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpL21pZGRsZXdhcmVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbURBQTREO0FBRTVELHlFQUE0RjtBQUM1RixzRUFBcUY7QUFFckYsa0JBQWUsSUFBQSx3QkFBaUIsRUFBQztJQUMvQixNQUFNLEVBQUU7UUFDTixHQUFHLDRDQUE4QjtRQUNqQyxHQUFHLGdEQUFrQztLQUN0QztDQUNGLENBQUMsQ0FBQSJ9