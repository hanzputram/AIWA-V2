# AIWA v2 - AI Sales WhatsApp Platform

Multi-tenant AI-powered sales assistant for WhatsApp Business.

## Architecture

```
Pelanggan (WhatsApp) → WhatsApp Cloud API → API Gateway (Fastify)
                                                ↓
                                          Redis (BullMQ)
                                                ↓
                                         Workers (AI + Import)
                                                ↓
                                 PostgreSQL + pgvector ← Gemini API
                                                ↑
                                        CRM Dashboard (Next.js)
```

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (for PostgreSQL, Redis, MinIO)
- Gemini API key

### Setup

```bash
# 1. Clone & install
npm install

# 2. Start infrastructure
docker compose up -d postgres redis minio

# 3. Configure environment
cp .env.example .env
# Edit .env with your keys

# 4. Run database migration
npm run db:migrate

# 5. Start development
npm run dev
```

### Project Structure

```
aiwa-v2/
├── apps/
│   ├── api/          # Fastify API (webhooks + REST + SSE)
│   ├── worker/       # BullMQ workers (conversation, import, enrich)
│   └── dashboard/    # Next.js CRM dashboard
├── packages/
│   ├── core/         # Business logic (pricing, catalog, agent, skills, channels, LLM)
│   └── db/           # Database schema, migrations, types
├── config/           # Skill map, industry presets, prompts
├── vendor/           # Sales skills submodule
└── templates/        # Product import templates
```

## Key Design Decisions

1. **AI never calculates prices** - All numbers come from deterministic pricing engine
2. **AI never invents products** - Products must come from catalog search
3. **Skills are configuration** - SKILL.md loaded as prompt fragments per context
4. **Human can always take over** - Dashboard has takeover/release controls
5. **Tenant data isolation** - Row Level Security from day one

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (Node.js LTS) |
| API | Fastify |
| Database | PostgreSQL + pgvector + pg_trgm |
| Queue | Redis + BullMQ |
| AI | Google Gemini (function calling + embeddings) |
| Dashboard | Next.js + Tailwind CSS |
| WhatsApp | Cloud API / BSP adapter |

## License

Private - All rights reserved.
