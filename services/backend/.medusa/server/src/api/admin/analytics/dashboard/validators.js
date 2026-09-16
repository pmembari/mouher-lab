"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAnalyticsDashboardSchema = void 0;
const zod_1 = require("@medusajs/framework/zod");
exports.GetAnalyticsDashboardSchema = zod_1.z.object({
    days: zod_1.z.preprocess((value) => {
        if (typeof value === "string" && value) {
            return Number.parseInt(value, 10);
        }
        return value;
    }, zod_1.z.number().int().min(1).max(90).optional()),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9hcGkvYWRtaW4vYW5hbHl0aWNzL2Rhc2hib2FyZC92YWxpZGF0b3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGlEQUEyQztBQUU5QixRQUFBLDJCQUEyQixHQUFHLE9BQUMsQ0FBQyxNQUFNLENBQUM7SUFDbEQsSUFBSSxFQUFFLE9BQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUMzQixJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUN2QyxPQUFPLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQ25DLENBQUM7UUFFRCxPQUFPLEtBQUssQ0FBQTtJQUNkLENBQUMsRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztDQUMvQyxDQUFDLENBQUEifQ==