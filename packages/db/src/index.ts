import pg from 'pg';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { Pool } = pg;

export interface DatabaseConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  max?: number;
}

let pool: pg.Pool | null = null;

export function getPool(config?: DatabaseConfig): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: config?.connectionString || process.env.DATABASE_URL,
      max: config?.max || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('[DB] Unexpected pool error:', err);
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Execute a query within a tenant context (sets RLS variable)
 */
export async function withTenant<T>(
  tenantId: string,
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query(`SET LOCAL app.tenant_id = '${tenantId}'`);
    const result = await fn(client);
    return result;
  } finally {
    client.release();
  }
}

/**
 * Execute a query within a transaction and tenant context
 */
export async function withTenantTx<T>(
  tenantId: string,
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query(`SET LOCAL app.tenant_id = '${tenantId}'`);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Simple query helper
 */
export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  return getPool().query<T>(text, params);
}

// Types
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  industry: string;
  profile: Record<string, any>;
  negotiation: NegotiationConfig;
  wa_config: WhatsAppConfig;
  settings: Record<string, any>;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface NegotiationConfig {
  budget_share: number;
  ladder: number[];
  max_rounds: number;
  price_lock_hours: number;
  require_give_for_get: boolean;
  handoff_value_threshold: number;
}

export interface WhatsAppConfig {
  phone_number_id?: string;
  access_token?: string;
  business_account_id?: string;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'owner' | 'admin' | 'sales' | 'viewer';
  avatar_url?: string;
  active: boolean;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  tenant_id: string;
  sku: string;
  name: string;
  price: number;
  tier_raw?: string;
  tiers: Tier[];
  coefficient: number;
  category?: string;
  unit: string;
  description?: string;
  related_raw?: string;
  function_summary?: string;
  use_cases?: string[];
  enriched_hash?: string;
  embedding?: number[];
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Tier {
  minQty: number;
  discountPct: number;
}

export interface Contact {
  id: string;
  tenant_id: string;
  wa_id: string;
  name?: string;
  company?: string;
  phone?: string;
  fields: Record<string, any>;
  lead_score: number;
  stage: 'new' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  tags: string[];
  opted_out: boolean;
  opted_out_at?: Date;
  last_seen_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Conversation {
  id: string;
  tenant_id: string;
  contact_id: string;
  mode: 'ai' | 'human' | 'paused';
  assigned_user?: string;
  summary?: string;
  last_intent?: string;
  deal_stage: string;
  products_discussed: string[];
  last_inbound_at?: Date;
  last_message_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  tenant_id: string;
  conversation_id: string;
  direction: 'in' | 'out';
  sender: 'customer' | 'ai' | 'human' | 'system';
  wa_message_id?: string;
  type: string;
  body?: string;
  media?: Record<string, any>;
  meta?: Record<string, any>;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  feedback?: 'up' | 'down';
  correction?: string;
  created_at: Date;
}

export interface Negotiation {
  id: string;
  tenant_id: string;
  conversation_id: string;
  sku: string;
  qty: number;
  round: number;
  current_extra_pct: number;
  last_offer_unit_price?: number;
  status: 'open' | 'accepted' | 'rejected' | 'expired' | 'handoff';
  locked_until?: Date;
  history: NegotiationRound[];
  created_at: Date;
  updated_at: Date;
}

export interface NegotiationRound {
  round: number;
  extraPct: number;
  unitPrice: number;
  customerGives?: string;
  timestamp: string;
}

export interface Quote {
  id: string;
  tenant_id: string;
  conversation_id: string;
  contact_id: string;
  lines: QuoteLine[];
  subtotal: number;
  discount_total: number;
  total: number;
  notes?: string;
  valid_until?: Date;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  created_at: Date;
  updated_at: Date;
}

export interface QuoteLine {
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
  originalPrice: number;
  discountPct: number;
  subtotal: number;
}

export interface Document {
  id: string;
  tenant_id: string;
  kind: 'company_profile' | 'brochure' | 'price_list' | 'other';
  title: string;
  filename: string;
  storage_key: string;
  size_bytes?: number;
  mime_type?: string;
  wa_media_id?: string;
  wa_media_expires_at?: Date;
  created_at: Date;
}

export interface FollowUp {
  id: string;
  tenant_id: string;
  conversation_id: string;
  contact_id: string;
  scheduled_at: Date;
  type: 'auto' | 'manual';
  template_name?: string;
  message?: string;
  status: 'pending' | 'sent' | 'skipped' | 'cancelled';
  attempt: number;
  max_attempts: number;
  sent_at?: Date;
  created_at: Date;
}

export interface AiEvent {
  id: number;
  tenant_id: string;
  conversation_id?: string;
  kind: string;
  model?: string;
  tokens_in?: number;
  tokens_out?: number;
  duration_ms?: number;
  payload?: Record<string, any>;
  created_at: Date;
}
