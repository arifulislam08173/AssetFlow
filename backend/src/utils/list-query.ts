import type { Request } from "express";
import { Op, col, where as sequelizeWhere } from "sequelize";
import { ApiError } from "./errors";

/** Escape SQL LIKE metacharacters so user text is matched literally, as a case-insensitive prefix. */
export function searchPrefix(query: unknown): string | null {
  if (typeof query !== "string") return null;
  const value = query.trim().slice(0, 120);
  return value ? `${value.replace(/[\\%_]/g, "\\$&")}%` : null;
}

export function addPrefixSearch(where: any, req: Request, columns: string[]) {
  const pattern = searchPrefix(req.query.search);
  if (!pattern) return;
  where[Op.or] = columns.map((column) => {
    // Sequelize does not translate model attribute names in $Association.attribute$
    // expressions. E.g. $Asset.assetCode$ becomes "Asset"."assetCode", but the
    // PostgreSQL column is "Asset"."asset_code". Use an explicit physical column
    // for the named JOIN aliases, while retaining normal field mapping for roots.
    const association = /^\$([A-Za-z][A-Za-z0-9_]*)\.([A-Za-z][A-Za-z0-9_]*)\$$/.exec(column);
    if (association) {
      const [, alias, attribute] = association;
      const physical = attribute.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      return sequelizeWhere(col(`${alias}.${physical}`), { [Op.iLike]: pattern });
    }
    return { [column]: { [Op.iLike]: pattern } };
  });
}

export function addExactFilters(where: any, req: Request, columns: string[]) {
  for (const column of columns) {
    const value = req.query[column];
    if (typeof value === "string" && value.trim()) where[column] = value.trim();
  }
}

function validYmd(input: unknown): input is string {
  if (typeof input !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return false;
  const d = new Date(`${input}T00:00:00.000Z`);
  return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === input;
}

/** DATE fields use [from, nextDay(to)); DATEONLY fields use inclusive [from, to]. */
export function addDateRange(where: any, req: Request, column: string, dateOnly = false) {
  const from = req.query.dateFrom;
  const to = req.query.dateTo;
  if (from !== undefined && from !== "" && !validYmd(from)) throw new ApiError(400, "dateFrom must be YYYY-MM-DD");
  if (to !== undefined && to !== "" && !validYmd(to)) throw new ApiError(400, "dateTo must be YYYY-MM-DD");
  if (typeof from === "string" && typeof to === "string" && from && to && from > to) {
    throw new ApiError(400, "Start date must not be after end date");
  }
  const range: any = {};
  if (typeof from === "string" && from) range[Op.gte] = dateOnly ? from : new Date(`${from}T00:00:00.000Z`);
  if (typeof to === "string" && to) {
    if (dateOnly) range[Op.lte] = to;
    else range[Op.lt] = new Date(Date.parse(`${to}T00:00:00.000Z`) + 86_400_000);
  }
  if (Object.getOwnPropertySymbols(range).length) where[column] = range;
}

export function addListQuery(where: any, req: Request, config: { search?: string[]; exact?: string[]; date?: string; dateOnly?: boolean }) {
  addPrefixSearch(where, req, config.search || []);
  addExactFilters(where, req, config.exact || []);
  if (config.date) addDateRange(where, req, config.date, config.dateOnly);
  return where;
}
