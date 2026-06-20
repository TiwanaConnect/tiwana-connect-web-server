export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type PaginationMeta = PaginationParams & {
  total: number;
  totalPages: number;
};

export function getPaginationMeta(
  total: number,
  { page, pageSize }: PaginationParams
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize)
  };
}
