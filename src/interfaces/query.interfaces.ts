export interface PrismaFindManyArgs {
  where?: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, boolean | Record<string, unknown>>;
  orderBy?: Record<string, unknown> | Record<string, unknown>[];
  skip?: number;
  take?: number;
  cursor?: Record<string, unknown>;
  distinct?: string[] | string;
  [key: string]: unknown;
}

export interface PrismaCountArgs {
  where?: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, boolean | Record<string, unknown>>;
  orderBy?: Record<string, unknown> | Record<string, unknown>[];
  skip?: number;
  take?: number;
  cursor?: Record<string, unknown>;
  distinct?: string[] | string;
  [key: string]: unknown;
}

export interface PrismaModelDelegate {
  findMany(args?: unknown): Promise<unknown[]>;
  count(args?: unknown): Promise<number>;
}

export interface IQueryParams {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  fields?: string;
  includes?: string;
  [key: string]: unknown;
}

export interface IQueryConfig {
  searchableFields?: string[];
  searchableExactFields?: string[];
  searchableArrayFields?: string[];
  searchableListRelationFields?: string[];
  searchableEnumFields?: Record<string, string[]>;
  filterableFields?: string[];
  filterableListRelationFields?: string[];
}

export interface PrismaStringFilter {
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  equals?: string;
  in?: string[];
  notIn?: string[];
  lt?: string;
  lte?: string;
  gt?: string;
  gte?: string;
  not?: PrismaStringFilter | string;
  mode?: "insensitive" | "default";
  [key: string]: unknown;
}

export interface PrismaWhereConditions {
  OR?: Record<string, unknown>[];
  AND?: Record<string, unknown>[];
  NOT?: Record<string, unknown>[];
  [key: string]: unknown;
}

export interface PrismaNumberFilter {
  equals?: number;
  notIn?: number[];
  in?: number[];
  lt?: number;
  lte?: number;
  gt?: number;
  gte?: number;
  not?: PrismaNumberFilter | number;
  [key: string]: unknown;
}


export interface IQueryResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}
