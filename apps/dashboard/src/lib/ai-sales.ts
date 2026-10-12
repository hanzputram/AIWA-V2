import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

// Official Product Catalog for ATS ARAYA based on Discount Matrix (Standard | MAX 1 | MAX 2)
export const CATALOG = [
  {
    sku: 'MCB-1P-16A-SCH',
    name: 'MCB Domae 1 Pole 16A 4.5kA Schneider Electric',
    brand: 'Schneider Electric',
    pricelist: 68000,
    priceMax1: 37400, // Pricelist 68.000 diskon MAX 1 (45%) -> Nett Rp 37.400
    priceMax2: 34000, // Pricelist 68.000 diskon MAX 2 (50%) -> Nett Rp 34.000 (Khusus negosiasi lanjutan)
    unit: 'pcs',
    category: 'Proteksi & Panel',
    crossSell: ['BOX-MCB-4G-PRS', 'PPA-CND-PVC-20'],
    description: 'Miniature Circuit Breaker 16A Schneider Electric standar SNI proteksi beban lebih dan hubung singkat.'
  },
  {
    sku: 'MCB-1P-16A-IC60N',
    name: 'MCB Acti9 iC60N 1 Pole 16A 6kA Schneider Electric',
    brand: 'Schneider Electric',
    pricelist: 125000,
    priceMax1: 65000, // Pricelist 125.000 diskon MAX 1 (48%) -> Nett Rp 65.000
    priceMax2: 60000, // Pricelist 125.000 diskon MAX 2 (52%) -> Nett Rp 60.000
    unit: 'pcs',
    category: 'Proteksi Industri',
    crossSell: ['BOX-MCB-4G-PRS', 'PPA-CND-PVC-20'],
    description: 'MCB industri Acti9 iC60N Schneider Electric kapasitas pemutus 6kA standar IEC/EN 60898-1.'
  },
  {
    sku: 'KBL-NYM-3X25-100',
    name: 'Kabel NYM 3x2.5mm Supreme (Roll 100m)',
    brand: 'Supreme',
    pricelist: 1570000,
    priceMax1: 1020500, // Pricelist 1.570.000 diskon MAX 1 (35%) -> Nett Rp 1.020.500
    priceMax2: 942000,  // Pricelist 1.570.000 diskon MAX 2 (40%) -> Nett Rp 942.000
    unit: 'roll',
    category: 'Kabel',
    crossSell: ['PPA-CND-PVC-20', 'KLM-CND-20'],
    description: 'Kabel tembaga tunggal isi 3 ukuran 2.5mm standar SNI / LMK. Selubung putih PVC tebal tahan panas.'
  },
  {
    sku: 'KBL-NYAF-1X15-100',
    name: 'Kabel NYAF 1x1.5mm Serabut Supreme (Roll 100m)',
    brand: 'Supreme',
    pricelist: 490000,
    priceMax1: 318500, // Pricelist 490.000 diskon MAX 1 (35%) -> Nett Rp 318.500
    priceMax2: 303800, // Pricelist 490.000 diskon MAX 2 (38%) -> Nett Rp 303.800
    unit: 'roll',
    category: 'Kabel',
    crossSell: ['KLM-CND-20'],
    description: 'Kabel serabut tembaga fleksibel 1x1.5mm Supreme standar SNI untuk panel dan instalasi listrik.'
  },
  {
    sku: 'PPA-CND-PVC-20',
    name: 'Pipa Konduit PVC High Impact 20mm 2.9m Clipsal / Schneider',
    brand: 'Clipsal / Schneider',
    pricelist: 24000,
    priceMax1: 14400, // Pricelist 24.000 diskon MAX 1 (40%) -> Nett Rp 14.400
    priceMax2: 13200, // Pricelist 24.000 diskon MAX 2 (45%) -> Nett Rp 13.200
    unit: 'batang',
    category: 'Konduit & Aksesori',
    crossSell: ['KLM-CND-20'],
    description: 'Pipa pelindung kabel elastis anti pecah bisa ditekuk dengan bender spring.'
  },
  {
    sku: 'KLM-CND-20',
    name: 'Klem Pipa Konduit 20mm Putih PVC (Pack 50 pcs)',
    brand: 'Clipsal',
    pricelist: 38000,
    priceMax1: 24700, // Pricelist 38.000 diskon MAX 1 (35%) -> Nett Rp 24.700
    priceMax2: null,  // Best price distributor
    unit: 'pack',
    category: 'Konduit & Aksesori',
    crossSell: ['PPA-CND-PVC-20'],
    description: 'Klem sadel pengikat pipa konduit 20mm ke dinding dengan lubang sekrup ganda.'
  },
  {
    sku: 'BOX-MCB-4G-PRS',
    name: 'Box MCB Presto 4 Group Outbow / Inbow',
    brand: 'Presto',
    pricelist: 45000,
    priceMax1: 27900, // Pricelist 45.000 diskon MAX 1 (38%) -> Nett Rp 27.900
    priceMax2: null,
    unit: 'pcs',
    category: 'Proteksi & Panel',
    crossSell: ['MCB-1P-16A-SCH'],
    description: 'Box panel rumah MCB 4 grup plastik tahan panas dengan pintu transparan.'
  },
  {
    sku: 'SKL-TGL-BROCO',
    name: 'Saklar Tunggal Broco Galleo Putih G161',
    brand: 'Broco',
    pricelist: 28000,
    priceMax1: 18200, // Pricelist 28.000 diskon MAX 1 (35%) -> Nett Rp 18.200
    priceMax2: null,
    unit: 'pcs',
    category: 'Saklar & Stop Kontak',
    crossSell: ['INB-DOS-BROCO', 'STP-ARD-BROCO'],
    description: 'Saklar tunggal flush mount desain elegan modern bersertifikat SNI.'
  },
  {
    sku: 'STP-ARD-BROCO',
    name: 'Stop Kontak Arde Broco Galleo Putih G153',
    brand: 'Broco',
    pricelist: 32000,
    priceMax1: 20800, // Pricelist 32.000 diskon MAX 1 (35%) -> Nett Rp 20.800
    priceMax2: null,
    unit: 'pcs',
    category: 'Saklar & Stop Kontak',
    crossSell: ['INB-DOS-BROCO'],
    description: 'Stop kontak dinding dengan grounding arde tembaga aman untuk peralatan rumah tangga.'
  },
  {
    sku: 'INB-DOS-BROCO',
    name: 'Inbow Doos Tanam Broco B101 Kotak Hitam',
    brand: 'Broco',
    pricelist: 5000,
    priceMax1: 3500, // Pricelist 5.000 diskon MAX 1 (30%) -> Nett Rp 3.500
    priceMax2: null,
    unit: 'pcs',
    category: 'Saklar & Stop Kontak',
    crossSell: ['SKL-TGL-BROCO', 'STP-ARD-BROCO'],
    description: 'Mangkok tanam inbow box plastik tahan pecah untuk dudukan saklar dan stop kontak broco.'
  },
  {
    sku: 'ACB-SCH-1600A',
    name: 'ACB (Air Circuit Breaker) Schneider Masterpact NW16 1600A 3P Drawout',
    brand: 'Schneider Electric',
    pricelist: 48000000,
    priceMax1: 26400000, // Pricelist 48jt diskon MAX 1 (45%) -> Nett Rp 26.400.000
    priceMax2: 24000000, // Pricelist 48jt diskon MAX 2 (50%) -> Nett Rp 24.000.000
    unit: 'unit',
    category: 'Proteksi & Distribusi',
    crossSell: [],
    description: 'ACB Schneider Masterpact 1600A 3 Pole Drawout Micrologic 2.0A original bergaransi resmi.'
  }
];

