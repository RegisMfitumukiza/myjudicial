import { Router } from "express";
import { AdminSettingController } from "./admin-setting.controller.js";
import { authenticate, requireAdmin } from "../../shared/middleware/authenticate.js";

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get("/", AdminSettingController.get);
router.put("/", AdminSettingController.update);

export default router;
