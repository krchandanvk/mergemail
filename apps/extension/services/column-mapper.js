/**
 * ColumnMapper — Maps CSV headers to standard or custom merge field keys.
 *
 * Standard fields: name | email | company | role
 * Custom fields other header → snake_case merge key
 */

/** The four standard merge fields the app understands natively. */
export const STANDARD_FIELDS = ['name', 'email', 'company', 'role'];

/**
 * Ali: standardField → lowercase header strings that auto-map to it.
 * All comparison is done after .toLowerCase().trim().
 */
const FIELD_ALIASES = {
  name: [
    'name', 'full name', 'fullname', 'full_name',
    'candidate name', 'candidatename', 'candidate_name',
    'first name', 'firstname', 'first_name',
    'contact name', 'contactname', 'contact_name',
    'recipient name', 'recipient', 'person name', 'person',
    'customer name', 'customer', 'client name', 'client',
    'display name', 'your name',
  ],
  email: [
    'email', 'email id', 'emailid', 'email_id',
    'email address', 'emailaddress', 'email_address',
    'mail', 'e-mail', 'e mail',
    'mail id', 'mailid', 'mail_id',
    'work email', 'personal email',
  ],
  company: [
    'company', 'company name', 'companyname', 'company_name',
    'current company', 'currentcompany', 'current_company',
    'organization', 'organisation', 'org',
    'employer', 'firm', 'business', 'workplace',
    'current employer', 'current organization',
  ],
  role: [
    'role', 'designation', 'title', 'position',
    'job title', 'jobtitle', 'job_title',
    'job role', 'job_role', 'job position', 'job_position',
    'current role', 'currentrole', 'current_role',
    'current title', 'current_title',
    'current designation', 'role title',
  ],
};

export 

export class ColumnMapper {

  /**
   * Auto-detect standard field mappings from CSV headers.
   * First match wins; each standard field is assigned at most once.
   */
  static autoDetect(headers[]) {
    const mappings = {};
    const usedFields = new Set<string>();
    const unmapped[] = [];

    for (const header of headers) {
      const normalized = header.toLowerCase().trim();
      let matched = false;

      for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
        if (!usedFields.has(field) && aliases.includes(normalized)) {
          mappings[header] = field;
          usedFields.add(field);
          matched = true;
          break;
        }
      }

      if (!matched) {
        // Convert to custom snake_case key
        mappings[header] = ColumnMapper.toMergeKey(header);
        unmapped.push(header);
      }
    }

    return { mappings, unmapped };
  }

  /**
   * Convert a raw CSV header string to a safe merge key.
   *
   * "Years of Experience" → "years_of_experience"
   * "Current Location!"  → "current_location"
   * "Q1 Sales"           → "q1_sales"
   */
  static toMergeKey(header) {
    return header
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')   // strip special chars
      .trim()
      .replace(/\s+/g, '_')          // spaces → underscore
      || 'unknown';
  }

  /**
   * Apply user-provided manual overrides on top of auto-detected mappings.
   */
  static applyOverrides(mappings, overrides) {
    return { ...mappings, ...overrides };
  }

  /**
   * Build a flat merge-data object from one CSV row using the current mappings.
   * Ignored columns are excluded.
   */
  static buildRowData(csvRow, mappings) {
    const result = {};
    for (const [header, key] of Object.entries(mappings)) {
      if (key !== 'ignore') {
        result[key] = csvRow[header] ?? '';
      }
    }
    return result;
  }

  /**
   * Return all unique merge keys from a mappings object (excluding 'ignore').
   */
  static getActiveKeys(mappings)[] {
    return [...new Set(Object.values(mappings).filter(k => k !== 'ignore'))];
  }
}
