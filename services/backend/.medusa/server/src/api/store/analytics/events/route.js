"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
const analytics_1 = require("../../../../lib/analytics");
const record_analytics_event_1 = require("../../../../workflows/record-analytics-event");
async function POST(req, res) {
    try {
        const record = (0, analytics_1.buildAnalyticsEventRecord)(req.validatedBody, {
            ...(0, analytics_1.analyticsHeadersContext)(req.headers),
        });
        const { result } = await (0, record_analytics_event_1.recordAnalyticsEventWorkflow)(req.scope).run({
            input: record,
        });
        return res.status(202).json({
            accepted: true,
            event_id: result.event.id,
        });
    }
    catch (error) {
        if (error instanceof analytics_1.AnalyticsInputError) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, error.message);
        }
        throw error;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2FuYWx5dGljcy9ldmVudHMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFXQSxvQkF3QkM7QUFsQ0QscURBQXVEO0FBRXZELHlEQUlrQztBQUNsQyx5RkFBMkY7QUFHcEYsS0FBSyxVQUFVLElBQUksQ0FDeEIsR0FBOEMsRUFDOUMsR0FBbUI7SUFFbkIsSUFBSSxDQUFDO1FBQ0gsTUFBTSxNQUFNLEdBQUcsSUFBQSxxQ0FBeUIsRUFBQyxHQUFHLENBQUMsYUFBYSxFQUFFO1lBQzFELEdBQUcsSUFBQSxtQ0FBdUIsRUFBQyxHQUFHLENBQUMsT0FBTyxDQUFDO1NBQ3hDLENBQUMsQ0FBQTtRQUVGLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxNQUFNLElBQUEscURBQTRCLEVBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQztZQUNuRSxLQUFLLEVBQUUsTUFBTTtTQUNkLENBQUMsQ0FBQTtRQUVGLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDMUIsUUFBUSxFQUFFLElBQUk7WUFDZCxRQUFRLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFO1NBQzFCLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsSUFBSSxLQUFLLFlBQVksK0JBQW1CLEVBQUUsQ0FBQztZQUN6QyxNQUFNLElBQUksbUJBQVcsQ0FBQyxtQkFBVyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ3RFLENBQUM7UUFFRCxNQUFNLEtBQUssQ0FBQTtJQUNiLENBQUM7QUFDSCxDQUFDIn0=