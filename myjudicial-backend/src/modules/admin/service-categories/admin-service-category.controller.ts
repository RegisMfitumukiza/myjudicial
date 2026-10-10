import type { Request, Response } from "express";
import { AdminServiceCategoryService } from "./admin-service-category.service.js";
import { sendSuccess } from "../../../shared/utils/response.js";
import type {
  ListServiceCategoriesQuery,
  PromoteServiceCategoryDto,
  MergeServiceCategoryDto,
} from "./admin-service-category.schemas.js";

export const AdminServiceCategoryController = {
  async list(req: Request, res: Response) {
    const query = (req.validatedQuery ?? req.query) as ListServiceCategoriesQuery;
    const result = await AdminServiceCategoryService.listCategories(query);
    sendSuccess(res, result, "Service categories retrieved");
  },

  async promote(req: Request, res: Response) {
    const dto = req.body as PromoteServiceCategoryDto;
    const adminId = (req as any).user.id;
    const result = await AdminServiceCategoryService.promoteCategory(dto, adminId);
    sendSuccess(res, result, "Service category promoted successfully");
  },

  async merge(req: Request, res: Response) {
    const dto = req.body as MergeServiceCategoryDto;
    const adminId = (req as any).user.id;
    const result = await AdminServiceCategoryService.mergeCategory(dto, adminId);
    sendSuccess(res, result, "Service category merged successfully");
  },
};
