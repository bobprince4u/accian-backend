import { query } from "../config/database";

export const auditLog = (action: string) => {
  return async (req: any, res: any, next: any) => {
    try {
      await query(
        `INSERT INTO audit_logs (admin_id, action, ip_address, user_agent)
         VALUES ($1, $2, $3, $4)`,
        [req.user?.id || null, action, req.ip, req.headers["user-agent"]]
      );
    } catch (_) {}

    next();
  };
};
