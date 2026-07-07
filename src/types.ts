/**
 * Type definitions for Universal Mail Merger AI Discovery interfaces.
 */

// ─── MCP Server Card ─────────────────────────────────────────────────────────

export interface MCPServerCard {
  name: string;
  description: string;
  organization: string;
  version: string;
  homepage: string;
  documentation: string;
  support: string;
  contact: string;
  logo: string;
  authentication: {
    type: string;
    description: string;
  };
  transports: string[];
  protocols: string[];
  capabilities: {
    resources: boolean;
    prompts: boolean;
    tools: boolean;
  };
  resources: Array<{
    uri: string;
    name: string;
    description: string;
    mimeType: string;
  }>;
  prompts: Array<{
    name: string;
    description: string;
    arguments: Array<{
      name: string;
      description: string;
      required: boolean;
    }>;
  }>;
  tools: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, any>;
  }>;
  endpoints: {
    health: string;
    readiness: string;
    metrics: string;
    openapi: string;
  };
}

// ─── Agent Skills ─────────────────────────────────────────────────────────────

export interface AgentSkill {
  id: string;
  name: string;
  category: string;
  description: string;
  permissions: string[];
  authentication: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  examples: Array<{
    input: Record<string, any>;
    output: Record<string, any>;
  }>;
  tags: string[];
  version: string;
}

export interface AgentSkillsIndex {
  schemaVersion: string;
  skills: AgentSkill[];
}

// ─── API Catalog ──────────────────────────────────────────────────────────────

export interface APICatalogEntry {
  name: string;
  method: string;
  route: string;
  description: string;
  authentication: string;
  requestSchema: Record<string, any>;
  responseSchema: Record<string, any>;
  examples: Array<{
    request?: Record<string, any>;
    response: Record<string, any>;
  }>;
  version: string;
  owner: string;
  tags: string[];
}

export interface APICatalog {
  schemaVersion: string;
  endpoints: APICatalogEntry[];
}
