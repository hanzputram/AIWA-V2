-- AIWA v2 - Database Schema
-- Multi-tenant AI Sales WhatsApp Platform

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- TENANTS
-- ============================================================
CREATE TABLE tenants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  industry      text NOT NULL,
  profile       jsonb NOT NULL DEFAULT '{}',
  negotiation   jsonb NOT NULL DEFAULT '{
    "budget_share": 0.6,
    "ladder": [0.5, 0.8, 1.0],
    "max_rounds": 3,
    "price_lock_hours": 24,
    "require_give_for_get": true,
    "handoff_value_threshold": 50000000
  }',
  wa_config     jsonb NOT NULL DEFAULT '{}',
  settings      jsonb NOT NULL DEFAULT '{}',
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email         text NOT NULL,
  password_hash text NOT NULL,
  name          text NOT NULL,
  role          text NOT NULL CHECK (role IN ('owner','admin','sales','viewer')),
  avatar_url    text,
  active        boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sku           text NOT NULL,
  name          text NOT NULL,
  price         bigint NOT NULL CHECK (price > 0),
  tier_raw      text,
  tiers         jsonb NOT NULL DEFAULT '[]',
  coefficient   numeric(6,4) NOT NULL CHECK (coefficient > 0),
  category      text,
  unit          text DEFAULT 'pcs',
  description   text,
  related_raw   text,
  -- AI enrichment fields
  function_summary  text,
  use_cases         text[],
  enriched_hash     text,
  embedding         vector(768),
  active            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, sku)
);

CREATE INDEX products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX products_sku_trgm  ON products USING gin (sku gin_trgm_ops);
CREATE INDEX products_cat       ON products (tenant_id, category);
CREATE INDEX products_active    ON products (tenant_id, active) WHERE active = true;
CREATE INDEX products_vec       ON products USING hnsw (embedding vector_cosine_ops);

-- ============================================================
-- PRODUCT RELATIONS
-- ============================================================
CREATE TABLE product_relations (
  tenant_id uuid NOT NULL,
  from_sku  text NOT NULL,
  to_sku    text NOT NULL,
  type      text NOT NULL CHECK (type IN ('complement','accessory','consumable','upgrade','substitute','bundle')),
  source    text NOT NULL CHECK (source IN ('manual','import','cooccurrence','llm')),
  score     real NOT NULL DEFAULT 0.5,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, from_sku, to_sku, type),
  FOREIGN KEY (tenant_id, from_sku) REFERENCES products(tenant_id, sku) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, to_sku) REFERENCES products(tenant_id, sku) ON DELETE CASCADE
);

-- ============================================================
-- CATALOG IMPORTS
-- ============================================================
CREATE TABLE catalog_imports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  filename      text NOT NULL,
  file_sha256   text NOT NULL,
  storage_key   text NOT NULL,
  status        text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','validating','importing','enriching','done','failed')),
  total_rows    bigint DEFAULT 0,
  ok_rows       bigint DEFAULT 0,
  error_rows    bigint DEFAULT 0,
  error_report_key text,
  started_at    timestamptz,
  finished_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, file_sha256)
);

-- ============================================================
-- CONTACTS
-- ============================================================
CREATE TABLE contacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  wa_id       text NOT NULL,
  name        text,
  company     text,
  phone       text,
  fields      jsonb NOT NULL DEFAULT '{}',
  lead_score  int NOT NULL DEFAULT 0,
  stage       text NOT NULL DEFAULT 'new' CHECK (stage IN ('new','qualified','proposal','negotiation','won','lost')),
  tags        text[] DEFAULT '{}',
  opted_out   boolean NOT NULL DEFAULT false,
  opted_out_at timestamptz,
  last_seen_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, wa_id)
);

CREATE INDEX contacts_stage ON contacts (tenant_id, stage);
CREATE INDEX contacts_score ON contacts (tenant_id, lead_score DESC);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id      uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  mode            text NOT NULL DEFAULT 'ai' CHECK (mode IN ('ai','human','paused')),
  assigned_user   uuid REFERENCES users(id),
  summary         text,
  last_intent     text,
  deal_stage      text DEFAULT 'discovery',
  products_discussed text[] DEFAULT '{}',
  last_inbound_at timestamptz,
  last_message_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX conversations_tenant ON conversations (tenant_id, updated_at DESC);
