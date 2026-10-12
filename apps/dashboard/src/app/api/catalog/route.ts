import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const DATA_FILE = path.join(process.cwd(), 'data', 'catalog.json');

export interface ProductItem {
  id?: string;
  sku: string;
  name: string;
  price: number;
  cat: string;
  unit: string;
  standard: string;
  max1: string;
  priceMax1: number;
  max2: string;
  priceMax2: number | null;
  coef: number;
  floor: number;
}

// In-memory cache for high-performance sub-10ms queries across 40k+ items
let cachedCatalog: ProductItem[] | null = null;
let cachedMtime: number = 0;
let cachedCategories: string[] = [];

function getCachedCatalog(): ProductItem[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, '[]', 'utf8');
      cachedCatalog = [];
      cachedMtime = Date.now();
      cachedCategories = [];
      return [];
    }

    const stats = fs.statSync(DATA_FILE);
    if (!cachedCatalog || stats.mtimeMs !== cachedMtime) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const loaded: ProductItem[] = JSON.parse(raw);
      // Ensure all items have an id
      let updated = false;
      for (let i = 0; i < loaded.length; i++) {
        if (!loaded[i].id) {
          loaded[i].id = `prod_${i + 1}`;
          updated = true;
        }
      }
      cachedCatalog = loaded;
      cachedMtime = stats.mtimeMs;

      // Extract unique categories
      const catSet = new Set<string>();
      if (Array.isArray(cachedCatalog)) {
        for (let i = 0; i < cachedCatalog.length; i++) {
          const c = cachedCatalog[i]?.cat;
          if (c) catSet.add(c.trim());
        }
      }
      cachedCategories = Array.from(catSet).sort();
    }
    return cachedCatalog || [];
  } catch (err) {
    console.error('Error reading catalog.json cache:', err);
    return cachedCatalog || [];
  }
}

function writeCatalog(items: ProductItem[]): void {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    // Ensure every item has an id
    for (let i = 0; i < items.length; i++) {
      if (!items[i].id) {
        items[i].id = `prod_${i + 1}`;
      }
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf8');
    cachedCatalog = items;
    cachedMtime = Date.now();

    const catSet = new Set<string>();
    for (let i = 0; i < items.length; i++) {
      const c = items[i]?.cat;
      if (c) catSet.add(c.trim());
    }
    cachedCategories = Array.from(catSet).sort();
  } catch (err) {
    console.error('Error writing catalog.json:', err);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = parseInt(searchParams.get('limit') || '50', 10);
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const category = (searchParams.get('category') || '').trim();

    const allItems = getCachedCatalog();

    // If client requested the entire dataset (e.g. for CSV export)
    if (all) {
      return NextResponse.json({
        success: true,
        data: allItems,
        totalItems: allItems.length,
        categories: cachedCategories,
      });
    }

    // High performance filtering in memory
    let filtered = allItems;

    if (category && category !== 'Semua') {
      const catLower = category.toLowerCase();
      filtered = filtered.filter((p) => p.cat && p.cat.toLowerCase() === catLower);
    }

    if (search) {
      filtered = filtered.filter((p) => {
        return (
          (p.sku && p.sku !== '-' && p.sku.toLowerCase().includes(search)) ||
          (p.name && p.name.toLowerCase().includes(search)) ||
          (p.cat && p.cat.toLowerCase().includes(search))
        );
      });
    }

    const page = Math.max(1, isNaN(pageParam) ? 1 : pageParam);
    const limit = Math.max(1, Math.min(500, isNaN(limitParam) ? 50 : limitParam));
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const actualPage = Math.min(page, totalPages);
    const startIndex = (actualPage - 1) * limit;
    const pagedData = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: pagedData,
      pagination: {
        page: actualPage,
        limit,
        totalItems,
        totalPages,
        totalCatalogItems: allItems.length,
      },
      categories: cachedCategories,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memuat katalog' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items = getCachedCatalog();

    if (body.action === 'clear') {
      writeCatalog([]);
      return NextResponse.json({ success: true, message: 'Katalog berhasil dikosongkan', data: [] });
    }

    if (body.action === 'bulk_replace') {
      const newItems: ProductItem[] = Array.isArray(body.items) ? body.items : [];
      writeCatalog(newItems);
      return NextResponse.json({
        success: true,
        message: `Berhasil mengimpor ${newItems.length} produk`,
        totalItems: newItems.length,
      });
    }

    // Default: Add single product
    const product: ProductItem = body.product || body;
    if (!product.name) {
      return NextResponse.json({ error: 'Nama Produk wajib diisi' }, { status: 400 });
    }

    if (!product.sku) {
      product.sku = '-';
    }
    if (!product.id) {
      product.id = `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }

    items.unshift(product);
    writeCatalog(items);

    return NextResponse.json({ success: true, message: 'Produk berhasil ditambahkan', product });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal menyimpan produk' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const product: ProductItem = body.product || body;
    const targetId = body.id || product.id;
    const targetSku = body.originalSku || product.sku;

    const items = getCachedCatalog();
    let idx = -1;

    if (targetId) {
      idx = items.findIndex((p) => p.id === targetId);
    }
    if (idx === -1 && targetSku && targetSku !== '-') {
      idx = items.findIndex((p) => p.sku && p.sku.toLowerCase() === targetSku.toLowerCase());
    }

    if (idx === -1) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    items[idx] = {
      ...items[idx],
      ...product,
      id: items[idx].id || targetId,
    };

    writeCatalog(items);
    return NextResponse.json({ success: true, message: 'Produk berhasil diperbarui', product: items[idx] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memperbarui produk' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('id');
    const skuParam = searchParams.get('sku');
    const allParam = searchParams.get('all');

    if (allParam === 'true') {
      writeCatalog([]);
      return NextResponse.json({ success: true, message: 'Semua produk katalog berhasil dihapus', data: [] });
    }

    const items = getCachedCatalog();

    if (idParam) {
      const idx = items.findIndex((p) => p.id === idParam);
      if (idx === -1) {
        return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
      }
      items.splice(idx, 1);
      writeCatalog(items);
      return NextResponse.json({ success: true, message: 'Produk berhasil dihapus' });
    }

    if (skuParam) {
      const idx = items.findIndex((p) => p.sku && p.sku.toLowerCase() === skuParam.toLowerCase());
      if (idx === -1) {
        return NextResponse.json({ error: `Produk SKU ${skuParam} tidak ditemukan` }, { status: 404 });
      }
      items.splice(idx, 1);
      writeCatalog(items);
      return NextResponse.json({ success: true, message: `Produk SKU ${skuParam} berhasil dihapus` });
    }

    return NextResponse.json({ error: 'ID atau SKU produk wajib diisi' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal menghapus produk' }, { status: 500 });
  }
}
