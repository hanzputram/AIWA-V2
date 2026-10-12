/**
 * AIWA v2 - Quote Calculator
 *
 * All price calculations are deterministic. The AI reads the output
 * of these functions - it never invents prices.
 */

import { Tier, tierPctForQty } from './tiers.js';

export interface PricedProduct {
  sku: string;
  name: string;
  price: number;       // base price in rupiah (integer)
  tiers: Tier[];
  coefficient: number; // floor multiplier, e.g. 0.80 = max 20% total discount
  unit: string;
}

export interface UnitPriceResult {
  tierPct: number;
  extraPct: number;
  totalDiscountPct: number;
  unit: number;         // final unit price (rupiah, integer)
  original: number;     // original price before any discount
  saving: number;       // saving per unit
  atFloor: boolean;     // true if price hit the floor
}

export interface QuoteLine {
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
  originalPrice: number;
  discountPct: number;
  subtotal: number;
  unit: string;
}

export interface QuoteResult {
  lines: QuoteLine[];
  subtotal: number;
  total: number;
}

/**
 * Calculate absolute floor price (minimum allowed)
 */
export function floorPrice(p: PricedProduct): number {
  return Math.ceil(p.price * p.coefficient);
}

/**
 * Calculate unit price with tier discount and optional extra discount
 */
export function unitPrice(p: PricedProduct, qty: number, extraPct = 0): UnitPriceResult {
  const tierPct = tierPctForQty(p.tiers, qty);
  const totalDiscountPct = tierPct + extraPct;
  const raw = p.price * (1 - totalDiscountPct / 100);
  const floor = floorPrice(p);
  const price = Math.max(floor, Math.round(raw));

  return {
    tierPct,
    extraPct,
    totalDiscountPct: price === floor
      ? (1 - floor / p.price) * 100
      : totalDiscountPct,
    unit: price,
    original: p.price,
    saving: p.price - price,
    atFloor: price === floor,
  };
}

/**
 * Remaining discount headroom (in %) after tier, before hitting floor
 */
export function headroomPct(p: PricedProduct, qty: number): number {
  const maxTotal = (1 - p.coefficient) * 100;
  return Math.max(0, maxTotal - tierPctForQty(p.tiers, qty));
}

/**
 * Build a multi-line quote
 */
export function buildQuote(
  items: { product: PricedProduct; qty: number; extraPct?: number }[]
): QuoteResult {
  const lines: QuoteLine[] = items.map(({ product, qty, extraPct }) => {
    const up = unitPrice(product, qty, extraPct);
    return {
      sku: product.sku,
      name: product.name,
      qty,
      unitPrice: up.unit,
      originalPrice: up.original,
      discountPct: up.totalDiscountPct,
      subtotal: up.unit * qty,
      unit: product.unit,
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.subtotal, 0);

  return {
    lines,
    subtotal,
    total: subtotal,
  };
}

/**
 * Format price as Indonesian Rupiah
 */
export function formatRupiah(amount: number): string {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

/**
 * Format quote for WhatsApp message
 */
export function formatQuoteForChat(quote: QuoteResult): string {
  const lines = quote.lines.map((l) => {
    const discount = l.discountPct > 0
      ? ` _(diskon ${l.discountPct.toFixed(1)}%)_`
      : '';
    return `• ${l.name} (${l.sku})\n  ${l.qty} ${l.unit} × ${formatRupiah(l.unitPrice)}${discount}\n  = *${formatRupiah(l.subtotal)}*`;
  });

  return [
    '📋 *Penawaran Harga*\n',
    ...lines,
    '',
    `*Total: ${formatRupiah(quote.total)}*`,
  ].join('\n');
}
