/**
 * Automaker Backend Server
 *
 * Provides HTTP/WebSocket API for both web and Electron modes.
 * In Electron mode, this server runs locally.
 * In web mode, this server runs on a remote host.
 */

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cookie from 'cookie';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';

import { createEventEmitter, type EventEmitter } from './lib/events.js';
import { initAllowedPaths } from '@automaker/platform';
import { createLogger } from '@automaker/utils';
import { authMiddleware, validateWsConnectionToken, checkRawAuthentication } from './lib/auth.js';
import { requireJsonContentType } from './middleware/require-json-content-type.js';
import { createAuthRoutes } from './routes/auth/index.js';
import { createFsRoutes } from './routes/fs/index.js';
import { createHealthRoutes, createDetailedHandler } from './routes/health/index.js';
import { createAgentRoutes } from './routes/agent/index.js';
import { createSessionsRoutes } from './routes/sessions/index.js';
import { createFeaturesRoutes } from './routes/features/index.js';
import { createAutoModeRoutes } from './routes/auto-mode/index.js';
import { createEnhancePromptRoutes } from './routes/enhance-prompt/index.js';
import { createWorktreeRoutes } from './routes/worktree/index.js';
import { createGitRoutes } from './routes/git/index.js';
import { createSetupRoutes } from './routes/setup/index.js';
import { createSuggestionsRoutes } from './routes/suggestions/index.js';
import { createModelsRoutes } from './routes/models/index.js';
import { createRunningAgentsRoutes } from './routes/running-agents/index.js';
import { createWorkspaceRoutes } from './routes/workspace/index.js';
import { createTemplatesRoutes } from './routes/templates/index.js';
import {
  createTerminalRoutes,
  validateTerminalToken,
  isTerminalEnabled,
  isTerminalPasswordRequired,
} from './routes/terminal/index.js';
import { createSettingsRoutes } from './routes/settings/index.js';
import { AgentService } from './services/agent-service.js';
import { FeatureLoader } from './services/feature-loader.js';
import { AutoModeService } from './services/auto-mode-service.js';
import { getTerminalService } from './services/terminal-service.js';
import { SettingsService } from './services/settings-service.js';
import { createSpecRegenerationRoutes } from './routes/app-spec/index.js';
import { createClaudeRoutes } from './routes/claude/index.js';
import { ClaudeUsageService } from './services/claude-usage-service.js';
import { createGitHubRoutes } from './routes/github/index.js';
import { createContextRoutes } from './routes/context/index.js';
import { createBacklogPlanRoutes } from './routes/backlog-plan/index.js';
import { createBmadRoutes } from './routes/bmad/index.js';
import { createNpmSecurityRoutes } from './routes/npm-security/index.js';
import { cleanupStaleValidations } from './routes/github/routes/validation-common.js';
import { createMCPRoutes } from './routes/mcp/index.js';
import { MCPTestService } from './services/mcp-test-service.js';
import { createPipelineRoutes } from './routes/pipeline/index.js';
import { pipelineService } from './services/pipeline-service.js';

// Load environment variables
dotenv.config({ quiet: true });

const PORT = parseInt(process.env.PORT || '3008', 10);
const DATA_DIR = process.env.DATA_DIR || './data';
const ENABLE_REQUEST_LOGGING = process.env.ENABLE_REQUEST_LOGGING === 'true'; // Default to false (opt-in)

// Logger for WebSocket events - verbose event logging uses debug level
const wsLogger = createLogger('WebSocket');
const terminalLogger = createLogger('TerminalWS');

// Check for required environment variables
const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;

if (!hasAnthropicKey) {
  console.warn(
    '[Server] ⚠️  ANTHROPIC_API_KEY not set - Claude features disabled. Set via env or Settings.'
  );
}

// Initialize security
initAllowedPaths();

// Create Express app
const app = express();

