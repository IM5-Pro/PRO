/**
 * ManpowerPlanning Router
 * Defines all API routes for workforce planning and manpower analytics
 * 
 * @module ManpowerPlanningRouter
 * @author HR Team
 * @version 1.0.0
 * 
 * Routes:
 * - GET /metrics - Fetch key workforce metrics
 * - GET /open-positions - List open job positions
 * - GET /pending-approvals - Get pending leave/approval requests
 * - GET /departments-summary - Department-wise workforce summary
 * - GET /trends - Workforce trend analysis data
 */

import express from "express";
import manpowerPlanningController from "../controllers/ManpowerPlanningController.js";
import authGuard from "../middleware/authGuard.js";

const router = express.Router();

// ============================================================================
// MIDDLEWARE
// ============================================================================
// All routes require authentication
// Permission checks are applied per endpoint if needed

// ============================================================================
// PUBLIC ROUTES (Authenticated Users)
// ============================================================================

/**
 * GET /api/manpower-planning/metrics
 * Fetch key workforce metrics: total strength, open positions, pending approvals, efficiency
 * 
 * Authentication: Required
 * Authorization: All authenticated users can view metrics
 * 
 * Query Parameters: None
 * 
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "metrics": {
 *       "totalStrength": { "value": 1250, "trend": { "change": 15, "isPositive": true } },
 *       "openPositions": { "value": 23, "trend": { "change": 5, "isPositive": true } },
 *       "pendingApprovals": { "value": 12, "trend": { "change": -3, "isPositive": false } },
 *       "departmentEfficiency": { "value": 94.2, "trend": { "change": 2.1, "isPositive": true } }
 *     }
 *   }
 * }
 */
router.get("/metrics", authGuard, manpowerPlanningController.getMetrics);

/**
 * GET /api/manpower-planning/open-positions
 * Retrieve list of open job positions with pagination and filters
 * 
 * Authentication: Required
 * Authorization: All authenticated users
 * 
 * Query Parameters:
 * - limit (number): Max results per page (default: 20, max: 100)
 * - skip (number): Records to skip for pagination (default: 0)
 * - department (string): Filter by department name (optional)
 * 
 * Example: GET /api/manpower-planning/open-positions?department=IT&limit=10
 * 
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "positions": [
 *       {
 *         "_id": "...",
 *         "title": "Senior Developer",
 *         "department": "IT",
 *         "vacancies": 2,
 *         "salaryRange": { "min": 600000, "max": 1000000 }
 *       }
 *     ],
 *     "pagination": { "total": 23, "limit": 10, "skip": 0, "pages": 3 }
 *   }
 * }
 */
router.get("/open-positions", authGuard, manpowerPlanningController.getOpenPositions);

/**
 * GET /api/manpower-planning/pending-approvals
 * Retrieve pending leave requests awaiting approval
 * 
 * Authentication: Required
 * Authorization: All authenticated users
 * 
 * Query Parameters:
 * - limit (number): Max results per page (default: 20, max: 100)
 * - skip (number): Records to skip for pagination (default: 0)
 * 
 * Example: GET /api/manpower-planning/pending-approvals?limit=15
 * 
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "approvals": [
 *       {
 *         "_id": "...",
 *         "employeeId": { "firstName": "John", "lastName": "Doe", "email": "john@company.com" },
 *         "startDate": "2026-03-20",
 *         "endDate": "2026-03-22",
 *         "totalDays": 3,
 *         "reason": "Personal",
 *         "status": "PENDING"
 *       }
 *     ],
 *     "pagination": { "total": 12, "limit": 15, "skip": 0, "pages": 1 }
 *   }
 * }
 */
router.get("/pending-approvals", authGuard, manpowerPlanningController.getPendingApprovals);

/**
 * GET /api/manpower-planning/departments-summary
 * Get workforce metrics aggregated by department
 * 
 * Authentication: Required
 * Authorization: All authenticated users
 * 
 * Query Parameters: None
 * 
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "departments": [
 *       {
 *         "name": "IT",
 *         "strength": 320,
 *         "budget": 4500000,
 *         "efficiency": 96
 *       }
 *     ],
 *     "totalDepartments": 6,
 *     "totalStrength": 1250
 *   }
 * }
 */
router.get("/departments-summary", authGuard, manpowerPlanningController.getDepartmentsSummary);

/**
 * GET /api/manpower-planning/trends
 * Retrieve workforce trend data for time-period analysis and visualization
 * 
 * Authentication: Required
 * Authorization: All authenticated users
 * 
 * Query Parameters:
 * - period (string): 'week', 'month', 'quarter', 'year' (default: 'month')
 * 
 * Example: GET /api/manpower-planning/trends?period=month
 * 
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "period": "month",
 *     "trends": [
 *       {
 *         "date": "2026-02-15",
 *         "totalStrength": 1248,
 *         "openPositions": 22,
 *         "efficiency": 93.8
 *       }
 *     ],
 *     "dataPoints": 30
 *   }
 * }
 */
router.get("/trends", authGuard, manpowerPlanningController.getTrends);

// ============================================================================
// EXPORT ROUTER
// ============================================================================

export default router;
