/**
 * AIWA v2 - Gemini LLM Client
 *
 * Wraps @google/genai with retry, cost logging, and rate limiting.
 */

import { GoogleGenAI } from '@google/genai';
import type { Content, Part, Tool, GenerateContentResponse } from '@google/genai';

export interface LLMConfig {
  apiKey: string;
  model: string;
  fastModel: string;
  embedModel: string;
  embedDim: number;
  maxRetries: number;
  retryDelayMs: number;
}

export interface GenerateOptions {
  model?: 'default' | 'fast';
  systemInstruction?: string;
  messages: Content[];
  tools?: Tool[];
  temperature?: number;
  maxOutputTokens?: number;
  responseSchema?: any;
}

export interface GenerateResult {
  text: string;
  functionCalls: FunctionCall[];
  tokensIn: number;
  tokensOut: number;
  model: string;
  durationMs: number;
}

export interface FunctionCall {
  name: string;
  args: Record<string, any>;
}

export interface EmbedResult {
  embedding: number[];
  model: string;
}

const DEFAULT_CONFIG: Partial<LLMConfig> = {
  maxRetries: 3,
  retryDelayMs: 1000,
  embedDim: 768,
};

export class LLMClient {
  private client: GoogleGenAI;
  private config: LLMConfig;

  constructor(config: Partial<LLMConfig> & { apiKey: string }) {
    this.config = { ...DEFAULT_CONFIG, ...config } as LLMConfig;
    this.client = new GoogleGenAI({ apiKey: this.config.apiKey });
  }

  /**
   * Generate text/function calls with retry
   */
  async generate(options: GenerateOptions): Promise<GenerateResult> {
    // 1. Check if Anthropic Claude is configured
    if (process.env.ANTHROPIC_API_KEY) {
      const claudeModel = options.model === 'fast'
        ? (process.env.ANTHROPIC_FAST_MODEL || 'claude-haiku-4-5-20251001')
        : (process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929');

      try {
        const start = Date.now();
        const claudeMessages: any[] = [];
        for (const msg of options.messages) {
          const role = msg.role === 'model' ? 'assistant' : 'user';
          const text = (msg.parts || []).map((p: any) => p.text || '').join('');
          if (text) {
            claudeMessages.push({ role, content: text });
          }
        }

        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: claudeModel,
            max_tokens: options.maxOutputTokens ?? 2048,
            temperature: options.temperature ?? 0.7,
            system: options.systemInstruction,
            messages: claudeMessages,
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const text = data.content?.[0]?.text || '';
          return {
            text,
            functionCalls: [],
            tokensIn: data.usage?.input_tokens ?? 0,
            tokensOut: data.usage?.output_tokens ?? 0,
            model: claudeModel,
            durationMs: Date.now() - start,
          };
        }
      } catch (anthropicErr) {
        console.warn('[LLM] Anthropic call failed, falling back to Gemini:', (anthropicErr as Error).message);
      }
    }

    const modelName = options.model === 'fast'
      ? this.config.fastModel
      : this.config.model;

    const start = Date.now();

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await this.client.models.generateContent({
          model: modelName,
          contents: options.messages,
          config: {
            systemInstruction: options.systemInstruction,
            tools: options.tools,
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxOutputTokens ?? 2048,
            ...(options.responseSchema ? {
              responseMimeType: 'application/json',
              responseSchema: options.responseSchema,
            } : {}),
          },
        });

        const durationMs = Date.now() - start;
        const candidate = response.candidates?.[0];
        const parts = candidate?.content?.parts ?? [];

        // Extract text
        const textParts = parts
          .filter((p: any) => p.text)
          .map((p: any) => p.text);
        const text = textParts.join('');

        // Extract function calls
        const functionCalls: FunctionCall[] = parts
          .filter((p: any) => p.functionCall)
          .map((p: any) => ({
            name: p.functionCall.name,
            args: p.functionCall.args ?? {},
          }));

        // Token usage
        const usage = response.usageMetadata;

        return {
          text,
          functionCalls,
          tokensIn: usage?.promptTokenCount ?? 0,
          tokensOut: usage?.candidatesTokenCount ?? 0,
          model: modelName,
          durationMs,
        };
      } catch (err: any) {
        if (attempt === this.config.maxRetries) throw err;

        // Retry on rate limit or server errors
        const status = err?.status ?? err?.code;
        if (status === 429 || status >= 500) {
          const delay = this.config.retryDelayMs * Math.pow(2, attempt);
          console.warn(`[LLM] Retry ${attempt + 1}/${this.config.maxRetries} after ${delay}ms`);
          await this.sleep(delay);
          continue;
        }
        throw err;
      }
    }

    throw new Error('[LLM] Should not reach here');
  }

  /**
   * Generate embeddings for text
   */
  async embed(text: string): Promise<EmbedResult> {
    const response = await this.client.models.embedContent({
      model: this.config.embedModel,
      contents: [{ role: 'user', parts: [{ text }] }],
      config: { outputDimensionality: this.config.embedDim || 768 },
    });

    return {
      embedding: (response as any).embeddings?.[0]?.values ??
        (response as any).embedding?.values ?? [],
      model: this.config.embedModel,
    };
  }

  /**
   * Batch embed multiple texts
   */
  async embedBatch(texts: string[], batchSize = 10): Promise<EmbedResult[]> {
    const results: EmbedResult[] = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const embeddings = await Promise.all(batch.map((t) => this.embed(t)));
      results.push(...embeddings);
    }
    return results;
  }

  /**
   * Classify intent using fast model with structured output
   */
  async classifyIntent(
    message: string,
    context: string,
    intents: string[]
  ): Promise<{ intent: string; confidence: number }> {
    const result = await this.generate({
      model: 'fast',
      systemInstruction: `Kamu adalah classifier intent. Jawab dalam JSON.
Pilih satu intent dari daftar: ${intents.join(', ')}.
Konteks percakapan: ${context}`,
      messages: [{ role: 'user', parts: [{ text: message }] }],
      temperature: 0.1,
      responseSchema: {
        type: 'object',
        properties: {
          intent: { type: 'string', enum: intents },
          confidence: { type: 'number' },
        },
        required: ['intent', 'confidence'],
      },
    });

    try {
      return JSON.parse(result.text);
    } catch {
      return { intent: 'product_inquiry', confidence: 0.5 };
    }
  }

  /**
   * Summarize a conversation
   */
  async summarize(messages: string[]): Promise<string> {
    const result = await this.generate({
      model: 'fast',
      systemInstruction: 'Buat ringkasan singkat percakapan berikut dalam 2-3 kalimat bahasa Indonesia. Fokus pada produk yang dibahas, harga, dan status negosiasi.',
      messages: [{
        role: 'user',
        parts: [{ text: messages.join('\n') }],
      }],
      temperature: 0.3,
      maxOutputTokens: 300,
    });
    return result.text;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create LLM client from environment variables
 */
export function createLLMClient(): LLMClient {
  return new LLMClient({
    apiKey: process.env.GEMINI_API_KEY!,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    fastModel: process.env.GEMINI_FAST_MODEL || 'gemini-2.5-flash',
    embedModel: process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001',
    embedDim: parseInt(process.env.EMBED_DIM || '768'),
    maxRetries: 3,
    retryDelayMs: 1000,
  });
}
