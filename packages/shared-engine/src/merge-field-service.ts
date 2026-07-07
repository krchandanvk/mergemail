/**
 * MergeFieldService — Generates the list of available merge fields
 * from CSV headers + current mappings.
 */
import { STANDARD_FIELDS } from './column-mapper';

export interface MergeField {
  key: string;
  label: string;
  csvHeader: string;
  isStandard: boolean;
  isMapped: boolean;
  isEstimated?: boolean;
}

export class MergeFieldService {

  /**
   * Generate MergeField list from CSV headers and resolved mappings.
   * Deduplicated by key; ignored columns excluded.
   */
  static generateFields(headers: string[], mappings: Record<string, string>): MergeField[] {
    const fields: MergeField[] = [];
    const seenKeys = new Set<string>();

    for (const header of headers) {
      const key = mappings[header];
      if (!key || key === 'ignore' || seenKeys.has(key)) continue;
      seenKeys.add(key);

      fields.push({
        key,
        label:      MergeFieldService.keyToLabel(key),
        csvHeader:  header,
        isStandard: STANDARD_FIELDS.includes(key),
        isMapped:   true,
      });
    }

    return fields;
  }

  /**
   * Generate minimal fields for email-only mode (no CSV).
   * Includes {{email}} always; {{name}} only if extractNames is true.
   */
  static forEmailOnly(extractNames: boolean = false): MergeField[] {
    const fields: MergeField[] = [{
      key: 'email', label: 'Email', csvHeader: 'Email',
      isStandard: true, isMapped: true,
    }];
    if (extractNames) {
      fields.push({
        key: 'name', label: 'Name (Estimated)', csvHeader: 'Email',
        isStandard: true, isMapped: true, isEstimated: true,
      });
    }
    return fields;
  }

  /**
   * Extract all {{variable}} names used in a template string.
   * Returns lowercase keys.
   */
  static extractTemplateVars(template: string): string[] {
    const vars = new Set<string>();
    const rx   = /\{\{\s*(\w+)(?:\s*\|.*?)?\}\}/g;
    let m;
    while ((m = rx.exec(template || '')) !== null) {
      vars.add(m[1].toLowerCase());
    }
    return [...vars];
  }

  /**
   * Convert a snake_case / camelCase merge key to a Title Case label.
   */
  static keyToLabel(key: string): string {
    return key
      .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase → spaces
      .replace(/_/g, ' ')                   // underscore → spaces
      .replace(/\b\w/g, c => c.toUpperCase());
  }
}
