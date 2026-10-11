import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json());

// Founder server-side configuration
const DESIGNATED_FOUNDER_EMAIL = process.env['FOUNDER_EMAIL'] || 'alsaid66900@gmail.com';

/**
 * Server-side trusted founder verification & setup endpoint
 */
app.post('/api/founder/verify-setup', (req, res) => {
  const { email, uid } = req.body || {};
  if (!email || !uid) {
    res.status(400).json({ error: 'Missing parameters' });
    return;
  }

  // Secure server-side check against designated founder configuration
  const isFounderMatch = typeof email === 'string' && email.toLowerCase() === DESIGNATED_FOUNDER_EMAIL.toLowerCase();

  res.json({
    isFounder: isFounderMatch,
    role: isFounderMatch ? 'founder' : null,
  });
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 3000;
  app.listen(Number(port), '0.0.0.0', (error?: Error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://0.0.0.0:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
