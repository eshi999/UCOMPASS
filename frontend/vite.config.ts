import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import type { IncomingMessage } from 'node:http';

const foundryResponsesEndpoint =
  process.env.VITE_FOUNDRY_RESPONSES_ENDPOINT ??
  'https://sle-campus-companion-resource.services.ai.azure.com/api/projects/sle-campus-companion/agents/ucompass/endpoint/protocols/openai/responses?api-version=v1';

function getAzureAccessToken() {
  return execSync(
    'az account get-access-token --resource https://ai.azure.com --query accessToken -o tsv',
    { encoding: 'utf8' },
  ).trim();
}

async function readJsonBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'ucompass-foundry-dev-proxy',
      configureServer(server) {
        server.middlewares.use('/api/paw', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          try {
            const body = await readJsonBody(req);
            const token = getAzureAccessToken();
            const foundryResponse = await fetch(foundryResponsesEndpoint, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(body),
            });

            const text = await foundryResponse.text();
            res.statusCode = foundryResponse.status;
            res.setHeader('Content-Type', foundryResponse.headers.get('content-type') ?? 'application/json');
            res.end(text);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown proxy error';
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: message }));
          }
        });
      },
    },
  ],
  server: { host: true, port: 5173 },
});
