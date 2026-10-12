/**
 * AIWA v2 - Agent Tools (Function Declarations for Gemini)
 *
 * These are the tools available to the AI during conversation.
 * All price/product data comes from these tools - AI never invents numbers.
 */

import type { Tool } from '@google/genai';

export const AGENT_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'search_products',
        description: 'Cari produk di katalog perusahaan berdasarkan kebutuhan, nama, atau SKU pelanggan. Selalu gunakan ini sebelum menyebut produk.',
        parameters: {
          type: 'object' as any,
          properties: {
            query: { type: 'string' as any, description: 'Kata kunci pencarian produk' },
            category: { type: 'string' as any, description: 'Filter kategori (opsional)' },
            limit: { type: 'integer' as any, description: 'Jumlah hasil maksimal (default 5)' },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_quote',
        description: 'Hitung harga resmi untuk produk dan kuantitas tertentu, termasuk diskon tier otomatis. Hanya angka dari tool ini yang boleh disebut ke pelanggan.',
        parameters: {
          type: 'object' as any,
          properties: {
            sku: { type: 'string' as any, description: 'SKU produk' },
            qty: { type: 'integer' as any, description: 'Jumlah unit' },
          },
          required: ['sku', 'qty'],
        },
      },
      {
        name: 'negotiate_price',
        description: 'Minta penawaran harga berikutnya saat pelanggan menawar. Gunakan saat pelanggan meminta diskon tambahan.',
        parameters: {
          type: 'object' as any,
          properties: {
            sku: { type: 'string' as any, description: 'SKU produk yang dinegosiasikan' },
            qty: { type: 'integer' as any, description: 'Jumlah unit' },
            customer_gives: {
              type: 'string' as any,
              description: 'Imbal balik pelanggan: qty_up (naikkan jumlah), faster_payment (bayar lebih cepat), close_today (tutup hari ini), none',
            },
          },
          required: ['sku', 'qty'],
        },
      },
      {
        name: 'suggest_related_products',
        description: 'Ambil produk pelengkap, pengganti, atau aksesori untuk produk yang sedang dibahas.',
        parameters: {
          type: 'object' as any,
          properties: {
            sku: { type: 'string' as any, description: 'SKU produk utama' },
            limit: { type: 'integer' as any, description: 'Jumlah saran (default 3)' },
          },
          required: ['sku'],
        },
      },
      {
        name: 'send_company_profile',
        description: 'Kirim PDF company profile, brosur, atau daftar harga ke pelanggan.',
        parameters: {
          type: 'object' as any,
          properties: {
            kind: {
              type: 'string' as any,
              description: 'Jenis dokumen: company_profile, brochure, price_list',
            },
          },
        },
      },
      {
        name: 'update_crm_fields',
        description: 'Simpan informasi yang disebutkan pelanggan (nama, perusahaan, kebutuhan, anggaran, jadwal pengiriman).',
        parameters: {
          type: 'object' as any,
          properties: {
            fields: {
              type: 'object' as any,
              description: 'Data yang akan disimpan',
              properties: {
                name: { type: 'string' as any },
                company: { type: 'string' as any },
                budget: { type: 'string' as any },
                timeline: { type: 'string' as any },
                project_type: { type: 'string' as any },
                location: { type: 'string' as any },
                notes: { type: 'string' as any },
              },
            },
          },
          required: ['fields'],
        },
      },
      {
        name: 'handoff_to_human',
        description: 'Serahkan percakapan ke sales manusia. Gunakan untuk: komplain serius, permintaan di luar kebijakan, nilai transaksi besar, atau permintaan pelanggan.',
        parameters: {
          type: 'object' as any,
          properties: {
            reason: { type: 'string' as any, description: 'Alasan eskalasi' },
          },
          required: ['reason'],
        },
      },
      {
        name: 'create_quote',
        description: 'Buat penawaran formal dengan beberapa produk sekaligus.',
        parameters: {
          type: 'object' as any,
          properties: {
            items: {
              type: 'array' as any,
              description: 'Daftar item dalam penawaran',
              items: {
                type: 'object' as any,
                properties: {
                  sku: { type: 'string' as any },
                  qty: { type: 'integer' as any },
                },
                required: ['sku', 'qty'],
              },
            },
            notes: { type: 'string' as any, description: 'Catatan tambahan' },
          },
          required: ['items'],
        },
      },
    ],
  },
];

/**
 * Tool names that return price data (for validation)
 */
export const PRICE_TOOLS = ['get_quote', 'negotiate_price', 'create_quote'];

/**
 * Tool names that return product data (for validation)
 */
export const PRODUCT_TOOLS = ['search_products', 'suggest_related_products'];