CREATE INDEX conversations_contact ON conversations (contact_id);
CREATE INDEX conversations_mode ON conversations (tenant_id, mode);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  direction       text NOT NULL CHECK (direction IN ('in','out')),
  sender          text NOT NULL CHECK (sender IN ('customer','ai','human','system')),
  wa_message_id   text UNIQUE,
  type            text NOT NULL DEFAULT 'text',
  body            text,
  media           jsonb,
  meta            jsonb,
  status          text DEFAULT 'sent' CHECK (status IN ('sent','delivered','read','failed')),
  feedback        text CHECK (feedback IN ('up','down')),
  correction      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX messages_conv ON messages (conversation_id, created_at);
CREATE INDEX messages_tenant ON messages (tenant_id, created_at DESC);

-- ============================================================
-- NEGOTIATIONS
-- ============================================================
CREATE TABLE negotiations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sku             text NOT NULL,
  qty             int NOT NULL,
  round           int NOT NULL DEFAULT 0,
  current_extra_pct numeric(5,2) NOT NULL DEFAULT 0,
  last_offer_unit_price bigint,
  status          text NOT NULL DEFAULT 'open' CHECK (status IN ('open','accepted','rejected','expired','handoff')),
  locked_until    timestamptz,
  history         jsonb NOT NULL DEFAULT '[]',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX negotiations_conv ON negotiations (conversation_id, status);

-- ============================================================
-- QUOTES
-- ============================================================
CREATE TABLE quotes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  contact_id      uuid NOT NULL REFERENCES contacts(id),
  lines           jsonb NOT NULL,
  subtotal        bigint NOT NULL,
  discount_total  bigint NOT NULL DEFAULT 0,
  total           bigint NOT NULL,
  notes           text,
  valid_until     timestamptz,
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected','expired')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- DOCUMENTS (PDFs, brochures, etc.)
-- ============================================================
CREATE TABLE documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kind            text NOT NULL CHECK (kind IN ('company_profile','brochure','price_list','other')),
  title           text NOT NULL,
  filename        text NOT NULL,
  storage_key     text NOT NULL,
  size_bytes      bigint,
  mime_type       text,
  wa_media_id     text,
  wa_media_expires_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- FOLLOW-UPS
-- ============================================================
CREATE TABLE follow_ups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  contact_id      uuid NOT NULL REFERENCES contacts(id),
  scheduled_at    timestamptz NOT NULL,
  type            text NOT NULL DEFAULT 'auto' CHECK (type IN ('auto','manual')),
  template_name   text,
  message         text,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','skipped','cancelled')),
  attempt         int NOT NULL DEFAULT 0,
  max_attempts    int NOT NULL DEFAULT 3,
  sent_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX follow_ups_schedule ON follow_ups (scheduled_at) WHERE status = 'pending';

-- ============================================================
-- AI EVENTS (audit & cost tracking)
-- ============================================================
CREATE TABLE ai_events (
  id              bigserial PRIMARY KEY,
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id uuid,
  kind            text NOT NULL,
  model           text,
  tokens_in       int,
  tokens_out      int,
  duration_ms     int,
  payload         jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_events_tenant ON ai_events (tenant_id, created_at DESC);
CREATE INDEX ai_events_kind ON ai_events (kind, created_at DESC);

-- ============================================================
-- WA TEMPLATES
-- ============================================================
CREATE TABLE wa_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            text NOT NULL,
  language        text NOT NULL DEFAULT 'id',
  category        text NOT NULL DEFAULT 'MARKETING',
  components      jsonb NOT NULL DEFAULT '[]',
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','rejected')),
  wa_template_id  text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name, language)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_templates ENABLE ROW LEVEL SECURITY;

-- App role for API connections
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'aiwa_app') THEN
    CREATE ROLE aiwa_app LOGIN PASSWORD 'aiwa_app_dev';
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO aiwa_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aiwa_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aiwa_app;

-- RLS Policies (tenant isolation)
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON products
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON product_relations
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON catalog_imports
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON contacts
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON conversations
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON messages
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON negotiations
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON quotes
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON documents
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON follow_ups
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON ai_events
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON wa_templates
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Staging table for bulk imports
CREATE UNLOGGED TABLE products_staging (
  import_id     uuid NOT NULL,
  tenant_id     uuid NOT NULL,
  sku           text NOT NULL,
  name          text NOT NULL,
  price         bigint NOT NULL,
  tier_raw      text,
  tiers         jsonb NOT NULL DEFAULT '[]',
  coefficient   numeric(6,4) NOT NULL,
  category      text,
  unit          text,
  description   text,
  related_raw   text,
  row_number    int
);

CREATE INDEX staging_import ON products_staging (import_id);
