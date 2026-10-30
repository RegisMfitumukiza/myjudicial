import { Router } from "express";
import { AdminContentController } from "./admin-content.controller.js";
import { authenticate, requireAdmin } from "../../shared/middleware/authenticate.js";
import { contentImageUpload } from "../../shared/middleware/upload.js";

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get("/schema", AdminContentController.getSchema);
router.get("/", AdminContentController.list);
router.put("/", AdminContentController.upsert);
router.post("/upload-image", contentImageUpload, AdminContentController.uploadImage);
router.post("/:slug/copy", AdminContentController.copy);
router.get("/:slug/revisions", AdminContentController.listRevisions);
router.post("/:slug/revisions/:revisionId/restore", AdminContentController.restoreRevision);
router.delete("/:slug", AdminContentController.remove);
router.get("/:slug/blueprint", AdminContentController.getBlueprint);
router.get("/:slug", AdminContentController.getOne);

export default router;
