/**
 * AIWA v2 - Pricing Tiers Parser & Calculator
 *
 * Deterministic pricing engine. AI never calculates prices directly -
 * all numbers come from this module.
 */

export interface Tier {
  minQty: number;
  discountPct: number;
}

/**
 * Parse tier string format: "minQty:discountPct;minQty:discountPct;..."
 * Example: "10:5;50:10;100:15" means:
 *   - 10+ units: 5% discount
 *   - 50+ units: 10% discount
 *   - 100+ units: 15% discount
 */
export function parseTiers(raw: string | null | undefined): Tier[] {
  if (!raw || !raw.trim()) return [];

  const tiers = raw
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) => {
      const m = part.match(/^(\d+(?:[.,]\d+)?)\s*:\s*(\d+(?:[.,]\d+)?)\s*%?$/);
      if (!m) throw new Error(`Format tier tidak valid: "${part}"`);
      return {
        minQty: Number(m[1].replace(',', '.')),
        discountPct: Number(m[2].replace(',', '.')),
      };
    })
    .sort((a, b) => a.minQty - b.minQty);

  for (let i = 0; i < tiers.length; i++) {
    if (tiers[i].discountPct < 0 || tiers[i].discountPct >= 100) {
      throw new Error('Diskon harus antara 0-99%');
    }
    if (i > 0 && tiers[i].discountPct < tiers[i - 1].discountPct) {
      throw new Error('Diskon tier harus naik seiring kuantitas');
    }
  }

  return tiers;
}

/**
 * Get applicable tier discount percentage for a given quantity
 */
export function tierPctForQty(tiers: Tier[], qty: number): number {
  return tiers
    .filter((t) => qty >= t.minQty)
    .reduce((max, t) => Math.max(max, t.discountPct), 0);
}

/**
 * Format tiers for display
 */
export function formatTiers(tiers: Tier[]): string {
  if (tiers.length === 0) return 'Tidak ada diskon bertingkat';
  return tiers
    .map((t) => `${t.minQty}+ unit: diskon ${t.discountPct}%`)
    .join(', ');
}
