import { Router } from "express";
import { AdminAuditController } from "./admin-audit.controller.js";
import { authenticate, requireAdmin } from "../../shared/middleware/authenticate.js";

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/v1/admin/audit-logs/stats
 * @desc    Get audit log statistics
 * @access  Admin only
 */
router.get("/stats", AdminAuditController.getStats);

/**
 * @route   GET /api/v1/admin/audit-logs/export
 * @desc    Export audit logs as CSV or JSON
 * @access  Admin only
 * @note    Must be before /:id route to prevent "export" being treated as ID
 */
router.get("/export", AdminAuditController.export);

/**
 * @route   GET /api/v1/admin/audit-logs
 * @desc    List audit logs with filters and pagination
 * @access  Admin only
 */
router.get("/", AdminAuditController.list);

/**
 * @route   GET /api/v1/admin/audit-logs/actor/:actorId
 * @desc    Get logs for a specific user
 * @access  Admin only
 */
router.get("/actor/:actorId", AdminAuditController.getByActorId);

/**
 * @route   GET /api/v1/admin/audit-logs/resource/:resourceId
 * @desc    Get logs for a specific resource
 * @access  Admin only
 */
router.get("/resource/:resourceId", AdminAuditController.getByResourceId);

/**
 * @route   GET /api/v1/admin/audit-logs/:id
 * @desc    Get single audit log by ID
 * @access  Admin only
 */
router.get("/:id", AdminAuditController.getById);

export default router;
