import type { Response } from "express";

type SuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

type PaginatedResponse<T> = SuccessResponse<T> & {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

/**
 * Send a standard success response.
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200
): void => {
  const body: SuccessResponse<T> = { success: true, message, data };
  res.status(statusCode).json(body);
};

/**
 * Send a paginated list response.
 */
export const sendPaginated = <T>(
  res: Response,
  data: T,
  meta: PaginatedResponse<T>["meta"],
  message = "Success"
): void => {
  const body: PaginatedResponse<T> = { success: true, message, data, meta };
  res.status(200).json(body);
};

/**
 * Send a 201 Created response.
 */
export const sendCreated = <T>(res: Response, data: T, message = "Created"): void => {
  sendSuccess(res, data, message, 201);
};

/**
 * Send a 204 No Content response (delete operations).
 */
export const sendNoContent = (res: Response): void => {
  res.status(204).end();
};
