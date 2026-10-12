/**
 * AIWA v2 - Auth Routes
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { query } from '@aiwa/db';

export async function authRoutes(app: FastifyInstance) {
  // Login
  app.post('/login', async (req: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = req.body as { email: string; password: string };

    const result = await query(
      `SELECT u.*, t.name as tenant_name, t.slug as tenant_slug
       FROM users u JOIN tenants t ON t.id = u.tenant_id
       WHERE u.email = $1 AND u.active = true AND t.active = true`,
      [email]
    );

    if (result.rows.length === 0) {
      return reply.code(401).send({ error: 'Email atau password salah' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return reply.code(401).send({ error: 'Email atau password salah' });
    }

    // Update last login
    await query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [user.id]);

    const token = app.jwt.sign({
      userId: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      role: user.role,
      name: user.name,
    }, { expiresIn: '24h' });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenant_id,
        tenantName: user.tenant_name,
        tenantSlug: user.tenant_slug,
      },
    };
  });

  // Register (creates tenant + owner user)
  app.post('/register', async (req: FastifyRequest, reply: FastifyReply) => {
    const { email, password, name, companyName, industry } = req.body as {
      email: string; password: string; name: string;
      companyName: string; industry: string;
    };

    // Check if email exists
    const existing = await query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existing.rows.length > 0) {
      return reply.code(409).send({ error: 'Email sudah terdaftar' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Create tenant
    const tenantResult = await query(
      `INSERT INTO tenants (name, slug, industry) VALUES ($1, $2, $3) RETURNING id`,
      [companyName, slug + '-' + Date.now(), industry]
    );
    const tenantId = tenantResult.rows[0].id;

    // Create owner user
    const userResult = await query(
      `INSERT INTO users (tenant_id, email, password_hash, name, role)
       VALUES ($1, $2, $3, $4, 'owner') RETURNING id`,
      [tenantId, email, passwordHash, name]
    );

    const token = app.jwt.sign({
      userId: userResult.rows[0].id,
      tenantId,
      email,
      role: 'owner',
      name,
    }, { expiresIn: '24h' });

    return reply.code(201).send({
      token,
      user: {
        id: userResult.rows[0].id,
        email,
        name,
        role: 'owner',
        tenantId,
        tenantName: companyName,
      },
    });
  });

  // Get current user
  app.get('/me', {
    preHandler: [async (req: FastifyRequest) => { await req.jwtVerify(); }],
  }, async (req: FastifyRequest) => {
    const payload = req.user as any;
    const result = await query(
      `SELECT u.*, t.name as tenant_name, t.slug as tenant_slug, t.industry,
              t.profile, t.negotiation, t.settings
       FROM users u JOIN tenants t ON t.id = u.tenant_id
       WHERE u.id = $1`,
      [payload.userId]
    );

    if (result.rows.length === 0) {
      throw app.httpErrors.notFound('User not found');
    }

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenant_id,
      tenant: {
        name: user.tenant_name,
        slug: user.tenant_slug,
        industry: user.industry,
        profile: user.profile,
        settings: user.settings,
      },
    };
  });
}
