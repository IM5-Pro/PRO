import AuditLog from "../models/AuditLog.js";
import { sendError, sendSuccess } from "../utils/response.js";

const MAX_LIMIT = 100;

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getAuditLogs = async (req, res) => {
	try {
		const parsedPage = Number.parseInt(req.query.page, 10);
		const parsedLimit = Number.parseInt(req.query.limit, 10);
		const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
		const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
			? Math.min(parsedLimit, MAX_LIMIT)
			: 20;
		const skip = (page - 1) * limit;

		const { search, action, entity, userId } = req.query;
		const query = {};

		if (action) {
			query.action = action;
		}

		if (entity) {
			query.$or = [{ entity }, { entityType: entity }];
		}

		if (userId) {
			query.userId = userId;
		}

		if (search) {
			const safeSearch = escapeRegex(search);
			query.$and = [
				...(query.$and || []),
				{
					$or: [
						{ action: { $regex: safeSearch, $options: "i" } },
						{ entity: { $regex: safeSearch, $options: "i" } },
						{ entityType: { $regex: safeSearch, $options: "i" } },
						{ entityId: { $regex: safeSearch, $options: "i" } },
						{ description: { $regex: safeSearch, $options: "i" } },
					],
				},
			];
		}

		const [logs, total] = await Promise.all([
			AuditLog.find(query)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.populate("userId", "firstName lastName email role"),
			AuditLog.countDocuments(query),
		]);

		return sendSuccess(res, 200, "Audit logs retrieved successfully", {
			logs,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (err) {
		console.error("Get audit logs error:", err);
		return sendError(res, 500, "Internal server error", { error: err.message });
	}
};

export default {
	getAuditLogs,
};
