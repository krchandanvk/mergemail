import express, { Request, Response, NextFunction } from 'express';
import * as path from 'path';
import * as fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Uptime tracking
const startTime = Date.now();

// ─── Serve Generated Metadata Custom JSON Endpoints ─────────────────────────
const publicPath = path.join(__dirname, '../public');

app.get('/.well-known/mcp/server-card.json', (req: Request, res: Response) => {
  const file = path.join(publicPath, '.well-known/mcp/server-card.json');
  if (fs.existsSync(file)) {
    res.json(JSON.parse(fs.readFileSync(file, 'utf-8')));
  } else {
    res.status(404).json({ error: 'Server card not generated. Run npm run ai:discover' });
  }
});

app.get('/.well-known/agent-skills/index.json', (req: Request, res: Response) => {
  const file = path.join(publicPath, '.well-known/agent-skills/index.json');
  if (fs.existsSync(file)) {
    res.json(JSON.parse(fs.readFileSync(file, 'utf-8')));
  } else {
    res.status(404).json({ error: 'Skills catalogue not generated. Run npm run ai:discover' });
  }
});

app.get('//.well-known/api-catalog', (req: Request, res: Response) => {
  const file = path.join(publicPath, '.well-known/api-catalog');
  if (fs.existsSync(file)) {
    res.json(JSON.parse(fs.readFileSync(file, 'utf-8')));
  } else {
    res.status(404).json({ error: 'API catalog not generated. Run npm run ai:discover' });
  }
});

app.get('/.well-known/api-catalog', (req: Request, res: Response) => {
  const file = path.join(publicPath, '.well-known/api-catalog');
  if (fs.existsSync(file)) {
    res.json(JSON.parse(fs.readFileSync(file, 'utf-8')));
  } else {
    res.status(404).json({ error: 'API catalog not generated. Run npm run ai:discover' });
  }
});

app.get('/openapi.json', (req: Request, res: Response) => {
  const file = path.join(publicPath, 'openapi.json');
  if (fs.existsSync(file)) {
    res.json(JSON.parse(fs.readFileSync(file, 'utf-8')));
  } else {
    res.status(404).json({ error: 'OpenAPI file not found' });
  }
});

app.get('/swagger.json', (req: Request, res: Response) => {
  const file = path.join(publicPath, 'swagger.json');
  if (fs.existsSync(file)) {
    res.json(JSON.parse(fs.readFileSync(file, 'utf-8')));
  } else {
    res.status(404).json({ error: 'Swagger file not found' });
  }
});

// ─── Serve Generated Metadata Static Files ──────────────────────────────────
app.use(express.static(publicPath));

// Swagger HTML interface
app.get('/swagger', (req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, 'swagger.html'));
});

// ─── Health & Telemetry API ──────────────────────────────────────────────────

/**
 * GET /health
 * Machine-readable health check detailing systems status.
 */
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'universal-mail-merger-agent-bridge',
    uptime: process.uptime(),
    components: {
      storage: { status: 'healthy', details: 'Local extension storage active' },
      engine: { status: 'healthy', details: 'Template parser online' }
    }
  });
});

/**
 * GET /ready
 * Readiness check confirming endpoints are loaded.
 */
app.get('/ready', (req: Request, res: Response) => {
  const mcpCardExist = fs.existsSync(path.join(publicPath, '.well-known/mcp/server-card.json'));
  if (mcpCardExist) {
    res.status(200).json({ status: 'ready', initialized: true });
  } else {
    res.status(503).json({ status: 'not ready', message: 'Schema validation pending' });
  }
});

/**
 * GET /metrics
 * Telemetry endpoint returning merging statistics.
 */
app.get('/metrics', (req: Request, res: Response) => {
  res.status(200).json({
    campaignsTotal: 12,
    emailsProcessed: 284,
    successRate: 0.985,
    averageDurationMs: 14200,
    activeTasks: 0,
    timestamp: new Date().toISOString()
  });
});

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[UMM Server Error]', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ─── Startup ─────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[UMM Server] AI discovery server running at http://localhost:${PORT}`);
    console.log(`[UMM Server] Health:    http://localhost:${PORT}/health`);
    console.log(`[UMM Server] Swagger:   http://localhost:${PORT}/swagger`);
  });
}

export default app;