export function getActiveCatalog(): any[] {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'catalog.json');
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: any) => ({
          sku: p.sku,
          name: p.name,
          brand: p.name.split(' ')[0] || '',
          pricelist: p.price,
          priceMax1: p.priceMax1 || p.price,
          priceMax2: p.priceMax2,
          unit: p.unit || 'pcs',
          category: p.cat || 'Umum',
          crossSell: [],
          description: p.name,
        }));
      }
    }
  } catch (err) {
    console.error('Error reading dynamic catalog in ai-sales:', err);
  }
  return CATALOG;
}

export interface ChatHistoryItem {
  sender: 'user' | 'assistant' | 'customer' | 'ai';
  text: string;
}

export interface AiReplyResult {
  replyText: string;
  modelUsed: string;
  aiProvider: string;
  activeIntent: string;
  activeSkills: string[];
  recommendations: Array<{ sku: string; name: string; price: number; unit: string }>;
  attachment?: string;
  guardrailOffer?: number;
}

export function extractProductSpecs(p: any) {
  const text = `${p.sku || ''} ${p.name || ''} ${p.cat || p.category || ''}`.toUpperCase();

  // 1. Pole Detection
  let pole: '1P' | '2P' | '3P' | '4P' | 'Other' = 'Other';
  if (
    /\b(?:4P3D|4P4D|4P|4P\/4T|4P4T)\b/.test(text) ||
    /\b4\s*(?:POLE|PHASE|FASA)\b/.test(text) ||
    text.includes(' 4P ') ||
    text.includes(' 4P/')
  ) {
    pole = '4P';
  } else if (
    /\b(?:3P3D|3P\/3T|3P3T|3P\+N|3P)\b/.test(text) ||
    /\b3\s*(?:POLE|PHASE|FASA)\b/.test(text) ||
    text.includes(' 3P ') ||
    text.includes(' 3P/')
  ) {
    pole = '3P';
  } else if (
    /\b(?:2P2T|2P\/2T|2P)\b/.test(text) ||
    /\b2\s*(?:POLE|PHASE|FASA)\b/.test(text) ||
    text.includes(' 2P ') ||
    text.includes(' 2P/')
  ) {
    pole = '2P';
  } else if (
    /\b(?:1P1T|1P\/1T|1P\+N|1P)\b/.test(text) ||
    /\b1\s*(?:POLE|PHASE|FASA)\b/.test(text) ||
    text.includes(' 1P ') ||
    text.includes(' 1P/')
  ) {
    pole = '1P';
  }

  // 2. Breaking Capacity (kA)
  let ka: string | null = null;
  const kaMatch = text.match(/\b(\d+(?:\.\d+)?)\s*KA\b/);
  if (kaMatch) {
    ka = `${kaMatch[1]}kA`;
  } else if (/\b(?:10000A|10000)\b/.test(text)) {
    ka = '10kA';
  } else if (/\b(?:6000A|6000)\b/.test(text)) {
    ka = '6kA';
  } else if (/\b(?:4500A|4500)\b/.test(text)) {
    ka = '4.5kA';
  } else if (/\bCVS\d{3}B\b/.test(text)) {
    ka = '25kA';
  } else if (/\bCVS\d{3}F\b/.test(text)) {
    ka = '36kA';
  } else if (/\bCVS\d{3}N\b/.test(text)) {
    ka = '50kA';
  } else if (text.includes('IK60N')) {
    ka = '6kA';
  } else if (text.includes('IK60A')) {
    ka = '4.5kA';
  }

  // 3. Ampere (Rated Nominal Current)
  let ampere: string | null = null;
  const tmMatch = text.match(/\bTM(\d+)D?\b/);
  if (tmMatch) {
    ampere = `${tmMatch[1]}A`;
  }

  if (!ampere) {
    const curveMatch = text.match(/\b[BCDKZ](\d{1,3})\b/);
    if (curveMatch && parseInt(curveMatch[1], 10) <= 250) {
      ampere = `${curveMatch[1]}A`;
    }
  }

  if (!ampere) {
    const ampMatches = Array.from(text.matchAll(/\b(\d+)\s*A\b/g));
    for (const m of ampMatches) {
      const val = parseInt(m[1], 10);
      if (val > 0 && val < 2000) {
        ampere = `${val}A`;
        break;
      }
    }
  }

  if (!ampere) {
    const etsMatch = text.match(/ETS\s*[\d\.]+\s+(\d+)/);
    if (etsMatch) {
      ampere = `${etsMatch[1]}A`;
    }
  }

  // 4. Product Category/Type
  let pType = 'Other';
  if (text.includes('MCCB') || text.includes('CVS') || text.includes('NSX') || text.includes('EZC')) {
    pType = 'MCCB';
  } else if (
    text.includes('MCB') ||
    text.includes('MINIATURE CIRCUIT BREAKER') ||
    text.includes('IK60') ||
    text.includes('IC60') ||
    text.includes('NG125') ||
    text.includes('RX3') ||
    text.includes('DX3')
  ) {
    pType = 'MCB';
  } else if (text.includes('RCBO') || text.includes('ELCB') || text.includes('RCD') || text.includes('VIGI')) {
    pType = 'RCBO';
  } else if (
    text.includes('PLUG') ||
    text.includes('SOCKET') ||
    text.includes('TEMPRA') ||
    text.includes('DIPW') ||
    text.includes('DMSW') ||
    text.includes('DIS-')
  ) {
    pType = 'Plug/Socket';
  } else if (text.includes('KONTAKTOR') || text.includes('CONTACTOR')) {
    pType = 'Contactor';
  } else if (text.includes('BUSBAR')) {
    pType = 'Busbar';
  }

  return { pole, ampere, ka, pType };
}

