import type { DatabaseSync } from "node:sqlite";
import { truncateUtf16Safe } from "../utils.js";
import { cosineSimilarity, parseEmbedding } from "./internal.js";

const vectorToBlob = (embedding: number[]): Buffer =>
  Buffer.from(new Float32Array(embedding).buffer);

export type SearchSource = string;

export type SearchRowResult = {
  id: string;
  path: string;
  startLine: number;
  endLine: number;
  score: number;
  snippet: string;
  source: SearchSource;
  updatedAt: number;
};

export async function searchVector(params: {
  db: DatabaseSync;
  vectorTable: string;
  providerModel: string;
  queryVec: number[];
  limit: number;
  snippetMaxChars: number;
  ensureVectorReady: (dimensions: number) => Promise<boolean>;
  sourceFilterVec: { sql: string; params: SearchSource[] };
  sourceFilterChunks: { sql: string; params: SearchSource[] };
  pathFilter?: string;
}): Promise<SearchRowResult[]> {
  if (params.queryVec.length === 0 || params.limit <= 0) return [];
  const pathSql = params.pathFilter ? ` AND c.path = ?` : "";
  const pathParams = params.pathFilter ? [params.pathFilter] : [];
  if (await params.ensureVectorReady(params.queryVec.length)) {
    const rows = params.db
      .prepare(
        `SELECT c.id, c.path, c.start_line, c.end_line, c.text,\n` +
          `       c.source, c.updated_at,\n` +
          `       vec_distance_cosine(v.embedding, ?) AS dist\n` +
          `  FROM ${params.vectorTable} v\n` +
          `  JOIN chunks c ON c.id = v.id\n` +
          ` WHERE c.model = ?${params.sourceFilterVec.sql}${pathSql}\n` +
          ` ORDER BY dist ASC\n` +
          ` LIMIT ?`,
      )
      .all(
        vectorToBlob(params.queryVec),
        params.providerModel,
        ...params.sourceFilterVec.params,
        ...pathParams,
        params.limit,
      ) as Array<{
      id: string;
      path: string;
      start_line: number;
      end_line: number;
      text: string;
      source: SearchSource;
      updated_at: number;
      dist: number;
    }>;
    return rows.map((row) => ({
      id: row.id,
      path: row.path,
      startLine: row.start_line,
      endLine: row.end_line,
      score: 1 - row.dist,
      snippet: truncateUtf16Safe(row.text, params.snippetMaxChars),
      source: row.source,
      updatedAt: row.updated_at,
    }));
  }

  const candidates = listChunks({
    db: params.db,
    providerModel: params.providerModel,
    sourceFilter: params.sourceFilterChunks,
    pathFilter: params.pathFilter,
  });
  const scored = candidates
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(params.queryVec, chunk.embedding),
    }))
    .filter((entry) => Number.isFinite(entry.score));
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, params.limit)
    .map((entry) => ({
      id: entry.chunk.id,
      path: entry.chunk.path,
      startLine: entry.chunk.startLine,
      endLine: entry.chunk.endLine,
      score: entry.score,
      snippet: truncateUtf16Safe(entry.chunk.text, params.snippetMaxChars),
      source: entry.chunk.source,
      updatedAt: entry.chunk.updatedAt,
    }));
}

export function listChunks(params: {
  db: DatabaseSync;
  providerModel: string;
  sourceFilter: { sql: string; params: SearchSource[] };
  pathFilter?: string;
}): Array<{
  id: string;
  path: string;
  startLine: number;
  endLine: number;
  text: string;
  embedding: number[];
  source: SearchSource;
  updatedAt: number;
}> {
  const pathSql = params.pathFilter ? ` AND path = ?` : "";
  const pathParams = params.pathFilter ? [params.pathFilter] : [];
  const rows = params.db
    .prepare(
      `SELECT id, path, start_line, end_line, text, embedding, source, updated_at\n` +
        `  FROM chunks\n` +
        ` WHERE model = ?${params.sourceFilter.sql}${pathSql}`,
    )
    .all(params.providerModel, ...params.sourceFilter.params, ...pathParams) as Array<{
    id: string;
    path: string;
    start_line: number;
    end_line: number;
    text: string;
    embedding: string;
    source: SearchSource;
    updated_at: number;
  }>;

  return rows.map((row) => ({
    id: row.id,
    path: row.path,
    startLine: row.start_line,
    endLine: row.end_line,
    text: row.text,
    embedding: parseEmbedding(row.embedding),
    source: row.source,
    updatedAt: row.updated_at,
  }));
}

export async function searchKeyword(params: {
  db: DatabaseSync;
  ftsTable: string;
  providerModel: string;
  query: string;
  limit: number;
  snippetMaxChars: number;
  sourceFilter: { sql: string; params: SearchSource[] };
  buildFtsQuery: (raw: string) => string | null;
  bm25RankToScore: (rank: number) => number;
  pathFilter?: string;
}): Promise<Array<SearchRowResult & { textScore: number }>> {
  if (params.limit <= 0) return [];
  const ftsQuery = params.buildFtsQuery(params.query);
  if (!ftsQuery) return [];

  const pathSql = params.pathFilter ? ` AND path = ?` : "";
  const pathParams = params.pathFilter ? [params.pathFilter] : [];
  const rows = params.db
    .prepare(
      `SELECT id, path, source, start_line, end_line, text,\n` +
        `       bm25(${params.ftsTable}) AS rank\n` +
        `  FROM ${params.ftsTable}\n` +
        ` WHERE ${params.ftsTable} MATCH ? AND model = ?${params.sourceFilter.sql}${pathSql}\n` +
        ` ORDER BY rank ASC\n` +
        ` LIMIT ?`,
    )
    .all(
      ftsQuery,
      params.providerModel,
      ...params.sourceFilter.params,
      ...pathParams,
      params.limit,
    ) as Array<{
    id: string;
    path: string;
    source: SearchSource;
    start_line: number;
    end_line: number;
    text: string;
    rank: number;
  }>;

  // FTS table lacks updated_at; do secondary lookup from chunks table
  const ids = rows.map((r) => r.id);
  const updatedAtMap = new Map<string, number>();
  if (ids.length > 0) {
    const placeholders = ids.map(() => "?").join(", ");
    const chunkRows = params.db
      .prepare(`SELECT id, updated_at FROM chunks WHERE id IN (${placeholders})`)
      .all(...ids) as Array<{ id: string; updated_at: number }>;
    for (const cr of chunkRows) {
      updatedAtMap.set(cr.id, cr.updated_at);
    }
  }

  return rows.map((row) => {
    const textScore = params.bm25RankToScore(row.rank);
    return {
      id: row.id,
      path: row.path,
      startLine: row.start_line,
      endLine: row.end_line,
      score: textScore,
      textScore,
      snippet: truncateUtf16Safe(row.text, params.snippetMaxChars),
      source: row.source,
      updatedAt: updatedAtMap.get(row.id) ?? 0,
    };
  });
}
