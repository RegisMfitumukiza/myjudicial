import type { Request, Response, NextFunction } from "express";
import { SpecialtyService } from "./specialty.service.js";
import { sendSuccess, sendCreated, sendNoContent } from "../../shared/utils/response.js";
import type { CreateSpecialtyDto, UpdateSpecialtyDto, ListSpecialtiesQuery } from "./specialty.schemas.js";

function paramId(req: Request): string {
  return String(req.params.id);
}

export const SpecialtyController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.validatedQuery as ListSpecialtiesQuery;
      const result = await SpecialtyService.list(query);
      res.json({
        success: true,
        message: "Specialties retrieved",
        data: result.items,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },

  async listActive(_req: Request, res: Response, next: NextFunction) {
    try {
      const specialties = await SpecialtyService.listActive();
      sendSuccess(res, specialties, "Active specialties retrieved");
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const specialty = await SpecialtyService.getById(paramId(req));
      sendSuccess(res, specialty, "Specialty retrieved");
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = req.body as CreateSpecialtyDto;
      const specialty = await SpecialtyService.create(dto);
      sendCreated(res, specialty, "Specialty created");
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = req.body as UpdateSpecialtyDto;
      const specialty = await SpecialtyService.update(paramId(req), dto);
      sendSuccess(res, specialty, "Specialty updated");
    } catch (error) {
      next(error);
    }
  },

  async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const specialty = await SpecialtyService.toggleActive(paramId(req));
      sendSuccess(res, specialty, specialty.isActive ? "Specialty activated" : "Specialty deactivated");
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await SpecialtyService.remove(paramId(req));
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  },

  async getGroups(_req: Request, res: Response, next: NextFunction) {
    try {
      const groups = await SpecialtyService.getGroups();
      sendSuccess(res, groups, "Specialty groups retrieved");
    } catch (error) {
      next(error);
    }
  },

  async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body as { ids: string[] };
      await SpecialtyService.reorder(ids);
      sendSuccess(res, null, "Specialties reordered");
    } catch (error) {
      next(error);
    }
  },
};
