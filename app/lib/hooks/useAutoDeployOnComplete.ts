/**
 * useAutoDeployOnComplete — watches the LLM streaming state and
 * automatically triggers a deployment when the stream finishes,
 * IF the platform has a VERCEL_API_TOKEN configured and there are
 * files in the workbench.
 *
 * Auto-deploy is deliberately opt-in: it only fires when
 * `VITE_AUTO_DEPLOY_ON_COMPLETE=true` is set in the environment.
 * This lets operators decide whether every generation should
 * immediately publish.
 */

import { useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { streamingState } from '~/lib/stores/streaming';
import { autoDeployState } from '~/lib/stores/auto-deploy';
import { workbenchStore } from '~/lib/stores/workbench';
import { useAutoDeploy } from '~/lib/hooks/useAutoDeploy';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('useAutoDeployOnComplete');

const AUTO_DEPLOY_ENABLED = import.meta.env.VITE_AUTO_DEPLOY_ON_COMPLETE === 'true';

interface Options {
  chatId: string | null;
}

export function useAutoDeployOnComplete({ chatId }: Options) {
  const isStreaming = useStore(streamingState);
  const prevStreamingRef = useRef(isStreaming);
  const { deploy } = useAutoDeploy();

  useEffect(() => {
    const wasStreaming = prevStreamingRef.current;
    prevStreamingRef.current = isStreaming;

    if (!wasStreaming || isStreaming) {
      return;
    }

    if (!AUTO_DEPLOY_ENABLED) {
      return;
    }

    if (!chatId) {
      return;
    }

    const currentState = autoDeployState.get();

    if (currentState.phase === 'uploading' || currentState.phase === 'building') {
      return;
    }

    const files = workbenchStore.files.get();
    const hasFiles = Object.values(files).some((d) => d?.type === 'file');

    if (!hasFiles) {
      return;
    }

    logger.info(`Stream complete — triggering auto-deploy for chat ${chatId}`);

    deploy({ chatId });
  }, [isStreaming, chatId, deploy]);
}
