import * as fs from 'fs';
import * as path from 'path';
import { MCPServerCard, AgentSkillsIndex, APICatalog } from './types';

// Ensure output directories exist
function ensureDirExists(filePath: string) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

// ─── Scraper Logic ────────────────────────────────────────────────────────────

interface ProviderSelector {
  name: string;
  composeButton: string;
  composeWindow: string;
  toField: string;
  subjectField: string;
  bodyField: string;
  sendButton: string;
}

/** Parses providers and CSS selectors from selectors.js to keep metadata in sync. */
function parseSelectors(): Record<string, ProviderSelector> {
  const selectorsPath = path.join(__dirname, '../selectors.js');
  if (!fs.existsSync(selectorsPath)) return {};

  const content = fs.readFileSync(selectorsPath, 'utf-8');
  const providers: Record<string, ProviderSelector> = {};

  // Simple parser regex matching the keys under MAIL_SELECTORS
  const sectionRx = /(\w+):\s*\{([^}]+)\}/g;
  let match;
  while ((match = sectionRx.exec(content)) !== null) {
    const key = match[1];
    const innerContent = match[2];
    
    const fieldRx = /(\w+):\s*['"]([^'"]+)['"]/g;
    let fieldMatch;
    const fields: any = {};
    while ((fieldMatch = fieldRx.exec(innerContent)) !== null) {
      fields[fieldMatch[1]] = fieldMatch[2];
    }
    
    if (fields.name) {
      providers[key] = {
        name: fields.name,
        composeButton: fields.composeButton || '',
        composeWindow: fields.composeWindow || '',
        toField: fields.toField || '',
        subjectField: fields.subjectField || '',
        bodyField: fields.bodyField || '',
        sendButton: fields.sendButton || '',
      };
    }
  }

  return providers;
}

// ─── Catalog Generators ───────────────────────────────────────────────────────

function generateMCPServerCard(providers: Record<string, ProviderSelector>): MCPServerCard {
  return {
    name: "Universal Mail Merger MCP Server",
    description: "Model Context Protocol adapter exposing mail merger selectors, CSV parsing, and template resolution functionality to AI Agents.",
    organization: "Universal Mail Merger Open Source Team",
    version: "3.0.0",
    homepage: "https://github.com/krchandanvk/mergemail",
    documentation: "https://github.com/krchandanvk/mergemail/blob/main/docs/ai-agent.md",
    support: "https://github.com/krchandanvk/mergemail/issues",
    contact: "support@universalmailmerger.io",
    logo: "https://github.com/krchandanvk/mergemail/raw/main/icons/icon128.png",
    authentication: {
      type: "none",
      description: "Local client-side execution; no external authorization required."
    },
    transports: ["stdio", "sse"],
    protocols: ["mcp-v1.0.0"],
    capabilities: {
      resources: true,
      prompts: true,
      tools: true
    },
    resources: [
      {
        uri: "umm://selectors",
        name: "Selectors configuration",
        description: "List of CSS selectors mapped to each support provider (Gmail, Outlook, Yahoo Mail).",
        mimeType: "application/json"
      },
      {
        uri: "umm://sample-csv",
        name: "Sample CSV template",
        description: "Standard structure for mail merge recipient databases.",
        mimeType: "text/csv"
      }
    ],
    prompts: [
      {
        name: "Compose Email Template",
        description: "Guide the agent to structure a highly personalized email template utilizing custom merge variables.",
        arguments: [
          { name: "recipientName", description: "Name of the target candidate/recipient", required: true },
          { name: "company", description: "Target organization name", required: false }
        ]
      }
    ],
    tools: [
      {
        name: "parse_csv",
        description: "Extract headers and rows from a raw CSV file. Handles quotes, commas, and BOM characters.",
        inputSchema: {
          type: "object",
          properties: {
            csvText: { type: "string", description: "Raw CSV content to parse" }
          },
          required: ["csvText"]
        }
      },
      {
        name: "auto_detect_columns",
        description: "Inspect CSV headers and auto-suggest standard mappings (name, email, company, role).",
        inputSchema: {
          type: "object",
          properties: {
            headers: { type: "array", items: { type: "string" }, description: "List of CSV column headers" }
          },
          required: ["headers"]
        }
      },
      {
        name: "resolve_template",
        description: "Substitute variables inside email templates (subject and body) in a case-insensitive manner.",
        inputSchema: {
          type: "object",
          properties: {
            template: { type: "string", description: "The message body containing {{variables}}" },
            row: { type: "object", description: "Key-value map containing the data fields" }
          },
          required: ["template", "row"]
        }
      },
      {
        name: "validate_merge",
        description: "Verify email list formats and validate that all placeholders used in templates exist in the data source.",
        inputSchema: {
          type: "object",
          properties: {
            rows: { type: "array", items: { type: "object" }, description: "Parsed recipient rows" },
            subject: { type: "string", description: "Email subject line template" },
            body: { type: "string", description: "Email body template" },
            keys: { type: "array", items: { type: "string" }, description: "Keys available in the mapped source" }
          },
          required: ["rows", "subject", "body", "keys"]
        }
      }
    ],
    endpoints: {
      health: "/health",
      readiness: "/ready",
      metrics: "/metrics",
      openapi: "/openapi.json"
    }
  };
}

