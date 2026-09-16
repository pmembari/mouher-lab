"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAnalyticsEventStep = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const analytics_1 = require("../../modules/analytics");
exports.createAnalyticsEventStep = (0, workflows_sdk_1.createStep)("create-analytics-event", async (input, { container }) => {
    const analyticsService = container.resolve(analytics_1.ANALYTICS_MODULE);
    const event = await analyticsService.createAnalyticsEvents(input);
    return new workflows_sdk_1.StepResponse(event, event.id);
}, async (id, { container }) => {
    if (!id) {
        return;
    }
    const analyticsService = container.resolve(analytics_1.ANALYTICS_MODULE);
    await analyticsService.deleteAnalyticsEvents(id);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLWFuYWx5dGljcy1ldmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy93b3JrZmxvd3Mvc3RlcHMvY3JlYXRlLWFuYWx5dGljcy1ldmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxRUFBNEU7QUFFNUUsdURBQTBEO0FBRzdDLFFBQUEsd0JBQXdCLEdBQUcsSUFBQSwwQkFBVSxFQUNoRCx3QkFBd0IsRUFDeEIsS0FBSyxFQUFFLEtBQTJCLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFO0lBQ25ELE1BQU0sZ0JBQWdCLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyw0QkFBZ0IsQ0FHMUQsQ0FBQTtJQUVELE1BQU0sS0FBSyxHQUFHLE1BQU0sZ0JBQWdCLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUE7SUFFakUsT0FBTyxJQUFJLDRCQUFZLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtBQUMxQyxDQUFDLEVBQ0QsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUU7SUFDMUIsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ1IsT0FBTTtJQUNSLENBQUM7SUFFRCxNQUFNLGdCQUFnQixHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsNEJBQWdCLENBRTFELENBQUE7SUFFRCxNQUFNLGdCQUFnQixDQUFDLHFCQUFxQixDQUFDLEVBQUUsQ0FBQyxDQUFBO0FBQ2xELENBQUMsQ0FDRixDQUFBIn0=