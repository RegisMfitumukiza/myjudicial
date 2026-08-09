export type PaginationParams = {
  page: number;
  limit: number;
  skip: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

/**
 * Parse and clamp page/limit query params.
 * page minimum: 1
 * limit range: 1–50, default 10
 */
export const parsePagination = (
  pageQuery: unknown,
  limitQuery: unknown
): PaginationParams => {
  const page = Math.max(parseInt(String(pageQuery)) || 1, 1);
  const limit = Math.min(Math.max(parseInt(String(limitQuery)) || 10, 1), 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build pagination metadata for list responses.
 */
export const buildPaginationMeta = (
  total: number,
  params: PaginationParams
): PaginationMeta => {
  const totalPages = Math.ceil(total / params.limit);
  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages,
    hasNext: params.page < totalPages,
    hasPrev: params.page > 1,
  };
};