function generateAgentSkills(): AgentSkillsIndex {
  return {
    schemaVersion: "1.0.0",
    skills: [
      {
        id: "csv_import",
        name: "CSV Import",
        category: "data_parsing",
        description: "Parses arbitrary CSV file uploads, cleans BOM prefixes, processes quotation marks, and handles comma delimiters.",
        permissions: ["localFiles"],
        authentication: "none",
        inputSchema: {
          type: "object",
          properties: {
            csvText: { type: "string", description: "Raw CSV content" }
          },
          required: ["csvText"]
        },
        outputSchema: {
          type: "object",
          properties: {
            headers: { type: "array", items: { type: "string" } },
            rows: { type: "array", items: { type: "object" } }
          }
        },
        examples: [
          {
            input: { csvText: "Name,Email\nAlice,alice@example.com" },
            output: {
              headers: ["Name", "Email"],
              rows: [{ Name: "Alice", Email: "alice@example.com" }]
            }
          }
        ],
        tags: ["csv", "import", "parse"],
        version: "1.0.0"
      },
      {
        id: "bulk_email_drafting",
        name: "Bulk Email Drafting",
        category: "messaging",
        description: "Triggers sequential, personalized draft creation inside webmail interfaces with a randomized/custom sleep delay.",
        permissions: ["activeTab", "scripting"],
        authentication: "activeTabSession",
        inputSchema: {
          type: "object",
          properties: {
            resolvedEmails: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  subject: { type: "string" },
                  body: { type: "string" }
                },
                required: ["email", "subject", "body"]
              }
            },
            autoSend: { type: "boolean", description: "Whether to automatically send drafts immediately" },
            interval: { type: "number", description: "Delay in ms between drafts" }
          },
          required: ["resolvedEmails"]
        },
        outputSchema: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            total: { type: "number" }
          }
        },
        examples: [
          {
            input: {
              resolvedEmails: [{ email: "alice@example.com", subject: "Hi Alice", body: "Hello Alice" }],
              autoSend: false,
              interval: 3000
            },
            output: { success: true, total: 1 }
          }
        ],
        tags: ["email", "draft", "merge", "bulk"],
        version: "3.0.0"
      },
      {
        id: "campaign_analytics",
        name: "Campaign Analytics",
        category: "analytics",
        description: "Summarizes completed and partial merge campaigns, displaying success rates, timings, and error logs.",
        permissions: ["storage"],
        authentication: "none",
        inputSchema: {},
        outputSchema: {
          type: "object",
          properties: {
            campaignsCount: { type: "number" },
            successCount: { type: "number" },
            failedCount: { type: "number" },
            averageDurationMs: { type: "number" }
          }
        },
        examples: [
          {
            input: {},
            output: { campaignsCount: 5, successCount: 154, failedCount: 3, averageDurationMs: 14500 }
          }
        ],
        tags: ["analytics", "metrics", "history"],
        version: "3.0.0"
      }
    ]
  };
}

