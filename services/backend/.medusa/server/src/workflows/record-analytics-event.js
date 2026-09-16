"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordAnalyticsEventWorkflow = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const create_analytics_event_1 = require("./steps/create-analytics-event");
exports.recordAnalyticsEventWorkflow = (0, workflows_sdk_1.createWorkflow)("record-analytics-event", function (input) {
    const event = (0, create_analytics_event_1.createAnalyticsEventStep)(input);
    return new workflows_sdk_1.WorkflowResponse({ event });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjb3JkLWFuYWx5dGljcy1ldmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy93b3JrZmxvd3MvcmVjb3JkLWFuYWx5dGljcy1ldmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxRUFHMEM7QUFHMUMsMkVBQXlFO0FBRTVELFFBQUEsNEJBQTRCLEdBQUcsSUFBQSw4QkFBYyxFQUN4RCx3QkFBd0IsRUFDeEIsVUFBVSxLQUEyQjtJQUNuQyxNQUFNLEtBQUssR0FBRyxJQUFBLGlEQUF3QixFQUFDLEtBQUssQ0FBQyxDQUFBO0lBRTdDLE9BQU8sSUFBSSxnQ0FBZ0IsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7QUFDeEMsQ0FBQyxDQUNGLENBQUEifQ==