/**
 * AutoDeployService — provider-abstracted deployment engine.
 *
 * Uses a server-side VERCEL_API_TOKEN so users never need to configure
 * their own credentials.  The interface is designed to be extended with
 * Cloudflare Pages, Netlify, or any other provider without touching
 * call-sites.
 */

import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('AutoDeployService');

export type DeployPhase = 'uploading' | 'building' | 'ready' | 'error';

export interface DeployStatusUpdate {
  phase: DeployPhase;
  url?: string;
  deploymentId?: string;
  projectId?: string;
  projectName?: string;
  errorMessage?: string;
}

export type StatusCallback = (update: DeployStatusUpdate) => void;

export interface DeployResult {
  url: string;
  deploymentId: string;
  projectId: string;
  projectName: string;
}

interface VercelDeployment {
  id: string;
  url?: string;
  readyState?: string;
  name?: string;
}

interface VercelProject {
  id: string;
  name: string;
}

interface VercelApiError {
  error?: { message: string; code?: string };
}

const VERCEL_API = 'https://api.vercel.com';
const POLL_INTERVAL_MS = 4_000;
const MAX_POLL_MS = 180_000;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 52);
}

async function vercelFetch(
  path: string,
  token: string,
  opts: { method?: string; body?: unknown; timeoutMs?: number } = {},
): Promise<Response> {
  const { method = 'GET', body, timeoutMs = 60_000 } = opts;

  return fetch(`${VERCEL_API}${path}`, {
    method,
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'veyra-auto-deploy/1.0',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

/**
 * Ensures a Vercel project exists for the given chatId, creating one if needed.
 * Returns the project id and name.
 */
async function ensureVercelProject(
  token: string,
  chatId: string,
  existingProjectId?: string,
): Promise<{ projectId: string; projectName: string }> {
  if (existingProjectId) {
    const res = await vercelFetch(`/v9/projects/${existingProjectId}`, token);

    if (res.ok) {
      const project = (await res.json()) as VercelProject;
      return { projectId: project.id, projectName: project.name };
    }

    logger.warn(`Project ${existingProjectId} not found — creating a new one`);
  }

  const projectName = slugify(`veyra-${chatId.slice(0, 20)}-${Date.now().toString(36)}`);

  const createRes = await vercelFetch('/v9/projects', token, {
    method: 'POST',
    body: { name: projectName, framework: null },
  });

  if (!createRes.ok) {
    const errData = (await createRes.json().catch(() => ({}))) as VercelApiError;
    throw new Error(errData.error?.message ?? `Failed to create project (${createRes.status})`);
  }

  const project = (await createRes.json()) as VercelProject;
  logger.info(`Created Vercel project: ${project.name} (${project.id})`);

  return { projectId: project.id, projectName: project.name };
}

/**
 * Upload source files and trigger a Vercel build.
 */
async function triggerVercelDeployment(
  token: string,
  projectId: string,
  projectName: string,
  files: Record<string, string>,
): Promise<string> {
  const deploymentFiles = Object.entries(files)
    .filter(([, content]) => typeof content === 'string')
    .map(([filePath, content]) => ({
      file: filePath.startsWith('/') ? filePath.slice(1) : filePath,
      data: content,
    }));

  if (deploymentFiles.length === 0) {
    throw new Error('No files to deploy');
  }

  logger.info(`Uploading ${deploymentFiles.length} files to Vercel project ${projectName}`);

  const deployRes = await vercelFetch('/v13/deployments', token, {
    method: 'POST',
    body: {
      name: projectName,
      project: projectId,
      target: 'production',
      files: deploymentFiles,
    },
    timeoutMs: 120_000,
  });

  if (!deployRes.ok) {
    const errData = (await deployRes.json().catch(() => ({}))) as VercelApiError;
    throw new Error(errData.error?.message ?? `Deployment creation failed (${deployRes.status})`);
  }

  const deployment = (await deployRes.json()) as VercelDeployment;
  logger.info(`Deployment created: ${deployment.id}`);

  return deployment.id;
}

/**
 * Poll until the deployment reaches READY or ERROR.
 */
async function pollUntilReady(
  token: string,
  deploymentId: string,
  signal?: AbortSignal,
): Promise<string> {
  const deadline = Date.now() + MAX_POLL_MS;

  const pause = (ms: number) =>
    new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, ms);

      signal?.addEventListener('abort', () => {
        clearTimeout(t);
        reject(new Error('Deployment cancelled'));
      });
    });

  // Give Vercel a moment to register the deployment
  await pause(2_000);

  while (Date.now() < deadline) {
    if (signal?.aborted) {
      throw new Error('Deployment cancelled');
    }

    try {
      const res = await vercelFetch(`/v13/deployments/${deploymentId}`, token, { timeoutMs: 15_000 });

      if (res.ok) {
        const status = (await res.json()) as VercelDeployment;
        const state = status.readyState ?? '';

        if (state === 'READY') {
          const deployUrl = status.url ? `https://${status.url}` : '';
          logger.info(`Deployment ready: ${deployUrl}`);
          return deployUrl;
        }

        if (state === 'ERROR' || state === 'CANCELED') {
          throw new Error(`Deployment ended with state: ${state}`);
        }

        logger.debug(`Deployment ${deploymentId} state: ${state} — polling…`);
      } else {
        logger.warn(`Status poll returned ${res.status} — retrying…`);
      }
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Deployment')) {
        throw err;
      }

      logger.warn(`Poll error: ${err instanceof Error ? err.message : err} — retrying…`);
    }

    await pause(POLL_INTERVAL_MS);
  }

  throw new Error(`Deployment timed out after ${MAX_POLL_MS / 1_000}s`);
}

/**
 * Full end-to-end Vercel deployment:
 *   1. Ensure project exists
 *   2. Upload files (emit 'uploading')
 *   3. Poll build status (emit 'building')
 *   4. Return live URL (emit 'ready')
 */
export async function deployToVercel(opts: {
  token: string;
  chatId: string;
  files: Record<string, string>;
  existingProjectId?: string;
  onStatus?: StatusCallback;
  signal?: AbortSignal;
}): Promise<DeployResult> {
  const { token, chatId, files, existingProjectId, onStatus, signal } = opts;
  const emit = (update: DeployStatusUpdate) => onStatus?.(update);

  emit({ phase: 'uploading' });

  const { projectId, projectName } = await ensureVercelProject(token, chatId, existingProjectId);

  const deploymentId = await triggerVercelDeployment(token, projectId, projectName, files);

  emit({ phase: 'building', deploymentId, projectId, projectName });

  const url = await pollUntilReady(token, deploymentId, signal);

  emit({ phase: 'ready', url, deploymentId, projectId, projectName });

  return { url, deploymentId, projectId, projectName };
}

/**
 * Factory — returns the deploy function for the requested provider.
 * Extend this to add Cloudflare Pages, Netlify, etc.
 */
export function getDeployProvider(provider: 'vercel') {
  if (provider === 'vercel') {
    return deployToVercel;
  }

  throw new Error(`Unsupported deploy provider: ${provider}`);
}
