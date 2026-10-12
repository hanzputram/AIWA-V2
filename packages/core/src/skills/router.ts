/**
 * AIWA v2 - Skill Router
 *
 * Maps intent + deal stage -> relevant skills.
 * Uses static mapping (not LLM) for determinism and speed.
 */

export interface SkillMap {
  always: string[];
  by_intent: Record<string, string[]>;
  modifiers: Record<string, string[]>;
  max_skills_per_turn: number;
}

export const DEFAULT_SKILL_MAP: SkillMap = {
  always: [
    'tone-matching',
    'response-length-calibration',
    'compliance-handling',
    'fallback-gracefully',
  ],
  by_intent: {
    greeting: ['building-rapport', 'active-listening'],
    product_inquiry: ['product-knowledge', 'asking-effective-questions', 'intent-detection'],
    price_request: ['pricing-discussion-logic'],
    negotiation: ['pricing-negotiation', 'negotiation', 'micro-commitment-stacking'],
    objection: ['objection-recognition', 'objection-handling'],
    ready_to_buy: ['closing', 'buying-signal-amplification'],
    company_info: ['attachment-media-handling'],
    complaint: ['negative-sentiment-de-escalation', 'handoff-detection'],
    off_topic: ['out-of-scope-request-handling'],
    follow_up: ['follow-up-discipline', 'ghost-recovery-sequences'],
    qualification: ['lead-qualification-logic', 'budget-extraction-qualification'],
  },
  modifiers: {
    cross_sell_window: ['cross-sell-upsell-detection', 'deal-upselling'],
    stalled: ['ghost-recovery-sequences', 'conversation-resurrection'],
    high_value: ['decision-maker-identification', 'scarcity-urgency-calibration'],
  },
  max_skills_per_turn: 5,
};

export interface SkillRouterFlags {
  crossSell?: boolean;
  stalled?: boolean;
  highValue?: boolean;
}

/**
 * Pick skills based on intent and conversation flags
 */
export function pickSkills(
  intent: string,
  flags: SkillRouterFlags,
  cfg: SkillMap = DEFAULT_SKILL_MAP
): string[] {
  const names = new Set<string>(cfg.always);

  // Add intent-specific skills
  const intentSkills = cfg.by_intent[intent] ?? [];
  for (const n of intentSkills) {
    names.add(n);
  }

  // Add modifier skills
  if (flags.crossSell) {
    for (const n of cfg.modifiers.cross_sell_window ?? []) names.add(n);
  }
  if (flags.stalled) {
    for (const n of cfg.modifiers.stalled ?? []) names.add(n);
  }
  if (flags.highValue) {
    for (const n of cfg.modifiers.high_value ?? []) names.add(n);
  }

  // Always skills + up to max_skills_per_turn additional
  const alwaysCount = cfg.always.length;
  const all = [...names];
  return all.slice(0, cfg.max_skills_per_turn + alwaysCount);
}

/**
 * Get all known intents
 */
export function getKnownIntents(cfg: SkillMap = DEFAULT_SKILL_MAP): string[] {
  return Object.keys(cfg.by_intent);
}
