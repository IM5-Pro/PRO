import AuditLog from "../models/AuditLog.js";

/**
 * Record an audit entry using request context when available.
 * @param {object} req - Express request (optional)
 * @param {object} entry - { userId, action, entityType, entityId, description, changes }
 */
export async function recordAudit(req, entry, session = null) {
  try {
    const payload = {
      userId: entry.userId || (req && req.user && req.user.id) || null,
      action: entry.action,
      entity: entry.entity || entry.entityType || null,
      entityType: entry.entityType || entry.entity || null,
      entityId: entry.entityId || (entry.entityId === 0 ? '0' : null) || null,
      description: entry.description || null,
      changes: entry.changes || null,
      timestamp: entry.timestamp || undefined,
    };

    if (req) {
      // Express provides a best-effort IP and user-agent
      payload.actorIp = req.ip || req.headers?.['x-forwarded-for'] || null;
      payload.actorAgent = req.headers?.['user-agent'] || null;
    } else {
      payload.actorIp = entry.actorIp || null;
      payload.actorAgent = entry.actorAgent || null;
    }

    // Use create to persist; model-level immutability hooks will not block creation
    if (session) {
      return await AuditLog.create([payload], { session });
    }
    return await AuditLog.create(payload);
  } catch (err) {
    // Auditing should not break primary flow; log and swallow
    // eslint-disable-next-line no-console
    console.error('Audit logging failed:', err?.message || err);
    return null;
  }
}

export default { recordAudit };
