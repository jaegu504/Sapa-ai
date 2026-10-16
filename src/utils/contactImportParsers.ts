import type { RawPhoneContact } from '../types/crm';
import { normalizePhoneNumber } from './phone';

/**
 * Parses vCard (.vcf) formatted string into array of RawPhoneContact.
 * Supports vCard 2.1, 3.0, and 4.0 specifications.
 */
export function parseVcf(vcfText: string): RawPhoneContact[] {
  if (!vcfText || !vcfText.trim()) return [];

  const contacts: RawPhoneContact[] = [];
  const cards = vcfText.split(/BEGIN:VCARD/i);

  for (const card of cards) {
    if (!card.includes('END:VCARD')) continue;

    const lines = card.split(/\r?\n/);
    let fn = '';
    let nFamily = '';
    let nGiven = '';
    let phone = '';
    let org = '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (/^FN(;.*)?:/i.test(line)) {
        fn = line.replace(/^FN(;.*)?:/i, '').trim();
      } else if (/^N(;.*)?:/i.test(line)) {
        const parts = line.replace(/^N(;.*)?:/i, '').split(';');
        nFamily = parts[0] ? parts[0].trim() : '';
        nGiven = parts[1] ? parts[1].trim() : '';
      } else if (/^TEL(;.*)?:/i.test(line)) {
        if (!phone) {
          phone = line.replace(/^TEL(;.*)?:/i, '').trim();
        }
      } else if (/^ORG(;.*)?:/i.test(line)) {
        org = line.replace(/^ORG(;.*)?:/i, '').replace(/;/g, ' ').trim();
      }
    }

    const name = fn || (nGiven || nFamily ? `${nGiven} ${nFamily}`.trim() : '');
    if (!name || !phone) continue;

    const normalized = normalizePhoneNumber(phone);
    if (!normalized) continue;

    contacts.push({
      name,
      phoneNumber: normalized,
      associations: org ? [org] : [],
    });
  }

  return contacts;
}

/**
 * Splits a CSV line taking into account quoted cells.
 */
function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses CSV formatted string into array of RawPhoneContact.
 * Supports standard CSV, semicolon-delimited CSV, and Google Contacts export CSV.
 */
export function parseCsv(csvText: string): RawPhoneContact[] {
  if (!csvText || !csvText.trim()) return [];

  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  // Detect delimiter
  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes(';') && !firstLine.includes(',')) {
    delimiter = ';';
  } else if (firstLine.includes('\t') && !firstLine.includes(',')) {
    delimiter = '\t';
  }

  const headers = splitCsvLine(firstLine, delimiter).map((h) => h.replace(/^"|"$/g, '').trim().toLowerCase());

  // Locate column indices
  let nameIndex = -1;
  let givenNameIndex = -1;
  let familyNameIndex = -1;
  let phoneIndices: number[] = [];
  let categoryIndex = -1;

  headers.forEach((h, idx) => {
    if (h === 'name' || h === 'nama' || h === 'nama lengkap' || h === 'display name') {
      nameIndex = idx;
    } else if (h === 'given name' || h === 'first name' || h === 'nama depan') {
      givenNameIndex = idx;
    } else if (h === 'family name' || h === 'last name' || h === 'nama belakang') {
      familyNameIndex = idx;
    } else if (
      h.includes('phone') ||
      h.includes('telepon') ||
      h.includes('mobile') ||
      h.includes('nomor') ||
      h === 'hp'
    ) {
      // Exclude type headers like "Phone 1 - Type"
      if (!h.includes('type')) {
        phoneIndices.push(idx);
      }
    } else if (h === 'category' || h === 'label' || h === 'kategori' || h === 'group membership' || h === 'organization' || h === 'organisasi') {
      categoryIndex = idx;
    }
  });

  const contacts: RawPhoneContact[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = splitCsvLine(lines[i], delimiter).map((c) => c.replace(/^"|"$/g, '').trim());
    if (row.length === 0) continue;

    let name = '';
    if (nameIndex >= 0 && row[nameIndex]) {
      name = row[nameIndex];
    } else if (givenNameIndex >= 0 || familyNameIndex >= 0) {
      const given = givenNameIndex >= 0 ? row[givenNameIndex] || '' : '';
      const family = familyNameIndex >= 0 ? row[familyNameIndex] || '' : '';
      name = `${given} ${family}`.trim();
    }

    if (!name) continue;

    // Extract first valid phone number in row
    let phone = '';
    for (const pIdx of phoneIndices) {
      if (row[pIdx] && normalizePhoneNumber(row[pIdx])) {
        phone = row[pIdx];
        break;
      }
    }

    // Fallback: check any cell that looks like a valid phone number
    if (!phone) {
      for (const cell of row) {
        if (cell && cell.replace(/\D/g, '').length >= 7 && normalizePhoneNumber(cell)) {
          phone = cell;
          break;
        }
      }
    }

    if (!phone) continue;

    const normalized = normalizePhoneNumber(phone);
    if (!normalized) continue;

    const category = categoryIndex >= 0 && row[categoryIndex] ? row[categoryIndex] : '';
    // Clean category string (e.g. Google's "* myContacts ::: * star")
    const cleanCategory = category
      ? category.replace(/\* myContacts|\* star|:::/g, '').trim()
      : '';

    contacts.push({
      name,
      phoneNumber: normalized,
      associations: cleanCategory ? [cleanCategory] : [],
    });
  }

  return contacts;
}