// Middleware
// Custom colored logger showing only endpoint and status code (configurable via ENABLE_REQUEST_LOGGING env var)
if (ENABLE_REQUEST_LOGGING) {
  morgan.token('status-colored', (_req, res) => {
    const status = res.statusCode;
    if (status >= 500) return `\x1b[31m${status}\x1b[0m`; // Red for server errors
    if (status >= 400) return `\x1b[33m${status}\x1b[0m`; // Yellow for client errors
    if (status >= 300) return `\x1b[36m${status}\x1b[0m`; // Cyan for redirects
    return `\x1b[32m${status}\x1b[0m`; // Green for success
  });

  app.use(
    morgan(':method :url :status-colored', {
      // Skip frequently polled endpoints and OPTIONS preflight requests to reduce log spam
      skip: (req) => {
        const url = req.url || '';
        // Skip all OPTIONS preflight requests
        if (req.method === 'OPTIONS') return true;
        // Skip frequently polled endpoints
        if (url.includes('/api/worktree/list')) return true;
        if (url.includes('/api/running-agents')) return true;
        if (url.includes('/api/auth/status')) return true;
        if (url.includes('/api/auth/token')) return true;
        if (url.includes('/api/auth/logout')) return true;
        if (url.includes('/api/auto-mode/status')) return true;
        if (url.includes('/api/features/agent-output')) return true;
        if (url.includes('/api/features/list')) return true;
        if (url.includes('/api/health')) return true;
        if (url.includes('/api/settings/status')) return true;
        if (url.includes('/api/github/validations')) return true;
        if (url.includes('/api/github/check-remote')) return true;
        if (url.includes('/api/pipeline/config')) return true;
        if (url.includes('/api/fs/read')) return true;
        return false;
      },
    })
  );
}
// CORS configuration
// When using credentials (cookies), origin cannot be '*'
// We dynamically allow the requesting origin for local development
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Electron)
      if (!origin) {
        callback(null, true);
        return;
      }

      // If CORS_ORIGIN is set, use it (can be comma-separated list)
      const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim());
      if (allowedOrigins && allowedOrigins.length > 0 && allowedOrigins[0] !== '*') {
        if (allowedOrigins.includes(origin)) {
          callback(null, origin);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
        return;
      }

      // For local development, allow localhost origins
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, origin);
        return;
      }

      // Reject other origins by default for security
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Create shared event emitter for streaming
const events: EventEmitter = createEventEmitter();

// Create services
// Note: settingsService is created first so it can be injected into other services
const settingsService = new SettingsService(DATA_DIR);
const agentService = new AgentService(DATA_DIR, events, settingsService);
const featureLoader = new FeatureLoader();
const autoModeService = new AutoModeService(events, settingsService);
const claudeUsageService = new ClaudeUsageService();
const mcpTestService = new MCPTestService(settingsService);

// Initialize services
(async () => {
  await agentService.initialize();
  console.log('[Server] Agent service initialized');
})();

// Run stale validation cleanup every hour to prevent memory leaks from crashed validations
const VALIDATION_CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
setInterval(() => {
  const cleaned = cleanupStaleValidations();
  if (cleaned > 0) {
    console.log(`[Server] Cleaned up ${cleaned} stale validation entries`);
  }
}, VALIDATION_CLEANUP_INTERVAL_MS);

// Require Content-Type: application/json for all API POST/PUT/PATCH requests
// This helps prevent CSRF and content-type confusion attacks
app.use('/api', requireJsonContentType);

// Mount API routes - health and auth are unauthenticated
app.use('/api/health', createHealthRoutes());
app.use('/api/auth', createAuthRoutes());

// Apply authentication to all other routes
app.use('/api', authMiddleware);

// Protected health endpoint with detailed info
app.get('/api/health/detailed', createDetailedHandler());

