"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
const analytics_event_1 = __importDefault(require("./models/analytics-event"));
class AnalyticsModuleService extends (0, utils_1.MedusaService)({
    AnalyticsEvent: analytics_event_1.default,
}) {
}
exports.default = AnalyticsModuleService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL2FuYWx5dGljcy9zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEscURBQXlEO0FBRXpELCtFQUFxRDtBQUVyRCxNQUFNLHNCQUF1QixTQUFRLElBQUEscUJBQWEsRUFBQztJQUNqRCxjQUFjLEVBQWQseUJBQWM7Q0FDZixDQUFDO0NBQUc7QUFFTCxrQkFBZSxzQkFBc0IsQ0FBQSJ9