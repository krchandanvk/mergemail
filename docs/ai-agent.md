# AI Agent Integration Guide

Welcome to the Universal Mail Merger AI Agent Integration. This workspace is fully discoverable by large language models, AI developers, and MCP client adapters.

## Discoverability Endpoints
Our web/local server exposes three endpoints conforming to standard AI discovery:
- **MCP Server Card**: `/.well-known/mcp/server-card.json`
- **Skills Catalogue**: `/.well-known/agent-skills/index.json`
- **API Catalogue**: `/.well-known/api-catalog`

## Executing Code
For programmatic merge validation, use the local node execution script:
```bash
npm run ai:discover
```