export function isElectricalProductQuery(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase().trim();

  // 1. Explicit conversational phrases / complaints / status checks
  const pureChatRegex = /^(?:cepetan|cepat(?:an)?|buruan|lama(?:\s+(?:sekali|banget|amat))?|kasih\s+harga(?:\s+aja\s+lama(?:\s+sekali)?)?|niat\s+jual(?:\s+apa\s+nggak|\s+gak)?|kok\s+(?:lama|belum|lelet|ga\s+dibalas|gak\s+dibalas)|lelet(?:\s+banget)?|woi|respon(?:\s+dong)?|balas(?:\s+dong)?|nunggu\s+lama|cepet(?:\s+dong)?|halo|hai|pagi|siang|sore|malam|terima\s+kasih|makasih|oke|siap|iya|tidak|nggak|bisa|berapa|brp|total(?:nya)?|gimana|ada\??|ready\??|p|info\s+harga|minta\s+harga|tolong\s+harganya|yg\s+biasa(?:\s+aja)?|yg\s+standar(?:\s+aja)?|1\s+aja\s+masing[- "]*|masing[- ]masing\s+\d+|bungkus|deal)$/i;
  if (pureChatRegex.test(lower)) return false;

  // 2. Specific electrical equipment categories
  const categoryTerms = [
    'mcb', 'mccb', 'acb', 'rcbo', 'elcb', 'rcd', 'vigi',
    'kontaktor', 'contactor', 'thermal overload', 'overload', 'tor',
    'relay', 'pilot lamp', 'push button', 'pushbutton', 'selektor', 'selector',
    'trafo', 'transformer', 'timer', 'kabel', 'cable', 'nym', 'nyaf', 'nyy', 'nyfgby',
    'pipa konduit', 'konduit', 'conduit', 'box mcb', 'panel listrik', 'panel', 'busbar',
    'isolator', 'saklar', 'stop kontak', 'inbow', 'outbow', 't-doos', 'terminal block', 'skun',
    'spd', 'surge arrester', 'circuit breaker'
  ];
  if (categoryTerms.some(term => new RegExp(`\\b${term}\\b`, 'i').test(lower) || lower.includes(term))) {
    return true;
  }

  // 3. Technical electrical ratings (Pole, Ampere, kA)
  if (/\b(?:[1234]\s*p|[1234]\s*pole|[123]\s*phase|[123]\s*fase|3p3d|4p3d|4p4d|1p1t|2p2t)\b/i.test(lower)) {
    return true;
  }
  if (/\b\d+\s*a\b/i.test(lower) || /\b[bcd]\d{1,3}\b/i.test(lower) || /\btm\d+d?\b/i.test(lower)) {
    return true;
  }
  if (/\b\d+(?:\.\d+)?\s*ka\b/i.test(lower)) {
    return true;
  }

  // 4. Electrical brands and series
  const brandSeries = [
    'schneider', 'legrand', 'abb', 'chint', 'autonics', 'supreme', 'omron', 'broco', 'clipsal',
    'cvs', 'cvs100', 'cvs100b', 'cvs160', 'cvs250', 'cvs400', 'cvs630', 'nsx', 'nsxm', 'ezc',
    'ik60', 'ik60n', 'ik60a', 'ic60', 'ic60n', 'ng125', 'domae', 'acti9', 'easypact',
    'rx3', 'dx3', 'zelio', 'tesys', 'masterpact'
  ];
  if (brandSeries.some(b => new RegExp(`\\b${b}\\b`, 'i').test(lower))) {
    return true;
  }

  // 5. Exact SKU tokens in catalog
  const words = text.replace(/[^a-zA-Z0-9\-\/]/g, ' ').split(/\s+/).filter(w => w.length >= 3);
  for (const w of words) {
    if (CATALOG.some(p => (p.sku || '').toLowerCase() === w.toLowerCase())) {
      return true;
    }
  }

  return false;
}

export function detectConversationIntent(text: string): string {
  const lower = text.toLowerCase().trim();

  // 1. Urgency / Complaint
  if (/(?:cepetan|cepat(?:an)?|buruan|lama(?:\s+(?:sekali|banget|amat))?|kasih\s+harga(?:\s+aja\s+lama)?|niat\s+jual|kok\s+(?:lama|belum|lelet|ga\s+dibalas|gak\s+dibalas)|lelet(?:\s+banget)?|woi|respon\s+dong|balas\s+dong|nunggu\s+lama|cepet\s+dong|ditinggal)/i.test(lower)) {
    return 'URGENCY_COMPLAINT';
  }

  // 2. New product inquiry (if explicitly mentioned electrical terms)
  if (isElectricalProductQuery(text)) {
    return 'NEW_PRODUCT_INQUIRY';
  }

  // 3. Asking price / Followup on previously discussed items
  if (/(?:berapa(?:\s+totalnya|\s+semuanya|\s+harganya)?|brp|total(?:nya)?|kasih\s+harga|minta\s+harga|harganya\s+mana|harganya\s+berapa|price|ada\??|ready\??|gimana\??|jadinya\s+berapa)/i.test(lower)) {
    return 'ASKING_PRICE_FOLLOWUP';
  }

  // 4. Quantity / variant update
  if (/(?:\b\d+\s*(?:aja|saja|pcs|buah|unit)?\s*(?:masing|tiap)|masing[- ]masing|\btambah\b|\bkurang\b|\bubah\b|\bjadi\s+\d+|yg\s+biasa|yg\s+standar)/i.test(lower)) {
    return 'QUANTITY_UPDATE';
  }

  // 5. Negotiation
  if (/(?:diskon|nego|kurang|harga\s+pas|bisa\s+turun|lebih\s+murah|potongan|tawar|mahal|kemahalan|nett|best\s+price)/i.test(lower)) {
    return 'NEGOTIATION';
  }

  // 6. Closing / Agreement
  if (/(?:deal|oke|siap|bungkus|ambil|buatkan\s+faktur|siapkan\s+faktur|invoice|proses|kirim\s+rekening|transfer|pesan\s+sekarang)/i.test(lower)) {
    return 'CLOSING_AGREEMENT';
  }

  // 7. Company profile
  if (/(?:company\s+profile|profil|legalitas|katalog\s+pdf)/i.test(lower)) {
    return 'COMPANY_PROFILE';
  }

  // 8. Greeting / Pleasantry
  if (/^(?:halo|hai|hi|p|pagi|siang|sore|malam|assalamualaikum)/i.test(lower)) {
    return 'GREETING_PLEASANTRY';
  }

  return 'GENERAL_CHAT';
}

const STOPWORDS = new Set([
  'saya', 'mau', 'beli', 'order', 'ambil', 'butuh', 'lagi', 'ada', 'ya', 'kak', 'gan', 'pak', 'bu', 'mas', 'mbak',
  'apakah', 'tolong', 'bisa', 'minta', 'harga', 'harganya', 'satuan', 'satuannya', 'total', 'totalnya', 'stok', 'stoknya',
  'ready', 'tipe', 'unit', 'pcs', 'untuk', 'dari', 'yang', 'dan', 'atau', 'ini', 'itu', 'di', 'ke', 'cari', 'pesan',
  'halo', 'siang', 'pagi', 'sore', 'malam', 'terima', 'kasih', 'bos', 'punya', 'kira', 'berapa', 'dong', 'kah', 'yg',
  'saja', 'aja', 'dulu', 'mana', 'deh', 'brp', 'dicek', 'cek', 'masak', 'masa', 'kosong', 'beneran', 'gini', 'suruh',
  'betul', 'lah', 'ai', 'nya', 'ngawur', 'goblok', 'tolol', 'salah', 'koq', 'kok', 'min'
]);

function searchCatalogForItem(queryText: string, catalogItems: any[]): any[] {
  const lower = queryText.toLowerCase();

  // Check exact SKU
  const skuCandidate = queryText.trim().replace(/[^a-zA-Z0-9\-\/]/g, ' ').split(/\s+/).filter((w) => w.length >= 3);
  for (const w of skuCandidate) {
    const wLower = w.toLowerCase();
    const exact = catalogItems.find((p) => (p.sku || '').toLowerCase() === wLower);
    if (exact) {
      return [
        {
          sku: exact.sku,
          name: exact.name,
          priceMax1: exact.priceMax1 || exact.price,
          priceMax2: exact.priceMax2,
          unit: exact.unit || 'pcs',
          category: exact.category || exact.cat || 'Umum',
          specs: extractProductSpecs(exact),
          score: 9999,
        },
      ];
    }
  }

  // Detect technical constraints requested by customer
  let desiredPole: '1P' | '2P' | '3P' | '4P' | null = null;
  if (/(?:3\s*(?:phase|fase|pole)|3p\b|3p3d)/i.test(lower)) desiredPole = '3P';
  else if (/(?:1\s*(?:phase|fase|pole)|1p\b|1p1t)/i.test(lower)) desiredPole = '1P';
  else if (/(?:4\s*(?:phase|fase|pole)|4p\b|4p3d|4p4d)/i.test(lower)) desiredPole = '4P';
  else if (/(?:2\s*(?:phase|fase|pole)|2p\b)/i.test(lower)) desiredPole = '2P';

  let desiredAmpere: string | null = null;
  const ampMatch = lower.match(/\b(\d+)\s*(?:a|ampere|amp)\b/i);
  if (ampMatch) desiredAmpere = `${ampMatch[1]}A`;
  if (!desiredAmpere) {
    const cMatch = lower.match(/\b[c](\d{1,3})\b/i);
    if (cMatch) desiredAmpere = `${cMatch[1]}A`;
  }

  let desiredKa: string | null = null;
  const kaMatch = lower.match(/\b(\d+(?:\.\d+)?)\s*ka\b/i);
  if (kaMatch) desiredKa = `${kaMatch[1]}kA`;

  let desiredType: string | null = null;
  if (lower.includes('mccb')) desiredType = 'MCCB';
  else if (lower.includes('mcb')) desiredType = 'MCB';
  else if (lower.includes('rcbo')) desiredType = 'RCBO';

  const tokens = lower
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t) && !/^\d+$/.test(t));

  const modelKeywords = tokens.filter((t) => {
    if (/^\d+[pP]$/.test(t) || /^\d+[aA]$/.test(t) || /^\d+(?:\.\d+)?[kK][aA]$/.test(t)) return false;
    return (
      (/[a-z]/.test(t) && /\d/.test(t)) ||
      ['domae', 'acti9', 'easypact', 'schneider', 'legrand', 'chint', 'abb', 'omron'].includes(t)
    );
  });

  if (tokens.length === 0 && !desiredPole && !desiredAmpere) return [];

  const scored = catalogItems.map((p) => {
    const skuLower = (p.sku || '').toLowerCase();
    const nameLower = (p.name || '').toLowerCase();
    const catLower = (p.category || p.cat || '').toLowerCase();
    const fullText = `${skuLower} ${nameLower} ${catLower}`;
    const wordsInName = nameLower.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);

    const specs = extractProductSpecs(p);
    let score = 0;

    for (const t of tokens) {
      if (skuLower === t) score += 2000;
      else if (skuLower.startsWith(t)) score += 800;
      else if (skuLower.length >= 4 && skuLower.includes(t)) score += 400;

      // Safe word matching - DO NOT allow arbitrary substrings across words (e.g. 'niat' in 'miniature')
      if (wordsInName.some((w) => w === t)) {
        score += 800;
      } else if (t.length >= 3 && wordsInName.some((w) => w.startsWith(t))) {
        score += 350;
      }

      if (catLower.includes(t) && t.length >= 4) score += 100;
    }

    if (modelKeywords.length > 0) {
      let matchedModel = false;
      for (const mk of modelKeywords) {
        if (wordsInName.some((w) => w === mk || w.startsWith(mk)) || fullText.includes(mk)) {
          score += 5000;
          matchedModel = true;
        }
      }
      if (!matchedModel) {
        score -= 2000;
      }
    }

    if (desiredPole) {
      if (specs.pole === desiredPole) score += 600;
      else if (specs.pole !== 'Other') score -= 2000;
    }

    if (desiredAmpere) {
      if (specs.ampere === desiredAmpere) score += 800;
      else if (specs.ampere && specs.ampere !== desiredAmpere) score -= 2000;
    }

    if (desiredKa && specs.ka) {
      if (specs.ka === desiredKa) score += 500;
    }

    if (desiredType) {
      if (specs.pType === desiredType) score += 600;
      else if (specs.pType !== 'Other') score -= 2000;
    }

    // Heavy penalty for non-protective devices when searching for breakers
    if ((desiredType === 'MCB' || desiredType === 'MCCB') && specs.pType === 'Plug/Socket') {
      score -= 5000;
    }

    return { product: p, specs, score };
  });

  return scored
    .filter((sp) => sp.score > 300)
    .sort((a, b) => b.score - a.score)
    .map((sp) => ({
      sku: sp.product.sku,
      name: sp.product.name,
      priceMax1: sp.product.priceMax1 || sp.product.price,
      priceMax2: sp.product.priceMax2,
      unit: sp.product.unit || 'pcs',
      category: sp.product.category || sp.product.cat || 'Umum',
      specs: sp.specs,
      score: sp.score,
    }));
}

