# MCP Server Documentation

UMM exposes an Model Context Protocol (MCP) server structure enabling AI models to directly map data components.

## Supported Webmail Providers
- **Gmail** selectors matching compose elements.
- **Outlook (Live)** selectors matching compose elements.
- **Outlook (Office 365)** selectors matching compose elements.
- **Yahoo Mail** selectors matching compose elements.

## Tools Available

### `parse_csv`
Extract headers and rows from a raw CSV file. Handles quotes, commas, and BOM characters.
- **Input Parameters**: `{"csvText":{"type":"string","description":"Raw CSV content to parse"}}`


### `auto_detect_columns`
Inspect CSV headers and auto-suggest standard mappings (name, email, company, role).
- **Input Parameters**: `{"headers":{"type":"array","items":{"type":"string"},"description":"List of CSV column headers"}}`


### `resolve_template`
Substitute variables inside email templates (subject and body) in a case-insensitive manner.
- **Input Parameters**: `{"template":{"type":"string","description":"The message body containing {{variables}}"},"row":{"type":"object","description":"Key-value map containing the data fields"}}`


### `validate_merge`
Verify email list formats and validate that all placeholders used in templates exist in the data source.
- **Input Parameters**: `{"rows":{"type":"array","items":{"type":"object"},"description":"Parsed recipient rows"},"subject":{"type":"string","description":"Email subject line template"},"body":{"type":"string","description":"Email body template"},"keys":{"type":"array","items":{"type":"string"},"description":"Keys available in the mapped source"}}`