app.use('/api/fs', createFsRoutes(events));
app.use('/api/agent', createAgentRoutes(agentService, events));
app.use('/api/sessions', createSessionsRoutes(agentService));
app.use('/api/features', createFeaturesRoutes(featureLoader));
app.use('/api/auto-mode', createAutoModeRoutes(autoModeService));
app.use('/api/enhance-prompt', createEnhancePromptRoutes(settingsService));
app.use('/api/worktree', createWorktreeRoutes());
app.use('/api/git', createGitRoutes());
app.use('/api/setup', createSetupRoutes());
app.use('/api/suggestions', createSuggestionsRoutes(events, settingsService));
app.use('/api/models', createModelsRoutes());
app.use('/api/spec-regeneration', createSpecRegenerationRoutes(events, settingsService));
app.use('/api/running-agents', createRunningAgentsRoutes(autoModeService));
app.use('/api/workspace', createWorkspaceRoutes());
app.use('/api/templates', createTemplatesRoutes());
app.use('/api/terminal', createTerminalRoutes());
app.use('/api/settings', createSettingsRoutes(settingsService));
app.use('/api/claude', createClaudeRoutes(claudeUsageService));
app.use('/api/github', createGitHubRoutes(events, settingsService));
app.use('/api/context', createContextRoutes(settingsService));
app.use('/api/backlog-plan', createBacklogPlanRoutes(events, settingsService));
app.use('/api/bmad', createBmadRoutes(settingsService));
app.use('/api/npm-security', createNpmSecurityRoutes(settingsService));
app.use('/api/mcp', createMCPRoutes(mcpTestService));
app.use('/api/pipeline', createPipelineRoutes(pipelineService));

// Create HTTP server
const server = createServer(app);

// WebSocket servers using noServer mode for proper multi-path support
const wss = new WebSocketServer({ noServer: true });
const terminalWss = new WebSocketServer({ noServer: true });
const terminalService = getTerminalService();

/**
 * Authenticate WebSocket upgrade requests
 * Checks for API key in header/query, session token in header/query, OR valid session cookie
 */
function authenticateWebSocket(request: import('http').IncomingMessage): boolean {
  const url = new URL(request.url || '', `http://${request.headers.host}`);

  // Convert URL search params to query object
  const query: Record<string, string | undefined> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  // Parse cookies from header
  const cookieHeader = request.headers.cookie;
  const cookies = cookieHeader ? cookie.parse(cookieHeader) : {};

  // Use shared authentication logic for standard auth methods
  if (
    checkRawAuthentication(
      request.headers as Record<string, string | string[] | undefined>,
      query,
      cookies
    )
  ) {
    return true;
  }

  // Additionally check for short-lived WebSocket connection token (WebSocket-specific)
  const wsToken = url.searchParams.get('wsToken');
  if (wsToken && validateWsConnectionToken(wsToken)) {
    return true;
  }

  return false;
}

