/**
 * AIWA v2 - Catalog Search
 *
 * Hybrid search: exact SKU → fuzzy name (pg_trgm) → semantic (pgvector)
 * Results are merged via Reciprocal Rank Fusion.
 */

import type pg from 'pg';
import type { Product } from '@aiwa/db';

export interface SearchOptions {
  tenantId: string;
  query: string;
  category?: string;
  limit?: number;
  includeInactive?: boolean;
}

export interface SearchResult {
  product: Product;
  score: number;
  matchType: 'exact_sku' | 'fuzzy' | 'semantic' | 'combined';
}

export interface CrossSellOptions {
  tenantId: string;
  sku: string;
  limit?: number;
}

export interface CrossSellResult {
  product: Product;
  relationType: string;
  score: number;
  reason: string;
}

/**
 * Hybrid product search
 */
export async function searchProducts(
  client: pg.PoolClient,
  opts: SearchOptions
): Promise<SearchResult[]> {
  const { tenantId, query, category, limit = 8 } = opts;
  const activeFilter = opts.includeInactive ? '' : 'AND active = true';
  const categoryFilter = category ? `AND category = $3` : '';
  const params: any[] = [tenantId, query];
  if (category) params.push(category);

  // 1. Exact SKU match
  const skuResult = await client.query<Product>(
    `SELECT * FROM products
     WHERE tenant_id = $1 AND LOWER(sku) = LOWER($2) ${activeFilter}
     LIMIT 1`,
    [tenantId, query]
  );

  if (skuResult.rows.length > 0) {
    return [{ product: skuResult.rows[0], score: 1.0, matchType: 'exact_sku' }];
  }

  // 2. Fuzzy name search (pg_trgm)
  const fuzzyResult = await client.query<Product & { similarity: number }>(
    `SELECT *, similarity(name, $2) AS similarity
     FROM products
     WHERE tenant_id = $1 ${activeFilter} ${categoryFilter}
       AND (similarity(name, $2) > 0.15 OR name ILIKE '%' || $2 || '%' OR sku ILIKE '%' || $2 || '%')
     ORDER BY similarity DESC
     LIMIT ${limit * 2}`,
    params
  );

  // 3. Semantic search (if embedding available - placeholder for now)
  // Will be integrated once products are enriched with embeddings

  // Combine results with RRF
  const resultMap = new Map<string, SearchResult>();

  for (let i = 0; i < fuzzyResult.rows.length; i++) {
    const row = fuzzyResult.rows[i];
    const key = `${row.tenant_id}:${row.sku}`;
    const rrf = 1 / (60 + i); // RRF with k=60
    const existing = resultMap.get(key);
    if (existing) {
      existing.score += rrf;
      existing.matchType = 'combined';
    } else {
      resultMap.set(key, {
        product: row,
        score: rrf + (row.similarity || 0) * 0.5,
        matchType: 'fuzzy',
      });
    }
  }

  return [...resultMap.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Semantic search using vector similarity
 */
export async function searchSemantic(
  client: pg.PoolClient,
  tenantId: string,
  embedding: number[],
  limit = 10
): Promise<SearchResult[]> {
  const result = await client.query<Product & { sim: number }>(
    `SELECT *, 1 - (embedding <=> $2::vector) AS sim
     FROM products
     WHERE tenant_id = $1 AND active = true AND embedding IS NOT NULL
     ORDER BY embedding <=> $2::vector
     LIMIT $3`,
    [tenantId, JSON.stringify(embedding), limit]
  );

  return result.rows.map((row, i) => ({
    product: row,
    score: row.sim,
    matchType: 'semantic' as const,
  }));
}

/**
 * Get cross-sell / related product suggestions
 */
export async function suggestRelated(
  client: pg.PoolClient,
  opts: CrossSellOptions
): Promise<CrossSellResult[]> {
  const { tenantId, sku, limit = 5 } = opts;

  const result = await client.query<Product & { rel_type: string; rel_score: number; rel_source: string }>(
    `SELECT p.*, r.type AS rel_type, r.score AS rel_score, r.source AS rel_source
     FROM product_relations r
     JOIN products p ON p.tenant_id = r.tenant_id AND p.sku = r.to_sku
     WHERE r.tenant_id = $1 AND r.from_sku = $2 AND p.active = true
     ORDER BY r.score DESC
     LIMIT $3`,
    [tenantId, sku, limit]
  );

  const typeLabels: Record<string, string> = {
    complement: 'Pelengkap',
    accessory: 'Aksesori',
    consumable: 'Habis pakai',
    upgrade: 'Peningkatan',
    substitute: 'Alternatif',
    bundle: 'Bundel',
  };

  return result.rows.map((row) => ({
    product: row,
    relationType: row.rel_type,
    score: row.rel_score,
    reason: `${typeLabels[row.rel_type] ?? row.rel_type} dari ${sku}`,
  }));
}

/**
 * Format search results for AI consumption
 */
export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return 'Tidak ada produk yang ditemukan.';

  return results
    .map((r) => {
      const p = r.product;
      const parts = [
        `SKU: ${p.sku}`,
        `Nama: ${p.name}`,
        `Harga: Rp ${p.price.toLocaleString('id-ID')}/${p.unit}`,
      ];
      if (p.category) parts.push(`Kategori: ${p.category}`);
      if (p.description) parts.push(`Deskripsi: ${p.description}`);
      if (p.tier_raw) parts.push(`Diskon tier: ${p.tier_raw}`);
      return parts.join(' | ');
    })
    .join('\n');
}