function generateAPICatalog(): APICatalog {
  return {
    schemaVersion: "1.0.0",
    endpoints: [
      {
        name: "System Health Status",
        method: "GET",
        route: "/health",
        description: "Retrieve current server system, local storage and background state info.",
        authentication: "none",
        requestSchema: {},
        responseSchema: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["healthy", "degraded", "down"] },
            timestamp: { type: "string" },
            details: { type: "object" }
          }
        },
        examples: [
          {
            response: { status: "healthy", timestamp: "2026-07-07T05:00:00Z", details: { storage: "ok" } }
          }
        ],
        version: "3.0.0",
        owner: "core-team",
        tags: ["health", "system"]
      },
      {
        name: "System Metrics",
        method: "GET",
        route: "/metrics",
        description: "Retrieve real-time telemetry metrics for mail merge throughput.",
        authentication: "none",
        requestSchema: {},
        responseSchema: {
          type: "object",
          properties: {
            campaignsTotal: { type: "number" },
            emailsProcessed: { type: "number" },
            successRate: { type: "number" },
            averageLatencyMs: { type: "number" }
          }
        },
        examples: [
          {
            response: { campaignsTotal: 24, emailsProcessed: 540, successRate: 0.992, averageLatencyMs: 15300 }
          }
        ],
        version: "3.0.0",
        owner: "analytics-team",
        tags: ["metrics", "telemetry"]
      }
    ]
  };
}

function generateOpenAPI(providers: Record<string, ProviderSelector>): Record<string, any> {
  return {
    openapi: "3.0.3",
    info: {
      title: "Universal Mail Merger AI API",
      description: "Automated API for local execution tracking, metadata cataloging, and validation tools within UMM.",
      version: "3.0.0"
    },
    paths: {
      "/health": {
        get: {
          summary: "System Health",
          responses: {
            "200": {
              description: "System health structure",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string" },
                      uptime: { type: "number" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/ready": {
        get: {
          summary: "Readiness Probe",
          responses: {
            "200": {
              description: "Ready state"
            }
          }
        }
      },
      "/metrics": {
        get: {
          summary: "Performance Metrics",
          responses: {
            "200": {
              description: "Machine-readable dashboard statistics"
            }
          }
        }
      }
    }
  };
}

function generateSwaggerHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>UMM API Docs - Swagger UI</title>
  <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui.css">
  <style>html { box-sizing: border-box; overflow: -y-scroll; } *, *:before, *:after { box-sizing: inherit; } body { margin: 0; background: #fafafa; }</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: "/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis]
      });
    };
  </script>
</body>
</html>`;
}

// ─── Markdown Generators ──────────────────────────────────────────────────────

function writeDocs(
  mcp: MCPServerCard,
  skills: AgentSkillsIndex,
  catalog: APICatalog,
  providers: Record<string, ProviderSelector>
) {
  // Docs dir
  const docDir = path.join(__dirname, '../docs');

  // docs/ai-agent.md
  fs.writeFileSync(path.join(docDir, 'ai-agent.md'), `
# AI Agent Integration Guide

Welcome to the Universal Mail Merger AI Agent Integration. This workspace is fully discoverable by large language models, AI developers, and MCP client adapters.

## Discoverability Endpoints
Our web/local server exposes three endpoints conforming to standard AI discovery:
- **MCP Server Card**: \`/.well-known/mcp/server-card.json\`
- **Skills Catalogue**: \`/.well-known/agent-skills/index.json\`
- **API Catalogue**: \`/.well-known/api-catalog\`

## Executing Code
For programmatic merge validation, use the local node execution script:
\`\`\`bash
npm run ai:discover
\`\`\`
`.trim());

  // docs/mcp.md
  fs.writeFileSync(path.join(docDir, 'mcp.md'), `
# MCP Server Documentation

UMM exposes an Model Context Protocol (MCP) server structure enabling AI models to directly map data components.

## Supported Webmail Providers
${Object.values(providers).map(p => `- **${p.name}** selectors matching compose elements.`).join('\n')}

## Tools Available
${mcp.tools.map(t => `
### \`${t.name}\`
${t.description}
- **Input Parameters**: \`${JSON.stringify(t.inputSchema.properties)}\`
`).join('\n')}
`.trim());

  // docs/skills.md
  fs.writeFileSync(path.join(docDir, 'skills.md'), `
