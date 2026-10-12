const fs = require('fs');
const path = require('path');

const catalogPath = path.resolve('apps/dashboard/data/catalog.json');
const csvPath = 'C:/Users/itpta/Downloads/template_katalog_diskon_ats_filled.csv';

if (!fs.existsSync(catalogPath)) {
  console.error('Catalog JSON not found at', catalogPath);
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Classification function for the 13 'inc' brands specified by the user
function getIncBrand(p, i) {
  const cat = (p.cat || '').trim();
  const catLower = cat.toLowerCase();
  const name = (p.name || '').trim();
  const nameLower = name.toLowerCase();
  const sku = (p.sku || '').trim();
  const skuLower = sku.toLowerCase();

  // 1. Philips (indices 0..286)
  if (i >= 0 && i <= 286) return 'Philips';

  // 2. Legrand (indices 287..4039)
  if (i >= 287 && i <= 4039) return 'Legrand';

  // 3. Matsuyama (indices 4040..4110)
  if (i >= 4040 && i <= 4110) return 'Matsuyama';

  // 4. Panasonic (indices 4111..4338)
  if (i >= 4111 && i <= 4338) return 'Panasonic';

  // 5. Eterna (indices 6522..6658)
  if (i >= 6522 && i <= 6658) return 'Eterna';

  // 6. DV Electrical (indices 7076..7537)
  if (i >= 7076 && i <= 7537) return 'DV';

  // 7. Uticon (indices 7538..7559)
  if (i >= 7538 && i <= 7559) return 'Uticon';

  // 8. Fort (indices 10737..12625)
  if (i >= 10737 && i <= 12625) return 'Fort';

  // Specific keyword check for any stray items belonging to the 13 inc brands
  if (nameLower.includes('puma') || catLower.includes('puma')) return 'Puma';
  if (nameLower.includes('mennekes') || catLower.includes('mennekes')) return 'Mennekes';
  if (nameLower.includes('himel') || catLower.includes('himel')) return 'Himel';
  if (nameLower.includes('supreme') || catLower.includes('supreme')) return 'Supreme';
  if (nameLower.includes('vinsa') || catLower.includes('vinsa')) return 'Vinsa';
  if (catLower.includes('panasonic') || nameLower.includes('panasonic') || skuLower.startsWith('wej') || skuLower.startsWith('bbd') || skuLower.startsWith('bqdt')) return 'Panasonic';
  if (nameLower.includes('uticon') || catLower.includes('multi plugs') || catLower.includes('multi outlet')) return 'Uticon';
  if (nameLower.includes('matsuyama')) return 'Matsuyama';
  if (nameLower.includes('eterna')) return 'Eterna';
  if (catLower.startsWith('fort') || skuLower.startsWith('fort-')) return 'Fort';

  return null;
}

const stats = {};
let totalConverted = 0;
const samples = [];

catalog.forEach((p, i) => {
  const brand = getIncBrand(p, i);
  if (brand) {
    const oldPrice = p.price;
    // Formula chosen by user: harga - 11% (price * 0.89)
    const newPrice = Math.round(oldPrice * 0.89);

    p.price = newPrice;

    // Recalculate priceMax1
    if (p.max1 && p.max1 !== '-' && p.max1 !== '0%') {
      const pct1 = parseFloat(p.max1.replace('%', ''));
      p.priceMax1 = Math.round(newPrice * (1 - pct1 / 100));
    } else {
      p.priceMax1 = newPrice;
    }

    // Recalculate priceMax2
    if (p.max2 && p.max2 !== '-' && p.max2 !== '0%') {
      const pct2 = parseFloat(p.max2.replace('%', ''));
      p.priceMax2 = Math.round(newPrice * (1 - pct2 / 100));
    } else {
      p.priceMax2 = null;
    }

    // Recalculate floor
    const baseForFloor = p.priceMax2 !== null ? p.priceMax2 : p.priceMax1;
    p.floor = Math.round(baseForFloor * (p.coef || 1));

    stats[brand] = (stats[brand] || 0) + 1;
    totalConverted++;

    if (samples.length < 10 && stats[brand] <= 2) {
      samples.push({
        brand,
        sku: p.sku,
        name: p.name,
        oldPrice,
        newPrice,
        priceMax1: p.priceMax1,
        priceMax2: p.priceMax2,
        floor: p.floor,
      });
    }
  }
});

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log('=== CATALOG.JSON UPDATED ===');
console.log('Total products converted to Exclude PPN (-11%):', totalConverted);
console.log('Breakdown by brand:');
console.log(JSON.stringify(stats, null, 2));

console.log('\nSample price changes:');
samples.forEach(s => {
  console.log(`[${s.brand}] ${s.name} (${s.sku}): Rp ${s.oldPrice.toLocaleString('id-ID')} -> Rp ${s.newPrice.toLocaleString('id-ID')} (Floor: Rp ${s.floor.toLocaleString('id-ID')})`);
});

// Update CSV file if present
if (fs.existsSync(csvPath)) {
  console.log('\nUpdating master CSV:', csvPath);
  const csvContent = fs.readFileSync(csvPath, 'utf8');

  function parseCSV(text) {
    const rows = [];
    let row = [''];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i+1];
      if (c === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push('');
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') i++;
        rows.push(row);
        row = [''];
      } else {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || row[0] !== '') rows.push(row);
    return rows;
  }

  const rows = parseCSV(csvContent);
  let csvUpdated = 0;

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 5) continue;
    const catIndex = i - 1; // Corresponding to catalog array index

    // Check if product is in the converted set
    const p = catalog[catIndex];
    if (p && getIncBrand(p, catIndex)) {
      r[4] = p.price.toString();
      csvUpdated++;
    }
  }

  function formatCSV(rows) {
    return rows.map(r => r.map(cell => {
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return '"' + cell.replace(/"/g, '""') + '"';
      }
      return cell;
    }).join(',')).join('\n');
  }

  fs.writeFileSync(csvPath, formatCSV(rows), 'utf8');
  console.log('Successfully updated master CSV:', csvUpdated, 'rows updated with Exclude PPN prices.');
}
