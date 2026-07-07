/**
 * RecipientValidator — Pre-send validation of recipients and templates.
 *
 * Returns a structured result with separate errors (block send) and
 * warnings (allow send with confirmation).
 */
export class RecipientValidator {

  /**
   * Run all validation checks.
   *
   * @param {object[]} recipientRows    - resolved rows ({ email, name, ... })
   * @param {string}   subjectTemplate
   * @param {string}   bodyTemplate
   * @param {string[]} availableKeys    - merge keys available from current source
   * @returns {{ valid: boolean, errors: ValidationMessage[], warnings: ValidationMessage[] }}
   */
  static validate(recipientRows, subjectTemplate, bodyTemplate, availableKeys) {
    const errors   = [];
    const warnings = [];
    const rows     = recipientRows || [];

    // ── 1. Must have at least one recipient ────────────────────────────────────
    if (rows.length === 0) {
      errors.push({
        code:    'NO_RECIPIENTS',
        message: 'No recipients found. Upload a CSV file or enter email addresses.',
      });
      return { valid: false, errors, warnings }; // early exit
    }

    // ── 2. Email format validation ─────────────────────────────────────────────
    const badEmails = rows.filter(r => !RecipientValidator.isValidEmail(r.email || ''));
    if (badEmails.length > 0) {
      errors.push({
        code:    'INVALID_EMAIL',
        message: `${badEmails.length} row(s) have missing or invalid email addresses.`,
        details: badEmails.slice(0, 3).map(r => r.email || '(empty)'),
      });
    }

    // ── 3. Template variable availability ─────────────────────────────────────
    const templateVars = [
      ...RecipientValidator._extractVars(subjectTemplate),
      ...RecipientValidator._extractVars(bodyTemplate),
    ];
    const availableSet = new Set(availableKeys.map(k => k.toLowerCase()));

    for (const v of templateVars) {
      if (!availableSet.has(v.toLowerCase())) {
        errors.push({
          code:    'MISSING_MERGE_FIELD',
          message: `Template uses {{${v}}} but no column is mapped to "${v}".`,
          hint:    `Upload a CSV with a "${v}" column, or remove {{${v}}} from your template.`,
          field:   v,
        });
      }
    }

    // ── 4. Warn about blank field values ──────────────────────────────────────
    if (templateVars.length > 0) {
      const rowsWithBlanks = rows.filter(row =>
        templateVars.some(v => {
          const val = row[v.toLowerCase()];
          return !val || val.trim() === '';
        })
      );
      if (rowsWithBlanks.length > 0) {
        warnings.push({
          code:    'EMPTY_VALUES',
          message: `${rowsWithBlanks.length} recipient(s) have blank values for some merge fields. Those {{placeholders}} will remain unresolved in their emails.`,
        });
      }
    }

    // ── 5. Warn about large recipient counts ──────────────────────────────────
    if (rows.length > 50) {
      warnings.push({
        code:    'LARGE_BATCH',
        message: `You are about to create ${rows.length} draft emails. This may take ${Math.ceil(rows.length * 1.5 / 60)} minute(s).`,
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Simple email format check.
   * @param {string} email
   * @returns {boolean}
   */
  static isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());
  }

  /**
   * Extract all {{variable}} names from a template string.
   * @param {string} template
   * @returns {string[]} - lowercase
   */
  static _extractVars(template) {
    const vars = new Set();
    const rx   = /\{\{(\w+)\}\}/g;
    let m;
    while ((m = rx.exec(template || '')) !== null) vars.add(m[1].toLowerCase());
    return [...vars];
  }
}

/**
 * @typedef {Object} ValidationMessage
 * @property {string}    code     - machine-readable code
 * @property {string}    message  - human-readable message
 * @property {string}   [hint]    - optional fix suggestion
 * @property {string}   [field]   - affected merge field key
 * @property {string[]} [details] - optional extra detail strings
 */