// Handle HTTP upgrade requests manually to route to correct WebSocket server
server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);

  // Authenticate all WebSocket connections
  if (!authenticateWebSocket(request)) {
    wsLogger.warn('Authentication failed, rejecting connection');
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  if (pathname === '/api/events') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else if (pathname === '/api/terminal/ws') {
    terminalWss.handleUpgrade(request, socket, head, (ws) => {
      terminalWss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Events WebSocket connection handler
// Track connection count to reduce log spam during HMR
let wsConnectionCount = 0;
wss.on('connection', (ws: WebSocket) => {
  wsConnectionCount++;
  // Only log first connection or every 10th to reduce spam during HMR
  if (wsConnectionCount === 1 || wsConnectionCount % 10 === 0) {
    wsLogger.info(`Client connected (total: ${wsConnectionCount})`);
  }

  // Subscribe to all events and forward to this client
  const unsubscribe = events.subscribe((type, payload) => {
    if (ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, payload });
      ws.send(message);
    }
  });

  ws.on('close', () => {
    wsConnectionCount--;
    // Only log when no more clients or every 10th disconnect
    if (wsConnectionCount === 0 || wsConnectionCount % 10 === 0) {
      wsLogger.info(`Client disconnected (remaining: ${wsConnectionCount})`);
    }
    unsubscribe();
  });

  ws.on('error', (error) => {
    wsLogger.error('ERROR:', error);
    unsubscribe();
  });
});

// Track WebSocket connections per session
const terminalConnections: Map<string, Set<WebSocket>> = new Map();
// Track last resize dimensions per session to deduplicate resize messages
const lastResizeDimensions: Map<string, { cols: number; rows: number }> = new Map();
// Track last resize timestamp to rate-limit resize operations (prevents resize storm)
const lastResizeTime: Map<string, number> = new Map();
const RESIZE_MIN_INTERVAL_MS = 100; // Minimum 100ms between resize operations

// Clean up resize tracking when sessions actually exit (not just when connections close)
terminalService.onExit((sessionId) => {
  lastResizeDimensions.delete(sessionId);
  lastResizeTime.delete(sessionId);
  terminalConnections.delete(sessionId);
});

// Terminal WebSocket connection handler
terminalWss.on('connection', (ws: WebSocket, req: import('http').IncomingMessage) => {
  // Parse URL to get session ID and token
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const sessionId = url.searchParams.get('sessionId');
  const token = url.searchParams.get('token');

  terminalLogger.debug(`Connection attempt for session: ${sessionId}`);

  // Check if terminal is enabled
  if (!isTerminalEnabled()) {
    terminalLogger.warn('Terminal is disabled');
    ws.close(4003, 'Terminal access is disabled');
    return;
  }

  // Validate token if password is required
  if (isTerminalPasswordRequired() && !validateTerminalToken(token || undefined)) {
    terminalLogger.warn('Invalid or missing token');
    ws.close(4001, 'Authentication required');
    return;
  }

  if (!sessionId) {
    terminalLogger.warn('No session ID provided');
    ws.close(4002, 'Session ID required');
    return;
  }

  // Check if session exists
  const session = terminalService.getSession(sessionId);
  if (!session) {
    terminalLogger.warn(`Session ${sessionId} not found`);
    ws.close(4004, 'Session not found');
    return;
  }

  terminalLogger.debug(`Client connected to session ${sessionId}`);

  // Track this connection
  if (!terminalConnections.has(sessionId)) {
    terminalConnections.set(sessionId, new Set());
  }
  terminalConnections.get(sessionId)!.add(ws);

  // Send initial connection success FIRST
  ws.send(
    JSON.stringify({
      type: 'connected',
      sessionId,
      shell: session.shell,
      cwd: session.cwd,
    })
  );

  // Send scrollback buffer BEFORE subscribing to prevent race condition
  // Also clear pending output buffer to prevent duplicates from throttled flush
  const scrollback = terminalService.getScrollbackAndClearPending(sessionId);
  if (scrollback && scrollback.length > 0) {
    ws.send(
      JSON.stringify({
        type: 'scrollback',
        data: scrollback,
      })
    );
  }

  // NOW subscribe to terminal data (after scrollback is sent)
  const unsubscribeData = terminalService.onData((sid, data) => {
    if (sid === sessionId && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'data', data }));
    }
  });

  // Subscribe to terminal exit
  const unsubscribeExit = terminalService.onExit((sid, exitCode) => {
    if (sid === sessionId && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'exit', exitCode }));
      ws.close(1000, 'Session ended');
    }
  });

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message.toString());

      switch (msg.type) {
        case 'input':
          // Validate input data type and length
          if (typeof msg.data !== 'string') {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid input type' }));
            break;
          }
          // Limit input size to 1MB to prevent memory issues
          if (msg.data.length > 1024 * 1024) {
            ws.send(JSON.stringify({ type: 'error', message: 'Input too large' }));
            break;
          }
          // Write user input to terminal
          terminalService.write(sessionId, msg.data);
          break;

        case 'resize':
          // Validate resize dimensions are positive integers within reasonable bounds
          if (
            typeof msg.cols !== 'number' ||
            typeof msg.rows !== 'number' ||
            !Number.isInteger(msg.cols) ||
            !Number.isInteger(msg.rows) ||
            msg.cols < 1 ||
            msg.cols > 1000 ||
            msg.rows < 1 ||
            msg.rows > 500
          ) {
            break; // Silently ignore invalid resize requests
          }
          // Resize terminal with deduplication and rate limiting
          if (msg.cols && msg.rows) {
            const now = Date.now();
            const lastTime = lastResizeTime.get(sessionId) || 0;
            const lastDimensions = lastResizeDimensions.get(sessionId);

            // Skip if resized too recently (prevents resize storm during splits)
            if (now - lastTime < RESIZE_MIN_INTERVAL_MS) {
              break;
            }

            // Check if dimensions are different from last resize
            if (
              !lastDimensions ||
              lastDimensions.cols !== msg.cols ||
              lastDimensions.rows !== msg.rows
            ) {
              // Only suppress output on subsequent resizes, not the first one
              // The first resize happens on terminal open and we don't want to drop the initial prompt
              const isFirstResize = !lastDimensions;
              terminalService.resize(sessionId, msg.cols, msg.rows, !isFirstResize);
              lastResizeDimensions.set(sessionId, {
                cols: msg.cols,
                rows: msg.rows,
              });
              lastResizeTime.set(sessionId, now);
            }
          }
          break;

        case 'ping':
          // Respond to ping
          ws.send(JSON.stringify({ type: 'pong' }));
          break;

        default:
          terminalLogger.warn(`Unknown message type: ${msg.type}`);
      }
    } catch (error) {
      terminalLogger.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    terminalLogger.debug(`Client disconnected from session ${sessionId}`);
    unsubscribeData();
    unsubscribeExit();

    // Remove from connections tracking
    const connections = terminalConnections.get(sessionId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        terminalConnections.delete(sessionId);
        // DON'T delete lastResizeDimensions/lastResizeTime here!
        // The session still exists, and reconnecting clients need to know
        // this isn't the "first resize" to prevent duplicate prompts.
        // These get cleaned up when the session actually exits.
      }
    }
  });

  ws.on('error', (error) => {
    terminalLogger.error(`Error on session ${sessionId}:`, error);
    unsubscribeData();
    unsubscribeExit();
  });
});