export interface InquiredItem {
  lineText: string;
  qty: number;
  matches: any[];
}

export function resolveInquiry(
  message: string,
  history: ChatHistoryItem[] = [],
  catalogItems: any[]
): InquiredItem[] {
  let targetLines: string[] = [];

  // 1. If current message has actual electrical product queries, use its lines
  if (isElectricalProductQuery(message)) {
    targetLines = message
      .split(/[\r\n]+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && isElectricalProductQuery(l));
  } else {
    // 2. Otherwise, retain active product context by looking backwards in history
    const prevInquiry = (history || [])
      .slice()
      .reverse()
      .find((h) => (h.sender === 'customer' || h.sender === 'user') && isElectricalProductQuery(h.text));
    if (prevInquiry) {
      targetLines = prevInquiry.text
        .split(/[\r\n]+/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && isElectricalProductQuery(l));
    }
  }

  // 3. Check for quantity override across recent messages (e.g. '1 aja masing"', 'masing-masing 1')
  let globalQtyOverride: number | null = null;
  const recentCustMessages = (history || [])
    .slice(-6)
    .filter((h) => h.sender === 'customer' || h.sender === 'user')
    .map((h) => h.text)
    .concat([message]);

  for (const m of recentCustMessages.slice().reverse()) {
    const eachMatch =
      m.match(/\b(\d+)\s*(?:aja|saja|pcs|buah|unit)?\s*(?:masing|tiap)/i) ||
      m.match(/masing[- ]masing\s*(\d+)/i);
    if (eachMatch) {
      globalQtyOverride = parseInt(eachMatch[1], 10);
      break;
    }
  }

  const items: InquiredItem[] = [];
  for (const line of targetLines) {
    let qty = 1;
    if (globalQtyOverride) {
      qty = globalQtyOverride;
    } else {
      const qtyMatch =
        line.match(/\b(\d+)\s*(?:pcs|buah|roll|unit|batang|meter|m|pack|set)\b/i) || line.match(/=\s*(\d+)/);
      if (qtyMatch) qty = parseInt(qtyMatch[1], 10);
    }
    const matches = searchCatalogForItem(line, catalogItems);
    items.push({
      lineText: line,
      qty,
      matches: matches.slice(0, 5),
    });
  }

  return items;
}

