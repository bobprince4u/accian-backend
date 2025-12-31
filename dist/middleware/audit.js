"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = void 0;
const database_1 = require("../config/database");
const auditLog = (action) => {
    return async (req, res, next) => {
        try {
            await (0, database_1.query)(`INSERT INTO audit_logs (admin_id, action, ip_address, user_agent)
         VALUES ($1, $2, $3, $4)`, [req.user?.id || null, action, req.ip, req.headers["user-agent"]]);
        }
        catch (_) { }
        next();
    };
};
exports.auditLog = auditLog;
