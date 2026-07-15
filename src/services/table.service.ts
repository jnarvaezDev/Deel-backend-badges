import pool from "../db";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export type TablePagination = {
  page: number;
  limit: number;
  offset: number;
};

type TableResponse<Row> = {
  data: Row[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

type ResultTableRow = {
  id: number;
  name: string | null;
  email: string;
  employment_status: "employed" | "unemployed" | null;
  current_job_title: string | null;
  current_country: string;
  score: number | null;
  tier: string | null;
  assessment_data: Record<string, unknown> | null;
  vb_recipient_id: string | null;
  vb_certificate_id: string | null;
  vb_validation_url: string | null;
  vb_status: string | null;
  vb_validation_page_url: string | null;
  identification_number: string | null;
  created_at: string;
};

type LeadTableRow = {
  id: number;
  name: string;
  email: string;
  employment_status: "employed" | "unemployed" | null;
  current_job_title: string | null;
  current_country: string;
  created_at: string;
};

const normalizePositiveInteger = (value: unknown, fallback: number) => {
  if (typeof value !== "string") {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return parsedValue;
};

export const parseTablePagination = (
  rawPage: unknown,
  rawLimit: unknown
): TablePagination => {
  const page = normalizePositiveInteger(rawPage, DEFAULT_PAGE);
  const requestedLimit = normalizePositiveInteger(rawLimit, DEFAULT_LIMIT);
  const limit = Math.min(requestedLimit, MAX_LIMIT);

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
};

const buildTableResponse = <Row>(
  rows: Row[],
  total: number,
  pagination: TablePagination
): TableResponse<Row> => {
  const totalPages = total === 0 ? 0 : Math.ceil(total / pagination.limit);

  return {
    data: rows,
    total,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPreviousPage: pagination.page > 1,
    },
  };
};

export const fetchResultsTable = async (
  pagination: TablePagination
): Promise<TableResponse<ResultTableRow>> => {
  const totalResult = await pool.query<{ count: string }>(
    "SELECT COUNT(*)::int AS count FROM results"
  );
  const total = Number(totalResult.rows[0]?.count ?? 0);

  const rowsResult = await pool.query<ResultTableRow>(
    `
    SELECT
      id,
      name,
      email,
      employment_status,
      current_job_title,
      current_country,
      score,
      tier,
      assessment_data,
      vb_recipient_id,
      vb_certificate_id,
      vb_validation_url,
      vb_status,
      vb_validation_page_url,
      identification_number,
      created_at
    FROM results
    ORDER BY created_at DESC, id DESC
    LIMIT $1 OFFSET $2
    `,
    [pagination.limit, pagination.offset]
  );

  return buildTableResponse(rowsResult.rows, total, pagination);
};

export const fetchLeadsTable = async (
  pagination: TablePagination
): Promise<TableResponse<LeadTableRow>> => {
  const totalResult = await pool.query<{ count: string }>(
    "SELECT COUNT(*)::int AS count FROM leads"
  );
  const total = Number(totalResult.rows[0]?.count ?? 0);

  const rowsResult = await pool.query<LeadTableRow>(
    `
    SELECT
      id,
      name,
      email,
      employment_status,
      current_job_title,
      current_country,
      created_at
    FROM leads
    ORDER BY created_at DESC, id DESC
    LIMIT $1 OFFSET $2
    `,
    [pagination.limit, pagination.offset]
  );

  return buildTableResponse(rowsResult.rows, total, pagination);
};
