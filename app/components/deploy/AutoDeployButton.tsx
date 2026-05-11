/**
 * AutoDeployButton — one-click deploy using the platform's server-side
 * VERCEL_API_TOKEN.  Only renders when the token is configured.
 *
 * Uses the autoDeployState nanostore so the AutoDeployPanel (shown in
 * the workbench header) stays in sync automatically.
 */

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { autoDeployState } from '~/lib/stores/auto-deploy';
import { useAutoDeploy } from '~/lib/hooks/useAutoDeploy';
import { streamingState } from '~/lib/stores/streaming';

interface AutoDeployButtonProps {
  chatId: string;
}

export function AutoDeployButton({ chatId }: AutoDeployButtonProps) {
  const state = useStore(autoDeployState);
  const isStreaming = useStore(streamingState);
  const { deploy } = useAutoDeploy();
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/auto-deploy-status')
      .then((r) => r.json() as Promise<{ available: boolean }>)
      .then((d) => setIsAvailable(d.available))
      .catch(() => setIsAvailable(false));
  }, []);

  const handleDeploy = useCallback(() => {
    if (chatId && !isStreaming && state.phase !== 'uploading' && state.phase !== 'building') {
      deploy({ chatId });
    }
  }, [chatId, isStreaming, state.phase, deploy]);

  if (!isAvailable) {
    return null;
  }

  const isInProgress = state.phase === 'uploading' || state.phase === 'building';
  const isReady = state.phase === 'ready';
  const isError = state.phase === 'error';
  const disabled = isInProgress || isStreaming;

  const label = isInProgress
    ? state.phase === 'uploading'
      ? 'Uploading…'
      : 'Building…'
    : isReady
      ? 'Redeploy'
      : isError
        ? 'Retry Deploy'
        : 'Deploy';

  return (
    <button
      onClick={handleDeploy}
      disabled={disabled}
      title={isReady && state.url ? `Deployed: ${state.url}` : 'Deploy this project live'}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border
        transition-all select-none
        [&:is(:disabled)]:cursor-not-allowed [&:is(:disabled)]:opacity-60
        ${
          isReady
            ? 'bg-green-500/10 border-green-500/40 text-green-400 hover:bg-green-500/20 hover:border-green-500/60'
            : isError
              ? 'bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20'
              : isInProgress
                ? 'bg-accent-500/10 border-accent-500/30 text-accent-400'
                : 'bg-veyra-elements-background-depth-3 border-veyra-elements-borderColor text-veyra-elements-textPrimary hover:bg-veyra-elements-background-depth-4 hover:text-accent-400 hover:border-accent-500/50'
        }
      `}
    >
      {isInProgress ? (
        <span className="i-svg-spinners:ring-resize text-[11px] shrink-0" />
      ) : isReady ? (
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 animate-pulse" />
      ) : isError ? (
        <span className="i-ph:warning-circle text-[11px] shrink-0" />
      ) : (
        <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 4L10 16L17 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6.5 4L10 10.5L13.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        </svg>
      )}
      {label}
    </button>
  );
}
