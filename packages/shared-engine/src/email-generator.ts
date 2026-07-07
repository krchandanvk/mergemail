/**
 * EmailGenerator — Generates one individually-resolved email object per recipient.
 *
 * This is the final step before handing off to content.js.
 * Each output object is fully self-contained: { email, subject, body }.
 */
import { TemplateRenderer } from './template-renderer';
import { CSVParser }        from './csv-parser';

export interface ResolvedEmail {
  email: string;
  subject: string;
  body: string;
  rowIndex: number;
  data: Record<string, string>;
}

export interface PreviewOneResult {
  subject: string;
  body: string;
  subjectHtml: string;
  bodyHtml: string;
}

export class EmailGenerator {

  /**
   * Generate one resolved email per recipient row.
   *
   * Each recipient receives their own copy of the subject and body
   * with all {{variables}} substituted from their individual data row.
   */
  static generate(rows: Record<string, string>[], subjectTemplate: string, bodyTemplate: string): ResolvedEmail[] {
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
  static fromEmails(emails: string[], extractNames: boolean = true): Record<string, string>[] {
    return emails
      .map(raw => raw.trim())
      .filter(Boolean)
      .map(email => {
        const row: Record<string, string> = { email };
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
  static fromCSV(csvRows: Record<string, string>[], mappings: Record<string, string>): Record<string, string>[] {
    return csvRows.map(row => {
      const data: Record<string, string> = {};
      for (const [header, key] of Object.entries(mappings)) {
        if (key !== 'ignore') data[key] = row[header] ?? '';
      }
      return data;
    });
  }

  /**
   * Return a preview of a single resolved email for display.
   */
  static previewOne(row: Record<string, string>, subjectTemplate: string, bodyTemplate: string): PreviewOneResult {
    return {
      subject:     TemplateRenderer.resolve(subjectTemplate, row),
      body:        TemplateRenderer.resolve(bodyTemplate, row),
      subjectHtml: TemplateRenderer.renderPreview(subjectTemplate, row),
      bodyHtml:    TemplateRenderer.renderPreview(bodyTemplate, row),
    };
  }
}
