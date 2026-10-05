import { Router } from "express";
import { AdminSettingController } from "./admin-setting.controller.js";
import { AdminContentController } from "../content/admin-content.controller.js";
import { authenticate, requireAdmin } from "../../shared/middleware/authenticate.js";
import { contentImageUpload } from "../../shared/middleware/upload.js";

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get("/", AdminSettingController.get);
router.put("/", AdminSettingController.update);
router.post("/upload-image", contentImageUpload, AdminContentController.uploadImage);

export default router;
