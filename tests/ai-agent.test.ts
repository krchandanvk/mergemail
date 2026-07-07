import request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import app from '../src/server';
import { execSync } from 'child_process';

describe('AI Agent Integration Endpoints & Code Generation', () => {

  // Run discovery script to make sure files exist before tests run
  beforeAll(() => {
    console.log('[Test Setup] Running code discovery generation...');
    execSync('npm run ai:discover');
  });

  // ─── Health Checks ──────────────────────────────────────────────────────────

  test('GET /health returns healthy status and 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('components');
  });

  test('GET /ready returns initialized state and 200', async () => {
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.initialized).toBe(true);
  });

  test('GET /metrics returns metrics telemetry and 200', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('emailsProcessed');
    expect(res.body).toHaveProperty('successRate');
    expect(typeof res.body.successRate).toBe('number');
  });

  // ─── Generated Metadata Validations ────────────────────────────────────────

  test('MCP server card matches correct JSON schema structure', async () => {
    const res = await request(app).get('/.well-known/mcp/server-card.json');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('capabilities');
    expect(res.body.capabilities).toHaveProperty('tools', true);
    expect(Array.isArray(res.body.tools)).toBe(true);
    expect(res.body.tools.length).toBeGreaterThan(0);
  });

  test('Agent Skills index matches schema and contains imported skills', async () => {
    const res = await request(app).get('/.well-known/agent-skills/index.json');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('schemaVersion', '1.0.0');
    expect(Array.isArray(res.body.skills)).toBe(true);
    
    // Check specific skill structures
    const skillIds = res.body.skills.map((s: any) => s.id);
    expect(skillIds).toContain('csv_import');
    expect(skillIds).toContain('bulk_email_drafting');
  });

  test('API Catalog contains system endpoints', async () => {
    const res = await request(app).get('/.well-known/api-catalog');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('schemaVersion', '1.0.0');
    expect(Array.isArray(res.body.endpoints)).toBe(true);

    const routes = res.body.endpoints.map((e: any) => e.route);
    expect(routes).toContain('/health');
    expect(routes).toContain('/metrics');
  });

  test('OpenAPI definition is generated and valid', async () => {
    const res = await request(app).get('/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('openapi');
    expect(res.body.info.title).toBe('Universal Mail Merger AI API');
  });
});