export async function generateAiReply(
  message: string,
  history: ChatHistoryItem[] = [],
  negotiationRound: number = 1
): Promise<AiReplyResult> {
  const lower = message.toLowerCase();
  const activeCatalog = getActiveCatalog();

  // 1. Resolve Inquired Items (Multi-line BOM support & conversational history retention)
  const resolvedItems = resolveInquiry(message, history, activeCatalog);

  // Collect all top matched products
  let matchedProducts: any[] = [];
  const seenSkus = new Set<string>();

  for (const item of resolvedItems) {
    for (const m of item.matches) {
      if (!seenSkus.has(m.sku)) {
        seenSkus.add(m.sku);
        matchedProducts.push(m);
      }
    }
  }

  // Detect single requested quantity if only 1 item asked
  const requestedQty = resolvedItems.length === 1 && resolvedItems[0].qty > 1 ? resolvedItems[0].qty : null;

  // 2. Detect Intent & Negotiation Count
  const detectedIntent = detectConversationIntent(message);
  let activeIntent = 'product_inquiry';
  let activeSkills = ['product-knowledge', 'building-rapport'];
  let attachment: string | undefined = undefined;

  const isNegotiation = detectedIntent === 'NEGOTIATION';
  const isCompanyProfile = detectedIntent === 'COMPANY_PROFILE';
  const isCrossSell =
    lower.includes('pelengkap') ||
    lower.includes('aksesori') ||
    lower.includes('pipa') ||
    lower.includes('konduit') ||
    lower.includes('box mcb');

  // Count past negotiation interactions in history
  const pastNegoCount = history.filter((h) => {
    const t = h.text.toLowerCase();
    return (
      t.includes('diskon') ||
      t.includes('nego') ||
      t.includes('kurang') ||
      t.includes('harga pas') ||
      t.includes('bisa turun') ||
      t.includes('lebih murah') ||
      t.includes('tawar') ||
      t.includes('mahal')
    );
  }).length;

  const effectiveRound = Math.max(negotiationRound, pastNegoCount + (isNegotiation ? 1 : 0));

  if (detectedIntent === 'URGENCY_COMPLAINT') {
    activeIntent = 'urgency_complaint';
    activeSkills = ['rapport-recovery', 'empathy-closing'];
  } else if (detectedIntent === 'QUANTITY_UPDATE') {
    activeIntent = 'quantity_update';
    activeSkills = ['order-adjustment', 'active-quotation'];
  } else if (detectedIntent === 'CLOSING_AGREEMENT') {
    activeIntent = 'closing_agreement';
    activeSkills = ['deal-closing', 'invoice-generation'];
  } else if (isNegotiation) {
    activeIntent = 'pricing_negotiation';
    activeSkills = ['pricing-negotiation', 'micro-commitment-stacking'];
  } else if (isCompanyProfile) {
    activeIntent = 'company_info';
    activeSkills = ['attachment-media-handling', 'building-rapport'];
    attachment = 'Company Profile ATS ARAYA 2026.pdf';
  } else if (isCrossSell) {
    activeIntent = 'cross_sell_window';
    activeSkills = ['cross-sell-upsell-detection', 'deal-upselling'];
  } else if (detectedIntent === 'ASKING_PRICE_FOLLOWUP') {
    activeIntent = 'price_followup';
    activeSkills = ['price-quotation', 'closing-pitch'];
  }

  const hasOngoingChat = history && history.length > 0;

  // Build structured summary of inquired items & matches
  let catalogContextStr = '';
  let grandTotal = 0;
  if (resolvedItems.length > 0) {
    const itemsFormatted = resolvedItems.map((item, idx) => {
      const topMatch = item.matches[0];
      if (!topMatch) {
        return `Item ${idx + 1}: "${item.lineText}" (Qty: ${item.qty}) -> Belum ditemukan di database aktif.`;
      }
      const subtotal = topMatch.priceMax1 * item.qty;
      grandTotal += subtotal;

      const altMatches = item.matches.slice(1, 3);
      const altStr =
        altMatches.length > 0
          ? altMatches
              .map(
                (alt) =>
                  `  * Opsi lain: [${alt.sku}] ${alt.name} = Rp ${alt.priceMax1.toLocaleString('id-ID')}/${alt.unit}`
              )
              .join('\n')
          : '';

      return `Item ${idx + 1}: "${item.lineText}" (Qty: ${item.qty} ${topMatch.unit})
  * Utama: [${topMatch.sku}] ${topMatch.name} = Rp ${topMatch.priceMax1.toLocaleString('id-ID')}/${topMatch.unit}${item.qty > 1 ? ` (Subtotal: Rp ${subtotal.toLocaleString('id-ID')})` : ''}
${altStr}`;
    });

    catalogContextStr = `${itemsFormatted.join('\n')}
${resolvedItems.length > 1 && grandTotal > 0 ? `Total Seluruh Pesanan: Rp ${grandTotal.toLocaleString('id-ID')}` : ''}`;
  } else {
    catalogContextStr = `(Customer bertanya umum / belum menyebut spesifikasi tertentu. Jawab singkat dan tanyakan tipe atau rating yang dicari.)`;
  }

  // Build situational guidance for Claude / Gemini based on intent
  let situationalGuidance = '';
  const validProductsSummary = resolvedItems
    .filter((it) => it.matches.length > 0)
    .map((it, i) => `${i + 1}. *${it.matches[0].name}* (${it.matches[0].sku}): ${it.qty} PCS = *Rp ${(it.matches[0].priceMax1 * it.qty).toLocaleString('id-ID')}*`)
    .join('\n');

  if (detectedIntent === 'URGENCY_COMPLAINT') {
    situationalGuidance = `
SITUASI PERCAKAPAN (PENTING):
- Customer sedang menunggu / terburu-buru / mengeluhkan waktu respon: "${message}".
- Produk aktif yang sedang dibahas dan ditunggu harganya:
${validProductsSummary || catalogContextStr}
${grandTotal > 0 ? `*Total: Rp ${grandTotal.toLocaleString('id-ID')}*` : ''}

PANDUAN RESPON KHUSUS URGENCY / KOMPLAIN:
1. RESPON SELAYAKNYA MANUSIA SALES YANG BEREMPATI: Jangan bersikap kaku seperti robot!
2. DILARANG KERAS menganggap kalimat keluhan/desakan ("${message}") sebagai nama produk di database. JANGAN katakan produk "${message}" tidak ada di database!
3. Minta maaf dengan tulus dan sopan atas keterlambatan balasannya (contoh: "Mohon maaf sekali atas keterlambatan balasannya ya Kak! 🙏 Kami sangat niat melayani Kakak.").
4. LANGSUNG berikan rincian harga resmi dan total yang sedang ditunggu customer:
${validProductsSummary}
${grandTotal > 0 ? `*Total: Rp ${grandTotal.toLocaleString('id-ID')}*` : ''}
5. Beritahu barang ready stock dan tawarkan langsung: "Mau langsung kami siapkan fakturnya Kak?"
6. Singkat, padat, dan to the point (4-6 baris).`;
  } else if (detectedIntent === 'QUANTITY_UPDATE') {
    situationalGuidance = `
SITUASI PERCAKAPAN:
- Customer memperbarui jumlah pesanan: "${message}".
- Rincian produk aktif setelah penyesuaian:
${validProductsSummary || catalogContextStr}
${grandTotal > 0 ? `*Total: Rp ${grandTotal.toLocaleString('id-ID')}*` : ''}

PANDUAN RESPON:
1. Konfirmasi singkat pembaruan kuantiti (misal: "Siap Kak, sudah kami sesuaikan:").
2. Tampilkan rincian harga dan total yang sudah diupdate.
3. Tanyakan apakah mau langsung disiapkan fakturnya.`;
  } else if (detectedIntent === 'CLOSING_AGREEMENT') {
    situationalGuidance = `
SITUASI PERCAKAPAN:
- Customer setuju / deal / meminta proses faktur ("${message}").
- Rincian pesanan:
${validProductsSummary || catalogContextStr}
${grandTotal > 0 ? `*Total: Rp ${grandTotal.toLocaleString('id-ID')}*` : ''}

PANDUAN RESPON:
1. Sambut dengan antusias dan ramah (misal: "Siap Kak! Kami siapkan fakturnya sekarang ya.").
2. Minta data singkat untuk penerbitan faktur: "Boleh dibantu nama PT/toko, alamat pengiriman, dan NPWP (jika butuh faktur pajak) Kak?"`;
  } else if (detectedIntent === 'ASKING_PRICE_FOLLOWUP') {
    situationalGuidance = `
SITUASI PERCAKAPAN:
- Customer menanyakan harga/total barang yang tadi dibahas ("${message}").
- Rincian produk aktif:
${validProductsSummary || catalogContextStr}
${grandTotal > 0 ? `*Total: Rp ${grandTotal.toLocaleString('id-ID')}*` : ''}

PANDUAN RESPON:
1. Langsung to the point berikan rincian harga dan totalnya.
2. Tanyakan apakah mau langsung disiapkan fakturnya.`;
  }

  // 4. System prompt strictly enforcing short, concise, to the point WhatsApp responses
  const systemInstruction = `Kamu adalah WhatsApp Sales Assistant resmi ATS ARAYA (distributor alat listrik & otomasi industri B2B).
Gaya komunikasi: Ramah, responsif, selayaknya manusia (sales person) yang berempati dengan customer di WhatsApp bisnis yang profesional dan efisien.

ATURAN PANJANG PESAN (MUTLAK & SANGAT KETAT):
1. JANGAN BANYAK KETIKAN! Maksimal 3 sampai 6 baris saja per pesan.
2. DILARANG KERAS basa-basi panjang, intro bertele-tele, atau kalimat penutup marketing/promosi yang panjang.
   - JANGAN menulis kalimat klise seperti: "Terima kasih sudah menghubungi ATS ARAYA...", "Saya sudah melihat kebutuhan Kakak untuk produk berkualitas tinggi ini...", "Produk ini sangat cocok untuk panel industri dan komersial...", dll.
   - Sapaan pembuka cukup 1 frasa singkat (misal: "Ready Kak! 👍", "Siap Kak, ini rinciannya:", "Ada Kak:"). Jika percakapan sudah berjalan (${hasOngoingChat ? 'SUDAH BERJALAN' : 'BARU'}), LANGSUNG to the point tanpa sapaan pembuka ulang!
3. DILARANG membuat garis pemisah '---' atau tabel markdown ('|').
4. Format bold HANYA gunakan SATU BINTANG (*teks*), bukan dua bintang (**teks**).
5. Gunakan poin bullet ('•') atau nomor ('1.', '2.') yang rapi dan ringkas.
6. DILARANG menganggap kalimat obrolan/komplain/desakan seperti "cepetan", "kasih harga aja lama", "niat jual apa nggak" sebagai nama produk! Hubungkan selalu dengan barang yang sedang dibahas sebelumnya.

DATA RESMI KATALOG KAMI:
${catalogContextStr}
${situationalGuidance}

ATURAN HARGA & NEGOSIASI:
- Gunakan harga nett resmi dari database di atas.
- DILARANG KERAS menyebut kata internal "MAX 1", "MAX 2", "Standard", atau persentase diskon ("diskon 40%", dll). Customer tidak boleh tahu istilah internal tersebut.
- Jika menawar, sesuaikan ke batas negosiasi jika ada, atau jelaskan singkat bahwa harga tersebut sudah best price resmi distributor.`;

  let replyText = '';
  let aiProvider = '';
  let modelUsed = '';

  // Priority 1: Claude API
  const anthropicKey = process.env.ANTHROPIC_API_KEY || '';
  if (anthropicKey) {
    const claudeModels = [
      process.env.ANTHROPIC_FAST_MODEL || 'claude-haiku-4-5-20251001',
      process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
      'claude-haiku-4-5-20251001',
      'claude-sonnet-4-5-20250929',
      'claude-opus-4-5-20251101',
      'claude-sonnet-4-6',
    ];

    const claudeMessages = [];
    for (const h of history) {
      claudeMessages.push({
        role: h.sender === 'user' || h.sender === 'customer' ? 'user' : 'assistant',
        content: h.text,
      });
    }
    claudeMessages.push({
      role: 'user',
      content: message,
    });

    for (const cModel of claudeModels) {
      try {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: cModel,
            max_tokens: 220,
            temperature: 0.2,
            system: systemInstruction,
            messages: claudeMessages,
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          if (data.content && data.content[0]?.text) {
            replyText = data.content[0].text;
            modelUsed = cModel;
            aiProvider = 'Anthropic Claude';
            break;
          }
        }
      } catch (cErr: any) {
        // continue to next model
      }
    }
  }

  // Priority 2: Gemini API
  if (!replyText) {
    try {
      const geminiKey = process.env.GEMINI_API_KEY || '';
      const genAI = new GoogleGenAI({ apiKey: geminiKey });
      const contents: any[] = [];
      for (const h of history) {
        contents.push({
          role: h.sender === 'user' || h.sender === 'customer' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const candidateModels = ['gemini-2.5-flash', 'gemini-1.5-flash'];
      for (const mod of candidateModels) {
        try {
          const response = await genAI.models.generateContent({
            model: mod,
            contents,
            config: {
              systemInstruction,
              temperature: 0.2,
              maxOutputTokens: 220,
            },
          });
          if (response.text) {
            replyText = response.text;
            modelUsed = mod;
            aiProvider = 'Google Gemini';
            break;
          }
        } catch (gErr) {}
      }
    } catch (err) {}
  }

  // Priority 3: Smart Rule Engine Fallback (Zero mentions of % or MAX 1 / MAX 2)
  if (!replyText) {
    aiProvider = 'Rule Engine';
    modelUsed = 'ATS Smart Rules';

    if (detectedIntent === 'URGENCY_COMPLAINT' && resolvedItems.length > 0) {
      const lines = resolvedItems.map((item, i) => {
        const top = item.matches[0];
        if (top) {
          const sub = top.priceMax1 * item.qty;
          return `${i + 1}. *${top.name}* (${top.sku}): ${item.qty} ${top.unit} = *Rp ${sub.toLocaleString('id-ID')}*`;
        }
        return '';
      }).filter(Boolean);
      replyText = `Mohon maaf sekali atas keterlambatan balasannya Kak! 🙏 Kami sangat niat melayani Kakak.\n\nIni rincian harga barang yang Kakak tanyakan:\n${lines.join('\n')}\n*Total: Rp ${grandTotal.toLocaleString('id-ID')}*\n\nBarang ready stock siap kirim Kak. Mau langsung kami siapkan fakturnya? 😊`;
    } else if (detectedIntent === 'CLOSING_AGREEMENT') {
      replyText = `Siap Kak! Kami siapkan fakturnya sekarang ya. Boleh dibantu info nama PT/toko, alamat pengiriman, dan NPWP (jika butuh faktur pajak) Kak?`;
    } else if (matchedProducts.length > 0) {
      if (matchedProducts.length === 1) {
        const p = matchedProducts[0];
        const unit = p.unit || 'pcs';
        const pricePerUnit = p.priceMax1;
        const totalStr = requestedQty && requestedQty > 1 ? `, jadi untuk ${requestedQty} ${unit} totalnya Rp ${(requestedQty * pricePerUnit).toLocaleString('id-ID')}` : '';

        if (effectiveRound > 1 && p.priceMax2) {
          replyText = `Baik Kak, khusus untuk proyek Kakak kami bantu sesuaikan penawaran terbaik menjadi Rp ${p.priceMax2.toLocaleString('id-ID')}/${unit} untuk ${p.name}. Barang 100% original dan siap kirim dari gudang. Mau langsung kami siapkan fakturnya Kak?`;
        } else {
          replyText = `Ready stock Kak! Untuk ${p.name} (SKU: ${p.sku}) harga penawaran kami Rp ${pricePerUnit.toLocaleString('id-ID')}/${unit}${totalStr}. Barang 100% original, bergaransi resmi, dan ready stock siap kirim. Mau langsung kami siapkan fakturnya Kak?`;
        }
      } else if (resolvedItems.length > 1) {
        let total = 0;
        const lines = resolvedItems.map((item, i) => {
          const top = item.matches[0];
          if (top) {
            const sub = top.priceMax1 * item.qty;
            total += sub;
            return `${i + 1}. *${top.name}* (${top.sku}): ${item.qty} ${top.unit} x Rp ${top.priceMax1.toLocaleString('id-ID')} = *Rp ${sub.toLocaleString('id-ID')}*`;
          }
          return `${i + 1}. *${item.lineText}*: Belum ditemukan di katalog`;
        });
        replyText = `Ready stock Kak! Berikut rincian ketersediaan dan penawaran resmi dari database kami:\n\n${lines.join('\n\n')}\n\n*Total Pesanan: Rp ${total.toLocaleString('id-ID')}*\n\nBarang 100% original bergaransi resmi distributor. Mau langsung kami siapkan fakturnya Kak?`;
      } else {
        const sample = matchedProducts.slice(0, 3);
        const sampleList = sample
          .map((p) => `• *${p.name}* (${p.sku}): Rp ${p.priceMax1.toLocaleString('id-ID')}/${p.unit}`)
          .join('\n');
        const tokenLabel = resolvedItems.length > 0 ? resolvedItems[0].lineText : 'produk';

        if (effectiveRound > 1) {
          replyText = `Baik Kak, untuk kebutuhan ${tokenLabel} proyek Kakak kami selalu siap berikan penawaran harga terbaik langsung distributor resmi. Boleh diinfokan tipe spesifik atau estimasi kuantitinya agar langsung kami hitungkan harga terbaiknya?`;
        } else {
          replyText = `Ready Kak! Untuk pilihan ${tokenLabel} di gudang kami ready stock beberapa varian resmi, di antaranya:\n${sampleList}\n\nSemua barang 100% original bergaransi resmi. Boleh tahu Kakak butuh yang berapa Pole / Ampere atau tipe spesifiknya agar kami cekkan yang paling sesuai?`;
        }
      }
    } else if (/^(halo|hi|hai|p|pagi|siang|sore|malam)/i.test(lower)) {
      replyText = hasOngoingChat
        ? `Siap Kak! Ada kebutuhan produk atau spesifikasi material lain yang ingin dicekkan lagi stok dan harganya?`
        : `Halo Kak! Selamat datang di ATS ARAYA. Kami siap bantu untuk kebutuhan komponen elektrikal, MCB, breaker, kabel, maupun otomasi industri. Ada kebutuhan spesifikasi material tertentu yang ingin kami cekkan stok dan harganya?`;
    } else if (isNegotiation) {
      replyText = `Baik Kak, untuk kebutuhan proyek Kakak kami selalu siap berikan penawaran harga terbaik langsung distributor resmi. Boleh diinfokan rincian tipe material dan kuantiti yang dicari agar langsung kami hitungkan harga terbaiknya?`;
    } else {
      replyText = hasOngoingChat
        ? `Siap Kak! Boleh diinfokan tipe material atau spesifikasi yang dicari agar bisa langsung kami cekkan stok dan harga nett resminya.`
        : `Halo Kak, terima kasih sudah menghubungi ATS ARAYA! Kami adalah distributor resmi komponen kelistrikan industri dan gedung dengan lebih dari 40.000 katalog material. Silakan infokan daftar tipe material atau spesifikasi yang Kakak cari ya agar bisa langsung kami cekkan stok dan harga nett-nya.`;
    }
  }

  // Format reply strictly for WhatsApp:
  // - No markdown tables (convert to clean list)
  // - No double asterisks (** -> *)
  // - No duplicate numbering (2. 2. -> 2.)
  // - No repetitive "Halo Kak" greetings in ongoing conversations
  replyText = formatForWhatsApp(replyText, hasOngoingChat);

  const crossSellRecommendations = matchedProducts.flatMap((p) =>
    (p.crossSell || []).map((sku: string) => {
      const prod = activeCatalog.find((c: any) => c.sku === sku);
      return {
        sku,
        name: prod?.name || sku,
        price: prod?.priceMax1 || 0,
        unit: prod?.unit || 'unit',
      };
    })
  );

  return {
    replyText,
    modelUsed: modelUsed || 'Claude 4.5',
    aiProvider: aiProvider || 'Anthropic',
    activeIntent,
    activeSkills,
    recommendations: crossSellRecommendations.slice(0, 2),
    attachment,
    guardrailOffer: matchedProducts[0]?.priceMax2 || matchedProducts[0]?.priceMax1 || 34000,
  };
}

/**
 * Format and sanitize response text strictly for WhatsApp:
 * 1. Convert markdown tables to clean WhatsApp bullet lists
 * 2. Convert markdown bold '**text**' to WhatsApp bold '*text*'
 * 3. Clean stray double asterisks '**'
 * 4. Remove duplicate numbering like '2. 2. '
 * 5. Strip repetitive greetings in ongoing conversations
 */
export function formatForWhatsApp(text: string, isOngoingChat: boolean = false): string {
  if (!text) return '';

  let cleanedText = text;

  // 1. Strip repetitive opening greeting if conversation is already ongoing
  if (isOngoingChat) {
    const greetingPattern = /^(?:halo|hai|hi|selamat\s+(?:pagi|siang|sore|malam))\s+(?:kak|kakak|pak|bu|mas|mbak|gan|bos)[!,\.]*\s*(?:[👋😊🙏✨]+\s*)?/i;
    if (greetingPattern.test(cleanedText.trim())) {
      let stripped = cleanedText.trim().replace(greetingPattern, '').trim();
      if (stripped.length > 0) {
        cleanedText = stripped.charAt(0).toUpperCase() + stripped.slice(1);
      }
    }
  }

  // 2. Process line by line for table conversion and duplicate numbering
  const lines = cleanedText.split(/\r?\n/);
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Fix duplicated numbering like "2. 2. *Nomor HP*" -> "2. *Nomor HP*"
    line = line.replace(/^(\s*\d+)\.\s*\d+\.\s*/, '$1. ');

    // Check if line is a markdown table separator (|---|---|...)
    if (/^\|[\s\-:|]+\|$/.test(line.trim())) {
      continue;
    }

    // Check if line is a table row (| Item | SKU | ... |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const rawCells = line
        .trim()
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      // Skip header row
      const isHeader = rawCells.some((c) =>
        /^(item|sku|spesifikasi|nama|qty|kuantiti|harga|total|satuan|no|deskripsi)$/i.test(c.replace(/[*_]/g, ''))
      );
      if (isHeader) {
        continue;
      }

      // Convert data row into a clean WhatsApp list item
      if (rawCells.length >= 2) {
        const cells = rawCells.map((c) => c.replace(/\*\*(.*?)\*\*/g, '*$1*').trim());
        const name = cells[0].replace(/\*/g, '').trim();
        const rawSku = cells[1] && cells[1] !== '-' ? cells[1].replace(/\*/g, '').trim() : '';
        const skuLabel = rawSku ? ` (${rawSku})` : '';
        const qty = cells.find((c) => /\b\d+\s*(?:pcs|roll|unit|buah|set|batang|meter|m|pack)\b/i.test(c));
        const prices = cells.filter((c) => /rp\s*[\d\.]+/i.test(c));

        if (prices.length >= 2 && qty) {
          const unitPrice = prices[0].replace(/\*/g, '').trim();
          const totalPrice = prices[prices.length - 1].replace(/\*/g, '').trim();
          processedLines.push(`• *${name}*${skuLabel}: ${qty} x ${unitPrice} = *${totalPrice}*`);
        } else if (prices.length === 1 && qty) {
          processedLines.push(`• *${name}*${skuLabel}: ${qty} = *${prices[0].replace(/\*/g, '').trim()}*`);
        } else {
          processedLines.push(`• ${cells.filter((c) => c.length > 0).join(' - ')}`);
        }
        continue;
      }
    }

    // Strip markdown dividers (---, ===, ***, ___)
    if (/^[-=*_]{3,}$/.test(line.trim())) {
      continue;
    }

    processedLines.push(line);
  }

  let cleaned = processedLines.join('\n');

  // 3. Convert Markdown Bold '**text**' to WhatsApp Bold '*text*'
  cleaned = cleaned.replace(/\*\*\*([^\*\n]+?)\*\*\*/g, '*$1*');
  cleaned = cleaned.replace(/\*\*([^\*\n]+?)\*\*/g, '*$1*');

  // 4. Clean stray double asterisks
  cleaned = cleaned.replace(/\*\*/g, '*');

  // 5. Maximum 2 consecutive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

