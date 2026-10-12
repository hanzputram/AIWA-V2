/**
 * AIWA v2 - Negotiation Engine
 *
 * Stepped negotiation with decreasing concessions.
 * Price never goes below floor. Each concession requires give-for-get.
 */

import { PricedProduct, unitPrice, headroomPct, UnitPriceResult } from './quote.js';

export interface NegoState {
  round: number;
  extraPct: number;
}

export interface NegoCfg {
  budget_share: number;   // fraction of headroom available for negotiation
  ladder: number[];       // cumulative fraction of budget per round
  max_rounds: number;
  price_lock_hours: number;
  require_give_for_get: boolean;
  handoff_value_threshold: number;
}

export type CustomerGive = 'qty_up' | 'faster_payment' | 'close_today' | 'none';

export interface NegotiationResult {
  allowed: boolean;
  reason?: string;
  state?: NegoState;
  offer?: UnitPriceResult;
  isFinal?: boolean;
  message?: string;
}

const DEFAULT_CFG: NegoCfg = {
  budget_share: 0.6,
  ladder: [0.5, 0.8, 1.0],
  max_rounds: 3,
  price_lock_hours: 24,
  require_give_for_get: true,
  handoff_value_threshold: 50_000_000,
};

export function getDefaultNegoCfg(): NegoCfg {
  return { ...DEFAULT_CFG };
}

/**
 * Calculate the next negotiation offer
 */
export function nextOffer(
  p: PricedProduct,
  qty: number,
  state: NegoState,
  cfg: NegoCfg,
  customerGives: CustomerGive = 'none'
): NegotiationResult {
  // Max rounds reached
  if (state.round >= cfg.max_rounds) {
    return {
      allowed: false,
      reason: 'max_rounds',
      message: 'Harga yang kami tawarkan sudah merupakan penawaran terbaik kami.',
      offer: unitPrice(p, qty, state.extraPct),
    };
  }

  // Check if give-for-get is required but not provided
  if (cfg.require_give_for_get && state.round > 0 && customerGives === 'none') {
    return {
      allowed: false,
      reason: 'require_give',
      message: 'Kami bisa memberikan penawaran lebih baik jika ada imbal balik, misalnya penambahan kuantitas atau pembayaran lebih cepat.',
      offer: unitPrice(p, qty, state.extraPct),
    };
  }

  const budget = headroomPct(p, qty) * cfg.budget_share;
  const ladderStep = cfg.ladder[state.round] ?? 1;
  const targetExtra = budget * ladderStep;

  const offer = unitPrice(p, qty, targetExtra);
  const newRound = state.round + 1;

  return {
    allowed: true,
    state: { round: newRound, extraPct: targetExtra },
    offer,
    isFinal: newRound >= cfg.max_rounds || offer.atFloor,
    message: offer.atFloor
      ? 'Ini adalah harga terbaik yang bisa kami berikan.'
      : newRound >= cfg.max_rounds
        ? 'Ini adalah penawaran terakhir kami.'
        : undefined,
  };
}

/**
 * Check if a requested price is below the floor
 */
export function isBelowFloor(p: PricedProduct, requestedPrice: number): boolean {
  const floor = Math.ceil(p.price * p.coefficient);
  return requestedPrice < floor;
}

/**
 * Calculate what discount % a requested price would imply
 */
export function impliedDiscountPct(p: PricedProduct, requestedPrice: number): number {
  return ((p.price - requestedPrice) / p.price) * 100;
}

/**
 * Check if transaction value exceeds handoff threshold
 */
export function exceedsHandoffThreshold(
  items: { unitPrice: number; qty: number }[],
  cfg: NegoCfg
): boolean {
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  return total >= cfg.handoff_value_threshold;
}

export { DEFAULT_CFG };