// Start server with error handling for port conflicts
const startServer = (port: number) => {
  server.listen(port, () => {
    const terminalStatus = isTerminalEnabled()
      ? isTerminalPasswordRequired()
        ? 'enabled (password protected)'
        : 'enabled'
      : 'disabled';
    const portStr = port.toString().padEnd(4);
    console.log(`
╔═══════════════════════════════════════════════════════╗
║           Automaker Backend Server                    ║
╠═══════════════════════════════════════════════════════╣
║  HTTP API:    http://localhost:${portStr}                 ║
║  WebSocket:   ws://localhost:${portStr}/api/events        ║
║  Terminal:    ws://localhost:${portStr}/api/terminal/ws   ║
║  Health:      http://localhost:${portStr}/api/health      ║
║  Terminal:    ${terminalStatus.padEnd(37)}║
╚═══════════════════════════════════════════════════════╝
`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`
╔═══════════════════════════════════════════════════════╗
║  ❌ ERROR: Port ${port} is already in use              ║
╠═══════════════════════════════════════════════════════╣
║  Another process is using this port.                  ║
║                                                       ║
║  To fix this, try one of:                             ║
║                                                       ║
║  1. Kill the process using the port:                  ║
║     lsof -ti:${port} | xargs kill -9                   ║
║                                                       ║
║  2. Use a different port:                             ║
║     PORT=${port + 1} npm run dev:server                ║
║                                                       ║
║  3. Use the init.sh script which handles this:        ║
║     ./init.sh                                         ║
╚═══════════════════════════════════════════════════════╝
`);
      process.exit(1);
    } else {
      console.error('[Server] Error starting server:', error);
      process.exit(1);
    }
  });
};

startServer(PORT);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  terminalService.cleanup();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  terminalService.cleanup();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
