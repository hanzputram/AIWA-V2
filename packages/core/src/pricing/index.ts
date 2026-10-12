export { parseTiers, tierPctForQty, formatTiers } from './tiers.js';
export type { Tier } from './tiers.js';

export {
  floorPrice, unitPrice, headroomPct,
  buildQuote, formatRupiah, formatQuoteForChat
} from './quote.js';
export type { PricedProduct, UnitPriceResult, QuoteLine, QuoteResult } from './quote.js';

export {
  nextOffer, isBelowFloor, impliedDiscountPct,
  exceedsHandoffThreshold, getDefaultNegoCfg
} from './negotiation.js';
export type { NegoState, NegoCfg, CustomerGive, NegotiationResult } from './negotiation.js';
