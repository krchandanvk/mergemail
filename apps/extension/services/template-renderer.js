/**
 * TemplateRenderer — Resolves {{variable}} placeholders in template strings.
 *
 * Lookup is case-insensitive: {{Name}}, {{name}}, {{NAME}} all resolve
 * against the "name" key in the data object.
 *
 * Unresolved variables (no matching key, or empty value) are left as {{var}}.
 */
export class TemplateRenderer {

  /**
   * Resolve all {{key}} placeholders against a data row.
   */
  static resolve(template, data) {
    const lookup = TemplateRenderer._buildLookup(data);
    return (template || '').replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      const parts = expression.split('|');
      const key = parts[0].trim().toLowerCase();
      const val = lookup[key];
      
      if (val !== undefined && val.trim() !== '') {
        return val;
      }
      
      if (parts.length > 1) {
        const fallbackPart = parts[1].trim();
        const m = fallbackPart.match(/(?:default|fallback)\s*[:=]\s*['"]([^'"]*)['"]/i);
        if (m) {
          return m[1];
        }
      }
      
      return match;
    });
  }

  /**
   * Extract all variable names used in a template.
   * Returns lowercase, deduplicated array.
   */
  static extractVars(template)[] {
    const vars = new Set<string>();
    const rx   = /\{\{\s*(\w+)(?:\s*\|.*?)?\}\}/g;
    let m;
    while ((m = rx.exec(template || '')) !== null) {
      vars.add(m[1].toLowerCase());
    }
    return [...vars];
  }

  /**
   * Render a template for preview display .
   * - Resolved values: wrapped in <span class="var-resolved">
   * - Fallback values: wrapped in <span class="var-resolved fallback">
   * - Unresolved vars:  wrapped in <span class="var-unresolved">
   * - Newlines converted to <br>
   */
  static renderPreview(template, data) {
    const lookup = TemplateRenderer._buildLookup(data);

    return TemplateRenderer._escHtml(template || '')
      .replace(/\n/g, '<br>')
      .replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
        const parts = expression.split('|');
        const key = parts[0].trim().toLowerCase();
        const val = lookup[key];
        
        if (val !== undefined && val.trim() !== '') {
          return `<span class="var-resolved">${TemplateRenderer._escHtml(val)}</span>`;
        }
        
        if (parts.length > 1) {
          const fallbackPart = parts[1].trim();
          const m = fallbackPart.match(/(?:default|fallback)\s*[:=]\s*['"]([^'"]*)['"]/i);
          if (m) {
            return `<span class="var-resolved" style="border-color:var(--amber);color:#fde68a;background:var(--amber-bg)">${TemplateRenderer._escHtml(m[1])}</span>`;
          }
        }
        
        return `<span class="var-unresolved">{{${parts[0].trim()}}}</span>`;
      });
  }

  /**
   * Highlight {{variable}} chips in plain template text (no data — for chip labels).
   */
  static highlightVars(template) {
    return TemplateRenderer._escHtml(template || '')
      .replace(/\{\{\s*(\w+)(?:\s*\|.*?)?\}\}/g,
        '<span class="var-chip">{{$1}}</span>');
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  /**
   * Build lowercase key → value lookup from a data object.
   */
  static _buildLookup(data) {
    const lookup = {};
    for (const [k, v] of Object.entries(data || {})) {
      lookup[k.toLowerCase()] = v;
    }
    return lookup;
  }

  /**
   * HTML-escape a string.
   */
  static _escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
export 
