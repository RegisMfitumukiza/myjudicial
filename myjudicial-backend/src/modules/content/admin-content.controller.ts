import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { ContentService } from "./content.service.js";
import {
  copyContentPageSchema,
  listContentPagesQuerySchema,
  upsertContentPageSchema,
} from "./content.schemas.js";
import {
  ALLOWED_BLOCKS,
  CONTENT_LOCALES,
  CONTENT_PAGE_SLUGS,
  toContentLocale,
} from "./content.types.js";
import {
  uploadObject,
  getDefaultBucketName,
} from "../../infrastructure/storage/oci-object-storage.service.js";
import { ValidationError } from "../../shared/errors/index.js";

export const AdminContentController = {
  /** Everything the editor needs to render: block rules, locales, current rows. */
  async getSchema(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        data: {
          slugs: CONTENT_PAGE_SLUGS,
          locales: CONTENT_LOCALES,
          allowedBlocks: ALLOWED_BLOCKS,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listContentPagesQuerySchema.parse(req.query);
      const pages = await ContentService.listForAdmin(query);
      res.json({ success: true, data: { pages } });
    } catch (error) {
      next(error);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = req.params.slug as (typeof CONTENT_PAGE_SLUGS)[number];
      const locale = toContentLocale(req.query.locale);
      const page = await ContentService.getForAdmin(slug, locale);
      res.json({ success: true, data: { page } });
    } catch (error) {
      next(error);
    }
  },

  async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      const body = upsertContentPageSchema.parse(req.body);
      const page = await ContentService.upsert(body, req.user!.id, req.ip);
      res.json({ success: true, data: { page } });
    } catch (error) {
      next(error);
    }
  },

  async copy(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = req.params.slug as (typeof CONTENT_PAGE_SLUGS)[number];
      const body = copyContentPageSchema.parse(req.body);
      const page = await ContentService.copyLocale(
        slug,
        body.fromLocale,
        body.toLocale,
        req.user!.id,
        req.ip
      );
      res.json({ success: true, data: { page } });
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = req.params.slug as (typeof CONTENT_PAGE_SLUGS)[number];
      const locale = toContentLocale(req.query.locale);
      const deleted = await ContentService.remove(slug, locale, req.user!.id, req.ip);
      res.json({ success: true, data: { deleted } });
    } catch (error) {
      next(error);
    }
  },

  async listRevisions(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = req.params.slug as (typeof CONTENT_PAGE_SLUGS)[number];
      const locale = toContentLocale(req.query.locale);
      const result = await ContentService.listRevisions(slug, locale);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async restoreRevision(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = req.params.slug as (typeof CONTENT_PAGE_SLUGS)[number];
      const locale = toContentLocale(req.query.locale);
      const page = await ContentService.restoreRevision(
        slug,
        locale,
        req.params.revisionId as string,
        req.user!.id,
        req.ip
      );
      res.json({ success: true, data: { page } });
    } catch (error) {
      next(error);
    }
  },

  async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError("No image file provided. Field 'image' or 'file' is required.");
      }
      const ext = req.file.mimetype.split("/")[1] ?? "jpg";
      const objectKey = `content/images/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      await uploadObject({
        key: objectKey,
        body: req.file.buffer,
        contentType: req.file.mimetype,
        bucket: getDefaultBucketName(),
      });

      const base = (process.env.BASE_URL ?? "http://localhost:4000").replace(/\/+$/, "");
      const prefix = (process.env.API_PREFIX ?? "/api/v1").replace(/\/+$/, "");
      const url = `${base}${prefix}/content/media/${objectKey}`;

      res.status(201).json({
        success: true,
        data: {
          url,
          objectKey,
          fileName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
        message: "Image uploaded successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};
