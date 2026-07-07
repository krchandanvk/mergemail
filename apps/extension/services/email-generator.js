/**
 * EmailGenerator — Generates one individually-resolved email object per recipient.
 *
 * This is the final step before handing off to content.js.
 * Each output object is fully self-contained: { email, subject, body }.
 */
import { TemplateRenderer } from './template-renderer';
import { CSVParser }        from './csv-parser';

export 

export 

export class EmailGenerator {

  /**
   * Generate one resolved email per recipient row.
   *
   * Each recipient receives their own copy of the subject and body
   * with all {{variables}} substituted from their individual data row.
   */
  static generate(rows[], subjectTemplate, bodyTemplate) {
    return rows.map((row, index) => ({
      email:   (row.email || '').trim(),
      subject: TemplateRenderer.resolve(subjectTemplate, row),
      body:    TemplateRenderer.resolve(bodyTemplate, row),
      rowIndex: index,
      data:    row,                     // kept for debugging / campaign storage
    })).filter(r => r.email.length > 0);
  }

  /**
   * Build recipient data rows from plain email-address list (no CSV).
   *
   * Each row gets:
   *   { email }                         — always
   *   { email, name: "John Doe" }       — if extractNames=true (best-effort)
   */
  static fromEmails(emails[], extractNames = true)[] {
    return emails
      .map(raw => raw.trim())
      .filter(Boolean)
      .map(email => {
        const row = { email };
        if (extractNames) {
          const name = CSVParser.extractNameFromEmail(email);
          if (name) row.name = name;
        }
        return row;
      });
  }

  /**
   * Build recipient data rows from CSV rows + column mappings.
   */
  static fromCSV(csvRows[], mappings)[] {
    return csvRows.map(row => {
      const data = {};
      for (const [header, key] of Object.entries(mappings)) {
        if (key !== 'ignore') data[key] = row[header] ?? '';
      }
      return data;
    });
  }

  /**
   * Return a preview of a single resolved email for display.
   */
  static previewOne(row, subjectTemplate, bodyTemplate) {
    return {
      subject:     TemplateRenderer.resolve(subjectTemplate, row),
      body:        TemplateRenderer.resolve(bodyTemplate, row),
      subjectHtml: TemplateRenderer.renderPreview(subjectTemplate, row),
      bodyHtml:    TemplateRenderer.renderPreview(bodyTemplate, row),
    };
  }
}
