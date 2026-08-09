import type { Request, Response, NextFunction } from "express";
import { QuotationsService } from "./quotations.service.js";
import {
  createQuotationSchema,
  updateQuotationSchema,
  updateQuotationStatusSchema,
} from "./quotations.schemas.js";
import { sendSuccess, sendCreated } from "../../../shared/utils/response.js";
import { AuthorizationError } from "../../../shared/errors/index.js";

export const QuotationsController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const expertId = req.user!.expertProfileId;
      if (!expertId) throw new AuthorizationError("Expert profile required");
      const data = await QuotationsService.getAll(expertId);
      sendSuccess(res, data, "Quotations retrieved");
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const expertId = req.user!.expertProfileId;
      if (!expertId) throw new AuthorizationError("Expert profile required");
      const data = await QuotationsService.getById(String(req.params.id), expertId);
      sendSuccess(res, data, "Quotation retrieved");
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const expertId = req.user!.expertProfileId;
      if (!expertId) throw new AuthorizationError("Expert profile required");
      const dto = createQuotationSchema.parse(req.body);
      const data = await QuotationsService.create(expertId, dto);
      sendCreated(res, data, "Quotation created");
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const expertId = req.user!.expertProfileId;
      if (!expertId) throw new AuthorizationError("Expert profile required");
      const dto = updateQuotationSchema.parse(req.body);
      const data = await QuotationsService.update(String(req.params.id), expertId, dto);
      sendSuccess(res, data, "Quotation updated");
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const expertId = req.user!.expertProfileId;
      if (!expertId) throw new AuthorizationError("Expert profile required");
      const dto = updateQuotationStatusSchema.parse(req.body);
      const data = await QuotationsService.updateStatus(String(req.params.id), expertId, dto);
      sendSuccess(res, data, "Quotation status updated");
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const expertId = req.user!.expertProfileId;
      if (!expertId) throw new AuthorizationError("Expert profile required");
      await QuotationsService.delete(String(req.params.id), expertId);
      sendSuccess(res, null, "Quotation deleted");
    } catch (error) {
      next(error);
    }
  },
};