# Agent Skills Catalogue

Automated capabilities exposed for execution by AI agents:

${skills.skills.map(s => `
## Skill: ${s.name} (${s.id})
Category: \`${s.category}\`
- **Description**: ${s.description}
- **Permissions Required**: \`${s.permissions.join(', ')}\`
- **Tags**: \`${s.tags.join(', ')}\`
`).join('\n')}
`.trim());

  // docs/apis.md
  fs.writeFileSync(path.join(docDir, 'apis.md'), `
# API Catalogue

Machine-readable endpoints discoverable on local and production servers.

${catalog.endpoints.map(e => `
## ${e.name}
Method: \`${e.method}\`  |  Route: \`${e.route}\`
- **Description**: ${e.description}
- **Auth**: \`${e.authentication}\`
`).join('\n')}
`.trim());
}

// ─── Main Execution ───────────────────────────────────────────────────────────

function main() {
  console.log('[AI Discover] Scanning codebase...');
  const providers = parseSelectors();
  console.log(`[AI Discover] Found ${Object.keys(providers).length} mail provider configurations.`);

  const mcpCard      = generateMCPServerCard(providers);
  const skillsIndex  = generateAgentSkills();
  const apiCatalog   = generateAPICatalog();
  const openAPI      = generateOpenAPI(providers);
  const swaggerHTML  = generateSwaggerHTML();

  const publicDir = path.join(__dirname, '../public');

  // Paths
  const mcpPath     = path.join(publicDir, '.well-known/mcp/server-card.json');
  const skillsPath  = path.join(publicDir, '.well-known/agent-skills/index.json');
  const catalogPath = path.join(publicDir, '.well-known/api-catalog');
  const openapiPath = path.join(publicDir, 'openapi.json');
  const swaggerPath = path.join(publicDir, 'swagger.json'); // swagger.json can output UI, let's keep it as swagger.json or serve HTML

  ensureDirExists(mcpPath);
  ensureDirExists(skillsPath);
  ensureDirExists(catalogPath);
  ensureDirExists(openapiPath);
  ensureDirExists(swaggerPath);

  // Write files
  fs.writeFileSync(mcpPath,     JSON.stringify(mcpCard, null, 2));
  fs.writeFileSync(skillsPath,  JSON.stringify(skillsIndex, null, 2));
  fs.writeFileSync(catalogPath, JSON.stringify(apiCatalog, null, 2));
  fs.writeFileSync(openapiPath, JSON.stringify(openAPI, null, 2));
  fs.writeFileSync(swaggerPath, JSON.stringify(openAPI, null, 2)); // OpenAPI format for swagger.json
  
  // Write index.html or swagger wrapper in public folder
  fs.writeFileSync(path.join(publicDir, 'swagger.html'), swaggerHTML);

  // Documentation
  const docDir = path.join(__dirname, '../docs');
  if (!fs.existsSync(docDir)) fs.mkdirSync(docDir);
  writeDocs(mcpCard, skillsIndex, apiCatalog, providers);

  console.log('[AI Discover] Generated all schema files, catalogs and markdown docs successfully.');
}

if (require.main === module) {
  main();
}
