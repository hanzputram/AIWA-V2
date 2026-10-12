const fs = require('fs');
const path = require('path');

const csvPath = 'C:/Users/itpta/Downloads/template_katalog_diskon_ats_filled.csv';
if (!fs.existsSync(csvPath)) {
  console.log('CSV file not found at', csvPath);
  process.exit(0);
}

const content = fs.readFileSync(csvPath, 'utf8');

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

const rows = parseCSV(content);
const contactorPrefixes = ['lc1d', 'lrd', 'lc1e', 'lre', 'ladn', 'ladt', 'lc1f', 'lx9', 'gv', 'le1m35', 'lc1g', 'lc1dwk'];

let updatedRows = 0;
for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r || r.length < 3) continue;
  const sku = (r[0] || '').trim();
  const name = (r[1] || '').trim();
  const cat = (r[2] || '').trim();

  const isSchneider = cat.toLowerCase().includes('schneider') || name.toLowerCase().includes('schneider') || sku.toLowerCase().includes('sch');
  if (!isSchneider) continue;

  const catLower = cat.toLowerCase();
  const nameLower = name.toLowerCase();
  const skuLower = sku.toLowerCase();
  const combined = skuLower + ' ' + nameLower + ' ' + catLower;

  let newCoef = '1.1';
  if (catLower.includes('mcb') || (/\bmcb\b/.test(nameLower) && !combined.includes('box mcb'))) {
    newCoef = '1.13';
  } else if (catLower.includes('mccb') || /\bmccb\b/.test(nameLower)) {
    newCoef = '1.2';
  } else if (catLower.includes('acb') || /\bacb\b/.test(nameLower)) {
    newCoef = '1.3';
  } else if (
    catLower.includes('contactor') ||
    catLower.includes('lc1dwk') ||
    nameLower.includes('kontaktor') ||
    nameLower.includes('contactor') ||
    contactorPrefixes.some(pref => skuLower.startsWith(pref) || nameLower.includes(pref))
  ) {
    newCoef = '1.2';
  } else if (
    catLower.includes('relay') ||
    catLower.includes('power supply') ||
    nameLower.includes('power supply') ||
    nameLower.includes('zelio') ||
    (/\brelay\b/.test(nameLower) && !nameLower.includes('overload'))
  ) {
    newCoef = '1.15';
  } else {
    newCoef = '1.1';
  }

  if (r.length > 8) {
    if (r[8] !== newCoef) {
      r[8] = newCoef;
      updatedRows++;
    }
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
console.log('Successfully updated CSV file:', updatedRows, 'rows updated with new Schneider coefficients.');
