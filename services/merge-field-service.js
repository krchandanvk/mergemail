/**
 * MergeFieldService — Generates the list of available merge fields
 * from CSV headers + current mappings.
 *
 * The output drives:
 *  - Dynamic chip rendering in the Compose tab
 *  - Validation (what fields are "available")
 *  - The summary panel in the CSV tab
 */
import { STANDARD_FIELDS } from './column-mapper.js';

/**
 * @typedef {Object} MergeField
 * @property {string}  key        - merge key used in {{key}} templates
 * @property {string}  label      - human-readable display label
 * @property {string}  csvHeader  - original CSV column header
 * @property {boolean} isStandard - true if name / email / company / role
 * @property {boolean} isMapped   - always true (ignored columns excluded)
 */

export class MergeFieldService {

  /**
   * Generate MergeField list from CSV headers and resolved mappings.
   * Deduplicated by key; ignored columns excluded.
   *
   * @param {string[]}              headers  - ordered CSV headers
   * @param {Record<string,string>} mappings - { csvHeader → mergeKey }
   * @returns {MergeField[]}
   */
  static generateFields(headers, mappings) {
    const fields  = [];
    const seenKeys = new Set();

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
   *
   * @param {boolean} extractNames
   * @returns {MergeField[]}
   */
  static forEmailOnly(extractNames = false) {
    const fields = [{
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
   *
   * @param {string} template
   * @returns {string[]}
   */
  static extractTemplateVars(template) {
    const vars = new Set();
    const rx   = /\{\{(\w+)\}\}/g;
    let m;
    while ((m = rx.exec(template || '')) !== null) {
      vars.add(m[1].toLowerCase());
    }
    return [...vars];
  }

  /**
   * Convert a snake_case / camelCase merge key to a Title Case label.
   *
   * "years_of_experience" → "Years Of Experience"
   * "currentCompany"      → "Current Company"
   *
   * @param {string} key
   * @returns {string}
   */
  static keyToLabel(key) {
    return key
      .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase → spaces
      .replace(/_/g, ' ')                   // underscore → spaces
      .replace(/\b\w/g, c => c.toUpperCase());
  }
}
