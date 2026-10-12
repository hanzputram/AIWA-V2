/**
 * AIWA v2 - Database Seed Script
 * Seeds realistic multi-tenant data: Tenants, Users, Products with Tiers & Coefficients, Relations, Contacts, and Conversations.
 */

import { getPool, closePool } from './index.js';
import 'dotenv/config';

// Pre-hashed bcrypt for 'password123'
const DEMO_PASSWORD_HASH = '$2a$10$w8zE/UsmrO3gU6r0ZvZ8ce2w1Y4q1d4e0e5.E7gW9Xy2zF3h5a2aO';

async function seed() {
  console.log('[DB Seed] Seeding demo data for AIWA v2...');
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Create Tenant: PT Sinar Elektrik Mandiri
    const tenantRes = await client.query(`
      INSERT INTO tenants (name, slug, industry, profile, negotiation, wa_config, settings)
      VALUES (
        'PT Sinar Elektrik Mandiri',
        'sinar-elektrik',
        'electrical',
        '{
          "company_name": "PT Sinar Elektrik Mandiri",
          "description": "Distributor resmi peralatan listrik & kabel industri standar SNI.",
          "address": "Kawasan Industri Pulo Gadung, Jakarta Timur",
          "phone": "+6281234567890",
          "business_hours": "Senin - Jumat 08:30 - 17:00, Sabtu 08:30 - 14:00",
          "payment_terms": "Transfer Bank (BCA, Mandiri), TOP 14 hari untuk repeat order",
          "delivery_terms": "Free ongkir Jabodetabek min order Rp 5.000.000, armada logistik internal"
        }'::jsonb,
        '{
          "budget_share": 0.6,
          "ladder": [0.5, 0.8, 1.0],
          "max_rounds": 3,
          "price_lock_hours": 24,
          "require_give_for_get": true,
          "handoff_value_threshold": 50000000
        }'::jsonb,
        '{
          "phone_number_id": "100293847561029",
          "waba_id": "908172635412345",
          "display_number": "+6281234567890"
        }'::jsonb,
        '{"ai_enabled": true, "auto_reply": true}'::jsonb
      )
      ON CONFLICT (slug) DO UPDATE SET updated_at = now()
      RETURNING id;
    `);

    const tenantId = tenantRes.rows[0].id;
    console.log(`[DB Seed] Tenant created/verified: ${tenantId}`);

    // 2. Create Users
    await client.query(`
      INSERT INTO users (tenant_id, email, password_hash, name, role)
      VALUES 
        ($1, 'admin@sinarelektrik.com', $2, 'Budi Santoso (Admin)', 'owner'),
        ($1, 'sales1@sinarelektrik.com', $2, 'Rina Wijaya (Sales Rep)', 'sales')
      ON CONFLICT (tenant_id, email) DO NOTHING;
    `, [tenantId, DEMO_PASSWORD_HASH]);

    // 3. Create Products with Tiered Discounts & Coefficients
    const products = [
      {
        sku: 'KBL-NYM-3X25-100',
        name: 'Kabel NYM 3x2.5mm Supreme (Roll 100m)',
        price: 1350000,
        tier_raw: '10:3%, 25:5%, 50:8%',
        tiers: JSON.stringify([
          { min_qty: 10, discount_pct: 3 },
          { min_qty: 25, discount_pct: 5 },
          { min_qty: 50, discount_pct: 8 }
        ]),
        coefficient: 0.88, // Bottom floor = Rp 1.188.000
        category: 'Kabel',
        unit: 'roll',
        description: 'Kabel tembaga tunggal isi 3 ukuran 2.5mm standar SNI / LMK. Selubung putih PVC tebal tahan panas.',
        function_summary: 'Kabel instalasi listrik rumah dan gedung untuk beban stop kontak dan AC.',
        use_cases: ['Instalasi stop kontak', 'Instalasi AC 1-2 PK', 'Jalur utama panel lantai']
      },
      {
        sku: 'KBL-NYM-2X15-100',
        name: 'Kabel NYM 2x1.5mm Supreme (Roll 100m)',
        price: 780000,
        tier_raw: '10:3%, 30:6%, 60:9%',
        tiers: JSON.stringify([
          { min_qty: 10, discount_pct: 3 },
          { min_qty: 30, discount_pct: 6 },
          { min_qty: 60, discount_pct: 9 }
        ]),
        coefficient: 0.88,
        category: 'Kabel',
        unit: 'roll',
        description: 'Kabel listrik tembaga 2 core 1.5mm putih standar SNI untuk instalasi titik lampu penerangan.',
        function_summary: 'Instalasi lampu dan saklar daya rendah hingga sedang.',
        use_cases: ['Titik lampu perumahan', 'Saklar lampu', 'Exhaust fan']
      },
      {
        sku: 'PPA-CND-PVC-20',
        name: 'Pipa Konduit PVC High Impact 20mm 2.9m Clipsal / Schneider',
        price: 18500,
        tier_raw: '50:4%, 100:8%, 300:12%',
        tiers: JSON.stringify([
          { min_qty: 50, discount_pct: 4 },
          { min_qty: 100, discount_pct: 8 },
          { min_qty: 300, discount_pct: 12 }
        ]),
        coefficient: 0.85,
        category: 'Konduit & Aksesori',
        unit: 'batang',
        description: 'Pipa pelindung kabel elastis anti pecah bisa ditekuk dengan bender spring.',
        function_summary: 'Pelindung kabel instalasi tanam dinding atau dak beton.',
        use_cases: ['In-wall piping kabel NYM', 'Instalasi plafon', 'Perlindungan kabel eksternal']
      },
      {
        sku: 'KLM-CND-20',
        name: 'Klem Pipa Konduit 20mm Putih PVC (Pack 50 pcs)',
        price: 32000,
        tier_raw: '10:5%, 30:10%',
        tiers: JSON.stringify([
          { min_qty: 10, discount_pct: 5 },
          { min_qty: 30, discount_pct: 10 }
        ]),
        coefficient: 0.82,
        category: 'Konduit & Aksesori',
        unit: 'pack',
        description: 'Klem sadel pengikat pipa konduit 20mm ke dinding dengan lubang sekrup ganda.',
        function_summary: 'Fiksasi pipa konduit ke dinding atau struktur rangka plafon.',
        use_cases: ['Pengikat pipa konduit 20mm ke dinding bata atau gipsum']
      },
      {
        sku: 'SKL-TGL-BROCO',
        name: 'Saklar Tunggal Broco Galleo Putih G161',
        price: 24500,
        tier_raw: '20:5%, 50:9%, 100:14%',
        tiers: JSON.stringify([
          { min_qty: 20, discount_pct: 5 },
          { min_qty: 50, discount_pct: 9 },
          { min_qty: 100, discount_pct: 14 }
        ]),
        coefficient: 0.84,
        category: 'Saklar & Stop Kontak',
        unit: 'pcs',
        description: 'Saklar tunggal flush mount desain elegan modern bersertifikat SNI.',
        function_summary: 'Kontrol on/off titik lampu single ruangan.',
        use_cases: ['Kamar tidur', 'Ruang tamu', 'Koridor kantor']
      },
      {
        sku: 'STP-ARD-BROCO',
        name: 'Stop Kontak Arde Broco Galleo Putih G153',
        price: 27500,
        tier_raw: '20:5%, 50:9%, 100:14%',
        tiers: JSON.stringify([
          { min_qty: 20, discount_pct: 5 },
          { min_qty: 50, discount_pct: 9 },
          { min_qty: 100, discount_pct: 14 }
        ]),
        coefficient: 0.84,
        category: 'Saklar & Stop Kontak',
        unit: 'pcs',
        description: 'Stop kontak dinding dengan grounding arde tembaga aman untuk peralatan rumah tangga.',
        function_summary: 'Titik colokan listrik standar 16A berarde.',
        use_cases: ['Stop kontak TV & kulkas', 'Stop kontak meja kerja', 'Titik colokan dapur']
      },
      {
        sku: 'INB-DOS-BROCO',
        name: 'Inbow Doos Tanam Broco B101 Kotak Hitam',
        price: 4500,
        tier_raw: '50:6%, 100:12%, 300:18%',
        tiers: JSON.stringify([
          { min_qty: 50, discount_pct: 6 },
          { min_qty: 100, discount_pct: 12 },
          { min_qty: 300, discount_pct: 18 }
        ]),
        coefficient: 0.80,
        category: 'Saklar & Stop Kontak',
        unit: 'pcs',
        description: 'Mangkok tanam inbow box plastik tahan pecah untuk dudukan saklar dan stop kontak broco.',
        function_summary: 'Rumah tanam saklar/stop kontak pada dinding plesteran.',
        use_cases: ['Dudukan inbow saklar dan stop kontak dinding']
      },
      {
        sku: 'MCB-1P-16A-SCH',
        name: 'MCB Domae 1 Pole 16A 4.5kA Schneider Electric',
        price: 68000,
        tier_raw: '12:4%, 36:8%, 72:12%',
        tiers: JSON.stringify([
          { min_qty: 12, discount_pct: 4 },
          { min_qty: 36, discount_pct: 8 },
          { min_qty: 72, discount_pct: 12 }
        ]),
        coefficient: 0.86,
        category: 'Proteksi & Panel',
        unit: 'pcs',
        description: 'Miniature Circuit Breaker 16A proteksi arus lebih dan hubung singkat kualitas global.',
        function_summary: 'Pembatas arus dan proteksi sirkuit daya 3500VA.',
        use_cases: ['Sirkuit AC & Water Heater', 'Panel pembagi listrik lantai rumah']
      },
      {
        sku: 'BOX-MCB-4G-PRS',
        name: 'Box MCB Inbow 4 Grup Presto Tutup Transparan',
        price: 42000,
        tier_raw: '10:5%, 25:10%',
        tiers: JSON.stringify([
          { min_qty: 10, discount_pct: 5 },
          { min_qty: 25, discount_pct: 10 }
        ]),
        coefficient: 0.82,
        category: 'Proteksi & Panel',
        unit: 'pcs',
        description: 'Box panel MCB tanam rapi berkapasitas 4 unit MCB dengan penutup akrilik gelap mewah.',
        function_summary: 'Enclosure pelindung MCB sub-distribution.',
        use_cases: ['Panel listrik hunian perumahan dan ruko']
      },
      {
        sku: 'LGT-LED-9W-PHL',
        name: 'Lampu LED Downlight Philips Meson 9W 6500K Putih',
        price: 52000,
        tier_raw: '12:5%, 36:10%, 72:15%',
        tiers: JSON.stringify([
          { min_qty: 12, discount_pct: 5 },
          { min_qty: 36, discount_pct: 10 },
          { min_qty: 72, discount_pct: 15 }
        ]),
        coefficient: 0.85,
        category: 'Penerangan & Lampu',
        unit: 'pcs',
        description: 'Downlight recessed plafon hemat energi 9 Watt cahaya merata dan tidak silau.',
        function_summary: 'Pencahayaan utama ruang tamu, kantor, dan koridor.',
        use_cases: ['Downlight plafon gypsum rumah modern dan kantor']
      }
    ];

    for (const p of products) {
      await client.query(`
        INSERT INTO products (
          tenant_id, sku, name, price, tier_raw, tiers, coefficient,
          category, unit, description, function_summary, use_cases, active
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12, true)
        ON CONFLICT (tenant_id, sku) DO UPDATE SET
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          tier_raw = EXCLUDED.tier_raw,
          tiers = EXCLUDED.tiers,
          coefficient = EXCLUDED.coefficient,
          category = EXCLUDED.category,
          unit = EXCLUDED.unit,
          description = EXCLUDED.description,
          function_summary = EXCLUDED.function_summary,
          use_cases = EXCLUDED.use_cases,
          active = true;
      `, [
        tenantId, p.sku, p.name, p.price, p.tier_raw, p.tiers, p.coefficient,
        p.category, p.unit, p.description, p.function_summary, p.use_cases
      ]);
    }
    console.log(`[DB Seed] Inserted ${products.length} catalog products with tiered pricing`);

    // 4. Product Relations (Complements & Accessories)
    const relations = [
      { from: 'KBL-NYM-3X25-100', to: 'PPA-CND-PVC-20', type: 'complement', score: 0.95 },
      { from: 'PPA-CND-PVC-20', to: 'KLM-CND-20', type: 'complement', score: 0.98 },
      { from: 'SKL-TGL-BROCO', to: 'INB-DOS-BROCO', type: 'complement', score: 0.99 },
      { from: 'STP-ARD-BROCO', to: 'INB-DOS-BROCO', type: 'complement', score: 0.99 },
      { from: 'MCB-1P-16A-SCH', to: 'BOX-MCB-4G-PRS', type: 'complement', score: 0.92 },
      { from: 'KBL-NYM-2X15-100', to: 'LGT-LED-9W-PHL', type: 'complement', score: 0.88 },
      { from: 'SKL-TGL-BROCO', to: 'STP-ARD-BROCO', type: 'bundle', score: 0.85 }
    ];

    for (const r of relations) {
      await client.query(`
        INSERT INTO product_relations (tenant_id, from_sku, to_sku, type, source, score)
        VALUES ($1, $2, $3, $4, 'manual', $5)
        ON CONFLICT (tenant_id, from_sku, to_sku, type) DO UPDATE SET score = EXCLUDED.score;
      `, [tenantId, r.from, r.to, r.type, r.score]);
    }
    console.log(`[DB Seed] Created ${relations.length} product cross-sell relations`);

    // 5. Create Sample Contact & Conversation
    const contactRes = await client.query(`
      INSERT INTO contacts (tenant_id, wa_id, name, company, role, segment, notes)
      VALUES (
        $1,
        '6281899988877',
        'Pak Hendra (Kontraktor)',
        'CV Graha Jaya Mandiri',
        'Procurement / Site Manager',
        'contractor',
        'Kontraktor proyek ruko 3 lantai di Bintaro'
      )
      ON CONFLICT (tenant_id, wa_id) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `, [tenantId]);
    const contactId = contactRes.rows[0].id;

    const convRes = await client.query(`
      INSERT INTO conversations (
        tenant_id, contact_id, channel, mode, deal_stage,
        unread_count, summary, products_discussed
      )
      VALUES (
        $1, $2, 'whatsapp', 'ai', 'negotiation',
        0, 'Pelanggan butuh 15 roll Kabel NYM 3x2.5mm dan 60 pipa konduit. Sedang meminta penawaran terbaik.',
        '["KBL-NYM-3X25-100", "PPA-CND-PVC-20"]'::jsonb
      )
      RETURNING id;
    `, [tenantId, contactId]);
    const convId = convRes.rows[0].id;

    // Insert Chat Messages
    const sampleChat = [
      { sender: 'customer', dir: 'in', body: 'Selamat pagi, mau tanya harga kabel NYM Supreme 3x2.5 roll 100m ready stock?' },
      { sender: 'ai', dir: 'out', body: 'Selamat pagi Pak Hendra! Untuk Kabel NYM 3x2.5mm Supreme (Roll 100m) ready stock di gudang kami. Harga normal Rp 1.350.000 per roll. Boleh tahu butuh berapa roll untuk proyeknya?' },
      { sender: 'customer', dir: 'in', body: 'Rencana ambil 15 roll nih. Ada diskon grosir gak? Sekalian pipa konduit 20mm 60 batang.' },
      { sender: 'ai', dir: 'out', body: 'Tentu ada Pak! Untuk pembelian 15 roll Kabel NYM 3x2.5mm, otomatis dapat diskon tier kuantiti 3% menjadi Rp 1.309.500/roll. Untuk pipa konduit Clipsal 20mm pembelian 60 batang dapat diskon 4% menjadi Rp 17.760/batang. Total penawaran sementara Rp 20.708.100. Apakah pengiriman ke proyek daerah Jabodetabek? Pembelian di atas Rp 5 juta free ongkir armada kami.' }
    ];

    for (const msg of sampleChat) {
      await client.query(`
        INSERT INTO messages (tenant_id, conversation_id, direction, sender, body, status)
        VALUES ($1, $2, $3, $4, $5, 'delivered');
      `, [tenantId, convId, msg.dir, msg.sender, msg.body]);
    }

    await client.query('COMMIT');
    console.log('[DB Seed] Successfully finished seeding database with realistic sales scenarios!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[DB Seed] Seeding error:', err);
    process.exit(1);
  } finally {
    client.release();
    await closePool();
  }
}

seed().catch((err) => {
  console.error('[DB Seed] Fatal:', err);
  process.exit(1);
});
