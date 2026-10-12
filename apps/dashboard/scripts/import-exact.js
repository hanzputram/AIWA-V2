const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('C:/Users/itpta/Downloads/template_katalog_diskon_ats_filled.csv', 'utf8');

function parseCSV(text) {
  const firstLine = text.split(/\r?\n/).find(l => l.trim().length > 0) || '';
  let delimiter = ',';
  if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';
  else if (firstLine.includes('\t')) delimiter = '\t';

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
    } else if (c === delimiter && !inQuotes) {
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

function parsePct(val) {
  if (!val) return 0;
  const cleaned = val.replace('%', '').replace(',', '.').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

console.log('Parsing CSV...');
const rawRows = parseCSV(content);
console.log('Total raw rows:', rawRows.length);

const products = [];
for (let i = 1; i < rawRows.length; i++) {
  const r = rawRows[i];
  if (!r || r.length === 0) continue;
  
  const rawSku = (r[0] || '').trim();
  const rawName = (r[1] || '').trim();
  if (!rawName) continue;
  
  const cat = (r[2] || '').trim() || 'Umum';
  const unit = (r[3] || '').trim() || 'pcs';
  const priceRaw = (r[4] || '').replace(/[^0-9.-]/g, '').trim();
  const price = parseFloat(priceRaw) || 0;
  
  const rawStd = (r[5] || '').trim();
  const rawMax1 = (r[6] || '').trim();
  const rawMax2 = (r[7] || '').trim();
  const rawCoef = (r[8] || '').trim();
  
  let standard = '-';
  if (rawStd && rawStd !== '-') {
    const pctStd = parsePct(rawStd);
    standard = `${pctStd}%`;
  }
  
  let max1 = '-';
  let priceMax1 = price;
  if (rawMax1 && rawMax1 !== '-') {
    const pct1 = parsePct(rawMax1);
    if (pct1 > 0) {
      max1 = `${pct1}%`;
      priceMax1 = Math.round(price * (1 - pct1 / 100));
    } else {
      max1 = '0%';
      priceMax1 = price;
    }
  }
  
  let max2 = '-';
  let priceMax2 = null;
  if (rawMax2 && rawMax2 !== '-') {
    const pct2 = parsePct(rawMax2);
    if (pct2 > 0) {
      max2 = `${pct2}%`;
      priceMax2 = Math.round(price * (1 - pct2 / 100));
    }
  }
  
  let coef = 1.0;
  if (rawCoef && rawCoef !== '-') {
    const parsedCoef = parseFloat(rawCoef.replace(',', '.'));
    if (!isNaN(parsedCoef) && parsedCoef > 0) {
      coef = parsedCoef;
    }
  }
  
  let floor = priceMax2 !== null ? priceMax2 : priceMax1;
  if (coef !== 1.0) {
    floor = Math.round(floor * coef);
  }
  
  products.push({
    id: `prod_${i}`,
    sku: rawSku || '-',
    name: rawName,
    cat,
    unit,
    price,
    standard,
    max1,
    priceMax1,
    max2,
    priceMax2,
    coef,
    floor
  });
}

const targetPath = path.resolve('data/catalog.json');
console.log('Writing', products.length, 'products to', targetPath);
fs.writeFileSync(targetPath, JSON.stringify(products, null, 2), 'utf8');
console.log('Done writing! File size:', (fs.statSync(targetPath).size / 1024 / 1024).toFixed(2), 'MB');
