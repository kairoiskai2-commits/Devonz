/**
 * useAutoDeploy — React hook that drives the full auto-deployment flow.
 *
 * - Reads files from the workbench store
 * - POST to /api/auto-deploy (server-side token, SSE response)
 * - Pipes SSE events into the autoDeployState nanostore
 * - Persists projectId to localStorage so redeploying reuses the same
 *   Vercel project
 */

import { useCallback, useRef } from 'react';
import { workbenchStore } from '~/lib/stores/workbench';
import { autoDeployState, setAutoDeployPhase, type AutoDeployPhase } from '~/lib/stores/auto-deploy';
import { createScopedLogger } from '~/utils/logger';
import { getCsrfToken } from '~/lib/api/apiUtils';

const logger = createScopedLogger('useAutoDeploy');

const STORAGE_KEY = (chatId: string) => `veyra-auto-deploy-project-${chatId}`;

interface DeployOptions {
  chatId: string;
}

export function useAutoDeploy() {
  const abortRef = useRef<AbortController | null>(null);

  const deploy = useCallback(async ({ chatId }: DeployOptions) => {
    // Cancel any in-progress deployment
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    // Collect all text files from the workbench virtual FS
    const filesMap = workbenchStore.files.get();
    const files: Record<string, string> = {};

    for (const [filePath, dirent] of Object.entries(filesMap)) {
      if (dirent?.type === 'file' && !dirent.isBinary && typeof dirent.content === 'string') {
        files[filePath] = dirent.content;
      }
    }

    if (Object.keys(files).length === 0) {
      logger.warn('No files found in workbench — skipping deploy');
      return;
    }

    // Restore existing Vercel project id so we reuse the same project
    const existingProjectId = localStorage.getItem(STORAGE_KEY(chatId)) ?? undefined;

    setAutoDeployPhase('uploading');

    try {
      const csrfToken = await getCsrfToken();

      const res = await fetch('/api/auto-deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify({ chatId, files, existingProjectId }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `HTTP ${res.status}`);
      }

      // Stream SSE events
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const chunk of lines) {
          const dataLine = chunk.trim();

          if (!dataLine.startsWith('data:')) {
            continue;
          }

          try {
            const event = JSON.parse(dataLine.slice(5).trim()) as {
              phase: AutoDeployPhase;
              url?: string;
              deploymentId?: string;
              projectId?: string;
              projectName?: string;
              errorMessage?: string;
            };

            // Persist projectId so next deploy reuses the same Vercel project
            if (event.projectId) {
              localStorage.setItem(STORAGE_KEY(chatId), event.projectId);
            }

            if (event.phase === 'ready' && event.url) {
              setAutoDeployPhase('ready', {
                url: event.url,
                deploymentId: event.deploymentId,
                projectId: event.projectId,
                projectName: event.projectName,
                deployedAt: new Date().toISOString(),
              });
            } else if (event.phase === 'error') {
              setAutoDeployPhase('error', { errorMessage: event.errorMessage });
            } else {
              setAutoDeployPhase(event.phase as AutoDeployPhase, {
                deploymentId: event.deploymentId,
                projectId: event.projectId,
                projectName: event.projectName,
              });
            }
          } catch {
            logger.warn('Failed to parse SSE event:', dataLine);
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        logger.info('Deployment cancelled by user');
        return;
      }

      const message = err instanceof Error ? err.message : 'Deployment failed';
      logger.error('Deploy error:', message);
      setAutoDeployPhase('error', { errorMessage: message });
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setAutoDeployPhase('idle');
  }, []);

  const reset = useCallback((chatId: string) => {
    abortRef.current?.abort();
    autoDeployState.set({ phase: 'idle' });
    localStorage.removeItem(STORAGE_KEY(chatId));
  }, []);

  return { deploy, cancel, reset };
}
