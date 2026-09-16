"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const analytics_1 = require("../../../../modules/analytics");
const analytics_2 = require("../../../../lib/analytics");
async function GET(req, res) {
    const query = req.validatedQuery;
    const days = query.days || 30;
    const analyticsService = req.scope.resolve(analytics_1.ANALYTICS_MODULE);
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const events = await analyticsService.listAnalyticsEvents({
        occurred_at: {
            $gte: start,
        },
    }, {
        order: {
            occurred_at: "ASC",
        },
    });
    return res.status(200).json({
        data: (0, analytics_2.buildAnalyticsDashboardSummary)(events.map((event) => ({
            ...event,
            occurred_at: new Date(event.occurred_at),
            properties: event.properties || {},
        })), days),
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2FuYWx5dGljcy9kYXNoYm9hcmQvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFhQSxrQkFxQ0M7QUEvQ0QsNkRBQWdFO0FBQ2hFLHlEQUdrQztBQU0zQixLQUFLLFVBQVUsR0FBRyxDQUN2QixHQUFrQixFQUNsQixHQUFtQjtJQUVuQixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsY0FBNkMsQ0FBQTtJQUMvRCxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQTtJQUM3QixNQUFNLGdCQUFnQixHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLDRCQUFnQixDQUsxRCxDQUFBO0lBRUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQTtJQUMvRCxNQUFNLE1BQU0sR0FBRyxNQUFNLGdCQUFnQixDQUFDLG1CQUFtQixDQUN2RDtRQUNFLFdBQVcsRUFBRTtZQUNYLElBQUksRUFBRSxLQUFLO1NBQ1o7S0FDRixFQUNEO1FBQ0UsS0FBSyxFQUFFO1lBQ0wsV0FBVyxFQUFFLEtBQUs7U0FDbkI7S0FDRixDQUNGLENBQUE7SUFFRCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQzFCLElBQUksRUFBRSxJQUFBLDBDQUE4QixFQUNsQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3JCLEdBQUcsS0FBSztZQUNSLFdBQVcsRUFBRSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDO1lBQ3hDLFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVSxJQUFJLEVBQUU7U0FDbkMsQ0FBQyxDQUFDLEVBQ0gsSUFBSSxDQUNMO0tBQ0YsQ0FBQyxDQUFBO0FBQ0osQ0FBQyJ9