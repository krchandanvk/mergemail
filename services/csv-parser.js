/**
 * CSVParser — Pure CSV parsing service.
 * No DOM, no side effects. Handles quoted fields, CRLF, BOM.
 */
export class CSVParser {

  /**
   * Parse full CSV text → structured data.
   * @param {string} text
   * @returns {{ headers: string[], rows: Record<string, string>[] }}
   */
  static parse(text) {
    // Strip BOM
    text = text.replace(/^\uFEFF/, '');
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 1) return { headers: [], rows: [] };

    const headers = CSVParser._parseRow(lines[0]).map(h => h.trim()).filter(Boolean);
    if (lines.length < 2) return { headers, rows: [] };

    const rows = lines.slice(1)
      .map(line => {
        const cells = CSVParser._parseRow(line);
        /** @type {Record<string, string>} */
        const obj = {};
        headers.forEach((h, i) => { obj[h] = (cells[i] ?? '').trim(); });
        return obj;
      })
      .filter(row => Object.values(row).some(v => v.length > 0));

    return { headers, rows };
  }

  /**
   * Parse a single CSV row, correctly handling:
   *  - Quoted fields containing commas
   *  - Escaped quotes ("")
   *  - Whitespace trimming
   * @param {string} line
   * @returns {string[]}
   */
  static _parseRow(line) {
    const cells = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }   // escaped ""
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cells.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    cells.push(cur.trim());
    return cells;
  }

  /**
   * Extract a human-readable name from an email address.
   *
   * Examples:
   *   john.doe@gmail.com       → "John Doe"
   *   alice_smith123@co.com    → "Alice Smith"
   *   j.randomchars99@x.io    → "J Randomchars"
   *   camelCaseUser@mail.com   → "Camel Case User"
   *
   * @param {string} email
   * @returns {string}  Title-cased name, or '' if extraction fails
   */
  static extractNameFromEmail(email) {
    const local = (email.split('@')[0] || '').trim();
    if (!local) return '';

    // Remove leading/trailing digits
    let cleaned = local.replace(/^\d+|\d+$/g, '');
    // Split on common delimiters
    let parts = cleaned.split(/[._\-+]+/).filter(p => p.length > 0);

    // If only one part, try camelCase split
    if (parts.length === 1) {
      parts = parts[0]
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .split(' ');
    }

    // Filter out pure-number parts and very short parts (<2 chars)
    parts = parts.filter(p => p.length >= 2 && !/^\d+$/.test(p));
    if (parts.length === 0) return '';

    return parts
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Generate a sample CSV string for download.
   * @returns {string}
   */
  static sampleCSV() {
    return [
      'Name,Email,Company,Role',
      'John Doe,john@example.com,Google,Software Engineer',
      'Alice Smith,alice@example.com,Microsoft,Product Manager',
      'Bob Kumar,bob@example.com,Amazon,Data Scientist',
      'Carol Zhang,carol@example.com,Meta,UX Designer',
    ].join('\n');
  }
}
