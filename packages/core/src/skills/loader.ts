/**
 * AIWA v2 - Skill Loader
 *
 * Loads SKILL.md files from the vendor/sales-skills repo.
 * Skills become prompt fragments injected based on conversation context.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

export interface Skill {
  name: string;
  description: string;
  body: string;
  tokenEstimate: number;
}

export interface SkillCard {
  name: string;
  description: string;
  summary: string; // condensed version (400-600 tokens max)
}

/**
 * Load all skills from the vendor directory
 */
export function loadSkills(root = 'vendor/sales-skills/skills'): Map<string, Skill> {
  const map = new Map<string, Skill>();

  if (!existsSync(root)) {
    console.warn(`[Skills] Directory not found: ${root}`);
    return map;
  }

  for (const dir of readdirSync(root, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;

    const skillPath = join(root, dir.name, 'SKILL.md');
    if (!existsSync(skillPath)) continue;

    try {
      const raw = readFileSync(skillPath, 'utf8');
      const { data, content } = matter(raw);

      const body = content.trim();
      // Rough token estimate: ~4 chars per token
      const tokenEstimate = Math.ceil(body.length / 4);

      map.set(data.name ?? dir.name, {
        name: data.name ?? dir.name,
        description: data.description ?? '',
        body,
        tokenEstimate,
      });
    } catch (err) {
      console.error(`[Skills] Error loading ${dir.name}:`, err);
    }
  }

  return map;
}

/**
 * Load pre-built skill cards (condensed summaries)
 */
export function loadSkillCards(
  root = 'config/skill-cards',
  vendorRoot = 'vendor/sales-skills/skills'
): Map<string, SkillCard> {
  const map = new Map<string, SkillCard>();

  // 1. Load pre-built cards if available
  if (existsSync(root)) {
    for (const file of readdirSync(root)) {
      if (!file.endsWith('.md')) continue;
      try {
        const raw = readFileSync(join(root, file), 'utf8');
        const { data, content } = matter(raw);
        const name = data.name ?? file.replace('.md', '');
        map.set(name, {
          name,
          description: data.description ?? '',
          summary: content.trim(),
        });
      } catch (err) {
        console.error(`[Skills] Error loading card ${file}:`, err);
      }
    }
  }

  // 2. Fallback to vendor skills if card not already loaded
  if (existsSync(vendorRoot)) {
    try {
      for (const dir of readdirSync(vendorRoot, { withFileTypes: true })) {
        if (!dir.isDirectory()) continue;
        const skillName = dir.name;
        if (map.has(skillName)) continue;

        const skillPath = join(vendorRoot, skillName, 'SKILL.md');
        if (!existsSync(skillPath)) continue;

        const raw = readFileSync(skillPath, 'utf8');
        const { data, content } = matter(raw);
        // Extract concise summary: take first 1500 chars (approx 350-400 tokens)
        const summary = content.trim().slice(0, 1500);

        map.set(data.name ?? skillName, {
          name: data.name ?? skillName,
          description: data.description ?? '',
          summary,
        });
      }
    } catch (err) {
      console.error('[Skills] Error loading fallback vendor skills:', err);
    }
  }

  return map;
}

/**
 * Audit all skills - measure sizes and validate frontmatter
 */
export function auditSkills(root = 'vendor/sales-skills/skills'): {
  total: number;
  valid: number;
  invalid: string[];
  bySize: { name: string; chars: number; tokens: number }[];
  totalTokens: number;
} {
  const skills = loadSkills(root);
  const invalid: string[] = [];
  const bySize: { name: string; chars: number; tokens: number }[] = [];

  for (const [name, skill] of skills) {
    if (!skill.description) {
      invalid.push(`${name}: missing description`);
    }
    bySize.push({
      name,
      chars: skill.body.length,
      tokens: skill.tokenEstimate,
    });
  }

  bySize.sort((a, b) => b.tokens - a.tokens);

  return {
    total: skills.size,
    valid: skills.size - invalid.length,
    invalid,
    bySize,
    totalTokens: bySize.reduce((sum, s) => sum + s.tokens, 0),
  };
}
