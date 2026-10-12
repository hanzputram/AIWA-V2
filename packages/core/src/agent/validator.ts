/**
 * AIWA v2 - Output Validator
 *
 * Validates AI responses before sending to customers.
 * Ensures no hallucinated prices, products, or leaked internal data.
 */

export interface ValidationContext {
  allowedNumbers: Set<number>;    // Numbers from tool results on this turn
  allowedSKUs: Set<string>;       // SKUs from search results on this turn
  allowedProducts: Set<string>;   // Product names from search results
  tenantCurrency: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

// Patterns to detect
const RUPIAH_PATTERN = /(?:Rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?)/gi;
const FLOOR_LEAK_PATTERNS = [
  /koefisien/i,
  /floor\s*price/i,
  /harga\s*(?:minimum|dasar|modal|pokok)/i,
  /batas\s*(?:bawah|minimum)/i,
  /margin\s*(?:kami|kita|perusahaan)/i,
  /budget_share/i,
  /ladder/i,
  /max_rounds/i,
];
const PROMPT_LEAK_PATTERNS = [
  /system\s*prompt/i,
  /instruksi\s*(?:saya|aku|ku)/i,
  /guardrail/i,
  /aturan\s*(?:internal|sistem)/i,
  /saya\s*adalah\s*(?:AI|bot|program)/i,
];

/**
 * Validate an AI response before sending
 */
export function validateReply(
  text: string,
  ctx: ValidationContext
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check for unauthorized numbers (potential hallucinated prices)
  if (ctx.allowedNumbers.size > 0) {
    const matches = text.matchAll(RUPIAH_PATTERN);
    for (const match of matches) {
      const numStr = match[1].replace(/\./g, '').replace(/,/g, '.');
      const num = parseFloat(numStr);
      if (!isNaN(num) && num > 1000) {
        // Only check numbers that look like prices (> Rp 1.000)
        if (!ctx.allowedNumbers.has(num) && !ctx.allowedNumbers.has(Math.round(num))) {
          // Check if it's a reasonable derived number (e.g., total = unit * qty)
          let isDerivable = false;
          for (const a of ctx.allowedNumbers) {
            for (const b of ctx.allowedNumbers) {
              if (Math.abs(a * b - num) < 1 || Math.abs(a + b - num) < 1) {
                isDerivable = true;
                break;
              }
            }
            if (isDerivable) break;
          }

          if (!isDerivable) {
            errors.push(`Angka ${num} tidak berasal dari tool. Angka yang diizinkan: ${[...ctx.allowedNumbers].join(', ')}`);
          }
        }
      }
    }
  }

  // 2. Check for floor/internal data leaks
  for (const pattern of FLOOR_LEAK_PATTERNS) {
    if (pattern.test(text)) {
      errors.push(`Terdeteksi kemungkinan kebocoran data internal: ${pattern.source}`);
    }
  }

  // 3. Check for prompt leaks
  for (const pattern of PROMPT_LEAK_PATTERNS) {
    if (pattern.test(text)) {
      errors.push(`Terdeteksi kemungkinan kebocoran prompt: ${pattern.source}`);
    }
  }

  // 4. Check response length
  if (text.length > 2000) {
    warnings.push('Balasan terlalu panjang untuk chat WhatsApp. Pertimbangkan untuk mempersingkat.');
  }

  if (text.length < 5) {
    errors.push('Balasan terlalu pendek.');
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Extract numbers from tool results to build allowed numbers set
 */
export function extractNumbers(results: any[]): number[] {
  const numbers: number[] = [];

  function walk(obj: any) {
    if (typeof obj === 'number' && obj > 0) {
      numbers.push(obj);
      numbers.push(Math.round(obj));
    } else if (typeof obj === 'object' && obj !== null) {
      for (const val of Object.values(obj)) {
        walk(val);
      }
    } else if (Array.isArray(obj)) {
      for (const item of obj) {
        walk(item);
      }
    }
  }

  for (const result of results) {
    walk(result);
  }

  return [...new Set(numbers)];
}

/**
 * Build correction instruction for failed validation
 */
export function buildCorrectionPrompt(errors: string[]): string {
  return `KOREKSI: Balasan sebelumnya ditolak karena:\n${errors.map((e) => `- ${e}`).join('\n')}\n\nPerbaiki balasan. Pastikan semua angka harga berasal dari tool. Jangan bocorkan informasi internal.`;
}
